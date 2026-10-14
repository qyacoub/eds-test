/*
 * content.mjs — richer copy for the broken-internal-links pages, keyed by slug.
 * `prose[]` strings are inserted as RAW HTML (each wrapped in <p>), so the planted <a> / <img>
 * anchor defects are authored here and survive the EDS pipeline (unlike form/iframe/area/script/
 * link[rel=alternate], which are JS-injected by scripts/bil-test.js).
 *
 * All hrefs are RELATIVE (resolved against the page host) — content.mjs strings are NOT
 * HOST_TOKEN-substituted, only scenario metadata is.
 */
export const content = {
  // 1 — control: three WORKING internal links (none to #18 orphaned or #19 few-inlinks)
  'bil-clean-control': {
    intro: 'Everything you need to plan your visit.',
    prose: [
      'Start with our <a href="/about">about page</a>, then check the '
      + '<a href="/contact">contact details</a> before you go.',
      'You can also browse the <a href="/bil-redirect-ok-dest">current promotions</a> for the latest offers.',
    ],
  },

  // 2 — anchor to a deleted page (origin 404)
  'bil-anchor-404': {
    intro: 'Our seasonal events change throughout the year.',
    prose: [
      'See the full lineup on our <a href="/bil-deleted-page">events archive</a>, '
      + 'updated every season with new highlights.',
    ],
  },

  // 3 — anchor to a soft-404 (200 page that says "not found")
  'bil-soft-404': {
    intro: 'Looking for an older announcement?',
    prose: [
      'Past announcements are kept on our <a href="/bil-soft-404-target">archive page</a> for reference.',
    ],
  },

  // 4 — anchor to a 410 Gone target (worker)
  'bil-gone-410': {
    intro: 'Some programs have been retired.',
    prose: [
      'Details about the <a href="/bil-gone-410-target">discontinued program</a> are no longer maintained.',
    ],
  },

  // 5 — anchor to a 403 Forbidden target (worker)
  'bil-forbidden-403': {
    intro: 'Some resources require membership.',
    prose: [
      'Access the <a href="/bil-forbidden-403-target">members-only library</a> after signing in.',
    ],
  },

  // 6 — anchor to a 503 server-error target (worker)
  'bil-server-5xx': {
    intro: 'Check the status of our services.',
    prose: [
      'Live status is shown on the <a href="/bil-server-5xx-target">service status page</a>.',
    ],
  },

  // 7 — anchor into a 302 redirect loop (worker)
  'bil-redirect-chain': {
    intro: 'Our documentation has moved over the years.',
    prose: [
      'The <a href="/bil-redirect-chain-a">legacy documentation</a> is preserved for older versions.',
    ],
  },

  // 11 — anchor via a 302 temporary redirect to a working page (worker)
  'bil-temp-redirect-302': {
    intro: 'Current promotions and offers.',
    prose: [
      'See this season&rsquo;s <a href="/bil-temp-302-target">promotions</a> (temporarily redirected).',
    ],
  },

  // 12 — anchor via a 301 redirect whose destination 404s (worker)
  'bil-broken-redirect': {
    intro: 'Our old campaign has wrapped up.',
    prose: [
      'The <a href="/bil-broken-redirect-source">campaign landing page</a> has been retired.',
    ],
  },
};
