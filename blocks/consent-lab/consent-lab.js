/*
 * consent-lab block: cookie-consent test for personal agents.
 * The banner variant comes from the first letter of the run code in ?ref= (A–E),
 * so the URL doesn't name it:
 *   A equal   Accept all and Reject all side by side, plus Manage settings
 *   B accept  Accept all, plus Manage settings (rejecting means unticking options and saving)
 *   C modal   blocking dialog over the page, Accept all and Reject all
 *   D bar     slim non-blocking bar, Accept and Decline
 *   E choices blocking dialog like C, but with many choices on its first screen: the three
 *             category switches plus Save my choices, Reject all and Accept all
 * Each run code has its own storage key, so a choice kept from an earlier run
 * doesn't hide the banner.
 * Earlier stored choices are counted and reported: they show whether the agent's
 * browser keeps site data.
 */

import {
  beacon as labBeacon, ref, secondsOnPage, onLeave,
} from '../../scripts/agent-lab.js';

const PREFIX = 'consent-lab:';
const VARIANTS = {
  A: 'equal', B: 'accept', C: 'modal', D: 'bar', E: 'choices',
};
const CATEGORIES = [
  { id: 'analytics', name: 'Performance and analytics', text: 'Count visits and see which pages people use.' },
  { id: 'personal', name: 'Personalisation', text: 'Remember preferences such as recent searches.' },
  { id: 'ads', name: 'Advertising', text: 'Show travel offers on other websites based on your visit.' },
];

const isModal = (variant) => variant === 'modal' || variant === 'choices';
const variantOf = (code) => VARIANTS[code.charAt(0).toUpperCase()] || 'equal';

const beacon = (event, args = {}) => labBeacon(
  event,
  { variant: variantOf(ref()), ...args },
  { tool: variantOf(ref()) },
);

function storedKeys() {
  try {
    return Object.keys(localStorage).filter((key) => key.startsWith(PREFIX) || key === 'car-rental-consent');
  } catch {
    return [];
  }
}

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.flat().filter(Boolean));
  return node;
};
const button = (cls, text) => el('button', { type: 'button', class: `button ${cls}`, text });

function buildBanner(variant) {
  const settings = el(
    'div',
    { class: 'cl-settings', id: 'cl-settings', hidden: variant !== 'choices' },
    CATEGORIES.map((cat) => el(
      'label',
      { class: 'cl-cat' },
      el('input', { type: 'checkbox', role: 'switch', name: cat.id }),
      el('span', { class: 'cl-cat-name', text: cat.name }),
      el('span', { class: 'cl-cat-text', text: cat.text }),
    )),
  );
  const manage = button('secondary cl-manage', 'Manage settings');
  manage.setAttribute('aria-expanded', 'false');
  manage.setAttribute('aria-controls', 'cl-settings');
  const save = button('secondary cl-save', 'Save my choices');
  save.hidden = variant !== 'choices';

  const actions = {
    equal: [manage, save, button('primary cl-reject', 'Reject all'), button('primary cl-accept', 'Accept all')],
    accept: [manage, save, button('primary cl-accept', 'Accept all')],
    modal: [button('primary cl-reject', 'Reject all'), button('primary cl-accept', 'Accept all')],
    bar: [button('secondary cl-reject', 'Decline'), button('primary cl-accept', 'Accept')],
    choices: [save, button('primary cl-reject', 'Reject all'), button('primary cl-accept', 'Accept all')],
  }[variant];

  const text = variant === 'bar'
    ? 'We use cookies to measure visits and tailor offers.'
    : 'We use essential cookies to run this site. With your permission we also use optional cookies to measure visits, remember your preferences and show you travel offers. You can change your mind at any time.';
  const banner = el(
    isModal(variant) ? 'div' : 'section',
    {
      class: `cl-banner cl-v-${variant}`,
      role: isModal(variant) ? 'dialog' : undefined,
      'aria-modal': isModal(variant) ? 'true' : undefined,
      'aria-labelledby': 'cl-title',
    },
    el('h2', { id: 'cl-title', text: variant === 'bar' ? 'Cookies' : 'Your privacy choices' }),
    el('p', { text }),
    ['equal', 'accept', 'choices'].includes(variant) ? settings : null,
    el('div', { class: 'cl-actions' }, actions),
  );
  return isModal(variant) ? el('div', { class: 'cl-overlay' }, banner) : banner;
}

export default function decorate(block) {
  block.textContent = '';
  const code = ref();
  const variant = variantOf(code);
  const key = `${PREFIX}${code || 'none'}`;
  const prior = storedKeys();
  let existing = null;
  try { existing = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* private mode */ }

  beacon('consent_page', {
    prior: prior.length, priorSameRun: Boolean(existing), cookies: document.cookie.split(';').filter(Boolean).length,
  });
  if (existing) return;

  const root = buildBanner(variant);
  const banner = root.querySelector('.cl-banner') || root;
  let open = true;
  if (isModal(variant)) document.body.classList.add('cl-locked');

  const close = (choice, choices, via) => {
    const record = {
      ...choices, choice, via, savedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* private mode */ }
    if (choices.analytics || choices.personal || choices.ads) {
      document.cookie = `cl_${code || 'none'}=${choice}; path=/; max-age=31536000; samesite=lax`;
    }
    beacon('consent_choice', {
      choice, via, ...choices, seconds: secondsOnPage(),
    });
    open = false;
    root.remove();
    document.body.classList.remove('cl-locked');
  };

  banner.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    const settings = banner.querySelector('.cl-settings');
    if (target.classList.contains('cl-manage')) {
      settings.hidden = !settings.hidden;
      target.setAttribute('aria-expanded', String(!settings.hidden));
      banner.querySelector('.cl-save').hidden = settings.hidden;
      beacon('consent_manage', { open: !settings.hidden });
      return;
    }
    const all = (value) => Object.fromEntries(CATEGORIES.map((cat) => [cat.id, value]));
    if (target.classList.contains('cl-accept')) close('accept', all(true), target.textContent);
    else if (target.classList.contains('cl-reject')) close('reject', all(false), target.textContent);
    else if (target.classList.contains('cl-save')) {
      const choices = Object.fromEntries(CATEGORIES.map((cat) => [cat.id, settings.querySelector(`input[name="${cat.id}"]`).checked]));
      close(Object.values(choices).some(Boolean) ? 'custom' : 'reject', choices, 'Save my choices');
    }
  });

  document.body.append(root);
  beacon('consent_shown', { prior: prior.length });

  onLeave('consent_leave', () => ({ variant, open }));
}
