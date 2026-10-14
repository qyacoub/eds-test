/*
 * content.mjs — OPTIONAL richer page copy, keyed by slug (mirrors ../../content.mjs).
 * Omit this file entirely and pages still render from each scenario's `title` + `body`.
 * Fields per slug: { hero?, intro?, prose?: string[], highlights?: string[], tip? }.
 * `hero` is a content.da.live source URL (the pipeline rewrites it to an optimized image);
 * leave it out and the page renders heading + copy with no image.
 */
export const content = {
  // 'EXAMPLE-missing': {
  //   intro: 'Lead paragraph for a believable page.',
  //   prose: ['Body paragraph one.', 'Body paragraph two.'],
  //   highlights: ['Point A', 'Point B'],
  // },
};
