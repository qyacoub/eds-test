/*
 * Agent tools for the car-rental flow, registered only on the flows listed in car-rental.js.
 * Each page registers the tools that fit its step. Tools reuse the flow's own data and drive the
 * same page logic as the buttons, so the usual car_* beacons still fire. Every call is also logged
 * as a tool_call beacon; card numbers are reduced to the last 4 digits and the CVC is never sent.
 */
import {
  beacon, stepUrl, pick, SEARCH_KEYS, rentalDays, parseIso, today, TIMES, setError,
} from './util.js';
import {
  searchLocations, findLocation, buildOffers, priceBreakdown, SIZES, SUPPLIERS, RATES, EXTRAS,
  TAX_RATE,
} from './data.js';
import { resolveBooking, parseExtras, serializeExtras } from './summary.js';
import { consentChoices, saveConsent } from './consent.js';
import {
  RULES, DRIVER_FIELDS, BILLING_FIELDS, PROVINCES,
} from './checkout.js';
import { callOrigin, wrapScriptEntryPoints } from '../visit-form/tracking.js';

const round2 = (n) => Math.round(n * 100) / 100;
const reply = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
const fail = (error, extra = {}) => reply({ success: false, error, ...extra });
const go = (url) => setTimeout(() => window.location.assign(url), 300);
const place = (loc) => loc && ({
  id: loc.id, name: loc.label, type: loc.type, city: loc.city, country: loc.country,
});

function redact(args) {
  if (!args || typeof args !== 'object') return args;
  const copy = { ...args };
  if (copy.cardNumber) copy.cardNumber = `•••• ${String(copy.cardNumber).replace(/\D/g, '').slice(-4)}`;
  if (copy.cardCvc) copy.cardCvc = '•••';
  return copy;
}

function parseReply(result) {
  try { return JSON.parse(result?.content?.[0]?.text); } catch { return null; }
}

function bookingFacts(booking, params) {
  const { offer, pickup, dropoff } = booking;
  const rate = params.rate || 'basic';
  const extras = parseExtras(params.extras);
  const breakdown = priceBreakdown(offer, rate, extras);
  return {
    offerId: offer.id,
    car: offer.category.name,
    similar: offer.category.similar,
    supplier: offer.supplier.name,
    pickup: { ...place(pickup), date: params.pickupDate, time: params.pickupTime },
    dropoff: { ...place(dropoff), date: params.dropoffDate, time: params.dropoffTime },
    rentalDays: booking.days,
    rate: (RATES.find((r) => r.id === rate) || RATES[0]).name,
    extras: EXTRAS.filter((e) => extras[e.id])
      .map((e) => ({ id: e.id, name: e.name, quantity: extras[e.id] })),
    priceLines: breakdown.lines,
    totalDueToday: breakdown.total,
    currency: 'CAD',
    oneWayFeePaidAtCounter: breakdown.payAtCounter,
  };
}

// --- Tools ------------------------------------------------------------------------------------
const consentTool = () => ({
  name: 'set_cookie_preferences',
  description: 'Save the visitor’s cookie choices and close the cookie banner. Strictly necessary cookies are always on; each optional category is off unless set to true.',
  inputSchema: {
    type: 'object',
    properties: {
      analytics: { type: 'boolean', description: 'Performance and analytics cookies.' },
      personalisation: { type: 'boolean', description: 'Personalisation cookies, e.g. remembering recent searches.' },
      advertising: { type: 'boolean', description: 'Advertising cookies used to show offers on other websites.' },
    },
  },
  async execute({ analytics = false, personalisation = false, advertising = false } = {}) {
    const record = saveConsent({
      analytics: analytics === true, personal: personalisation === true, ads: advertising === true,
    }, 'tool');
    return reply({
      success: true,
      saved: {
        necessary: true,
        analytics: record.analytics,
        personalisation: record.personal,
        advertising: record.ads,
      },
    });
  },
});

const findLocationsTool = () => ({
  name: 'find_rental_locations',
  description: 'Find pick-up and drop-off locations (airports, railway stations, city branches) by city, location name or airport code. Returns the location ids that search_cars needs.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', minLength: 2, description: 'City, place name or airport code, e.g. "Toronto" or "YUL".' } },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  async execute({ query } = {}) {
    if (String(query || '').trim().length < 2) return fail('Enter at least 2 characters.');
    const matches = searchLocations(query).map(place);
    return reply({ success: true, count: matches.length, locations: matches });
  },
});

