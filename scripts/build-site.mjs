import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'assets'), { recursive: true });
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });

const replacements = new Map();
for (const name of ['styles.css', 'global.js', 'contact-form.js']) {
  const contents = await readFile(join(root, name));
  const hash = createHash('sha256').update(contents).digest('hex').slice(0, 12);
  const dot = name.lastIndexOf('.');
  const versioned = `/assets/${name.slice(0, dot)}.${hash}${name.slice(dot)}`;
  replacements.set(`/${name}`, versioned);
  await writeFile(join(output, versioned.slice(1)), contents);
  // Retain old asset URLs; every new HTML response references fresh URLs.
  await writeFile(join(output, name), contents);
}

async function copyPages(directory = '') {
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === 'blog' && !directory) {
      await copyPages('blog');
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const relative = join(directory, entry.name);
      let html = await readFile(join(root, relative), 'utf8');
      for (const [original, versioned] of replacements) {
        html = html.replaceAll(`"${original}"`, `"${versioned}"`);
      }
      await mkdir(dirname(join(output, relative)), { recursive: true });
      await writeFile(join(output, relative), html);
    }
  }
}
await copyPages();
for (const name of ['_redirects', 'robots.txt', 'sitemap.xml']) {
  await cp(join(root, name), join(output, name));
}
if (process.env.CONTEXT && process.env.CONTEXT !== 'production') {
  await writeFile(join(output, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n');
}
console.log('Built static site in dist/ with content-hashed CSS and JavaScript.');
