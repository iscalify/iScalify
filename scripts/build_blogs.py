#!/usr/bin/env python3
"""Render the static Blogs section from reviewed article records.

Run with Python 3 from any directory. No third-party packages are required.
The committed HTML is ready for the site's existing static Netlify deployment.
"""

from datetime import date
from html import escape, unescape
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://iscalify.com"
VERSION = "20261126-content5"
ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M7 7h10v10" /></svg>'
ARTICLE_FILES = ("blogs-markets.json", "blogs-growth.json", "blogs-existing.json")
FEATURED = "google-ads-vs-meta-ads-service-businesses"
LANGUAGES = {"United States": "en-US", "United Kingdom": "en-GB", "Canada": "en-CA", "Australia": "en-AU", "India": "en-IN"}


class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def text_only(value):
    parser = TextOnly()
    parser.feed(value)
    return " ".join(" ".join(parser.parts).split())


def e(value):
    return escape(str(value), quote=True)


def no_terminal_stop(value):
    return value.rstrip().rstrip(".").rstrip()


def human_date(value):
    parsed = date.fromisoformat(value)
    return f"{parsed.day} {parsed.strftime('%B %Y')}"


def read_minutes(article):
    words = text_only(article["body_html"] + " " + " ".join(item["answer"] for item in article["faq"])).split()
    return max(1, math.ceil(len(words) / 200))