const searchCarsTool = ({ base }) => ({
  name: 'search_cars',
  description: 'Search rental cars for a pick-up and drop-off location and dates, then open the results page. Get location ids from find_rental_locations first.',
  inputSchema: {
    type: 'object',
    properties: {
      pickupLocationId: { type: 'string', description: 'Location id from find_rental_locations, e.g. "YYZ".' },
      dropoffLocationId: { type: 'string', description: 'Location id for the drop-off. Leave out to return the car where it was picked up.' },
      pickupDate: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
      pickupTime: { type: 'string', enum: TIMES, description: '24-hour time in 30-minute steps. Default 10:00.' },
      dropoffDate: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
      dropoffTime: { type: 'string', enum: TIMES, description: '24-hour time in 30-minute steps. Default 10:00.' },
      driverAge: {
        type: 'integer', minimum: 18, maximum: 99, description: 'Driver’s age at pick-up. Default 30.',
      },
    },
    required: ['pickupLocationId', 'pickupDate', 'dropoffDate'],
  },
  async execute(args = {}) {
    const pickup = findLocation(args.pickupLocationId);
    const dropoff = args.dropoffLocationId ? findLocation(args.dropoffLocationId) : pickup;
    const values = {
      pickup: pickup?.id || '',
      dropoff: dropoff?.id || '',
      pickupDate: args.pickupDate,
      pickupTime: args.pickupTime || '10:00',
      dropoffDate: args.dropoffDate,
      dropoffTime: args.dropoffTime || '10:00',
      driverAge: String(args.driverAge ?? 30),
    };
    const errors = {};
    if (!pickup) errors.pickupLocationId = 'Unknown location id. Use find_rental_locations.';
    if (!dropoff) errors.dropoffLocationId = 'Unknown location id. Use find_rental_locations.';
    const start = parseIso(values.pickupDate);
    if (!start || start < today()) errors.pickupDate = 'Use a date from today onwards, as YYYY-MM-DD.';
    if (!parseIso(values.dropoffDate) || rentalDays(values) <= 0) errors.dropoffDate = 'Use a drop-off after the pick-up, as YYYY-MM-DD.';
    if (!TIMES.includes(values.pickupTime)) errors.pickupTime = 'Use HH:MM in 30-minute steps.';
    if (!TIMES.includes(values.dropoffTime)) errors.dropoffTime = 'Use HH:MM in 30-minute steps.';
    const age = Number(values.driverAge);
    if (!(age >= 18 && age <= 99)) errors.driverAge = 'Use an age between 18 and 99.';
    const firstError = Object.keys(errors)[0];
    beacon('car_search', {
      success: !firstError, via: 'tool', args: values, error: firstError,
    });
    if (firstError) return fail('Some search details are not valid.', { errors });
    go(stepUrl(base, 'results', values));
    return reply({
      success: true,
      pickup: place(pickup),
      dropoff: place(dropoff),
      rentalDays: rentalDays(values),
      next: 'The results page is opening. Use list_available_cars there.',
    });
  },
});

