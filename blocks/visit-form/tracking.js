/*
 * Agent tracking for the WebMCP form test.
 * - One /__webmcp beacon row per page load (does this browser expose a WebMCP host?)
 *   and per tool call (which tool, how it was called, result).
 * - Matomo events, only if Matomo is added later (Cloudflare Web Analytics has no events).
 * - Tags the submit request with the session and what triggered it (WebMCP tool or page button).
 */
const BEACON_URL = '/__webmcp';
const MAX_TEXT = 600;

const randomId = () => (crypto.randomUUID ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const SESSION_ID = randomId();

const truncate = (value) => {
  if (value === undefined) return undefined;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text && text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
};

function clientHints() {
  const uaData = navigator.userAgentData;
  return {
    ua: navigator.userAgent,
    platform: uaData?.platform || navigator.platform,
    mobile: uaData?.mobile,
    webdriver: navigator.webdriver === true,
    languages: navigator.languages?.join(','),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen?.width}x${window.screen?.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    hasFocus: document.hasFocus(),
    visibility: document.visibilityState,
    userActivation: navigator.userActivation?.isActive,
    documentModelContext: 'modelContext' in document,
    navigatorModelContext: 'modelContext' in navigator,
    modelContextTesting: 'modelContextTesting' in navigator,
    referrer: document.referrer || undefined,
  };
}

function sendBeacon(event, data = {}) {
  const body = JSON.stringify({
    event,
    session: SESSION_ID,
    page: window.location.pathname,
    clientTime: new Date().toISOString(),
    ...data,
    client: clientHints(),
  });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon(BEACON_URL, blob)) return;
  } catch { /* fall through to fetch */ }
  fetch(BEACON_URL, {
    method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' },
  }).catch(() => {});
}

function matomoEvent(action, name, value) {
  // eslint-disable-next-line no-underscore-dangle
  const paq = window._paq;
  if (Array.isArray(paq) || paq?.push) paq.push(['trackEvent', 'WebMCP', action, name, value]);
}

// --- How was a tool called? ------------------------------------------------------------------
// A browser's native WebMCP integration invokes execute() itself, with no page JavaScript involved.
// A page script (DevTools, CDP evaluate, an injected helper) must go through
// document.modelContext.executeTool() or navigator.modelContextTesting.executeTool(); Chrome then
// runs execute() asynchronously, so the stack is empty. We therefore wrap both executeTool entry
// points in the page's main world and flag the matching call. Any remaining foreign stack frames
// (a script calling execute() directly) are also flagged. These are hints, not proof: a script that
// captured executeTool before this block loaded, or a host using an extension's isolated world,
// is reported as browser-integration.
// Our tracking code and the official af-webmcp code (round 1 bundle, round 2 forms block).
const OWN_FILES = /\/blocks\/visit-form\/|\/blocks\/car-rental\/|af-webmcp\.bundle|\/blocks\/form\/|\/scripts\/form-agent-tracking/;
const SCRIPT_CALL_WINDOW_MS = 5000;
const scriptCalls = [];

function wrapExecuteTool(target, route, nameOf) {
  if (!target || typeof target.executeTool !== 'function' || target.executeTool.webmcpWrapped) return;
  const original = target.executeTool;
  const wrapped = function executeTool(tool, ...rest) {
    scriptCalls.push({ name: nameOf(tool), route, at: performance.now() });
    return original.call(this, tool, ...rest);
  };
  wrapped.webmcpWrapped = true;
  try {
    Object.defineProperty(target, 'executeTool', { value: wrapped, configurable: true, writable: true });
  } catch { /* non-configurable in some builds */ }
}

export function wrapScriptEntryPoints() {
  const toolName = (tool) => (typeof tool === 'string' ? tool : tool?.name);
  [document.modelContext, navigator.modelContext].filter(Boolean).forEach((context) => {
    wrapExecuteTool(Object.getPrototypeOf(context), 'executeTool', toolName);
    wrapExecuteTool(context, 'executeTool', toolName);
  });
  wrapExecuteTool(navigator.modelContextTesting, 'modelContextTesting', toolName);
}

