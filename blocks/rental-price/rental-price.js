/*
 * rental-price block: case study B (Read). The authored rows hold last season's prices, so they
 * are in the initial HTML. In a browser they are never shown: each price reads "Loading…" until
 * this season's prices arrive from the booking system (prices.json), LIVE_DELAY_MS after the price
 * list has scrolled into view. An agent that reads the raw HTML answers with last season's price;
 * one that reads the page in a browser and doesn't wait finds no price.
 * Beacons (with the run code from ?ref=): price_waiting (placeholders on screen; the HTML prices
 * in args), price_visible (list scrolled into view), price_render (live prices shown) or
 * price_error, and price_leave when the page is left (with whether the live prices were shown).
 */
import {
  beacon, onLeave, secondsOnPage, wait,
} from '../../scripts/agent-lab.js';

const PRICES = new URL('./prices.json', import.meta.url);
const LIVE_DELAY_MS = 60000;
const PLACEHOLDER = 'Loading…';
const TOOL = { tool: 'rental-price' };

const slug = (text) => text.toLowerCase().replace(/\(.*?\)/g, '').trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

async function showLivePrices(list, visibleAt) {
  try {
    await wait(LIVE_DELAY_MS);
    const response = await fetch(PRICES, { cache: 'no-store' });
    const prices = await response.json();
    const replaced = [];
    list.querySelectorAll('dd').forEach((dd) => {
      const current = prices[dd.dataset.rate];
      if (current) {
        replaced.push({ rate: dd.dataset.rate, from: dd.dataset.html, to: current });
        dd.textContent = current;
        dd.classList.remove('rp-loading');
      }
    });
    beacon('price_render', { replaced, seconds: secondsOnPage(), afterVisible: secondsOnPage() - visibleAt }, TOOL);
    return true;
  } catch (error) {
    beacon('price_error', { error: String(error).slice(0, 200) }, TOOL);
    return false;
  }
}

export default async function decorate(block) {
  const list = document.createElement('dl');
  list.className = 'rp-list';
  [...block.children].forEach((row) => {
    const [label, price] = [...row.children].map((cell) => cell.textContent.trim());
    if (!label) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = PLACEHOLDER;
    dd.className = 'rp-loading';
    dd.dataset.html = price;
    dd.dataset.rate = slug(label);
    list.append(dt, dd);
  });
  block.replaceChildren(list);

  const shown = Object.fromEntries([...list.querySelectorAll('dd')].map((dd) => [dd.dataset.rate, dd.dataset.html]));
  const state = { visible: false, rendered: false };
  beacon('price_waiting', { shown }, TOOL);
  onLeave('price_leave', () => ({ ...state }));

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    state.visible = true;
    const visibleAt = secondsOnPage();
    beacon('price_visible', { seconds: visibleAt }, TOOL);
    state.rendered = await showLivePrices(list, visibleAt);
  }, { threshold: 0.5 });
  observer.observe(list);
}
