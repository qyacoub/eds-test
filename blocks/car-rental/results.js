/* Results: summary bar, filters (size, supplier), sort, car cards, one-way fee dialog. */
import {
  el, stepUrl, pick, SEARCH_KEYS, formatDate, formatTime, money, rentalDays, beacon, spinner, wait,
} from './util.js';
import {
  findLocation, buildOffers, SIZES, SUPPLIERS,
} from './data.js';
import renderSearch from './search.js';

const ICONS = {
  seats: 'M7 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm-1 6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v4H6Z M5 16h8v2H5Z',
  bags: 'M6 5V3h6v2h3v12H3V5Zm2 0h2V4H8Z',
  doors: 'M4 2h9l2 3v12H4Z M10 10h2v1h-2Z',
  gear: 'M9 3v12 M4 3v12 M14 3v6H4',
  snow: 'M9 2v14 M3 5l12 8 M15 5 3 13',
};

const icon = (name) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 18 18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cr-icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
};

export function summaryBar(params, { base, onModify } = {}) {
  const pickupLoc = findLocation(params.pickup);
  const dropoffLoc = findLocation(params.dropoff) || pickupLoc;
  const days = rentalDays(params);
  return el(
    'div',
    { class: 'cr-summary-bar' },
    el(
      'dl',
      {},
      el('div', {}, el('dt', { text: 'Pick-up' }), el('dd', { text: pickupLoc?.label || '—' }), el('dd', { class: 'cr-when', text: `${formatDate(params.pickupDate)} · ${formatTime(params.pickupTime)}` })),
      el('div', {}, el('dt', { text: 'Drop-off' }), el('dd', { text: dropoffLoc?.label || '—' }), el('dd', { class: 'cr-when', text: `${formatDate(params.dropoffDate)} · ${formatTime(params.dropoffTime)}` })),
      el('div', {}, el('dt', { text: 'Rental' }), el('dd', { text: `${days} day${days === 1 ? '' : 's'}` }), el('dd', { class: 'cr-when', text: `Driver aged ${params.driverAge || 30}` })),
    ),
    onModify ? el('button', {
      type: 'button', class: 'button secondary cr-modify', text: 'Modify search', onclick: onModify,
    }) : el('a', { class: 'button secondary cr-modify', href: stepUrl(base, 'search', {}), text: 'New search' }),
  );
}

export function offerVisual(category) {
  return el('div', { class: `cr-car-visual cr-car-${category.id}`, 'aria-hidden': 'true' }, el('span', { class: 'cr-car-shape' }));
}

function featureList(offer) {
  const { category } = offer;
  return el(
    'ul',
    { class: 'cr-features' },
    el('li', {}, icon('seats'), `${category.seats} seats`),
    el('li', {}, icon('bags'), `${category.bags} large bag${category.bags > 1 ? 's' : ''}`),
    el('li', {}, icon('doors'), `${category.doors} doors`),
    el('li', {}, icon('gear'), offer.transmission),
    el('li', {}, icon('snow'), 'Air conditioning'),
  );
}

function oneWayDialog(offer, onAccept) {
  const dialog = el(
    'dialog',
    { class: 'cr-dialog', 'aria-labelledby': 'cr-oneway-title' },
    el('h2', { id: 'cr-oneway-title', text: 'Different drop-off location' }),
    el('p', { text: `You are returning this car to a different city. ${offer.supplier.name} adds a one-way charge of ${money(offer.oneWayFee)} for this route.` }),
    el('p', { text: 'This charge is not part of the price you pay online. You settle it directly with the supplier when you collect the car.' }),
    el(
      'div',
      { class: 'cr-dialog-actions' },
      el('button', {
        type: 'button', class: 'button secondary', text: 'Go back', value: 'cancel',
      }),
      el('button', {
        type: 'button', class: 'button primary', text: 'Accept & Continue', value: 'accept',
      }),
    ),
  );
  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    dialog.close(button.value);
  });
  dialog.addEventListener('close', () => {
    beacon('car_oneway_dialog', { success: dialog.returnValue === 'accept', args: { offer: offer.id, fee: offer.oneWayFee } });
    if (dialog.returnValue === 'accept') onAccept();
    dialog.remove();
  });
  document.body.append(dialog);
  dialog.showModal();
}

function offerCard(offer, onSelect) {
  return el(
    'article',
    { class: 'cr-offer', 'data-offer': offer.id, 'data-size': offer.category.size },
    offerVisual(offer.category),
    el(
      'div',
      { class: 'cr-offer-body' },
      el('p', { class: 'cr-offer-size', text: offer.category.size }),
      el('h3', { text: offer.category.name }),
      el('p', { class: 'cr-offer-similar', text: offer.category.similar }),
      featureList(offer),
      el(
        'p',
        { class: 'cr-offer-supplier' },
        el('span', { class: 'cr-supplier-badge', text: offer.supplier.name }),
        el('span', { text: offer.supplier.counter }),
        el('span', { class: 'cr-score', text: `${offer.supplier.score.toFixed(1)} / 10 renter score` }),
      ),
    ),
    el(
      'div',
      { class: 'cr-offer-price' },
      el('p', { class: 'cr-price-day', text: `${money(offer.daily)} / day` }),
      el('p', { class: 'cr-price-total', text: money(offer.total) }),
      el('p', { class: 'cr-price-note', text: `Total for ${offer.days} day${offer.days > 1 ? 's' : ''}, taxes included` }),
      el('button', {
        type: 'button', class: 'button primary cr-select', text: 'Select', 'aria-label': `Select ${offer.category.name} from ${offer.supplier.name}, ${money(offer.total)}`, onclick: () => onSelect(offer),
      }),
    ),
  );
}