export function callOrigin(toolName) {
  const now = performance.now();
  while (scriptCalls.length && now - scriptCalls[0].at > SCRIPT_CALL_WINDOW_MS) scriptCalls.shift();
  const index = scriptCalls.findIndex((c) => c.name === toolName);
  const frames = (new Error().stack || '').split('\n').slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !OWN_FILES.test(line));
  const stack = frames.length ? truncate(frames.slice(0, 6).join(' | ')) : undefined;
  if (index >= 0) {
    const [call] = scriptCalls.splice(index, 1);
    return { via: 'page-script', route: call.route, stack };
  }
  if (frames.length > 0) return { via: 'page-script', route: 'direct-execute', stack };
  return { via: 'browser-integration', route: 'native', stack };
}

// --- Submission tagging -----------------------------------------------------------------------
let pendingSubmitVia = null;
export function markSubmitVia(via) { pendingSubmitVia = via; }

function tagSubmitRequests(submitPath, { defaultSubmitVia = 'unknown', reportFromFetch = false } = {}) {
  if (window.fetch.webmcpTagged) return;
  const originalFetch = window.fetch.bind(window);
  const tagged = (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    if (url.origin === window.location.origin && url.pathname === submitPath) {
      const headers = new Headers(init.headers || (typeof input === 'string' ? undefined : input.headers));
      headers.set('x-webmcp-session', SESSION_ID);
      const via = pendingSubmitVia || defaultSubmitVia;
      headers.set('x-submit-via', via);
      pendingSubmitVia = null;
      const request = originalFetch(input, { ...init, headers });
      // Round 2: the official forms block owns submission, so report it from the response.
      if (reportFromFetch) {
        request.then((res) => res.clone().json().catch(() => ({})).then((body) => {
          // eslint-disable-next-line no-use-before-define
          reportSubmitOutcome({ via, success: res.ok, reference: body?.reference });
        })).catch(() => {
          // eslint-disable-next-line no-use-before-define
          reportSubmitOutcome({ via, success: false, error: 'network' });
        });
      }
      return request;
    }
    return originalFetch(input, init);
  };
  tagged.webmcpTagged = true;
  window.fetch = tagged;
}

// --- modelContext proxy -----------------------------------------------------------------------
/**
 * Returns a modelContext that forwards registrations to the native host, wrapping each tool's
 * execute() so every call is reported. Tool names, descriptions and schemas are untouched.
 */
export function trackingModelContext(nativeContext) {
  return {
    registerTool(tool, options) {
      const wrapped = {
        ...tool,
        async execute(args, ...rest) {
          const started = performance.now();
          const origin = callOrigin(tool.name);
          if (tool.name === 'submit_form') markSubmitVia('webmcp');
          let result;
          let error;
          try {
            result = await tool.execute.call(this, args, ...rest);
            return result;
          } catch (e) {
            error = e;
            throw e;
          } finally {
            const ok = !error && result?.success !== false;
            sendBeacon('tool_call', {
              tool: tool.name,
              via: origin.via,
              route: origin.route,
              stack: origin.stack,
              args: truncate(args),
              success: ok,
              error: truncate(error ? String(error.message || error) : result?.error),
              durationMs: Math.round(performance.now() - started),
            });
            matomoEvent(tool.name, origin.via, ok ? 1 : 0);
          }
        },
      };
      return nativeContext.registerTool(wrapped, options);
    },
    ...(typeof nativeContext.unregisterTool === 'function'
      ? { unregisterTool: (name) => nativeContext.unregisterTool(name) } : {}),
  };
}

export function nativeModelContext() {
  return document.modelContext || navigator.modelContext || null;
}

export function initTracking({
  submitPath, formId, defaultSubmitVia, reportFromFetch,
}) {
  wrapScriptEntryPoints();
  tagSubmitRequests(submitPath, { defaultSubmitVia, reportFromFetch });
  const host = nativeModelContext();
  sendBeacon('page_load', { formId, webmcpHost: host ? 'native' : 'none' });
  matomoEvent('page_load', host ? 'native-host' : 'no-host');
}

export function reportSubmitOutcome(outcome) {
  sendBeacon('submit_outcome', outcome);
  matomoEvent('submit_outcome', outcome.via || 'unknown', outcome.success ? 1 : 0);
}
