// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Core Game Types
// ═══════════════════════════════════════════════════════

export type CareerLevel = 'councillor' | 'mayor' | 'governor' | 'minister' | 'vice_president' | 'president';

export interface CareerInfo {
  level: CareerLevel;
  title: string;
  description: string;
  budgetMultiplier: number;
  unlockedMinistries: string[];
  unlockedPowers: string[];
  influenceRequired: number;
}

export interface PlayerState {
  name: string;
  partyName: string;
  careerLevel: CareerLevel;
  turn: number;
  month: number; // 1-12
  year: number;
  popularity: number; // 0-100
  politicalInfluence: number; // 0-100
  legitimacy: number; // 0-100
  corruptionTolerance: number; // -50 to 50 (negative = anti-corruption stance)
  campaignFunds: number; // in millions ZiG
  approvalByProvince: Record<string, number>;
  promises: Promise[];
  fulfilledPromises: string[];
  brokenPromises: string[];
  titles: string[];
}

export interface Promise {
  id: string;
  text: string;
  category: string;
  targetValue: number;
  currentValue: number;
  deadline: number; // turn number
}

// ═══════════════════════════════════════════════════════
// NATIONAL STATISTICS
// ═══════════════════════════════════════════════════════

export interface NationalStats {
  population: number;
  populationGrowth: number; // percentage
  birthRate: number; // per 1000
  deathRate: number; // per 1000
  netMigration: number; // net number per turn
  urbanPopulation: number; // percentage
  literacyRate: number; // percentage
  lifeExpectancy: number; // years
  medianAge: number;
}

export interface EconomicStats {
  gdp: number; // in billions ZiG
  gdpGrowth: number; // percentage
  gdpPerCapita: number;
  inflation: number; // percentage
  interestRate: number; // percentage
  governmentDebt: number; // billions ZiG
  debtToGdp: number; // percentage
  exchangeRate: number; // ZiG per USD
  moneySupply: number; // billions
  investorConfidence: number; // 0-100
  consumerConfidence: number; // 0-100
  taxRevenue: number; // billions
  governmentRevenue: number; // billions
  governmentSpending: number; // billions
  budgetDeficit: number; // billions
  foreignReserves: number; // billions ZiG
  informalEconomySize: number; // percentage of GDP
  unemploymentRate: number; // percentage
  youthUnemployment: number; // percentage
  blackMarketPremium: number; // percentage above official rate
}

export interface CommodityPrices {
  gold: number; // USD/oz
  platinum: number; // USD/oz
  lithium: number; // USD/ton
  chrome: number; // USD/ton
  tobacco: number; // USD/kg
  cotton: number; // USD/kg
  maize: number; // USD/ton
  fuel: number; // USD/barrel
}

export interface TradeStats {
  exports: number; // billions USD
  imports: number; // billions USD
  tradeBalance: number;
  mainExportPartners: { name: string; value: number }[];
  mainImportPartners: { name: string; value: number }[];
  exportBreakdown: Record<string, number>;
  importBreakdown: Record<string, number>;
  smugglingRate: number; // percentage
  borderEfficiency: number; // 0-100
}

// ═══════════════════════════════════════════════════════
// INFRASTRUCTURE
// ═══════════════════════════════════════════════════════

export type InfrastructureCategory =
  | 'roads'
  | 'water'
  | 'energy'
  | 'healthcare'
  | 'education'
  | 'housing'
  | 'telecommunications'
  | 'transport'
  | 'agriculture'
  | 'mining'
  | 'tourism'
  | 'security';

export interface InfrastructureProject {
  id: string;
  name: string;
  category: InfrastructureCategory;
  province: string;
  district?: string;
  description: string;
  cost: number; // millions ZiG
  maintenanceCost: number; // millions per turn
  completionTime: number; // turns
  progress: number; // 0-100 percentage
  politicalPopularity: number; // -50 to 50
  economicImpact: number; // -50 to 50
  employmentCreated: number;
  environmentalImpact: number; // -50 to 50
  corruptionRisk: number; // 0-100
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'abandoned';
  startedTurn?: number;
  completedTurn?: number;
}

