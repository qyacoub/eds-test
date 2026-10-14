/*
 * Demo data for the car-rental flow. Suppliers, prices, fees and copy are invented for this
 * test site; place names and airport codes are public facts. Nothing here is bookable.
 */

export const LOCATION_TYPES = [
  { id: 'airport', label: 'Airports' },
  { id: 'rail', label: 'Railway stations' },
  { id: 'city', label: 'City branches' },
];

// `label` intentionally uses short display names ("Intl."), like many travel sites do.
export const LOCATIONS = [
  {
    id: 'YYZ', type: 'airport', city: 'Toronto', region: 'ON', country: 'CA', label: 'Toronto – Pearson Intl. Airport (YYZ)',
  },
  {
    id: 'YTZ', type: 'airport', city: 'Toronto', region: 'ON', country: 'CA', label: 'Toronto – Billy Bishop City Airport (YTZ)',
  },
  {
    id: 'YUL', type: 'airport', city: 'Montréal', region: 'QC', country: 'CA', label: 'Montréal – Trudeau Intl. Airport (YUL)',
  },
  {
    id: 'YQB', type: 'airport', city: 'Québec City', region: 'QC', country: 'CA', label: 'Québec City – Jean Lesage Intl. Airport (YQB)',
  },
  {
    id: 'YOW', type: 'airport', city: 'Ottawa', region: 'ON', country: 'CA', label: 'Ottawa – Macdonald-Cartier Intl. Airport (YOW)',
  },
  {
    id: 'YVR', type: 'airport', city: 'Vancouver', region: 'BC', country: 'CA', label: 'Vancouver Intl. Airport (YVR)',
  },
  {
    id: 'YYC', type: 'airport', city: 'Calgary', region: 'AB', country: 'CA', label: 'Calgary Intl. Airport (YYC)',
  },
  {
    id: 'YHZ', type: 'airport', city: 'Halifax', region: 'NS', country: 'CA', label: 'Halifax Stanfield Intl. Airport (YHZ)',
  },
  {
    id: 'AYQ', type: 'airport', city: 'Yulara', region: 'NT', country: 'AU', label: 'Yulara – Ayers Rock Airport (AYQ)',
  },
  {
    id: 'TOR-RAIL', type: 'rail', city: 'Toronto', region: 'ON', country: 'CA', label: 'Toronto – Union Station',
  },
  {
    id: 'MTL-RAIL', type: 'rail', city: 'Montréal', region: 'QC', country: 'CA', label: 'Montréal – Central Station',
  },
  {
    id: 'OTT-RAIL', type: 'rail', city: 'Ottawa', region: 'ON', country: 'CA', label: 'Ottawa – Tremblay Road Station',
  },
  {
    id: 'QC-RAIL', type: 'rail', city: 'Québec City', region: 'QC', country: 'CA', label: 'Québec City – Gare du Palais',
  },
  {
    id: 'TOR-DT', type: 'city', city: 'Toronto', region: 'ON', country: 'CA', label: 'Toronto – Downtown (Front St W)',
  },
  {
    id: 'TOR-NY', type: 'city', city: 'Toronto', region: 'ON', country: 'CA', label: 'Toronto – North York',
  },
  {
    id: 'MTL-DT', type: 'city', city: 'Montréal', region: 'QC', country: 'CA', label: 'Montréal – Downtown (René-Lévesque Blvd)',
  },
  {
    id: 'MTL-OLD', type: 'city', city: 'Montréal', region: 'QC', country: 'CA', label: 'Montréal – Old Montréal',
  },
  {
    id: 'MTL-LAV', type: 'city', city: 'Laval', region: 'QC', country: 'CA', label: 'Laval – Montmorency',
  },
  {
    id: 'OTT-DT', type: 'city', city: 'Ottawa', region: 'ON', country: 'CA', label: 'Ottawa – ByWard Market',
  },
  {
    id: 'QC-DT', type: 'city', city: 'Québec City', region: 'QC', country: 'CA', label: 'Québec City – Saint-Roch',
  },
  {
    id: 'YUL-TS', type: 'city', city: 'Yulara', region: 'NT', country: 'AU', label: 'Yulara – Town Square',
  },
  {
    id: 'YUL-RS', type: 'city', city: 'Yulara', region: 'NT', country: 'AU', label: 'Yulara – Resort Shopping Centre',
  },
];

