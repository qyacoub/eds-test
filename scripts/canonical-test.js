/*
 * canonical-test.js — TEST ONLY
 *
 * Plants STRUCTURAL canonical defects that the EDS metadata pipeline cannot express
 * (it only ever emits one well-formed <link rel="canonical"> in <head>).
 * Used for the ASO x SemRush canonical detection head-to-head.
 *
 * Scenarios 1–13 are handled purely via per-page `canonical` metadata (no JS).
 * Scenarios 14–19 (this file) are injected into the rendered DOM, keyed by pathname.
 *
 * ASO scrapes the JS-rendered DOM (waitTimeoutForMetaTags ~5s), so it sees these.
 * SemRush crawl must have JS-rendering ON to have the same chance — whether it still
 * ignores JS-injected canonicals is itself a finding.
 */

function canonicalLinksEverywhere() {
  return [...document.querySelectorAll('link[rel="canonical"]')];
}

function removeAllCanonicals() {
  canonicalLinksEverywhere().forEach((l) => l.remove());
}

/**
 * Create a <link rel="canonical">.
 * @param {string|null} href href value; pass null to omit the attribute entirely
 * @param {object} opts { attrs: {extra attributes}, parent: Element }
 */
function addCanonical(href, opts = {}) {
  const { attrs = {}, parentEl = document.head } = opts;
  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  if (href !== null) link.setAttribute('href', href);
  Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v));
  parentEl.appendChild(link);
  return link;
}

function run() {
  const selfOrigin = window.location.origin;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const selfHref = `${selfOrigin}${path}`;

  const injectors = {
    // #14 — two identical canonical tags
    '/canonical-multiple-tags': () => {
      removeAllCanonicals();
      addCanonical(selfHref);
      addCanonical(selfHref);
    },
    // #15 — two canonical tags with DIFFERENT hrefs (prod ASO flags only as "multiple")
    '/canonical-conflicting-tags': () => {
      removeAllCanonicals();
      addCanonical(selfHref);
      addCanonical(`${selfOrigin}/canonical-clean-control`);
    },
    // #16 — canonical placed in <body> instead of <head>
    '/canonical-outside-head': () => {
      removeAllCanonicals();
      addCanonical(selfHref, { parentEl: document.body });
    },
    // #17 — canonical tag with no href attribute at all
    '/canonical-no-href': () => {
      removeAllCanonicals();
      addCanonical(null);
    },
    // #18 — canonical tag with an empty href
    '/canonical-empty-href': () => {
      removeAllCanonicals();
      addCanonical('');
    },
    // #19 — canonical carrying modifier attributes (hreflang/media/type) → Google drops it
    '/canonical-modifier-attribute': () => {
      removeAllCanonicals();
      addCanonical(selfHref, { attrs: { hreflang: 'en', media: 'screen', type: 'text/html' } });
    },
  };

  const injector = injectors[path];
  if (injector) injector();
}

// document.body may not exist yet for the outside-head case; run after DOM is parsed.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
