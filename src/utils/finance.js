// Shared financial calculation utilities

// Future value of a series of equal monthly contributions at a given annual rate
export function futureValue(monthlyContrib, annualRate, years) {
  if (annualRate === 0) return monthlyContrib * years * 12;
  const r = annualRate / 12;
  const n = years * 12;
  return monthlyContrib * ((Math.pow(1 + r, n) - 1) / r);
}

// Months to fully pay off a debt balance with a fixed monthly payment
export function debtPayoffMonths(balance, annualRate, monthlyPayment) {
  if (balance <= 0) return 0;
  if (annualRate === 0) return Math.ceil(balance / monthlyPayment);
  const r = annualRate / 12;
  if (monthlyPayment <= balance * r) return Infinity;
  return Math.ceil(Math.log(monthlyPayment / (monthlyPayment - balance * r)) / Math.log(1 + r));
}

// Wealth from variable annual contributions, each compounding for remaining years.
// monthlyContribsByYear: array where index = career year (0-based), value = $/mo invested.
// Contributions after the array end use the last value.
export function wealthAtVariableContribs(monthlyContribsByYear, annualRate, totalYears) {
  if (totalYears <= 0 || monthlyContribsByYear.length === 0) return 0;
  const monthlyRate = (1 + annualRate) ** (1 / 12) - 1;
  let portfolio = 0;
  for (let year = 0; year < totalYears; year++) {
    const idx = Math.min(year, monthlyContribsByYear.length - 1);
    const mc = monthlyContribsByYear[idx];
    for (let m = 0; m < 12; m++) {
      portfolio = portfolio * (1 + monthlyRate) + mc;
    }
  }
  return Math.round(portfolio);
}

// 30-year opportunity cost of spending $delta/month above the benchmark.
// Hardcoded at 7% / 30 years for consistent apples-to-apples comparison across all categories.
// Source: S&P 500 historical average total return, inflation-adjusted (CRSP data)
export function opportunityCost(monthlyDelta) {
  if (monthlyDelta <= 0) return 0;
  return futureValue(monthlyDelta, 0.07, 30);
}
