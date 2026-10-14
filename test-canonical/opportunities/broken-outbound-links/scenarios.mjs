/*
 * scenarios.mjs — broken-outbound-links (bol) ASO × SemRush head-to-head.
 *
 * "Broken outbound content" = this site's own pages linking OUT to EXTERNAL URLs that are dead.
 * Because the target must be on a different domain, we cannot reuse the same-domain Cloudflare
 * worker (that's an INTERNAL link). Instead each anchor points at a REAL external URL that is
 * genuinely broken right now, chosen so the target domain is content-rich enough for the
 * replacement-URL search (`site:<target-domain> <keywords>`) to find a real alternative.
 *
 * Defect mechanism: a broken external <a href> authored as raw HTML in `body` (survives the EDS
 * pipeline, renders in the DOM; SemRush crawls it with JS-rendering ON). No injection needed.
 *
 * Planted external targets — VERIFIED status on 2026-08-18 (curl):
 *   https://spring.io/guides/gs/rest-service-old/                                  → 404
 *   https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler/isProtocolHandlerRegistered → 404
 *   https://www.okta.com/nonexistent-page-xyz/                                     → 404
 *   https://stackoverflow.com/questions/00000000/does-not-exist                    → 403 (review-gate case)
 *   https://example.com/                                                           → 200 (control)
 *
 * ASO note: broken-outbound is a NET-NEW opportunity (spacecat-audit-worker has internal-links +
 * backlinks, NOT outbound), so ASO production scores N/A here — the mystique broken-outbound-links
 * blackboard opportunity is the ASO answer. SemRush detects via the "Broken Outbound Content" report.
 */
export const HOST_TOKEN = '__PROD_HOST__';

export const navLabel = 'Broken Outbound Links';
export const slugPrefix = 'bol';

export const scenarios = [
  // ---- 1: clean control (a working external link; measures false positives) ----
  {
    n: 1, slug: 'bol-control', title: 'Recommended Reading', menuLabel: 'Clean control',
    body: '<p>For a solid primer on the topic, see the <a href="https://example.com/">reference documentation</a>. This outbound link resolves normally (HTTP 200) and must not be flagged.</p>',
    category: 'control',
    asoExpected: 'N/A (net-new opp)', semrushExpected: 'clean',
  },

  // ---- 2–4: external 404 (plain broken outbound) ----
  {
    n: 2, slug: 'bol-404-spring', title: 'Building REST APIs in Java', menuLabel: 'External 404 (Spring)',
    body: '<p>To build a RESTful web service in Java, follow the <a href="https://spring.io/guides/gs/rest-service-old/">Spring "Building a RESTful Web Service" guide</a>, which walks through creating a Spring Boot REST controller that returns JSON over HTTP.</p>',
    category: 'Target-health',
    asoExpected: 'N/A (net-new opp)', semrushExpected: 'Broken Outbound Content (404)',
  },
  {
    n: 3, slug: 'bol-404-mdn', title: 'Custom Protocol Handlers on the Web', menuLabel: 'External 404 (MDN)',
    body: '<p>Web applications can register custom URL schemes with the browser. See the MDN reference on <a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler/isProtocolHandlerRegistered">isProtocolHandlerRegistered() and registerProtocolHandler()</a> for the Navigator API details.</p>',
    category: 'Target-health',
    asoExpected: 'N/A (net-new opp)', semrushExpected: 'Broken Outbound Content (404)',
  },
  {
    n: 4, slug: 'bol-404-okta', title: 'Identity Management Basics', menuLabel: 'External 404 (Okta)',
    body: '<p>For an overview of workforce identity, single sign-on, and access management, read <a href="https://www.okta.com/nonexistent-page-xyz/">Okta\'s identity management overview</a>.</p>',
    category: 'Target-health',
    asoExpected: 'N/A (net-new opp)', semrushExpected: 'Broken Outbound Content (404)',
  },

  // ---- 5: external 403 — ambiguous, the review-gate case (like the auth0-community example) ----
  {
    n: 5, slug: 'bol-403-stackoverflow', title: 'Community Discussion', menuLabel: 'External 403 (review-gate)',
    body: '<p>Developers discuss this pattern in a <a href="https://stackoverflow.com/questions/00000000/does-not-exist">Stack Overflow thread</a> with several detailed answers.</p>',
    category: 'Target-health (ambiguous / needs review)',
    asoExpected: 'N/A (net-new opp)', semrushExpected: 'Broken Outbound Content (403 — possible bot-block)',
  },

  // ---- 6: multiple broken outbound links on one page (reuses the Spring + MDN 404 targets) ----
  //         → each of those targets now has 2 affected pages, exercising group-by-target.
  {
    n: 6, slug: 'bol-multi', title: 'Developer Resources', menuLabel: 'Multiple broken (grouping)',
    body: '<p>Handy references for building and documenting APIs: the <a href="https://spring.io/guides/gs/rest-service-old/">Spring REST service guide</a> and the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler/isProtocolHandlerRegistered">MDN protocol-handler reference</a>. Both outbound links are dead, and both targets are also linked from other pages — so detection should group them by target URL.</p>',
    category: 'Multi-target (grouping)',
    asoExpected: 'N/A (net-new opp)', semrushExpected: '2× Broken Outbound Content (404, 404)',
  },
];

// No helper/fixture pages: outbound targets are external, not hosted on this site.
export const helperPages = [];
