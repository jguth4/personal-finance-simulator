// NYC 2026 tax calculations — single filer, standard deductions
// Source: IRS Rev. Proc. 2024-61 (federal), NY Tax Law Art. 22 (state), NYC Admin. Code §11-1701 (city)

// ── Tax bracket helpers ───────────────────────────────────────────────────

function applyBrackets(taxableIncome, brackets) {
  let tax = 0;
  let prev = 0;
  for (const [rate, ceiling] of brackets) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, ceiling) - prev) * rate;
    prev = ceiling;
  }
  return Math.round(tax);
}

// Federal income tax — 2026 estimated brackets, single filer, standard deduction $15,000
function federalTax(gross) {
  const taxable = Math.max(0, gross - 15000);
  return applyBrackets(taxable, [
    [0.10,  12000],
    [0.12,  49000],
    [0.22, 104000],
    [0.24, 201000],
    [0.32, 245000],
    [0.35, 609000],
    [0.37, Infinity],
  ]);
}

// NY State income tax — 2025/2026 brackets, standard deduction $8,000
function nyStateTax(gross) {
  const taxable = Math.max(0, gross - 8000);
  return applyBrackets(taxable, [
    [0.0400,  17150],
    [0.0450,  23600],
    [0.0525,  27900],
    [0.0585, 161550],
    [0.0625, 323200],
    [0.0685, Infinity],
  ]);
}

// NYC city tax — 2025/2026 brackets, applied to NY AGI (gross − $8,000)
function nycTax(gross) {
  const nyAGI = Math.max(0, gross - 8000);
  return applyBrackets(nyAGI, [
    [0.03078,  12000],
    [0.03762,  25000],
    [0.03819,  50000],
    [0.03876, Infinity],
  ]);
}

// ── Marginal rate helper ──────────────────────────────────────────────────

function federalMarginalRate(taxable) {
  const brackets = [
    [0.10,  12000], [0.12,  49000], [0.22, 104000],
    [0.24, 201000], [0.32, 245000], [0.35, 609000], [0.37, Infinity],
  ];
  for (const [rate, ceiling] of brackets) {
    if (taxable <= ceiling) return rate;
  }
  return 0.37;
}

// ── Contribution limits (2025) ────────────────────────────────────────────
export const CONTRIBUTION_LIMITS = {
  ROTH_IRA_ANNUAL:          7000,
  TRADITIONAL_401K_ANNUAL: 23500,
  HSA_INDIVIDUAL_ANNUAL:    4300,
};

// ── Main export: compute full breakdown for any gross salary ──────────────

export function computeTaxBreakdown(grossAnnual) {
  const federal      = federalTax(grossAnnual);
  const nyState      = nyStateTax(grossAnnual);
  const nyc          = nycTax(grossAnnual);
  const ss           = Math.round(Math.min(grossAnnual, 176100) * 0.062);  // 2026 wage base est.
  const medicare     = Math.round(grossAnnual * 0.0145);
  const totalTax     = federal + nyState + nyc + ss + medicare;
  const takeHome     = grossAnnual - totalTax;

  const federalTaxable = Math.max(0, grossAnnual - 15000);
  const marginalFederal = federalMarginalRate(federalTaxable);
  const effectiveFederal = grossAnnual > 0 ? federal / grossAnnual : 0;
  const effectiveCombined = grossAnnual > 0 ? totalTax / grossAnnual : 0;

  return {
    grossAnnual,
    grossMonthly:       Math.round(grossAnnual / 12),
    takeHomeAnnual:     takeHome,
    takeHomeMonthly:    Math.round(takeHome / 12),
    totalTaxAnnual:     totalTax,
    marginalFederal,
    effectiveFederal:   Math.round(effectiveFederal * 1000) / 1000,
    effectiveCombined:  Math.round(effectiveCombined * 1000) / 1000,
    breakdown: [
      {
        label: 'Federal income tax',
        annual: federal,
        description: `Federal tax on income above the $15,000 standard deduction (~${((federal / grossAnnual) * 100).toFixed(1)}% effective rate)`,
      },
      {
        label: 'NY State income tax',
        annual: nyState,
        description: 'New York State income tax on income above the $8,000 NY standard deduction',
      },
      {
        label: 'NYC city tax',
        annual: nyc,
        description: 'New York City residents pay an additional city income tax on top of state taxes',
      },
      {
        label: 'Social Security',
        annual: ss,
        description: 'Federal payroll tax that funds Social Security retirement benefits (6.2% of gross)',
      },
      {
        label: 'Medicare',
        annual: medicare,
        description: 'Federal payroll tax that funds Medicare health coverage (1.45% of gross)',
      },
    ],
  };
}

// ── Default scenario: NYC college-grad median salary ─────────────────────
// Source: BLS Occupational Employment and Wage Statistics, NYC metro 2024
// (bachelor's degree holders, 22–27 age cohort)

export const GROSS_ANNUAL = 72500;

const _default = computeTaxBreakdown(GROSS_ANNUAL);

export const GROSS_MONTHLY      = _default.grossMonthly;
export const TAX_BREAKDOWN      = _default.breakdown;
export const TOTAL_TAX_ANNUAL   = _default.totalTaxAnnual;
export const TAKE_HOME_ANNUAL   = _default.takeHomeAnnual;
export const TAKE_HOME_MONTHLY  = _default.takeHomeMonthly;
export const MARGINAL_FEDERAL   = _default.marginalFederal;
export const EFFECTIVE_FEDERAL  = _default.effectiveFederal;
export const EFFECTIVE_COMBINED = _default.effectiveCombined;
