/*
 * Two-month range calendar. Day cells carry aria-label="Month D, YYYY"; the first click sets the
 * pick-up date, the second the drop-off date.
 */
import {
  el, isoDate, parseIso, addDays, today, formatDate, longDate,
} from './util.js';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function createDateRange({ start, end, onChange = () => {} }) {
  let startDate = parseIso(start);
  let endDate = parseIso(end);
  let picking = 'start';
  const initial = startDate || today();
  let viewMonth = new Date(initial.getFullYear(), initial.getMonth(), 1);

  const makeTrigger = (id, label) => el('input', {
    id, name: id, type: 'text', readonly: true, class: 'cr-date-input', placeholder: 'Select date', 'aria-haspopup': 'dialog', 'aria-label': label,
  });
  const startInput = makeTrigger('pickupDate', 'Pick-up date');
  const endInput = makeTrigger('dropoffDate', 'Drop-off date');
  const popover = el('div', {
    class: 'cr-calendar', role: 'dialog', 'aria-label': 'Choose your rental dates', hidden: true,
  });

  const sync = () => {
    startInput.value = startDate ? formatDate(isoDate(startDate)) : '';
    endInput.value = endDate ? formatDate(isoDate(endDate)) : '';
    startInput.dataset.value = startDate ? isoDate(startDate) : '';
    endInput.dataset.value = endDate ? isoDate(endDate) : '';
  };

  const monthTable = (monthStart) => {
    const caption = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const table = el('table', { class: 'cr-month' }, el('caption', { text: caption }));
    table.append(el('thead', {}, el('tr', {}, WEEKDAYS.map((d) => el('th', { scope: 'col', text: d })))));
    const body = el('tbody');
    const first = monthStart.getDay();
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    let row = el('tr');
    for (let i = 0; i < first; i += 1) row.append(el('td', { class: 'cr-empty' }));
    const min = today();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const iso = isoDate(date);
      const disabled = date < min;
      const isStart = startDate && iso === isoDate(startDate);
      const isEnd = endDate && iso === isoDate(endDate);
      const inRange = startDate && endDate && date > startDate && date < endDate;
      const classes = ['cr-day', disabled && 'disabled', isStart && 'start', isEnd && 'end', inRange && 'in-range']
        .filter(Boolean).join(' ');
      row.append(el(
        'td',
        {
          class: classes,
          'aria-label': longDate(date),
          'aria-disabled': disabled ? 'true' : undefined,
          'aria-selected': isStart || isEnd ? 'true' : undefined,
          'data-date': iso,
        },
        el('button', {
          type: 'button', tabindex: '-1', disabled, text: String(day), 'aria-label': longDate(date),
        }),
      ));
      if ((first + day) % 7 === 0) {
        body.append(row);
        row = el('tr');
      }
    }
    if (row.children.length) body.append(row);
    table.append(body);
    return table;
  };

  const renderCalendar = () => {
    const second = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    const min = new Date(today().getFullYear(), today().getMonth(), 1);
    popover.replaceChildren(
      el(
        'div',
        { class: 'cr-calendar-head' },
        el('button', {
          type: 'button', class: 'cr-cal-nav', 'aria-label': 'Previous month', text: '‹', disabled: viewMonth <= min,
        }),
        el('p', { class: 'cr-calendar-hint', text: picking === 'start' ? 'Select your pick-up date' : 'Select your drop-off date' }),
        el('button', {
          type: 'button', class: 'cr-cal-nav', 'aria-label': 'Next month', text: '›',
        }),
      ),
      el('div', { class: 'cr-calendar-months' }, monthTable(viewMonth), monthTable(second)),
      el('div', { class: 'cr-calendar-foot' }, el('button', { type: 'button', class: 'button secondary cr-cal-done', text: 'Done' })),
    );
  };

  const open = (which) => {
    picking = which;
    const anchor = (which === 'end' && endDate) || startDate || today();
    viewMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    if (which === 'end' && startDate && endDate && endDate.getMonth() !== startDate.getMonth()) {
      viewMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    }
    renderCalendar();
    popover.hidden = false;
    [startInput, endInput].forEach((input) => input.setAttribute('aria-expanded', 'true'));
  };

  const close = () => {
    popover.hidden = true;
    [startInput, endInput].forEach((input) => input.setAttribute('aria-expanded', 'false'));
  };

  popover.addEventListener('click', (event) => {
    const nav = event.target.closest('.cr-cal-nav');
    if (nav) {
      const delta = nav.getAttribute('aria-label') === 'Next month' ? 1 : -1;
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
      renderCalendar();
      return;
    }
    if (event.target.closest('.cr-cal-done')) {
      close();
      return;
    }
    const cell = event.target.closest('td[data-date]');
    if (!cell || cell.getAttribute('aria-disabled') === 'true') return;
    const date = parseIso(cell.dataset.date);
    if (picking === 'start' || (startDate && date < startDate)) {
      startDate = date;
      if (endDate && endDate <= startDate) endDate = null;
      picking = 'end';
      sync();
      renderCalendar();
    } else {
      endDate = date;
      sync();
      close();
    }
    onChange({ start: startDate && isoDate(startDate), end: endDate && isoDate(endDate) });
  });

  startInput.addEventListener('click', () => open('start'));
  endInput.addEventListener('click', () => open(startDate ? 'end' : 'start'));
  [startInput, endInput].forEach((input) => input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      open(input === endInput && startDate ? 'end' : 'start');
    } else if (event.key === 'Escape') close();
  }));

  document.addEventListener('click', (event) => {
    if (popover.hidden) return;
    const { target } = event;
    if (popover.contains(target) || target === startInput || target === endInput) return;
    if (!event.target.isConnected) return;
    close();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });

  sync();

  return {
    startInput,
    endInput,
    popover,
    get start() { return startDate ? isoDate(startDate) : ''; },
    get end() { return endDate ? isoDate(endDate) : ''; },
    defaultRange() {
      if (!startDate) startDate = addDays(today(), 14);
      if (!endDate) endDate = addDays(startDate, 3);
      sync();
    },
  };
}
