/*
 * scenarios.mjs — broken-internal-links (bil) ASO × SemRush head-to-head.
 *
 * One isolated defect per page. Slugs are globally unique, prefixed `bil-`.
 *
 * Defect-planting mechanism per scenario:
 *   - ANCHOR scenarios (2–7, 15, 16): a broken/redirecting <a href> authored statically in
 *     content.mjs `prose` (raw HTML survives the EDS pipeline). The link TARGET is either a
 *     non-existent path (origin 404) or a Cloudflare-worker status fixture (410/403/503/302/301/loop).
 *   - INJECTED scenarios (8, 9, 10, 12, 14, 17): structural tags the EDS pipeline strips
 *     (form / area+map / iframe / script / link[rel=alternate] / a[rel=nofollow]) are injected into
 *     the rendered DOM by scripts/bil-test.js, keyed on pathname. ASO scrapes the rendered DOM so it
 *     sees them; SemRush only does with JS-rendering ON.
 *   - STATIC IMG (11): a broken <img> authored in prose (img survives the pipeline; ASO excludes
 *     assets by design, SemRush has a Broken-Images report).
 *   - METADATA (13): a broken canonical via the Metadata block.
 *   - GRAPH scenarios (18 orphaned, 19 few-inlinks): no on-page defect — controlled by the inbound
 *     link graph. The bil-index hub (helperPages) links to every scored page EXCEPT #18 (→ 0 inbound,
 *     orphaned) and links to #19 exactly once (→ "few inlinks"). ASO has no orphan/inlink-count check,
 *     so these are scored N/A for ASO (out-of-this-opportunity), SemRush-only.
 *
 * ASO production checks live in spacecat-audit-worker/src/internal-links/ (classifyStatusBucket:
 * not_found_404 / gone_410 / forbidden_or_blocked / server_error_5xx / redirect_chain_excessive /
 * soft_404; EXCLUDED_ITEM_TYPES=[canonical,alternate]; static assets excluded by isStaticAsset).
 *
 * Targets served by the Cloudflare worker (already deployed) — see cloudflare-worker/worker.mjs:
 *   /bil-gone-410-target 410 · /bil-forbidden-403-target 403 · /bil-server-5xx-target 503 ·
 *   /bil-temp-302-target 302→/bil-redirect-ok-dest · /bil-broken-redirect-source 301→/bil-redirect-dead-end(404) ·
 *   /bil-redirect-chain-a ↔ /bil-redirect-chain-b (302 loop)
 */
export const HOST_TOKEN = '__PROD_HOST__';

export const scenarios = [
  // ---- 1: clean control (no broken link; 3 working internal links) ----
  {
    n: 1, slug: 'bil-clean-control', title: 'Trip Planning Resources',
    body: 'A correct page whose internal links all resolve — used to measure false positives.',
    category: 'control',
    asoExpected: 'clean (control)', semrushExpected: 'clean',
  },

  // ---- 2–7: target-health anchor links ----
  {
    n: 2, slug: 'bil-anchor-404', title: 'Seasonal Events Guide',
    body: 'Links to a page that was deleted and now returns 404.',
    category: 'Target-health',
    asoExpected: 'not_found_404', semrushExpected: 'Broken (4xx)',
  },
  {
    n: 3, slug: 'bil-soft-404', title: 'Archived Announcements',
    body: 'Links to a page that returns HTTP 200 but whose body says the content no longer exists.',
    category: 'Target-health',
    asoExpected: 'soft_404', semrushExpected: 'MISS (target is 200)',
  },
  {
    n: 4, slug: 'bil-gone-410', title: 'Discontinued Programs', menuLabel: 'Gone (410)',
    body: 'Links to a permanently removed page returning HTTP 410 Gone.',
    category: 'Target-health',
    asoExpected: 'gone_410', semrushExpected: 'Broken (4xx, coarse)',
  },
  {
    n: 5, slug: 'bil-forbidden-403', title: 'Members-Only Resources', menuLabel: 'Forbidden (403)',
    body: 'Links to a page returning HTTP 403 Forbidden.',
    category: 'Target-health',
    asoExpected: 'forbidden_or_blocked', semrushExpected: 'Broken / blocked (coarse)',
  },
  {
    n: 6, slug: 'bil-server-5xx', title: 'Service Status', menuLabel: 'Server error (5xx)',
    body: 'Links to a page returning HTTP 503 (server error bucket).',
    category: 'Target-health',
    asoExpected: 'server_error_5xx', semrushExpected: 'Broken (5xx)',
  },
  {
    n: 7, slug: 'bil-redirect-chain', title: 'Legacy Documentation', menuLabel: 'Redirect loop',
    body: 'Links to a URL that enters an endless 302 redirect loop.',
    category: 'Target-health',
    asoExpected: 'redirect_chain_excessive', semrushExpected: 'Redirect chain / loop',
  },

  // ---- 8–10: link-surface (non-anchor) — injected ----
  {
    n: 8, slug: 'bil-form-action-404', title: 'Newsletter Signup',
    body: 'A <form> whose action points at a non-existent endpoint (injected).',
    inject: true, category: 'Link-surface',
    asoExpected: 'not_found_404 (form action)', semrushExpected: 'MISS (forms not crawled)',
  },
  {
    n: 9, slug: 'bil-imagemap-area-404', title: 'Interactive Campus Map', menuLabel: 'Image-map 404',
    body: 'An image-map <area href> that points at a deleted page (injected).',
    inject: true, category: 'Link-surface',
    asoExpected: 'not_found_404 (area href)', semrushExpected: 'likely MISS',
  },
  {
    n: 10, slug: 'bil-iframe-404', title: 'Embedded Widget',
    body: 'An <iframe src> pointing at a non-existent internal page (injected).',
    inject: true, category: 'Link-surface',
    asoExpected: 'not_found_404 (iframe src)', semrushExpected: 'maybe (iframe)',
  },

  // ---- 11–12: redirect-health ----
  {
    n: 11, slug: 'bil-temp-redirect-302', title: 'Promotions', menuLabel: 'Temp redirect (302)',
    body: 'Links via a 302 temporary redirect to a working page.',
    category: 'Redirect-health',
    asoExpected: 'not broken (resolves 200)', semrushExpected: 'Internal temporary redirect (302)',
  },
  {
    n: 12, slug: 'bil-broken-redirect', title: 'Old Campaign Landing',
    body: 'Links via a 301 redirect whose destination 404s (broken redirect).',
    category: 'Redirect-health',
    asoExpected: 'not_found_404 (after following 301)', semrushExpected: 'Broken redirect',
  },

  // ---- 13: nofollow — Tier 1 link-attribute (internal-link health; ASO net-new easy win) ----
  {
    n: 13, slug: 'bil-nofollow-internal', title: 'Sponsored Notice', menuLabel: 'Nofollow link',
    body: 'An internal <a rel="nofollow"> to a working page (injected).',
    inject: true, category: 'Link-attribute (nofollow)',
    asoExpected: 'MISS (no check today)', semrushExpected: 'Internal nofollow link',
  },

  // ---- 14–15: link-graph / internal-linking structure (Tier 2 — SemRush net-new) ----
  {
    n: 14, slug: 'bil-orphaned-page', title: 'Forgotten Landing Page',
    body: 'A valid published page in the sitemap with ZERO inbound internal follow links.',
    category: 'Link-graph',
    asoExpected: 'N/A (not this opportunity)', semrushExpected: 'Orphaned page',
  },
  {
    n: 15, slug: 'bil-few-inlinks', title: 'Lightly Linked Page', menuLabel: 'Few inbound links',
    body: 'A valid page with exactly one inbound internal link (from the hub only).',
    category: 'Link-graph',
    asoExpected: 'N/A (not this opportunity)', semrushExpected: 'Page with few internal incoming links',
  },
];

