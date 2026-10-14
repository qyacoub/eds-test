/*
 * da-lib.mjs — shared Document Authoring / aem.live plumbing for the test-site tooling.
 *
 * Extracted from upload-da.mjs so the uploader and the nav generator (gen-nav.mjs) share one
 * credential-resolution + publish primitive instead of duplicating it.
 *
 * Config & credentials are resolved LAZILY (only when you actually publish), so importing this
 * module — e.g. for `gen-nav.mjs --dry` — never requires a token.
 *
 * Env-overridable: EDS_ORG / EDS_SITE (defaults qyacoub / eds-test). Values may come from the
 * process environment, a gitignored repo-root .env, or ~/.config/opportunity-detect-benchmark/.env.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// --- .env loaders (no deps) --------------------------------------------------------------
function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
function readFileSafe(path) { try { return readFileSync(path, 'utf8'); } catch { return null; } }

// Merge order (later wins): repo-root .env → ~/.config/opportunity-detect-benchmark/.env → process.env.
export function loadConfig() {
  const repoEnv = readFileSafe(new URL('../.env', import.meta.url));
  const userEnv = readFileSafe(join(homedir(), '.config', 'opportunity-detect-benchmark', '.env'));
  return {
    ...(repoEnv ? parseEnv(repoEnv) : {}),
    ...(userEnv ? parseEnv(userEnv) : {}),
    ...process.env,
  };
}

const CFG = loadConfig();
export const ORG = CFG.EDS_ORG || 'qyacoub';
export const SITE = CFG.EDS_SITE || 'eds-test';

export const SOURCE = (p) => `https://admin.da.live/source/${ORG}/${SITE}/${p}.html`;
export const PREVIEW = (p) => `https://admin.hlx.page/preview/${ORG}/${SITE}/main/${p}`;
export const LIVE = (p) => `https://admin.hlx.page/live/${ORG}/${SITE}/main/${p}`;

// --- credentials (lazy) ------------------------------------------------------------------
function readDaCache() {
  try {
    const t = JSON.parse(readFileSync(join(homedir(), '.aem', 'da-token.json'), 'utf8'));
    if (t.access_token && (!t.expires_at || t.expires_at > Date.now() + 60000)) return t.access_token;
    console.error('[auth] ~/.aem/da-token.json is expired — re-run: npx github:adobe-rnd/da-auth-helper token');
  } catch { /* no cache */ }
  return undefined;
}

let creds;
function resolveCreds() {
  if (creds) return creds;
  const daToken = CFG.DA_TOKEN || readDaCache();
  if (!daToken) {
    throw new Error('No DA token: set DA_TOKEN (env or ~/.config/opportunity-detect-benchmark/.env) '
      + 'or run `npx github:adobe-rnd/da-auth-helper token` (caches ~/.aem/da-token.json).');
  }
  // admin.hlx.page accepts the DA IMS token (Bearer); a long-lived admin API key uses x-auth-token.
  creds = { daToken, hlxToken: CFG.HLX_TOKEN || daToken, hlxFallback: CFG.AEM_ADMIN_KEY };
  return creds;
}

// Try each credential as both Bearer and x-auth-token until one is accepted.
async function postHlx(url) {
  const { hlxToken, hlxFallback } = resolveCreds();
  const list = [hlxToken, hlxFallback].filter((c, i, a) => c && a.indexOf(c) === i);
  let status = 401;
  for (const cred of list) {
    for (const headers of [{ Authorization: `Bearer ${cred}` }, { 'x-auth-token': cred }]) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url, { method: 'POST', headers });
      status = res.status;
      if (status !== 401 && status !== 403) return status;
    }
  }
  return status;
}

// Publish one doc end-to-end: DA source PUT → admin.hlx.page preview → live. Returns {up,pv,lv}.
export async function publishDoc(path, html) {
  const { daToken } = resolveCreds();
  const fd = new FormData();
  fd.append('data', new Blob([html], { type: 'text/html' }), `${path}.html`);
  const up = (await fetch(SOURCE(path), { method: 'POST', headers: { Authorization: `Bearer ${daToken}` }, body: fd })).status;
  const pv = await postHlx(PREVIEW(path));
  const lv = await postHlx(LIVE(path));
  return { up, pv, lv };
}
