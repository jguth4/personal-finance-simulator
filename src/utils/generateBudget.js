import { computeRent, AMENITIES } from '../data/neighborhoods';
import { TAKE_HOME_MONTHLY } from '../data/taxConstants';

// ── Per-category calculators ─────────────────────────────────────────────

function calcDelivery(freq, orderCost) {
  const perWeek = { never: 0, low: 1.5, mid: 3.5, high: 5.5 };
  // Includes food + fees + tip — NYC delivery avg adds $8–12 per order
  const totalPerOrder = { cheap: 22, mid: 30, expensive: 47 };
  return Math.round((perWeek[freq] ?? 0) * (totalPerOrder[orderCost] ?? 30) * 4.33);
}

function calcDiningOut(freq, spend) {
  const nightsPerMonth = { low: 1.5, mid: 4, high: 8, vhigh: 12 };
  const perNight = { cheap: 25, mid: 50, high: 110, vhigh: 200 };
  return Math.round((nightsPerMonth[freq] ?? 4) * (perNight[spend] ?? 50));
}

function calcLunch(choice) {
  // Always bring: ~$20 (occasional bought); Mix: ~$120; Usually buy: ~$260
  return { bring: 20, mix: 120, buy: 260 }[choice] ?? 120;
}

function calcGroceries(deliveryFreq) {
  // More delivery → less home cooking → fewer groceries
  return { never: 420, low: 340, mid: 240, high: 180 }[deliveryFreq] ?? 340;
}

function calcTransit(nightTransport, dayUber, diningFreq) {
  const metroCard = 134; // NYC unlimited MetroCard 2025
  const nightsOut = { low: 1.5, mid: 4, high: 8, vhigh: 12 }[diningFreq] ?? 4;
  const uberPerTrip = 20;
  const nightUber = { subway: 0, uberOneWay: uberPerTrip, uberBothWays: uberPerTrip * 2 }[nightTransport] ?? 0;
  const dayExtra = { never: 0, sometimes: 20, often: 65, daily: 200 }[dayUber] ?? 0;
  return Math.round(metroCard + (nightUber * nightsOut) + dayExtra);
}

function calcSubscriptions(subList = []) {
  const prices = {
    netflix: 15.49, spotify: 10.99, apple: 16.95, hulu: 17.99,
    youtube: 13.99, prime: 14.99, news: 17.00, adobe: 54.99,
    gaming: 14.99, fitness: 12.99, sports: 25.00, classpass: 79.00, mealkit: 75.00,
  };
  return Math.round(subList.reduce((sum, id) => sum + (prices[id] ?? 0), 0));
}

function calcClothing(freq, haul) {
  const timesPerMonth = { rarely: 0.2, monthly: 1, weekly: 4 };
  const avgHaul = { small: 35, medium: 100, large: 300, xlarge: 650 };
  return Math.round((timesPerMonth[freq] ?? 1) * (avgHaul[haul] ?? 100));
}

function calcOnlineImpulse(freq, cost) {
  const ordersPerMonth = { never: 0, low: 1.5, mid: 4, high: 6.5 };
  const avgOrder = { cheap: 15, mid: 35, high: 75, vhigh: 150 };
  return Math.round((ordersPerMonth[freq] ?? 1.5) * (avgOrder[cost] ?? 35));
}

function calcCoffee(freq) {
  const perWeek = { never: 0, low: 1.5, mid: 4, daily: 7 };
  return Math.round((perWeek[freq] ?? 0) * 6.50 * 4.33); // $6.50 avg NYC specialty drink
}

function calcBeauty(freq, spend) {
  const timesPerMonth = { rarely: 0.25, monthly: 1, biweekly: 2, weekly: 4 };
  const perVisit = { cheap: 22, mid: 55, high: 140, vhigh: 280 };
  return Math.round((timesPerMonth[freq] ?? 1) * (perVisit[spend] ?? 55));
}

function calcEvents(freq) {
  const eventsPerMonth = { none: 0, one: 1, some: 2.5, many: 5 };
  return Math.round((eventsPerMonth[freq] ?? 1) * 95); // $95 avg NYC event
}

function calcTravel(tripsPerYear, tripType) {
  const trips = { none: 0, low: 1.5, mid: 3.5, high: 6 }[tripsPerYear] ?? 1.5;
  const costPerTrip = { domestic: 400, city: 750, international: 1850 }[tripType] ?? 750;
  return Math.round((trips * costPerTrip) / 12);
}

function calcGym(gymChoice, amenityIds = []) {
  if (amenityIds.includes('gymInBuilding')) return 0;
  return { nothing: 0, budget: 18, mid: 60, premium: 250 }[gymChoice] ?? 60;
}

// ── Main export ───────────────────────────────────────────────────────────

