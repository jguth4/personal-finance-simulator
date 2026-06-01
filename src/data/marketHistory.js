// Real nominal annual total returns, 2004–2023 (Year 1 = 2004 ... Year 20 = 2023).
// Calendar years are NEVER shown to students during the simulation — only revealed at the end.
// Sources: VTSAX/Vanguard fund data; Bloomberg AGG; LBMA gold spot; FRED federal funds rate.
// NOTE: All values are approximate planning estimates and should be verified against
// authoritative sources (Yahoo Finance, FRED, LBMA) before classroom use.

export const TOTAL_YEARS = 20;

// Assumed income/expense baseline for cash flow simulation
// Based on Grade 10 budget: $72,500 salary → $4,847/mo NYC take-home
// Base expenses: rent w/roommate $1,500 + food $700 + transit $134 + phone/utilities/basics $566 = $2,900
export const MONTHLY_INCOME = 4847;
export const MONTHLY_BASE_EXPENSES_DEFAULT = 2900;
export const MAX_MONTHLY_INVESTABLE = MONTHLY_INCOME - MONTHLY_BASE_EXPENSES_DEFAULT; // 1,947

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
export const MARKET_EVENTS = [
  {
    year: 5, // 2008
    severity: 'severe',
    headline: 'A financial crisis is beginning. Housing prices are collapsing. Major banks are in trouble.',
    subtext: 'Markets are starting to drop sharply. No one knows how far this goes. What do you do?',
  },
  {
    year: 17, // 2020
    severity: 'severe',
    headline: 'A global pandemic is shutting down the economy. Markets are in free fall.',
    subtext: 'The fastest crash in stock market history is unfolding. No one knows how long this lasts. What do you do?',
  },
  {
    year: 19, // 2022
    severity: 'moderate',
    headline: 'Inflation is at a 40-year high. The Fed is raising rates aggressively. Stocks AND bonds are falling.',
    subtext: 'Unusually, there is nowhere to hide this year. What do you do?',
  },
];

// Real headlines revealed at the very end
export const REAL_HEADLINES = [
  { year: 5,  calYear: 2008, text: 'September 15, 2008: Lehman Brothers files for bankruptcy — the largest in US history. Dow falls 504 points.' },
  { year: 17, calYear: 2020, text: 'March 11, 2020: WHO declares COVID-19 a global pandemic. S&P 500 enters bear market in record 16 days.' },
  { year: 19, calYear: 2022, text: 'June 10, 2022: US inflation hits 9.1%, highest since 1981. Fed raises rates 4.25% in 12 months — bonds collapse alongside stocks.' },
];