export interface InfrastructureStats {
  roadQuality: number; // 0-100 national average
  waterReliability: number; // 0-100
  electricityAvailability: number; // 0-100
  hospitalBedsPer1000: number;
  schoolsPerDistrict: number;
  housingBacklog: number; // units needed
  internetPenetration: number; // percentage
  railwayCondition: number; // 0-100
  airportCondition: number; // 0-100
}

// ═══════════════════════════════════════════════════════
// ENERGY / LOAD SHEDDING
// ═══════════════════════════════════════════════════════

export type EnergySource = 'hydroelectric' | 'coal' | 'solar' | 'wind' | 'diesel' | 'imported' | 'independent';

export interface EnergySystem {
  totalDemand: number; // MW
  totalSupply: number; // MW
  deficit: number; // MW
  sources: Record<EnergySource, {
    capacity: number; // MW
    output: number; // MW
    reliability: number; // 0-100
    costPerMW: number; // ZiG
    environmentalImpact: number; // 0-100
  }>;
  damLevel: number; // percentage
  rainfallIndex: number; // 0-100
  loadSheddingHoursPerDay: number;
  loadSheddingStage: number; // 0-8
  maintenanceBacklog: number; // 0-100
  renewablePercentage: number;
  peakDemand: number;
  offPeakDemand: number;
}

// ═══════════════════════════════════════════════════════
// WATER MANAGEMENT
// ═══════════════════════════════════════════════════════

export interface WaterSystem {
  totalDemand: number; // megaliters/day
  totalSupply: number;
  deficit: number;
  reservoirLevels: number; // percentage average
  treatmentCapacity: number; // percentage
  pipelineCondition: number; // 0-100
  sewerCondition: number; // 0-100
  urbanAccess: number; // percentage with reliable water
  ruralAccess: number; // percentage with reliable water
  waterQuality: number; // 0-100
  leakageRate: number; // percentage lost
  boreholeCount: number;
  droughtRisk: number; // 0-100
  floodingRisk: number; // 0-100
}

// ═══════════════════════════════════════════════════════
// PROVINCES & DISTRICTS
// ═══════════════════════════════════════════════════════

export interface Province {
  id: string;
  name: string;
  population: number;
  area: number; // km2
  urbanization: number; // percentage
  gdpContribution: number; // percentage
  povertyRate: number;
  unemploymentRate: number;
  healthIndex: number; // 0-100
  educationIndex: number; // 0-100
  infrastructureIndex: number; // 0-100
  safetyIndex: number; // 0-100
  satisfactionIndex: number; // 0-100
  politicalSupport: number; // 0-100 (for player)
  agriculturalOutput: number; // relative index
  miningOutput: number; // relative index
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  type: 'cbd' | 'high_density' | 'low_density' | 'industrial' | 'rural' | 'growth_point';
  population: number;
  roadQuality: number;
  waterReliability: number;
  electricityAvailability: number;
  garbageCollection: number;
  crime: number; // 0-100 (lower is better)
  propertyValues: number; // index
  businessActivity: number; // index
  citizenSatisfaction: number;
}

// ═══════════════════════════════════════════════════════
// POLITICAL SYSTEM
// ═══════════════════════════════════════════════════════

export interface Minister {
  id: string;
  name: string;
  portfolio: string;
  competence: number; // 0-100
  loyalty: number; // 0-100
  corruption: number; // 0-100
  popularity: number; // 0-100
  faction: string;
  age: number;
  isActive: boolean;
}

export interface Faction {
  id: string;
  name: string;
  ideology: string;
  supportLevel: number; // 0-100
  leaderName: string;
  demands: string[];
  stance: 'ally' | 'neutral' | 'opponent' | 'rebel';
}

