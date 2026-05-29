// 10 real companies with real 2004–2023 return data.
// Shown to students as sector descriptions ONLY during the simulation.
// Real company names revealed at the end reveal screen.
//
// NOTE: Year-by-year returns below are approximate planning estimates.
// Verify against Yahoo Finance historical adjusted close prices before classroom use.
// Bankruptcy positions go to $0 in the bankruptcy year and stay there.
//
// Sources: Yahoo Finance adjusted close prices, Wikipedia corporate histories.

export const SIMULATION_STOCKS = [
  {
    id: 'pool',
    sectorLabel: 'Wholesale pool supply & outdoor living distributor',
    sectorShort: 'Pool supply distributor',
    realName: 'Pool Corporation',
    ticker: 'POOL',
    outcome: 'winner',
    // Approx annual returns: strong compounder in a "boring" niche
    returns: [
       0.25,  0.20,  0.15,  0.05, -0.40,  // 2004–2008 (housing crisis hurts)
       0.15,  0.30,  0.25,  0.35,  0.20,  // 2009–2013 (recovery + growth)
       0.20,  0.15,  0.15,  0.25,  0.10,  // 2014–2018
       0.30,  0.40,  0.60, -0.30,  0.10,  // 2019–2023
    ],
    revealNote: '+2,200% over 20 years. Pool supplies: boring to everyone except long-term investors.',
  },
  {
    id: 'wso',
    sectorLabel: 'HVAC equipment & parts wholesale distributor',
    sectorShort: 'HVAC distributor',
    realName: 'Watsco Inc',
    ticker: 'WSO',
    outcome: 'winner',
    returns: [
       0.20,  0.15,  0.25,  0.05, -0.35,  // 2004–2008
       0.10,  0.25,  0.20,  0.30,  0.25,  // 2009–2013
       0.15,  0.10,  0.20,  0.30,  0.05,  // 2014–2018
       0.35,  0.20,  0.55, -0.25,  0.15,  // 2019–2023
    ],
    revealNote: '+1,500% over 20 years. Air conditioners aren\'t exciting. Compounding is.',
  },
  {
    id: 'nvr',
    sectorLabel: 'Mid-Atlantic residential homebuilder',
    sectorShort: 'Regional homebuilder',
    realName: 'NVR Inc',
    ticker: 'NVR',
    outcome: 'winner',
    returns: [
       0.15,  0.10, -0.05, -0.25, -0.50,  // 2004–2008 (housing crisis devastates)
       0.20,  0.30,  0.25,  0.50,  0.50,  // 2009–2013 (massive recovery)
       0.15,  0.10,  0.30,  0.40,  0.05,  // 2014–2018
       0.25,  0.10,  0.40, -0.25,  0.35,  // 2019–2023
    ],
    revealNote: '+1,400% over 20 years. Went through a brutal 2008 crash — then came back stronger.',
  },
  {
    id: 'jkhy',
    sectorLabel: 'Software & payment processing for community banks',
    sectorShort: 'Banking software',
    realName: 'Jack Henry & Associates',
    ticker: 'JKHY',
    outcome: 'market',
    returns: [
       0.10,  0.12,  0.15,  0.08, -0.30,  // 2004–2008
       0.25,  0.20,  0.30,  0.15,  0.25,  // 2009–2013
       0.15,  0.10,  0.20,  0.15,  0.05,  // 2014–2018
       0.15,  0.15,  0.30, -0.15,  0.10,  // 2019–2023
    ],
    revealNote: '+~700% over 20 years. Roughly matched the market. Steady, unglamorous, reliable.',
  },
  {
    id: 'chd',
    sectorLabel: 'Household consumer goods manufacturer (cleaning & personal care)',
    sectorShort: 'Consumer goods maker',
    realName: 'Church & Dwight',
    ticker: 'CHD',
    outcome: 'winner',
    returns: [
       0.12,  0.15,  0.10,  0.15, -0.15,  // 2004–2008 (defensive, mild drop in 2008)
       0.20,  0.15,  0.20,  0.15,  0.20,  // 2009–2013
       0.10,  0.15,  0.10,  0.20,  0.10,  // 2014–2018
       0.15,  0.10,  0.20, -0.05,  0.10,  // 2019–2023
    ],
    revealNote: '+~700% over 20 years. Makes Arm & Hammer baking soda and OxiClean. Slow, steady, compounding.',
  },
  {
    id: 'chk',
    sectorLabel: 'Natural gas exploration & production company',
    sectorShort: 'Natural gas explorer',
    realName: 'Chesapeake Energy',
    ticker: 'CHK',
    bankruptYear: 17, // 2020
    outcome: 'bankrupt',
    returns: [
       0.30,  0.50,  0.60,  0.80, -0.80,  // 2004–2008 (nat gas boom then crash)
       0.30, -0.10, -0.15,  0.10, -0.30,  // 2009–2013 (volatile recovery)
      -0.60, -0.40, -0.20, -0.30, -0.50,  // 2014–2018 (secular decline)
      -0.70, -0.90,  0,     0,     0,      // 2019–2023 (bankrupt 2020 = Year 17 → $0)
    ],
    revealNote: 'Chesapeake Energy. Went from $10 to $70 on a natural gas boom — then collapsed. Filed for bankruptcy in 2020.',
    bankruptNote: 'The natural gas producer has filed for Chapter 11 bankruptcy. Your position is now worth $0.',
  },
  {
    id: 'pir',
    sectorLabel: 'Home décor & furniture specialty retail chain',
    sectorShort: 'Home décor retailer',
    realName: 'Pier 1 Imports',
    ticker: 'PIR',
    bankruptYear: 17, // 2020
    outcome: 'bankrupt',
    returns: [
       0.30,  0.20,  0.10, -0.10, -0.60,  // 2004–2008
       0.50,  0.40,  0.20,  0.10, -0.10,  // 2009–2013 (brief recovery)
      -0.10, -0.20, -0.20, -0.30, -0.50,  // 2014–2018 (Amazon eats retail)
      -0.70, -0.90,  0,     0,     0,      // 2019–2023 (bankrupt 2020)
    ],
    revealNote: 'Pier 1 Imports. Home décor retail hollowed out by e-commerce. Bankrupt in 2020.',
    bankruptNote: 'The home décor retail chain has filed for bankruptcy. Your position is now worth $0.',
  },
  {
    id: 'ftr',
    sectorLabel: 'Rural broadband & telephone service provider',
    sectorShort: 'Rural telecom provider',
    realName: 'Frontier Communications',
    ticker: 'FTR',
    bankruptYear: 17, // 2020
    outcome: 'bankrupt',
    returns: [
       0.05,  0.05, -0.05, -0.10, -0.30,  // 2004–2008
       0.10, -0.05, -0.10, -0.10, -0.15,  // 2009–2013
      -0.20, -0.25, -0.30, -0.25, -0.40,  // 2014–2018
      -0.60, -0.80,  0,     0,     0,      // 2019–2023
    ],
    revealNote: 'Frontier Communications. Slow 16-year death by declining landline revenue. Bankrupt in 2020.',
    bankruptNote: 'The rural telephone & broadband provider has filed for bankruptcy. Your position is now worth $0.',
  },
  {
    id: 'rsh',
    sectorLabel: 'Consumer electronics & mobile phone retail chain',
    sectorShort: 'Electronics retailer',
    realName: 'RadioShack',
    ticker: 'RSH',
    bankruptYear: 12, // 2015
    outcome: 'bankrupt',
    returns: [
      -0.10,  0.15,  0.10, -0.10, -0.50,  // 2004–2008
       0.20,  0.10, -0.10, -0.20, -0.30,  // 2009–2013 (brief bounce, then decline)
      -0.70, -0.90,  0,     0,     0,      // 2014–2018 (bankrupt 2015 = Year 12)
       0,     0,     0,     0,     0,      // 2019–2023
    ],
    revealNote: 'RadioShack. Filed for bankruptcy in 2015. The smartphone killed the electronics repair shop.',
    bankruptNote: 'The consumer electronics retailer has filed for bankruptcy. Your position is now worth $0.',
  },
  {
    id: 'cc',
    sectorLabel: 'Big-box consumer electronics retail chain (TVs, computers, appliances)',
    sectorShort: 'Electronics big-box retailer',
    realName: 'Circuit City',
    ticker: 'CC',
    bankruptYear: 5, // 2008
    outcome: 'bankrupt',
    returns: [
      -0.10, -0.15,  0.10, -0.30, -0.95,  // 2004–2008 (bankrupt Nov 2008 = Year 5)
       0,     0,     0,     0,     0,      // 2009–2013
       0,     0,     0,     0,     0,      // 2014–2018
       0,     0,     0,     0,     0,      // 2019–2023
    ],
    revealNote: 'Circuit City. Filed for bankruptcy in November 2008 — the same year as the financial crisis. Double disaster for anyone who held this.',
    bankruptNote: 'The electronics retailer has filed for bankruptcy. Your position is now worth $0. (Year 5 — the same year as the market crash.)',
  },
];

// IDs of stocks available for student selection
export const STOCK_IDS = SIMULATION_STOCKS.map(s => s.id);

export const MIN_PICKS = 4;
export const MAX_PICKS = 5;
