# Iscalify

Static website for Iscalify, deployed by Netlify from the repository root

## Blogs

Article records live in `content/blogs-markets.json`, `content/blogs-growth.json`
and `content/blogs-existing.json`. To rebuild the index and all article pages:

```sh
python3 scripts/build_blogs.py
```

The renderer uses Python's standard library and writes `blogs.html` and
`blogs/*.html`. The generated HTML is committed, so deployment needs no build
dependencies. Navigation and footer markup are shared with
`services/meta-ads.html`; regenerate Blogs after changing that shell.

For a new article, add a unique slug and its content record, provide the image
pair, rebuild, and add the canonical URL to `sitemap.xml`. Clean article routes
are covered by the `/blogs/*` rule in `_redirects`. Keep old URL redirects when
renaming or moving a published article.

## Article artwork

Ten original concept illustrations live in `assets/blog/`, each with a
1280 × 720 WebP cover and a 640 × 360 responsive version. Their generation
prompts are recorded in `assets/blog/artwork-prompts.json`. Alt text describes
the actual artwork; these illustrations are not client project photographs.

## Service markets

`services/service-business-marketing.html` links the five country pages in
`markets/`. Each page describes remote delivery from Mohali, India and its own
market considerations. Keep visible content, canonical metadata, Service
structured data, route rules and the sitemap consistent when editing a market.
