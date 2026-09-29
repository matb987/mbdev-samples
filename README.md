# MBDEV portfolio samples

Three concept websites plus a hub page. Static HTML/CSS/JS only: no build step, no dependencies, no third-party requests.

| Path | Sample | Segment |
|---|---|---|
| `/` | Hub page linking all three | — |
| `/trades/` | Oakline Plumbing & Heating | Local small business |
| `/shop/` | Kiln & Co. ceramics shop | E-commerce |
| `/saas/` | Tallyflow | Startup / professional services |

All brands, people, reviews, prices and figures are fictional, and every page is labelled as concept work.
Phone numbers are from Ofcom's range reserved for drama; emails use `example.com`.
Fonts (Inter, Barlow Condensed, Fraunces, DM Sans, Plus Jakarta Sans) are self-hosted under the SIL Open Font License.
Product/illustration art is original SVG.

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