def image_html(article, *, hero=False, sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"):
    image = article["image"]
    small = image.removesuffix(".webp") + "-640.webp"
    loading = 'loading="eager" fetchpriority="high"' if hero else 'loading="lazy"'
    return f'<img src="{e(image)}" srcset="{e(small)} 640w, {e(image)} 1280w" sizes="{e(sizes)}" width="1280" height="720" alt="{e(article["image_alt"])}" {loading} decoding="async" />'


def structured(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def shared_shell():
    source = (ROOT / "services/meta-ads.html").read_text()
    navbar = re.search(r'<nav class="navbar".*?</nav>', source, re.S).group()
    navbar = navbar.replace('href="/services" class="nav-link active"', 'href="/services" class="nav-link"')
    navbar = navbar.replace('href="/blogs" class="nav-link"', 'href="/blogs" class="nav-link active" aria-current="page"')
    mobile = re.search(r'<nav class="mobile-menu".*?</nav>', source, re.S).group()
    mobile = mobile.replace('href="/blogs" class="mobile-link"', 'href="/blogs" class="mobile-link" aria-current="page"')
    footer = re.search(r'<footer>.*?</footer>', source, re.S).group()
    return navbar + "\n" + mobile, footer


def page(title, description, path, body, schema, *, article=None, index=False):
    navbar, footer = shared_shell()
    canonical = BASE + path
    cover = article or ARTICLES_BY_SLUG[FEATURED]
    language = LANGUAGES.get(cover["markets"][0], "en") if article else "en"
    article_meta = ""
    if article:
        article_meta = f'\n  <meta property="article:published_time" content="{e(article["published"])}" />\n  <meta property="article:modified_time" content="{e(article["modified"])}" />'
    index_script = f'\n  <script src="/blogs.js?v={VERSION}" defer></script>' if index else ""
    return f'''<!DOCTYPE html>
<html lang="{language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{e(title)}</title>
  <meta name="description" content="{e(description)}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#08080e" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="canonical" href="{e(canonical)}" />
  <meta property="og:type" content="{"article" if article else "website"}" />
  <meta property="og:site_name" content="Iscalify" />
  <meta property="og:url" content="{e(canonical)}" />
  <meta property="og:title" content="{e(title)}" />
  <meta property="og:description" content="{e(description)}" />
  <meta property="og:image" content="{e(BASE + cover["image"])}" />
  <meta property="og:image:alt" content="{e(cover["image_alt"])}" />
  <meta property="og:image:width" content="1280" />
  <meta property="og:image:height" content="720" />{article_meta}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{e(title)}" />
  <meta name="twitter:description" content="{e(description)}" />
  <meta name="twitter:image" content="{e(BASE + cover["image"])}" />
  <meta name="twitter:image:alt" content="{e(cover["image_alt"])}" />
  <link rel="stylesheet" href="/styles.css?v={VERSION}" />
  <link rel="stylesheet" href="/blogs.css?v={VERSION}" />
  <script type="application/ld+json">{structured(schema)}</script>
</head>
<body class="journal">
  <a class="sd-skip-link journal-skip" href="#main-content">Skip to content</a>
  {navbar}
  <main id="main-content" tabindex="-1">
{body}
  </main>
  {footer}
  <a href="https://wa.me/message/5R6USAIPGQ3ZG1" class="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with Iscalify on WhatsApp"><span aria-hidden="true">💬</span></a>
  <script src="/global.js?v={VERSION}" defer></script>{index_script}
</body>
</html>
'''


def card(article, *, filterable=False):
    url = "/blogs/" + article["slug"]
    market = "All markets" if article["markets"] == ["International"] else " · ".join(article["markets"])
    filtering = ' data-article-card' if filterable else ""
    return f'''<article class="journal-card"{filtering}>
        <a class="journal-card-media" href="{url}" aria-label="Read {e(article["title"])}">{image_html(article)}</a>
        <div class="journal-card-content">
          <div class="journal-card-category">{e(article["category"])} · {e(market)}</div>
          <h3><a href="{url}">{e(article["title"])}</a></h3>
          <p>{e(no_terminal_stop(article["summary"]))}</p>
          <div class="journal-card-meta"><time datetime="{article["modified"]}">{human_date(article["modified"])}</time> · {read_minutes(article)} min read</div>
          <a class="journal-button" href="{url}" aria-label="Read guide: {e(article["title"])}">Read guide {ARROW}</a>
        </div>
      </article>'''


def render_index():
    featured = ARTICLES_BY_SLUG[FEATURED]
    cards = "\n".join(card(article, filterable=True) for article in ARTICLES)
    body = f'''    <header class="journal-hero">
      <div class="container">
        <p class="journal-overline">Ideas for your next stage of growth</p>
        <div class="journal-hero-row">
          <h1 class="journal-title">Blogs</h1>
          <p class="journal-deck">Practical guides to paid advertising, local visibility and better enquiries for service businesses in the US, UK, Canada, Australia and India</p>
        </div>
      </div>
    </header>
    <section class="journal-section" aria-labelledby="featured-heading">
      <div class="container">
        <div class="journal-feature">
          <a class="journal-feature-media" href="/blogs/{FEATURED}" aria-label="Read {e(featured["title"])}">{image_html(featured, hero=True, sizes="(max-width: 800px) 100vw, 55vw")}</a>
          <div class="journal-feature-content">
            <div class="journal-card-category">Featured guide · Channel strategy</div>
            <h2 id="featured-heading">{e(featured["title"])}</h2>
            <p>{e(no_terminal_stop(featured["summary"]))}</p>
            <a class="journal-button" href="/blogs/{FEATURED}">Read the guide {ARROW}</a>
          </div>
        </div>
      </div>
    </section>
    <section class="journal-section" aria-labelledby="guides-heading">
      <div class="container">
        <div class="journal-toolbar"><h2 class="journal-section-title" id="guides-heading">Find your<br><span>next useful read</span></h2><p class="journal-count" id="journal-result-count" role="status" aria-live="polite" aria-atomic="true">{len(ARTICLES)} guides</p></div>
        <div class="journal-controls" id="journal-controls" hidden>
          <div class="journal-search"><label for="journal-search">Search the guides</label><input type="search" id="journal-search" placeholder="Try Google Ads or lead quality" autocomplete="off" aria-controls="journal-grid" /></div>
        </div>
        <div class="journal-grid" id="journal-grid">{cards}</div>
        <p class="journal-empty" id="journal-empty" hidden>No guides match that search — try another phrase or clear your search</p>
      </div>
    </section>
    <section class="journal-section" aria-labelledby="work-together-heading">
      <div class="container"><div class="journal-contact">
        <div><h2 class="journal-section-title" id="work-together-heading">Turn a useful idea<br><span>into a clear plan</span></h2><p>Tell us about your service, market and current enquiries so we can discuss the next practical step</p></div>
        <div class="journal-actions"><a href="/contact" class="journal-button">Book a strategy call {ARROW}</a><a href="/services/service-business-marketing" class="journal-button journal-button-secondary">Explore service business marketing</a></div>
      </div></div>
    </section>'''
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": ["CollectionPage", "Blog"], "@id": BASE + "/blogs#webpage", "url": BASE + "/blogs", "name": "Iscalify Blogs", "description": "Practical guides to service business marketing, advertising and lead quality", "inLanguage": "en", "isPartOf": {"@id": BASE + "/#website"}, "publisher": {"@id": BASE + "/#organization"}, "mainEntity": {"@id": BASE + "/blogs#guides"}},
        {"@type": "ItemList", "@id": BASE + "/blogs#guides", "numberOfItems": len(ARTICLES), "itemListElement": [{"@type": "ListItem", "position": number, "name": article["title"], "url": BASE + "/blogs/" + article["slug"]} for number, article in enumerate(ARTICLES, 1)]},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"}, {"@type": "ListItem", "position": 2, "name": "Blogs", "item": BASE + "/blogs"}]}
    ]}
    return page("Blogs on Service Business Marketing | Iscalify", "Explore Iscalify guides to Google Ads, Meta Ads, local SEO, landing pages and lead quality for service businesses in the US, UK, Canada, Australia and India.", "/blogs", body, schema, index=True)


