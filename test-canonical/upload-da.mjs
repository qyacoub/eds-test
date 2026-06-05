/*
 * Authors the full "Visiting Montréal" site in Document Authoring and previews/publishes it:
 *  - 19 rich scenario pages (hero + intro + prose + highlights + nearby cards + tip),
 *    each keeping its planted canonical DEFECT (from scenarios.mjs) unchanged
 *  - polished Home (index), About, Contact (clean self-ref canonical)
 *  - noindex-target helper (canonical target for scenario 12)
 *
 * Usage:
 *   DA_TOKEN=$(cat /tmp/da_tok) HLX_TOKEN=$(cat /tmp/hlx_adobe) \
 *   node test-canonical/upload-da.mjs <host>
 *
 * <host> = production host WITHOUT protocol (e.g. quentin-eds-test.ca). Requires Node 18+.
 */
import { scenarios, helperPages, HOST_TOKEN } from './scenarios.mjs';
import { content } from './content.mjs';

const ORG = 'qyacoub';
const SITE = 'eds-test';
const HOST = process.argv[2] || `main--${SITE}--${ORG}.aem.page`;
const DA_TOKEN = process.env.DA_TOKEN;
const HLX_TOKEN = process.env.HLX_TOKEN;
if (!DA_TOKEN || !HLX_TOKEN) throw new Error('Set DA_TOKEN and HLX_TOKEN');

const SOURCE = (p) => `https://admin.da.live/source/${ORG}/${SITE}/${p}.html`;
const PREVIEW = (p) => `https://admin.hlx.page/preview/${ORG}/${SITE}/main/${p}`;
const LIVE = (p) => `https://admin.hlx.page/live/${ORG}/${SITE}/main/${p}`;

const resolve = (v) => (typeof v === 'string' ? v.replaceAll(HOST_TOKEN, HOST) : v);
const bySlug = Object.fromEntries(scenarios.map((s) => [s.slug, s]));

function metadataBlock({ title, canonical, robots }) {
  const rows = [`<tr><td>title</td><td>${title}</td></tr>`];
  if (canonical !== undefined) rows.push(`<tr><td>canonical</td><td>${resolve(canonical) ?? ''}</td></tr>`);
  if (robots) rows.push(`<tr><td>robots</td><td>${robots}</td></tr>`);
  return `<table>\n<tr><td>Metadata</td></tr>\n${rows.join('\n')}\n</table>`;
}

function heroSection(hero, title, alt) {
  return `<div>\n<p><img src="${hero}" alt="${alt || title}"></p>\n<h1>${title}</h1>\n</div>`;
}

function proseSection(heading, intro, prose, highlights) {
  const parts = [`<h2>${heading}</h2>`];
  if (intro) parts.push(`<p><strong>${intro}</strong></p>`);
  (prose || []).forEach((p) => parts.push(`<p>${p}</p>`));
  if (highlights && highlights.length) {
    parts.push('<h3>Highlights</h3>');
    parts.push(`<ul>\n${highlights.map((h) => `<li>${h}</li>`).join('\n')}\n</ul>`);
  }
  return `<div>\n${parts.join('\n')}\n</div>`;
}

function cardsSection(heading, items) {
  const rows = items.map((it) => `<tr><td><img src="${it.hero}" alt="${it.title}"></td><td><h3><a href="/${it.slug}">${it.title}</a></h3><p>${it.blurb}</p></td></tr>`);
  return `<div>\n<h2>${heading}</h2>\n<table>\n<tr><td>Cards</td></tr>\n${rows.join('\n')}\n</table>\n</div>`;
}

function tipSection(tip) {
  return `<div>\n<blockquote><p><strong>Travel tip:</strong> ${tip}</p></blockquote>\n</div>`;
}

function wrap(sections, meta) {
  // metadata must live INSIDE a section <div> (its own section) to be recognized as a block
  const all = [...sections, `<div>\n${meta}\n</div>`];
  return `<body>\n<main>\n${all.join('\n<hr>\n')}\n</main>\n</body>`;
}

// nearby = next 3 scenarios (cyclic) for internal-link cards
function nearbyOf(slug) {
  const idx = scenarios.findIndex((s) => s.slug === slug);
  return [1, 2, 3].map((d) => scenarios[(idx + d) % scenarios.length]).map((s) => ({
    slug: s.slug, title: s.title, hero: content[s.slug].hero, blurb: content[s.slug].intro,
  }));
}

const pages = [];

// 19 scenario pages
for (const s of scenarios) {
  const c = content[s.slug];
  const sections = [
    heroSection(c.hero, s.title),
    proseSection(s.title, c.intro, c.prose, c.highlights),
    cardsSection('Nearby & related', nearbyOf(s.slug)),
  ];
  if (c.tip) sections.push(tipSection(c.tip));
  const meta = metadataBlock({ title: s.title, canonical: s.injector ? undefined : s.canonical });
  pages.push({ path: s.slug, html: wrap(sections, meta) });
}

// Home (index)
{
  const c = content.home;
  const top = ['canonical-clean-control', 'canonical-missing', 'canonical-cross-domain',
    'canonical-different-subdomain', 'canonical-uppercase-url', 'canonical-not-self-referencing']
    .map((slug) => ({ slug, title: bySlug[slug].title, hero: content[slug].hero, blurb: content[slug].intro }));
  const sections = [
    heroSection(c.hero, 'Visiting Montréal'),
    proseSection('Bonjour-hi! Welcome to Montréal', c.intro, c.prose, []),
    cardsSection('Top things to do', top),
  ];
  pages.push({ path: 'index', html: wrap(sections, metadataBlock({ title: 'Visiting Montréal — Travel Guide', canonical: `https://${HOST}/` })) });
}

// About + Contact (clean self-ref canonical)
for (const slug of ['about', 'contact']) {
  const c = content[slug];
  const title = slug === 'about' ? 'About Visiting Montréal' : 'Contact Us';
  const sections = [heroSection(c.hero, title), proseSection(title, c.intro, c.prose, c.highlights)];
  pages.push({ path: slug, html: wrap(sections, metadataBlock({ title, canonical: `https://${HOST}/${slug}` })) });
}

// noindex-target helper (canonical target for scenario 12) — minimal, robots noindex
for (const h of helperPages) {
  const sections = [`<div>\n<h1>${h.title}</h1>\n<p>${h.body}</p>\n</div>`];
  pages.push({ path: h.slug, html: wrap(sections, metadataBlock({ title: h.title, robots: h.robots })) });
}

async function post(url, headers, body) {
  const res = await fetch(url, { method: 'POST', headers, body });
  return res.status;
}

console.log(`Authoring ${pages.length} pages (host=${HOST})\n`);
for (const p of pages) {
  /* eslint-disable no-await-in-loop */
  const fd = new FormData();
  fd.append('data', new Blob([p.html], { type: 'text/html' }), `${p.path}.html`);
  const up = await post(SOURCE(p.path), { Authorization: `Bearer ${DA_TOKEN}` }, fd);
  const pv = await post(PREVIEW(p.path), { 'x-auth-token': HLX_TOKEN });
  const lv = await post(LIVE(p.path), { 'x-auth-token': HLX_TOKEN });
  console.log(`${p.path.padEnd(34)} upload=${up} preview=${pv} live=${lv}`);
}
console.log('\nDone.');
