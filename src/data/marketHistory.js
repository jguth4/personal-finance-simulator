// Real nominal annual total returns, 2004–2023 (Year 1 = 2004 ... Year 20 = 2023).
// Calendar years are NEVER shown to students during the simulation — only revealed at the end.
// Sources: VTSAX/Vanguard fund data; Bloomberg AGG; LBMA gold spot; FRED federal funds rate.
// NOTE: All values are approximate planning estimates and should be verified against
// authoritative sources (Yahoo Finance, FRED, LBMA) before classroom use.

export const TOTAL_YEARS = 20;

// CALENDAR_YEARS[i] = the real calendar year for simulation Year i+1 (0-indexed internally)
// Used ONLY in the end reveal — never shown during simulation.
export const CALENDAR_YEARS = [
  2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,
  2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,
];

// Nominal total returns (dividends reinvested where applicable)
export const RETURNS = {
  // VTSAX — Vanguard Total Stock Market Index Fund
  vtsax: [
    0.125, 0.062, 0.157, 0.056, -0.370,  // 2004–2008
    0.287, 0.171, 0.011, 0.164,  0.335,  // 2009–2013
    0.126, 0.004, 0.127, 0.212, -0.052,  // 2014–2018
    0.307, 0.210, 0.257, -0.195, 0.261,  // 2019–2023
  ],
  // Bond index — Bloomberg US Aggregate Bond Index (AGG/BND)
  bonds: [
    0.043, 0.024, 0.043,  0.070,  0.052, // 2004–2008
    0.059, 0.065, 0.078,  0.042, -0.020, // 2009–2013
    0.060, 0.005, 0.026,  0.035, -0.001, // 2014–2018
    0.087, 0.075, -0.017, -0.131, 0.055, // 2019–2023
  ],
  // Gold — LBMA spot price annual return (price appreciation only, no yield)
  gold: [
    0.057,  0.096,  0.232,  0.314,  0.043, // 2004–2008
    0.239,  0.295,  0.102,  0.070, -0.283, // 2009–2013
   -0.017, -0.106,  0.085,  0.131, -0.020, // 2014–2018
    0.189,  0.251, -0.036, -0.003,  0.130, // 2019–2023
  ],
  // Cash/HYSA — approximate average high-yield savings / money market rate
  cash: [
    0.015, 0.030, 0.050, 0.045, 0.015, // 2004–2008 (fed funds cycle up then crash)
    0.002, 0.001, 0.001, 0.001, 0.001, // 2009–2013 (near-zero era)
    0.001, 0.001, 0.005, 0.010, 0.020, // 2014–2018 (slow climb)
    0.020, 0.005, 0.005, 0.030, 0.050, // 2019–2023 (COVID cut, then 2022–23 surge)
  ],
  // Financial advisor — VTSAX minus 1.5%/yr fee drag (1% AUM + 0.5% avg active fund ER vs index)
  // Computed at runtime: advisor[y] = vtsax[y] - 0.015
};

// Annual inflation (CPI) — used ONLY for real-value display in the end reveal
export const INFLATION = [
  0.027, 0.034, 0.032, 0.041, 0.001, // 2004–2008
  0.027, 0.015, 0.030, 0.017, 0.015, // 2009–2013
  0.016, 0.001, 0.021, 0.021, 0.024, // 2014–2018
  0.023, 0.012, 0.070, 0.080, 0.034, // 2019–2023
];

// Market crash events — auto-pause the simulation and demand a decision
// year is 1-indexed (Year 1 = first year of simulation)
export const MARKET_EVENTS = [
  {
    year: 5, // 2008
    severity: 'severe',
    headline: 'Housing prices have collapsed. Major banks are failing. Markets drop 37% in 12 months.',
    subtext: 'Experts are calling it the worst financial crisis since the Great Depression. Your portfolio just lost significant value.',
  },
  {
    year: 17, // 2020
    severity: 'severe',
    headline: 'A global pandemic has shut down the economy. Markets drop 34% in just 90 days.',
    subtext: 'The fastest crash in stock market history. No one knows how long the shutdown will last.',
  },
  {
    year: 19, // 2022
    severity: 'moderate',
    headline: 'Inflation hits a 40-year high. The Fed raises interest rates aggressively. Stocks AND bonds fall simultaneously.',
    subtext: 'Unusually, there is nowhere to hide — both stocks and bonds are down this year.',
  },
];

// Real headlines revealed at the very end — maps year to historical context
export const REAL_HEADLINES = [
  { year: 5,  calYear: 2008, text: 'September 15, 2008: Lehman Brothers files for bankruptcy — the largest in US history. Dow falls 504 points.' },
  { year: 17, calYear: 2020, text: 'March 11, 2020: WHO declares COVID-19 a global pandemic. S&P 500 enters bear market in record 16 days.' },
  { year: 19, calYear: 2022, text: 'June 10, 2022: US inflation hits 9.1%, highest since 1981. Fed raises rates 4.25% in 12 months — bonds collapse alongside stocks.' },
];

// Lifestyle events — pause simulation and prompt for new monthly contribution
// year is 1-indexed; deductLumpSum removes from most-liquid asset (cash > bonds > vtsax priority)
export const LIFESTYLE_EVENTS = [
  {
    year: 2,
    scenario: 'You got a new job offer and accepted. Your salary increases by $8,000/yr — about $200/mo more after taxes.',
    prompt: 'New monthly investment amount:',
    deductLumpSum: 0,
  },
  {
    year: 4,
    scenario: "You're getting married. The wedding will cost $15,000. You're covering it from your savings.",
    prompt: 'How many months do you pause investing to save for the wedding? (0 to keep investing)',
    deductLumpSum: 15000,
    pauseMonths: true,
  },
  {
    year: 7,
    scenario: "Baby on the way. Infant childcare in your city: $2,800/mo. Your monthly budget just got squeezed.",
    prompt: 'New monthly investment amount:',
    deductLumpSum: 0,
  },
  {
    year: 10,
    scenario: 'Promotion. Your salary increases by $15,000/yr — about $300/mo more after taxes.',
    prompt: 'New monthly investment amount:',
    deductLumpSum: 0,
  },
  {
    year: 14,
    scenario: "Your kids are in school now. That $2,800/mo childcare bill is gone. You have real breathing room for the first time in years.",
    prompt: 'New monthly investment amount:',
    deductLumpSum: 0,
  },
];
