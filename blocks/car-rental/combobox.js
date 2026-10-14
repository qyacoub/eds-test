/*
 * Location autocomplete (ARIA 1.2 combobox). Behaves like common travel-site pickers:
 * suggestions grouped by type, the first suggestion is highlighted, Enter picks the highlighted
 * one, and free text that was not picked from the list is discarded on blur.
 */
import { el } from './util.js';
import { LOCATION_TYPES, searchLocations } from './data.js';

let counter = 0;

export default function createLocationCombobox({
  id, label, placeholder, value = null, onChange = () => {},
}) {
  counter += 1;
  const listId = `${id}-listbox`;
  let selected = value;
  let options = [];
  let active = -1;
  let timer;

  const input = el('input', {
    id,
    name: id,
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    'aria-autocomplete': 'list',
    'aria-expanded': 'false',
    'aria-controls': listId,
    placeholder,
    value: selected?.label || '',
  });
  const clear = el('button', {
    type: 'button', class: 'cr-combo-clear', 'aria-label': `Clear ${label.toLowerCase()}`, hidden: !selected, text: '×',
  });
  const list = el('ul', {
    id: listId, role: 'listbox', class: 'cr-combo-list', 'aria-label': label, hidden: true,
  });
  const wrapper = el('div', { class: 'cr-combo' }, input, clear, list);

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const highlight = (index) => {
    const items = list.querySelectorAll('[role="option"]');
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    active = index;
    if (index >= 0 && items[index]) {
      input.setAttribute('aria-activedescendant', items[index].id);
      items[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const choose = (loc) => {
    selected = loc;
    input.value = loc ? loc.label : '';
    clear.hidden = !loc;
    close();
    onChange(loc);
  };

  const render = (status) => {
    list.replaceChildren();
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (status) {
      list.append(el('li', { class: 'cr-combo-status', role: 'presentation', text: status }));
      return;
    }
    let index = 0;
    LOCATION_TYPES.forEach((type) => {
      const group = options.filter((loc) => loc.type === type.id);
      if (!group.length) return;
      list.append(el('li', { class: 'cr-combo-group', role: 'presentation', text: type.label }));
      group.forEach((loc) => {
        const optionIndex = index;
        list.append(el('li', {
          id: `${id}-opt-${counter}-${optionIndex}`,
          role: 'option',
          class: `cr-combo-option cr-type-${loc.type}`,
          'data-location': loc.id,
          'aria-selected': 'false',
          onmousedown: (event) => { event.preventDefault(); choose(loc); },
          onmousemove: () => { if (active !== optionIndex) highlight(optionIndex); },
        }, el('span', { class: 'cr-combo-label', text: loc.label }), el('span', { class: 'cr-combo-meta', text: `${loc.city}, ${loc.region}, ${loc.country === 'CA' ? 'Canada' : 'Australia'}` })));
        index += 1;
      });
    });
    highlight(0);
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const query = input.value;
    clear.hidden = !query;
    if (query.trim().length < 2) {
      options = [];
      close();
      return;
    }
    render('Searching…');
    timer = setTimeout(() => {
      // Order follows LOCATION_TYPES grouping so keyboard order matches what is displayed.
      const found = searchLocations(query);
      options = LOCATION_TYPES.flatMap((t) => found.filter((loc) => loc.type === t.id));
      if (!options.length) render('No locations match your search');
      else render();
    }, 350);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (list.hidden && input.value.trim().length >= 2) input.dispatchEvent(new Event('input'));
      else if (options.length) highlight(Math.min(active + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length) highlight(Math.max(active - 1, 0));
    } else if (event.key === 'Enter') {
      if (!list.hidden) {
        event.preventDefault();
        if (active >= 0 && options[active]) choose(options[active]);
      }
    } else if (event.key === 'Escape') {
      close();
    }
  });

  input.addEventListener('blur', () => {
    clearTimeout(timer);
    // Text that was not picked from the list is discarded.
    input.value = selected ? selected.label : '';
    clear.hidden = !selected;
    close();
  });

  clear.addEventListener('click', () => {
    choose(null);
    input.focus();
  });

  return {
    element: wrapper,
    input,
    get value() { return selected; },
    set value(loc) {
      selected = loc;
      input.value = loc ? loc.label : '';
      clear.hidden = !loc;
    },
  };
}
