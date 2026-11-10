/*
 * Shared helpers for the agent test pages (branch-details, consent-lab, lab-tabs, lab-reviews,
 * lab-fleet): run code from ?ref=, value decoding, and the /__webmcp beacon.
 */
const SESSION_KEY = 'agent-lab-session';
const started = performance.now();

export const ref = () => (new URLSearchParams(window.location.search).get('ref') || '').slice(0, 32);

// Values are stored reversed and base64-encoded:
// reading the JS without running it doesn't reveal them.
export const decode = (value) => new TextDecoder().decode(
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0)).reverse(),
);

export const secondsOnPage = () => Math.round((performance.now() - started) / 1000);

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-session-storage';
  }
}

export function beacon(event, args = {}, extra = {}) {
  const body = JSON.stringify({
    event,
    session: sessionId(),
    page: window.location.pathname,
    via: ref(),
    durationMs: performance.now() - started,
    ...extra,
    args: JSON.stringify({ ref: ref(), ...args }).slice(0, 1000),
    client: {
      ua: navigator.userAgent,
      platform: navigator.userAgentData?.platform || navigator.platform,
      webdriver: navigator.webdriver === true,
      languages: navigator.languages?.join(','),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer || undefined,
    },
  });
  try {
    if (navigator.sendBeacon?.('/__webmcp', new Blob([body], { type: 'application/json' }))) return;
  } catch { /* fall through */ }
  fetch('/__webmcp', {
    method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' },
  }).catch(() => {});
}

// One beacon when the page is left: how long, how far down, plus block-specific state.
export function onLeave(event, state = () => ({})) {
  window.addEventListener('pagehide', () => {
    beacon(event, { seconds: secondsOnPage(), scrollY: Math.round(window.scrollY), ...state() });
  }, { once: true });
}

export const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
