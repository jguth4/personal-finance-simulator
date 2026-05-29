// Monthly spending benchmarks for NYC adults aged 25–34.
// Primary source: BLS Consumer Expenditure Survey (CEX) 2023, Table 2 (age cohort).
// NYC adjustment: +20–25% applied to national figures for food, services, and entertainment
// based on MIT Living Wage Calculator NYC metro differential.
//
// Each entry: { monthlyBenchmark, label, source, sourceUrl, note }

export const BENCHMARKS = {

  // ── FOOD ──────────────────────────────────────────────────────────────────

  food_delivery: {
    monthlyBenchmark: 130,
    label: 'Food delivery',
    source: 'BLS CEX 2023 (NYC-adjusted)',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'Estimated from food-away-from-home subcategory; delivery platforms ~30% of that spend for this cohort',
  },

  dining_out: {
    monthlyBenchmark: 290,
    label: 'Dining out & nightlife',
    source: 'BLS CEX 2023, food away from home, 25–34 cohort (NYC-adjusted)',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg $4,099/yr for food away from home; NYC +25% = ~$430/mo total; split with delivery',
  },

  lunch: {
    monthlyBenchmark: 110,
    label: 'Work lunch (bought)',
    source: 'BLS CEX 2023 (estimated)',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'Based on avg NYC lunch $14, ~2x/week = $112/mo for workers who buy most days',
  },

  groceries: {
    monthlyBenchmark: 380,
    label: 'Groceries',
    source: 'BLS CEX 2023, food at home, 25–34 cohort (NYC-adjusted)',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg $5,163/yr ($430/mo); NYC grocery prices ~12% above national (USDA ERS)',
  },

  // ── TRANSPORTATION ────────────────────────────────────────────────────────

  transit: {
    monthlyBenchmark: 175,
    label: 'Transportation',
    source: 'MTA fare schedule 2024 + NYC Uber usage estimates',
    sourceUrl: 'https://new.mta.info/fares',
    note: 'Unlimited MetroCard $134 + avg $40/mo rideshare for NYC non-car-owners in this cohort',
  },

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

  subscriptions: {
    monthlyBenchmark: 85,
    label: 'Subscriptions',
    source: 'Antenna Subscription Economy Report 2023; JD Power 2023 Streaming Survey',
    sourceUrl: 'https://www.antenna.live/',
    note: 'US adults avg 4.2 paid subscriptions; 25–34 cohort skews higher at ~$85–100/mo',
  },

  // ── SHOPPING ──────────────────────────────────────────────────────────────

  clothing: {
    monthlyBenchmark: 120,
    label: 'Clothing & accessories',
    source: 'BLS CEX 2023, apparel & services, 25–34 cohort',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg $1,434/yr = $120/mo; NYC spending for this cohort tracks similarly',
  },

  impulse_online: {
    monthlyBenchmark: 65,
    label: 'Online impulse purchases',
    source: 'BLS CEX 2023, miscellaneous expenditures (estimated)',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'Estimated from misc category; Amazon Prime users average $600+/yr in non-subscription purchases',
  },

  coffee: {
    monthlyBenchmark: 55,
    label: 'Coffee & cafe drinks',
    source: 'National Coffee Association Drinking Trends Report 2023',
    sourceUrl: 'https://www.ncausa.org/research-trends/NCA-NCDT',
    note: 'Avg NYC specialty drink $6.50; ~2.5x/week for this demographic = ~$70/mo (benchmarked conservatively)',
  },

  // ── BEAUTY & GROOMING ─────────────────────────────────────────────────────

  beauty_grooming: {
    monthlyBenchmark: 80,
    label: 'Beauty & grooming',
    source: 'BLS CEX 2023, personal care products & services',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg $754/yr ($63/mo); NYC salon/nail service prices 25–30% above national = ~$80/mo',
  },

  // ── ENTERTAINMENT & EVENTS ────────────────────────────────────────────────

  events: {
    monthlyBenchmark: 105,
    label: 'Events & entertainment',
    source: 'BLS CEX 2023, entertainment fees & admissions, 25–34 cohort',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg $1,273/yr for fees/admissions; NYC ticketing premiums push this higher for active social cohort',
  },

  // ── TRAVEL ────────────────────────────────────────────────────────────────

  travel: {
    monthlyBenchmark: 135,
    label: 'Travel (amortized)',
    source: 'BLS CEX 2023, lodging & transportation, 25–34 cohort',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'National avg ~$1,600/yr on trips for this cohort = $133/mo amortized; NYC young adults travel frequently',
  },

  // ── FITNESS ───────────────────────────────────────────────────────────────

  gym: {
    monthlyBenchmark: 50,
    label: 'Gym & fitness',
    source: 'IHRSA (International Health, Racquet & Sportsclub Association) 2023',
    sourceUrl: 'https://www.ihrsa.org/publications/health-club-consumer-report/',
    note: 'US avg gym member pays $40–58/mo; NYC median ~$50 across membership types',
  },

  // ── FIXED / ESSENTIAL COSTS ───────────────────────────────────────────────

  utilities: {
    monthlyBenchmark: 70,
    label: 'Utilities',
    source: 'Con Edison average NYC residential electric bill 2024',
    sourceUrl: 'https://www.coned.com/en/accounts-billing/your-bill',
    note: 'Electric + internet; gas often included in NYC rent. Con Ed avg residential ~$100, shared = ~$50; internet ~$40–65',
  },

  phone: {
    monthlyBenchmark: 75,
    label: 'Phone plan',
    source: 'BLS CEX 2023, telephone services',
    sourceUrl: 'https://www.bls.gov/cex/tables.htm',
    note: 'Includes device installment plans; national avg ~$80/mo per person',
  },

  renters_insurance: {
    monthlyBenchmark: 18,
    label: 'Renters insurance',
    source: 'Insurance Information Institute 2024',
    sourceUrl: 'https://www.iii.org/fact-statistic/facts-statistics-renters-insurance',
    note: 'NYC avg renters insurance $175–250/yr; benchmark uses $216/yr = $18/mo',
  },

  health_insurance: {
    monthlyBenchmark: 175,
    label: 'Health insurance (employee share)',
    source: 'KFF Employer Health Benefits Survey 2023',
    sourceUrl: 'https://www.kff.org/health-costs/report/2023-employer-health-benefits-survey/',
    note: 'Avg employee premium contribution for single coverage: $1,401/yr = $117/mo; add avg out-of-pocket ~$58/mo',
  },

};

// Convenience: lookup by id, returns null if not found
export function getBenchmark(categoryId) {
  return BENCHMARKS[categoryId] ?? null;
}