const listCarsTool = ({ params }) => ({
  name: 'list_available_cars',
  description: 'List the cars available for the current search, with supplier and total price. Optionally filter by size or supplier and sort.',
  inputSchema: {
    type: 'object',
    properties: {
      size: { type: 'string', enum: SIZES, description: 'Only cars of this size.' },
      supplierId: { type: 'string', enum: SUPPLIERS.map((s) => s.id), description: 'Only cars from this supplier.' },
      sort: {
        type: 'string', enum: ['price-asc', 'price-desc', 'score'], description: 'Default price-asc.',
      },
    },
  },
  annotations: { readOnlyHint: true },
  async execute({ size, supplierId, sort = 'price-asc' } = {}) {
    const pickup = findLocation(params.pickup);
    const dropoff = findLocation(params.dropoff) || pickup;
    const days = rentalDays(params);
    if (!pickup || !days) return fail('The search is incomplete. Use search_cars first.');
    let offers = buildOffers({ pickup, dropoff, days })
      .filter((o) => (!size || o.category.size.toLowerCase() === String(size).toLowerCase())
        && (!supplierId || o.supplier.id === String(supplierId).toLowerCase()));
    if (sort === 'price-desc') offers.sort((a, b) => b.total - a.total);
    else if (sort === 'score') offers.sort((a, b) => (b.supplier.score - a.supplier.score) || (a.total - b.total));
    else offers.sort((a, b) => a.total - b.total);
    offers = offers.map((o) => ({
      offerId: o.id,
      car: o.category.name,
      size: o.category.size,
      similar: o.category.similar,
      seats: o.category.seats,
      largeBags: o.category.bags,
      transmission: o.transmission,
      supplier: o.supplier.name,
      supplierId: o.supplier.id,
      renterScore: o.supplier.score,
      pickupInfo: o.supplier.counter,
      pricePerDay: o.daily,
      totalPrice: o.total,
      oneWayFeePaidAtCounter: o.oneWayFee,
    }));
    return reply({
      success: true,
      pickup: place(pickup),
      dropoff: place(dropoff),
      rentalDays: days,
      currency: 'CAD',
      note: 'totalPrice includes taxes. A one-way fee, if any, is paid to the supplier at pick-up.',
      count: offers.length,
      cars: offers,
    });
  },
});

const selectCarTool = ({ base, params }) => ({
  name: 'select_car',
  description: 'Choose a car from list_available_cars and continue to protection and extras. If the drop-off is in another city, the supplier charges a one-way fee at the counter, which must be accepted.',
  inputSchema: {
    type: 'object',
    properties: {
      offerId: { type: 'string', description: 'offerId from list_available_cars.' },
      acceptOneWayFee: { type: 'boolean', description: 'Accept the one-way fee paid at the counter, when there is one.' },
    },
    required: ['offerId'],
  },
  async execute({ offerId, acceptOneWayFee } = {}) {
    const booking = resolveBooking({ ...params, offer: offerId });
    if (!booking) return fail('Unknown offerId for this search. Use list_available_cars.');
    const { offer } = booking;
    if (offer.oneWayFee > 0 && acceptOneWayFee !== true) {
      return fail(`${offer.supplier.name} charges a one-way fee of CAD ${offer.oneWayFee} at pick-up for this route. Call again with acceptOneWayFee: true to accept it.`, { oneWayFeePaidAtCounter: offer.oneWayFee });
    }
    beacon('car_select', { via: 'tool', args: { offer: offer.id, size: offer.category.size, total: offer.total } });
    if (offer.oneWayFee > 0) {
      beacon('car_oneway_dialog', { success: true, via: 'tool', args: { offer: offer.id, fee: offer.oneWayFee } });
    }
    go(stepUrl(base, 'extras', { ...pick(params, SEARCH_KEYS), offer: offer.id }));
    return reply({
      success: true,
      selected: {
        offerId: offer.id,
        car: offer.category.name,
        supplier: offer.supplier.name,
        totalPrice: offer.total,
      },
      oneWayFeePaidAtCounter: offer.oneWayFee,
      next: 'The protection and extras page is opening. Use get_rental_options there.',
    });
  },
});

const optionsTool = ({ params }) => ({
  name: 'get_rental_options',
  description: 'Show the selected car, the rates (protection) and the optional extras with their prices.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const booking = resolveBooking(params);
    if (!booking) return fail('No car is selected. Go back to the results.');
    return reply({
      success: true,
      booking: bookingFacts(booking, params),
      rates: RATES.map((r) => ({
        id: r.id,
        name: r.name,
        pricePerDayInclTax: round2(r.perDay * (1 + TAX_RATE)),
        includes: r.includes,
      })),
      extras: EXTRAS.map((e) => ({
        id: e.id, name: e.name, pricePerDay: e.perDay, maxQuantity: e.max,
      })),
      note: 'Extras are charged per day, plus tax.',
    });
  },
});

