/*
 * bil-test.js — TEST ONLY (broken-internal-links benchmark)
 *
 * Plants STRUCTURAL link defects that the EDS authoring pipeline strips from content
 * (form / area+map / iframe / script / link[rel=alternate] / a[rel=nofollow]). These are injected
 * into the rendered DOM, keyed by pathname, so ASO's rendered-DOM scrape can see them. SemRush
 * only has the same chance with JS-rendering ON — whether it still ignores JS-injected links is
 * a finding.
 *
 * Anchor/img/canonical scenarios are authored statically (content.mjs prose / Metadata block) and
 * are NOT handled here. This script only fires on the six injected `bil-*` pages below; every other
 * page (including the live canonical site) is untouched.
 */

function injectInto(targetSelector, node) {
  const host = document.querySelector(targetSelector) || document.querySelector('main') || document.body;
  host.appendChild(node);
}

function run() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  const injectors = {
    // #8 — <form> whose action 404s
    '/bil-form-action-404': () => {
      const form = document.createElement('form');
      form.setAttribute('action', '/bil-form-target-404');
      form.setAttribute('method', 'post');
      form.innerHTML = '<label>Email <input type="email" name="email"></label>'
        + '<button type="submit">Sign up</button>';
      injectInto('main', form);
    },
    // #11 — broken <img src> to a missing internal image (static authoring → about:error)
    '/bil-broken-image': () => {
      const p = document.createElement('p');
      p.innerHTML = '<img src="/bil-missing-image.png" alt="Featured product" width="320" height="200">';
      injectInto('main', p);
    },
    // #9 — image map <area href> to a deleted page
    '/bil-imagemap-area-404': () => {
      const wrap = document.createElement('p');
      wrap.innerHTML = '<img src="/bil-missing-image.png" alt="Campus map" width="320" height="200" usemap="#bilmap">'
        + '<map name="bilmap">'
        + '<area shape="rect" coords="0,0,160,200" href="/bil-area-target-404" alt="North campus">'
        + '</map>';
      injectInto('main', wrap);
    },
    // #10 — <iframe src> to a non-existent internal page
    '/bil-iframe-404': () => {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', '/bil-iframe-target-404');
      iframe.setAttribute('title', 'Embedded widget');
      iframe.setAttribute('width', '320');
      iframe.setAttribute('height', '200');
      injectInto('main', iframe);
    },
    // #12 — <script src> to a missing internal .js file
    '/bil-broken-cssjs': () => {
      const s = document.createElement('script');
      s.setAttribute('src', '/bil-missing-script.js');
      injectInto('main', s);
    },
    // #14 — alternate hreflang <link> to a deleted page (in <head>)
    '/bil-broken-hreflang': () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', 'fr');
      link.setAttribute('href', '/bil-deleted-page');
      document.head.appendChild(link);
    },
    // #17 — internal <a rel="nofollow"> to a WORKING page
    '/bil-nofollow-internal': () => {
      const p = document.createElement('p');
      p.innerHTML = 'Sponsored: <a rel="nofollow" href="/bil-nofollow-dest">see sponsor details</a>.';
      injectInto('main', p);
    },
  };

  const injector = injectors[path];
  if (injector) injector();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
