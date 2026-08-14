// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Game Constants
// ═══════════════════════════════════════════════════════

import type {
  CareerInfo, CareerLevel, Province, Faction, Minister,
  InfrastructureStats, NationalStats, EconomicStats,
  CommodityPrices, TradeStats, EnergySystem, WaterSystem,
  ParliamentState, CorruptionIndex, PublicServices,
  CitizenSatisfaction, Budget, Election, GameState,
} from './types';

// ═══════════════════════════════════════════════════════
// CAREER LEVELS
// ═══════════════════════════════════════════════════════

export const CAREER_LEVELS: Record<CareerLevel, CareerInfo> = {
  councillor: {
    level: 'councillor',
    title: 'Ward Councillor',
    description: 'You begin your political journey as a local ward councillor. Manage a single district and prove your worth to the party.',
    budgetMultiplier: 0.05,
    unlockedMinistries: ['local_government'],
    unlockedPowers: ['local_budget', 'local_projects', 'community_meetings'],
    influenceRequired: 0,
  },
  mayor: {
    level: 'mayor',
    title: 'City Mayor',
    description: 'Elevated to mayor, you now oversee an entire city. Urban planning, service delivery, and city finances are your responsibility.',
    budgetMultiplier: 0.12,
    unlockedMinistries: ['local_government', 'urban_development', 'public_health'],
    unlockedPowers: ['city_budget', 'city_projects', 'council_meetings', 'city_police'],
    influenceRequired: 20,
  },
  governor: {
    level: 'governor',
    title: 'Provincial Governor',
    description: 'As provincial governor, you manage one of the nation\'s provinces. Agricultural policy, rural development, and provincial budgets demand your attention.',
    budgetMultiplier: 0.25,
    unlockedMinistries: ['local_government', 'urban_development', 'public_health', 'agriculture', 'provincial_planning'],
    unlockedPowers: ['provincial_budget', 'provincial_projects', 'provincial_police', 'agricultural_policy', 'rural_development'],
    influenceRequired: 40,
  },
  minister: {
    level: 'minister',
    title: 'Cabinet Minister',
    description: 'You have been appointed to the President\'s cabinet. Your ministry\'s performance reflects on the entire government. Navigate factional politics carefully.',
    budgetMultiplier: 0.5,
    unlockedMinistries: ['all_core'],
    unlockedPowers: ['ministry_budget', 'legislation', 'parliament_votes', 'international_trade', 'national_projects'],
    influenceRequired: 60,
  },
  vice_president: {
    level: 'vice_president',
    title: 'Vice President',
    description: 'As Vice President, you are a heartbeat away from the presidency. Manage inter-ministerial coordination and maintain party unity while preparing for the top job.',
    budgetMultiplier: 0.75,
    unlockedMinistries: ['all_core', 'military', 'intelligence', 'foreign_affairs'],
    unlockedPowers: ['all_ministerial', 'military_command', 'diplomacy', 'party_leadership'],
    influenceRequired: 80,
  },
  president: {
    level: 'president',
    title: 'President of the Republic',
    description: 'You are now the President. The fate of the entire nation rests in your hands. Every decision shapes the future of millions. Choose wisely.',
    budgetMultiplier: 1.0,
    unlockedMinistries: ['all'],
    unlockedPowers: ['all'],
    influenceRequired: 100,
  },
};

export const CAREER_ORDER: CareerLevel[] = ['councillor', 'mayor', 'governor', 'minister', 'vice_president', 'president'];

// ═══════════════════════════════════════════════════════
// PROVINCES (Fictional Zimbabwe-inspired)
// ═══════════════════════════════════════════════════════

