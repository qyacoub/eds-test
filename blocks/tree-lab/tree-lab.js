/*
 * tree-lab block: accessibility tree test for personal agents.
 * A product card with colour swatches, a quantity stepper and an Add to cart button.
 * The variant comes from the first letter of the run code in ?ref=, so the URL doesn't name it:
 *   T  tree     real controls with names: radio swatches, labelled stepper buttons, a status line
 *   N  no tree  the same controls as plain divs inside aria-hidden="true": the accessibility tree
 *               shows nothing of the card, only the screenshot (and the raw DOM) do
 * Both variants look the same. Every click inside the block is logged in order (tree_click,
 * including clicks that miss a control), each Add to cart (tree_add), the page view (tree_page)
 * and a summary when the page is left (tree_leave).
 */

import {
  beacon as labBeacon, ref, secondsOnPage, onLeave,
} from '../../scripts/agent-lab.js';

const VARIANTS = { T: 'tree', N: 'notree' };
const variantOf = (code) => VARIANTS[code.charAt(0).toUpperCase()] || 'tree';

const COLORS = [
  { id: 'silver', name: 'Silver', hex: '#c4c8ce' },
  { id: 'black', name: 'Black', hex: '#262626' },
  { id: 'red', name: 'Red', hex: '#b3121f' },
];
const MAX_QTY = 5;

const MACHINE = '<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false"><rect class="tl-body" x="38" y="14" width="124" height="34" rx="8"/><rect class="tl-body tl-shade" x="48" y="48" width="104" height="70" rx="6"/><rect x="88" y="56" width="24" height="12" rx="3" fill="#2c2c2c"/><rect x="96" y="68" width="8" height="10" fill="#2c2c2c"/><rect x="84" y="92" width="32" height="22" rx="4" fill="#f2f2f2"/><rect class="tl-body" x="30" y="118" width="140" height="16" rx="6"/><circle cx="62" cy="31" r="7" fill="#e8e8e8"/><circle cx="138" cy="31" r="7" fill="#e8e8e8"/></svg>';

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.flat().filter(Boolean));
  return node;
};

export default function decorate(block) {
  block.textContent = '';
  const variant = variantOf(ref());
  const tree = variant === 'tree';
  const state = { color: 'silver', qty: 1, lines: [] };
  const clicks = [];
  const beacon = (event, args = {}) => labBeacon(event, { variant, ...args }, { tool: variant });
  const total = () => state.lines.reduce((sum, line) => sum + line.qty, 0);
  const lines = () => state.lines.map((line) => `${line.color}:${line.qty}`).join(',');

  // A control: a real button with a name in the tree variant, a plain div in the other one.
  const control = (cls, act, treeAttrs, ...children) => (tree
    ? el('button', {
      type: 'button', class: cls, 'data-act': act, ...treeAttrs,
    }, ...children)
    : el('div', { class: cls, 'data-act': act }, ...children));

  const colorName = el('span', { class: 'tl-color-name', text: 'Silver' });
  const swatches = COLORS.map((c) => control(`tl-swatch tl-swatch-${c.id}`, `color:${c.id}`, {
    role: 'radio', 'aria-label': c.name, 'aria-checked': 'false',
  }));
  const minus = control('tl-step', 'qty:-', { 'aria-label': 'Decrease quantity' }, '\u2212');
  const plus = control('tl-step', 'qty:+', { 'aria-label': 'Increase quantity' }, '+');
  const qty = el(tree ? 'output' : 'span', { class: 'tl-qty', 'aria-label': tree ? 'Quantity' : null, text: '1' });
  const add = control('tl-add', 'add', {}, 'Add to cart');
  const status = el('p', { class: 'tl-status', role: tree ? 'status' : null });
  const cartCount = el('span', { class: 'tl-count', text: '0' });

  const root = el(
    'div',
    { class: 'tl-root', 'aria-hidden': tree ? null : 'true' },
    el('div', { class: 'tl-counters' }, el('p', {}, 'Cart: ', cartCount)),
    el(
      'div',
      { class: 'tl-card' },
      el('div', { class: 'tl-media', html: MACHINE }),
      el(
        'div',
        { class: 'tl-info' },
        el('p', { class: 'tl-name', text: 'Barista Pro espresso machine' }),
        el('p', { class: 'tl-price', text: '$349' }),
        el('p', { class: 'tl-meta', text: 'Rated 4.7/5 \u00b7 In stock' }),
        el('p', { class: 'tl-label' }, 'Color: ', colorName),
        el('div', tree ? { class: 'tl-swatches', role: 'radiogroup', 'aria-label': 'Color' } : { class: 'tl-swatches' }, swatches),
        el('p', { class: 'tl-label', text: 'Quantity' }),
        el('div', { class: 'tl-stepper' }, minus, qty, plus),
        add,
        status,
      ),
    ),
  );

  const pick = (id) => {
    state.color = id;
    const color = COLORS.find((c) => c.id === id);
    colorName.textContent = color.name;
    root.style.setProperty('--tl-body', color.hex);
    swatches.forEach((swatch, i) => {
      const on = COLORS[i].id === id;
      swatch.classList.toggle('tl-selected', on);
      if (tree) swatch.setAttribute('aria-checked', String(on));
    });
  };
  const setQty = (value) => {
    state.qty = Math.min(MAX_QTY, Math.max(1, value));
    qty.textContent = String(state.qty);
  };

  swatches.forEach((swatch, i) => swatch.addEventListener('click', () => pick(COLORS[i].id)));
  minus.addEventListener('click', () => setQty(state.qty - 1));
  plus.addEventListener('click', () => setQty(state.qty + 1));
  add.addEventListener('click', () => {
    const color = COLORS.find((c) => c.id === state.color);
    state.lines.push({ color: state.color, qty: state.qty });
    cartCount.textContent = String(total());
    status.textContent = `Added ${state.qty} \u00d7 ${color.name} to your cart.`;
    beacon('tree_add', {
      color: state.color, qty: state.qty, cart: total(), lines: lines(), seconds: secondsOnPage(),
    });
  });

  // Logged after the control has acted, so each click carries the resulting state.
  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-act]');
    const act = target ? target.dataset.act : 'miss';
    clicks.push(act);
    beacon('tree_click', {
      act,
      n: clicks.length,
      seconds: secondsOnPage(),
      color: state.color,
      qty: state.qty,
      cart: total(),
    });
  });

  pick('silver');
  block.append(root);
  beacon('tree_page', {});
  onLeave('tree_leave', () => ({
    variant, cart: total(), lines: lines(), color: state.color, qty: state.qty, clicks: clicks.join(','),
  }));
}
