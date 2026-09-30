# MBDEV portfolio samples

16 concept websites, one web-app demo (QuoteKit) and a hub page. Static HTML/CSS/JS only: no build step, no dependencies, no third-party requests.

| Path | Sample | Segment | Pages | Similar package |
|---|---|---|---|---|
| `/` | Hub page with filters | — | 1 | — |
| `/salon/` | Lune Hair & Beauty | Local | 1 | Starter £295 |
| `/cafe/` | Crumb & Kettle bakery | Local | 1 | Starter £295 |
| `/electrician/` | Brightwire Electrical | Local | 1 | Launch Page £95 |
| `/cleaning/` | Sparrow Home Cleaning | Local | 1 | Launch Page £95 |
| `/gym/` | Forge Strength Club | Local | 1 | Starter £295 |
| `/photographer/` | Isla Fern Photography | Local | 1 | Starter £295 |
| `/trades/` | Oakline Plumbing & Heating | Local | 1 | Starter £295 |
| `/physio/` | Meadows Physio | Professional | 4 | Small Business £695 |
| `/accountant/` | Clearbook Accountants | Professional | 1 | Starter £295 |
| `/solicitor/` | Harlow Pryce Solicitors | Professional | 4 | Small Business £695 |
| `/estate-agent/` | Quayside Homes | Professional | 4 | Small Business £695 |
| `/courier/` | Relay Couriers | Professional (B2B) | 4 | Small Business £695 |
| `/boutique/` | Fold & Fern homeware | E-commerce | 3 | Shopify Store Setup £895 |
| `/shop/` | Kiln & Co. ceramics | E-commerce | 1 | Shopify Store Setup £895 |
| `/app/` | Murmur AI app | Startup | 1 | Launch Page £95 |
| `/saas/` | Tallyflow | Startup | 1 | Starter £295 |
| `/quotekit/` | QuoteKit instant-quote widget (web app, beta concept) | Product demo | 1 + widget | — |

All brands, people, reviews, prices and figures are fictional, and every page is labelled as concept work.
Phone numbers are from Ofcom's range reserved for drama; emails use `example.com`.
Fonts are self-hosted under the SIL Open Font License. All artwork (products, houses, landscapes, illustrations) is original SVG.
`screenshots/` holds a desktop (1440×900) and mobile (390×844 @2x) screenshot of each sample; `screenshots/thumbs/` holds the hub thumbnails.

## Deploy (free) — pick one

**GitHub Pages**
1. Create a public repo, e.g. `mbdev-samples`, on the MBDEV GitHub account.
2. `git remote add origin https://github.com/<account>/mbdev-samples.git && git push -u origin main`
3. Repo → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Live at `https://<account>.github.io/mbdev-samples/` (1–2 minutes).

**Netlify Drop**
1. Log in to a free Netlify account, go to https://app.netlify.com/drop
2. Drag the unzipped `mbdev-samples` folder onto the page.
3. Site settings → change the site name, e.g. `mbdev-samples` → `https://mbdev-samples.netlify.app`.

Sub-pages will be at `<base>/trades/`, `<base>/shop/`, `<base>/saas/`.

## QuoteKit (beta concept)

`quotekit/widget.js` is the embeddable widget: `<script src=".../quotekit/widget.js" data-quotekit="sparrow" async></script>`.
It renders inside a shadow root (host CSS can't break it), inherits the host font, and reads price rules from `quotekit/configs/<id>.json`.
`quotekit/index.html` is the dashboard: lead list with statuses, alert-email preview, CSV export, live price-rule editor with preview, and embed code.
Demo only: rules edited in the dashboard and all quote requests are stored in the visitor's own `localStorage`. There is no server, nothing is sent, and no data is collected.
A real version would swap `store` in `widget.js` for API calls (e.g. a free-tier Cloudflare Worker + D1) and send the alert email.
