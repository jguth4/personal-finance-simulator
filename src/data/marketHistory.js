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

// Partner income — same salary as primary, no label or gender assigned.
// Activates at the wedding/partnership event (Year 4).
export const PARTNER_INCOME = 4847;

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
        label: 'Build my emergency fund first',
        emoji: '🛡️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        emergencyFundBoost: +200,
        note: 'Add $200/mo to checking until you hit the 6-month cap ($17,400). Then auto-invests.',
      },
      {
        label: 'Pay down credit card debt',
        emoji: '💳',
        showIf: (s) => s.creditDebt > 0,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        directDebtPayment: +200,
        note: 'Send $200/mo directly toward CC balance. 24% APR debt is your worst investment.',
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
        label: 'Build emergency fund',
        emoji: '🛡️',
        investLumpSum: 0,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: +4500,
        note: 'Goes to checking account. If you\'re under the 6-month cap ($17,400), this is smart before investing more.',
      },
      {
        label: 'Pay down credit card debt',
        emoji: '💳',
        showIf: (s) => s.creditDebt > 0,
        investLumpSum: 0,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        directDebtPayment: 4500,
        note: 'Dump the bonus on CC debt. 24% APR is a guaranteed 24% return. No investment beats it.',
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
    prepTip: 'Your family is about to grow. NYC infant care runs $2,800/mo full-time. Do you have family who could help? Now is the time to figure it out.',
    scenario: 'Baby arrived. You\'re thrilled. Infant care in NYC: $2,800/mo full-time. Your partner is also earning $4,847/mo. What\'s the plan?',
    choices: [
      {
        label: 'Family helps — free care',
        emoji: '👴👵',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        childcareCost: 0,
        note: 'Grandparents or family take over. Huge advantage — not everyone has this option. Both of you keep working.',
      },
      {
        label: 'Part-time daycare — 3 days/week ($1,200/mo)',
        emoji: '🌤️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +1200,
        cashImpact: 0,
        childcareCost: 1200,
        note: 'Affordable middle ground. One partner may work reduced hours on the other days.',
      },
      {
        label: 'Nanny share ($1,500/mo)',
        emoji: '👨‍👩‍👧',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +1500,
        cashImpact: 0,
        childcareCost: 1500,
        note: 'Split a nanny with another family. More flexible than daycare. Both partners work full-time.',
      },
      {
        label: 'Full-time daycare ($2,800/mo)',
        emoji: '🏫',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: +2800,
        cashImpact: -3200,
        childcareCost: 2800,
        note: '$3,200 upfront (deposits + setup), then $2,800/mo. Both work full-time. Budget is tighter, but dual income absorbs it.',
      },
      {
        label: 'One partner stays home',
        emoji: '🏠',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        childcareCost: 0,
        partnerHomeCare: true,
        note: 'No daycare cost — saves $2,800/mo. But you lose your partner\'s $4,847/mo income. Net: you\'re $2,047/mo WORSE off than paying for full daycare. Partner can return when kids are in school (Year 14).',
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
        label: 'Pay down debt first',
        emoji: '💳',
        showIf: (s) => s.creditDebt > 0,
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        directDebtPayment: +300,
        note: 'Send $300/mo toward CC debt. Once debt is gone, redirect to investing.',
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
        isPrivateSchool: true,
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
    scenario: "Your kids are now in school full-time. Childcare costs drop. If your partner stepped back from work for childcare, they can now return. What do you do?",
    choices: [
      {
        label: 'Partner returns to work + invest more',
        emoji: '💼',
        monthlyContribDelta: +500,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        partnerReturns: true,
        note: 'Dual income is back. Kids in school frees everything up. Sprint to the finish.',
      },
      {
        label: 'Invest more with freed-up childcare budget',
        emoji: '🚀',
        showIf: (s) => !s.pickedPrivateSchool,
        monthlyContribDelta: +500,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Childcare costs removed from expenses. Direct that money into investing.',
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

// Monthly mini-events for months 1-36 (the early-career years).
// month field is 1-indexed. Same choice format as LIFESTYLE_EVENTS.
// These fire BEFORE the month computes, like year events.
export const MONTH_EVENTS = [
  {
    month: 2,
    title: 'Delivery apps are everywhere',
    scenario: 'Two months in, you notice delivery apps are making it easy to spend without thinking. How often are you actually ordering?',
    choices: [
      {
        label: 'Rarely — mostly cooking at home',
        emoji: '🥘',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Smart. Home-cooked meals run ~$5/meal vs $20+ delivered.',
      },
      {
        label: '1–2x per week (~$160/mo)',
        emoji: '🥡',
        monthlyExpenseDelta: +160,
        cashImpact: 0,
        note: 'Reasonable balance. NYC average for adults in their 20s.',
      },
      {
        label: '4+ times a week (~$400/mo)',
        emoji: '📱',
        monthlyExpenseDelta: +400,
        cashImpact: 0,
        note: 'Convenient, but that\'s $4,800/yr. Every dollar here is a dollar not compounding.',
      },
    ],
  },
  {
    month: 4,
    title: 'Credit card offer arrives',
    scenario: 'A card offer lands in your mailbox: 2% cashback on everything. The rule you\'ve heard: auto-pay the full balance every month. Do you open it?',
    choices: [
      {
        label: 'Yes — auto-pay in full, collect the rewards',
        emoji: '💳',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Free 2% cashback. The 24% APR only matters if you carry a balance. You won\'t.',
      },
      {
        label: 'No — I\'ll stick to my debit card',
        emoji: '🙅',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Totally valid. No change to your finances. Simpler.',
      },
    ],
  },
  {
    month: 6,
    title: 'Office lunch culture',
    scenario: 'Your team orders lunch together daily. The spots they like run $18–22/meal. You used to bring food from home (~$5/meal). What do you do?',
    choices: [
      {
        label: 'Join them every day',
        emoji: '🍽️',
        monthlyExpenseDelta: +280,
        cashImpact: 0,
        note: '~$280/mo more than packing lunch. Real relationships are built over lunch.',
      },
      {
        label: 'Join 2–3x a week, bring lunch the rest',
        emoji: '⚖️',
        monthlyExpenseDelta: +130,
        cashImpact: 0,
        note: 'Balance — connect without blowing the food budget.',
      },
      {
        label: 'Stick to packed lunch',
        emoji: '🥪',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Save $280/mo. You can socialize without buying $20 grain bowls.',
      },
    ],
  },
  {
    month: 8,
    title: 'Subscription audit',
    scenario: 'Eight months in, you check your bank statement. You\'re paying for streaming, music, cloud storage, and a gym you\'ve been to twice. What do you do?',
    choices: [
      {
        label: 'Cut the ones I don\'t actually use',
        emoji: '✂️',
        monthlyExpenseDelta: -60,
        cashImpact: 0,
        note: 'Trim the fat. Typical savings: $40–80/mo. That\'s real money compounding.',
      },
      {
        label: 'Keep them all — I use them',
        emoji: '📱',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'If you actually use them all, they\'re worth it. No change.',
      },
    ],
  },
  {
    month: 14,
    title: 'Gym upgrade temptation',
    scenario: 'Equinox just opened 2 blocks from your office. $250/mo. Your current gym: $30/mo. The new place has a pool, classes, and a juice bar.',
    choices: [
      {
        label: 'Upgrade to Equinox ($250/mo)',
        emoji: '🏋️',
        monthlyExpenseDelta: +220,
        cashImpact: 0,
        note: '+$220/mo. Nicer — but you barely use your current gym as is.',
      },
      {
        label: 'Stay at current gym ($30/mo)',
        emoji: '💪',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Save $220/mo. The workout is the same.',
      },
      {
        label: 'Cancel gym — run outside',
        emoji: '🏃',
        monthlyExpenseDelta: -30,
        cashImpact: 0,
        note: 'Free. You save $30/mo and NYC parks are legitimately great.',
      },
    ],
  },
  {
    month: 18,
    title: 'Salary negotiation',
    scenario: 'You\'ve crushed your first 18 months. Your manager likes you. But you\'ve never asked for a raise — your starting salary has been your salary. Do you ask?',
    choices: [
      {
        label: 'Yes — I ask for a raise',
        emoji: '💪',
        monthlyContribDelta: +210,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'You ask. You get $5k more/yr = $210/mo after taxes. 70% of people who ask receive a raise. Source: Salary.com 2023.',
      },
      {
        label: 'No — feels uncomfortable',
        emoji: '😶',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Nothing changes. But that $5k/yr, invested for 18 more years, would have been ~$156k at Year 20.',
      },
    ],
  },
  {
    month: 24,
    title: 'Lease renewal — two years in',
    scenario: 'Two years in your apartment. Lease is up. Your landlord wants $200/mo more. You have options.',
    choices: [
      {
        label: 'Pay the increase',
        emoji: '🏠',
        monthlyExpenseDelta: +200,
        cashImpact: 0,
        note: '+$200/mo. You like where you live. It\'s easier than moving.',
      },
      {
        label: 'Find a new roommate — share more',
        emoji: '🤝',
        monthlyExpenseDelta: -150,
        cashImpact: 0,
        note: 'Reduce your share of rent. Less privacy, more savings.',
      },
      {
        label: 'Move somewhere cheaper',
        emoji: '📦',
        monthlyExpenseDelta: -300,
        cashImpact: -2000,
        note: '$2k to move. Then $300/mo less for the rest of the simulation.',
      },
    ],
  },
  {
    month: 30,
    title: 'Side hustle opportunity',
    scenario: 'A friend\'s company needs help with their website. They\'ll pay $400/project — steady work, about 2 projects/month on evenings.',
    choices: [
      {
        label: 'Take it — invest the extra income',
        emoji: '💻',
        monthlyContribDelta: +500,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: '+$800/mo gross → ~$500/mo after tax. All invested. Real extra income compounds fast.',
      },
      {
        label: 'No thanks — I protect my evenings',
        emoji: '🛋️',
        monthlyContribDelta: 0,
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'Time has value too. No change.',
      },
    ],
  },
  {
    month: 36,
    title: 'Three years in — next chapter',
    scenario: 'Three years into your career. You\'ve been with your partner for over 2 years. You\'re talking about moving in together before the wedding.',
    choices: [
      {
        label: 'Moving in together now',
        emoji: '🏠',
        monthlyExpenseDelta: -400,
        cashImpact: 0,
        note: 'Splitting rent = your biggest monthly savings yet. ~$400/mo freed up.',
      },
      {
        label: 'Not quite yet',
        emoji: '🤷',
        monthlyExpenseDelta: 0,
        cashImpact: 0,
        note: 'No change. You\'ll figure it out.',
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
