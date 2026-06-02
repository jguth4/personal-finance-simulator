// Budget categories with three NYC 2026 tiers: budget / standard / splurge
// Each tier: { label, amount, description, happinessImpact, happinessNote }
// happinessImpact: -2 to +2. Informed by Killingsworth (2021) experienced well-being research
// and Kahneman & Deaton (2010). Experiences > stuff. Security > comfort > luxury.

export const CATEGORIES = [
  {
    id: 'rent',
    name: 'Rent',
    tooltip: 'Your monthly share of housing costs. NYC is expensive — most people start with roommates.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 1400,
        description: 'Room in shared Queens apt, 2+ roommates',
        happinessImpact: -1,
        happinessNote: 'Long commute and tight quarters — you make it work, but it adds daily friction.',
      },
      {
        label: 'Standard',
        amount: 1750,
        description: 'Room in shared Brooklyn/Astoria apt, 1 roommate',
        happinessImpact: 1,
        happinessNote: 'Bed-Stuy or Astoria with one roommate — the sweet spot for most 22-year-olds in NYC.',
      },
      {
        label: 'Splurge',
        amount: 2800,
        description: 'Entry-level studio, Manhattan (e.g. UES, Hell\'s Kitchen)',
        happinessImpact: 2,
        happinessNote: 'Solo Manhattan studio is a real luxury — and $1,050/mo more than the Standard tier.',
      },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    tooltip: 'Food you cook at home. Cooking most meals is the single biggest way to cut food costs.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 200,
        description: 'Cook most meals, shop sales & store brands',
        happinessImpact: 0,
        happinessNote: 'Meal planning pays off — just not the most exciting food routine.',
      },
      {
        label: 'Standard',
        amount: 300,
        description: 'Mix of cooking and convenience foods',
        happinessImpact: 1,
        happinessNote: 'Solid food variety without overspending — a genuinely good balance.',
      },
      {
        label: 'Splurge',
        amount: 450,
        description: 'Whole Foods, organic, minimal meal planning',
        happinessImpact: 1,
        happinessNote: 'Quality food is meaningful, but research shows diminishing returns above the Standard tier.',
      },
    ],
  },
  {
    id: 'dining',
    name: 'Dining Out',
    tooltip: 'Restaurants, delivery apps, coffee, and lunch. NYC makes this easy to overspend on.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 80,
        description: 'Coffee + occasional lunch, cook everything else',
        happinessImpact: -1,
        happinessNote: 'You\'re opting out of most NYC dining culture — food is a major social experience here.',
      },
      {
        label: 'Standard',
        amount: 200,
        description: '2–3 dinners out per week',
        happinessImpact: 2,
        happinessNote: 'Covers most NYC social food culture without going overboard — the highest-value tier here.',
      },
      {
        label: 'Splurge',
        amount: 400,
        description: 'Restaurants often, DoorDash regularly',
        happinessImpact: 1,
        happinessNote: 'Frequent dining adds convenience, but research shows social context matters more than food quality.',
      },
    ],
  },
  {
    id: 'transit',
    name: 'Transportation',
    tooltip: 'NYC subway unlimited monthly pass is $134. Most people don\'t need a car.',
    defaultTier: 0,
    tiers: [
      {
        label: 'Budget',
        amount: 134,
        description: 'Unlimited MetroCard only — subway everywhere',
        happinessImpact: 0,
        happinessNote: 'MetroCard-only works for most NYC jobs — plan your schedule and you won\'t miss Uber.',
      },
      {
        label: 'Standard',
        amount: 180,
        description: 'MetroCard + occasional Uber/Lyft',
        happinessImpact: 1,
        happinessNote: 'Occasional Uber for late nights or bad weather adds real convenience for $46/mo.',
      },
      {
        label: 'Splurge',
        amount: 300,
        description: 'MetroCard + Uber frequently or car insurance',
        happinessImpact: 1,
        happinessNote: 'Uber everywhere is convenient, but the marginal happiness gain over Standard is small for most people.',
      },
    ],
  },
  {
    id: 'health',
    name: 'Health Insurance',
    tooltip: 'Your share of employer health insurance premiums, deducted from your paycheck before taxes.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 120,
        description: 'Basic employer plan, high deductible (HDHP) — HSA-eligible',
        happinessImpact: -1,
        happinessNote: 'Lower premiums but high out-of-pocket risk — one bad month can derail your budget.',
      },
      {
        label: 'Standard',
        amount: 220,
        description: 'Mid-tier employer plan, moderate deductible',
        happinessImpact: 1,
        happinessNote: 'Solid coverage with predictable costs — the stress reduction is worth the extra $100/mo.',
      },
      {
        label: 'Splurge',
        amount: 380,
        description: 'Premium plan, low deductible, wide network',
        happinessImpact: 1,
        happinessNote: 'Premium coverage adds security, but the marginal wellbeing gain over Standard is small for healthy young adults.',
      },
    ],
  },
  {
    id: 'phone',
    name: 'Phone',
    tooltip: 'Monthly phone bill. Budget carriers like Mint Mobile use the same networks as the big ones.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 45,
        description: 'Budget carrier (Mint Mobile, Visible, Metro)',
        happinessImpact: 0,
        happinessNote: 'Budget carriers use the same towers — most people don\'t notice the difference.',
      },
      {
        label: 'Standard',
        amount: 75,
        description: 'Mid-tier plan (T-Mobile, AT&T, Verizon)',
        happinessImpact: 1,
        happinessNote: 'Reliable and full-featured — covers everything most people actually need.',
      },
      {
        label: 'Splurge',
        amount: 110,
        description: 'Premium unlimited with latest iPhone',
        happinessImpact: 0,
        happinessNote: 'The phone matters more than the plan — $35/mo over Standard for marginal gains.',
      },
    ],
  },
  {
    id: 'renters_insurance',
    name: 'Renters Insurance',
    tooltip: 'Covers theft, fire, or damage to your belongings. Most landlords require it. Often overlooked.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 15,
        description: 'Basic coverage (~$15k belongings)',
        happinessImpact: 1,
        happinessNote: 'Basic coverage is still coverage — peace of mind for nearly nothing.',
      },
      {
        label: 'Standard',
        amount: 20,
        description: 'Standard coverage with liability',
        happinessImpact: 1,
        happinessNote: 'Standard liability and belongings coverage — the right call for virtually everyone.',
      },
      {
        label: 'Splurge',
        amount: 30,
        description: 'Full replacement value + high liability',
        happinessImpact: 1,
        happinessNote: 'Full replacement value is nice — all tiers here are modest, so splurge if it brings peace of mind.',
      },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    tooltip: 'Electric, gas, and internet. Internet is sometimes included in NYC rent.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 40,
        description: 'Minimal usage; internet often included in rent',
        happinessImpact: -1,
        happinessNote: 'Sweating through August and slow internet are low-level daily friction — real costs to well-being.',
      },
      {
        label: 'Standard',
        amount: 70,
        description: 'Electric + internet, average usage',
        happinessImpact: 1,
        happinessNote: 'Comfortable temperature and decent internet — baseline quality of life.',
      },
      {
        label: 'Splurge',
        amount: 110,
        description: 'AC in summer, electric heat, fast internet',
        happinessImpact: 1,
        happinessNote: 'Fast internet and climate control are meaningful — though gains over Standard are modest.',
      },
    ],
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    tooltip: 'Haircuts, toiletries, skincare, and grooming. Costs vary widely by lifestyle.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 40,
        description: 'Drugstore products, cheap haircuts',
        happinessImpact: 0,
        happinessNote: 'Drugstore basics cover most needs — leave money for things that matter more to you.',
      },
      {
        label: 'Standard',
        amount: 80,
        description: 'Mid-range products, regular haircut',
        happinessImpact: 1,
        happinessNote: 'Regular haircuts and decent products — feeling put-together is worth this.',
      },
      {
        label: 'Splurge',
        amount: 150,
        description: 'Salon visits, quality skincare routine',
        happinessImpact: 1,
        happinessNote: 'Salon visits add a real lift — the happiness gain above Standard is real, if diminishing.',
      },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    tooltip: 'Monthly clothing budget. Work attire and personal style — highly variable.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 30,
        description: 'Thrift stores, sales only, minimal buying',
        happinessImpact: 0,
        happinessNote: 'Thrifting and minimal buying — sustainable and it leaves room for things that matter more.',
      },
      {
        label: 'Standard',
        amount: 100,
        description: 'Mix of fast fashion and basics',
        happinessImpact: 1,
        happinessNote: 'Covers work and social wardrobe needs without overspending on material goods.',
      },
      {
        label: 'Splurge',
        amount: 250,
        description: 'New clothes regularly, brand names',
        happinessImpact: 0,
        happinessNote: 'Research consistently shows material purchases deliver less lasting happiness than experiences or financial security.',
      },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    tooltip: 'Streaming, going out, concerts, hobbies. NYC has tons of free stuff — but also tons of temptation.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 60,
        description: 'One streaming service, free NYC activities',
        happinessImpact: -1,
        happinessNote: 'NYC has incredible free options, but this level limits most social activities — a real trade-off.',
      },
      {
        label: 'Standard',
        amount: 150,
        description: 'Streaming + going out 1–2x per month',
        happinessImpact: 2,
        happinessNote: 'Streaming plus going out a couple times a month hits the sweet spot for social well-being.',
      },
      {
        label: 'Splurge',
        amount: 300,
        description: 'Concerts, bars, events, multiple subscriptions',
        happinessImpact: 1,
        happinessNote: 'Frequent events are genuinely fun — the happiness return diminishes past the Standard tier threshold.',
      },
    ],
  },
  {
    id: 'gym',
    name: 'Gym / Fitness',
    tooltip: 'Gym membership or fitness classes. NYC has options from $25/mo to $300+.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 25,
        description: 'Planet Fitness — basic but effective',
        happinessImpact: 1,
        happinessNote: 'Planet Fitness is legitimately functional — the exercise habit matters far more than the facility.',
      },
      {
        label: 'Standard',
        amount: 60,
        description: 'Mid-tier gym (Blink, LA Fitness, NYSC basic)',
        happinessImpact: 1,
        happinessNote: 'Good facilities and classes — solid for long-term habit formation.',
      },
      {
        label: 'Splurge',
        amount: 120,
        description: 'Equinox or boutique fitness classes (starts at $270/mo at Equinox)',
        happinessImpact: 1,
        happinessNote: 'Equinox amenities are nice, but studies show exercise consistency matters far more than gym quality.',
      },
    ],
  },
  {
    id: 'student_loans',
    name: 'Student Loans',
    tooltip: 'Monthly loan payment. The average 4-year college grad owes ~$28k. Standard repayment = 10 years.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 0,
        description: 'No loans or income-based repayment plan ($0/mo)',
        happinessImpact: 2,
        happinessNote: 'No debt means no monthly financial stress from loans — a genuine and significant wellbeing advantage.',
      },
      {
        label: 'Standard',
        amount: 300,
        description: '~$28k balance, standard 10-year repayment',
        happinessImpact: 0,
        happinessNote: 'Manageable monthly payment — real but not overwhelming if your income is solid.',
      },
      {
        label: 'Splurge',
        amount: 550,
        description: '~$50k balance, standard 10-year repayment',
        happinessImpact: -2,
        happinessNote: 'High loan payments are a meaningful drag on financial flexibility and psychological freedom for years.',
      },
    ],
  },
  {
    id: 'savings',
    name: 'Emergency Savings',
    tooltip: 'Money set aside for unexpected expenses. Goal: 3–6 months of expenses. Start small if needed.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 50,
        description: 'Minimal — just starting to save',
        happinessImpact: -1,
        happinessNote: 'Almost no buffer — one unexpected expense can cascade into serious financial stress.',
      },
      {
        label: 'Standard',
        amount: 200,
        description: 'Building toward a 1-month buffer',
        happinessImpact: 1,
        happinessNote: 'Building a cushion — financial security has an outsized effect on day-to-day peace of mind.',
      },
      {
        label: 'Splurge',
        amount: 400,
        description: 'Aggressively building 3-month emergency fund',
        happinessImpact: 2,
        happinessNote: 'Aggressively building your emergency fund is one of the highest-return investments in your own well-being.',
      },
    ],
  },
  {
    id: 'misc',
    name: 'Subscriptions & Misc',
    tooltip: 'Small recurring costs that add up: apps, cloud storage, random purchases, gifts.',
    defaultTier: 1,
    tiers: [
      {
        label: 'Budget',
        amount: 30,
        description: 'One streaming service, nothing extra',
        happinessImpact: 0,
        happinessNote: 'Minimal subscriptions — you get what you actually use.',
      },
      {
        label: 'Standard',
        amount: 80,
        description: 'Music, streaming, small subscriptions',
        happinessImpact: 1,
        happinessNote: 'Music, streaming, and a few extras — reasonable for the daily quality-of-life boost.',
      },
      {
        label: 'Splurge',
        amount: 160,
        description: 'Multiple services + impulse purchases',
        happinessImpact: 0,
        happinessNote: 'Subscription creep and impulse buys — research shows this category has some of the lowest happiness-per-dollar.',
      },
    ],
  },
];

// Build default selections map: { categoryId: tierIndex }
export const DEFAULT_SELECTIONS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.defaultTier])
);

// Normalize raw happiness sum to 1–10 scale.
// Formula: score = clamp(round(4 + sum * 0.25), 1, 10)
// All-Standard ≈ 8/10. All-Budget ≈ 4/10. All-Splurge ≈ 6–7/10 (stuff has diminishing returns).
export function computeHappinessScore(selections) {
  const raw = CATEGORIES.reduce((sum, cat) => {
    const tierIdx = selections[cat.id] ?? cat.defaultTier;
    return sum + (cat.tiers[tierIdx]?.happinessImpact ?? 0);
  }, 0);
  return Math.min(10, Math.max(1, Math.round(4 + raw * 0.25)));
}
