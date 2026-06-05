/*
 * Single source of truth for the 19 canonical test scenarios (ASO x SemRush head-to-head).
 *
 * `PROD_HOST` placeholder is the literal token __PROD_HOST__ — replace with the real
 * custom domain (no protocol, e.g. visit-montreal-test.com) before authoring/publishing:
 *   node test-canonical/generate-drafts.mjs            # writes drafts/*.html with the token
 *   then find-replace __PROD_HOST__ once the domain exists.
 *
 * canonical: null            -> omit metadata canonical row (EDS emits default self-ref) [control]
 * canonical: ''              -> empty metadata value (EDS removes the canonical tag)     [missing]
 * canonical: '<value>'       -> explicit canonical value planted in the Metadata block
 * injector: true             -> structural defect handled by scripts/canonical-test.js (no metadata)
 */

export const HOST_TOKEN = '__PROD_HOST__';

export const scenarios = [
  // ---- metadata-driven (1–13) ----
  {
    n: 1, slug: 'canonical-clean-control', title: 'Old Port of Montreal',
    body: 'Stroll the cobblestone streets of the Old Port along the St. Lawrence River.',
    canonical: `https://${HOST_TOKEN}/canonical-clean-control`,
    asoExpected: 'clean (control)', semrushExpected: 'clean',
  },
  {
    n: 2, slug: 'canonical-missing', title: 'Mount Royal Park',
    body: 'Climb to the Kondiaronk Belvedere for the best skyline view in the city.',
    canonical: '',
    asoExpected: 'missing', semrushExpected: 'Invalid (not set)',
  },
  {
    n: 3, slug: 'canonical-cross-domain', title: 'Notre-Dame Basilica',
    body: 'Marvel at the deep-blue vaulted ceiling of this Gothic Revival landmark.',
    canonical: 'https://example.com/montreal',
    asoExpected: 'same-domain', semrushExpected: 'Cross-domain',
  },
  {
    n: 4, slug: 'canonical-different-subdomain', title: 'Jean-Talon Market',
    body: 'Taste Quebec cheeses, maple products and fresh produce at this open-air market.',
    canonical: `https://blog.${HOST_TOKEN}/canonical-different-subdomain`,
    asoExpected: 'same-domain', semrushExpected: 'Cross-domain',
  },
  {
    n: 5, slug: 'canonical-wrong-protocol', title: 'Montreal Biodome',
    body: 'Walk through five ecosystems of the Americas under one roof.',
    canonical: `http://${HOST_TOKEN}/canonical-wrong-protocol`,
    asoExpected: 'same-protocol', semrushExpected: 'Cross-domain (protocol)',
  },
  {
    n: 6, slug: 'canonical-uppercase-url', title: 'Montreal Jazz Festival',
    body: 'Join the world’s largest jazz festival every summer downtown.',
    canonical: `https://${HOST_TOKEN}/Canonical-Uppercase-URL`,
    asoExpected: 'lowercased', semrushExpected: 'likely miss',
  },
  {
    n: 7, slug: 'canonical-relative-url', title: 'Montreal Botanical Garden',
    body: 'Explore themed gardens and greenhouses across 75 hectares.',
    canonical: '/canonical-relative-url',
    asoExpected: 'absolute', semrushExpected: 'likely Invalid',
  },
  {
    n: 8, slug: 'canonical-malformed-url', title: 'Where to Eat Poutine',
    body: 'A guide to the city’s best cheese-curd-and-gravy comfort food.',
    canonical: 'htp:/montreal',
    asoExpected: 'invalid', semrushExpected: 'Invalid',
  },
  {
    n: 9, slug: 'canonical-not-self-referencing', title: 'Winter Activities in Montreal',
    body: 'Skating, snowshoeing and the Fete des Neiges winter festival.',
    canonical: `https://${HOST_TOKEN}/canonical-clean-control`,
    asoExpected: 'self-ref (flagged)', semrushExpected: 'depends',
  },
  {
    n: 10, slug: 'canonical-target-4xx', title: 'The Underground City (RESO)',
    body: 'Navigate 33 km of climate-controlled underground walkways.',
    canonical: `https://${HOST_TOKEN}/this-target-does-not-exist-404`,
    asoExpected: '4xx', semrushExpected: 'Broken',
  },
  {
    n: 11, slug: 'canonical-target-redirect', title: 'Day Trips from Montreal',
    body: 'Escape to the Laurentians, Eastern Townships and Quebec City.',
    canonical: `https://${HOST_TOKEN}/redirect-source`,
    asoExpected: '3xx redirect', semrushExpected: 'depends',
  },
  {
    n: 12, slug: 'canonical-target-noindex', title: 'Montreal Nightlife',
    body: 'From Crescent Street bars to Plateau microbreweries.',
    canonical: `https://${HOST_TOKEN}/noindex-target`,
    asoExpected: 'MISS (gap)', semrushExpected: 'Invalid (conflict)',
  },
  {
    n: 13, slug: 'canonical-target-5xx', title: 'Montreal Museums',
    body: 'The MMFA, Pointe-a-Calliere and the McCord Stewart Museum.',
    canonical: `https://${HOST_TOKEN}/server-error-500`,
    asoExpected: '5xx', semrushExpected: 'Broken',
  },

  // ---- structural, JS-injected (14–19): no canonical metadata; canonical-test.js handles it ----
  {
    n: 14, slug: 'canonical-multiple-tags', title: 'Montreal Neighborhoods',
    body: 'Plateau-Mont-Royal, Mile End, Griffintown and Little Italy.',
    injector: true, asoExpected: 'multiple', semrushExpected: 'likely Invalid',
  },
  {
    n: 15, slug: 'canonical-conflicting-tags', title: 'Montreal Food Scene',
    body: 'Bagels, smoked meat and a thriving fine-dining culture.',
    injector: true, asoExpected: 'multiple (not "conflicting")', semrushExpected: 'Invalid (conflict)',
  },
  {
    n: 16, slug: 'canonical-outside-head', title: 'Cycling with BIXI',
    body: 'Rent a BIXI bike and ride the city’s 900 km of bike paths.',
    injector: true, asoExpected: 'outside-head', semrushExpected: 'depends',
  },
  {
    n: 17, slug: 'canonical-no-href', title: 'Montreal Festivals Calendar',
    body: 'Just for Laughs, Osheaga, MURAL and more all year round.',
    injector: true, asoExpected: 'no-href', semrushExpected: 'depends',
  },
  {
    n: 18, slug: 'canonical-empty-href', title: 'Where to Stay in Montreal',
    body: 'Boutique hotels downtown and charming Plateau guesthouses.',
    injector: true, asoExpected: 'empty', semrushExpected: 'depends',
  },
  {
    n: 19, slug: 'canonical-modifier-attribute', title: 'Planning Your Montreal Trip',
    body: 'Getting around, best seasons to visit and travel tips.',
    injector: true, asoExpected: 'MISS (no prod check)', semrushExpected: 'depends',
  },
];

// Helper pages required by some scenarios.
export const helperPages = [
  {
    slug: 'noindex-target', title: 'Noindex Target (helper)',
    body: 'Helper page for scenario 12: returns 200 but is marked noindex.',
    robots: 'noindex',
  },
  // redirect-source -> handled by the EDS redirects sheet (see SCENARIOS.md), not a page.
];
