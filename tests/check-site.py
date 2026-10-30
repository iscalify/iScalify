"""Check source or built HTML without installing Python packages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import sys, json, re, math, struct, hashlib
import xml.etree.ElementTree as ET
from datetime import date

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'dist' if '--built' in sys.argv else ROOT
ORIGIN = 'https://iscalify.com'
failures = []

def check(condition, message):
    if not condition: failures.append(message)

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.refs, self.ids, self.jsonld = {}, {}, [], set(), []
        self.title, self.h1, self.current, self.script = '', 0, None, None
        self.article_depth, self.cta_depth, self.article_text = 0, 0, []
        self.feed(text)

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == 'meta': self.meta[attrs.get('name') or attrs.get('property')] = attrs.get('content')
        if tag == 'link': self.links[attrs.get('rel')] = attrs.get('href')
        if tag == 'h1': self.h1 += 1
        if tag == 'title': self.current = 'title'
        if attrs.get('id'): self.ids.add(attrs['id'])
        for attr in ['href', 'src']:
            if attrs.get(attr): self.refs.append(attrs[attr])
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.script = ''
        if tag == 'div':
            classes = attrs.get('class', '').split()
            if self.article_depth: self.article_depth += 1
            elif 'article-body' in classes: self.article_depth = 1
            if self.article_depth and 'article-cta' in classes: self.cta_depth = self.article_depth

    def handle_endtag(self, tag):
        if tag == 'title': self.current = None
        if tag == 'script' and self.script is not None:
            self.jsonld.append(json.loads(self.script)); self.script = None
        if tag == 'div' and self.article_depth:
            if self.cta_depth == self.article_depth: self.cta_depth = 0
            self.article_depth -= 1

    def handle_data(self, data):
        if self.current == 'title': self.title += data
        if self.script is not None: self.script += data
        if self.article_depth and not self.cta_depth: self.article_text.append(data)

rules = []
for line in (SITE / '_redirects').read_text().splitlines():
    if line.strip() and not line.lstrip().startswith('#'):
        source, target, status = line.split()
        rules.append((source, target, int(status.rstrip('!')), status.endswith('!')))

def resolve(route):
    for source, target, status, forced in rules:
        if source == route: return target, status
    return ('/index.html' if route == '/' else route), 200

files = sorted(SITE.glob('*.html')) + sorted((SITE / 'blog').glob('*.html'))
pages = {p: Page(p.read_text()) for p in files}
canonicals, titles, descriptions = set(), set(), set()
for path, page in pages.items():
    name = path.relative_to(SITE).as_posix()
    canonical = page.links.get('canonical')
    expected = ORIGIN + ('/' if name == 'index.html' else '/' + name[:-5])
    check(canonical == expected, f'{name}: incorrect canonical {canonical}')
    check(page.h1 == 1, f'{name}: expected one H1')
    check(page.title and page.title not in titles, f'{name}: missing or duplicate title')
    description = page.meta.get('description')
    check(description and description not in descriptions, f'{name}: missing or duplicate description')
    titles.add(page.title); descriptions.add(description); canonicals.add(canonical)
    check(page.meta.get('og:url') == canonical, f'{name}: Open Graph URL differs from canonical')
    check(page.meta.get('robots') == 'index, follow', f'{name}: unexpected indexing directive')
    check(page.meta.get('twitter:card') == 'summary_large_image', f'{name}: missing large image card')
    check(bool(page.jsonld), f'{name}: missing structured data')
    check('MarketingAgency' not in json.dumps(page.jsonld), f'{name}: unsupported MarketingAgency type')
    for key in ['og:image', 'twitter:image']:
        image_url = page.meta.get(key, '')
        check(image_url.startswith(ORIGIN + '/assets/'), f'{name}: invalid {key}')
        image = SITE / urlsplit(image_url).path.lstrip('/')
        check(image.is_file(), f'{name}: missing {key} image')
        if image.is_file():
            data = image.read_bytes()
            check(data[:8] == b'\x89PNG\r\n\x1a\n', f'{name}: image is not a PNG')
            check(struct.unpack('>II', data[16:24]) == (1200, 630), f'{name}: wrong card dimensions')
    for reference in page.refs:
        url = urlsplit(urljoin(expected, reference))
        if url.netloc != 'iscalify.com': continue
        route = unquote(url.path)
        target, status = resolve(route)
        check(status == 200, f'{name}: internal reference uses redirect alias {reference}')
        destination = SITE / target.lstrip('/')
        check(destination.is_file(), f'{name}: broken internal reference {reference}')
        if url.fragment and destination in pages:
            check(url.fragment in pages[destination].ids, f'{name}: missing fragment {reference}')
        if '--built' in sys.argv and route.endswith(('.css', '.js')):
            check(bool(re.fullmatch(r'/assets/[a-z-]+\.[a-f0-9]{12}\.(css|js)', route)), f'{name}: unversioned built asset {reference}')
            if destination.is_file():
                check(hashlib.sha256(destination.read_bytes()).hexdigest()[:12] in route, f'{name}: asset hash mismatch')
    if name.startswith('blog/'):
        post = next((x for x in page.jsonld if x.get('@type') == 'BlogPosting'), {})
        check(bool(post.get('image')), f'{name}: article schema missing image')
        check(post.get('image', [None])[0] == page.meta.get('og:image'), f'{name}: inconsistent article image')
        check(date.fromisoformat(post['datePublished']) <= date.fromisoformat(post['dateModified']), f'{name}: inconsistent dates')
        minutes = max(1, math.ceil(len(re.findall(r'\b\w+\b', ''.join(page.article_text))) / 200))
        text = path.read_text()
        match = re.search(r'class="article-meta">[^<]*?(\d+) min read', text)
        check(match and int(match.group(1)) == minutes, f'{name}: incorrect article reading time')
        card = re.search(r'blog-card-meta">(\d+) min read[^<]*</div>\s*<a href="/blog/' + path.stem + '"', (SITE / 'blog.html').read_text())
        check(card and int(card.group(1)) == minutes, f'{name}: listing reading time differs')

ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap = ET.parse(SITE / 'sitemap.xml')
locations = {el.text for el in sitemap.findall('.//s:loc', ns)}
check(locations == canonicals, 'Sitemap does not exactly match canonical pages')
check(f'Sitemap: {ORIGIN}/sitemap.xml' in (SITE / 'robots.txt').read_text(), 'robots.txt sitemap is missing')
for alias, target, status, forced in rules:
    if status == 301 and alias.startswith('/'):
        check(forced, f'Alias redirect must override an existing file: {alias}')
        destination, next_status = resolve(target)
        check(next_status == 200 and (SITE / destination.lstrip('/')).is_file(), f'Redirect loop or missing destination: {alias}')
for route in ['/blog/not-a-real-post', '/not-a-real-page']:
    destination, _ = resolve(route)
    check(not (SITE / destination.lstrip('/')).is_file(), f'Unknown URL resolves to content: {route}')

if failures:
    print('\n'.join('FAIL: ' + message for message in failures))
    raise SystemExit(1)
print(f'PASS: {len(pages)} pages; canonical URLs, sitemap, metadata, images, internal links, redirects, article dates and reading times' + ('; fingerprinted build assets.' if '--built' in sys.argv else '.'))
