/* Search widget: product tabs, locations, dates, times, driver age. */
import {
  el, field, setError, stepUrl, TIMES, formatTime, rentalDays, beacon,
} from './util.js';
import { findLocation } from './data.js';
import createLocationCombobox from './combobox.js';
import createDateRange from './datepicker.js';

const TABS = ['Vacation packages', 'Flights', 'Hotels', 'Flight + Hotel', 'Cruises', 'Car rentals'];

function timeSelect(id, value) {
  return el('select', { id, name: id }, TIMES.map((t) => el('option', { value: t, text: formatTime(t), selected: t === (value || '10:00') })));
}

export default function renderSearch({ base, params = {}, onSearch }) {
  const tabs = el('div', { class: 'cr-tabs', role: 'tablist', 'aria-label': 'What would you like to book?' });
  const notice = el('p', { class: 'cr-tab-notice', role: 'status', hidden: true });
  TABS.forEach((name) => {
    const isCars = name === 'Car rentals';
    tabs.append(el('button', {
      type: 'button',
      role: 'tab',
      class: 'cr-tab',
      'aria-selected': String(isCars),
      text: name,
      onclick: () => {
        notice.hidden = isCars;
        notice.textContent = isCars ? '' : `${name} are not bookable on this demo site. Only car rentals are available.`;
      },
    }));
  });

  let dropoffTouched = Boolean(params.dropoff && params.dropoff !== params.pickup);
  const dropoff = createLocationCombobox({
    id: 'dropoff',
    label: 'Drop-off location',
    placeholder: 'Same as pick-up',
    value: findLocation(params.dropoff),
    onChange: () => { dropoffTouched = true; },
  });
  const pickup = createLocationCombobox({
    id: 'pickup',
    label: 'Pick-up location',
    placeholder: 'Airport, city or station',
    value: findLocation(params.pickup),
    onChange: (loc) => {
      if (!dropoffTouched || !dropoff.value) dropoff.value = loc;
    },
  });
  const dates = createDateRange({ start: params.pickupDate, end: params.dropoffDate });
  dates.defaultRange();

  const age = el('input', {
    id: 'driverAge', name: 'driverAge', type: 'number', inputmode: 'numeric', min: '18', max: '99', value: params.driverAge || '30',
  });

  const form = el(
    'form',
    {
      class: 'cr-search-form', name: 'car-search', novalidate: true, 'aria-label': 'Search car rentals',
    },
    el(
      'div',
      { class: 'cr-search-locations' },
      field({ id: 'pickup', label: 'Pick-up location', control: pickup.element }),
      field({ id: 'dropoff', label: 'Drop-off location', control: dropoff.element }),
    ),
    el(
      'div',
      { class: 'cr-search-when' },
      el(
        'div',
        { class: 'cr-dates' },
        field({ id: 'pickupDate', label: 'Pick-up date', control: dates.startInput }),
        field({
          id: 'pickupTime', label: 'Pick-up time', control: timeSelect('pickupTime', params.pickupTime), error: false,
        }),
        field({ id: 'dropoffDate', label: 'Drop-off date', control: dates.endInput }),
        field({
          id: 'dropoffTime', label: 'Drop-off time', control: timeSelect('dropoffTime', params.dropoffTime), error: false,
        }),
        dates.popover,
      ),
      field({
        id: 'driverAge', label: 'Driver’s age', control: age, hint: 'Age at pick-up',
      }),
      el('button', { type: 'submit', class: 'button primary cr-search-submit', text: 'Search cars' }),
    ),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = {
      pickup: pickup.value?.id || '',
      dropoff: (dropoff.value || pickup.value)?.id || '',
      pickupDate: dates.start,
      pickupTime: form.elements.pickupTime.value,
      dropoffDate: dates.end,
      dropoffTime: form.elements.dropoffTime.value,
      driverAge: age.value,
    };
    const errors = {
      pickup: values.pickup ? '' : 'Choose a pick-up location from the list.',
      pickupDate: values.pickupDate ? '' : 'Choose a pick-up date.',
      dropoffDate: values.dropoffDate && rentalDays(values) > 0 ? '' : 'Choose a drop-off date after pick-up.',
      driverAge: Number(values.driverAge) >= 18 && Number(values.driverAge) <= 99 ? '' : 'Enter an age between 18 and 99.',
    };
    Object.entries(errors).forEach(([id, message]) => setError(form, id, message));
    const firstError = Object.keys(errors).find((id) => errors[id]);
    beacon('car_search', { success: !firstError, args: values, error: firstError || undefined });
    if (firstError) {
      form.querySelector(`#${firstError}`)?.focus();
      return;
    }
    if (onSearch) onSearch(values);
    window.location.assign(stepUrl(base, 'results', values));
  });

  return el('section', { class: 'cr-search', 'aria-label': 'Car rental search' }, tabs, notice, form);
}