const chooseOptionsTool = ({ base, params }) => ({
  name: 'choose_rate_and_extras',
  description: 'Choose the rate and any optional extras for the selected car, then continue to driver details and payment.',
  inputSchema: {
    type: 'object',
    properties: {
      rate: { type: 'string', enum: RATES.map((r) => r.id), description: 'Rate id from get_rental_options.' },
      extras: {
        type: 'array',
        description: 'Optional extras. Leave empty for none.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: EXTRAS.map((e) => e.id) },
            quantity: { type: 'integer', minimum: 0 },
          },
          required: ['id', 'quantity'],
        },
      },
    },
    required: ['rate'],
  },
  async execute({ rate, extras = [] } = {}) {
    const booking = resolveBooking(params);
    if (!booking) return fail('No car is selected. Go back to the results.');
    if (!RATES.some((r) => r.id === rate)) return fail('Unknown rate. Use an id from get_rental_options.');
    const chosen = {};
    const errors = {};
    (Array.isArray(extras) ? extras : []).forEach(({ id, quantity }) => {
      const extra = EXTRAS.find((e) => e.id === id);
      const qty = Number(quantity);
      if (!extra) errors[id] = 'Unknown extra.';
      else if (!Number.isInteger(qty) || qty < 0 || qty > extra.max) errors[id] = `Quantity must be 0 to ${extra.max}.`;
      else if (qty > 0) chosen[id] = qty;
    });
    if (Object.keys(errors).length) return fail('Some extras are not valid.', { errors });
    const serialized = serializeExtras(chosen);
    beacon('car_extras', {
      success: true, via: 'tool', args: { offer: booking.offer.id, rate, extras: serialized },
    });
    const next = {
      ...pick(params, SEARCH_KEYS), offer: booking.offer.id, rate, extras: serialized,
    };
    go(stepUrl(base, 'checkout', next));
    return reply({
      success: true,
      booking: bookingFacts(booking, next),
      next: 'The driver and payment page is opening. Use fill_driver_details, then confirm_purchase.',
    });
  },
});

const confirmationOf = (container) => {
  const ref = container.querySelector('.cr-confirmation-ref strong');
  return ref ? ref.textContent : null;
};

const summaryTool = ({ params, container }) => ({
  name: 'get_booking_summary',
  description: 'Show the booking being paid for: car, supplier, locations, dates, rate, extras and price. After payment it also returns the booking reference.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  async execute() {
    const booking = resolveBooking(params);
    if (!booking) return fail('No car is selected. Go back to the results.');
    const reference = confirmationOf(container);
    return reply({
      success: true,
      status: reference ? 'confirmed' : 'awaiting_payment',
      bookingReference: reference || undefined,
      booking: bookingFacts(booking, params),
    });
  },
});

function setField(form, id, value) {
  const control = form.elements[id];
  if (!control || value === undefined || value === null) return;
  control.value = String(value);
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

const DETAIL_KEYS = [...DRIVER_FIELDS, 'address1', 'address2', ...BILLING_FIELDS.slice(1)];

const fillDetailsTool = ({ container }) => ({
  name: 'fill_driver_details',
  description: 'Fill in the main driver’s details and billing address on the checkout form. Use the details exactly as on the driver’s licence.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', enum: ['Mr', 'Ms', 'Mrs', 'Mx'] },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      age: { type: 'integer', minimum: 18, maximum: 99 },
      phone: { type: 'string', description: 'Mobile phone with area code.' },
      email: { type: 'string', format: 'email', description: 'The rental voucher is sent here.' },
      address1: { type: 'string', description: 'Street address.' },
      address2: { type: 'string', description: 'Apartment or suite (optional).' },
      city: { type: 'string' },
      province: { type: 'string', enum: PROVINCES, description: 'Province or territory code.' },
      postalCode: { type: 'string', description: 'Like A1A 1A1.' },
      country: { type: 'string', enum: ['CA', 'US'] },
      rememberDetails: { type: 'boolean', description: 'Remember these driver details for the next booking. The box is ticked on the page by default.' },
    },
    required: ['title', 'firstName', 'lastName', 'age', 'phone', 'email', 'address1', 'city', 'province', 'postalCode'],
  },
  async execute(args = {}) {
    const form = container.querySelector('.cr-checkout-form');
    if (!form) return fail(confirmationOf(container) ? 'This booking is already confirmed.' : 'The checkout form is not available.');
    DETAIL_KEYS.forEach((id) => setField(form, id, args[id]));
    if (typeof args.rememberDetails === 'boolean') {
      form.elements.saveProfile.checked = args.rememberDetails;
      form.elements.saveProfile.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const errors = {};
    [...DRIVER_FIELDS, ...BILLING_FIELDS].forEach((id) => {
      const message = RULES[id](form.elements[id].value, form);
      setError(form, id, message);
      if (message) errors[id] = message;
    });
    const ok = Object.keys(errors).length === 0;
    return reply({
      success: ok,
      error: ok ? undefined : 'Some details are missing or not valid.',
      errors: ok ? undefined : errors,
      rememberDetails: form.elements.saveProfile.checked,
      next: ok ? 'Now call confirm_purchase with the payment card.' : undefined,
    });
  },
});