export const PROVINCE_DATA: Province[] = [
  {
    id: 'harare', name: 'Harare Metropolitan',
    population: 2800000, area: 960, urbanization: 95,
    gdpContribution: 32, povertyRate: 18, unemploymentRate: 25,
    healthIndex: 62, educationIndex: 72, infrastructureIndex: 55,
    safetyIndex: 48, satisfactionIndex: 50, politicalSupport: 45,
    agriculturalOutput: 10, miningOutput: 5,
    districts: [
      { id: 'harare-cbd', name: 'Central Business District', type: 'cbd', population: 180000, roadQuality: 55, waterReliability: 65, electricityAvailability: 70, garbageCollection: 60, crime: 35, propertyValues: 75, businessActivity: 80, citizenSatisfaction: 52 },
      { id: 'mbare', name: 'Mbare', type: 'high_density', population: 350000, roadQuality: 35, waterReliability: 45, electricityAvailability: 50, garbageCollection: 30, crime: 55, propertyValues: 25, businessActivity: 55, citizenSatisfaction: 38 },
      { id: 'borrowdale', name: 'Borrowdale', type: 'low_density', population: 95000, roadQuality: 75, waterReliability: 80, electricityAvailability: 85, garbageCollection: 75, crime: 20, propertyValues: 90, businessActivity: 65, citizenSatisfaction: 70 },
      { id: 'chitungwiza', name: 'Chitungwiza', type: 'high_density', population: 380000, roadQuality: 30, waterReliability: 40, electricityAvailability: 45, garbageCollection: 25, crime: 50, propertyValues: 20, businessActivity: 40, citizenSatisfaction: 32 },
      { id: 'ruwa', name: 'Ruwa', type: 'industrial', population: 120000, roadQuality: 50, waterReliability: 55, electricityAvailability: 60, garbageCollection: 45, crime: 30, propertyValues: 45, businessActivity: 60, citizenSatisfaction: 48 },
    ],
  },
  {
    id: 'bulawayo', name: 'Bulawayo Metropolitan',
    population: 1300000, area: 1790, urbanization: 88,
    gdpContribution: 16, povertyRate: 25, unemploymentRate: 32,
    healthIndex: 55, educationIndex: 65, infrastructureIndex: 45,
    safetyIndex: 55, satisfactionIndex: 45, politicalSupport: 40,
    agriculturalOutput: 15, miningOutput: 10,
    districts: [
      { id: 'byo-cbd', name: 'City Centre', type: 'cbd', population: 85000, roadQuality: 45, waterReliability: 55, electricityAvailability: 60, garbageCollection: 50, crime: 40, propertyValues: 55, businessActivity: 60, citizenSatisfaction: 45 },
      { id: 'nkulumane', name: 'Nkulumane', type: 'high_density', population: 180000, roadQuality: 30, waterReliability: 40, electricityAvailability: 45, garbageCollection: 25, crime: 50, propertyValues: 20, businessActivity: 35, citizenSatisfaction: 30 },
      { id: 'emganwini', name: 'Emganwini', type: 'low_density', population: 65000, roadQuality: 55, waterReliability: 60, electricityAvailability: 65, garbageCollection: 55, crime: 25, propertyValues: 50, businessActivity: 40, citizenSatisfaction: 52 },
    ],
  },
  {
    id: 'manicaland', name: 'Manicaland',
    population: 2100000, area: 36459, urbanization: 30,
    gdpContribution: 10, povertyRate: 45, unemploymentRate: 40,
    healthIndex: 40, educationIndex: 45, infrastructureIndex: 30,
    safetyIndex: 60, satisfactionIndex: 40, politicalSupport: 50,
    agriculturalOutput: 55, miningOutput: 20,
    districts: [
      { id: 'mutare-cbd', name: 'Mutare City', type: 'cbd', population: 120000, roadQuality: 40, waterReliability: 50, electricityAvailability: 50, garbageCollection: 35, crime: 35, propertyValues: 40, businessActivity: 45, citizenSatisfaction: 40 },
      { id: 'rusape', name: 'Rusape', type: 'growth_point', population: 45000, roadQuality: 25, waterReliability: 35, electricityAvailability: 35, garbageCollection: 15, crime: 30, propertyValues: 20, businessActivity: 25, citizenSatisfaction: 35 },
      { id: 'nyanga', name: 'Nyanga Rural', type: 'rural', population: 35000, roadQuality: 15, waterReliability: 25, electricityAvailability: 20, garbageCollection: 5, crime: 20, propertyValues: 10, businessActivity: 15, citizenSatisfaction: 30 },
    ],
  },
  {
    id: 'mashonaland-central', name: 'Mashonaland Central',
    population: 1500000, area: 28347, urbanization: 25,
    gdpContribution: 7, povertyRate: 50, unemploymentRate: 38,
    healthIndex: 38, educationIndex: 42, infrastructureIndex: 28,
    safetyIndex: 62, satisfactionIndex: 38, politicalSupport: 55,
    agriculturalOutput: 65, miningOutput: 15,
    districts: [
      { id: 'bindura', name: 'Bindura', type: 'growth_point', population: 65000, roadQuality: 30, waterReliability: 40, electricityAvailability: 40, garbageCollection: 20, crime: 25, propertyValues: 25, businessActivity: 30, citizenSatisfaction: 35 },
      { id: 'mount-darwin', name: 'Mount Darwin', type: 'rural', population: 55000, roadQuality: 15, waterReliability: 30, electricityAvailability: 25, garbageCollection: 5, crime: 20, propertyValues: 10, businessActivity: 15, citizenSatisfaction: 28 },
    ],
  },
  {
    id: 'mashonaland-east', name: 'Mashonaland East',
    population: 1400000, area: 26228, urbanization: 22,
    gdpContribution: 6, povertyRate: 48, unemploymentRate: 35,
    healthIndex: 40, educationIndex: 44, infrastructureIndex: 30,
    safetyIndex: 60, satisfactionIndex: 40, politicalSupport: 52,
    agriculturalOutput: 60, miningOutput: 10,
    districts: [
      { id: 'marondera', name: 'Marondera', type: 'growth_point', population: 72000, roadQuality: 35, waterReliability: 45, electricityAvailability: 45, garbageCollection: 25, crime: 25, propertyValues: 30, businessActivity: 35, citizenSatisfaction: 40 },
      { id: 'wedza', name: 'Wedza', type: 'rural', population: 40000, roadQuality: 18, waterReliability: 28, electricityAvailability: 22, garbageCollection: 5, crime: 22, propertyValues: 12, businessActivity: 18, citizenSatisfaction: 32 },
    ],
  },
  {
    id: 'mashonaland-west', name: 'Mashonaland West',
    population: 1600000, area: 57441, urbanization: 28,
    gdpContribution: 9, povertyRate: 42, unemploymentRate: 36,
    healthIndex: 42, educationIndex: 46, infrastructureIndex: 32,
    safetyIndex: 58, satisfactionIndex: 42, politicalSupport: 50,
    agriculturalOutput: 70, miningOutput: 25,
    districts: [
      { id: 'chinhoyi', name: 'Chinhoyi', type: 'growth_point', population: 85000, roadQuality: 35, waterReliability: 45, electricityAvailability: 45, garbageCollection: 25, crime: 28, propertyValues: 28, businessActivity: 35, citizenSatisfaction: 38 },
      { id: 'kariba', name: 'Kariba', type: 'rural', population: 30000, roadQuality: 20, waterReliability: 50, electricityAvailability: 60, garbageCollection: 10, crime: 15, propertyValues: 25, businessActivity: 20, citizenSatisfaction: 42 },
    ],
  },
  {
    id: 'masvingo', name: 'Masvingo',
    population: 1800000, area: 56466, urbanization: 20,
    gdpContribution: 5, povertyRate: 55, unemploymentRate: 42,
    healthIndex: 35, educationIndex: 40, infrastructureIndex: 25,
    safetyIndex: 62, satisfactionIndex: 36, politicalSupport: 48,
    agriculturalOutput: 50, miningOutput: 15,
    districts: [
      { id: 'masvingo-city', name: 'Masvingo City', type: 'cbd', population: 95000, roadQuality: 35, waterReliability: 42, electricityAvailability: 45, garbageCollection: 25, crime: 30, propertyValues: 30, businessActivity: 35, citizenSatisfaction: 38 },
      { id: 'chiredzi', name: 'Chiredzi', type: 'rural', population: 48000, roadQuality: 12, waterReliability: 22, electricityAvailability: 18, garbageCollection: 5, crime: 25, propertyValues: 8, businessActivity: 12, citizenSatisfaction: 25 },
    ],
  },
  {
    id: 'matabeleland-north', name: 'Matabeleland North',
    population: 900000, area: 75175, urbanization: 18,
    gdpContribution: 5, povertyRate: 58, unemploymentRate: 45,
    healthIndex: 32, educationIndex: 38, infrastructureIndex: 22,
    safetyIndex: 65, satisfactionIndex: 34, politicalSupport: 35,
    agriculturalOutput: 35, miningOutput: 30,
    districts: [
      { id: 'hwenje', name: 'Hwange', type: 'rural', population: 42000, roadQuality: 18, waterReliability: 30, electricityAvailability: 35, garbageCollection: 8, crime: 22, propertyValues: 15, businessActivity: 22, citizenSatisfaction: 30 },
      { id: 'victoria-falls', name: 'Victoria Falls', type: 'growth_point', population: 38000, roadQuality: 40, waterReliability: 50, electricityAvailability: 55, garbageCollection: 30, crime: 20, propertyValues: 45, businessActivity: 55, citizenSatisfaction: 55 },
    ],
  },
  {
    id: 'matabeleland-south', name: 'Matabeleland South',
    population: 800000, area: 54229, urbanization: 22,
    gdpContribution: 4, povertyRate: 60, unemploymentRate: 48,
    healthIndex: 30, educationIndex: 36, infrastructureIndex: 20,
    safetyIndex: 65, satisfactionIndex: 32, politicalSupport: 32,
    agriculturalOutput: 40, miningOutput: 35,
    districts: [
      { id: 'gwanda', name: 'Gwanda', type: 'growth_point', population: 35000, roadQuality: 22, waterReliability: 32, electricityAvailability: 30, garbageCollection: 12, crime: 28, propertyValues: 18, businessActivity: 20, citizenSatisfaction: 28 },
      { id: 'beitbridge', name: 'Beitbridge', type: 'rural', population: 52000, roadQuality: 20, waterReliability: 28, electricityAvailability: 25, garbageCollection: 8, crime: 35, propertyValues: 15, businessActivity: 40, citizenSatisfaction: 30 },
    ],
  },
  {
    id: 'midlands', name: 'Midlands',
    population: 1700000, area: 48985, urbanization: 35,
    gdpContribution: 8, povertyRate: 42, unemploymentRate: 38,
    healthIndex: 40, educationIndex: 48, infrastructureIndex: 35,
    safetyIndex: 58, satisfactionIndex: 40, politicalSupport: 48,
    agriculturalOutput: 45, miningOutput: 45,
    districts: [
      { id: 'gweru', name: 'Gweru', type: 'cbd', population: 155000, roadQuality: 40, waterReliability: 48, electricityAvailability: 50, garbageCollection: 30, crime: 30, propertyValues: 35, businessActivity: 45, citizenSatisfaction: 40 },
      { id: 'kwekwe', name: 'Kwekwe', type: 'industrial', population: 110000, roadQuality: 35, waterReliability: 42, electricityAvailability: 45, garbageCollection: 25, crime: 35, propertyValues: 28, businessActivity: 40, citizenSatisfaction: 35 },
      { id: 'zvishavane', name: 'Zvishavane', type: 'rural', population: 45000, roadQuality: 20, waterReliability: 30, electricityAvailability: 28, garbageCollection: 8, crime: 25, propertyValues: 12, businessActivity: 18, citizenSatisfaction: 28 },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// MINISTERS
// ═══════════════════════════════════════════════════════

export const INITIAL_MINISTERS: Minister[] = [
  { id: 'm1', name: 'Dr. Tariro Moyo', portfolio: 'Finance', competence: 65, loyalty: 55, corruption: 35, popularity: 60, faction: 'technocrats', age: 58, isActive: true },
  { id: 'm2', name: ' Brig. Gen. Tendai Chikowore', portfolio: 'Defense', competence: 50, loyalty: 80, corruption: 45, popularity: 40, faction: 'military', age: 62, isActive: true },
  { id: 'm3', name: 'Adv. Nokuthula Dube', portfolio: 'Justice', competence: 60, loyalty: 45, corruption: 30, popularity: 55, faction: 'reformers', age: 51, isActive: true },
  { id: 'm4', name: 'Eng. Munyaradzi Ncube', portfolio: 'Energy', competence: 70, loyalty: 50, corruption: 25, popularity: 45, faction: 'technocrats', age: 54, isActive: true },
  { id: 'm5', name: 'Mrs. Chido Muchechetere', portfolio: 'Health', competence: 72, loyalty: 60, corruption: 20, popularity: 65, faction: 'reformers', age: 49, isActive: true },
  { id: 'm6', name: 'Prof. Simbarashe Mumba', portfolio: 'Education', competence: 75, loyalty: 55, corruption: 15, popularity: 70, faction: 'technocrats', age: 56, isActive: true },
  { id: 'm7', name: 'Cde. Obert Mapuranga', portfolio: 'Agriculture', competence: 40, loyalty: 85, corruption: 55, popularity: 35, faction: 'old_guard', age: 68, isActive: true },
  { id: 'm8', name: 'Ms. Rumbidzai Gamu', portfolio: 'Mines', competence: 58, loyalty: 40, corruption: 40, popularity: 42, faction: 'business', age: 47, isActive: true },
  { id: 'm9', name: 'Mr. Tawanda Gumbo', portfolio: 'Transport', competence: 45, loyalty: 65, corruption: 50, popularity: 38, faction: 'old_guard', age: 63, isActive: true },
  { id: 'm10', name: 'Dr. Precious Shumba', portfolio: 'Foreign Affairs', competence: 68, loyalty: 50, corruption: 20, popularity: 55, faction: 'technocrats', age: 53, isActive: true },
  { id: 'm11', name: 'Mr. Farai Zondo', portfolio: 'Local Government', competence: 42, loyalty: 75, corruption: 60, popularity: 30, faction: 'old_guard', age: 65, isActive: true },
  { id: 'm12', name: 'Ms. Lindiwe Ncube', portfolio: 'Water', competence: 55, loyalty: 55, corruption: 30, popularity: 48, faction: 'reformers', age: 44, isActive: true },
];

// ═══════════════════════════════════════════════════════
// FACTIONS
// ═══════════════════════════════════════════════════════

export const INITIAL_FACTIONS: Faction[] = [
  { id: 'f1', name: 'The Reformers', ideology: 'Progressive reforms, anti-corruption, modernization', supportLevel: 30, leaderName: 'Adv. Nokuthula Dube', demands: ['Pass anti-corruption bill', 'Reform civil service', 'Invest in education'], stance: 'ally' },
  { id: 'f2', name: 'Old Guard', ideology: 'Traditional values, party loyalty, patronage networks', supportLevel: 25, leaderName: 'Cde. Obert Mapuranga', demands: ['Maintain land redistribution', 'Protect party interests', 'Reward loyalty'], stance: 'neutral' },
  { id: 'f3', name: 'Technocrats', ideology: 'Evidence-based policy, economic reforms, international engagement', supportLevel: 20, leaderName: 'Dr. Tariro Moyo', demands: ['Fiscal discipline', 'Infrastructure investment', 'Trade liberalization'], stance: 'ally' },
  { id: 'f4', name: 'Military Faction', ideology: 'Security first, strong leadership, national sovereignty', supportLevel: 15, leaderName: 'Brig. Gen. Tendai Chikowore', demands: ['Increase defense budget', 'Maintain military influence', 'Internal security'], stance: 'neutral' },
  { id: 'f5', name: 'Business Caucus', ideology: 'Private sector growth, deregulation, investment climate', supportLevel: 10, leaderName: 'Ms. Rumbidzai Gamu', demands: ['Tax reforms', 'Ease of doing business', 'Property rights'], stance: 'neutral' },
];

// ═══════════════════════════════════════════════════════
// INITIAL INFRASTRUCTURE STATS
// ═══════════════════════════════════════════════════════

export const INITIAL_INFRASTRUCTURE: InfrastructureStats = {
  roadQuality: 38,
  waterReliability: 42,
  electricityAvailability: 48,
  hospitalBedsPer1000: 1.7,
  schoolsPerDistrict: 12,
  housingBacklog: 1250000,
  internetPenetration: 42,
  railwayCondition: 28,
  airportCondition: 45,
};

// ═══════════════════════════════════════════════════════
// INITIAL NATIONAL STATS
// ═══════════════════════════════════════════════════════

export const INITIAL_NATIONAL: NationalStats = {
  population: 16150000,
  populationGrowth: 2.1,
  birthRate: 33,
  deathRate: 10,
  netMigration: -25000,
  urbanPopulation: 32,
  literacyRate: 88,
  lifeExpectancy: 62,
  medianAge: 19,
};

// ═══════════════════════════════════════════════════════
// INITIAL ECONOMIC STATS
// ═══════════════════════════════════════════════════════

export const INITIAL_ECONOMIC: EconomicStats = {
  gdp: 28.5,
  gdpGrowth: 3.5,
  gdpPerCapita: 1764,
  inflation: 25,
  interestRate: 35,
  governmentDebt: 18.2,
  debtToGdp: 64,
  exchangeRate: 26.37,
  moneySupply: 85,
  investorConfidence: 35,
  consumerConfidence: 32,
  taxRevenue: 5.8,
  governmentRevenue: 8.2,
  governmentSpending: 10.5,
  budgetDeficit: 2.3,
  foreignReserves: 0.35,
  informalEconomySize: 60,
  unemploymentRate: 35,
  youthUnemployment: 55,
  blackMarketPremium: 40,
};

// ═══════════════════════════════════════════════════════
// INITIAL COMMODITY PRICES
// ═══════════════════════════════════════════════════════

export const INITIAL_COMMODITIES: CommodityPrices = {
  gold: 1950,
  platinum: 980,
  lithium: 75000,
  chrome: 180,
  tobacco: 5.2,
  cotton: 1.8,
  maize: 280,
  fuel: 82,
};

// ═══════════════════════════════════════════════════════
// INITIAL TRADE STATS
// ═══════════════════════════════════════════════════════

export const INITIAL_TRADE: TradeStats = {
  exports: 6.8,
  imports: 8.5,
  tradeBalance: -1.7,
  mainExportPartners: [
    { name: 'South Africa', value: 3.2 },
    { name: 'China', value: 1.5 },
    { name: 'Mozambique', value: 0.8 },
    { name: 'India', value: 0.5 },
    { name: 'UK', value: 0.4 },
  ],
  mainImportPartners: [
    { name: 'South Africa', value: 4.5 },
    { name: 'China', value: 2.1 },
    { name: 'Mozambique', value: 0.8 },
    { name: 'India', value: 0.5 },
    { name: 'UAE', value: 0.3 },
  ],
  exportBreakdown: { minerals: 55, tobacco: 15, agriculture: 12, manufacturing: 8, tourism: 10 },
  importBreakdown: { fuel: 20, machinery: 25, food: 18, chemicals: 12, vehicles: 8, pharmaceuticals: 7, consumer: 10 },
  smugglingRate: 15,
  borderEfficiency: 40,
};

// ═══════════════════════════════════════════════════════
// INITIAL ENERGY SYSTEM
// ═══════════════════════════════════════════════════════

export const INITIAL_ENERGY: EnergySystem = {
  totalDemand: 2200,
  totalSupply: 1500,
  deficit: 700,
  sources: {
    hydroelectric: { capacity: 750, output: 400, reliability: 50, costPerMW: 12, environmentalImpact: 20 },
    coal: { capacity: 900, output: 450, reliability: 45, costPerMW: 18, environmentalImpact: 75 },
    solar: { capacity: 100, output: 80, reliability: 70, costPerMW: 8, environmentalImpact: 5 },
    wind: { capacity: 50, output: 25, reliability: 55, costPerMW: 10, environmentalImpact: 5 },
    diesel: { capacity: 300, output: 200, reliability: 80, costPerMW: 45, environmentalImpact: 60 },
    imported: { capacity: 400, output: 250, reliability: 60, costPerMW: 22, environmentalImpact: 10 },
    independent: { capacity: 200, output: 100, reliability: 50, costPerMW: 20, environmentalImpact: 15 },
  },
  damLevel: 35,
  rainfallIndex: 45,
  loadSheddingHoursPerDay: 12,
  loadSheddingStage: 5,
  maintenanceBacklog: 65,
  renewablePercentage: 8,
  peakDemand: 2600,
  offPeakDemand: 1500,
};

// ═══════════════════════════════════════════════════════
// INITIAL WATER SYSTEM
// ═══════════════════════════════════════════════════════

export const INITIAL_WATER: WaterSystem = {
  totalDemand: 1500,
  totalSupply: 1050,
  deficit: 450,
  reservoirLevels: 42,
  treatmentCapacity: 55,
  pipelineCondition: 35,
  sewerCondition: 28,
  urbanAccess: 65,
  ruralAccess: 35,
  waterQuality: 52,
  leakageRate: 45,
  boreholeCount: 35000,
  droughtRisk: 55,
  floodingRisk: 25,
};

// ═══════════════════════════════════════════════════════
// INITIAL PARLIAMENT
// ═══════════════════════════════════════════════════════

export const INITIAL_PARLIAMENT: ParliamentState = {
  totalSeats: 270,
  rulingPartySeats: 155,
  oppositionSeats: 95,
  independentSeats: 20,
  billsPending: 5,
  billsPassedThisTurn: 0,
  billsRejectedThisTurn: 0,
  publicSupportForGovernment: 48,
  mpSatisfaction: 50,
};

// ═══════════════════════════════════════════════════════
// INITIAL CORRUPTION INDEX
// ═══════════════════════════════════════════════════════

export const INITIAL_CORRUPTION: CorruptionIndex = {
  nationalLevel: 68,
  institutionsStrength: 35,
  publicPerception: 72,
  casesThisYear: 12,
  casesResolved: 3,
  fundsLostToCorruption: 85,
  recoveryRate: 8,
};

// ═══════════════════════════════════════════════════════
// INITIAL PUBLIC SERVICES
// ═══════════════════════════════════════════════════════

export const INITIAL_PUBLIC_SERVICES: PublicServices = {
  schools: 42,
  hospitals: 38,
  roads: 38,
  water: 42,
  electricity: 48,
  publicTransport: 30,
  wasteCollection: 28,
  internet: 42,
  police: 45,
  fireServices: 32,
};

// ═══════════════════════════════════════════════════════
// INITIAL CITIZEN SATISFACTION
// ═══════════════════════════════════════════════════════

export const INITIAL_CITIZEN_SATISFACTION: CitizenSatisfaction = {
  overall: 38,
  economy: 30,
  services: 35,
  governance: 32,
  security: 42,
  infrastructure: 34,
  freedom: 45,
  future: 28,
};

// ═══════════════════════════════════════════════════════
// MONTHS
// ═══════════════════════════════════════════════════════

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SEASON_FROM_MONTH: Record<number, string> = {
  1: 'summer', 2: 'summer', 3: 'autumn', 4: 'autumn', 5: 'winter', 6: 'winter',
  7: 'winter', 8: 'spring', 9: 'spring', 10: 'spring', 11: 'summer', 12: 'summer',
};

// ═══════════════════════════════════════════════════════
// EVENT DECISION TIMEOUT
// ═══════════════════════════════════════════════════════

export const EVENT_DECISION_SECONDS = 45;

export const EVENT_TIMEOUT_PENALTY = {
  popularity: 5,
  legitimacy: 3,
  governance: 5,
};

// ═══════════════════════════════════════════════════════
// GAME COLORS / THEMING
// ═══════════════════════════════════════════════════════

export const GAME_COLORS = {
  primary: '#D4A843', // Gold - Zimbabwe flag inspired
  secondary: '#2D5F2D', // Green
  danger: '#C41E3A', // Red
  accent: '#F0E68C', // Khaki
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#1f3460',
  text: '#e8e8e8',
  textMuted: '#8892a4',
  positive: '#4CAF50',
  negative: '#f44336',
  warning: '#FF9800',
  info: '#2196F3',
  map: {
    land: '#5D8233',
    water: '#3B7DD8',
    border: '#D4A843',
    highlight: '#FFD700',
  },
};

// ═══════════════════════════════════════════════════════
// BUDGET DEFAULTS
// ═══════════════════════════════════════════════════════

export const BUDGET_CATEGORIES = [
  { key: 'roads', displayName: 'Roads & Transport', icon: '🛣️', minimumRequired: 200, recommended: 500, efficiency: 55, corruptionLeakage: 25, impactWeights: { economy: 0.7, publicSatisfaction: 0.6, infrastructure: 0.9 } },
  { key: 'water', displayName: 'Water & Sanitation', icon: '💧', minimumRequired: 150, recommended: 400, efficiency: 50, corruptionLeakage: 20, impactWeights: { economy: 0.5, publicSatisfaction: 0.8, infrastructure: 0.7 } },
  { key: 'education', displayName: 'Education', icon: '📚', minimumRequired: 300, recommended: 700, efficiency: 65, corruptionLeakage: 15, impactWeights: { economy: 0.8, publicSatisfaction: 0.7, infrastructure: 0.3 } },
  { key: 'hospitals', displayName: 'Healthcare', icon: '🏥', minimumRequired: 250, recommended: 600, efficiency: 55, corruptionLeakage: 20, impactWeights: { economy: 0.6, publicSatisfaction: 0.9, infrastructure: 0.4 } },
  { key: 'police', displayName: 'Police & Security', icon: '👮', minimumRequired: 200, recommended: 450, efficiency: 60, corruptionLeakage: 30, impactWeights: { economy: 0.4, publicSatisfaction: 0.6, infrastructure: 0.1 } },
  { key: 'military', displayName: 'Military & Defense', icon: '🛡️', minimumRequired: 180, recommended: 400, efficiency: 70, corruptionLeakage: 35, impactWeights: { economy: 0.2, publicSatisfaction: 0.3, infrastructure: 0.1 } },
  { key: 'agriculture', displayName: 'Agriculture', icon: '🌾', minimumRequired: 150, recommended: 350, efficiency: 45, corruptionLeakage: 22, impactWeights: { economy: 0.8, publicSatisfaction: 0.5, infrastructure: 0.4 } },
  { key: 'mining', displayName: 'Mining', icon: '⛏️', minimumRequired: 80, recommended: 200, efficiency: 50, corruptionLeakage: 40, impactWeights: { economy: 0.9, publicSatisfaction: 0.3, infrastructure: 0.5 } },
  { key: 'energy', displayName: 'Energy', icon: '⚡', minimumRequired: 250, recommended: 550, efficiency: 50, corruptionLeakage: 30, impactWeights: { economy: 0.8, publicSatisfaction: 0.7, infrastructure: 0.8 } },
  { key: 'housing', displayName: 'Housing', icon: '🏠', minimumRequired: 100, recommended: 300, efficiency: 45, corruptionLeakage: 28, impactWeights: { economy: 0.5, publicSatisfaction: 0.7, infrastructure: 0.6 } },
  { key: 'ict', displayName: 'ICT & Digital', icon: '💻', minimumRequired: 50, recommended: 150, efficiency: 60, corruptionLeakage: 18, impactWeights: { economy: 0.7, publicSatisfaction: 0.5, infrastructure: 0.4 } },
  { key: 'social_welfare', displayName: 'Social Welfare', icon: '🤝', minimumRequired: 120, recommended: 300, efficiency: 55, corruptionLeakage: 25, impactWeights: { economy: 0.3, publicSatisfaction: 0.8, infrastructure: 0.1 } },
  { key: 'youth_development', displayName: 'Youth Development', icon: '🎓', minimumRequired: 50, recommended: 150, efficiency: 50, corruptionLeakage: 20, impactWeights: { economy: 0.6, publicSatisfaction: 0.6, infrastructure: 0.2 } },
  { key: 'tourism', displayName: 'Tourism', icon: '✈️', minimumRequired: 60, recommended: 180, efficiency: 55, corruptionLeakage: 15, impactWeights: { economy: 0.7, publicSatisfaction: 0.4, infrastructure: 0.5 } },
  { key: 'disaster_relief', displayName: 'Disaster Relief', icon: '🆘', minimumRequired: 40, recommended: 100, efficiency: 65, corruptionLeakage: 20, impactWeights: { economy: 0.2, publicSatisfaction: 0.5, infrastructure: 0.2 } },
  { key: 'debt_repayment', displayName: 'Debt Repayment', icon: '🏦', minimumRequired: 200, recommended: 400, efficiency: 90, corruptionLeakage: 5, impactWeights: { economy: 0.6, publicSatisfaction: 0.2, infrastructure: 0.0 } },
  { key: 'administration', displayName: 'Administration', icon: '🏛️', minimumRequired: 100, recommended: 250, efficiency: 45, corruptionLeakage: 32, impactWeights: { economy: 0.2, publicSatisfaction: 0.2, infrastructure: 0.1 } },
];

// ═══════════════════════════════════════════════════════
// INITIAL BUDGET
// ═══════════════════════════════════════════════════════

export function createInitialBudget(): Budget {
  return {
    fiscalYear: 2025,
    totalRevenue: 5200,
    totalAllocated: 5200,
    totalSpent: 5200,
    deficit: 200,
    items: BUDGET_CATEGORIES.map(cat => ({
      category: cat.key as any,
      displayName: cat.displayName,
      icon: cat.icon,
      allocated: Math.floor(cat.recommended * 0.6 + Math.random() * cat.recommended * 0.3),
      minimumRequired: cat.minimumRequired,
      recommended: cat.recommended,
      efficiency: cat.efficiency,
      corruptionLeakage: cat.corruptionLeakage,
      impactWeights: cat.impactWeights,
    })),
    previousYearActual: {
      roads: 350, water: 280, education: 500, hospitals: 420,
      police: 350, military: 300, agriculture: 250, mining: 120,
      energy: 400, housing: 200, ict: 80, social_welfare: 220,
      youth_development: 80, tourism: 100, disaster_relief: 60,
      debt_repayment: 300, administration: 200,
    },
  };
}

// ═══════════════════════════════════════════════════════
// INITIAL ELECTION
// ═══════════════════════════════════════════════════════

export function createInitialElection(): Election {
  return {
    id: 'e1',
    type: 'presidential',
    year: 2028,
    month: 8,
    isCampaigning: false,
    campaignTurnsLeft: 0,
    playerVotes: 0,
    opponentVotes: 0,
    totalVoters: 7500000,
    turnoutPercent: 65,
    playerManifesto: [],
    polls: [{ turn: 1, playerPercent: 48, opponentPercent: 42 }],
    isOver: false,
    playerWon: false,
    historicalResults: [
      { year: 2018, playerParty: 50, opposition: 44 },
      { year: 2023, playerParty: 48, opposition: 46 },
    ],
  };
}

// ═══════════════════════════════════════════════════════
// CREATE INITIAL GAME STATE
// ═══════════════════════════════════════════════════════

export function createInitialGameState(difficulty: 'easy' | 'normal' | 'hard' = 'normal'): GameState {
  const diffMult = { easy: 0.8, normal: 1.0, hard: 1.2 }[difficulty];

  return {
    player: {
      name: 'Comrade Leader',
      partyName: 'Zimbabwe Peoples Party',
      careerLevel: 'president',
      turn: 1,
      month: 1,
      year: 2025,
      popularity: 48 / diffMult,
      politicalInfluence: 55,
      legitimacy: 50,
      corruptionTolerance: 10,
      campaignFunds: 15,
      approvalByProvince: {
        harare: 42, bulawayo: 38, manicaland: 50, 'mashonaland-central': 52,
        'mashonaland-east': 50, 'mashonaland-west': 48, masvingo: 45,
        'matabeleland-north': 35, 'matabeleland-south': 32, midlands: 46,
      },
      promises: [],
      fulfilledPromises: [],
      brokenPromises: [],
    },
    national: { ...INITIAL_NATIONAL },
    economic: {
      ...INITIAL_ECONOMIC,
      inflation: INITIAL_ECONOMIC.inflation * diffMult,
      unemploymentRate: INITIAL_ECONOMIC.unemploymentRate * diffMult,
      corruption: undefined as any,
    } as any,
    commodities: { ...INITIAL_COMMODITIES },
    trade: { ...INITIAL_TRADE },
    infrastructure: { ...INITIAL_INFRASTRUCTURE },
    projects: [],
    energy: { ...INITIAL_ENERGY },
    water: { ...INITIAL_WATER },
    provinces: PROVINCE_DATA.map(p => ({ ...p, districts: p.districts.map(d => ({ ...d })) })),
    ministers: INITIAL_MINISTERS.map(m => ({ ...m })),
    factions: INITIAL_FACTIONS.map(f => ({ ...f })),
    parliament: { ...INITIAL_PARLIAMENT },
    bills: [],
    corruption: { ...INITIAL_CORRUPTION, nationalLevel: INITIAL_CORRUPTION.nationalLevel * diffMult },
    corruptionCases: [],
    events: [],
    newsHistory: [],
    budget: createInitialBudget(),
    elections: [createInitialElection()],
    publicServices: { ...INITIAL_PUBLIC_SERVICES },
    citizenSatisfaction: { ...INITIAL_CITIZEN_SATISFACTION },
    decisionHistory: [],
    gameLog: ['The game begins. You are the newly elected President of the Republic. The nation faces many challenges.'],
    isGameOver: false,
    gameStarted: true,
    difficulty,
  };
}
