/*
 * gen-nav.mjs — generate the site nav (/nav fragment) from the opportunity scenarios so each
 * opportunity gets its own nested sub-menu, and the nav never drifts from the test pages.
 *
 * Source of truth = the scenarios: canonical (./scenarios.mjs) + every ./opportunities/<name>/
 * scenarios.mjs. Per opportunity we emit  <li>{label}<ul>… one link per scenario …</ul></li>,
 * skipping helperPages (fixtures). Labels are derived from the slug; override per scenario with
 * `menuLabel`, per opportunity with `navLabel` / `slugPrefix`.
 *
 * Usage:
 *   node test-canonical/gen-nav.mjs --dry   # print nav.html, publish nothing
 *   node test-canonical/gen-nav.mjs         # write test-canonical/nav.html AND publish /nav
 *
 * Also importable: buildNavHtml() (pure) and publishNav() are reused by upload-da.mjs so a normal
 * `--opp` publish refreshes the nav automatically.
 */
import { readdirSync, writeFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publishDoc } from './da-lib.mjs';

// Display names for opportunities whose folder name isn't the label we want.
const OPP_LABELS = {
  canonical: 'Canonical',
  'broken-internal-links': 'Internal Links',
  'alt-text': 'Alt Text',
};
// Tokens to upper-case when they appear as whole words in a derived label.
const ACRONYMS = { url: 'URL', css: 'CSS', js: 'JS', html: 'HTML', seo: 'SEO' };

const capFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const deKebab = (s) => s.split('-').map((w) => ACRONYMS[w.toLowerCase()] || w).join(' ');
const titleCase = (s) => s.split('-').map((w) => ACRONYMS[w.toLowerCase()] || capFirst(w)).join(' ');

// Longest leading run of dash-delimited segments common to every slug (the opportunity prefix).
function longestCommonDashPrefix(slugs) {
  if (!slugs.length) return '';
  const split = slugs.map((s) => s.split('-'));
  const [first] = split;
  let n = 0;
  while (n < first.length && split.every((seg) => seg[n] === first[n])) n += 1;
  return first.slice(0, n).join('-');
}

function scenarioLabel(slug, prefix, scenario) {
  if (scenario.menuLabel) return scenario.menuLabel;
  let rest = slug;
  if (prefix && (slug === prefix || slug.startsWith(`${prefix}-`))) rest = slug.slice(prefix.length).replace(/^-/, '');
  if (!rest) return scenario.title || slug; // single-page opp whose slug == prefix (e.g. alt-text)
  return capFirst(deKebab(rest));
}

async function loadOpps() {
  const opps = [{ name: 'canonical', mod: await import('./scenarios.mjs') }];
  const dir = fileURLToPath(new URL('./opportunities', import.meta.url));
  const folders = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort();
  for (const name of folders) {
    // eslint-disable-next-line no-await-in-loop
    opps.push({ name, mod: await import(`./opportunities/${name}/scenarios.mjs`) });
  }
  return opps;
}

function oppMenu({ name, mod }) {
  const label = mod.navLabel || OPP_LABELS[name] || titleCase(name);
  const slugs = mod.scenarios.map((s) => s.slug);
  const prefix = mod.slugPrefix || longestCommonDashPrefix(slugs);
  const items = mod.scenarios
    .map((s) => `<li><a href="/${s.slug}">${scenarioLabel(s.slug, prefix, s)}</a></li>`)
    .join('\n');
  return `<li>${label}\n<ul>\n${items}\n</ul>\n</li>`;
}

export async function buildNavHtml() {
  const opps = await loadOpps();
  const menus = opps.map(oppMenu).join('\n');
  const tail = '<li><a href="/about">About</a></li>\n<li><a href="/contact">Contact</a></li>';
  return [
    '<body>',
    '<main>',
    '<div>',
    '<p><a href="/">Visiting <strong>Montréal</strong></a></p>',
    '</div>',
    '<hr>',
    '<div>',
    '<ul>',
    menus,
    tail,
    '</ul>',
    '</div>',
    '<hr>',
    '<div>',
    '<p>🍁 Your guide to Montréal</p>',
    '</div>',
    '</main>',
    '</body>',
    '',
  ].join('\n');
}

// Write the local nav.html artifact and publish the /nav fragment to DA + aem.live.
export async function publishNav() {
  const html = await buildNavHtml();
  writeFileSync(fileURLToPath(new URL('./nav.html', import.meta.url)), html);
  return publishDoc('nav', html);
}

async function main() {
  if (process.argv.includes('--dry')) {
    process.stdout.write(await buildNavHtml());
    return;
  }
  const { up, pv, lv } = await publishNav();
  console.log(`nav  upload=${up} preview=${pv} live=${lv}`);
}

// Run main only when invoked directly (not when imported by upload-da.mjs).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
