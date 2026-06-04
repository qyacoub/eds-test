/*
 * Generates drafts/<slug>.plain.html for every scenario so the site can be tested locally:
 *   npx -y @adobe/aem-cli up --html-folder drafts
 * and used as the copy source when authoring the same pages in Document Authoring (da.live).
 *
 * Run: node test-canonical/generate-drafts.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scenarios, helperPages } from './scenarios.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const draftsDir = join(root, 'drafts');
mkdirSync(draftsDir, { recursive: true });

function metadataRow(key, value) {
  return `  <div><div>${key}</div><div>${value}</div></div>`;
}

function pageHtml({ title, body, canonical, robots }) {
  const rows = [metadataRow('title', title)];
  // canonical: undefined -> no row (injector pages / control); '' -> empty row (missing); string -> value
  if (canonical !== undefined && canonical !== null) {
    rows.push(metadataRow('canonical', canonical));
  }
  if (robots) rows.push(metadataRow('robots', robots));
  return `<div>
  <h1>${title}</h1>
  <p>${body}</p>
</div>
<div class="metadata">
${rows.join('\n')}
</div>
`;
}

let count = 0;
for (const s of scenarios) {
  const html = pageHtml({
    title: s.title,
    body: s.body,
    // injector pages and the control get no canonical row
    canonical: s.injector ? undefined : s.canonical,
  });
  writeFileSync(join(draftsDir, `${s.slug}.plain.html`), html);
  count += 1;
}
for (const h of helperPages) {
  writeFileSync(join(draftsDir, `${h.slug}.plain.html`), pageHtml(h));
  count += 1;
}

// simple index linking every page so crawlers (SemRush) can discover them
const links = scenarios
  .map((s) => `    <li><a href="/${s.slug}">${s.n}. ${s.title} — ${s.slug}</a></li>`)
  .join('\n');
writeFileSync(join(draftsDir, 'index.plain.html'), `<div>
  <h1>Visiting Montreal — Canonical Test Site</h1>
  <p>Test pages for the ASO x SemRush canonical detection comparison.</p>
  <ul>
${links}
  </ul>
</div>
`);

console.log(`Generated ${count + 1} draft pages in drafts/`);
