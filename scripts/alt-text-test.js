/*
 * alt-text-test.js — TEST ONLY (image alt-text benchmark)
 *
 * Renders the /alt-text gallery client-side so the images reach the DOM with their alt attributes
 * EXACTLY as authored. The EDS authoring pipeline rewrites every authored <img> into a responsive
 * <picture> and normalizes a missing alt into alt="" (empty → reads as "decorative"). Injecting the
 * images after load bypasses that pipeline, guaranteeing a genuinely ABSENT alt attribute on the
 * three "missing" images — which is what ASO's rendered-DOM scrape (and the image-alt-text audit)
 * needs to see. Same pattern as scripts/bil-test.js and scripts/canonical-test.js.
 *
 * Fires only on /alt-text; every other page (including the live canonical site) is untouched.
 */

const ORG = 'qyacoub';
const SITE = 'eds-test';
const mediaUrl = (n) => `https://content.da.live/${ORG}/${SITE}/media/alt-text-${n}.jpg`;

// One entry per image. `alt: null` → render NO alt attribute at all (the "missing" cases).
const IMAGES = [
  { n: 1, alt: null }, // Old Montréal cobblestone street — MISSING alt
  { n: 2, alt: 'Panoramic view over the Montréal skyline from the Mount Royal lookout' },
  { n: 3, alt: null }, // Notre-Dame Basilica interior — MISSING alt
  { n: 4, alt: 'A plate of classic Québec poutine with cheese curds and gravy' },
  { n: 5, alt: null }, // Jacques Cartier Bridge illuminated at night — MISSING alt
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