// Returns an array of budget line items derived purely from interview answers.
// Each item: { id, name, amount, benchmarkId, group }
export function generateBudget(housingAnswers, interviewAnswers) {
  const h = housingAnswers;
  const a = interviewAnswers;
  const amenities = h.amenities ?? [];

  return [
    // Housing
    {
      id: 'rent', name: 'Rent', group: 'Housing',
      amount: computeRent(h.neighborhood, h.livingSituation, amenities),
      benchmarkId: null,
    },
    {
      id: 'utilities', name: 'Utilities', group: 'Housing',
      amount: 70,
      benchmarkId: 'utilities',
    },

    // Food
    {
      id: 'groceries', name: 'Groceries', group: 'Food',
      amount: calcGroceries(a.deliveryFreq),
      benchmarkId: 'groceries',
    },
    {
      id: 'food_delivery', name: 'Food delivery', group: 'Food',
      amount: calcDelivery(a.deliveryFreq, a.deliveryOrderCost),
      benchmarkId: 'food_delivery',
    },
    {
      id: 'dining_out', name: 'Dining out & nightlife', group: 'Food',
      amount: calcDiningOut(a.nightsOutFreq, a.nightsOutSpend),
      benchmarkId: 'dining_out',
    },
    {
      id: 'lunch', name: 'Lunch at work', group: 'Food',
      amount: calcLunch(a.lunch),
      benchmarkId: 'lunch',
    },
    {
      id: 'coffee', name: 'Coffee & cafe drinks', group: 'Food',
      amount: calcCoffee(a.coffeeFreq),
      benchmarkId: 'coffee',
    },

    // Getting Around
    {
      id: 'transit', name: 'Transportation', group: 'Getting Around',
      amount: calcTransit(a.nightTransport, a.dayUber, a.nightsOutFreq),
      benchmarkId: 'transit',
    },

    // Subscriptions & Shopping
    {
      id: 'subscriptions', name: 'Subscriptions', group: 'Subscriptions & Shopping',
      amount: calcSubscriptions(a.subscriptions),
      benchmarkId: 'subscriptions',
    },
    {
      id: 'clothing', name: 'Clothing & accessories', group: 'Subscriptions & Shopping',
      amount: calcClothing(a.clothingFreq, a.clothingHaul),
      benchmarkId: 'clothing',
    },
    {
      id: 'impulse_online', name: 'Online impulse buys', group: 'Subscriptions & Shopping',
      amount: calcOnlineImpulse(a.onlineOrders, a.onlineOrderCost),
      benchmarkId: 'impulse_online',
    },

    // Personal & Lifestyle
    {
      id: 'beauty_grooming', name: 'Beauty & grooming', group: 'Personal & Lifestyle',
      amount: calcBeauty(a.beautyFreq, a.beautySpend),
      benchmarkId: 'beauty_grooming',
    },
    {
      id: 'events', name: 'Events & entertainment', group: 'Personal & Lifestyle',
      amount: calcEvents(a.eventsPerMonth),
      benchmarkId: 'events',
    },
    {
      id: 'travel', name: 'Travel (amortized)', group: 'Personal & Lifestyle',
      amount: calcTravel(a.tripsPerYear, a.tripType),
      benchmarkId: 'travel',
    },
    {
      id: 'gym', name: 'Gym & fitness', group: 'Personal & Lifestyle',
      amount: calcGym(a.gym, amenities),
      benchmarkId: 'gym',
    },

    // Essential / Fixed
    {
      id: 'health_insurance', name: 'Health insurance', group: 'Essential',
      amount: 175,
      benchmarkId: 'health_insurance',
    },
    {
      id: 'phone', name: 'Phone plan', group: 'Essential',
      amount: 75,
      benchmarkId: 'phone',
    },
    {
      id: 'renters_insurance', name: 'Renters insurance', group: 'Essential',
      amount: 20,
      benchmarkId: 'renters_insurance',
    },
  ];
}

// Maps a generated budget to closest tier selections for the BudgetBuilder sandbox.
// Returns { categoryId: tierIndex } compatible with categories.js DEFAULT_SELECTIONS shape.
export function mapToSelections(generatedBudget, categories) {
  const amountById = Object.fromEntries(generatedBudget.map((i) => [i.id, i.amount]));

  // Combined food spending (delivery + dining + coffee + lunch) → "dining" category
  const combinedFood = (amountById.food_delivery ?? 0)
    + (amountById.dining_out ?? 0)
    + (amountById.coffee ?? 0)
    + (amountById.lunch ?? 0);

  // Combined entertainment (subscriptions + events + impulse) → "entertainment" / "misc"
  const combinedEntertainment = (amountById.subscriptions ?? 0) + (amountById.events ?? 0);
  const combinedMisc = amountById.impulse_online ?? 0;

  const generated = {
    rent: amountById.rent,
    groceries: amountById.groceries,
    dining: combinedFood,
    transit: amountById.transit,
    health: amountById.health_insurance,
    phone: amountById.phone,
    renters_insurance: amountById.renters_insurance,
    utilities: amountById.utilities,
    personal_care: amountById.beauty_grooming,
    clothing: amountById.clothing,
    entertainment: combinedEntertainment,
    gym: amountById.gym,
    student_loans: 0,
    savings: 0,
    misc: combinedMisc,
  };

  const selections = {};
  for (const cat of categories) {
    const targetAmount = generated[cat.id] ?? cat.tiers[cat.defaultTier].amount;
    let bestTier = 0;
    let minDiff = Infinity;
    cat.tiers.forEach((tier, i) => {
      const diff = Math.abs(tier.amount - targetAmount);
      if (diff < minDiff) { minDiff = diff; bestTier = i; }
    });
    selections[cat.id] = bestTier;
  }
  return selections;
}
