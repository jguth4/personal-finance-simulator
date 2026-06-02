// Career profiles for NYC private school students.
// salaryByYear[i] = total annual compensation in year i of career (0-indexed from startAge).
// Values are pedagogically approximate — not financial advice. Last entry repeats for longer careers.
// Take-home is computed dynamically via computeTaxBreakdown() in PersonaPaths.

export const CAREERS = [
  {
    id: 'swe',
    label: 'Software Engineer',
    icon: '💻',
    startAge: 22,
    salaryRange: '$110k–$250k+',
    story: 'High comp immediately. RSUs and stock grants can dwarf base salary at senior levels.',
    color: '#6366f1',
    RSU: true,
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // NYC FAANG/top-tier trajectory. Source: levels.fyi, BLS OES NYC metro.
    salaryByYear: [
      110000, 120000, 135000, 152000, 168000,
      182000, 196000, 210000, 225000, 238000,
      250000, 260000, 268000, 275000, 280000,
      285000, 290000, 293000, 295000, 297000,
      300000,
    ],
  },
  {
    id: 'ib',
    label: 'Investment Banking',
    icon: '📊',
    startAge: 22,
    salaryRange: '$170k–$600k+',
    story: 'Front-loaded earnings and brutal hours. Many exit to PE or corporate roles after 3–5 years.',
    color: '#f59e0b',
    bonusHeavy: true,
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // Analyst → Associate → VP. Includes typical bonus. Source: Wall Street Oasis surveys.
    salaryByYear: [
      170000, 195000, 215000,          // Analyst yrs 1-3
      280000, 325000, 380000,          // Associate yrs 1-3
      460000, 540000, 600000,          // VP yrs 1-3
      520000, 530000, 540000, 550000,  // Many exit / SVP / MD (many leave earlier)
      560000, 570000, 575000, 580000, 585000, 590000, 595000,
      600000,
    ],
  },
  {
    id: 'consulting',
    label: 'Management Consulting',
    icon: '🧩',
    startAge: 22,
    salaryRange: '$95k–$380k+',
    story: 'Strong brand name opens doors. Many pivot to industry after 2–4 years or get an MBA.',
    color: '#10b981',
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // Analyst → Consultant → EM → Principal. Source: Management Consulted salary reports.
    salaryByYear: [
      95000, 108000, 122000,           // Business Analyst yrs 1-3
      160000, 185000, 210000,          // Consultant/post-MBA yrs 1-3
      250000, 290000,                  // Engagement Manager
      335000, 380000,                  // Principal
      430000, 450000, 460000, 470000,  // Partner track
      480000, 490000, 495000, 498000, 500000, 502000,
      505000,
    ],
  },
  {
    id: 'biglaw',
    label: 'BigLaw Attorney',
    icon: '⚖️',
    startAge: 25,
    salaryRange: '$215k–$500k+',
    story: 'Cravath scale starts at $215k (2024). High pay but intense hours — most exit before partnership.',
    color: '#8b5cf6',
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // 3 yrs law school delays start. Source: NALP salary data, Cravath scale 2024.
    // Note: $215k at age 25 vs. SWE at $135k age 25 — less advantage than it appears due to delay.
    salaryByYear: [
      215000, 235000, 260000, 280000,  // 1st–4th year associate
      315000, 350000, 400000,          // 5th–7th year associate
      450000, 500000,                  // Senior associate (many exit to in-house ~$300k)
      310000, 320000, 330000, 340000,  // In-house counsel trajectory post-exit
      350000, 360000, 370000, 375000, 380000, 385000, 390000,
      395000,
    ],
  },
  {
    id: 'physician',
    label: 'Physician (MD)',
    icon: '🏥',
    startAge: 29,
    salaryRange: '$65k residency → $300k–$400k+',
    story: 'Residency at near-poverty wages, then one of the highest salaries in any field. Time is the cost.',
    color: '#ef4444',
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // 4yr med school + 3yr residency avg. Source: AAMC, Medscape Physician Compensation Report.
    // Residency: ~$65k/yr. Attending (internal med/primary care): $300k+. Specialist: $400k+.
    salaryByYear: [
      65000, 67000, 70000,             // Residency yrs 1-3 (ages 29-31)
      300000, 320000, 338000,          // Attending yrs 1-3 (ages 32-34)
      355000, 368000, 380000, 390000,  // Established attending
      398000, 405000, 410000, 415000, 418000,
      420000, 422000, 424000, 425000, 426000,
      428000,
    ],
  },
  {
    id: 'educator',
    label: 'Educator',
    icon: '📚',
    startAge: 22,
    salaryRange: '$65k–$100k',
    story: 'NYC DOE teacher. Predictable growth, strong union, pension. Capped upside — but time matters most.',
    color: '#f97316',
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // NYC DOE salary schedule (UFT 2025 contract). Source: UFT salary schedule.
    // With masters+10 yrs: ~$93k. Maximum steps ~$100k+.
    salaryByYear: [
      65000, 68000, 71000, 74000, 77000,   // Yrs 1-5
      80000, 82000, 84000, 86000, 88000,   // Yrs 6-10
      89000, 90000, 91000, 92000, 93000,   // Yrs 11-15
      94000, 95000, 96000, 97000, 98000,   // Yrs 16-20
      99000,
    ],
  },
  {
    id: 'entrepreneur',
    label: 'Entrepreneur',
    icon: '🚀',
    startAge: 24,
    salaryRange: '$40k–$150k+ (high variance)',
    story: 'Two years figuring it out, then building something. Could be nothing — or everything. This shows a moderate-success path.',
    color: '#06b6d4',
    highSaverRate: 0.20,
    lowSaverRate: 0.05,
    // Moderate-success path. High variance not modeled — this is a teaching tool, not a simulation.
    salaryByYear: [
      40000, 45000, 58000, 72000, 88000,   // Early years (ages 24-28)
      105000, 120000, 138000, 150000,      // Getting traction (ages 29-32)
      158000, 165000, 170000, 175000, 178000,
      180000, 182000, 185000, 188000, 190000, 192000,
      195000,
    ],
  },
];

export const HIGH_SAVER_RATE = 0.20;  // 20% of take-home invested monthly
export const LOW_SAVER_RATE  = 0.05;  // 5% of take-home invested monthly
