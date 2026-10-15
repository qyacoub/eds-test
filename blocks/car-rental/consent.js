/* Cookie banner with "Accept all" and a settings panel for optional categories. */
import { el, beacon } from './util.js';

const KEY = 'car-rental-consent';
const CATEGORIES = [
  {
    id: 'necessary', name: 'Strictly necessary', text: 'Keep the booking flow working: your search, selected car and security checks.', locked: true,
  },
  { id: 'analytics', name: 'Performance and analytics', text: 'Count visits and see which pages people use, so we can improve them.' },
  { id: 'personal', name: 'Personalisation', text: 'Remember preferences such as recent searches.' },
  { id: 'ads', name: 'Advertising', text: 'Show travel offers on other websites based on your visit.' },
];

function stored() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export const consentChoices = () => stored();

/** Stores the choice, logs it and closes the banner. Used by the banner buttons and agent tools. */
export function saveConsent(choices, via) {
  const record = { ...choices, necessary: true, savedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* private mode */ }
  beacon('car_consent', { success: true, via, args: record });
  document.querySelector('.cr-consent')?.remove();
  return record;
}

export default function showConsent() {
  if (stored() || document.querySelector('.cr-consent')) return;

  const save = saveConsent;

  const settings = el(
    'div',
    {
      class: 'cr-consent-settings', id: 'cr-consent-settings', hidden: true,
    },
    CATEGORIES.map((cat) => el(
      'div',
      { class: 'cr-consent-cat' },
      el(
        'label',
        { class: 'cr-switch' },
        el('input', {
          type: 'checkbox', role: 'switch', name: cat.id, checked: Boolean(cat.locked), disabled: cat.locked,
        }),
        el('span', { class: 'cr-consent-name', text: cat.name }),
        cat.locked ? el('span', { class: 'cr-consent-always', text: 'Always on' }) : null,
      ),
      el('p', { text: cat.text }),
    )),
  );

  const banner = el(
    'section',
    { class: 'cr-consent', 'aria-label': 'Cookie preferences', 'aria-labelledby': 'cr-consent-title' },
    el('h2', { id: 'cr-consent-title', text: 'Cookies on this site' }),
    el('p', { text: 'We use essential cookies to run the booking flow. With your permission we also use optional cookies to measure visits, remember your preferences and tailor offers. You can change your mind at any time.' }),
    settings,
    el(
      'div',
      { class: 'cr-consent-actions' },
      el('button', {
        type: 'button', class: 'button secondary cr-consent-toggle', 'aria-expanded': 'false', 'aria-controls': 'cr-consent-settings', text: 'Manage settings',
      }),
      el('button', {
        type: 'button', class: 'button secondary cr-consent-save', hidden: true, text: 'Save my choices',
      }),
      el('button', { type: 'button', class: 'button primary cr-consent-accept', text: 'Accept all' }),
    ),
  );

  banner.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('cr-consent-toggle')) {
      settings.hidden = !settings.hidden;
      button.setAttribute('aria-expanded', String(!settings.hidden));
      banner.querySelector('.cr-consent-save').hidden = settings.hidden;
      return;
    }
    if (button.classList.contains('cr-consent-accept')) {
      save({ analytics: true, personal: true, ads: true }, 'accept-all');
    } else if (button.classList.contains('cr-consent-save')) {
      const choices = Object.fromEntries(CATEGORIES.filter((c) => !c.locked)
        .map((c) => [c.id, settings.querySelector(`input[name="${c.id}"]`).checked]));
      save(choices, 'custom');
    } else return;
    banner.remove();
  });

  document.body.append(banner);
}
