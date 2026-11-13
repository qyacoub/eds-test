/*
 * vehicle-offer block: price and availability for a rental listing, in two modes.
 *   static  the price and availability are authored in the block, so they are in the
 *           initial HTML; the script only reports that JavaScript ran.
 *   live    the block is empty in the HTML; the script fetches rates.json and renders
 *           the price and availability, so they exist only after JavaScript runs.
 * Beacons (with the run code from ?ref=): offer_static or offer_render.
 */
import { beacon } from '../../scripts/agent-lab.js';

const RATES = new URL('./rates.json', import.meta.url);

async function renderLive(block) {
  const listing = [...block.classList].find((c) => c.startsWith('listing-'))?.slice(8) || 'rav4';
  try {
    const response = await fetch(RATES, { cache: 'no-store' });
    const rate = (await response.json())[listing];
    block.innerHTML = `<p><strong>${rate.price}</strong> per day, taxes included.</p><p>${rate.availability}</p>`;
    beacon('offer_render', { mode: 'live', listing }, { tool: 'live' });
  } catch (error) {
    beacon('offer_error', { mode: 'live', error: String(error).slice(0, 200) }, { tool: 'live' });
  }
}

export default function decorate(block) {
  if (block.classList.contains('live')) {
    block.textContent = '';
    renderLive(block);
  } else {
    beacon('offer_static', { mode: 'static' }, { tool: 'static' });
  }
}
