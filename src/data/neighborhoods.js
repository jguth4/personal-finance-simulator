// NYC neighborhood rent data — Source: StreetEasy Market Reports Q1 2025
// Per-person monthly rent by living situation

export const NEIGHBORHOODS = [
  {
    id: 'uptown',
    name: 'Washington Heights / Inwood',
    description: 'Most affordable. A/1 train, 30–40 min to Midtown. Up-and-coming.',
    rent: { twoRoommates: 980, oneRoommate: 1200, studio: 1650, oneBR: 1950 },
  },
  {
    id: 'bushwick',
    name: 'Bushwick / Ridgewood',
    description: 'Very affordable. J/M/Z train, ~25 min to Midtown. Artsy, young crowd.',
    rent: { twoRoommates: 1050, oneRoommate: 1300, studio: 1800, oneBR: 2100 },
  },
  {
    id: 'astoria',
    name: 'Astoria / Jackson Heights (Queens)',
    description: 'Affordable. N/W/7 train, ~30 min to Midtown. Great food, diverse.',
    rent: { twoRoommates: 1100, oneRoommate: 1380, studio: 1950, oneBR: 2300 },
  },
  {
    id: 'harlem',
    name: 'Harlem / East Harlem',
    description: 'Affordable Manhattan. A/B/C/D/2/3 trains, 20–25 min to Midtown. Great culture and food.',
    rent: { twoRoommates: 1050, oneRoommate: 1300, studio: 1800, oneBR: 2200 },
  },
  {
    id: 'williamsburg',
    name: 'Williamsburg / Greenpoint',
    description: 'Trendy, higher prices. L train to Manhattan. Bars, restaurants, events.',
    rent: { twoRoommates: 1400, oneRoommate: 1800, studio: 2500, oneBR: 3000 },
  },
  {
    id: 'hells_kitchen',
    name: "Hell's Kitchen / Midtown West",
    description: 'Central Manhattan. A/C/E/1 trains. Close to everything, popular with young professionals.',
    rent: { twoRoommates: 1350, oneRoommate: 1700, studio: 2400, oneBR: 2900 },
  },
  {
    id: 'uws',
    name: 'Upper West Side',
    description: 'Classic NYC. 1/2/3/B/C trains, 15–20 min to Midtown. Parks, museums, family-friendly.',
    rent: { twoRoommates: 1400, oneRoommate: 1800, studio: 2500, oneBR: 3000 },
  },
  {
    id: 'ues',
    name: 'Upper East Side',
    description: 'Classic, residential. 4/5/6/Q trains. Museum Mile, quieter nightlife, premium feel.',
    rent: { twoRoommates: 1450, oneRoommate: 1850, studio: 2600, oneBR: 3200 },
  },
  {
    id: 'downtown',
    name: 'Lower Manhattan / Brooklyn Heights',
    description: 'Premium. Short commutes everywhere. Close to everything — you pay for it.',
    rent: { twoRoommates: 1650, oneRoommate: 2050, studio: 2900, oneBR: 3500 },
  },
];

export const LIVING_SITUATIONS = [
  {
    id: 'twoRoommates',
    label: 'Room with 2 roommates',
    description: '3 people share an apartment, you split rent 3 ways',
  },
  {
    id: 'oneRoommate',
    label: 'Room with 1 roommate',
    description: '2 people share an apartment, you split rent 2 ways',
  },
  {
    id: 'studio',
    label: 'Solo studio',
    description: 'Your own studio apartment — no roommates',
  },
  {
    id: 'oneBR',
    label: 'Solo 1-bedroom',
    description: 'Your own 1-bedroom apartment — no roommates',
  },
];

export const AMENITIES = [
  {
    id: 'walkup',
    label: 'Walk-up building (no elevator)',
    description: 'Usually 4–5 floors, stairs only. Very common in NYC — saves you real money.',
    monthlyCost: -120,
  },
  {
    id: 'laundry',
    label: 'In-unit washer/dryer',
    description: 'No more laundromat trips',
    monthlyCost: 130,
  },
  {
    id: 'doorman',
    label: 'Doorman / concierge',
    description: 'Package delivery, security, maintenance coordination',
    monthlyCost: 200,
  },
  {
    id: 'gymInBuilding',
    label: 'Gym in building',
    description: 'Replaces a separate gym membership',
    monthlyCost: 80,
    replacesGym: true,
  },
  {
    id: 'outdoor',
    label: 'Outdoor space (roof deck / garden)',
    description: 'Private or shared roof access — a premium in NYC',
    monthlyCost: 150,
  },
  {
    id: 'modernKitchen',
    label: 'Modern kitchen / full-size appliances',
    description: 'Makes home cooking easier — can reduce food delivery spending',
    monthlyCost: 75,
  },
];

export function computeRent(neighborhoodId, livingSituationId, amenityIds = []) {
  const neighborhood = NEIGHBORHOODS.find((n) => n.id === neighborhoodId);
  if (!neighborhood) return 1500;
  const base = neighborhood.rent[livingSituationId] ?? neighborhood.rent.studio;
  const amenityPremium = AMENITIES
    .filter((a) => amenityIds.includes(a.id))
    .reduce((sum, a) => sum + a.monthlyCost, 0);
  return base + amenityPremium;
}
