/* Shared helpers for the car-rental flow: DOM builder, URL state, formatting, beacon. */

export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child);
  });
  return node;
};

export const STEPS = ['search', 'results', 'extras', 'checkout'];
export const SEARCH_KEYS = ['pickup', 'dropoff', 'pickupDate', 'pickupTime', 'dropoffDate', 'dropoffTime', 'driverAge'];

/** Base path of the flow, e.g. /car-rentals, derived from the current page and step. */
export function flowBase(step) {
  const path = window.location.pathname.replace(/\/$/, '');
  return step === 'search' ? path : path.replace(/\/[^/]+$/, '');
}

export function stepUrl(base, step, params) {
  const url = new URL(step === 'search' ? base || '/' : `${base}/${step}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return `${url.pathname}${url.search}`;
}

export const readParams = () => Object.fromEntries(new URLSearchParams(window.location.search));

export const pick = (source, keys) => Object.fromEntries(keys.map((key) => [key, source[key]]));

// --- Dates ------------------------------------------------------------------------------------
export const isoDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

export function parseIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const formatDate = (iso, opts = {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
}) => {
  const date = parseIso(iso);
  return date ? date.toLocaleDateString('en-CA', opts) : '';
};

export const longDate = (date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export function formatTime(value) {
  const [h, m] = String(value || '').split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

export const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

/** Rental length in days: every started 24 h counts as a day (min 1). */
export function rentalDays(p) {
  const start = parseIso(p.pickupDate);
  const end = parseIso(p.dropoffDate);
  if (!start || !end) return 0;
  const [sh, sm] = (p.pickupTime || '10:00').split(':').map(Number);
  const [eh, em] = (p.dropoffTime || '10:00').split(':').map(Number);
  start.setHours(sh, sm);
  end.setHours(eh, em);
  const hours = (end - start) / 36e5;
  if (hours <= 0) return 0;
  return Math.max(1, Math.ceil(hours / 24 - 1 / 60));
}

export const money = (amount) => new Intl.NumberFormat('en-CA', {
  style: 'currency', currency: 'CAD', currencyDisplay: 'code',
}).format(amount).replace(/\u00a0/g, ' ');

// --- Beacon (same /__webmcp endpoint and payload shape as the visit-form block) --------------
const SESSION_KEY = 'car-rental-session';

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-session-storage';
  }
}

export function beacon(event, data = {}) {
  const body = JSON.stringify({
    event,
    session: sessionId(),
    page: window.location.pathname,
    clientTime: new Date().toISOString(),
    ...data,
    args: data.args === undefined ? undefined : JSON.stringify(data.args).slice(0, 1000),
    client: {
      ua: navigator.userAgent,
      platform: navigator.userAgentData?.platform || navigator.platform,
      webdriver: navigator.webdriver === true,
      languages: navigator.languages?.join(','),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      documentModelContext: 'modelContext' in document,
      navigatorModelContext: 'modelContext' in navigator,
      referrer: document.referrer || undefined,
    },
  });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon('/__webmcp', blob)) return;
  } catch { /* fall through */ }
  fetch('/__webmcp', {
    method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' },
  }).catch(() => {});
}

// --- Small shared UI ---------------------------------------------------------------------------
export function field({
  id, label, control, hint, error = true,
}) {
  return el(
    'div',
    { class: 'cr-field' },
    el('label', { for: id, text: label }),
    control,
    hint ? el('p', { class: 'cr-hint', id: `${id}-hint`, text: hint }) : null,
    error ? el('p', { class: 'cr-error', id: `${id}-error`, 'aria-live': 'polite' }) : null,
  );
}

export function setError(root, id, message) {
  const input = root.querySelector(`#${id}`);
  const error = root.querySelector(`#${id}-error`);
  if (error) error.textContent = message || '';
  if (!input) return;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${id}-error`);
  } else {
    input.removeAttribute('aria-invalid');
  }
}

export function stepper(current) {
  const labels = {
    search: 'Search', results: 'Choose a car', extras: 'Protection & extras', checkout: 'Driver & payment',
  };
  const index = STEPS.indexOf(current);
  return el(
    'ol',
    { class: 'cr-stepper', 'aria-label': 'Booking progress' },
    STEPS.map((step, i) => el(
      'li',
      {
        class: ['done', 'current', ''][Math.sign(i - index) + 1],
        'aria-current': i === index ? 'step' : undefined,
      },
      el('span', { class: 'cr-stepper-num', text: String(i + 1) }),
      el('span', { text: labels[step] }),
    )),
  );
}

export function spinner(text) {
  return el('div', { class: 'cr-loading', role: 'status' }, el('span', { class: 'cr-spinner', 'aria-hidden': 'true' }), el('p', { text }));
}

export const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
