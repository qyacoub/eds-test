/*
 * Authors controlled "one defect per page" test pages in Document Authoring and previews/publishes
 * them. Opportunity-agnostic: the default (canonical) run is unchanged; any other opportunity is
 * authored from ./opportunities/<name>/ (see ./opportunities/README.md).
 *
 * Usage:
 *   node test-canonical/upload-da.mjs <host> [slug]                 # canonical (default; full site)
 *   node test-canonical/upload-da.mjs <host> --opp <name> [slug]    # any other opportunity
 *   node test-canonical/upload-da.mjs --nav-only                    # (re)publish just the nav
 *
 * <host> = production host WITHOUT protocol (e.g. the EDS_HOST in your .env). Requires Node 18+.
 * [slug] = optional single page path to (re)publish. Omit = all pages for the opportunity.
 * --opp  = opportunity name. Default "canonical" → ./scenarios.mjs + ./content.mjs (the live site).
 *          Any other name → ./opportunities/<name>/scenarios.mjs (+ optional content.mjs).
 * --no-nav   = don't regenerate/republish the nav after publishing pages.
 * --nav-only = regenerate + publish the nav fragment from the scenarios, then exit.
 *
 * After a full publish the nav (/nav) is auto-regenerated from the scenarios (gen-nav.mjs) so each
 * opportunity keeps its own sub-menu — never hand-edit nav.html. Credentials/site config (DA token,
 * EDS_ORG/SITE/HOST) are resolved in da-lib.mjs.
 */
import { scenarios, helperPages, HOST_TOKEN } from './scenarios.mjs';
import { content } from './content.mjs';
import {
  ORG, SITE, loadConfig, publishDoc,
} from './da-lib.mjs';
import { publishNav } from './gen-nav.mjs';

const CFG = loadConfig();

// --- args: <host> [slug] [--opp <name>] [--no-nav] [--nav-only] (flags may appear anywhere) -----
const argv = process.argv.slice(2);
function takeFlag(name) { const i = argv.indexOf(name); if (i !== -1) { argv.splice(i, 1); return true; } return false; }
function takeOpt(name) { const i = argv.indexOf(name); if (i !== -1) { const v = argv[i + 1]; argv.splice(i, 2); return v; } return undefined; }

const NAV_ONLY = takeFlag('--nav-only');
const NO_NAV = takeFlag('--no-nav');
const OPP = takeOpt('--opp') || 'canonical';
const HOST = argv[0] || CFG.EDS_HOST || `main--${SITE}--${ORG}.aem.page`;
const ONLY = argv[1]; // optional single page path

if (NAV_ONLY) {
  const r = await publishNav();
  console.log(`nav  upload=${r.up} preview=${r.pv} live=${r.lv}`);
  process.exit(0);
}

const resolve = (v) => (typeof v === 'string' ? v.replaceAll(HOST_TOKEN, HOST) : v);
const imgUrl = (slug) => `https://content.da.live/${ORG}/${SITE}/media/${slug}.jpg`;

// --- generic HTML builders (shared by every opportunity) ---------------------------------
// metadataBlock emits one row per field (title first). String values get HOST_TOKEN resolved.
// This is the generalization: a scenario supplies whatever metadata its opportunity needs —
// {canonical}, {description}, {robots}, {"og:title"}, … — not a fixed canonical/robots pair.
function metadataBlock(fields) {
  const rows = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    rows.push(`<tr><td>${k}</td><td>${resolve(v) ?? ''}</td></tr>`);
  }
  return `<table>\n<tr><td>Metadata</td></tr>\n${rows.join('\n')}\n</table>`;
}

function heroSection(hero, title, alt) {
  const img = hero ? `<p><img src="${hero}" alt="${alt || title}"></p>\n` : '';
  return `<div>\n${img}<h1>${title}</h1>\n</div>`;
}

