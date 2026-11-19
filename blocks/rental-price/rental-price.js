/*
 * rental-price block: case study B (Read). The authored rows hold last season's prices, so they
 * are in the initial HTML; on load, the script fetches this season's prices from prices.json and
 * replaces them. An agent that reads the raw HTML without running JavaScript answers with the old
 * price; a browser shows the new one.
 * Beacons (with the run code from ?ref=): price_render, or price_error if the fetch fails.
 */
import { beacon } from '../../scripts/agent-lab.js';

const PRICES = new URL('./prices.json', import.meta.url);

const slug = (text) => text.toLowerCase().replace(/\(.*?\)/g, '').trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export default async function decorate(block) {
  const list = document.createElement('dl');
  list.className = 'rp-list';
  [...block.children].forEach((row) => {
    const [label, price] = [...row.children].map((cell) => cell.textContent.trim());
    if (!label) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = price;
    dd.dataset.rate = slug(label);
    list.append(dt, dd);
  });
  block.replaceChildren(list);

  try {
    const response = await fetch(PRICES, { cache: 'no-store' });
    const prices = await response.json();
    const replaced = [];
    list.querySelectorAll('dd').forEach((dd) => {
      const current = prices[dd.dataset.rate];
      if (current && current !== dd.textContent) {
        replaced.push({ rate: dd.dataset.rate, from: dd.textContent, to: current });
        dd.textContent = current;
      }
    });
    beacon('price_render', { replaced }, { tool: 'rental-price' });
  } catch (error) {
    beacon('price_error', { error: String(error).slice(0, 200) }, { tool: 'rental-price' });
  }
}