export interface ParliamentState {
  totalSeats: number;
  rulingPartySeats: number;
  oppositionSeats: number;
  independentSeats: number;
  billsPending: number;
  billsPassedThisTurn: number;
  billsRejectedThisTurn: number;
  publicSupportForGovernment: number;
  mpSatisfaction: number;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  category: string;
  sponsor: string;
  publicSupport: number;
  cost: number;
  popularityImpact: number;
  economicImpact: number;
  socialImpact: number;
  status: 'proposed' | 'debating' | 'voting' | 'passed' | 'rejected';
  votesFor: number;
  votesAgainst: number;
}

// ═══════════════════════════════════════════════════════
// CORRUPTION
// ═══════════════════════════════════════════════════════

export interface CorruptionCase {
  id: string;
  description: string;
  involvedOfficial: string;
  severity: 'minor' | 'major' | 'critical';
  amountInvolved: number; // millions ZiG
  discovered: boolean;
  investigated: boolean;
  prosecuted: boolean;
  publicAwareness: number; // 0-100
  politicalDamage: number;
}

export interface CorruptionIndex {
  nationalLevel: number; // 0-100 (higher = more corrupt)
  institutionsStrength: number; // 0-100
  publicPerception: number; // 0-100
  casesThisYear: number;
  casesResolved: number;
  fundsLostToCorruption: number; // millions per turn
  recoveryRate: number; // percentage
}

// ═══════════════════════════════════════════════════════
// EVENTS & NEWS
// ═══════════════════════════════════════════════════════

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'crisis';
export type EventCategory =
  | 'economic'
  | 'political'
  | 'social'
  | 'natural_disaster'
  | 'international'
  | 'infrastructure'
  | 'health'
  | 'security'
  | 'agriculture'
  | 'energy'
  | 'water'
  | 'mining'
  | 'tourism'
  | 'education';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: EventSeverity;
  turn: number;
  month: number;
  year: number;
  choices?: EventChoice[];
  effects?: EventEffect[];
  isRandom: boolean;
  resolved: boolean;
  choiceMade?: string;
  deadline?: number;
  penaltyApplied?: boolean;
  templateId?: string;
}

export interface EventChoice {
  id: string;
  text: string;
  shortDescription: string;
  effects: EventEffect[];
  politicalRisk: number;
  popularityImpact: number;
  setFlags?: string[];
  clearFlags?: string[];
  nextEventId?: string;
  consequenceDelay?: number; // turns before the next event fires
}

export interface EventEffect {
  target: string;
  operation: 'add' | 'subtract' | 'multiply' | 'set' | 'setFlag' | 'clearFlag';
  value: number;
  duration: number; // turns, 0 = permanent
}

export interface PendingConsequence {
  id: string;
  fireTurn: number;
  templateId: string;
  setFlags: string[];
  clearFlags: string[];
}

export interface ArchivedEvent {
  id: string;
  templateId?: string;
  title: string;
  category: EventCategory;
  severity: EventSeverity;
  turn: number;
  month: number;
  year: number;
  choiceText?: string;
  outcome: 'resolved' | 'expired';
  popularityImpact?: number;
  politicalRisk?: number;
}

export type PublicMood = 'euphoric' | 'optimistic' | 'content' | 'restless' | 'defiant';

export interface NewsArticle {
  id: string;
  headline: string;
  subheadline: string;
  body: string;
  category: EventCategory;
  turn: number;
  month: number;
  year: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  impact: number;
  isBreaking: boolean;
}

// ═══════════════════════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════════════════════

export type BudgetCategory =
  | 'roads'
  | 'water'
  | 'education'
  | 'hospitals'
  | 'police'
  | 'military'
  | 'agriculture'
  | 'mining'
  | 'energy'
  | 'housing'
  | 'ict'
  | 'social_welfare'
  | 'youth_development'
  | 'tourism'
  | 'disaster_relief'
  | 'debt_repayment'
  | 'administration';