function checkboxGroup(legend, name, items) {
  return el(
    'fieldset',
    { class: 'cr-filter' },
    el('legend', { text: legend }),
    items.map((item) => el(
      'label',
      { class: 'cr-check' },
      el('input', {
        type: 'checkbox', name, value: item.value, disabled: item.count === 0,
      }),
      el('span', { text: item.label }),
      el('span', { class: 'cr-count', text: `(${item.count})` }),
    )),
  );
}

export default async function renderResults(container, { base, params }) {
  const pickupLoc = findLocation(params.pickup);
  const dropoffLoc = findLocation(params.dropoff) || pickupLoc;
  const days = rentalDays(params);
  const search = renderSearch({ base, params });
  search.hidden = true;
  const bar = summaryBar(params, {
    base,
    onModify: () => {
      search.hidden = !search.hidden;
      if (!search.hidden) search.querySelector('#pickup')?.focus();
    },
  });
  container.append(bar, search);

  if (!pickupLoc || !days) {
    search.hidden = false;
    container.append(el('p', { class: 'cr-empty-state', text: 'Your search is incomplete. Choose your locations and dates, then search again.' }));
    return;
  }

  const loading = spinner('Comparing rates from our suppliers…');
  container.append(loading);
  await wait(1400);
  loading.remove();

  const offers = buildOffers({ pickup: pickupLoc, dropoff: dropoffLoc, days });
  beacon('car_results', { success: offers.length > 0, args: { ...pick(params, SEARCH_KEYS), count: offers.length } });
  if (!offers.length) {
    container.append(el('p', { class: 'cr-empty-state', text: 'No cars are available for this route. Try a drop-off location in the same country.' }));
    return;
  }

  const filters = el(
    'form',
    { class: 'cr-filters', 'aria-label': 'Filter results' },
    el('h2', { text: 'Filter by' }),
    checkboxGroup('Size', 'size', SIZES.map((size) => ({ value: size, label: size, count: offers.filter((o) => o.category.size === size).length }))),
    checkboxGroup('Supplier', 'supplier', SUPPLIERS.map((s) => ({ value: s.id, label: s.name, count: offers.filter((o) => o.supplier.id === s.id).length }))),
    el('button', { type: 'reset', class: 'button secondary cr-reset', text: 'Clear filters' }),
  );
  const sort = el(
    'select',
    { id: 'cr-sort', name: 'sort' },
    el('option', { value: 'price-asc', text: 'Price: low to high' }),
    el('option', { value: 'price-desc', text: 'Price: high to low' }),
    el('option', { value: 'score', text: 'Renter score' }),
  );
  const count = el('p', { class: 'cr-count-line', role: 'status' });
  const list = el('div', { class: 'cr-offers' });

  const goExtras = (offer) => window.location.assign(stepUrl(base, 'extras', { ...pick(params, SEARCH_KEYS), offer: offer.id }));
  const select = (offer) => {
    beacon('car_select', { args: { offer: offer.id, size: offer.category.size, total: offer.total } });
    if (offer.oneWayFee > 0) oneWayDialog(offer, () => goExtras(offer));
    else goExtras(offer);
  };

  const update = () => {
    const sizes = [...filters.querySelectorAll('input[name="size"]:checked')].map((i) => i.value);
    const suppliers = [...filters.querySelectorAll('input[name="supplier"]:checked')].map((i) => i.value);
    let shown = offers.filter((o) => (!sizes.length || sizes.includes(o.category.size))
      && (!suppliers.length || suppliers.includes(o.supplier.id)));
    if (sort.value === 'price-desc') shown = [...shown].sort((a, b) => b.total - a.total);
    else if (sort.value === 'score') shown = [...shown].sort((a, b) => (b.supplier.score - a.supplier.score) || (a.total - b.total));
    else shown = [...shown].sort((a, b) => a.total - b.total);
    count.textContent = `${shown.length} car${shown.length === 1 ? '' : 's'} found`;
    list.replaceChildren(...shown.map((offer) => offerCard(offer, select)));
    if (sizes.length || suppliers.length) beacon('car_filter', { args: { sizes, suppliers } });
  };
  filters.addEventListener('change', update);
  filters.addEventListener('reset', () => setTimeout(update));
  sort.addEventListener('change', update);

  container.append(el(
    'div',
    { class: 'cr-results' },
    filters,
    el(
      'div',
      { class: 'cr-results-main' },
      el('div', { class: 'cr-results-head' }, count, el('label', { class: 'cr-sort', for: 'cr-sort' }, 'Sort by ', sort)),
      list,
    ),
  ));
  update();
}