function proseSection(heading, intro, prose, highlights) {
  const parts = [];
  if (heading) parts.push(`<h2>${heading}</h2>`);
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

// Generic scenario page for non-canonical opportunities. Hero is optional; metadata comes from
// `s.metadata` (object); structural-defect pages (s.inject) get NO metadata (the defect is injected
// into the rendered DOM by an opportunity-specific client script — see opportunities/README.md).
function simplePage(s, cont) {
  const c = cont[s.slug] || {};
  const sections = [
    heroSection(c.hero || null, s.title),
    proseSection('', c.intro || s.body || `Controlled test page for "${s.slug}".`, c.prose, c.highlights),
  ];
  if (c.tip) sections.push(tipSection(c.tip));
  const md = s.metadata || (s.canonical !== undefined ? { canonical: s.canonical } : {});
  const meta = metadataBlock({ title: s.title, ...((s.inject || s.injector) ? {} : md) });
  return { path: s.slug, html: wrap(sections, meta) };
}

function helperPage(h) {
  const sections = [`<div>\n<h1>${h.title}</h1>\n<p>${h.body || ''}</p>\n</div>`];
  const md = { title: h.title, ...(h.metadata || {}), ...(h.robots ? { robots: h.robots } : {}) };
  return { path: h.slug, html: wrap(sections, metadataBlock(md)) };
}

// --- build the page set ------------------------------------------------------------------
const pages = [];

if (OPP !== 'canonical') {
  // Generic opportunity: author its scenario pages (+ helpers) only; site chrome already exists.
  const mod = await import(`./opportunities/${OPP}/scenarios.mjs`);
  let cont = {};
  try { ({ content: cont } = await import(`./opportunities/${OPP}/content.mjs`)); } catch { /* optional */ }
  for (const s of mod.scenarios) pages.push(simplePage(s, cont));
  for (const h of (mod.helperPages || [])) pages.push(helperPage(h));
} else {
  // --- canonical opportunity (the live "Visiting Montréal" site) — unchanged ---------------
  const bySlug = Object.fromEntries(scenarios.map((s) => [s.slug, s]));
  const nearbyOf = (slug) => {
    const idx = scenarios.findIndex((s) => s.slug === slug);
    return [1, 2, 3].map((d) => scenarios[(idx + d) % scenarios.length]).map((s) => ({
      slug: s.slug, title: s.title, hero: imgUrl(s.slug), blurb: content[s.slug].intro,
    }));
  };
  for (const s of scenarios) {
    const c = content[s.slug];
    const sections = [
      heroSection(imgUrl(s.slug), s.title),
      proseSection('', c.intro, c.prose, c.highlights),
      cardsSection('Nearby & related', nearbyOf(s.slug)),
    ];
    if (c.tip) sections.push(tipSection(c.tip));
    const meta = metadataBlock({ title: s.title, canonical: s.injector ? undefined : s.canonical });
    pages.push({ path: s.slug, html: wrap(sections, meta) });
  }
  {
    const c = content.home;
    const top = ['canonical-clean-control', 'canonical-missing', 'canonical-cross-domain',
      'canonical-different-subdomain', 'canonical-uppercase-url', 'canonical-not-self-referencing']
      .map((slug) => ({ slug, title: bySlug[slug].title, hero: imgUrl(slug), blurb: content[slug].intro }));
    const sections = [
      heroSection(imgUrl('home'), 'Visiting Montréal'),
      proseSection('Bonjour-hi! Welcome to Montréal', c.intro, c.prose, []),
      cardsSection('Top things to do', top),
    ];
    pages.push({ path: 'index', html: wrap(sections, metadataBlock({ title: 'Visiting Montréal — Travel Guide', canonical: `https://${HOST}/` })) });
  }
  for (const slug of ['about', 'contact']) {
    const c = content[slug];
    const title = slug === 'about' ? 'About Visiting Montréal' : 'Contact Us';
    const sections = [heroSection(imgUrl(slug), title), proseSection('', c.intro, c.prose, c.highlights)];
    pages.push({ path: slug, html: wrap(sections, metadataBlock({ title, canonical: `https://${HOST}/${slug}` })) });
  }
  for (const h of helperPages) pages.push(helperPage(h));
}

// --- publish -----------------------------------------------------------------------------
const toPublish = ONLY ? pages.filter((p) => p.path === ONLY) : pages;
if (ONLY && toPublish.length === 0) {
  throw new Error(`No page with path "${ONLY}" in opportunity "${OPP}".`);
}

console.log(`Authoring ${toPublish.length} page(s) (opp=${OPP}, host=${HOST}${ONLY ? `, only=${ONLY}` : ''})\n`);
for (const p of toPublish) {
  // eslint-disable-next-line no-await-in-loop
  const { up, pv, lv } = await publishDoc(p.path, p.html);
  console.log(`${p.path.padEnd(34)} upload=${up} preview=${pv} live=${lv}`);
}

// Refresh the nav from the scenarios so each opportunity keeps its own sub-menu. Skipped for
// single-page (--no-nav-implied) and explicit --no-nav, since the nav doesn't change there.
if (!NO_NAV && !ONLY) {
  const r = await publishNav();
  console.log(`${'nav'.padEnd(34)} upload=${r.up} preview=${r.pv} live=${r.lv}`);
}
console.log('\nDone.');
