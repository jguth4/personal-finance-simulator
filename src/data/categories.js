// Budget categories with three NYC 2026 tiers: budget / standard / splurge
// Each tier: { label, amount, description }

export const CATEGORIES = [
  {
    id: 'rent',
    name: 'Rent',
    tooltip: 'Your monthly share of housing costs. NYC is expensive — most people start with roommates.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 1400, description: 'Room in shared Queens apt, 2+ roommates' },
      { label: 'Standard', amount: 1750, description: 'Room in shared Brooklyn apt, 1 roommate' },
      { label: 'Splurge', amount: 2800, description: 'Studio apartment in Manhattan' },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    tooltip: 'Food you cook at home. Cooking most meals is the single biggest way to cut food costs.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 200, description: 'Cook most meals, shop sales & store brands' },
      { label: 'Standard', amount: 300, description: 'Mix of cooking and convenience foods' },
      { label: 'Splurge', amount: 450, description: 'Whole Foods, organic, minimal meal planning' },
    ],
  },
  {
    id: 'dining',
    name: 'Dining Out',
    tooltip: 'Restaurants, delivery apps, coffee, and lunch. NYC makes this easy to overspend on.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 80, description: 'Coffee + occasional lunch, cook everything else' },
      { label: 'Standard', amount: 200, description: '2–3 dinners out per week' },
      { label: 'Splurge', amount: 400, description: 'Restaurants often, DoorDash regularly' },
    ],
  },
  {
    id: 'transit',
    name: 'Transportation',
    tooltip: 'NYC subway unlimited monthly pass is $134. Most people don\'t need a car.',
    defaultTier: 0,
    tiers: [
      { label: 'Budget', amount: 134, description: 'Unlimited MetroCard only — subway everywhere' },
      { label: 'Standard', amount: 180, description: 'MetroCard + occasional Uber/Lyft' },
      { label: 'Splurge', amount: 300, description: 'MetroCard + Uber frequently or car insurance' },
    ],
  },
  {
    id: 'health',
    name: 'Health Insurance',
    tooltip: 'Your share of employer health insurance premiums, deducted from your paycheck before taxes.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 120, description: 'Basic employer plan, high deductible (HDHP)' },
      { label: 'Standard', amount: 220, description: 'Mid-tier employer plan, moderate deductible' },
      { label: 'Splurge', amount: 380, description: 'Premium plan, low deductible, wide network' },
    ],
  },
  {
    id: 'phone',
    name: 'Phone',
    tooltip: 'Monthly phone bill. Budget carriers like Mint Mobile use the same networks as the big ones.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 45, description: 'Budget carrier (Mint Mobile, Visible, Metro)' },
      { label: 'Standard', amount: 75, description: 'Mid-tier plan (T-Mobile, AT&T, Verizon)' },
      { label: 'Splurge', amount: 110, description: 'Premium unlimited with latest iPhone' },
    ],
  },
  {
    id: 'renters_insurance',
    name: 'Renters Insurance',
    tooltip: 'Covers theft, fire, or damage to your belongings. Most landlords require it. Often overlooked.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 15, description: 'Basic coverage (~$15k belongings)' },
      { label: 'Standard', amount: 20, description: 'Standard coverage with liability' },
      { label: 'Splurge', amount: 30, description: 'Full replacement value + high liability' },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    tooltip: 'Electric, gas, and internet. Internet is sometimes included in NYC rent.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 40, description: 'Minimal usage; internet often included in rent' },
      { label: 'Standard', amount: 70, description: 'Electric + internet, average usage' },
      { label: 'Splurge', amount: 110, description: 'AC in summer, electric heat, fast internet' },
    ],
  },
  {
    id: 'personal_care',
    name: 'Personal Care',
    tooltip: 'Haircuts, toiletries, skincare, and grooming. Costs vary widely by lifestyle.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 40, description: 'Drugstore products, cheap haircuts' },
      { label: 'Standard', amount: 80, description: 'Mid-range products, regular haircut' },
      { label: 'Splurge', amount: 150, description: 'Salon visits, quality skincare routine' },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    tooltip: 'Monthly clothing budget. Work attire and personal style — highly variable.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 30, description: 'Thrift stores, sales only, minimal buying' },
      { label: 'Standard', amount: 100, description: 'Mix of fast fashion and basics' },
      { label: 'Splurge', amount: 250, description: 'New clothes regularly, brand names' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    tooltip: 'Streaming, going out, concerts, hobbies. NYC has tons of free stuff — but also tons of temptation.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 60, description: 'One streaming service, free NYC activities' },
      { label: 'Standard', amount: 150, description: 'Streaming + going out 1–2x per month' },
      { label: 'Splurge', amount: 300, description: 'Concerts, bars, events, multiple subscriptions' },
    ],
  },
  {
    id: 'gym',
    name: 'Gym / Fitness',
    tooltip: 'Gym membership or fitness classes. NYC has options from $25/mo to $200+.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 25, description: 'Planet Fitness — basic but effective' },
      { label: 'Standard', amount: 60, description: 'Mid-tier gym (Blink, LA Fitness, NYSC basic)' },
      { label: 'Splurge', amount: 120, description: 'Equinox or boutique fitness classes' },
    ],
  },
  {
    id: 'student_loans',
    name: 'Student Loans',
    tooltip: 'Monthly loan payment. The average 4-year college grad owes ~$28k. Standard repayment = 10 years.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 0, description: 'No loans or income-based repayment plan ($0/mo)' },
      { label: 'Standard', amount: 300, description: '~$28k balance, standard 10-year repayment' },
      { label: 'Splurge', amount: 550, description: '~$50k balance, standard 10-year repayment' },
    ],
  },
  {
    id: 'savings',
    name: 'Emergency Savings',
    tooltip: 'Money set aside for unexpected expenses. Goal: 3–6 months of expenses. Start small if needed.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 50, description: 'Minimal — just starting to save' },
      { label: 'Standard', amount: 200, description: 'Building toward a 1-month buffer' },
      { label: 'Splurge', amount: 400, description: 'Aggressively building 3-month emergency fund' },
    ],
  },
  {
    id: 'misc',
    name: 'Subscriptions & Misc',
    tooltip: 'Small recurring costs that add up: apps, cloud storage, random purchases, gifts.',
    defaultTier: 1,
    tiers: [
      { label: 'Budget', amount: 30, description: 'One streaming service, nothing extra' },
      { label: 'Standard', amount: 80, description: 'Music, streaming, small subscriptions' },
      { label: 'Splurge', amount: 160, description: 'Multiple services + impulse purchases' },
    ],
  },
];

// Build default selections map: { categoryId: tierIndex }
export const DEFAULT_SELECTIONS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.defaultTier])
);