export const findLocation = (id) => LOCATIONS.find((loc) => loc.id === id) || null;

const normalize = (text) => String(text || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

/** Plain substring match on label, city and code: the same simple lookup many booking sites use. */
export function searchLocations(query) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const typeOrder = LOCATION_TYPES.map((t) => t.id);
  return LOCATIONS
    .filter((loc) => [loc.label, loc.city, loc.id].some((field) => normalize(field).includes(q)))
    .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
      || a.label.localeCompare(b.label));
}

export const SUPPLIERS = [
  {
    id: 'maple', name: 'Maple Lane Rent-a-Car', factor: 1, oneWayFee: 275, counter: 'Counter in terminal', score: 8.2,
  },
  {
    id: 'heron', name: 'Blue Heron Auto', factor: 0.93, oneWayFee: 320, counter: 'Free shuttle to lot', score: 7.4,
  },
  {
    id: 'polar', name: 'Polar Fleet', factor: 1.07, oneWayFee: 225, counter: 'Counter in terminal', score: 8.6,
  },
  {
    id: 'laurentide', name: 'Laurentide Car Hire', factor: 0.98, oneWayFee: 295, counter: 'Counter in terminal', score: 7.9,
  },
  {
    id: 'harbour', name: 'Harbourline Rentals', factor: 1.12, oneWayFee: 0, counter: 'Meet & greet at arrivals', score: 8.9,
  },
];

export const SIZES = ['Economy', 'Compact', 'Intermediate', 'Standard', 'Full-size', 'SUV', 'Minivan', 'Premium'];

export const CATEGORIES = [
  {
    id: 'eco', name: 'Economy', size: 'Economy', similar: '4-door hatchback or similar', seats: 4, bags: 1, doors: 4, daily: 36,
  },
  {
    id: 'cmp', name: 'Compact', size: 'Compact', similar: 'Compact sedan or similar', seats: 5, bags: 2, doors: 4, daily: 41,
  },
  {
    id: 'int', name: 'Intermediate', size: 'Intermediate', similar: 'Mid-size sedan or similar', seats: 5, bags: 2, doors: 4, daily: 46,
  },
  {
    id: 'std', name: 'Standard', size: 'Standard', similar: 'Roomy sedan or similar', seats: 5, bags: 3, doors: 4, daily: 52,
  },
  {
    id: 'ful', name: 'Full-size', size: 'Full-size', similar: 'Large sedan or similar', seats: 5, bags: 3, doors: 4, daily: 58,
  },
  {
    id: 'isuv', name: 'Intermediate SUV', size: 'SUV', similar: '5-seat crossover or similar', seats: 5, bags: 3, doors: 4, daily: 66,
  },
  {
    id: 'ssuv', name: 'Standard SUV', size: 'SUV', similar: '5-seat AWD SUV or similar', seats: 5, bags: 4, doors: 4, daily: 77,
  },
  {
    id: 'fsuv', name: 'Full-size SUV', size: 'SUV', similar: '7-seat 4x4 SUV or similar', seats: 7, bags: 4, doors: 4, daily: 96,
  },
  {
    id: 'mvan', name: 'Minivan', size: 'Minivan', similar: '7-seat minivan or similar', seats: 7, bags: 5, doors: 4, daily: 88,
  },
  {
    id: 'prem', name: 'Premium sedan', size: 'Premium', similar: 'Executive sedan or similar', seats: 5, bags: 3, doors: 4, daily: 92,
  },
];

