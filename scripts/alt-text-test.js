/*
 * alt-text-test.js — TEST ONLY
 *
 * Plants one rendered image per /alt-text-* benchmark page. The EDS authoring pipeline normalizes
 * authored missing alt attributes, so these DOM-level fixtures are required to preserve exact
 * missing/empty/generic/long/control conditions for ASO and SemRush with JS rendering enabled.
 */

const MEDIA = 'https://content.da.live/qyacoub/eds-test/media';

function injectImage({ src, alt, caption }) {
  const host = document.querySelector('main') || document.body;
  const figure = document.createElement('figure');
  figure.setAttribute('data-alt-text-fixture', '');

  const img = document.createElement('img');
  img.setAttribute('src', src);
  img.setAttribute('width', '672');
  img.setAttribute('height', '384');
  img.setAttribute('loading', 'lazy');
  if (alt !== undefined) img.setAttribute('alt', alt);

  const figcaption = document.createElement('figcaption');
  figcaption.textContent = caption;
  figure.append(img, figcaption);
  host.appendChild(figure);
}

function run() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const longAlt = 'Panoramic editorial photograph of the Montreal skyline seen from the Mount Royal lookout at golden hour with downtown towers, tree canopy, and distant river landscape included for a deliberately verbose alt text benchmark.';

  const fixtures = {
    '/alt-text-missing': {
      src: `${MEDIA}/alt-text-5.jpg`,
      caption: 'Missing alt attribute fixture',
    },
    '/alt-text-empty': {
      src: `${MEDIA}/alt-text-1.jpg`,
      alt: '',
      caption: 'Empty alt attribute fixture',
    },
    '/alt-text-generic': {
      src: `${MEDIA}/alt-text-2.jpg`,
      alt: 'image',
      caption: 'Generic alt text fixture',
    },
    '/alt-text-long': {
      src: `${MEDIA}/alt-text-3.jpg`,
      alt: longAlt,
      caption: 'Long alt text fixture',
    },
    '/alt-text-broken-image': {
      src: '/alt-text-missing-image.png',
      caption: 'Broken image with missing alt fixture',
    },
    '/alt-text-valid-control': {
      src: `${MEDIA}/alt-text-4.jpg`,
      alt: 'A plate of classic Quebec poutine with cheese curds and gravy',
      caption: 'Valid descriptive alt fixture',
    },
  };

  const fixture = fixtures[path];
  if (fixture) injectImage(fixture);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
