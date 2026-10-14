/* Shared booking context: resolve the chosen offer from the URL, and the price summary panel. */
import {
  el, formatDate, formatTime, money, rentalDays,
} from './util.js';
import {
  findLocation, buildOffers, priceBreakdown, RATES, EXTRAS,
} from './data.js';

export function resolveBooking(params) {
  const pickup = findLocation(params.pickup);
  const dropoff = findLocation(params.dropoff) || pickup;
  const days = rentalDays(params);
  if (!pickup || !days) return null;
  const offer = buildOffers({ pickup, dropoff, days }).find((o) => o.id === params.offer);
  if (!offer) return null;
  return {
    pickup, dropoff, days, offer,
  };
}

/** extras=childSeat:1,gps:1 <-> { childSeat: 1, gps: 1 } */
export const parseExtras = (value) => Object.fromEntries(String(value || '')
  .split(',')
  .map((pair) => pair.split(':'))
  .filter(([id, qty]) => EXTRAS.some((e) => e.id === id) && Number(qty) > 0)
  .map(([id, qty]) => [id, Number(qty)]));

export const serializeExtras = (extras) => Object.entries(extras)
  .filter(([, qty]) => Number(qty) > 0)
  .map(([id, qty]) => `${id}:${qty}`)
  .join(',');

export function summaryPanel(booking, params, { rate = 'basic', extras = {} } = {}) {
  const { offer, pickup, dropoff } = booking;
  const breakdown = priceBreakdown(offer, rate, extras);
  const rateInfo = RATES.find((r) => r.id === rate) || RATES[0];
  return el(
    'aside',
    { class: 'cr-booking-summary', 'aria-label': 'Your booking' },
    el('h2', { text: 'Your booking' }),
    el(
      'div',
      { class: 'cr-summary-car' },
      el('p', { class: 'cr-offer-size', text: offer.category.size }),
      el('p', { class: 'cr-summary-title', text: offer.category.name }),
      el('p', { class: 'cr-offer-similar', text: `${offer.category.similar} · ${offer.supplier.name}` }),
    ),
    el(
      'dl',
      { class: 'cr-summary-where' },
      el('dt', { text: 'Pick-up' }),
      el('dd', { text: pickup.label }),
      el('dd', { class: 'cr-when', text: `${formatDate(params.pickupDate)} · ${formatTime(params.pickupTime)}` }),
      el('dt', { text: 'Drop-off' }),
      el('dd', { text: dropoff.label }),
      el('dd', { class: 'cr-when', text: `${formatDate(params.dropoffDate)} · ${formatTime(params.dropoffTime)}` }),
      el('dt', { text: 'Rate' }),
      el('dd', { text: rateInfo.name }),
    ),
    el(
      'table',
      { class: 'cr-price-table' },
      el('tbody', {}, breakdown.lines.map((line) => el('tr', {}, el('th', { scope: 'row', text: line.label }), el('td', { text: money(line.amount) })))),
      el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', text: 'Total due today' }), el('td', { text: money(breakdown.total) }))),
    ),
    breakdown.payAtCounter ? el('p', { class: 'cr-counter-fee', text: `Plus ${money(breakdown.payAtCounter)} one-way charge, paid to ${offer.supplier.name} at pick-up.` }) : null,
  );
}
