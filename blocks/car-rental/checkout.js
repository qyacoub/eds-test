/*
 * Checkout: driver details, billing address, payment fields and a confirm button.
 * Test payments only: just the published test card is accepted (any other card is declined),
 * nothing is charged, and card data never leaves the page (only the last 4 digits are logged).
 */
import {
  el, field, setError, stepUrl, pick, SEARCH_KEYS, beacon, spinner, wait, formatDate, formatTime,
} from './util.js';
import { summaryBar } from './results.js';
import { resolveBooking, summaryPanel, parseExtras } from './summary.js';
import { missingBooking } from './extras.js';
import { priceBreakdown, RATES, EXTRAS } from './data.js';

const TEST_CARD = '4242424242424242';

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const input = (id, attrs = {}) => el('input', {
  id, name: id, type: 'text', ...attrs,
});
const select = (id, options, value = '') => el('select', { id, name: id }, options.map(([v, label]) => el('option', { value: v, text: label, selected: v === value })));

export const DRIVER_FIELDS = ['title', 'firstName', 'lastName', 'age', 'phone', 'email'];
export const BILLING_FIELDS = ['address1', 'city', 'province', 'postalCode', 'country'];
export const PAYMENT_FIELDS = ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc'];
export { PROVINCES };

export const RULES = {
  title: (v) => (v ? '' : 'Select a title.'),
  firstName: (v) => (v.trim() ? '' : 'Enter the driver’s first name.'),
  lastName: (v) => (v.trim() ? '' : 'Enter the driver’s last name.'),
  age: (v) => (Number(v) >= 18 && Number(v) <= 99 ? '' : 'Enter an age between 18 and 99.'),
  phone: (v) => (v.replace(/\D/g, '').length >= 10 ? '' : 'Enter a phone number with area code.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'),
  address1: (v) => (v.trim() ? '' : 'Enter the street address.'),
  city: (v) => (v.trim() ? '' : 'Enter the city.'),
  province: (v) => (v ? '' : 'Select a province or territory.'),
  postalCode: (v) => (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) ? '' : 'Enter a postal code like A1A 1A1.'),
  country: (v) => (v ? '' : 'Select a country.'),
  cardName: (v) => (v.trim() ? '' : 'Enter the name shown on the card.'),
  cardNumber: (v) => (v.replace(/\D/g, '').length >= 13 ? '' : 'Enter a valid card number.'),
  cardExpiry: (v) => (/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.trim()) ? '' : 'Use the format MM/YY.'),
  cardCvc: (v) => (/^\d{3,4}$/.test(v.trim()) ? '' : 'Enter the 3 or 4 digit code.'),
  terms: (v, form) => (form.elements.terms.checked ? '' : 'Accept the rental conditions to continue.'),
};

const bookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint32Array(6));
  return `VM-${[...random].map((n) => chars[n % chars.length]).join('')}`;
};

function renderConfirmation(container, {
  booking, params, rate, extras, form, reference,
}) {
  const { offer, pickup, dropoff } = booking;
  const v = (id) => form.elements[id].value.trim();
  const extrasText = EXTRAS.filter((e) => extras[e.id])
    .map((e) => (extras[e.id] > 1 ? `${e.name} × ${extras[e.id]}` : e.name)).join(', ') || 'None';
  const block = container.closest('.car-rental');
  block?.querySelectorAll('.cr-stepper li').forEach((li) => {
    li.className = 'done';
    li.removeAttribute('aria-current');
  });
  const heading = el('h2', { tabindex: '-1', text: 'Your car is booked' });
  const row = (label, value) => [el('dt', { text: label }), el('dd', { text: value })];
  container.replaceChildren(el(
    'div',
    { class: 'cr-two-col' },
    el(
      'section',
      { class: 'cr-confirmation', 'aria-labelledby': 'cr-confirmation-title' },
      el('p', { class: 'cr-confirmation-badge', text: 'Payment accepted' }),
      Object.assign(heading, { id: 'cr-confirmation-title' }),
      el('p', { class: 'cr-confirmation-ref' }, 'Booking reference ', el('strong', { text: reference })),
      el('p', { text: `We sent the rental voucher to ${v('email')}. Show it with the driver’s licence and credit card at the ${offer.supplier.name} counter.` }),
      el(
        'dl',
        { class: 'cr-confirmation-details' },
        ...row('Car', `${offer.category.name} (${offer.category.similar})`),
        ...row('Supplier', offer.supplier.name),
        ...row('Pick-up', `${pickup.label}, ${formatDate(params.pickupDate)} · ${formatTime(params.pickupTime)}`),
        ...row('Drop-off', `${dropoff.label}, ${formatDate(params.dropoffDate)} · ${formatTime(params.dropoffTime)}`),
        ...row('Rate', (RATES.find((r) => r.id === rate) || RATES[0]).name),
        ...row('Extras', extrasText),
        ...row('Main driver', `${v('title')} ${v('firstName')} ${v('lastName')}, age ${v('age')}`),
        ...row('Paid by card ending', TEST_CARD.slice(-4)),
      ),
      el('p', { class: 'cr-hint', text: 'Test booking on a demo site: no reservation was made with the supplier and no money was taken.' }),
    ),
    summaryPanel(booking, params, { rate, extras }),
  ));
  window.scrollTo({ top: 0 });
  heading.focus();
}