// NOTE: the former Tier-3 scenarios (broken-image, broken-cssjs, broken-canonical, broken-hreflang)
// were removed — they are a different opportunity for both tools (assets / canonical / hreflang) and
// their live pages were deleted. The bil-test.js injector still carries harmless dead cases for them.

// Helper / fixture pages (not scored). The bil-index hub controls the inbound-link graph for the
// orphaned (#18, 0 inbound) and few-inlinks (#19, exactly 1 inbound) scenarios.
export const helperPages = [
  {
    slug: 'bil-soft-404-target', title: 'Page No Longer Available',
    body: 'Sorry, this content no longer exists and could not be found. The page you requested has been removed and is not available. Error 404: not found.',
  },
  {
    slug: 'bil-redirect-ok-dest', title: 'Current Promotions (helper)',
    body: 'Working 200 destination reached via the 302 temporary redirect in scenario 15.',
  },
  {
    slug: 'bil-nofollow-dest', title: 'Sponsor Details (helper)',
    body: 'Working 200 destination of the internal nofollow link in scenario 17.',
  },
  {
    // Hub: links to every scored page EXCEPT #18 (bil-orphaned-page) so #18 has 0 inbound links,
    // and links to #19 (bil-few-inlinks) exactly once. Also links the helper 200 dests so they are
    // not falsely reported orphaned. Body is raw HTML → anchors render as authored.
    slug: 'bil-index', title: 'Site Index (helper hub)',
    body: [
      'Index of test pages: ',
      '<a href="/bil-clean-control">1</a> ',
      '<a href="/bil-anchor-404">2</a> ',
      '<a href="/bil-soft-404">3</a> ',
      '<a href="/bil-gone-410">4</a> ',
      '<a href="/bil-forbidden-403">5</a> ',
      '<a href="/bil-server-5xx">6</a> ',
      '<a href="/bil-redirect-chain">7</a> ',
      '<a href="/bil-form-action-404">8</a> ',
      '<a href="/bil-imagemap-area-404">9</a> ',
      '<a href="/bil-iframe-404">10</a> ',
      '<a href="/bil-broken-image">11</a> ',
      '<a href="/bil-broken-cssjs">12</a> ',
      '<a href="/bil-broken-canonical">13</a> ',
      '<a href="/bil-broken-hreflang">14</a> ',
      '<a href="/bil-temp-redirect-302">15</a> ',
      '<a href="/bil-broken-redirect">16</a> ',
      '<a href="/bil-nofollow-internal">17</a> ',
      '<a href="/bil-few-inlinks">19</a> ',
      '<a href="/bil-soft-404-target">h1</a> ',
      '<a href="/bil-redirect-ok-dest">h2</a> ',
      '<a href="/bil-nofollow-dest">h3</a>',
    ].join(''),
  },
];
