/*
 * Uploads the 19 canonical test pages (+ helpers + index) to Document Authoring and previews them.
 *
 * Usage:
 *   DA_TOKEN=$(cat /tmp/da_tok) HLX_TOKEN=$(cat /tmp/hlx_adobe) \
 *   node test-canonical/upload-da.mjs <host>
 *
 * <host> is the canonical base host WITHOUT protocol (default: the .aem.page preview host).
 * Replace later with the real custom domain and re-run to re-point canonicals.
 *
 * Requires Node 18+ (global fetch/FormData/Blob).
 */
import { scenarios, helperPages, HOST_TOKEN } from './scenarios.mjs';

const ORG = 'qyacoub';
const SITE = 'eds-test';
const HOST = process.argv[2] || `main--${SITE}--${ORG}.aem.page`;
const DA_TOKEN = process.env.DA_TOKEN;
const HLX_TOKEN = process.env.HLX_TOKEN;
if (!DA_TOKEN || !HLX_TOKEN) throw new Error('Set DA_TOKEN and HLX_TOKEN env vars');

const DA_SOURCE = (path) => `https://admin.da.live/source/${ORG}/${SITE}/${path}.html`;
const PREVIEW = (path) => `https://admin.hlx.page/preview/${ORG}/${SITE}/main/${path}`;

function resolve(val) {
  return typeof val === 'string' ? val.replaceAll(HOST_TOKEN, HOST) : val;
}

function metaRow(k, v) {
  // DA represents blocks as HTML tables: each <tr> is a row, each <td> a cell.
  return `<tr><td>${k}</td><td>${v ?? ''}</td></tr>`;
}

function daHtml({ title, body, canonical, robots }) {
  const rows = [metaRow('title', title)];
  // undefined => no row (control + injector pages); '' => empty row (missing); string => value
  if (canonical !== undefined) rows.push(metaRow('canonical', resolve(canonical)));
  if (robots) rows.push(metaRow('robots', robots));
  return `<body>
<main>
<div>
<h1>${title}</h1>
<p>${body}</p>
<table>
<tr><td>Metadata</td></tr>
${rows.join('\n')}
</table>
</div>
</main>
</body>`;
}

async function uploadSource(path, html) {
  const fd = new FormData();
  fd.append('data', new Blob([html], { type: 'text/html' }), `${path}.html`);
  const res = await fetch(DA_SOURCE(path), {
    method: 'POST', headers: { Authorization: `Bearer ${DA_TOKEN}` }, body: fd,
  });
  return res.status;
}

async function preview(path) {
  const res = await fetch(PREVIEW(path), {
    method: 'POST', headers: { 'x-auth-token': HLX_TOKEN },
  });
  return res.status;
}

const pages = [];
for (const s of scenarios) {
  pages.push({
    path: s.slug,
    html: daHtml({
      title: s.title,
      body: s.body,
      canonical: s.injector ? undefined : s.canonical, // injector pages: no canonical meta
    }),
  });
}
for (const h of helperPages) {
  pages.push({ path: h.slug, html: daHtml(h) });
}
// index linking all pages for crawl discovery
const links = scenarios.map((s) => `<li><a href="/${s.slug}">${s.n}. ${s.title}</a></li>`).join('\n');
pages.push({
  path: 'index',
  html: `<body>
<main>
<div>
<h1>Visiting Montreal — Canonical Test Site</h1>
<p>Test pages for the ASO x SemRush canonical detection comparison.</p>
<ul>
${links}
</ul>
</div>
</main>
</body>`,
});

console.log(`Host base for canonicals: ${HOST}\nUploading ${pages.length} pages...\n`);
for (const p of pages) {
  /* eslint-disable no-await-in-loop */
  const up = await uploadSource(p.path, p.html);
  const pv = await preview(p.path);
  console.log(`${p.path.padEnd(34)} upload=${up} preview=${pv}`);
}
console.log('\nDone.');