const confirmTool = ({ params, container }) => ({
  name: 'confirm_purchase',
  description: 'Pay for the booking with a card and confirm it. Charges the total due today. Fill the driver details first with fill_driver_details. Returns the booking reference when the payment is accepted.',
  inputSchema: {
    type: 'object',
    properties: {
      cardName: { type: 'string', description: 'Name as shown on the card.' },
      cardNumber: { type: 'string', description: 'Card number.' },
      cardExpiry: { type: 'string', pattern: '^(0[1-9]|1[0-2])/\\d{2}$', description: 'MM/YY' },
      cardCvc: { type: 'string', pattern: '^\\d{3,4}$', description: '3 or 4 digit security code.' },
      acceptTerms: { type: 'boolean', description: 'Accept the rental conditions and the privacy notice. Required to book.' },
    },
    required: ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc', 'acceptTerms'],
  },
  async execute(args = {}) {
    const done = confirmationOf(container);
    if (done) return reply({ success: true, alreadyConfirmed: true, bookingReference: done });
    const form = container.querySelector('.cr-checkout-form');
    if (!form) return fail('The checkout form is not available.');
    ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc'].forEach((id) => setField(form, id, args[id]));
    form.elements.terms.checked = args.acceptTerms === true;
    const outcome = new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ status: 'timeout' }), 15000);
      container.addEventListener('cr-checkout-result', (event) => {
        clearTimeout(timer);
        resolve(event.detail);
      }, { once: true });
    });
    form.querySelector('.cr-confirm').click();
    const result = await outcome;
    if (result.status === 'confirmed') {
      const booking = resolveBooking(params);
      return reply({
        success: true,
        status: 'confirmed',
        bookingReference: result.reference,
        booking: booking ? bookingFacts(booking, params) : undefined,
        voucherSentTo: form.elements.email.value,
      });
    }
    if (result.status === 'declined') return fail('The card was declined.', { errors: result.errors });
    if (result.status === 'invalid') return fail('Some details are missing or not valid.', { errors: result.errors });
    return fail('The payment did not finish. Try again.');
  },
});

const STEP_TOOLS = {
  search: [findLocationsTool, searchCarsTool],
  results: [listCarsTool, selectCarTool, findLocationsTool, searchCarsTool],
  extras: [optionsTool, chooseOptionsTool],
  checkout: [summaryTool, fillDetailsTool, confirmTool],
};

/** Wraps a tool so each call is logged, then registers it with the page's model context. */
export function registerTool(context, tool) {
  const wrapped = {
    ...tool,
    async execute(args, ...rest) {
      const started = performance.now();
      const origin = callOrigin(tool.name);
      let result;
      let error;
      try {
        result = await tool.execute(args || {}, ...rest);
        return result;
      } catch (e) {
        error = e;
        throw e;
      } finally {
        const data = parseReply(result);
        beacon('tool_call', {
          tool: tool.name,
          via: origin.via,
          route: origin.route,
          stack: origin.stack,
          success: !error && data?.success !== false,
          error: error ? String(error.message || error).slice(0, 600) : data?.error,
          durationMs: Math.round(performance.now() - started),
          args: redact(args),
        });
      }
    },
  };
  try {
    context.registerTool(wrapped);
    return true;
  } catch {
    return false;
  }
}

const nativeContext = () => document.modelContext || navigator.modelContext;

export default function registerTools(options, context = nativeContext()) {
  if (!context || typeof context.registerTool !== 'function') return [];
  wrapScriptEntryPoints();
  const tools = (STEP_TOOLS[options.step] || []).map((make) => make(options));
  if (!consentChoices()) tools.push(consentTool());
  const names = tools.filter((tool) => registerTool(context, tool)).map((tool) => tool.name);
  beacon('car_tools_registered', { args: { step: options.step, tools: names } });
  return names;
}
