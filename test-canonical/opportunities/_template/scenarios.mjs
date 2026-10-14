/*
 * scenarios.mjs — one object per planted defect for this opportunity.
 *
 * Shape (all opportunities share it):
 *   n            : number (ordering / scoring id)
 *   slug         : globally-unique page path; prefix with the opportunity (e.g. "metadesc-missing")
 *   title        : page <h1> + Metadata title
 *   body         : one-line filler copy (used if no content.mjs entry exists for the slug)
 *   metadata     : OPTIONAL object → EDS Metadata rows for the planted defect, e.g.
 *                  { description: '...' } | { robots: 'noindex' } | { canonical: `https://${HOST_TOKEN}/x` }
 *                  HOST_TOKEN in string values is replaced with the real host at upload time.
 *   inject       : OPTIONAL true → structural defect injected into the rendered DOM by a client script;
 *                  the uploader emits NO metadata for these (wire an injector like scripts/canonical-test.js).
 *   category     : scoring bucket (Presence / Format / Relationship / Target-health / Target-indexability /
 *                  Structural / Self-reference — adapt per opportunity)
 *   menuLabel    : OPTIONAL nav menu text for this scenario (default: derived from the slug).
 *   asoExpected  : expected ASO production check name (hypothesis to confirm by running the audit)
 *   semrushExpected : expected SemRush report/issue (hypothesis)
 *
 * Keep ONE isolated defect per page, and a clean control as scenario 1.
 *
 * The site nav is generated from these scenarios by ../../gen-nav.mjs (each opportunity = one nested
 * sub-menu). Optional module-level overrides:
 *   export const navLabel  = 'Meta Description'; // the sub-menu heading (default: title-cased folder)
 *   export const slugPrefix = 'metadesc';        // stripped from slugs to derive labels (default: inferred)
 */
export const HOST_TOKEN = '__PROD_HOST__';

export const scenarios = [
  {
    n: 1, slug: 'EXAMPLE-clean-control', title: 'Clean control',
    body: 'A correct page with no planted defect — used to measure false positives.',
    metadata: { /* correct/valid values for this opportunity */ },
    category: 'control', asoExpected: 'clean', semrushExpected: 'clean',
  },
  {
    n: 2, slug: 'EXAMPLE-missing', title: 'Missing',
    body: 'The element under test is entirely absent.',
    metadata: { /* omit the field, or set '' to plant "missing" */ },
    category: 'Presence', asoExpected: '<aso-check>', semrushExpected: '<semrush-report>',
  },
  // ... add one object per defect, grounded in the ASO checks (spacecat src/<opp> + mystique) and the
  // SemRush reports you surveyed in Step 1 of the skill workflow.
];

// Pages that exist only as fixtures/targets (not scored), e.g. a noindex target or a redirect source.
export const helperPages = [
  // { slug: 'EXAMPLE-helper-target', title: 'Helper target', body: '...', metadata: { robots: 'noindex' } },
];