def prepare_body(body):
    headings = []
    identifiers = {"main-content", "key-takeaways", "frequently-asked-questions", "related-services", "sources", "article-cta", "related-heading", "toc-heading"}

    def heading(match):
        level, attributes, content = match.groups()
        label = text_only(content)
        existing = re.search(r'\bid=["\']([^"\']+)["\']', attributes)
        identifier = existing.group(1) if existing else re.sub(r"[^a-z0-9]+", "-", unescape(label).lower()).strip("-")
        base = identifier
        number = 2
        while identifier in identifiers:
            identifier = f"{base}-{number}"
            number += 1
        identifiers.add(identifier)
        if level == "2":
            headings.append((identifier, label))
        return f'<h{level} id="{e(identifier)}" tabindex="-1">{content}</h{level}>'

    body = re.sub(r"<h([23])([^>]*)>(.*?)</h\1>", heading, body, flags=re.S)
    body = re.sub(r"(<table(?:\s[^>]*)?>.*?</table>)", r'<div class="journal-table-wrap" role="region" aria-label="Scrollable comparison table" tabindex="0">\1</div>', body, flags=re.S)
    return body, headings


def render_article(article):
    url = BASE + "/blogs/" + article["slug"]
    article_body, headings = prepare_body(article["body_html"])
    takeaways = "".join(f"<li>{e(no_terminal_stop(item))}</li>" for item in article["key_takeaways"])
    toc = "".join(f'<li><a href="#{e(identifier)}" data-native-anchor>{e(label)}</a></li>' for identifier, label in headings)
    toc += '<li><a href="#frequently-asked-questions" data-native-anchor>Frequently asked questions</a></li>'
    faqs = "\n".join(f'<details><summary>{e(item["question"])}</summary><p>{e(item["answer"])}</p></details>' for item in article["faq"])
    sources = "\n".join(f'<li><a href="{e(item["url"])}">{e(item["label"])}</a></li>' for item in article["sources"])
    services = "\n".join(f'<li><a href="{e(item["href"])}">{e(item["label"])}</a></li>' for item in article["service_links"])
    related = "\n".join(card(ARTICLES_BY_SLUG[slug]) for slug in article["related_slugs"] if slug != article["slug"])
    body = f'''    <article>
      <header class="journal-hero">
        <div class="container">
          <nav class="journal-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/blogs">Blogs</a></li><li aria-current="page">{e(article["category"])}</li></ol></nav>
          <p class="journal-overline">{e(article["category"])} · {e("All markets" if article["markets"] == ["International"] else " · ".join(article["markets"]))}</p>
          <h1 class="journal-article-title">{e(article["title"])}</h1>
          <div class="journal-article-meta"><span>By the <a href="/about" rel="author">Iscalify team</a></span><span>Updated <time datetime="{article["modified"]}">{human_date(article["modified"])}</time></span><span>{read_minutes(article)} min read</span></div>
          <p class="journal-article-deck">{e(no_terminal_stop(article["summary"]))}</p>
          <figure class="journal-cover">{image_html(article, hero=True, sizes="(max-width: 1440px) 100vw, 1280px")}<figcaption>Concept illustration for this guide</figcaption></figure>
        </div>
      </header>
      <section class="journal-section" aria-label="Article content">
        <div class="container journal-article-layout">
          <aside class="journal-sidebar">
            <nav class="journal-toc" aria-labelledby="toc-heading"><h2 id="toc-heading">In this guide</h2><ol>{toc}</ol></nav>
            <div class="journal-sidebar-cta"><h2>Make the next move clearer</h2><p>Discuss your service, market and current marketing setup</p><a class="journal-button" href="/contact">Talk to Iscalify {ARROW}</a></div>
          </aside>
          <div class="journal-prose">
            <section class="journal-takeaways" aria-labelledby="key-takeaways"><h2 id="key-takeaways">Key takeaways</h2><ul>{takeaways}</ul></section>
            {article_body}
            <h2 id="frequently-asked-questions" tabindex="-1">Frequently asked questions</h2>
            <div class="journal-faq">{faqs}</div>
            <h2 id="related-services">Explore support for your business</h2>
            <ul>{services}</ul>
            <h2 id="sources">Sources and further reading</h2>
            <ul class="journal-sources">{sources}</ul>
            <p class="journal-editorial-note">Examples and planning frameworks are illustrative. Use your own customer and cost data when making decisions, and check the linked platform documentation as features change.</p>
            <section class="journal-article-cta" aria-labelledby="article-cta"><h2 id="article-cta">Plan your next practical step</h2><p>Share your website, services and target market with the Iscalify team</p><div class="journal-actions"><a href="/contact" class="journal-button">Book a strategy call {ARROW}</a><a href="/blogs" class="journal-button journal-button-secondary">Browse all Blogs</a></div></section>
          </div>
        </div>
      </section>
    </article>
    <section class="journal-section journal-related" aria-labelledby="related-heading"><div class="container"><h2 class="journal-section-title" id="related-heading">Keep <span>exploring</span></h2><div class="journal-grid">{related}</div></div></section>'''
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": url + "#article", "url": url, "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "headline": article["title"], "description": article["description"], "image": {"@type": "ImageObject", "url": BASE + article["image"], "width": 1280, "height": 720}, "datePublished": article["published"], "dateModified": article["modified"], "author": {"@type": "Organization", "@id": BASE + "/#organization", "name": "Iscalify", "url": BASE + "/about"}, "publisher": {"@id": BASE + "/#organization", "@type": "Organization", "name": "Iscalify", "url": BASE + "/"}, "isPartOf": {"@id": BASE + "/blogs#webpage"}, "articleSection": article["category"], "inLanguage": LANGUAGES.get(article["markets"][0], "en")},
        {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"}, {"@type": "ListItem", "position": 2, "name": "Blogs", "item": BASE + "/blogs"}, {"@type": "ListItem", "position": 3, "name": article["title"], "item": url}]}
    ]}
    return page(article["title"] + " | Iscalify", article["description"], "/blogs/" + article["slug"], body, schema, article=article)


def load_articles():
    articles = []
    for filename in ARTICLE_FILES:
        articles.extend(json.loads((ROOT / "content" / filename).read_text())["articles"])
    identifiers = [article["slug"] for article in articles]
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("Article slugs must be unique")
    for article in articles:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", article["slug"]):
            raise ValueError(f"Invalid slug: {article['slug']}")
        for related in article["related_slugs"]:
            if related not in identifiers:
                raise ValueError(f"Missing related article: {related}")
        for image in (article["image"], article["image"].removesuffix(".webp") + "-640.webp"):
            if not (ROOT / image.lstrip("/")).is_file():
                raise FileNotFoundError(image)
        date.fromisoformat(article["published"])
        date.fromisoformat(article["modified"])
    return articles


if __name__ == "__main__":
    ARTICLES = load_articles()
    ARTICLES_BY_SLUG = {article["slug"]: article for article in ARTICLES}
    (ROOT / "blogs").mkdir(exist_ok=True)
    (ROOT / "blogs.html").write_text(render_index())
    for article in ARTICLES:
        (ROOT / "blogs" / (article["slug"] + ".html")).write_text(render_article(article))
    print(f"Rendered Blogs index and {len(ARTICLES)} articles")