// Lifestyle events — now use structured choices with cash/expense/contribution impacts.
// Each choice shows an opportunity cost computed at Year 20 (7% real rate) in the UI.
//
// Choice fields:
//   monthlyContribDelta  — change to monthly investment amount (+/-)
//   monthlyExpenseDelta  — change to monthly base expenses (+/-)
//   cashImpact           — one-time cash change (negative = expense from checking account)
//   investLumpSum        — lump sum added directly to investment portfolio (from bonus/windfall)
//   lumpSumLoss          — if true, this cashImpact represents money permanently lost (for reveal callout)
//   note                 — one-sentence framing shown under the choice
export const LIFESTYLE_EVENTS = [
  {
    year: 2,
    title: 'New job offer',
    prepTip: 'A job offer may be coming. Think about what you\'d do with extra income — invest it, spend it, or split it?',
    scenario: 'You got recruited for a better position. Salary jumps $8,000/yr — about $200/mo more after NYC taxes. What do you do with the raise?',
    choices: [
      {
        label: 'Invest the full raise',
        emoji: '📈',
        monthlyContribDelta: +200,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Lifestyle stays the same. The full raise compounds.',
      },
      {
        label: 'Invest half, spend half',
        emoji: '⚖️',
        monthlyContribDelta: +100,
        monthlyExpenseDelta: +100,
        cashImpact: 0,
        note: 'A little better life, a little more compounding.',
      },
      {
        label: 'Absorb it into lifestyle',
        emoji: '☕',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +200,
        cashImpact: 0,
        note: 'Nicer coffee, nicer lunches. The raise just disappears.',
      },
    ],
  },
  {
    year: 3,
    title: 'Rent increase',
    prepTip: 'Your lease is up for renewal soon. Building your checking balance now gives you options — move, get a roommate, or pay the increase.',
    scenario: 'Lease renewal time. Your landlord wants $350/mo more — or you can make a change.',
    choices: [
      {
        label: 'Pay the increase',
        emoji: '🏠',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +350,
        cashImpact: 0,
        note: 'Same place, higher price. $350/mo less left to invest.',
      },
      {
        label: 'Find a roommate',
        emoji: '🤝',
        monthlyContribDelta: +300,
        monthlyExpenseDelta: -300,
        cashImpact: 0,
        note: 'Split the rent, invest the savings. Less privacy, more compounding.',
      },
      {
        label: 'Move somewhere cheaper',
        emoji: '📦',
        monthlyContribDelta: +400,
        monthlyExpenseDelta: -400,
        cashImpact: -2000,
        note: '$2,000 to move. Then $400/mo more to invest going forward.',
      },
    ],
  },
  {
    year: 4,
    title: 'Wedding',
    prepTip: 'Wedding planning ahead. The average NYC wedding costs $44,000. Your checking balance now determines your options — City Hall is always on the table.',
    scenario: "You're getting married. The average NYC wedding costs $44,000 (The Knot, 2023). What does yours look like?",
    choices: [
      {
        label: 'City Hall + dinner ($500)',
        emoji: '💍',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -500,
        note: 'Just the two of you. Memorable and cheap.',
      },
      {
        label: 'Modest ceremony ($14,000)',
        emoji: '🥂',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -14000,
        note: 'Close family, nice venue. NYC affordable end.',
      },
      {
        label: 'Full NYC wedding ($44,000)',
        emoji: '💒',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -15000,
        loanAmount: 29000,
        note: '$15k from savings, $29k on a loan — hits your credit card at 24% APR. Interest compounds immediately.',
      },
    ],
  },
  {
    year: 6,
    title: 'Year-end bonus',
    prepTip: 'Performance review season is coming. A bonus may be on the way — start thinking about whether to invest it, save it, or spend it.',
    scenario: 'Strong performance review. Your company gives you a $4,500 bonus. It just hit your bank account.',
    choices: [
      {
        label: 'Invest it all',
        emoji: '🚀',
        investLumpSum: 4500,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Straight into your investment portfolio.',
      },
      {
        label: 'Invest half, spend half',
        emoji: '✌️',
        investLumpSum: 2250,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: +2250,
        note: '$2,250 invested, $2,250 stays in checking for a vacation or cushion.',
      },
      {
        label: 'Spend it — you earned it',
        emoji: '🎉',
        investLumpSum: 0,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: +4500,
        note: 'Goes to a vacation, new gear, experiences. Fully enjoyed.',
      },
    ],
  },
  {
    year: 7,
    title: 'Baby! Childcare decision',
    prepTip: 'Your family is about to grow. NYC infant care runs $2,800/mo. Do you have family who could help? Now is the time to figure it out.',
    scenario: 'Baby arrived. You\'re thrilled. Also: infant care in NYC runs $2,800/mo. What\'s the plan?',
    choices: [
      {
        label: 'Family helps — free care',
        emoji: '👴👵',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Grandparents step in. Huge financial advantage — not everyone has this option.',
      },
      {
        label: 'Professional daycare ($2,800/mo)',
        emoji: '🏫',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +2800,
        cashImpact: -3200,
        note: '$3,200 upfront (deductible + setup), then $2,800/mo. Budget gets very tight.',
      },
    ],
  },
  {
    year: 9,
    title: 'Promotion',
    prepTip: 'A promotion may be coming. Think now about your priorities — will you invest the raise, upgrade your lifestyle, or split it?',
    scenario: "You've been doing great work. New title, new salary — $15,000/yr more. That's ~$300/mo more take-home after taxes.",
    choices: [
      {
        label: 'Invest the full raise',
        emoji: '📈',
        monthlyContribDelta: +300,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Lifestyle stays the same. The whole raise compounds.',
      },
      {
        label: 'Invest half, live a little better',
        emoji: '⚖️',
        monthlyContribDelta: +150,
        monthlyExpenseDelta: +150,
        cashImpact: 0,
        note: 'Nicer dinners, a little breathing room — and $150/mo more invested.',
      },
      {
        label: 'You\'ve been grinding — upgrade your life',
        emoji: '🌟',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +300,
        cashImpact: 0,
        note: 'The full raise goes to a nicer apartment, better restaurants. You earned it.',
      },
    ],
  },
  {
    year: 10,
    title: 'School choice',
    prepTip: 'School-age decisions ahead. Private school in NYC runs $1,500–$2,500/mo. Start thinking about what matters most to your family.',
    scenario: 'Your kid is approaching school age. You\'re in a neighborhood with a decent public school. Private school is also an option.',
    choices: [
      {
        label: 'Public school (free)',
        emoji: '🏫',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'NYC public schools vary. Yours is solid. $0/mo.',
      },
      {
        label: 'Private school ($1,500/mo)',
        emoji: '📚',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +1500,
        cashImpact: 0,
        note: '$1,500/mo, for potentially 12 years. Real families make this choice every day.',
      },
    ],
  },
  {
    year: 11,
    title: 'Annual vacation',
    prepTip: 'Vacation season coming. Domestic trips run $2,500, international $6,000+. Decide your budget now — or it decides itself.',
    scenario: 'You have 2 weeks of PTO. Your family has been talking about a trip. Where are you going?',
    choices: [
      {
        label: 'Staycation — NYC has plenty',
        emoji: '🗽',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -500,
        note: 'Day trips, local spots. Still costs money, just far less.',
      },
      {
        label: 'Domestic trip ($2,500)',
        emoji: '🏔️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -2500,
        note: 'Florida, California, a national park. Real memories.',
      },
      {
        label: 'International trip ($6,000)',
        emoji: '🌍',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -6000,
        note: 'Europe, Japan, Southeast Asia. Worth it — and genuinely expensive.',
      },
    ],
  },
  {
    year: 13,
    title: '"Can\'t-miss" investment tip',
    prepTip: 'Stay alert — someone may pitch you a "can\'t-miss" investment. The index fund has no hype. Time in market beats timing the market.',
    scenario: 'A friend is raving about a sector everyone\'s piling into — they\'re up 40% already. "You HAVE to get in before it\'s too late."',
    choices: [
      {
        label: 'Skip it — stay in index fund',
        emoji: '🧘',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'You\'ve heard this before. Time in market beats timing the market.',
      },
      {
        label: 'Put $8,000 into the tip',
        emoji: '🎲',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -8000,
        lumpSumLoss: true,
        note: 'You pull $8,000 from savings. Your friend says he\'s already up 40%.',
      },
    ],
  },
  {
    year: 14,
    title: 'Kids in school — breathing room',
    prepTip: 'Your kids will be in school soon. Childcare costs ease up — start thinking about how to use that breathing room.',
    scenario: "Your kids are now in school full-time. A lot has changed since Year 7. What do you do with your finances now?",
    choices: [
      {
        label: 'Max out investing',
        emoji: '🚀',
        monthlyContribDelta: +500,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'You\'ve been squeezed for years. Now you make up for lost time.',
      },
      {
        label: 'Invest more and live better',
        emoji: '⚖️',
        monthlyContribDelta: +200,
        monthlyExpenseDelta: +200,
        cashImpact: 0,
        note: '$200/mo more invested, $200/mo more to enjoy.',
      },
      {
        label: 'Take it easy — keep current pace',
        emoji: '😌',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'You\'ve been grinding. Rest and maintain.',
      },
    ],
  },
  {
    year: 15,
    title: 'Aging parent needs help',
    prepTip: 'Family support requests may be coming. Check your financial cushion — having a buffer makes generosity easier.',
    scenario: "Your parent is struggling to cover their living expenses. What's your response?",
    choices: [
      {
        label: 'Send $400/mo to help',
        emoji: '❤️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +400,
        cashImpact: 0,
        note: 'It\'s the right thing. $400/mo less available to invest.',
      },
      {
        label: 'One-time help ($1,500)',
        emoji: '🤲',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: -1500,
        note: 'Help them get situated — moving, paperwork, setup costs. Your monthly budget is unchanged.',
      },
      {
        label: 'Not able to help right now',
        emoji: '🤷',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'This is real for many families. No change to your finances.',
      },
    ],
  },
  {
    year: 16,
    title: 'Lifestyle check-in',
    prepTip: 'Midpoint check-in coming. Your friends may be upgrading — bigger apartments, nicer things. The question is whether you follow.',
    scenario: 'The market has been great. Your portfolio is growing. You\'ve been living the same lifestyle for years — and your friends are upgrading.',
    choices: [
      {
        label: 'Stay put — keep investing',
        emoji: '🧘',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Discipline. You know what the numbers say. You stay the course.',
      },
      {
        label: 'Upgrade a bit (+$400/mo)',
        emoji: '🏙️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +400,
        cashImpact: 0,
        note: 'Nicer apartment, better restaurants. You\'ve earned some of it.',
      },
      {
        label: 'Downgrade and invest more',
        emoji: '💪',
        monthlyContribDelta: +400,
        monthlyExpenseDelta: -400,
        cashImpact: 0,
        note: 'Move cheaper, invest the savings. Sprint to the finish.',
      },
    ],
  },
  {
    year: 18,
    title: 'Remote work opportunity',
    prepTip: 'Remote work may change your cost structure. NYC rent vs. Austin, TX rent: $600/mo difference. Think about whether location still matters to you.',
    scenario: "Your company went fully remote after the pandemic. You could stay in NYC or move anywhere. Austin, TX: rent $1,600/mo vs. your NYC $2,200/mo.",
    choices: [
      {
        label: 'Stay in NYC',
        emoji: '🗽',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'It\'s home. No change.',
      },
      {
        label: 'Move — save $600/mo',
        emoji: '📦',
        monthlyContribDelta: +600,
        monthlyExpenseDelta: -600,
        cashImpact: -3500,
        note: '$3,500 to move. Then $600/mo more to invest for the final 2 years.',
      },
    ],
  },
];