// Which categories each supplier offers (keeps the list varied, ~30 cars).
const FLEET = {
  maple: ['eco', 'cmp', 'int', 'std', 'isuv', 'fsuv', 'mvan'],
  heron: ['eco', 'cmp', 'int', 'ful', 'isuv', 'ssuv'],
  polar: ['cmp', 'std', 'ful', 'ssuv', 'fsuv', 'prem'],
  laurentide: ['eco', 'int', 'std', 'isuv', 'mvan', 'prem'],
  harbour: ['cmp', 'ful', 'ssuv', 'fsuv', 'prem'],
};

export const TAX_RATE = 0.13;

export const RATES = [
  {
    id: 'basic',
    name: 'Basic rate',
    perDay: 0,
    includes: ['Third-party liability (provincial minimum)', 'Unlimited kilometres', 'Taxes and airport fees'],
  },
  {
    id: 'carefree',
    name: 'Carefree rate',
    perDay: 27.5,
    includes: ['Everything in Basic', 'Collision damage cover, no deductible', 'Theft cover', 'Free cancellation up to 24 h before pick-up'],
  },
];

export const EXTRAS = [
  {
    id: 'childSeat', name: 'Child seat (9–18 kg)', perDay: 11.99, max: 3,
  },
  {
    id: 'booster', name: 'Booster seat (15–36 kg)', perDay: 8.99, max: 3,
  },
  {
    id: 'gps', name: 'Navigation unit', perDay: 12.5, max: 1,
  },
  {
    id: 'driver', name: 'Additional driver', perDay: 13.99, max: 2,
  },
  {
    id: 'roadside', name: 'Roadside assistance plus', perDay: 6.99, max: 1,
  },
];

const round2 = (n) => Math.round(n * 100) / 100;

// Small deterministic jitter so prices differ per route but stay stable on reload.
function routeJitter(seed) {
  let hash = 0;
  [...seed].forEach((ch) => { hash = (hash * 31 + ch.charCodeAt(0)) % 9973; });
  return 0.95 + (hash % 100) / 1000;
}

/** Offer list for a search; [] when the route is not served (e.g. different countries). */
export function buildOffers({ pickup, dropoff, days }) {
  if (!pickup || !dropoff || pickup.country !== dropoff.country) return [];
  const oneWay = pickup.city !== dropoff.city;
  const offers = [];
  SUPPLIERS.forEach((supplier) => {
    FLEET[supplier.id].forEach((catId) => {
      const category = CATEGORIES.find((c) => c.id === catId);
      const jitter = routeJitter(`${pickup.id}-${dropoff.id}-${supplier.id}-${catId}`);
      const daily = round2(category.daily * supplier.factor * jitter);
      offers.push({
        id: `${supplier.id}-${catId}`,
        supplier,
        category,
        daily,
        days,
        total: round2(daily * days * (1 + TAX_RATE)),
        transmission: 'Automatic',
        oneWayFee: oneWay ? supplier.oneWayFee : 0,
      });
    });
  });
  return offers;
}

export function priceBreakdown(offer, rateId = 'basic', extras = {}) {
  const rate = RATES.find((r) => r.id === rateId) || RATES[0];
  const lines = [{ label: `${offer.category.name}, ${offer.days} day${offer.days > 1 ? 's' : ''}`, amount: offer.total }];
  if (rate.perDay) {
    lines.push({ label: rate.name, amount: round2(rate.perDay * offer.days * (1 + TAX_RATE)) });
  }
  EXTRAS.forEach((extra) => {
    const qty = Number(extras[extra.id] || 0);
    if (qty > 0) {
      lines.push({
        label: `${extra.name}${qty > 1 ? ` × ${qty}` : ''}`,
        amount: round2(extra.perDay * qty * offer.days * (1 + TAX_RATE)),
      });
    }
  });
  const total = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  return { lines, total, payAtCounter: offer.oneWayFee };
}
