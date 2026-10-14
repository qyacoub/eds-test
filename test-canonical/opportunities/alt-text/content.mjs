/*
 * content.mjs — copy for flat alt-text benchmark pages.
 *
 * Page bodies intentionally contain no authored images. The rendered test image is injected by
 * scripts/alt-text-test.js so each page has exactly one controlled alt-text condition.
 */
export const content = {
  'alt-text-missing': {
    intro: 'A controlled page with one rendered image that has no alt attribute.',
    prose: [
      'The image is inserted after page decoration so the rendered DOM preserves an actually absent alt attribute.',
    ],
    highlights: [
      'Primary condition: missing alt attribute',
      'Expected SemRush report: Images missing ALT Tags',
    ],
  },
  'alt-text-empty': {
    intro: 'A controlled page with one rendered image that has an empty alt attribute.',
    prose: ['This page distinguishes empty alt text from a missing alt attribute.'],
    highlights: ['Primary condition: alt=""', 'Expected SemRush behavior: empirical'],
  },
  'alt-text-generic': {
    intro: 'A controlled page with one rendered image that uses generic alt text.',
    prose: ['This page tests whether tools flag low-quality but present alt text.'],
    highlights: ['Primary condition: alt="image"', 'Expected SemRush behavior: no missing-alt issue'],
  },
  'alt-text-long': {
    intro: 'A controlled page with one rendered image whose alt text is too long.',
    prose: ['This page tests length validation beyond the missing-alt case.'],
    highlights: ['Primary condition: alt text over 125 characters', 'Expected SemRush behavior: no missing-alt issue'],
  },
  'alt-text-broken-image': {
    intro: 'A controlled page with one broken rendered image that also has no alt attribute.',
    prose: ['This page tests overlap between missing-alt detection and broken-image detection.'],
    highlights: ['Primary condition: broken image with missing alt', 'Expected SemRush reports: Images missing ALT Tags and possibly Broken Images'],
  },
  'alt-text-valid-control': {
    intro: 'A controlled page with one rendered image that has descriptive alt text.',
    prose: ['This page is the clean control for precision scoring.'],
    highlights: ['Primary condition: valid descriptive alt', 'Expected behavior: no issue'],
  },
};
