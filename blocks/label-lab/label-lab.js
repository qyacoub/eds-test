/*
 * label-lab block: accessible-name test for personal agents.
 * A product card with two icon-only buttons (cart and wishlist) and visible counters.
 * The variant comes from the first letter of the run code in ?ref=, so the URL doesn't name it:
 *   A named    correct accessible names ("Add to cart", "Add to wishlist")
 *   B unnamed  no accessible name at all: the icon is the only clue
 *   C swapped  names swapped: the cart icon is named "Add to wishlist", the heart "Add to cart"
 * All variants look the same. Every click is logged in order (label_click), with the page view
 * (label_page) and a summary when the page is left (label_leave).
 */

import {
  beacon as labBeacon, ref, secondsOnPage, onLeave,
} from '../../scripts/agent-lab.js';

const VARIANTS = { A: 'named', B: 'unnamed', C: 'swapped' };
const variantOf = (code) => VARIANTS[code.charAt(0).toUpperCase()] || 'named';

const NAMES = {
  named: { cart: 'Add to cart', wishlist: 'Add to wishlist' },
  unnamed: { cart: null, wishlist: null },
  swapped: { cart: 'Add to wishlist', wishlist: 'Add to cart' },
};

const ICONS = {
  cart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4h2.2l2.3 10.1a1.2 1.2 0 0 0 1.2.9h8.6a1.2 1.2 0 0 0 1.2-.9L20.2 8H6.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.2" r="1.6" fill="currentColor"/><circle cx="16.8" cy="19.2" r="1.6" fill="currentColor"/></svg>',
  wishlist: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.2s-7.4-4.6-9.3-9.3A5.1 5.1 0 0 1 12 6.6a5.1 5.1 0 0 1 9.3 4.3c-1.9 4.7-9.3 9.3-9.3 9.3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

const MACHINE = '<svg viewBox="0 0 200 160" aria-hidden="true" focusable="false"><rect x="38" y="14" width="124" height="34" rx="8" fill="#3a3a3a"/><rect x="48" y="48" width="104" height="70" rx="6" fill="#4b4b4b"/><rect x="88" y="56" width="24" height="12" rx="3" fill="#2c2c2c"/><rect x="96" y="68" width="8" height="10" fill="#2c2c2c"/><rect x="84" y="92" width="32" height="22" rx="4" fill="#f2f2f2"/><rect x="30" y="118" width="140" height="16" rx="6" fill="#3a3a3a"/><circle cx="62" cy="31" r="7" fill="#c9c9c9"/><circle cx="138" cy="31" r="7" fill="#c9c9c9"/></svg>';

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
  const code = ref();
  const variant = variantOf(code);
  const names = NAMES[variant];
  const counts = { cart: 0, wishlist: 0 };
  const clicks = [];
  const beacon = (event, args = {}) => labBeacon(event, { variant, ...args }, { tool: variant });

  const cartCount = el('span', { class: 'll-count', text: '0' });
  const wishCount = el('span', { class: 'll-count', text: '0' });
  const status = el('p', { class: 'll-status', role: 'status', 'aria-live': 'polite' });

  const iconButton = (kind) => el('button', {
    type: 'button',
    class: `ll-icon ll-${kind}`,
    'aria-label': names[kind],
    html: ICONS[kind],
  });
  const cart = iconButton('cart');
  const wishlist = iconButton('wishlist');

  const card = el(
    'div',
    { class: 'll-card' },
    el('div', { class: 'll-media', html: MACHINE }),
    el(
      'div',
      { class: 'll-info' },
      el('p', { class: 'll-name', text: 'Barista One espresso machine' }),
      el('p', { class: 'll-price', text: '$299' }),
      el('p', { class: 'll-meta', text: 'Rated 4.6/5 · In stock' }),
      el('div', { class: 'll-actions' }, cart, wishlist),
      status,
    ),
  );
  const counters = el(
    'div',
    { class: 'll-counters' },
    el('p', {}, 'Cart: ', cartCount),
    el('p', {}, 'Wishlist: ', wishCount),
  );

  const press = (kind) => {
    counts[kind] += 1;
    cartCount.textContent = String(counts.cart);
    wishCount.textContent = String(counts.wishlist);
    status.textContent = kind === 'cart' ? 'Added to cart.' : 'Saved to your wishlist.';
    clicks.push(kind);
    beacon('label_click', {
      button: kind, name: names[kind], n: clicks.length, seconds: secondsOnPage(), ...counts,
    });
  };
  cart.addEventListener('click', () => press('cart'));
  wishlist.addEventListener('click', () => press('wishlist'));

  block.append(counters, card);
  beacon('label_page', { names: `${names.cart}|${names.wishlist}` });
  onLeave('label_leave', () => ({ ...counts, clicks: clicks.join(',') }));
}
