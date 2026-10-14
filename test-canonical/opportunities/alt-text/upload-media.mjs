/*
 * upload-media.mjs — one-off: uploads the 5 alt-text gallery images to DA /media.
 *
 * Usage:
 *   node test-canonical/opportunities/alt-text/upload-media.mjs <dir>
 *   <dir> contains alt-text-1.jpg .. alt-text-5.jpg (defaults to /tmp/alt-text-imgs).
 *
 * Posts each binary to the DA Source API at /media/alt-text-<n>.jpg (multipart field name MUST be
 * "data"). Token: env DA_TOKEN, else the da-auth cache ~/.aem/da-token.json
 * (refresh with: npx github:adobe-rnd/da-auth-helper token).
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ORG = 'qyacoub';
const SITE = 'eds-test';
const DIR = process.argv[2] || '/tmp/alt-text-imgs';

function readDaCache() {
  try {
    const t = JSON.parse(readFileSync(join(homedir(), '.aem', 'da-token.json'), 'utf8'));
    if (t.access_token && (!t.expires_at || t.expires_at > Date.now() + 60000)) return t.access_token;
    console.error('[auth] ~/.aem/da-token.json is expired — re-run: npx github:adobe-rnd/da-auth-helper token');
  } catch { /* no cache */ }
  return undefined;
}

const DA_TOKEN = process.env.DA_TOKEN || readDaCache();
if (!DA_TOKEN) throw new Error('No DA token: set DA_TOKEN or run `npx github:adobe-rnd/da-auth-helper token`');

const SOURCE = (p) => `https://admin.da.live/source/${ORG}/${SITE}/${p}`;

for (let n = 1; n <= 5; n += 1) {
  /* eslint-disable no-await-in-loop */
  const file = join(DIR, `alt-text-${n}.jpg`);
  const bytes = readFileSync(file);
  const fd = new FormData();
  fd.append('data', new Blob([bytes], { type: 'image/jpeg' }), `alt-text-${n}.jpg`);
  const res = await fetch(SOURCE(`media/alt-text-${n}.jpg`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${DA_TOKEN}` },
    body: fd,
  });
  console.log(`media/alt-text-${n}.jpg  upload=${res.status}`);
}
console.log('\nDone.');
