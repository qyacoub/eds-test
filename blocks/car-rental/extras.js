/* Extras: rate choice (basic / carefree) and optional add-ons, with a live price summary. */
import {
  el, stepUrl, pick, SEARCH_KEYS, money, beacon,
} from './util.js';
import { RATES, EXTRAS, TAX_RATE } from './data.js';
import { offerVisual, summaryBar } from './results.js';
import {
  resolveBooking, summaryPanel, parseExtras, serializeExtras,
} from './summary.js';

export function missingBooking(container, base) {
  container.append(el(
    'div',
    { class: 'cr-empty-state' },
    el('p', { text: 'We could not find the car you selected. It may no longer be available for these dates.' }),
    el('a', { class: 'button primary', href: stepUrl(base, 'search', {}), text: 'Start a new search' }),
  ));
}

export default function renderExtras(container, { base, params }) {
  const booking = resolveBooking(params);
  if (!booking) {
    missingBooking(container, base);
    return;
  }
  const { offer, days } = booking;
  const state = { rate: params.rate || 'basic', extras: parseExtras(params.extras) };

  const rateGroup = el(
    'fieldset',
    { class: 'cr-rates' },
    el('legend', { text: 'Choose your rate' }),
    RATES.map((rate) => el(
      'label',
      { class: 'cr-rate-card' },
      el('input', {
        type: 'radio', name: 'rate', value: rate.id, checked: state.rate === rate.id,
      }),
      el(
        'span',
        { class: 'cr-rate-body' },
        el('span', { class: 'cr-rate-name', text: rate.name }),
        el('span', { class: 'cr-rate-price', text: rate.perDay ? `+ ${money(rate.perDay * (1 + TAX_RATE))} / day` : 'Included' }),
        el('ul', {}, rate.includes.map((item) => el('li', { text: item }))),
      ),
    )),
  );

  const extrasGroup = el(
    'fieldset',
    { class: 'cr-extras' },
    el('legend', { text: 'Optional extras' }),
    el('p', { class: 'cr-hint', text: 'Extras are reserved with the supplier and charged per day.' }),
    EXTRAS.map((extra) => {
      const id = `extra-${extra.id}`;
      return el(
        'div',
        { class: 'cr-extra-row' },
        el('label', { for: id }, el('span', { class: 'cr-extra-name', text: extra.name }), el('span', { class: 'cr-extra-price', text: `${money(extra.perDay)} / day` })),
        el('select', { id, name: extra.id }, Array.from({ length: extra.max + 1 }, (_, qty) => el('option', {
          value: String(qty), text: qty === 0 ? 'None' : String(qty), selected: Number(state.extras[extra.id] || 0) === qty,
        }))),
      );
    }),
  );

  const form = el(
    'form',
    { class: 'cr-extras-form', name: 'car-extras', 'aria-label': 'Protection and extras' },
    el(
      'div',
      { class: 'cr-chosen-car' },
      offerVisual(offer.category),
      el(
        'div',
        {},
        el('h2', { text: `${offer.category.name} · ${offer.supplier.name}` }),
        el('p', { class: 'cr-offer-similar', text: `${offer.category.similar} · ${offer.category.seats} seats · ${offer.transmission} · ${days} day${days > 1 ? 's' : ''}` }),
        el('a', { href: stepUrl(base, 'results', pick(params, SEARCH_KEYS)), class: 'cr-link', text: 'Change car' }),
      ),
    ),
    rateGroup,
    extrasGroup,
    el('div', { class: 'cr-actions' }, el('button', { type: 'submit', class: 'button primary', text: 'Continue to checkout' })),
  );

  let panel = summaryPanel(booking, params, state);
  const layout = el('div', { class: 'cr-two-col' }, form, panel);
  container.append(summaryBar(params, { base }), layout);

  form.addEventListener('change', () => {
    state.rate = form.querySelector('input[name="rate"]:checked')?.value || 'basic';
    EXTRAS.forEach((extra) => { state.extras[extra.id] = Number(form.elements[extra.id].value); });
    const next = summaryPanel(booking, params, state);
    panel.replaceWith(next);
    panel = next;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const extras = serializeExtras(state.extras);
    beacon('car_extras', { success: true, args: { offer: offer.id, rate: state.rate, extras } });
    window.location.assign(stepUrl(base, 'checkout', {
      ...pick(params, SEARCH_KEYS), offer: offer.id, rate: state.rate, extras,
    }));
  });
}
