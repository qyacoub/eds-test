/*
 * alt-text-test.js — TEST ONLY
 *
 * Plants one rendered image per /alt-text-* benchmark page. The EDS authoring pipeline normalizes
 * authored missing alt attributes, so these DOM-level fixtures are required to preserve exact
 * missing/empty/generic/long/control conditions for ASO and SemRush with JS rendering enabled.
 */

const MEDIA = {
  missing: '/media_175631ded1a4aca0f54f0cece60379c817a4d9f6a.jpg?width=750&format=jpg&optimize=medium',
  empty: '/media_132f331ce6c2168700557e2f0a43116d1f0e77050.jpg?width=750&format=jpg&optimize=medium',
  generic: '/media_1694ba798cce8b565f1413a3f2d4d477c469d8bca.jpg?width=750&format=jpg&optimize=medium',
  long: '/media_18a3fefd89e6b17086d3fe087da755ae6fde857ad.jpg?width=750&format=jpg&optimize=medium',
  valid: '/media_1ad0de4962627e5d7d20286b98147999ac582667c.jpg?width=750&format=jpg&optimize=medium',
};

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
      src: MEDIA.missing,
      caption: 'Missing alt attribute fixture',
    },
    '/alt-text-empty': {
      src: MEDIA.empty,
      alt: '',
      caption: 'Empty alt attribute fixture',
    },
    '/alt-text-generic': {
      src: MEDIA.generic,
      alt: 'image',
      caption: 'Generic alt text fixture',
    },
    '/alt-text-long': {
      src: MEDIA.long,
      alt: longAlt,
      caption: 'Long alt text fixture',
    },
    '/alt-text-broken-image': {
      src: '/alt-text-missing-image.png',
      caption: 'Broken image with missing alt fixture',
    },
    '/alt-text-valid-control': {
      src: MEDIA.valid,
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