export interface BudgetItem {
  category: BudgetCategory;
  displayName: string;
  icon: string;
  allocated: number; // millions ZiG
  minimumRequired: number;
  recommended: number;
  efficiency: number; // 0-100
  corruptionLeakage: number; // percentage
  impactWeights: {
    economy: number;
    publicSatisfaction: number;
    infrastructure: number;
  };
}

export interface Budget {
  fiscalYear: number;
  totalRevenue: number; // millions
  totalAllocated: number;
  totalSpent: number;
  deficit: number;
  items: BudgetItem[];
  previousYearActual: Record<BudgetCategory, number>;
}

// ═══════════════════════════════════════════════════════
// ELECTIONS
// ═══════════════════════════════════════════════════════

export interface Election {
  id: string;
  type: 'local' | 'parliamentary' | 'presidential';
  year: number;
  month: number;
  isCampaigning: boolean;
  campaignTurnsLeft: number;
  playerVotes: number;
  opponentVotes: number;
  totalVoters: number;
  turnoutPercent: number;
  playerManifesto: string[];
  polls: { turn: number; playerPercent: number; opponentPercent: number }[];
  isOver: boolean;
  playerWon: boolean;
  historicalResults?: {
    year: number;
    playerParty: number;
    opposition: number;
  };
}

// ═══════════════════════════════════════════════════════
// PUBLIC SERVICES & CITIZENS (Simplified)
// ═══════════════════════════════════════════════════════

export interface PublicServices {
  schools: number; // 0-100 quality
  hospitals: number;
  roads: number;
  water: number;
  electricity: number;
  publicTransport: number;
  wasteCollection: number;
  internet: number;
  police: number;
  fireServices: number;
}

export interface CitizenSatisfaction {
  overall: number;
  economy: number;
  services: number;
  governance: number;
  security: number;
  infrastructure: number;
  freedom: number;
  future: number; // optimism about future
}

// ═══════════════════════════════════════════════════════
// FULL GAME STATE
// ═══════════════════════════════════════════════════════

export interface GameState {
  runId?: string;
  player: PlayerState;
  national: NationalStats;
  economic: EconomicStats;
  commodities: CommodityPrices;
  trade: TradeStats;
  infrastructure: InfrastructureStats;
  projects: InfrastructureProject[];
  energy: EnergySystem;
  water: WaterSystem;
  provinces: Province[];
  ministers: Minister[];
  factions: Faction[];
  parliament: ParliamentState;
  bills: Bill[];
  corruption: CorruptionIndex;
  corruptionCases: CorruptionCase[];
  events: GameEvent[];
  eventArchive: ArchivedEvent[];
  flags: string[];
  pendingConsequences: PendingConsequence[];
  rumors: string[];
  titleProgress: Record<string, number>;
  newsHistory: NewsArticle[];
  budget: Budget;
  elections: Election[];
  publicServices: PublicServices;
  citizenSatisfaction: CitizenSatisfaction;
  decisionHistory: DecisionRecord[];
  gameLog: string[];
  isGameOver: boolean;
  gameOverReason?: string;
  budgetZeroTurns?: Partial<Record<BudgetCategory, number>>;
  gameStarted: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface DecisionRecord {
  turn: number;
  month: number;
  year: number;
  category: string;
  decision: string;
  reasoning: string;
  effects: string[];
}

// ═══════════════════════════════════════════════════════
// HISTORICAL DATA (for charts)
// ═══════════════════════════════════════════════════════

export interface HistoricalDataPoint {
  turn: number;
  month: number;
  year: number;
  gdp: number;
  inflation: number;
  unemployment: number;
  popularity: number;
  satisfaction: number;
  exchangeRate: number;
  debtToGdp: number;
  loadSheddingHours: number;
  waterReliability: number;
  roadQuality: number;
  crime: number;
  corruption: number;
}
