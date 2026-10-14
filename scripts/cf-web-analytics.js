/*
 * Cloudflare Web Analytics (free) for quentin-eds-test.ca, the replacement for Matomo.
 * The site's CSP ('nonce-aem' + 'strict-dynamic') blocks Cloudflare's automatic edge injection,
 * so the beacon is added by this nonce'd script instead. Load it from head.html:
 *   <script nonce="aem" src="/scripts/cf-web-analytics.js" type="module"></script>
 * Cloudflare Web Analytics has no custom events: WebMCP tool calls are logged by the
 * /__webmcp beacon (D1 / Google Sheet) instead.
 */
const CF_BEACON_TOKEN = '<token from Cloudflare → Web Analytics → Manage site → JS snippet>';

if (!CF_BEACON_TOKEN.startsWith('<')) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: CF_BEACON_TOKEN });
  document.head.append(script);
}