// Brief market context shown during running simulation (1-indexed years)
// Crash years (5, 17, 19) are handled by MARKET_EVENTS overlays instead
export const YEAR_CONTEXT = {
  1:  'Bull market. Housing boom in full swing. Economy expanding.',
  2:  'Strong growth continues. Consumer confidence near record highs.',
  3:  'Record home prices. Markets surge. Easy credit era peaks.',
  4:  'Housing cracks widen. Subprime mortgage warnings grow louder.',
  6:  'Markets begin recovering. Government stimulus taking hold.',
  7:  'Slow but steady recovery. Unemployment starts to fall.',
  8:  'Near-zero interest rates boost equities and housing.',
  9:  'Bull market resumes. Technology sector leads the charge.',
  10: 'Strong economy. Job market near full employment.',
  11: 'Markets near all-time highs. Bull run extends.',
  12: 'Steady growth. Fed begins discussing rate normalization.',
  13: 'Another record year for US stocks.',
  14: 'Economic expansion continues. Volatility near historic lows.',
  15: 'Late-cycle expansion. Fed raises rates slowly.',
  16: 'One of the longest bull markets in history.',
  18: 'Fastest market recovery ever. Fed keeps rates near 0%.',
  20: 'Inflation cools. Markets stabilize. Economy adjusts to new rates.',
};
