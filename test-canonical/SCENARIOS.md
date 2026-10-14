# Canonical test scenarios — ASO × SemRush head-to-head

Controlled "Visiting Montreal" test site. One isolated canonical defect per page. Slugs name the
defect (self-documenting in audit output); content is Montreal travel copy.

- **ASO compared = production `spacecat-audit-worker` `src/canonical/` (16 checks) only.** The
  Mystique canonical module is the not-yet-live migration; its `conflicting` / `modifier-attribute`
  checks are NOT credited to ASO.
- Scenarios **1–13** are planted via per-page `canonical` **Metadata** (no JS).
- Scenarios **14–19** are structural defects EDS metadata can't express; injected by
  `scripts/canonical-test.js` into the rendered DOM (ASO scrapes rendered DOM; SemRush crawl must
  have JS-rendering ON).

## Before publishing
1. Register the custom domain and front EDS via Cloudflare BYO CDN (see repo root README / plan) so
   the production host serves a permissive `robots.txt` and drops the `noindex` header. **Without
   this the default `*.aem.live` host is crawler-excluded and BOTH tools return nothing.**
2. Replace the `__PROD_HOST__` token (in `scenarios.mjs` / generated drafts) with the real domain.
3. Author the pages in DA (da.live) using the generated `drafts/*.plain.html` as the copy source, or
   upload via the DA admin API. Preview + publish all.
4. Add an EDS **redirects** sheet entry: `/redirect-source` → `/canonical-clean-control` (301) for #11.
5. Confirm `/noindex-target` publishes with `robots: noindex` (helper for #12).
5b. Add a Cloudflare Worker route returning **503** for `/server-error-500` (helper for #13), then
    point #13's canonical at `https://<domain>/server-error-500`. (No DA page for this path.)
6. Ensure every page is linked from the index/nav and present in the sitemap (SemRush discovery).

## Scenario matrix

| # | Slug | Montreal content | Planted defect | Canonical value | Expected ASO-prod | Expected SemRush |
|---|---|---|---|---|---|---|
| 1 | canonical-clean-control | Old Port | correct self-ref | (default self-ref) | clean (control) | clean |
| 2 | canonical-missing | Mount Royal | no canonical | `` (empty) | missing | Invalid (not set) |
| 3 | canonical-cross-domain | Notre-Dame Basilica | different domain | `https://example.com/montreal` | same-domain | Cross-domain |
| 4 | canonical-different-subdomain | Jean-Talon Market | different subdomain | `https://blog.__PROD_HOST__/…` | same-domain | Cross-domain |
| 5 | canonical-wrong-protocol | Biodôme | http on https page | `http://__PROD_HOST__/…` | same-protocol | Cross-domain (protocol) |
| 6 | canonical-uppercase-url | Jazz Festival | uppercase URL | `https://__PROD_HOST__/Canonical-Uppercase-URL` | lowercased | likely miss |
| 7 | canonical-relative-url | Botanical Garden | relative URL | `/canonical-relative-url` | absolute | likely Invalid |
| 8 | canonical-malformed-url | Poutine Guide | malformed | `htp:/montreal` | invalid | Invalid |
| 9 | canonical-not-self-referencing | Winter Activities | → another 200 page | `https://__PROD_HOST__/canonical-clean-control` | self-ref (flagged) | depends |
| 10 | canonical-target-4xx | Underground City | → 404 | `https://__PROD_HOST__/this-target-does-not-exist-404` | 4xx | Broken |
| 11 | canonical-target-redirect | Day Trips | → 301 | `https://__PROD_HOST__/redirect-source` | 3xx redirect | depends |
| 12 | canonical-target-noindex | Nightlife | → 200 noindex | `https://__PROD_HOST__/noindex-target` | **MISS (gap)** | Invalid (conflict) |
| 13 | canonical-target-5xx | Museums | → 5xx | `https://__PROD_HOST__/server-error-500` (Cloudflare Worker returns 503) | 5xx | Broken |
| 14 | canonical-multiple-tags | Neighborhoods | 2 identical tags | injector | multiple | likely Invalid |
| 15 | canonical-conflicting-tags | Food Scene | 2 tags, diff href | injector | multiple (not "conflicting") | Invalid (conflict) |
| 16 | canonical-outside-head | BIXI Cycling | tag in `<body>` | injector | outside-head | depends |
| 17 | canonical-no-href | Festivals Calendar | no href attr | injector | no-href | depends |
| 18 | canonical-empty-href | Hotels & Stays | empty href | injector | empty | depends |
| 19 | canonical-modifier-attribute | Trip Planning | hreflang/media/type | injector | **MISS (no prod check)** | depends |

"Expected" columns are hypotheses to confirm by running both tools; the actual results feed the
comparison table on wiki page 3908578805.
