/*
 * car-rental block: a four-page car rental booking flow (search → results → extras → checkout)
 * for agent testing. The authored block names the step:
 *   | Car Rental |         |
 *   | Step       | results |
 * Pages live under one folder, e.g. /car-rentals, /car-rentals/results, /car-rentals/extras,
 * /car-rentals/checkout. Booking state travels in the URL query string.
 */
import { readBlockConfig } from '../../scripts/aem.js';
import {
  el, STEPS, flowBase, readParams, stepper, beacon,
} from './util.js';
import showConsent from './consent.js';

const LOADERS = {
  search: () => import('./search.js'),
  results: () => import('./results.js'),
  extras: () => import('./extras.js'),
  checkout: () => import('./checkout.js'),
};

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const step = STEPS.includes(config.step) ? config.step : 'search';
  const base = flowBase(step);
  const params = readParams();
  block.replaceChildren();
  block.dataset.step = step;

  beacon('car_page_load', {
    args: { step, query: window.location.search.slice(0, 400) },
    webmcpHost: (document.modelContext || navigator.modelContext) ? 'native' : 'none',
  });

  if (step !== 'search') block.append(stepper(step));
  const body = el('div', { class: 'cr-body' });
  block.append(body);

  const module = await LOADERS[step]();
  if (step === 'search') body.append(module.default({ base, params }));
  else await module.default(body, { base, params });

  showConsent();
}
