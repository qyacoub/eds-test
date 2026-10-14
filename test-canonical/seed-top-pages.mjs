/*
 * seed-top-pages.mjs — seed SEO top pages for a zero-traffic controlled site so audits that depend
 * on top pages (accessibility, headings, hreflang, metatags, …) can run. These audits read
 * SiteTopPage(source='seo', geo='global'); a no-traffic test domain has none, so they hang in
 * "preparing" or skip. Accessibility specifically has NO includedURLs fallback, so this is the only
 * way to feed it. Seeds ALL pages from the live sitemap (so every top-pages-dependent audit benefits).
 *
 * SOURCE OF TRUTH: the live sitemap at <BASE>/sitemap.xml (excludes the /nav and /footer EDS
 * fragments). Re-run any time the site gains pages.
 *
 * RUN (with AWS creds for the env the audit runs in — prod, since we trigger via
 * spacecat.experiencecloud.live):
 *   # review first — prints the URLs, writes nothing:
 *   DYNAMO_TABLE_NAME_DATA=<data table> S3_CONFIG_BUCKET=<config bucket> AWS_REGION=us-east-1 \
 *     node test-canonical/seed-top-pages.mjs --dry-run
 *   # then actually seed:
 *   DYNAMO_TABLE_NAME_DATA=<data table> S3_CONFIG_BUCKET=<config bucket> AWS_REGION=us-east-1 \
 *     node test-canonical/seed-top-pages.mjs
 *
 * Run from a repo that has @adobe/spacecat-shared-data-access (e.g. spacecat-audit-worker) or
 * `npm i @adobe/spacecat-shared-data-access` first. createDataAccess({tableNameData,s3Bucket,region})
 * matches the worker middleware. Confirmed against @adobe/spacecat-shared-data-access@2.92.0
 * (DynamoDB single-table). Schema (site-top-page.schema.js): siteId*, url*, traffic*(number),
 * source*, geo, topKeyword, importedAt*. The accessibility handler queries source='seo', geo='global'
 * — these MUST match.
 */
const SITE_ID = '019e993a-a742-71ba-b61c-8034aebfb74a';
const BASE = 'https://quentin-eds-test.ca';
const EXCLUDE = new Set(['/nav', '/footer']); // EDS fragments, not real pages
const DRY_RUN = process.argv.includes('--dry-run');

// 1) Pull the full URL list from the live sitemap (self-maintaining "all pages").
const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((u) => {
    try { return !EXCLUDE.has(new URL(u).pathname.replace(/\/$/, '') || '/'); } catch { return false; }
  })
  .filter((u, i, a) => a.indexOf(u) === i)
  .sort();

const now = new Date().toISOString();
const records = urls.map((url, i) => {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return {
    siteId: SITE_ID,
    url,
    traffic: 100000 - i, // required number; only used to rank/slice(0,100)
    source: 'seo',
    geo: 'global',
    topKeyword: path === '' ? 'home' : path.slice(1),
    importedAt: now,
  };
});

console.log(`Resolved ${records.length} pages from ${BASE}/sitemap.xml (excluded: ${[...EXCLUDE].join(', ')})`);
records.forEach((r) => console.log('  ', r.url));

if (DRY_RUN) {
  console.log('\n--dry-run: nothing written. Remove the flag to seed.');
  process.exit(0);
}

// 2) Write to SiteTopPage.
const { createDataAccess } = await import('@adobe/spacecat-shared-data-access');
const dataAccess = createDataAccess({
  tableNameData: process.env.DYNAMO_TABLE_NAME_DATA,
  s3Bucket: process.env.S3_CONFIG_BUCKET,
  region: process.env.AWS_REGION || 'us-east-1',
}, console);
const { SiteTopPage } = dataAccess;

if (typeof SiteTopPage.createMany === 'function') {
  const res = await SiteTopPage.createMany(records);
  console.log(`\nSeeded ${records.length} SEO top pages via createMany.`, res?.length ?? '');
} else {
  for (const r of records) {
    // eslint-disable-next-line no-await-in-loop
    await SiteTopPage.create(r);
    console.log('created', r.url);
  }
}
console.log(`\nDone. Verify: GET /sites/${SITE_ID}/top-pages/seo/global  (expect ${records.length} rows)`);
