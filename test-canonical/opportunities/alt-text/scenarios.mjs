/*
 * scenarios.mjs — alt-text opportunity.
 *
 * Flat one-defect pages for the alt-text opportunity. Images are injected client-side by
 * scripts/alt-text-test.js because the EDS preview pipeline rewrites authored <img> tags into
 * responsive <picture> markup and normalizes missing alt to alt="". The injector lets each page
 * carry exactly one rendered image condition for ASO and SemRush to crawl with JS rendering on.
 */
export const HOST_TOKEN = '__PROD_HOST__';
export const slugPrefix = 'alt-text';

export const scenarios = [
  {
    n: 1,
    slug: 'alt-text-missing',
    title: 'Alt Text Missing',
    inject: true,
    category: 'Presence',
    asoExpected: 'missing alt attribute',
    semrushExpected: 'Images missing ALT Tags',
  },
  {
    n: 2,
    slug: 'alt-text-empty',
    title: 'Alt Text Empty',
    inject: true,
    category: 'Presence',
    asoExpected: 'empty alt attribute',
    semrushExpected: 'Empirical: may or may not be treated as Images missing ALT Tags',
  },
  {
    n: 3,
    slug: 'alt-text-generic',
    title: 'Alt Text Generic',
    inject: true,
    category: 'Quality',
    asoExpected: 'low-quality-alt in preflight; production alt-text empirical',
    semrushExpected: 'No Images missing ALT Tags issue expected',
  },
  {
    n: 4,
    slug: 'alt-text-long',
    title: 'Alt Text Long',
    inject: true,
    category: 'Length',
    asoExpected: 'long-alt in preflight; production alt-text empirical',
    semrushExpected: 'No Images missing ALT Tags issue expected',
  },
  {
    n: 5,
    slug: 'alt-text-broken-image',
    title: 'Alt Text Broken Image',
    inject: true,
    category: 'Overlap',
    asoExpected: 'missing alt attribute; possible broken-image overlap outside alt-text',
    semrushExpected: 'Images missing ALT Tags plus possible Broken Images',
  },
  {
    n: 6,
    slug: 'alt-text-valid-control',
    title: 'Alt Text Valid Control',
    inject: true,
    category: 'Control',
    asoExpected: 'No alt-text issue',
    semrushExpected: 'No issue',
  },
];

// No helper/fixture pages needed for this opportunity.
export const helperPages = [];
