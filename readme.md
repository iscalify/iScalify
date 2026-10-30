# Iscalify website

Static HTML website hosted on Netlify. Production uses the `main` branch.

## Build and verify

Node.js 20+ and Python 3.11+ are sufficient; there are no install-time site dependencies.

```sh
node scripts/build-site.mjs
node --test tests/*.test.cjs
python3 tests/check-site.py
python3 tests/check-site.py --built
```

Netlify runs the JavaScript tests and build command from `netlify.toml`, then publishes `dist/`. The build
creates content-hashed CSS and JavaScript URLs so a previous browser cache cannot
keep new pages on old assets. Legacy asset URLs remain available with revalidation.
Only known clean page URLs are rewritten; legacy `.html` aliases permanently
redirect. Unknown pages must retain a real 404 response.

For a local preview, serve `dist/` using Netlify CLI or a server that honors
`_redirects`. A generic static server can preview the `.html` files but does not
implement production redirects. Netlify preview/branch builds receive a `noindex`
response header. Their canonical tags intentionally point to the production URLs.

Social PNGs are committed, so regenerating them is optional. With Pillow and
DejaVu Sans fonts installed, run `python3 scripts/generate-social-images.py`.
The reading-time convention is 200 words per minute, excluding each article's CTA;
the source checker verifies both article and listing values.

## Release verification

- Use a preview to check the blog index and all three articles at 375px and desktop
  widths, including CTA contrast, keyboard focus, menu controls and image loading.
- Block the shared JavaScript or disable JavaScript: article copy must remain visible.
- Test contact success, rejection, malformed responses, timeout and repeat clicks
  with a mocked provider. These tests never send real email.
- An owner must verify FormSubmit activation and delivery to the real mailbox.
  An HTTP acknowledgment does not prove inbox delivery. Verify Calendly availability
  and the WhatsApp destination separately; do not create test bookings for visitors.
- After production release, check all sitemap URLs, old `.html` aliases, `/results`,
  host redirects, query-string preservation, unknown-page 404s and a warm browser cache.
- Run Schema Markup Validator and Google's Rich Results Test. Submit the sitemap in
  Search Console and inspect Google-selected canonicals and rendered article content.
  Local checks do not establish Google indexing or guarantee rich results.