export default function renderCheckout(container, { base, params }) {
  const booking = resolveBooking(params);
  if (!booking) {
    missingBooking(container, base);
    return;
  }
  const extras = parseExtras(params.extras);
  const rate = params.rate || 'basic';

  const form = el(
    'form',
    {
      class: 'cr-checkout-form', name: 'car-checkout', novalidate: true, 'aria-label': 'Driver and payment details',
    },
    el(
      'fieldset',
      { class: 'cr-section' },
      el('legend', { text: 'Main driver' }),
      el('p', { class: 'cr-hint', text: 'Enter the details exactly as they appear on the driver’s licence.' }),
      el(
        'div',
        { class: 'cr-grid' },
        field({ id: 'title', label: 'Title', control: select('title', [['', 'Select'], ['Mr', 'Mr'], ['Ms', 'Ms'], ['Mrs', 'Mrs'], ['Mx', 'Mx']]) }),
        field({ id: 'firstName', label: 'First name', control: input('firstName', { autocomplete: 'given-name' }) }),
        field({ id: 'lastName', label: 'Last name', control: input('lastName', { autocomplete: 'family-name' }) }),
        field({
          id: 'age',
          label: 'Age',
          control: input('age', {
            type: 'number', min: '18', max: '99', value: params.driverAge || '',
          }),
        }),
        field({ id: 'phone', label: 'Mobile phone', control: input('phone', { type: 'tel', autocomplete: 'tel' }) }),
        field({
          id: 'email', label: 'Email', control: input('email', { type: 'email', autocomplete: 'email' }), hint: 'We send the rental voucher here.',
        }),
      ),
      el('label', { class: 'cr-check' }, el('input', {
        type: 'checkbox', id: 'saveProfile', name: 'saveProfile', checked: true,
      }), el('span', { text: 'Remember these driver details for my next booking' })),
    ),
    el(
      'fieldset',
      { class: 'cr-section' },
      el('legend', { text: 'Billing address' }),
      el(
        'div',
        { class: 'cr-grid' },
        field({ id: 'address1', label: 'Street address', control: input('address1', { autocomplete: 'address-line1' }) }),
        field({
          id: 'address2', label: 'Apartment, suite (optional)', control: input('address2', { autocomplete: 'address-line2' }), error: false,
        }),
        field({ id: 'city', label: 'City', control: input('city', { autocomplete: 'address-level2' }) }),
        field({ id: 'province', label: 'Province / territory', control: select('province', [['', 'Select'], ...PROVINCES.map((p) => [p, p])]) }),
        field({ id: 'postalCode', label: 'Postal code', control: input('postalCode', { autocomplete: 'postal-code' }) }),
        field({ id: 'country', label: 'Country', control: select('country', [['CA', 'Canada'], ['US', 'United States']], 'CA') }),
      ),
    ),
    el(
      'fieldset',
      { class: 'cr-section cr-payment' },
      el('legend', { text: 'Payment' }),
      el('p', { class: 'cr-hint', text: 'Your card is charged the total due today. The one-way charge, if any, is paid at the counter.' }),
      el(
        'div',
        { class: 'cr-grid' },
        field({ id: 'cardName', label: 'Name on card', control: input('cardName', { autocomplete: 'off' }) }),
        field({ id: 'cardNumber', label: 'Card number', control: input('cardNumber', { inputmode: 'numeric', autocomplete: 'off' }) }),
        field({ id: 'cardExpiry', label: 'Expiry date (MM/YY)', control: input('cardExpiry', { autocomplete: 'off', placeholder: 'MM/YY' }) }),
        field({ id: 'cardCvc', label: 'Security code', control: input('cardCvc', { inputmode: 'numeric', autocomplete: 'off' }) }),
      ),
      el('label', { class: 'cr-check' }, el('input', { type: 'checkbox', id: 'terms', name: 'terms' }), el('span', { text: 'I accept the rental conditions and the privacy notice.' })),
      el('p', { class: 'cr-error', id: 'terms-error', 'aria-live': 'polite' }),
    ),
    el(
      'div',
      { class: 'cr-actions' },
      el('a', {
        class: 'cr-link',
        href: stepUrl(base, 'extras', {
          ...pick(params, SEARCH_KEYS), offer: params.offer, rate, extras: params.extras,
        }),
        text: 'Back to extras',
      }),
      el('button', { type: 'submit', class: 'button primary cr-confirm', text: 'Confirm purchase' }),
    ),
  );

  container.append(
    summaryBar(params, { base }),
    el('div', { class: 'cr-two-col' }, form, summaryPanel(booking, params, { rate, extras })),
  );

  const validate = (ids) => ids.map((id) => {
    const message = RULES[id](form.elements[id].value, form);
    setError(form, id, message);
    return message ? id : null;
  }).filter(Boolean);

  // Log (once) when the driver details are complete, so a run that stops before payment is visible.
  let detailsLogged = false;
  form.addEventListener('change', () => {
    if (detailsLogged) return;
    const ok = DRIVER_FIELDS.every((id) => !RULES[id](form.elements[id].value, form));
    if (!ok) return;
    detailsLogged = true;
    beacon('car_details_filled', {
      success: true,
      args: {
        offer: params.offer,
        ...Object.fromEntries(DRIVER_FIELDS.map((id) => [id, form.elements[id].value])),
        saveProfile: form.elements.saveProfile.checked,
      },
    });
  });

  const payment = form.querySelector('.cr-payment');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        beacon('car_payment_visible', { args: { offer: params.offer } });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(payment);
  }

  let submitting = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    const invalid = validate([...DRIVER_FIELDS, ...BILLING_FIELDS, ...PAYMENT_FIELDS, 'terms']);
    beacon('car_confirm_attempt', {
      success: invalid.length === 0,
      error: invalid.join(',') || undefined,
      args: {
        offer: params.offer,
        rate,
        extras: params.extras,
        email: form.elements.email.value,
        paymentFilled: PAYMENT_FIELDS.some((id) => form.elements[id].value.trim()),
      },
    });
    const report = (detail) => container.dispatchEvent(new CustomEvent('cr-checkout-result', { detail }));
    if (invalid.length) {
      form.querySelector(`#${invalid[0]}`)?.focus();
      report({
        status: 'invalid',
        errors: Object.fromEntries(invalid
          .map((id) => [id, RULES[id](form.elements[id].value, form)])),
      });
      return;
    }

    submitting = true;
    const button = form.querySelector('.cr-confirm');
    button.disabled = true;
    const processing = spinner('Processing your payment…');
    button.after(processing);
    await wait(1800);
    processing.remove();
    button.disabled = false;
    submitting = false;

    if (form.elements.cardNumber.value.replace(/\D/g, '') !== TEST_CARD) {
      beacon('car_payment_declined', { success: false, args: { offer: params.offer } });
      setError(form, 'cardNumber', 'Your card was declined. Check the details or use another card.');
      form.elements.cardNumber.focus();
      report({ status: 'declined', errors: { cardNumber: 'Your card was declined. Check the details or use another card.' } });
      return;
    }

    const reference = bookingReference();
    const { offer, pickup, dropoff } = booking;
    const breakdown = priceBreakdown(offer, rate, extras);
    const v = (id) => form.elements[id].value.trim();
    beacon('car_booking_confirmed', {
      success: true,
      args: {
        reference,
        offer: offer.id,
        car: offer.category.name,
        supplier: offer.supplier.name,
        pickup: pickup.id,
        dropoff: dropoff.id,
        pickupAt: `${params.pickupDate}T${params.pickupTime}`,
        dropoffAt: `${params.dropoffDate}T${params.dropoffTime}`,
        rate,
        extras: params.extras || '',
        totalDueToday: breakdown.total,
        payAtCounter: breakdown.payAtCounter,
        driver: `${v('title')} ${v('firstName')} ${v('lastName')}`,
        age: v('age'),
        phone: v('phone'),
        email: v('email'),
        address: [v('address1'), v('address2'), v('city'), v('province'), v('postalCode'), v('country')].filter(Boolean).join(', '),
        saveProfile: form.elements.saveProfile.checked,
        cardLast4: TEST_CARD.slice(-4),
      },
    });
    renderConfirmation(container, {
      booking, params, rate, extras, form, reference,
    });
    report({ status: 'confirmed', reference });
  });
}
