/*
 * alt-text-test.js — TEST ONLY (image alt-text benchmark)
 *
 * Injects ONE gallery image (#5, Jacques Cartier Bridge) with a GENUINELY ABSENT alt attribute.
 * The EDS authoring pipeline rewrites every authored <img> into a responsive <picture> and
 * normalizes a missing alt into alt="" (empty → reads as "decorative"); it cannot produce a truly
 * absent attribute. Injecting after load bypasses the pipeline, so ASO's rendered-DOM scrape (and
 * the image-alt-text audit) sees an <img> with no alt at all. Same pattern as scripts/bil-test.js.
 *
 * The other four images (1-4) are authored as normal EDS content (see opportunities/alt-text/
 * content.mjs): 2 with descriptive alt, 2 with no alt that the pipeline renders as empty alt="".
 * This page therefore shows BOTH missing-alt mechanisms side by side: empty alt (EDS) vs absent alt.
 *
 * Fires only on /alt-text; every other page (including the live canonical site) is untouched.
 */

const ORG = 'qyacoub';
const SITE = 'eds-test';
const mediaUrl = (n) => `https://content.da.live/${ORG}/${SITE}/media/alt-text-${n}.jpg`;

// One entry per script-injected image. `alt: null` → render NO alt attribute at all.
const IMAGES = [
  { n: 5, alt: null }, // Jacques Cartier Bridge at night — truly-ABSENT alt (script-only)
];

function run() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path !== '/alt-text') return;

  const host = document.querySelector('main') || document.body;
  const gallery = document.createElement('div');
  gallery.className = 'alt-text-gallery';

  IMAGES.forEach(({ n, alt }) => {
    const p = document.createElement('p');
    const img = document.createElement('img');
    img.setAttribute('src', mediaUrl(n));
    img.setAttribute('width', '672');
    img.setAttribute('height', '384');
    img.setAttribute('loading', 'lazy');
    // Only set alt when present — setAttribute('alt', '') would create an (empty) attribute.
    if (alt !== null) img.setAttribute('alt', alt);
    p.appendChild(img);
    gallery.appendChild(p);
  });

  host.appendChild(gallery);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
