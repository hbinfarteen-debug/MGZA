// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Game Simulation Engine
// ═══════════════════════════════════════════════════════

import type {
  GameState, GameEvent, NewsArticle, InfrastructureProject,
  HistoricalDataPoint, EventChoice, Province, BudgetCategory, PublicMood,
} from './types';
import {
  MONTH_NAMES, SEASON_FROM_MONTH, CAREER_LEVELS, CAREER_ORDER,
} from './constants';

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

function weightedRandom(items: { item: string; weight: number }[]): string {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * totalWeight;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
}

function uid(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ═══════════════════════════════════════════════════════
// EVENT TEMPLATES
// ═══════════════════════════════════════════════════════

export const EVENT_TEMPLATES: {
  id: string;
  title: string;
  description: string;
  category: any;
  severity: any;
  condition: (state: GameState) => boolean;
  weight?: number;
  requiredFlags?: string[];
  setFlags?: string[];
  foreshadow?: string;
  choices: { text: string; shortDesc: string; effects: { target: string; op: string; value: number; dur: number }[]; politicalRisk: number; popularityImpact: number; setFlags?: string[]; clearFlags?: string[]; nextEventId?: string; consequenceDelay?: number }[];
}[] = [
  {
    id: 'drought_major',
    title: 'Severe Drought Grips the Nation',
    description: 'Rainfall has been 40% below average for three consecutive months. Crops are failing, dam levels are dropping rapidly, and livestock deaths are increasing. Humanitarian agencies warn of impending food shortages.',
    category: 'natural_disaster',
    severity: 'crisis',
    condition: (s) => s.water.droughtRisk > 40 && (s.player.month >= 4 && s.player.month <= 10),
    choices: [
      { text: 'Declare national emergency, import grain', shortDesc: 'Expensive but saves lives', effects: [{ target: 'economic.governmentDebt', op: 'add', value: 0.5, dur: 0 }, { target: 'citizenSatisfaction.overall', op: 'add', value: 5, dur: 6 }, { target: 'economic.inflation', op: 'add', value: 3, dur: 3 }], politicalRisk: 5, popularityImpact: 8 },
      { text: 'Ration water, limit agricultural use', shortDesc: 'Manages shortage but unpopular', effects: [{ target: 'water.totalSupply', op: 'subtract', value: 100, dur: 6 }, { target: 'citizenSatisfaction.overall', op: 'subtract', value: 8, dur: 4 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 1, dur: 6 }], politicalRisk: -10, popularityImpact: -12 },
      { text: 'Invest in emergency borehole drilling', shortDesc: 'Long-term thinking, slow results', effects: [{ target: 'water.boreholeCount', op: 'add', value: 5000, dur: 0 }, { target: 'budget.energy', op: 'subtract', value: 80, dur: 0 }, { target: 'water.ruralAccess', op: 'add', value: 3, dur: 12 }], politicalRisk: -3, popularityImpact: -5 },
    ],
  },
  {
    id: 'fuel_shortage',
    title: 'Fuel Queues Return to Cities',
    description: 'Foreign currency shortages have prevented fuel imports. Long queues have formed at filling stations across major cities. Transport costs are rising and businesses report disruptions.',
    category: 'economic',
    severity: 'major',
    condition: (s) => s.economic.foreignReserves < 0.5 && s.economic.exchangeRate > 30,
    choices: [
      { text: 'Use foreign reserves to import fuel', shortDesc: 'Quick fix but drains reserves', effects: [{ target: 'economic.foreignReserves', op: 'subtract', value: 0.1, dur: 0 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 5, dur: 3 }, { target: 'economic.inflation', op: 'add', value: 2, dur: 2 }], politicalRisk: 0, popularityImpact: 5 },
      { text: 'Allow fuel price increases', shortDesc: 'Market solution, unpopular', effects: [{ target: 'economic.inflation', op: 'add', value: 5, dur: 3 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 10, dur: 4 }, { target: 'economic.investorConfidence', op: 'add', value: 5, dur: 6 }], politicalRisk: -8, popularityImpact: -15 },
      { text: 'Negotiate fuel credit with neighbors', shortDesc: 'Diplomatic, may come with conditions', effects: [{ target: 'trade.imports', op: 'add', value: 0.1, dur: 3 }, { target: 'economic.debtToGdp', op: 'add', value: 2, dur: 0 }, { target: 'citizenSatisfaction.overall', op: 'add', value: 2, dur: 3 }], politicalRisk: -3, popularityImpact: 3 },
    ],
  },
  {
    id: 'strike_teachers',
    title: 'Teachers Threaten Nationwide Strike',
    description: 'The teachers union has issued a 14-day ultimatum demanding a 40% salary increase. Schools across the country may close if negotiations fail. Parents and student organizations express concern.',
    category: 'education',
    severity: 'major',
    condition: (s) => s.citizenSatisfaction.economy < 40 && s.budget.items.find(b => b.category === 'education')!.allocated < 500,
    choices: [
      { text: 'Grant partial salary increase (20%)', shortDesc: 'Compromise, costly but avoids crisis', effects: [{ target: 'budget.education', op: 'subtract', value: 150, dur: 0 }, { target: 'publicServices.schools', op: 'add', value: 5, dur: 6 }, { target: 'citizenSatisfaction.services', op: 'add', value: 4, dur: 4 }], politicalRisk: -3, popularityImpact: 5 },
      { text: 'Reject demands, hold firm on budget', shortDesc: 'Fiscally responsible but unpopular', effects: [{ target: 'publicServices.schools', op: 'subtract', value: 10, dur: 4 }, { target: 'citizenSatisfaction.services', op: 'subtract', value: 12, dur: 6 }, { target: 'citizenSatisfaction.future', op: 'subtract', value: 8, dur: 8 }], politicalRisk: -15, popularityImpact: -18 },
      { text: 'Negotiate non-salary benefits', shortDesc: 'Creative compromise', effects: [{ target: 'budget.education', op: 'subtract', value: 60, dur: 0 }, { target: 'publicServices.schools', op: 'add', value: 2, dur: 4 }, { target: 'citizenSatisfaction.services', op: 'add', value: 3, dur: 6 }], politicalRisk: -2, popularityImpact: 2 },
    ],
  },
  {
    id: 'mining_accident',
    title: 'Mining Accident Traps Workers Underground',
    description: 'A collapse at a major platinum mine has trapped 23 workers. Rescue operations are underway but face significant challenges. Families are gathering at the site and the nation watches anxiously.',
    category: 'mining',
    severity: 'crisis',
    condition: () => Math.random() < 0.15,
    choices: [
      { text: 'Mobilize military for rescue operation', shortDesc: 'Shows decisive leadership', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 3 }, { target: 'budget.military', op: 'subtract', value: 30, dur: 0 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.5, dur: 3 }], politicalRisk: 0, popularityImpact: 12 },
      { text: 'Let mining company handle it', shortDesc: 'Private responsibility', effects: [{ target: 'citizenSatisfaction.governance', op: 'subtract', value: 10, dur: 6 }, { target: 'corruption.publicPerception', op: 'add', value: 5, dur: 4 }, { target: 'citizenSatisfaction.overall', op: 'subtract', value: 5, dur: 3 }], politicalRisk: -10, popularityImpact: -8 },
      { text: 'Order immediate safety audit of all mines', shortDesc: 'Prevents future, angers industry', effects: [{ target: 'economic.gdpGrowth', op: 'subtract', value: 0.3, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 5, dur: 6 }, { target: 'budget.mining', op: 'subtract', value: 40, dur: 0 }], politicalRisk: -5, popularityImpact: 5 },
    ],
  },
  {
    id: 'protests_inflation',
    title: 'Mass Protests Over Rising Prices',
    description: 'Thousands have taken to the streets in Harare and Bulawayo protesting skyrocketing prices of basic goods. Opposition groups are mobilizing. Security forces are on standby.',
    category: 'social',
    severity: 'crisis',
    condition: (s) => s.economic.inflation > 30,
    choices: [
      { text: 'Address the nation, announce relief measures', shortDesc: 'Shows empathy, buys time', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 5, dur: 3 }, { target: 'budget.social_welfare', op: 'subtract', value: 100, dur: 0 }, { target: 'economic.inflation', op: 'add', value: 1, dur: 2 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Deploy police to maintain order', shortDesc: 'Restores order, risks international criticism', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 15, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 5, dur: 4 }, { target: 'citizenSatisfaction.overall', op: 'subtract', value: 3, dur: 3 }], politicalRisk: -12, popularityImpact: -8 },
      { text: 'Meet protest leaders, negotiate demands', shortDesc: 'Risky but democratic', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 4 }, { target: 'citizenSatisfaction.freedom', op: 'add', value: 5, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 3, dur: 4 }], politicalRisk: 5, popularityImpact: 10 },
    ],
  },
  {
    id: 'cyclone_warning',
    title: 'Tropical Cyclone Approaching Eastern Coast',
    description: 'Meteorological services warn of a powerful tropical cyclone heading toward Manicaland. Wind speeds may exceed 150 km/h. Evacuations may be needed in low-lying areas.',
    category: 'natural_disaster',
    severity: 'crisis',
    condition: (s) => (s.player.month >= 1 && s.player.month <= 4) || (s.player.month >= 11 && s.player.month <= 12),
    choices: [
      { text: 'Order immediate mass evacuation', shortDesc: 'Saves lives, expensive and disruptive', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 10, dur: 3 }, { target: 'budget.disaster_relief', op: 'subtract', value: 120, dur: 0 }, { target: 'economic.gdp', op: 'subtract', value: 0.5, dur: 2 }], politicalRisk: 0, popularityImpact: 8 },
      { text: 'Issue warnings, voluntary evacuation', shortDesc: 'Balanced approach', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 2 }, { target: 'budget.disaster_relief', op: 'subtract', value: 60, dur: 0 }, { target: 'national.deathRate', op: 'add', value: 2, dur: 1 }], politicalRisk: -3, popularityImpact: -2 },
      { text: 'Downgrade threat, monitor situation', shortDesc: 'Risky gamble', effects: [{ target: 'citizenSatisfaction.governance', op: 'subtract', value: 15, dur: 6 }, { target: 'national.deathRate', op: 'add', value: 8, dur: 1 }, { target: 'economic.gdp', op: 'subtract', value: 0.3, dur: 2 }], politicalRisk: -8, popularityImpact: -15 },
    ],
  },
  {
    id: 'foreign_investment_offer',
    title: 'Major Foreign Investment Proposal',
    description: 'A consortium of international investors has proposed a ZiG 2 billion industrial development zone near Harare. The project promises 50,000 jobs but requires significant tax incentives and land allocation.',
    category: 'economic',
    severity: 'major',
    condition: (s) => s.economic.investorConfidence > 35,
    choices: [
      { text: 'Accept with full incentives', shortDesc: 'Maximum investment, maximum concessions', effects: [{ target: 'economic.gdp', op: 'add', value: 2, dur: 24 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 3, dur: 24 }, { target: 'economic.taxRevenue', op: 'subtract', value: 0.3, dur: 60 }], politicalRisk: -5, popularityImpact: 10 },
      { text: 'Negotiate better terms', shortDesc: 'Smaller deal, better terms', effects: [{ target: 'economic.gdp', op: 'add', value: 1, dur: 18 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 1.5, dur: 18 }, { target: 'economic.taxRevenue', op: 'add', value: 0.1, dur: 12 }], politicalRisk: 0, popularityImpact: 5 },
      { text: 'Reject — prioritize local industry', shortDesc: 'Popular but loses opportunity', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 4 }, { target: 'economic.investorConfidence', op: 'subtract', value: 10, dur: 12 }, { target: 'economic.gdp', op: 'subtract', value: 0.5, dur: 6 }], politicalRisk: 5, popularityImpact: 2 },
    ],
  },
  {
    id: 'power_station_breakdown',
    title: 'Major Power Station Breakdown',
    description: 'The largest coal-fired power station has experienced a catastrophic turbine failure. Generation capacity has dropped by 30%. Load shedding will worsen significantly.',
    category: 'energy',
    severity: 'major',
    condition: (s) => s.energy.maintenanceBacklog > 50,
    choices: [
      { text: 'Emergency repair — divert funds', shortDesc: 'Fast fix, expensive', effects: [{ target: 'energy.totalSupply', op: 'subtract', value: 200, dur: 3 }, { target: 'budget.energy', op: 'subtract', value: 150, dur: 0 }, { target: 'energy.loadSheddingHoursPerDay', op: 'add', value: 4, dur: 3 }], politicalRisk: 0, popularityImpact: -5 },
      { text: 'Import more electricity temporarily', shortDesc: 'Quick, requires foreign currency', effects: [{ target: 'economic.foreignReserves', op: 'subtract', value: 0.1, dur: 0 }, { target: 'economic.inflation', op: 'add', value: 2, dur: 2 }, { target: 'citizenSatisfaction.services', op: 'add', value: 2, dur: 3 }], politicalRisk: -2, popularityImpact: -3 },
      { text: 'Implement severe load shedding schedule', shortDesc: 'Saves money, angers citizens', effects: [{ target: 'energy.loadSheddingHoursPerDay', op: 'add', value: 6, dur: 4 }, { target: 'citizenSatisfaction.services', op: 'subtract', value: 12, dur: 4 }, { target: 'economic.gdp', op: 'subtract', value: 0.3, dur: 3 }], politicalRisk: -10, popularityImpact: -15 },
    ],
  },
  {
    id: 'corruption_scandal',
    title: 'Senior Official Implicated in Corruption Scandal',
    description: 'Leaked documents reveal that a senior government official has diverted ZiG 45 million from a road construction project. The media is demanding answers and opposition parties are calling for resignations.',
    category: 'political',
    severity: 'major',
    condition: (s) => s.corruption.nationalLevel > 55,
    choices: [
      { text: 'Order investigation and prosecution', shortDesc: 'Sends strong signal, may anger allies', effects: [{ target: 'corruption.nationalLevel', op: 'subtract', value: 5, dur: 12 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 5, dur: 6 }], politicalRisk: -8, popularityImpact: 12 },
      { text: 'Fire the official quietly', shortDesc: 'Quick response, no systemic change', effects: [{ target: 'corruption.nationalLevel', op: 'subtract', value: 2, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 3 }, { target: 'corruption.institutionsStrength', op: 'subtract', value: 3, dur: 6 }], politicalRisk: -3, popularityImpact: 5 },
      { text: 'Dismiss it as opposition propaganda', shortDesc: 'Risky, erodes trust', effects: [{ target: 'citizenSatisfaction.governance', op: 'subtract', value: 12, dur: 8 }, { target: 'corruption.publicPerception', op: 'add', value: 8, dur: 8 }, { target: 'player.legitimacy', op: 'subtract', value: 8, dur: 8 }], politicalRisk: -5, popularityImpact: -15 },
    ],
  },
  {
    id: 'diplomatic_crisis',
    title: 'Diplomatic Tension with Key Trade Partner',
    description: 'A diplomatic dispute with South Africa over trade regulations threatens to disrupt imports worth ZiG 4.5 billion. Supply chains are already being affected. Business leaders urge swift resolution.',
    category: 'international',
    severity: 'major',
    condition: () => Math.random() < 0.12,
    choices: [
      { text: 'Concede on trade regulations', shortDesc: 'Preserves trade, appears weak', effects: [{ target: 'trade.exports', op: 'add', value: 0.5, dur: 12 }, { target: 'trade.imports', op: 'add', value: 0.3, dur: 12 }, { target: 'politicalInfluence', op: 'subtract', value: 3, dur: 6 }], politicalRisk: -5, popularityImpact: -3 },
      { text: 'Stand firm, seek alternative partners', shortDesc: 'Strong stance, economic cost', effects: [{ target: 'trade.exports', op: 'subtract', value: 1, dur: 6 }, { target: 'trade.imports', op: 'subtract', value: 1.5, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 5, dur: 6 }], politicalRisk: 5, popularityImpact: 8 },
      { text: 'Enter negotiations', shortDesc: 'Diplomatic approach, uncertain outcome', effects: [{ target: 'trade.exports', op: 'subtract', value: 0.3, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 3 }, { target: 'trade.borderEfficiency', op: 'add', value: 5, dur: 6 }], politicalRisk: 0, popularityImpact: 3 },
    ],
  },
  {
    id: 'cholera_outbreak',
    title: 'Cholera Outbreak in Urban Areas',
    description: 'A cholera outbreak has been confirmed in Harare and Chitungwiza, with over 500 suspected cases. The outbreak is linked to contaminated water supplies. Health facilities are overwhelmed.',
    category: 'health',
    severity: 'crisis',
    condition: (s) => s.water.waterQuality < 50 && s.water.urbanAccess < 60,
    choices: [
      { text: 'Emergency health response + water treatment', shortDesc: 'Comprehensive, expensive', effects: [{ target: 'national.deathRate', op: 'add', value: 1, dur: 2 }, { target: 'budget.hospitals', op: 'subtract', value: 100, dur: 0 }, { target: 'water.waterQuality', op: 'add', value: 8, dur: 6 }], politicalRisk: -2, popularityImpact: 5 },
      { text: 'Deploy military to distribute clean water', shortDesc: 'Fast response', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 6, dur: 3 }, { target: 'budget.military', op: 'subtract', value: 40, dur: 0 }, { target: 'national.deathRate', op: 'add', value: 3, dur: 2 }], politicalRisk: 0, popularityImpact: 8 },
      { text: 'Request international aid', shortDesc: 'Free help, slow arrival', effects: [{ target: 'national.deathRate', op: 'add', value: 5, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 5, dur: 4 }, { target: 'economic.debtToGdp', op: 'add', value: 1, dur: 0 }], politicalRisk: -5, popularityImpact: -8 },
    ],
  },
  {
    id: 'tourism_boom',
    title: 'Tourism Surges to Record Levels',
    description: 'International visitor numbers have jumped 35% this quarter, driven by favorable exchange rates and successful marketing campaigns. Hotels are at capacity and tour operators report record bookings.',
    category: 'tourism',
    severity: 'minor',
    condition: (s) => s.economic.exchangeRate > 25 && s.infrastructure.airportCondition > 40,
    choices: [
      { text: 'Invest in tourism infrastructure', shortDesc: 'Capitalize on momentum', effects: [{ target: 'economic.gdp', op: 'add', value: 0.8, dur: 12 }, { target: 'budget.tourism', op: 'subtract', value: 80, dur: 0 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 1, dur: 6 }], politicalRisk: 0, popularityImpact: 8 },
      { text: 'Increase tourism taxes', shortDesc: 'Revenue boost, may slow growth', effects: [{ target: 'economic.taxRevenue', op: 'add', value: 0.2, dur: 12 }, { target: 'economic.gdp', op: 'add', value: 0.3, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 4 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Maintain current approach', shortDesc: 'Let the market work', effects: [{ target: 'economic.gdp', op: 'add', value: 0.5, dur: 8 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 0.5, dur: 4 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'brain_drain',
    title: 'Skilled Workers Emigrating in Record Numbers',
    description: 'Doctor, engineer, and teacher departures have doubled. An estimated 3,000 professionals left last month for neighboring countries. The health and education sectors are particularly hard hit.',
    category: 'social',
    severity: 'major',
    condition: (s) => s.economic.unemploymentRate > 25 && s.citizenSatisfaction.future < 30,
    choices: [
      { text: 'Retention bonuses for key professionals', shortDesc: 'Costly but targeted', effects: [{ target: 'budget.hospitals', op: 'subtract', value: 80, dur: 0 }, { target: 'national.deathRate', op: 'subtract', value: 0.5, dur: 12 }, { target: 'publicServices.hospitals', op: 'add', value: 3, dur: 8 }], politicalRisk: 0, popularityImpact: 5 },
      { text: 'Implement bonding requirements', shortDesc: 'Controversial, may deter new graduates', effects: [{ target: 'national.netMigration', op: 'add', value: 5000, dur: 0 }, { target: 'citizenSatisfaction.freedom', op: 'subtract', value: 5, dur: 6 }, { target: 'publicServices.schools', op: 'add', value: 2, dur: 6 }], politicalRisk: -8, popularityImpact: -5 },
      { text: 'Create diaspora incentive program', shortDesc: 'Long-term strategy', effects: [{ target: 'national.netMigration', op: 'subtract', value: 1000, dur: 12 }, { target: 'budget.administration', op: 'subtract', value: 30, dur: 0 }, { target: 'economic.investorConfidence', op: 'add', value: 3, dur: 12 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'currency_crisis',
    title: 'Currency Collapse: ZiG Plunges to Record Low',
    description: 'The ZiG has plunged to a record low against the dollar on parallel markets. Prices are repriced daily, savings are evaporating, and importers cannot secure hard currency.',
    category: 'economic',
    severity: 'crisis',
    condition: (s) => s.economic.exchangeRate > 40 || (s.economic.inflation > 60 && Math.random() < 0.2),
    choices: [
      { text: 'Raise interest rates sharply', shortDesc: 'Defends currency, punishes borrowers', effects: [{ target: 'economic.interestRate', op: 'add', value: 4, dur: 6 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 1, dur: 6 }], politicalRisk: -6, popularityImpact: -8 },
      { text: 'Drain reserves to prop up the ZiG', shortDesc: 'Burns reserves fast', effects: [{ target: 'economic.foreignReserves', op: 'subtract', value: 0.5, dur: 0 }, { target: 'economic.investorConfidence', op: 'add', value: 3, dur: 6 }], politicalRisk: -4, popularityImpact: -2 },
      { text: 'Let the market find its level', shortDesc: 'Painful but honest', effects: [{ target: 'economic.inflation', op: 'add', value: 8, dur: 4 }, { target: 'economic.informalEconomySize', op: 'add', value: 3, dur: 8 }], politicalRisk: -10, popularityImpact: -12 },
    ],
  },
  {
    id: 'bank_collapse',
    title: 'A Major Commercial Bank Is on the Brink',
    description: 'Rumors of insolvency have triggered a run on one of the country\u0027s largest banks. Depositors are queueing overnight and the sector is under strain.',
    category: 'economic',
    severity: 'crisis',
    condition: (s) => s.economic.inflation > 40 && Math.random() < 0.2,
    choices: [
      { text: 'Full government bailout', shortDesc: 'Costly but stabilizes the system', effects: [{ target: 'economic.governmentDebt', op: 'add', value: 1, dur: 0 }, { target: 'economic.consumerConfidence', op: 'add', value: 8, dur: 8 }, { target: 'economic.investorConfidence', op: 'add', value: 5, dur: 6 }], politicalRisk: -5, popularityImpact: 3 },
      { text: 'Let the bank fail', shortDesc: 'Depositors lose savings', effects: [{ target: 'citizenSatisfaction.economy', op: 'subtract', value: 12, dur: 8 }, { target: 'economic.informalEconomySize', op: 'add', value: 5, dur: 10 }, { target: 'economic.unemploymentRate', op: 'add', value: 1.5, dur: 8 }], politicalRisk: -12, popularityImpact: -15 },
      { text: 'Broker a private rescue', shortDesc: 'Behind the scenes deal', effects: [{ target: 'economic.governmentDebt', op: 'add', value: 0.3, dur: 0 }, { target: 'economic.investorConfidence', op: 'add', value: 3, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }], politicalRisk: 3, popularityImpact: 1 },
    ],
  },
  {
    id: 'border_crisis',
    title: 'Border Crisis: Thousands Mass at the Crossings',
    description: 'Frustrated citizens are massing at border posts attempting to leave. Smugglers are charging fortunes and tensions are rising with neighboring states over the influx.',
    category: 'security',
    severity: 'crisis',
    condition: (s) => s.economic.unemploymentRate > 30 && Math.random() < 0.15,
    choices: [
      { text: 'Deploy border patrols and stem the flow', shortDesc: 'Strict, but curbs departures', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 8, dur: 6 }, { target: 'trade.smugglingRate', op: 'subtract', value: 8, dur: 6 }, { target: 'national.netMigration', op: 'add', value: 2000, dur: 4 }], politicalRisk: -6, popularityImpact: -5 },
      { text: 'Open talks with neighbors on labor mobility', shortDesc: 'Diplomatic, uncertain result', effects: [{ target: 'trade.borderEfficiency', op: 'add', value: 10, dur: 8 }, { target: 'citizenSatisfaction.future', op: 'add', value: 4, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }], politicalRisk: 2, popularityImpact: 4 },
      { text: 'Acknowledge the exodus, promise reform', shortDesc: 'Words without money', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 3 }, { target: 'citizenSatisfaction.future', op: 'subtract', value: 3, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 2, dur: 4 }], politicalRisk: -2, popularityImpact: 2 },
    ],
  },
  {
    id: 'power_grid_collapse',
    title: 'National Grid Collapses',
    description: 'Years of deferred maintenance have caught up. Two major stations have tripped offline and the grid has blacked out across most provinces.',
    category: 'energy',
    severity: 'crisis',
    condition: (s) => s.energy.maintenanceBacklog > 70,
    choices: [
      { text: 'Emergency imports and rentals', shortDesc: 'Fast power, huge foreign currency cost', effects: [{ target: 'economic.foreignReserves', op: 'subtract', value: 0.4, dur: 0 }, { target: 'economic.inflation', op: 'add', value: 4, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 3 }], politicalRisk: -3, popularityImpact: -4 },
      { text: 'Rotating blackouts across provinces', shortDesc: 'Fair sharing of pain', effects: [{ target: 'citizenSatisfaction.infrastructure', op: 'subtract', value: 10, dur: 5 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 1.5, dur: 5 }, { target: 'economic.unemploymentRate', op: 'add', value: 1, dur: 5 }], politicalRisk: -8, popularityImpact: -10 },
      { text: 'Fast-track independent power producers', shortDesc: 'Long-term fix, short-term cost', effects: [{ target: 'economic.taxRevenue', op: 'subtract', value: 0.4, dur: 12 }, { target: 'energy.maintenanceBacklog', op: 'subtract', value: 10, dur: 8 }, { target: 'economic.investorConfidence', op: 'add', value: 6, dur: 10 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'epidemic_outbreak',
    title: 'Influenza Epidemic Overwhelms Hospitals',
    description: 'A fast-spreading influenza strain has overwhelmed hospitals. Corridors are lined with patients and medical supplies are running out.',
    category: 'health',
    severity: 'crisis',
    condition: (s) => s.publicServices.hospitals < 45,
    choices: [
      { text: 'Mass vaccination and public clinics', shortDesc: 'Expensive, saves lives', effects: [{ target: 'budget.hospitals', op: 'subtract', value: 120, dur: 0 }, { target: 'national.deathRate', op: 'subtract', value: 2, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 6, dur: 4 }], politicalRisk: -2, popularityImpact: 8 },
      { text: 'Mobilize military field hospitals', shortDesc: 'Swift but controversial', effects: [{ target: 'budget.military', op: 'subtract', value: 60, dur: 0 }, { target: 'national.deathRate', op: 'subtract', value: 1, dur: 3 }, { target: 'citizenSatisfaction.freedom', op: 'subtract', value: 4, dur: 5 }], politicalRisk: -6, popularityImpact: 4 },
      { text: 'Advise hygiene and wait it out', shortDesc: 'Zero cost, heavy toll', effects: [{ target: 'national.deathRate', op: 'add', value: 4, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 10, dur: 6 }], politicalRisk: -10, popularityImpact: -12 },
    ],
  },
  {
    id: 'food_riot',
    title: 'Food Riots Erupt in High-Density Suburbs',
    description: 'Shoppers clashed with police over empty shelves and unaffordable mealie meal. Riots have spread across the high-density suburbs.',
    category: 'social',
    severity: 'crisis',
    condition: (s) => s.economic.inflation > 45 && s.citizenSatisfaction.economy < 30,
    choices: [
      { text: 'Release strategic grain reserves', shortDesc: 'Calms prices, depletes stores', effects: [{ target: 'budget.agriculture', op: 'subtract', value: 100, dur: 0 }, { target: 'economic.inflation', op: 'subtract', value: 5, dur: 4 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 8, dur: 5 }], politicalRisk: -3, popularityImpact: 6 },
      { text: 'Impose curfew and reinforce police', shortDesc: 'Order first, freedom later', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 12, dur: 6 }, { target: 'citizenSatisfaction.security', op: 'add', value: 6, dur: 4 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.5, dur: 4 }], politicalRisk: -12, popularityImpact: -10 },
      { text: 'Address the nation and pledge relief', shortDesc: 'Buys a few days', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 3 }, { target: 'citizenSatisfaction.future', op: 'add', value: 3, dur: 3 }, { target: 'budget.social_welfare', op: 'subtract', value: 50, dur: 0 }], politicalRisk: -2, popularityImpact: 3 },
    ],
  },
  {
    id: 'wildfire_crisis',
    title: 'Wildfires Ravage the Eastern Highlands',
    description: 'Out-of-control wildfires are destroying farmland and timber plantations in Manicaland. Smoke has closed roads and the air is unbreathable.',
    category: 'natural_disaster',
    severity: 'crisis',
    condition: (s) => s.water.droughtRisk > 50 && s.player.month >= 8 && s.player.month <= 11,
    choices: [
      { text: 'Deploy army and air support', shortDesc: 'Decisive, expensive', effects: [{ target: 'budget.military', op: 'subtract', value: 80, dur: 0 }, { target: 'national.deathRate', op: 'subtract', value: 2, dur: 2 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 6, dur: 4 }], politicalRisk: 0, popularityImpact: 7 },
      { text: 'Fund volunteer fire brigades', shortDesc: 'Cheaper, slower', effects: [{ target: 'budget.administration', op: 'subtract', value: 40, dur: 0 }, { target: 'economic.taxRevenue', op: 'subtract', value: 0.2, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 2, dur: 3 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Let nature take its course', shortDesc: 'Reckless gamble', effects: [{ target: 'national.deathRate', op: 'add', value: 3, dur: 2 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 1, dur: 4 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 8, dur: 5 }], politicalRisk: -8, popularityImpact: -14 },
    ],
  },
  {
    id: 'capital_flight',
    title: 'Capital Flight: Investors Exit in Droves',
    description: 'International investors are liquidating holdings and transferring funds abroad. The stock exchange has tumbled and hard currency is leaving the country.',
    category: 'economic',
    severity: 'crisis',
    condition: (s) => s.economic.investorConfidence < 30,
    choices: [
      { text: 'Impose temporary capital controls', shortDesc: 'Stems the flow, scares investors', effects: [{ target: 'economic.informalEconomySize', op: 'add', value: 4, dur: 8 }, { target: 'economic.foreignReserves', op: 'add', value: 0.2, dur: 4 }, { target: 'economic.investorConfidence', op: 'subtract', value: 5, dur: 8 }], politicalRisk: -6, popularityImpact: -5 },
      { text: 'Guarantee investor protection', shortDesc: 'Confidence play', effects: [{ target: 'economic.investorConfidence', op: 'add', value: 10, dur: 8 }, { target: 'economic.taxRevenue', op: 'subtract', value: 0.3, dur: 12 }], politicalRisk: 2, popularityImpact: 1 },
      { text: 'Pursue currency reform', shortDesc: 'Painful reset', effects: [{ target: 'economic.inflation', op: 'add', value: 10, dur: 3 }, { target: 'economic.investorConfidence', op: 'add', value: 6, dur: 10 }], politicalRisk: -10, popularityImpact: -8 },
    ],
  },
  {
    id: 'general_strike',
    title: 'General Strike Paralyzes the Country',
    description: 'Trade unions have called a general strike over wages and governance. Factories are silent, markets are shut, and civil servants have downed tools.',
    category: 'social',
    severity: 'crisis',
    condition: (s) => s.corruption.publicPerception > 60 && s.citizenSatisfaction.governance < 30,
    choices: [
      { text: 'Meet union leadership and negotiate', shortDesc: 'Unlocks wages, burns budget', effects: [{ target: 'budget.administration', op: 'subtract', value: 90, dur: 0 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 5, dur: 4 }], politicalRisk: 3, popularityImpact: 7 },
      { text: 'Declare the strike illegal', shortDesc: 'Hard line, deep resentment', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 10, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 6, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }], politicalRisk: -8, popularityImpact: -12 },
      { text: 'Announce an anti-corruption purge', shortDesc: 'Redirects anger upward', effects: [{ target: 'corruption.nationalLevel', op: 'subtract', value: 6, dur: 8 }, { target: 'corruption.publicPerception', op: 'subtract', value: 10, dur: 8 }, { target: 'politicalInfluence', op: 'subtract', value: 5, dur: 6 }], politicalRisk: -4, popularityImpact: 6 },
    ],
  },
  {
    id: 'rail_collapse_crisis',
    title: 'Fatal Rail Derailment Near Gweru',
    description: 'An overloaded freight train has derailed near Gweru, blocking the main trade corridor. Scores are injured and the line will be closed for weeks.',
    category: 'infrastructure',
    severity: 'crisis',
    condition: (s) => s.infrastructure.railwayCondition < 45,
    choices: [
      { text: 'Emergency repairs around the clock', shortDesc: 'Costly, restores trade fast', effects: [{ target: 'budget.roads', op: 'subtract', value: 120, dur: 0 }, { target: 'infrastructure.railwayCondition', op: 'add', value: 8, dur: 6 }, { target: 'trade.exports', op: 'add', value: 0.3, dur: 6 }], politicalRisk: -2, popularityImpact: 4 },
      { text: 'Divert freight through Mozambique', shortDesc: 'Keeps trade moving', effects: [{ target: 'trade.borderEfficiency', op: 'add', value: 6, dur: 6 }, { target: 'economic.inflation', op: 'add', value: 2, dur: 3 }, { target: 'trade.smugglingRate', op: 'add', value: 3, dur: 4 }], politicalRisk: -3, popularityImpact: -2 },
      { text: 'Hold a public inquiry, repair slowly', shortDesc: 'Cheap, slow, unpopular', effects: [{ target: 'infrastructure.railwayCondition', op: 'subtract', value: 2, dur: 6 }, { target: 'citizenSatisfaction.infrastructure', op: 'subtract', value: 8, dur: 6 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 1, dur: 4 }], politicalRisk: -6, popularityImpact: -8 },
    ],
  },
  {
    id: 'hospital_strike',
    title: 'Nurses Announce Indefinite Strike',
    description: 'Nurses have walked out over unpaid allowances and unsafe staffing levels. Emergency wards are operating at a fraction of capacity.',
    category: 'health',
    severity: 'major',
    condition: (s) => s.publicServices.hospitals < 55 && Math.random() < 0.25,
    choices: [
      { text: 'Grant allowances and staff bonuses', shortDesc: 'Costly but keeps care running', effects: [{ target: 'budget.hospitals', op: 'subtract', value: 120, dur: 0 }, { target: 'publicServices.hospitals', op: 'add', value: 4, dur: 6 }, { target: 'national.deathRate', op: 'subtract', value: 1, dur: 3 }], politicalRisk: -3, popularityImpact: 5 },
      { text: 'Recruit foreign nurses temporarily', shortDesc: 'Fast relief, high cost', effects: [{ target: 'budget.administration', op: 'subtract', value: 80, dur: 0 }, { target: 'publicServices.hospitals', op: 'add', value: 3, dur: 5 }, { target: 'national.netMigration', op: 'add', value: 1500, dur: 4 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Hold the line on wages', shortDesc: 'Fiscally firm, deadly gamble', effects: [{ target: 'national.deathRate', op: 'add', value: 3, dur: 4 }, { target: 'publicServices.hospitals', op: 'subtract', value: 5, dur: 6 }, { target: 'citizenSatisfaction.services', op: 'subtract', value: 8, dur: 6 }], politicalRisk: -8, popularityImpact: -10 },
    ],
  },
  {
    id: 'land_reform_dispute',
    title: 'Land Reform Tensions Boil Over',
    description: 'Disputes over resettlement have escalated on commercial farms. New settlers and established growers are at odds, and international partners are watching nervously.',
    category: 'agriculture',
    severity: 'major',
    condition: () => Math.random() < 0.1,
    choices: [
      { text: 'Accelerate resettlement', shortDesc: 'Popular at home, risky abroad', effects: [{ target: 'politicalInfluence', op: 'add', value: 5, dur: 6 }, { target: 'economic.investorConfidence', op: 'subtract', value: 6, dur: 10 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.5, dur: 4 }], politicalRisk: -5, popularityImpact: 8 },
      { text: 'Protect existing commercial farms', shortDesc: 'Keeps investors, angers settlers', effects: [{ target: 'economic.investorConfidence', op: 'add', value: 6, dur: 10 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 6, dur: 6 }, { target: 'budget.agriculture', op: 'subtract', value: 60, dur: 0 }], politicalRisk: 2, popularityImpact: -6 },
      { text: 'Commission an independent review', shortDesc: 'Buy time, look busy', effects: [{ target: 'budget.administration', op: 'subtract', value: 40, dur: 0 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 4 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.2, dur: 3 }], politicalRisk: 0, popularityImpact: 1 },
    ],
  },
  {
    id: 'telecom_outage',
    title: 'Nationwide Telecom Outage',
    description: 'A failed network upgrade has knocked out mobile and internet services nationwide. Payments, banking apps, and business systems are down.',
    category: 'infrastructure',
    severity: 'major',
    condition: (s) => s.infrastructure.internetPenetration > 30 && Math.random() < 0.12,
    choices: [
      { text: 'Fast-track repairs with incentives', shortDesc: 'Quick fix, generous terms', effects: [{ target: 'budget.ict', op: 'subtract', value: 80, dur: 0 }, { target: 'infrastructure.internetPenetration', op: 'add', value: 5, dur: 6 }, { target: 'economic.investorConfidence', op: 'add', value: 4, dur: 6 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Regulate and penalize the operator', shortDesc: 'Popular, slows recovery', effects: [{ target: 'economic.investorConfidence', op: 'subtract', value: 4, dur: 6 }, { target: 'infrastructure.internetPenetration', op: 'subtract', value: 2, dur: 5 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 4 }], politicalRisk: -4, popularityImpact: 6 },
      { text: 'Accept the outage and wait', shortDesc: 'Cheapest, worst outcome', effects: [{ target: 'infrastructure.internetPenetration', op: 'subtract', value: 4, dur: 6 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.8, dur: 4 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 5, dur: 5 }], politicalRisk: -6, popularityImpact: -8 },
    ],
  },
  {
    id: 'tobacco_bonanza',
    title: 'Record Tobacco Auction Prices',
    description: 'Golden leaf is fetching record prices at the auction floors. Farmers are celebrating their best season in years.',
    category: 'agriculture',
    severity: 'minor',
    condition: (s) => s.commodities.tobacco > 6.5,
    choices: [
      { text: 'Reinvest in irrigation support', shortDesc: 'Spend today, grow tomorrow', effects: [{ target: 'budget.agriculture', op: 'subtract', value: 60, dur: 0 }, { target: 'economic.gdpGrowth', op: 'add', value: 0.3, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 4 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Levy a windfall export tax', shortDesc: 'Fills coffers, annoys farmers', effects: [{ target: 'economic.taxRevenue', op: 'add', value: 0.3, dur: 4 }, { target: 'economic.foreignReserves', op: 'add', value: 0.2, dur: 4 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 2, dur: 4 }], politicalRisk: -2, popularityImpact: -2 },
      { text: 'Celebrate and do nothing', shortDesc: 'Let the market run', effects: [{ target: 'economic.gdpGrowth', op: 'add', value: 0.2, dur: 4 }, { target: 'economic.inflation', op: 'subtract', value: 1, dur: 3 }], politicalRisk: 0, popularityImpact: 1 },
    ],
  },
  {
    id: 'sme_credit',
    title: 'Banks Unveil SME Credit Drive',
    description: 'Commercial banks have announced a lending program for small businesses, backed by a development finance partnership.',
    category: 'economic',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Provide government guarantees', shortDesc: 'Stimulus with risk', effects: [{ target: 'economic.unemploymentRate', op: 'subtract', value: 0.5, dur: 6 }, { target: 'economic.governmentDebt', op: 'add', value: 0.2, dur: 0 }, { target: 'citizenSatisfaction.future', op: 'add', value: 4, dur: 6 }], politicalRisk: -3, popularityImpact: 4 },
      { text: 'Regulate the terms closely', shortDesc: 'Safe, slow', effects: [{ target: 'economic.investorConfidence', op: 'add', value: 2, dur: 6 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 0.2, dur: 6 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Endorse it publicly', shortDesc: 'Free publicity', effects: [{ target: 'citizenSatisfaction.economy', op: 'add', value: 2, dur: 4 }, { target: 'citizenSatisfaction.future', op: 'add', value: 2, dur: 4 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'new_dam',
    title: 'New Dam Commissioned in Matabeleland',
    description: 'A long-delayed dam project has finally been commissioned, promising irrigation and water security for drought-prone districts.',
    category: 'water',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Connect irrigation schemes', shortDesc: 'Boost agriculture', effects: [{ target: 'budget.agriculture', op: 'subtract', value: 40, dur: 0 }, { target: 'water.ruralAccess', op: 'add', value: 3, dur: 8 }, { target: 'economic.gdpGrowth', op: 'add', value: 0.3, dur: 6 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Prioritize urban supply lines', shortDesc: 'Help the cities', effects: [{ target: 'water.urbanAccess', op: 'add', value: 3, dur: 8 }, { target: 'citizenSatisfaction.services', op: 'add', value: 3, dur: 5 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Balance both with modest funding', shortDesc: 'Everyone gets a little', effects: [{ target: 'water.urbanAccess', op: 'add', value: 1, dur: 6 }, { target: 'water.ruralAccess', op: 'add', value: 1, dur: 6 }, { target: 'citizenSatisfaction.services', op: 'add', value: 2, dur: 4 }], politicalRisk: 0, popularityImpact: 1 },
    ],
  },
  {
    id: 'solar_village',
    title: 'Community Solar Projects Exceed Targets',
    description: 'Community solar installations are generating more power than expected, cutting diesel use in rural business hubs.',
    category: 'energy',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Fund a national rollout', shortDesc: 'Expand the win', effects: [{ target: 'budget.energy', op: 'subtract', value: 70, dur: 0 }, { target: 'energy.maintenanceBacklog', op: 'subtract', value: 6, dur: 6 }, { target: 'citizenSatisfaction.infrastructure', op: 'add', value: 3, dur: 5 }], politicalRisk: 0, popularityImpact: 4 },
      { text: 'Offer tax incentives to developers', shortDesc: 'Cheaper, slower', effects: [{ target: 'economic.taxRevenue', op: 'subtract', value: 0.15, dur: 8 }, { target: 'energy.maintenanceBacklog', op: 'subtract', value: 3, dur: 6 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Publicize the success story', shortDesc: 'Zero cost, small boost', effects: [{ target: 'citizenSatisfaction.future', op: 'add', value: 3, dur: 4 }, { target: 'economic.investorConfidence', op: 'add', value: 2, dur: 4 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'youth_artisans',
    title: 'Youth Artisan Program Produces Results',
    description: 'Thousands of young people have completed vocational training through the artisan program, with many landing contracts in construction and manufacturing.',
    category: 'social',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Scale the program nationally', shortDesc: 'Invest in youth', effects: [{ target: 'budget.youth_development', op: 'subtract', value: 60, dur: 0 }, { target: 'economic.youthUnemployment', op: 'subtract', value: 2, dur: 6 }, { target: 'citizenSatisfaction.future', op: 'add', value: 4, dur: 6 }], politicalRisk: 0, popularityImpact: 5 },
      { text: 'Link graduates to export markets', shortDesc: 'Trade ties, modest cost', effects: [{ target: 'trade.exports', op: 'add', value: 0.2, dur: 6 }, { target: 'economic.taxRevenue', op: 'add', value: 0.1, dur: 6 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Praise the initiative publicly', shortDesc: 'Words only', effects: [{ target: 'citizenSatisfaction.future', op: 'add', value: 2, dur: 4 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 2, dur: 4 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'border_upgrade',
    title: 'Border Post Upgrade Cuts Crossing Times',
    description: 'A modernized border post has cut crossing times for trucks and travelers, easing a chronic trade bottleneck.',
    category: 'infrastructure',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Digitalize customs at all major posts', shortDesc: 'Efficiency investment', effects: [{ target: 'budget.ict', op: 'subtract', value: 50, dur: 0 }, { target: 'trade.borderEfficiency', op: 'add', value: 8, dur: 8 }, { target: 'economic.gdpGrowth', op: 'add', value: 0.3, dur: 6 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Hire additional customs officers', shortDesc: 'More hands, more payroll', effects: [{ target: 'budget.administration', op: 'subtract', value: 40, dur: 0 }, { target: 'trade.borderEfficiency', op: 'add', value: 5, dur: 6 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Maintain the single upgraded post', shortDesc: 'Wait and see', effects: [{ target: 'trade.borderEfficiency', op: 'add', value: 3, dur: 6 }], politicalRisk: 0, popularityImpact: 0 },
    ],
  },
  {
    id: 'wildlife_returns',
    title: 'Wildlife Conservation Drives Tourism Revenue',
    description: 'Successful conservation efforts have boosted wildlife populations, drawing more safari tourists and conservation grants.',
    category: 'tourism',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Reinvest in park infrastructure', shortDesc: 'Grow the sector', effects: [{ target: 'budget.tourism', op: 'subtract', value: 50, dur: 0 }, { target: 'economic.foreignReserves', op: 'add', value: 0.15, dur: 6 }, { target: 'trade.exports', op: 'add', value: 0.2, dur: 6 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Share revenue with local communities', shortDesc: 'Builds goodwill', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 6 }, { target: 'budget.tourism', op: 'subtract', value: 20, dur: 0 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Bank the gains quietly', shortDesc: 'Prudent but invisible', effects: [{ target: 'economic.foreignReserves', op: 'add', value: 0.2, dur: 4 }], politicalRisk: 0, popularityImpact: 0 },
    ],
  },
  {
    id: 'remittance_surge',
    title: 'Diaspora Remittances Hit New High',
    description: 'Money sent home by Zimbabweans abroad has surged, giving families a lifeline and easing the foreign currency squeeze.',
    category: 'economic',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Cut transfer costs via digital channels', shortDesc: 'More money in pockets', effects: [{ target: 'budget.ict', op: 'subtract', value: 40, dur: 0 }, { target: 'economic.foreignReserves', op: 'add', value: 0.2, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 5 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Issue diaspora bonds', shortDesc: 'Raise capital, add debt', effects: [{ target: 'economic.governmentDebt', op: 'add', value: 0.3, dur: 0 }, { target: 'economic.foreignReserves', op: 'add', value: 0.3, dur: 6 }], politicalRisk: 0, popularityImpact: 0 },
      { text: 'Let the market handle it', shortDesc: 'No interference', effects: [{ target: 'economic.informalEconomySize', op: 'add', value: 1, dur: 4 }], politicalRisk: 0, popularityImpact: 0 },
    ],
  },
  {
    id: 'reading_initiative',
    title: 'Mobile Libraries Reach Rural Schools',
    description: 'A mobile library program has brought books to rural schools, boosting reading habits among learners.',
    category: 'education',
    severity: 'minor',
    condition: () => Math.random() < 0.08,
    choices: [
      { text: 'Fund a national expansion', shortDesc: 'Read to lead', effects: [{ target: 'budget.education', op: 'subtract', value: 50, dur: 0 }, { target: 'national.literacyRate', op: 'add', value: 1, dur: 8 }, { target: 'publicServices.schools', op: 'add', value: 2, dur: 6 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Train teacher-librarians first', shortDesc: 'Quality over quantity', effects: [{ target: 'budget.education', op: 'subtract', value: 30, dur: 0 }, { target: 'publicServices.schools', op: 'add', value: 2, dur: 8 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Celebrate the pilot, hold steady', shortDesc: 'No expansion', effects: [      { target: 'citizenSatisfaction.future', op: 'add', value: 2, dur: 4 }], politicalRisk: 0, popularityImpact: 1 },
    ],
  },
  {
    id: 'zig_redenomination',
    title: 'ZiG Redenomination Rumors Spread',
    description: 'Markets are whispering that the ZiG will be redenominated again. Prices are being repriced in USD and USD cents, savers are nervous, and the parallel rate is swinging wildly.',
    category: 'economic',
    severity: 'crisis',
    weight: 2,
    foreshadow: 'Markets whisper of another currency overhaul.',
    condition: (s) => s.economic.exchangeRate > 35 && s.economic.inflation > 50,
    choices: [
      { text: 'Announce a full ZiG reissue', shortDesc: 'Clean slate, weeks of chaos', effects: [{ target: 'economic.inflation', op: 'subtract', value: 8, dur: 6 }, { target: 'economic.informalEconomySize', op: 'add', value: 4, dur: 8 }, { target: 'economic.investorConfidence', op: 'add', value: 4, dur: 8 }], politicalRisk: -8, popularityImpact: -4 },
      { text: 'Reissue with gold backing', shortDesc: 'Confidence play, drains reserves', effects: [{ target: 'economic.inflation', op: 'subtract', value: 12, dur: 8 }, { target: 'economic.foreignReserves', op: 'subtract', value: 0.4, dur: 0 }, { target: 'economic.investorConfidence', op: 'add', value: 8, dur: 10 }], politicalRisk: -10, popularityImpact: -6, setFlags: ['gold_backed_currency'] },
      { text: 'Reject reform, defend current notes', shortDesc: 'Firm hand, escalating pressure', effects: [{ target: 'economic.inflation', op: 'add', value: 6, dur: 4 }, { target: 'economic.blackMarketPremium', op: 'add', value: 10, dur: 8 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 8, dur: 6 }], politicalRisk: -5, popularityImpact: -10 },
    ],
  },
  {
    id: 'load_shedding_anger',
    title: 'Load Shedding Fury Boils Over',
    description: 'Load shedding has stretched past ten hours a day. Businesses are running on generators, and angry residents are blocking roads with burning tyres to demand an end to the blackouts.',
    category: 'energy',
    severity: 'major',
    weight: 1.5,
    foreshadow: 'ZESA warns of deeper load shedding.',
    condition: (s) => s.energy.loadSheddingHoursPerDay > 10,
    choices: [
      { text: 'Fast-track emergency power imports', shortDesc: 'Quick relief, foreign currency cost', effects: [{ target: 'economic.foreignReserves', op: 'subtract', value: 0.3, dur: 0 }, { target: 'energy.loadSheddingHoursPerDay', op: 'subtract', value: 4, dur: 4 }, { target: 'economic.inflation', op: 'add', value: 2, dur: 2 }], politicalRisk: -2, popularityImpact: 4 },
      { text: 'Publish a fair sharing schedule', shortDesc: 'Transparent, only slightly better', effects: [{ target: 'citizenSatisfaction.infrastructure', op: 'add', value: 4, dur: 4 }, { target: 'energy.loadSheddingHoursPerDay', op: 'subtract', value: 1, dur: 3 }, { target: 'budget.energy', op: 'subtract', value: 30, dur: 0 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Blame the previous administration', shortDesc: 'Popular at rallies, useless at home', effects: [{ target: 'citizenSatisfaction.governance', op: 'subtract', value: 5, dur: 4 }, { target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }, { target: 'energy.loadSheddingHoursPerDay', op: 'add', value: 2, dur: 3 }], politicalRisk: 3, popularityImpact: -6, nextEventId: 'power_grid_collapse', consequenceDelay: 3 },
    ],
  },
  {
    id: 'fuel_smuggling_ring',
    title: 'Fuel Smuggling Ring Busted at the Border',
    description: 'Security forces have uncovered a sophisticated fuel smuggling operation across the border. Truck drivers, customs officials, and several well-connected businessmen are implicated.',
    category: 'security',
    severity: 'major',
    weight: 1.5,
    condition: (s) => s.trade.smugglingRate > 40 && s.economic.blackMarketPremium > 25,
    choices: [
      { text: 'Launch a full anti-smuggling crackdown', shortDesc: 'Decisive, expensive, risky', effects: [{ target: 'trade.smugglingRate', op: 'subtract', value: 10, dur: 6 }, { target: 'budget.police', op: 'subtract', value: 60, dur: 0 }, { target: 'corruption.nationalLevel', op: 'add', value: 2, dur: 4 }], politicalRisk: -4, popularityImpact: 5 },
      { text: 'Amnesty for small-scale cross-border traders', shortDesc: 'Pragmatic, keeps the economy moving', effects: [{ target: 'trade.smugglingRate', op: 'subtract', value: 5, dur: 6 }, { target: 'trade.borderEfficiency', op: 'add', value: 6, dur: 6 }, { target: 'economic.informalEconomySize', op: 'add', value: 2, dur: 6 }], politicalRisk: 2, popularityImpact: 4 },
      { text: 'Look the other way', shortDesc: 'Patronage networks stay happy', effects: [{ target: 'trade.smugglingRate', op: 'add', value: 5, dur: 6 }, { target: 'economic.foreignReserves', op: 'subtract', value: 0.2, dur: 4 }, { target: 'corruption.nationalLevel', op: 'add', value: 4, dur: 6 }], politicalRisk: -6, popularityImpact: -8, nextEventId: 'fuel_shortage', consequenceDelay: 2 },
    ],
  },
  {
    id: 'land_audit_findings',
    title: 'Land Audit Reveals Dual Allocations',
    description: 'A long-awaited land audit has found thousands of farms with multiple owners, many allocated to officials who never set foot on them. The findings are explosive.',
    category: 'agriculture',
    severity: 'major',
    weight: 1.2,
    condition: (s) => Math.random() < 0.15,
    choices: [
      { text: 'Publish the audit and reallocate dual farms', shortDesc: 'Transparent, angers the powerful', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 6, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 5, dur: 6 }, { target: 'corruption.nationalLevel', op: 'subtract', value: 3, dur: 8 }], politicalRisk: -8, popularityImpact: 6, setFlags: ['land_audit_published'] },
      { text: 'Resolve disputes quietly behind closed doors', shortDesc: 'Peace now, whispers later', effects: [{ target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }, { target: 'corruption.publicPerception', op: 'add', value: 4, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 3, dur: 4 }], politicalRisk: -2, popularityImpact: -2, nextEventId: 'land_reform_dispute', consequenceDelay: 2 },
      { text: 'Suppress the audit', shortDesc: 'Easiest today, costliest tomorrow', effects: [{ target: 'corruption.nationalLevel', op: 'add', value: 5, dur: 8 }, { target: 'corruption.publicPerception', op: 'add', value: 8, dur: 8 }, { target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }], politicalRisk: -5, popularityImpact: -10 },
    ],
  },
  {
    id: 'informal_formalization_drive',
    title: 'Informal Economy: Formalize or Face the Music',
    description: 'The informal economy now dwarfs the formal one. Traders operate with no licenses, no taxes, and no safety nets. Officials argue it is time to formalize the sector.',
    category: 'economic',
    severity: 'major',
    weight: 1.5,
    condition: (s) => s.economic.informalEconomySize > 60,
    choices: [
      { text: 'Tax incentives for registered informal firms', shortDesc: 'Carrot approach, slower revenue', effects: [{ target: 'economic.informalEconomySize', op: 'subtract', value: 5, dur: 8 }, { target: 'economic.taxRevenue', op: 'subtract', value: 0.2, dur: 12 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 4, dur: 6 }], politicalRisk: 0, popularityImpact: 4, setFlags: ['informal_formalization'] },
      { text: 'Harsh penalties for unregistered traders', shortDesc: 'Stick approach, street backlash', effects: [{ target: 'economic.informalEconomySize', op: 'subtract', value: 3, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 6, dur: 6 }, { target: 'corruption.nationalLevel', op: 'add', value: 3, dur: 4 }], politicalRisk: -4, popularityImpact: -6, setFlags: ['informal_market_anger'] },
      { text: 'Leave the informal sector alone', shortDesc: 'Hands off, it keeps families fed', effects: [{ target: 'economic.informalEconomySize', op: 'add', value: 3, dur: 6 }, { target: 'economic.unemploymentRate', op: 'subtract', value: 1, dur: 4 }], politicalRisk: 0, popularityImpact: 3 },
    ],
  },
  {
    id: 'informal_market_protest',
    title: 'Street Traders Protest in Mbare and Makokoba',
    description: 'Thousands of street traders have downed their stalls in protest against the crackdown. High-density markets are shut and the mood is tense.',
    category: 'social',
    severity: 'moderate',
    weight: 1,
    requiredFlags: ['informal_market_anger'],
    condition: () => true,
    choices: [
      { text: 'Reverse the penalties and start a dialogue', shortDesc: 'De-escalate, accept the U-turn', effects: [{ target: 'citizenSatisfaction.economy', op: 'add', value: 5, dur: 4 }, { target: 'politicalInfluence', op: 'subtract', value: 2, dur: 4 }, { target: 'corruption.nationalLevel', op: 'subtract', value: 2, dur: 4 }], politicalRisk: -3, popularityImpact: 5, clearFlags: ['informal_market_anger'] },
      { text: 'Hold the line, add more enforcement', shortDesc: 'Order first, anger everywhere', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 6, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 4, dur: 5 }, { target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }], politicalRisk: -6, popularityImpact: -8 },
      { text: 'Rally formal businesses against the protests', shortDesc: 'Divide and rule', effects: [{ target: 'economic.investorConfidence', op: 'add', value: 4, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 2, dur: 4 }], politicalRisk: 2, popularityImpact: 1 },
    ],
  },
  {
    id: 'cross_border_trader_boom',
    title: 'Cross-Border Traders Swarm the Border Posts',
    description: 'Kukiya-kiya traders are shuttling goods between Beitbridge and Musina in record numbers. The border posts are jammed with buses, bales of clothes, and hawkers.',
    category: 'economic',
    severity: 'moderate',
    weight: 1,
    condition: (s) => s.trade.borderEfficiency < 50 && Math.random() < 0.2,
    choices: [
      { text: 'Streamline border processing for traders', shortDesc: 'Faster crossings, real revenue', effects: [{ target: 'trade.borderEfficiency', op: 'add', value: 10, dur: 8 }, { target: 'budget.administration', op: 'subtract', value: 40, dur: 0 }, { target: 'economic.foreignReserves', op: 'add', value: 0.15, dur: 6 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Levy a light cross-border toll', shortDesc: 'Fills coffers, pinches traders', effects: [{ target: 'economic.taxRevenue', op: 'add', value: 0.15, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 3, dur: 4 }], politicalRisk: -2, popularityImpact: -1 },
      { text: 'Ban goods above ZiG 2,000 per person', shortDesc: 'Protectionist, smuggling booms', effects: [{ target: 'trade.smugglingRate', op: 'add', value: 6, dur: 6 }, { target: 'economic.foreignReserves', op: 'subtract', value: 0.1, dur: 4 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 6, dur: 5 }], politicalRisk: -6, popularityImpact: -8 },
    ],
  },
  {
    id: 'youth_exodus',
    title: 'Youth Unemployment Hits a New Record',
    description: 'Over half of young Zimbabweans are jobless. Graduates queue for nonexistent posts, taxi ranks are full of hustlers, and the social media feeds are filled with #Exodus posts.',
    category: 'social',
    severity: 'major',
    weight: 1.5,
    foreshadow: 'Youth unemployment hits a new record.',
    condition: (s) => s.economic.youthUnemployment > 50,
    choices: [
      { text: 'Launch a national youth employment fund', shortDesc: 'Real money for real jobs', effects: [{ target: 'budget.youth_development', op: 'subtract', value: 150, dur: 0 }, { target: 'economic.youthUnemployment', op: 'subtract', value: 4, dur: 8 }, { target: 'citizenSatisfaction.future', op: 'add', value: 6, dur: 8 }], politicalRisk: -3, popularityImpact: 8 },
      { text: 'Partner with regional employers for skills visas', shortDesc: 'Jobs abroad, families split', effects: [{ target: 'national.netMigration', op: 'add', value: 3000, dur: 4 }, { target: 'economic.youthUnemployment', op: 'subtract', value: 2, dur: 6 }, { target: 'citizenSatisfaction.future', op: 'subtract', value: 3, dur: 6 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Blame the youth for lacking skills', shortDesc: 'Rallies love it, reality hates it', effects: [{ target: 'citizenSatisfaction.future', op: 'subtract', value: 8, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 5, dur: 5 }, { target: 'politicalInfluence', op: 'add', value: 2, dur: 3 }], politicalRisk: -4, popularityImpact: -10, setFlags: ['youth_anger'], nextEventId: 'genz_protests', consequenceDelay: 2 },
    ],
  },
  {
    id: 'genz_protests',
    title: 'Gen-Z Uprising Spreads Across the Cities',
    description: 'Young protesters are marching in Harare, Bulawayo, and Mutare, chanting for jobs, freedom, and an end to power cuts. The movement has its own TikTok hashtags and is growing daily.',
    category: 'social',
    severity: 'crisis',
    weight: 1,
    requiredFlags: ['youth_anger'],
    condition: () => true,
    choices: [
      { text: 'Meet the protesters and concede on jobs', shortDesc: 'Expensive, but the streets calm', effects: [{ target: 'budget.youth_development', op: 'subtract', value: 100, dur: 0 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 6 }, { target: 'citizenSatisfaction.future', op: 'add', value: 6, dur: 6 }], politicalRisk: -6, popularityImpact: 8, clearFlags: ['youth_anger'] },
      { text: 'Order a communications blackout', shortDesc: 'Silence today, storm tomorrow', effects: [{ target: 'citizenSatisfaction.freedom', op: 'subtract', value: 12, dur: 6 }, { target: 'corruption.publicPerception', op: 'add', value: 6, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }], politicalRisk: -10, popularityImpact: -14, nextEventId: 'capital_flight', consequenceDelay: 2 },
      { text: 'Announce an early election window', shortDesc: 'Shock move, resets the clock', effects: [{ target: 'politicalInfluence', op: 'subtract', value: 8, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 5, dur: 4 }, { target: 'citizenSatisfaction.future', op: 'add', value: 4, dur: 6 }], politicalRisk: -8, popularityImpact: 5 },
    ],
  },
  {
    id: 'gold_artisanal_rush',
    title: 'Artisanal Gold Rush Draws Thousands',
    description: 'High gold prices have pulled thousands into artisanal mining. New pits are opening weekly, often without permits, and gold is leaking across the border.',
    category: 'mining',
    severity: 'moderate',
    weight: 1.2,
    condition: (s) => s.commodities.gold > 1850 && Math.random() < 0.2,
    choices: [
      { text: 'Register and license artisanal miners', shortDesc: 'Formalize the rush', effects: [{ target: 'trade.smugglingRate', op: 'subtract', value: 6, dur: 8 }, { target: 'economic.foreignReserves', op: 'add', value: 0.2, dur: 6 }, { target: 'budget.mining', op: 'subtract', value: 40, dur: 0 }], politicalRisk: 0, popularityImpact: 4 },
      { text: 'Launch a military-led clampdown', shortDesc: 'Harsh, but the pits stay open', effects: [{ target: 'trade.smugglingRate', op: 'subtract', value: 4, dur: 6 }, { target: 'citizenSatisfaction.freedom', op: 'subtract', value: 6, dur: 6 }, { target: 'economic.gdpGrowth', op: 'subtract', value: 0.3, dur: 4 }], politicalRisk: -6, popularityImpact: -5 },
      { text: 'Leave the mines to the market', shortDesc: 'No state interference at all', effects: [{ target: 'economic.informalEconomySize', op: 'add', value: 4, dur: 6 }, { target: 'trade.smugglingRate', op: 'add', value: 4, dur: 6 }], politicalRisk: 0, popularityImpact: 1 },
    ],
  },
  {
    id: 'lithium_sovereign_deal',
    title: 'Lithium Consortium Seeks a Mega Contract',
    description: 'Foreign bidders are circling the lithium fields with a proposal to build three processing plants. The deal could double mining exports, but terms matter for who keeps the wealth.',
    category: 'mining',
    severity: 'major',
    weight: 1.2,
    foreshadow: 'Foreign bidders circle the lithium fields.',
    condition: (s) => s.economic.investorConfidence > 30 && Math.random() < 0.15,
    choices: [
      { text: 'State majority stake with private operation', shortDesc: 'National control, slow progress', effects: [{ target: 'economic.gdp', op: 'add', value: 1, dur: 18 }, { target: 'economic.investorConfidence', op: 'add', value: 5, dur: 10 }, { target: 'budget.mining', op: 'subtract', value: 80, dur: 0 }], politicalRisk: -3, popularityImpact: 7, setFlags: ['lithium_sovereign'] },
      { text: 'Full foreign ownership, best royalty terms', shortDesc: 'Fast money, prickly pride', effects: [{ target: 'economic.gdp', op: 'add', value: 1.5, dur: 18 }, { target: 'economic.taxRevenue', op: 'add', value: 0.2, dur: 12 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 4, dur: 5 }], politicalRisk: -2, popularityImpact: -2 },
      { text: 'Reject the deal outright', shortDesc: 'Resource nationalism, empty coffers', effects: [{ target: 'economic.investorConfidence', op: 'subtract', value: 8, dur: 10 }, { target: 'economic.gdp', op: 'subtract', value: 0.3, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }], politicalRisk: 4, popularityImpact: 3 },
    ],
  },
  {
    id: 'lithium_sovereign_scandal',
    title: 'Lithium Contract Leaks Spark Scandal',
    description: 'Leaked tender documents suggest inflated prices and cozy deals inside the state-owned lithium project. The opposition is calling for heads to roll.',
    category: 'political',
    severity: 'major',
    weight: 1,
    requiredFlags: ['lithium_sovereign'],
    condition: () => true,
    choices: [
      { text: 'Independent audit and renegotiation', shortDesc: 'Painful now, cleaner later', effects: [{ target: 'corruption.nationalLevel', op: 'subtract', value: 4, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 6, dur: 6 }, { target: 'economic.investorConfidence', op: 'subtract', value: 3, dur: 8 }], politicalRisk: -6, popularityImpact: 5, clearFlags: ['lithium_sovereign'] },
      { text: 'Sack the officials involved', shortDesc: 'Sacrifice the scouts, save the fort', effects: [{ target: 'corruption.nationalLevel', op: 'subtract', value: 2, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 4, dur: 4 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 5 }], politicalRisk: -4, popularityImpact: 4 },
      { text: 'Dismiss the leaks as foreign propaganda', shortDesc: 'Bunker mentality', effects: [{ target: 'corruption.publicPerception', op: 'add', value: 6, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 8, dur: 6 }, { target: 'player.legitimacy', op: 'subtract', value: 6, dur: 6 }], politicalRisk: -5, popularityImpact: -10 },
    ],
  },
  {
    id: 'diaspora_bond_drive',
    title: 'Diaspora Savings Surge Revives Bond Ideas',
    description: 'Money is pouring in from Zimbabweans abroad. Treasury advisers suggest issuing diaspora bonds to soak up the inflows and fund development.',
    category: 'economic',
    severity: 'moderate',
    weight: 1,
    condition: (s) => Math.random() < 0.15,
    choices: [
      { text: 'Launch retail diaspora bonds', shortDesc: 'Raise capital, add debt', effects: [{ target: 'economic.governmentDebt', op: 'add', value: 0.4, dur: 0 }, { target: 'economic.foreignReserves', op: 'add', value: 0.3, dur: 6 }, { target: 'economic.investorConfidence', op: 'add', value: 3, dur: 6 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Channel remittances into infrastructure', shortDesc: 'Build roads with homecoming money', effects: [{ target: 'economic.foreignReserves', op: 'add', value: 0.15, dur: 6 }, { target: 'infrastructure.roadQuality', op: 'add', value: 3, dur: 8 }, { target: 'budget.roads', op: 'subtract', value: 50, dur: 0 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Declare amnesty on remittance fees', shortDesc: 'More money in pockets', effects: [{ target: 'economic.foreignReserves', op: 'add', value: 0.1, dur: 4 }, { target: 'economic.informalEconomySize', op: 'subtract', value: 2, dur: 6 }], politicalRisk: 0, popularityImpact: 2 },
    ],
  },
  {
    id: 'cash_shortage_queues',
    title: 'Cash Shortage: Bank Queues Circle the Blocks',
    description: 'ATMs are dry and bank queues snake around the blocks. The parallel market premium is climbing and businesses are refusing to accept card payments without a surcharge.',
    category: 'economic',
    severity: 'major',
    weight: 1.3,
    foreshadow: 'Bank queues grow longer by the day.',
    condition: (s) => s.economic.blackMarketPremium > 25 && Math.random() < 0.3,
    choices: [
      { text: 'Print limited new notes', shortDesc: 'Relief today, inflation tomorrow', effects: [{ target: 'economic.inflation', op: 'add', value: 4, dur: 4 }, { target: 'economic.blackMarketPremium', op: 'subtract', value: 8, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 4 }], politicalRisk: -4, popularityImpact: 3 },
      { text: 'Strengthen electronic payments', shortDesc: 'Modern fix, needs patience', effects: [{ target: 'budget.ict', op: 'subtract', value: 60, dur: 0 }, { target: 'economic.informalEconomySize', op: 'subtract', value: 3, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 6 }], politicalRisk: 0, popularityImpact: 3, setFlags: ['digital_payments'] },
      { text: 'Do nothing, blame parallel traders', shortDesc: 'Deflection without solutions', effects: [{ target: 'economic.blackMarketPremium', op: 'add', value: 6, dur: 6 }, { target: 'citizenSatisfaction.economy', op: 'subtract', value: 6, dur: 5 }, { target: 'corruption.publicPerception', op: 'add', value: 4, dur: 5 }], politicalRisk: -5, popularityImpact: -8, nextEventId: 'currency_crisis', consequenceDelay: 2 },
    ],
  },
  {
    id: 'tobacco_payments_dispute',
    title: 'Tobacco Farmers Fume Over Delayed Payouts',
    description: 'Auction floor payments are running weeks behind schedule. Farmers are blocking trucks and threatening to sell their golden leaf on the black market.',
    category: 'agriculture',
    severity: 'moderate',
    weight: 1,
    condition: (s) => s.commodities.tobacco > 6 && Math.random() < 0.2,
    choices: [
      { text: 'Fast-track auction payments', shortDesc: 'Costly today, loyal farmers tomorrow', effects: [{ target: 'budget.agriculture', op: 'subtract', value: 60, dur: 0 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 4, dur: 4 }, { target: 'economic.foreignReserves', op: 'subtract', value: 0.1, dur: 3 }], politicalRisk: 0, popularityImpact: 4 },
      { text: 'Pay in structured installments', shortDesc: 'Budget friendly, farmer unfriendly', effects: [{ target: 'citizenSatisfaction.economy', op: 'subtract', value: 3, dur: 4 }, { target: 'economic.taxRevenue', op: 'add', value: 0.1, dur: 4 }], politicalRisk: -2, popularityImpact: -1 },
      { text: 'Blame the auction floor operators', shortDesc: 'Pass the buck', effects: [{ target: 'trade.smugglingRate', op: 'add', value: 4, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 4, dur: 4 }], politicalRisk: -3, popularityImpact: -4 },
    ],
  },
  {
    id: 'parliament_walkout',
    title: 'Opposition Stages a Mass Walkout',
    description: 'The opposition has walked out of Parliament over a controversial bill, leaving the ruling party benches to pass it alone. The gallery jeers and the cameras roll.',
    category: 'political',
    severity: 'moderate',
    weight: 1,
    condition: (s) => s.parliament.mpSatisfaction < 40,
    choices: [
      { text: 'Negotiate with opposition leadership', shortDesc: 'Bipartisan, slower, healthier', effects: [{ target: 'parliament.mpSatisfaction', op: 'add', value: 10, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 3, dur: 4 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 4, dur: 4 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Ram the bill through with ruling party MPs', shortDesc: 'Wins today, poisons tomorrow', effects: [{ target: 'politicalInfluence', op: 'add', value: 4, dur: 4 }, { target: 'parliament.publicSupportForGovernment', op: 'subtract', value: 6, dur: 6 }], politicalRisk: -6, popularityImpact: -5 },
      { text: 'Appeal to the nation over Parliament', shortDesc: 'Presidential populism', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 4 }, { target: 'parliament.mpSatisfaction', op: 'subtract', value: 8, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 2, dur: 3 }], politicalRisk: 2, popularityImpact: 3 },
    ],
  },
  {
    id: 'finance_minister_scandal',
    title: 'Finance Minister Implicated in Tender Fraud',
    description: 'Documents implicate the Finance Minister in a padded tender scandal. The minister calls it a vendetta, but the auditors are circling and the currency markets are twitchy.',
    category: 'political',
    severity: 'major',
    weight: 1.3,
    foreshadow: 'Whispers of impropriety at the Finance Ministry.',
    condition: (s) => (s.ministers.find(m => m.portfolio === 'Finance' && m.isActive)?.corruption ?? 0) > 50 || (s.corruption.nationalLevel > 65 && Math.random() < 0.2),
    choices: [
      { text: 'Suspend and investigate the Finance Minister', shortDesc: 'Firm, costly, destabilizing', effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 8, dur: 6 }, { target: 'politicalInfluence', op: 'subtract', value: 5, dur: 6 }, { target: 'corruption.nationalLevel', op: 'subtract', value: 3, dur: 8 }], politicalRisk: -6, popularityImpact: 10, clearFlags: ['finance_scandal_simmering'], nextEventId: 'currency_crisis', consequenceDelay: 0 },
      { text: 'Quietly reassign the minister', shortDesc: 'Smooth the scandal away', effects: [{ target: 'corruption.publicPerception', op: 'add', value: 4, dur: 6 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 2, dur: 4 }, { target: 'parliament.mpSatisfaction', op: 'subtract', value: 4, dur: 4 }], politicalRisk: -2, popularityImpact: 0 },
      { text: 'Protect the minister, attack the media', shortDesc: 'Fortress government', effects: [{ target: 'corruption.publicPerception', op: 'add', value: 8, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'subtract', value: 10, dur: 6 }, { target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }], politicalRisk: -4, popularityImpact: -12, nextEventId: 'currency_crisis', consequenceDelay: 2 },
    ],
  },
  {
    id: 'education_minister_failure',
    title: 'Education Ministry Flounders Amid Scandals',
    description: 'Exam results are delayed, textbooks are missing, and the Education Ministry cannot account for millions in printing contracts. Parents are furious.',
    category: 'education',
    severity: 'major',
    weight: 1.1,
    condition: (s) => (s.ministers.find(m => m.portfolio === 'Education' && m.isActive)?.competence ?? 100) < 45 || (s.publicServices.schools < 40 && Math.random() < 0.2),
    choices: [
      { text: 'Overhaul the ministry leadership', shortDesc: 'Reset the department, lose allies', effects: [{ target: 'politicalInfluence', op: 'subtract', value: 6, dur: 6 }, { target: 'publicServices.schools', op: 'add', value: 4, dur: 8 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 5, dur: 6 }], politicalRisk: -6, popularityImpact: 4 },
      { text: 'Intervene directly with new textbooks', shortDesc: 'Do the ministry job yourself', effects: [{ target: 'budget.education', op: 'subtract', value: 80, dur: 0 }, { target: 'publicServices.schools', op: 'add', value: 3, dur: 6 }, { target: 'citizenSatisfaction.services', op: 'add', value: 3, dur: 5 }], politicalRisk: -2, popularityImpact: 3 },
      { text: 'Defend the minister publicly', shortDesc: 'Loyalty over competence', effects: [{ target: 'politicalInfluence', op: 'add', value: 3, dur: 4 }, { target: 'citizenSatisfaction.services', op: 'subtract', value: 5, dur: 6 }, { target: 'publicServices.schools', op: 'subtract', value: 2, dur: 6 }], politicalRisk: -3, popularityImpact: -6 },
    ],
  },
  {
    id: 'bond_note_comeback',
    title: 'Bond Notes Stage a Surprise Comeback',
    description: 'Vendors have started giving change in mothballed bond coins. "An old classic returns to circulation," one street economist declares, to general applause.',
    category: 'economic',
    severity: 'minor',
    weight: 0.7,
    condition: () => Math.random() < 0.1,
    choices: [
      { text: 'Celebrate the coins as national heritage', shortDesc: 'Lean into the nostalgia', effects: [{ target: 'citizenSatisfaction.economy', op: 'add', value: 2, dur: 3 }, { target: 'citizenSatisfaction.future', op: 'add', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Ban bond coins quietly', shortDesc: 'Kill the comeback', effects: [{ target: 'citizenSatisfaction.economy', op: 'subtract', value: 2, dur: 3 }, { target: 'corruption.nationalLevel', op: 'add', value: 1, dur: 3 }], politicalRisk: 0, popularityImpact: -1 },
      { text: 'Mint a commemorative ZiG coin', shortDesc: 'Merchandise the moment', effects: [{ target: 'budget.administration', op: 'subtract', value: 20, dur: 0 }, { target: 'citizenSatisfaction.future', op: 'add', value: 3, dur: 4 }], politicalRisk: 0, popularityImpact: 3 },
    ],
  },
  {
    id: 'queue_social_club',
    title: 'The Great Queue Becomes a Social Club',
    description: 'Fuel, bank, and bread queues have merged into one mega-line where strangers trade recipes, gossip, and hot tips. Attendance is apparently voluntary, and oddly cheerful.',
    category: 'social',
    severity: 'minor',
    weight: 0.7,
    condition: () => Math.random() < 0.1,
    choices: [
      { text: 'Open Queue Amenity Stations with shade and water', shortDesc: 'Civilize the queue', effects: [{ target: 'budget.administration', op: 'subtract', value: 25, dur: 0 }, { target: 'citizenSatisfaction.economy', op: 'add', value: 3, dur: 3 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Declare National Queuing Day', shortDesc: 'Embrace the absurd', effects: [{ target: 'citizenSatisfaction.future', op: 'add', value: 2, dur: 3 }, { target: 'politicalInfluence', op: 'add', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: 4 },
      { text: 'Order an end to all queues', shortDesc: 'Easier said than done', effects: [{ target: 'citizenSatisfaction.economy', op: 'subtract', value: 4, dur: 3 }, { target: 'politicalInfluence', op: 'subtract', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: -3 },
    ],
  },
  {
    id: 'njanja_market_deal',
    title: 'Mbare Njanja Market Becomes a National Brand',
    description: 'Mbare\'s Njanja market has become a one-stop bazaar where everything from gumboots to grandmothers\' remedies is negotiable. Tourists now ask for directions to "Mbare Mall".',
    category: 'social',
    severity: 'minor',
    weight: 0.7,
    condition: () => Math.random() < 0.1,
    choices: [
      { text: 'Formalize Njanja as a national trading brand', shortDesc: 'Franchise the hustle', effects: [{ target: 'trade.borderEfficiency', op: 'add', value: 5, dur: 6 }, { target: 'economic.taxRevenue', op: 'add', value: 0.1, dur: 6 }], politicalRisk: 0, popularityImpact: 3 },
      { text: 'Commission a documentary on the market', shortDesc: 'Soft power, hard cinema', effects: [{ target: 'budget.administration', op: 'subtract', value: 20, dur: 0 }, { target: 'citizenSatisfaction.future', op: 'add', value: 3, dur: 4 }], politicalRisk: 0, popularityImpact: 2 },
      { text: 'Issue a stern statement about pavement trading', shortDesc: 'Growl from the podium', effects: [{ target: 'citizenSatisfaction.economy', op: 'subtract', value: 3, dur: 3 }, { target: 'citizenSatisfaction.freedom', op: 'subtract', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: -2 },
    ],
  },
  {
    id: 'cabinet_leak_mystery',
    title: 'The Cabinet Leak Mystery Deepens',
    description: 'Every cabinet decision is now leaking to the press within hours. The source remains unidentified, which, as the Vice President notes, is itself a cabinet decision.',
    category: 'political',
    severity: 'minor',
    weight: 0.7,
    condition: () => Math.random() < 0.12,
    choices: [
      { text: 'Order a leak inquiry', shortDesc: 'The leak inquiry leaks', effects: [{ target: 'politicalInfluence', op: 'add', value: 3, dur: 3 }, { target: 'citizenSatisfaction.governance', op: 'add', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Leak a fake decision to trap the mole', shortDesc: 'Counterintelligence theatre', effects: [{ target: 'citizenSatisfaction.governance', op: 'subtract', value: 2, dur: 3 }, { target: 'politicalInfluence', op: 'add', value: 4, dur: 3 }], politicalRisk: 0, popularityImpact: 1 },
      { text: 'Announce everything preemptively', shortDesc: "Beat the leakers to it", effects: [{ target: 'citizenSatisfaction.governance', op: 'add', value: 3, dur: 4 }, { target: 'politicalInfluence', op: 'subtract', value: 2, dur: 3 }], politicalRisk: 0, popularityImpact: 3 },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// ZERO BUDGET CRISES
// ═══════════════════════════════════════════════════════

interface BudgetCrisis {
  threshold: number; // consecutive turns at zero before the crisis fires
  headline: string;
  logMessage: string;
  category: NewsArticle['category'];
  impact: number;
  repeat?: boolean; // if set, the counter keeps growing and the crisis re-fires every `threshold` turns
  gameOverAt?: number; // if the counter reaches this, the game ends
  gameOverReason?: string; // reason used when gameOverAt is reached
  apply: (state: GameState) => void;
}

const BUDGET_CRISES: Partial<Record<BudgetCategory, BudgetCrisis>> = {
  military: {
    threshold: 3,
    headline: 'MILITARY COUP: The armed forces seized power after the defense budget was cut to zero.',
    logMessage: 'MILITARY COUP: With the defense budget cut to zero, the armed forces seized power without warning.',
    category: 'security',
    impact: -20,
    gameOverAt: 3,
    gameOverReason: 'MILITARY COUP: With the defense budget cut to zero, the armed forces seized power without warning. Your presidency is over.',
    apply: () => {},
  },
  police: {
    threshold: 4,
    headline: 'CRIME WAVE: With no police funding, lawlessness spreads across the nation.',
    logMessage: 'CRISIS: A national crime wave has erupted with the police force defunded. Citizens are on their own.',
    category: 'security',
    impact: -8,
    repeat: true,
    gameOverAt: 10,
    gameOverReason: 'ANARCHY: With the police force defunded for too long, the state has collapsed into anarchy. Your presidency is over.',
    apply: (state) => {
      for (const p of state.provinces) {
        p.safetyIndex = clamp(p.safetyIndex - 6, 0, 100);
        for (const d of p.districts) d.crime = clamp(d.crime + 5, 0, 100);
      }
      state.citizenSatisfaction.security = clamp(state.citizenSatisfaction.security - 8, 5, 95);
      state.corruption.nationalLevel = clamp(state.corruption.nationalLevel + 3, 0, 100);
    },
  },
  hospitals: {
    threshold: 4,
    headline: 'PUBLIC HEALTH CRISIS: Hospitals run without essential funding as patients are turned away.',
    logMessage: 'CRISIS: Hospitals have collapsed without funding. Preventable deaths are climbing.',
    category: 'health',
    impact: -10,
    apply: (state) => {
      state.national.deathRate = clamp(state.national.deathRate + 1.5, 0, 50);
      state.national.lifeExpectancy = clamp(state.national.lifeExpectancy - 1, 40, 90);
      state.publicServices.hospitals = clamp(state.publicServices.hospitals - 5, 10, 95);
    },
  },
  water: {
    threshold: 4,
    headline: 'WATERBORNE DISEASE OUTBREAK: Cholera cases surge in communities without water services.',
    logMessage: 'CRISIS: A waterborne disease outbreak is spreading through communities with no sanitation funding.',
    category: 'water',
    impact: -10,
    apply: (state) => {
      state.water.waterQuality = clamp(state.water.waterQuality - 6, 0, 100);
      state.water.urbanAccess = clamp(state.water.urbanAccess - 3, 0, 100);
      state.water.ruralAccess = clamp(state.water.ruralAccess - 3, 0, 100);
      state.national.deathRate = clamp(state.national.deathRate + 1, 0, 50);
    },
  },
  energy: {
    threshold: 4,
    headline: 'NATIONAL BLACKOUT: Power generation grinds to a halt without utility funding.',
    logMessage: 'CRISIS: The national grid is failing. Power plants sit unmaintained and blackouts are spreading.',
    category: 'energy',
    impact: -8,
    apply: (state) => {
      state.energy.maintenanceBacklog = clamp(state.energy.maintenanceBacklog + 8, 0, 100);
      state.economic.gdpGrowth = clamp(state.economic.gdpGrowth - 1, -15, 20);
      state.citizenSatisfaction.infrastructure = clamp(state.citizenSatisfaction.infrastructure - 6, 5, 95);
    },
  },
  education: {
    threshold: 5,
    headline: 'NATIONAL TEACHERS STRIKE: Schools close indefinitely over unpaid salaries.',
    logMessage: 'CRISIS: Teachers have gone on strike nationwide. Schools are shut with no funding in sight.',
    category: 'education',
    impact: -8,
    apply: (state) => {
      state.national.literacyRate = clamp(state.national.literacyRate - 1, 30, 100);
      state.publicServices.schools = clamp(state.publicServices.schools - 5, 10, 95);
      state.economic.youthUnemployment = clamp(state.economic.youthUnemployment + 1, 5, 90);
    },
  },
  roads: {
    threshold: 5,
    headline: 'TRANSPORT COLLAPSE: Roads crumble and public transport halts without maintenance funds.',
    logMessage: 'CRISIS: The transport network has collapsed. Roads are impassable and buses have stopped running.',
    category: 'infrastructure',
    impact: -7,
    apply: (state) => {
      state.infrastructure.roadQuality = clamp(state.infrastructure.roadQuality - 4, 0, 100);
      state.publicServices.publicTransport = clamp(state.publicServices.publicTransport - 5, 10, 80);
      state.economic.gdpGrowth = clamp(state.economic.gdpGrowth - 0.5, -15, 20);
    },
  },
  agriculture: {
    threshold: 5,
    headline: 'FOOD SHORTAGE: Harvests fail as agricultural support programs are cut.',
    logMessage: 'CRISIS: A severe food shortage looms with farmers left without support or inputs.',
    category: 'agriculture',
    impact: -9,
    apply: (state) => {
      for (const p of state.provinces) p.agriculturalOutput = clamp(p.agriculturalOutput - 8, 0, 150);
      state.economic.inflation = clamp(state.economic.inflation + 4, 0, 500);
      state.national.deathRate = clamp(state.national.deathRate + 0.5, 0, 50);
    },
  },
  mining: {
    threshold: 5,
    headline: 'MINING SECTOR COLLAPSE: Operations shut down as industry funding disappears.',
    logMessage: 'CRISIS: The mining sector has collapsed without funding. Smuggling is filling the vacuum.',
    category: 'mining',
    impact: -9,
    apply: (state) => {
      for (const p of state.provinces) p.miningOutput = clamp(p.miningOutput - 8, 0, 150);
      state.economic.taxRevenue = clamp(state.economic.taxRevenue - 0.3, 0.5, 100);
      state.trade.smugglingRate = clamp(state.trade.smugglingRate + 3, 0, 100);
    },
  },
  housing: {
    threshold: 5,
    headline: 'HOUSING CRISIS: Backlog balloons as construction programs are suspended.',
    logMessage: 'CRISIS: The housing backlog has ballooned. Informal settlements are growing unchecked.',
    category: 'infrastructure',
    impact: -6,
    apply: (state) => {
      state.infrastructure.housingBacklog = clamp(state.infrastructure.housingBacklog + 80, 0, 5000);
      state.citizenSatisfaction.services = clamp(state.citizenSatisfaction.services - 4, 5, 95);
    },
  },
  social_welfare: {
    threshold: 5,
    headline: 'POVERTY SPIKE: Welfare payments stop, pushing vulnerable families to the brink.',
    logMessage: 'CRISIS: Welfare payments have stopped entirely. Poverty is spiking across the country.',
    category: 'social',
    impact: -8,
    apply: (state) => {
      state.national.lifeExpectancy = clamp(state.national.lifeExpectancy - 0.5, 40, 90);
      state.citizenSatisfaction.services = clamp(state.citizenSatisfaction.services - 5, 5, 95);
      for (const p of state.provinces) {
        for (const d of p.districts) d.crime = clamp(d.crime + 5, 0, 100);
      }
    },
  },
  youth_development: {
    threshold: 6,
    headline: 'YOUTH DISCONTENT: Jobless youth take to the streets in growing numbers.',
    logMessage: 'CRISIS: Youth programs are gone and youth unemployment is exploding. Protests are spreading.',
    category: 'social',
    impact: -7,
    apply: (state) => {
      state.economic.youthUnemployment = clamp(state.economic.youthUnemployment + 3, 5, 90);
      state.citizenSatisfaction.future = clamp(state.citizenSatisfaction.future - 6, 5, 95);
      for (const p of state.provinces) {
        for (const d of p.districts) d.crime = clamp(d.crime + 4, 0, 100);
      }
    },
  },
  ict: {
    threshold: 6,
    headline: 'DIGITAL BLACKOUT: Internet services degrade as the ICT budget runs dry.',
    logMessage: 'CRISIS: The digital backbone is failing. Internet access is degrading nationwide.',
    category: 'economic',
    impact: -6,
    apply: (state) => {
      state.infrastructure.internetPenetration = clamp(state.infrastructure.internetPenetration - 4, 0, 100);
      state.economic.investorConfidence = clamp(state.economic.investorConfidence - 4, 0, 100);
    },
  },
  tourism: {
    threshold: 6,
    headline: 'TOURISM COLLAPSE: Visitors stay away as destinations fall into disrepair.',
    logMessage: 'CRISIS: The tourism industry has collapsed. Reserves are draining with no visitor revenue.',
    category: 'tourism',
    impact: -7,
    apply: (state) => {
      state.economic.foreignReserves = clamp(state.economic.foreignReserves - 0.3, 0, 20);
      state.economic.investorConfidence = clamp(state.economic.investorConfidence - 3, 0, 100);
    },
  },
  disaster_relief: {
    threshold: 6,
    headline: 'RELIEF PARALYSIS: Disaster response is frozen with no emergency funding.',
    logMessage: 'CRISIS: Disaster relief capacity is paralyzed. Emergencies will go unaddressed.',
    category: 'natural_disaster',
    impact: -7,
    apply: (state) => {
      state.national.deathRate = clamp(state.national.deathRate + 1, 0, 50);
      state.citizenSatisfaction.governance = clamp(state.citizenSatisfaction.governance - 4, 5, 95);
    },
  },
  debt_repayment: {
    threshold: 6,
    headline: 'CREDITOR BACKLASH: Lenders raise rates as Zimbabwe stops servicing its debt.',
    logMessage: 'CRISIS: Creditors have lost confidence. Interest rates are climbing and reserves are falling.',
    category: 'economic',
    impact: -8,
    apply: (state) => {
      state.economic.interestRate = clamp(state.economic.interestRate + 1.5, 0, 60);
      state.economic.investorConfidence = clamp(state.economic.investorConfidence - 5, 0, 100);
      state.economic.foreignReserves = clamp(state.economic.foreignReserves - 0.4, 0, 20);
    },
  },
  administration: {
    threshold: 7,
    headline: 'GOVERNMENT PARALYSIS: Civil service grinds to a halt without administrative funding.',
    logMessage: 'CRISIS: The civil service has ground to a halt. Corruption is thriving in the paralysis.',
    category: 'political',
    impact: -6,
    apply: (state) => {
      state.corruption.nationalLevel = clamp(state.corruption.nationalLevel + 3, 0, 100);
      state.citizenSatisfaction.governance = clamp(state.citizenSatisfaction.governance - 5, 5, 95);
    },
  },
};

function simulateBudgetCrises(state: GameState): void {
  if (state.isGameOver) return;
  const counters = { ...(state.budgetZeroTurns || {}) };

  for (const item of state.budget.items) {
    const crisis = BUDGET_CRISES[item.category];
    if (!crisis) continue;

    const zeroTurns = counters[item.category] || 0;

    if (item.allocated <= 0) {
      counters[item.category] = zeroTurns + 1;
      const turns = counters[item.category];

      // Terminal escalation (e.g. anarchy after 10 turns without police)
      if (crisis.gameOverAt && turns >= crisis.gameOverAt && crisis.gameOverReason) {
        state.isGameOver = true;
        state.gameOverReason = crisis.gameOverReason;
        state.budgetZeroTurns = counters;
        return;
      }

      // Fire the crisis when the threshold is hit (or re-fires every threshold turns when repeating)
      if (turns >= crisis.threshold && (!crisis.repeat || turns % crisis.threshold === 0)) {
        if (!crisis.repeat) counters[item.category] = 0;
        crisis.apply(state);
        state.gameLog.push(crisis.logMessage);
        state.newsHistory = [{
          id: uid(), headline: crisis.headline,
          subheadline: `Emergency report for ${MONTH_NAMES[state.player.month - 1]} ${state.player.year}`,
          body: crisis.headline,
          category: crisis.category, turn: state.player.turn, month: state.player.month, year: state.player.year,
          sentiment: 'negative', impact: crisis.impact, isBreaking: true,
        }, ...state.newsHistory].slice(0, 100);
      }
    } else if (zeroTurns > 0) {
      counters[item.category] = 0;
    }
  }

  state.budgetZeroTurns = counters;
}

// ═══════════════════════════════════════════════════════
// NEWS GENERATION
// ═══════════════════════════════════════════════════════

function generateNews(state: GameState): NewsArticle[] {
  const news: NewsArticle[] = [];
  const month = MONTH_NAMES[state.player.month - 1];
  const year = state.player.year;

  // Economic news
  if (state.economic.inflation > 40) {
    news.push({
      id: uid(), headline: `Inflation Surges to ${state.economic.inflation.toFixed(1)}%`,
      subheadline: 'Prices of basic commodities continue to climb as purchasing power erodes',
      body: `The cost of living has become increasingly difficult for ordinary citizens. The central bank reports inflation at ${state.economic.inflation.toFixed(1)}%, driven by currency depreciation and supply chain disruptions.`,
      category: 'economic', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'negative', impact: -3, isBreaking: state.economic.inflation > 60,
    });
  }

  if (state.economic.gdpGrowth > 5) {
    news.push({
      id: uid(), headline: `Economy Grows ${state.economic.gdpGrowth.toFixed(1)}% — Fastest in Region`,
      subheadline: 'Strong GDP growth attributed to mining exports and agricultural recovery',
      body: `Economic growth has exceeded expectations, reaching ${state.economic.gdpGrowth.toFixed(1)}%. Analysts credit improved mining output and a favorable agricultural season.`,
      category: 'economic', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'positive', impact: 5, isBreaking: false,
    });
  }

  // Infrastructure news
  const completedProjects = state.projects.filter(p => p.status === 'completed' && p.completedTurn === state.player.turn);
  for (const proj of completedProjects) {
    news.push({
      id: uid(), headline: `${proj.name} Completed`,
      subheadline: `New ${proj.category} infrastructure now operational in ${proj.province}`,
      body: `The government has completed construction of ${proj.name} at a cost of ZiG ${proj.cost}M. The project is expected to create ${proj.employmentCreated} jobs and improve services for local residents.`,
      category: 'infrastructure', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'positive', impact: 3, isBreaking: false,
    });
  }

  // Energy news
  if (state.energy.loadSheddingHoursPerDay > 14) {
    news.push({
      id: uid(), headline: `Load Shedding Worsens — ${state.energy.loadSheddingHoursPerDay} Hours Daily`,
      subheadline: 'Stage ${state.energy.loadSheddingStage} load shedding announced as generation deficit widens',
      body: `The national power utility has escalated load shedding to Stage ${state.energy.loadSheddingStage}. Citizens now face up to ${state.energy.loadSheddingHoursPerDay} hours without power daily. Businesses report significant losses.`,
      category: 'energy', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'negative', impact: -5, isBreaking: true,
    });
  }

  if (state.energy.loadSheddingHoursPerDay < 4) {
    news.push({
      id: uid(), headline: 'Power Supply Improves — Load Shedding Reduced',
      subheadline: 'Increased generation and demand management show results',
      body: `Load shedding has been reduced to ${state.energy.loadSheddingHoursPerDay} hours per day, the lowest level in years. Improved hydroelectric output and new solar installations have helped bridge the gap.`,
      category: 'energy', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'positive', impact: 4, isBreaking: false,
    });
  }

  // Water news
  if (state.water.reservoirLevels < 30) {
    news.push({
      id: uid(), headline: 'Dam Levels Drop to Critical — Water Rationing Imminent',
      subheadline: `Reservoirs at ${state.water.reservoirLevels}% capacity as drought persists`,
      body: `National dam levels have fallen to ${state.water.reservoirLevels}% of capacity. Water authorities warn that rationing may be imposed in major cities if rains do not arrive soon.`,
      category: 'water', turn: state.player.turn, month: state.player.month, year,
      sentiment: 'negative', impact: -4, isBreaking: state.water.reservoirLevels < 20,
    });
  }

  // Random general news
  const generalNews = [
    { headline: `Unemployment Stands at ${state.economic.unemploymentRate.toFixed(1)}%`, sentiment: state.economic.unemploymentRate < 20 ? 'positive' : 'negative' as const, impact: state.economic.unemploymentRate < 20 ? 3 : -3 },
    { headline: 'Road Conditions Deteriorating in Rural Areas', sentiment: 'negative' as const, impact: -2, condition: () => state.infrastructure.roadQuality < 35 },
    { headline: 'Mining Sector Posts Strong Export Numbers', sentiment: 'positive' as const, impact: 3, condition: () => state.commodities.gold > 1800 },
    { headline: 'Agricultural Output Shows Promising Recovery', sentiment: 'positive' as const, impact: 2, condition: () => state.water.rainfallIndex > 50 },
    { headline: 'Crime Rates Rise in Urban Centers', sentiment: 'negative' as const, impact: -3, condition: () => state.citizenSatisfaction.security < 40 },
    { headline: 'Internet Access Expands to Rural Communities', sentiment: 'positive' as const, impact: 2, condition: () => state.infrastructure.internetPenetration > 45 },
    { headline: 'Foreign Reserves at Concerning Low', sentiment: 'negative' as const, impact: -3, condition: () => state.economic.foreignReserves < 0.3 },
    { headline: 'Informal Sector Continues to Grow', sentiment: 'neutral' as const, impact: 0, condition: () => state.economic.informalEconomySize > 55 },
  ];

  for (const item of generalNews) {
    if ('condition' in item && !(item as any).condition?.()) continue;
    if (Math.random() < 0.4) {
      news.push({
        id: uid(), headline: item.headline, subheadline: `Report for ${month} ${year}`,
        body: item.headline,
        category: 'economic', turn: state.player.turn, month: state.player.month, year,
        sentiment: item.sentiment, impact: item.impact, isBreaking: false,
      });
    }
  }

  return news;
}

// ═══════════════════════════════════════════════════════
// SIMULATION ENGINE
// ═══════════════════════════════════════════════════════

export function simulateTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const { player, economic, energy, water, infrastructure, national, citizenSatisfaction, publicServices, corruption, parliament, trade, commodities } = newState;
  const season = SEASON_FROM_MONTH[player.month];

  // ─── Advance Time ───
  player.turn += 1;
  player.month += 1;
  if (player.month > 12) {
    player.month = 1;
    player.year += 1;
    // Fiscal year budget processing
    processBudgetFiscalYear(newState);
  }

  // ─── Economy Simulation ───
  simulateEconomy(newState, season);

  // ─── Energy Simulation ───
  simulateEnergy(newState, season);

  // ─── Water Simulation ───
  simulateWater(newState, season);

  // ─── Infrastructure Decay ───
  simulateInfrastructure(newState);

  // ─── Population ───
  simulatePopulation(newState);

  // ─── Corruption ───
  simulateCorruption(newState);

  // ─── Public Services & Satisfaction ───
  simulateServices(newState);

  // ─── Province Updates ───
  simulateProvinces(newState);

  // ─── Parliament ───
  simulateParliament(newState);

  // ─── Commodity Prices ───
  simulateCommodities(newState);

  // ─── Projects Progress ───
  simulateProjects(newState);

  // ─── Faction Dynamics ───
  simulateFactions(newState);

  // ─── Elections ───
  simulateElections(newState);

  // ─── Zero budget crises ───
  simulateBudgetCrises(newState);

  // ─── Check for Game Over ───
  checkGameOver(newState);

  // ─── Generate Events ───
  const consequenceEvents = fireDueConsequences(newState);
  const newEvents = [...consequenceEvents, ...generateEvents(newState)];
  newState.events = [...newState.events.filter(e => !e.resolved), ...newEvents];

  // ─── Generate News ───
  const newNews = generateNews(newState);
  newState.newsHistory = [...newNews, ...newState.newsHistory].slice(0, 100);

  // ─── Update Game Log ───
  newState.gameLog.push(`${MONTH_NAMES[player.month - 1]} ${player.year}: Turn ${player.turn} processed.`);

  // ─── Record Historical Data ───
  if (!newState.decisionHistory) newState.decisionHistory = [];
  newState.decisionHistory.push({
    turn: player.turn,
    month: player.month,
    year: player.year,
    category: 'auto',
    decision: 'Monthly simulation',
    reasoning: 'Automatic monthly processing',
    effects: [],
  });

  return newState;
}

function simulateEconomy(state: GameState, season: string): void {
  const { economic, budget } = state;

  // GDP response to conditions
  let gdpDelta = 0;
  if (economic.investorConfidence > 60) gdpDelta += 0.3;
  if (economic.investorConfidence < 30) gdpDelta -= 0.4;
  if (state.energy.loadSheddingHoursPerDay > 8) gdpDelta -= 0.5;
  if (state.energy.loadSheddingHoursPerDay < 3) gdpDelta += 0.2;
  if (state.infrastructure.roadQuality > 60) gdpDelta += 0.2;
  if (state.infrastructure.roadQuality < 30) gdpDelta -= 0.3;

  // Budget impact on GDP
  const totalSpending = budget.items.reduce((sum, item) => sum + item.allocated, 0);
  if (totalSpending > budget.totalRevenue * 1.1) gdpDelta += 0.1; // deficit spending can stimulate
  if (totalSpending < budget.totalRevenue * 0.8) gdpDelta -= 0.15; // austerity slows

  // Agriculture seasonal bonus
  if (season === 'summer' && state.water.rainfallIndex > 50) gdpDelta += 0.15;

  // Commodity prices impact
  if (state.commodities.gold > 2000) gdpDelta += 0.2;
  if (state.commodities.platinum > 1000) gdpDelta += 0.1;

  economic.gdpGrowth = clamp(economic.gdpGrowth + randomRange(-0.3, 0.3) + gdpDelta * 0.1, -15, 20);
  economic.gdp = Math.max(1, economic.gdp * (1 + economic.gdpGrowth / 100 / 12));
  economic.gdpPerCapita = (economic.gdp * 1e9) / state.national.population;

  // Inflation
  let inflationDelta = 0;
  if (budget.totalAllocated > budget.totalRevenue) inflationDelta += 0.5;
  if (economic.moneySupply > 100) inflationDelta += 0.3;
  if (economic.exchangeRate > 35) inflationDelta += 0.5;
  if (state.energy.loadSheddingHoursPerDay > 10) inflationDelta += 0.3;

  economic.inflation = clamp(economic.inflation + inflationDelta + randomRange(-1, 1), -5, 500);

  // Exchange rate (ZiG/USD)
  let exchangeDelta = 0;
  if (economic.inflation > 30) exchangeDelta += 0.3;
  if (economic.inflation > 50) exchangeDelta += 0.6;
  if (economic.foreignReserves > 1) exchangeDelta -= 0.18;
  if (economic.foreignReserves < 0.3) exchangeDelta += 0.47;
  if (economic.investorConfidence > 50) exchangeDelta -= 0.12;

  economic.exchangeRate = Math.max(1, economic.exchangeRate + exchangeDelta + randomRange(-0.3, 0.3));

  // Black market
  economic.blackMarketPremium = clamp(
    (economic.exchangeRate / (economic.exchangeRate * 0.7 + 100)) * 100 + randomRange(-5, 5),
    5, 200
  );

  // Debt
  if (budget.totalAllocated > budget.totalRevenue) {
    economic.governmentDebt += (budget.totalAllocated - budget.totalRevenue) / 1000;
  }
  economic.debtToGdp = clamp((economic.governmentDebt / economic.gdp) * 100, 0, 200);

  // Tax revenue
  economic.taxRevenue = economic.gdp * 0.2 * (1 - economic.informalEconomySize / 200);
  economic.governmentRevenue = economic.taxRevenue * 1.3;

  // Unemployment
  let unemploymentDelta = 0;
  if (economic.gdpGrowth > 5) unemploymentDelta -= 0.3;
  if (economic.gdpGrowth < 0) unemploymentDelta += 0.5;
  const activeProjects = state.projects.filter(p => p.status === 'in_progress').length;
  unemploymentDelta -= activeProjects * 0.05;

  economic.unemploymentRate = clamp(economic.unemploymentRate + unemploymentDelta + randomRange(-0.3, 0.3), 5, 80);
  economic.youthUnemployment = clamp(economic.youthUnemployment + randomRange(-0.5, 0.5), economic.unemploymentRate * 1.3, 95);

  // Consumer/investor confidence
  economic.consumerConfidence = clamp(economic.consumerConfidence + (economic.inflation < 15 ? 1 : -1) + (economic.unemploymentRate < 20 ? 1 : -0.5) + randomRange(-2, 2), 5, 95);
  economic.investorConfidence = clamp(economic.investorConfidence + (economic.gdpGrowth > 3 ? 0.5 : -0.5) + (state.corruption.nationalLevel < 40 ? 0.5 : -0.5) + randomRange(-1, 1), 5, 95);

  // Informal economy
  economic.informalEconomySize = clamp(economic.informalEconomySize + (economic.unemploymentRate > 40 ? 0.5 : -0.2) + randomRange(-0.3, 0.3), 20, 85);

  // Trade
  state.trade.exports = economic.gdp * 0.25 * (1 + (state.commodities.gold - 1950) / 5000);
  state.trade.imports = economic.gdp * 0.3;
  state.trade.tradeBalance = state.trade.exports - state.trade.imports;
  state.trade.smugglingRate = clamp(state.trade.smugglingRate + (economic.exchangeRate > 35 ? 0.5 : -0.2) + randomRange(-0.3, 0.3), 5, 40);
}

function simulateEnergy(state: GameState, season: string): void {
  const { energy } = state;

  // Rainfall changes
  if (season === 'summer') {
    energy.rainfallIndex = clamp(energy.rainfallIndex + randomRange(5, 15), 0, 100);
  } else if (season === 'winter') {
    energy.rainfallIndex = clamp(energy.rainfallIndex + randomRange(-10, -3), 0, 100);
  } else {
    energy.rainfallIndex = clamp(energy.rainfallIndex + randomRange(-5, 5), 0, 100);
  }

  // Dam levels
  if (energy.rainfallIndex > 50) {
    energy.damLevel = clamp(energy.damLevel + randomRange(1, 4), 5, 100);
  } else if (energy.rainfallIndex < 30) {
    energy.damLevel = clamp(energy.damLevel + randomRange(-4, -1), 5, 100);
  }

  // Hydro output depends on dam level
  energy.sources.hydroelectric.output = clamp(
    energy.sources.hydroelectric.capacity * (energy.damLevel / 100) * (0.8 + Math.random() * 0.1),
    0, energy.sources.hydroelectric.capacity
  );

  // Solar output depends on season
  const solarMultiplier = season === 'winter' ? 0.9 : season === 'summer' ? 0.6 : 0.85;
  energy.sources.solar.output = clamp(
    energy.sources.solar.capacity * solarMultiplier,
    0, energy.sources.solar.capacity
  );

  // Coal reliability decreases with maintenance backlog
  energy.sources.coal.output = clamp(
    energy.sources.coal.capacity * (1 - energy.maintenanceBacklog / 200) + randomRange(-20, 20),
    energy.sources.coal.capacity * 0.1, energy.sources.coal.capacity
  );

  // Wind
  energy.sources.wind.output = clamp(
    energy.sources.wind.capacity * (0.4 + Math.random() * 0.3),
    0, energy.sources.wind.capacity
  );

  // Diesel
  energy.sources.diesel.output = clamp(
    energy.sources.diesel.capacity * 0.6,
    0, energy.sources.diesel.capacity
  );

  // Imported
  const importCapacity = state.economic.foreignReserves > 0.3 ? 0.7 : 0.3;
  energy.sources.imported.output = clamp(
    energy.sources.imported.capacity * importCapacity + randomRange(-20, 20),
    0, energy.sources.imported.capacity
  );

  // Independent producers
  energy.sources.independent.output = clamp(
    energy.sources.independent.capacity * (0.4 + Math.random() * 0.2),
    0, energy.sources.independent.capacity
  );

  // Calculate totals
  energy.totalSupply = Object.values(energy.sources).reduce((sum, s) => sum + s.output, 0);
  energy.totalDemand = energy.peakDemand * (0.7 + Math.random() * 0.3);
  energy.deficit = Math.max(0, energy.totalDemand - energy.totalSupply);

  // Load shedding calculation
  if (energy.totalSupply < energy.totalDemand) {
    const shortfall = (energy.totalDemand - energy.totalSupply) / energy.totalDemand;
    energy.loadSheddingStage = clamp(Math.ceil(shortfall * 10), 0, 8);
    energy.loadSheddingHoursPerDay = clamp(energy.loadSheddingStage * 2.5 + shortfall * 4, 0, 20);
  } else {
    energy.loadSheddingStage = 0;
    energy.loadSheddingHoursPerDay = clamp(energy.loadSheddingHoursPerDay - 1, 0, 20);
  }

  // Maintenance backlog
  const energyBudget = state.budget.items.find(b => b.category === 'energy')?.allocated || 0;
  energy.maintenanceBacklog = clamp(energy.maintenanceBacklog - (energyBudget > 500 ? 2 : -1) + randomRange(-1, 1), 0, 100);

  // Renewable percentage
  const renewable = energy.sources.solar.output + energy.sources.wind.output + energy.sources.hydroelectric.output;
  energy.renewablePercentage = (renewable / energy.totalSupply) * 100;
}

function simulateWater(state: GameState, season: string): void {
  const { water } = state;

  // Drought/flood risk
  if (season === 'summer') {
    water.droughtRisk = clamp(water.droughtRisk + randomRange(-5, 3), 0, 100);
    water.floodingRisk = clamp(water.floodingRisk + randomRange(-3, 5), 0, 100);
  } else {
    water.droughtRisk = clamp(water.droughtRisk + randomRange(-3, 5), 0, 100);
    water.floodingRisk = clamp(water.floodingRisk + randomRange(-5, 3), 0, 100);
  }

  // Reservoir levels
  const waterBudget = state.budget.items.find(b => b.category === 'water')?.allocated || 0;
  if (water.droughtRisk > 60) {
    water.reservoirLevels = clamp(water.reservoirLevels - randomRange(2, 5), 5, 100);
  } else if (water.floodingRisk > 60) {
    water.reservoirLevels = clamp(water.reservoirLevels + randomRange(3, 8), 5, 100);
  } else {
    water.reservoirLevels = clamp(water.reservoirLevels + randomRange(-2, 3), 5, 100);
  }

  // Supply
  water.treatmentCapacity = clamp(water.treatmentCapacity + (waterBudget > 400 ? 0.5 : -0.3) + randomRange(-0.5, 0.5), 20, 95);
  water.pipelineCondition = clamp(water.pipelineCondition + (waterBudget > 400 ? 0.3 : -0.5) + randomRange(-0.5, 0.5), 10, 90);
  water.leakageRate = clamp(100 - water.pipelineCondition + 10, 10, 70);

  water.totalSupply = water.treatmentCapacity * 15 * (1 - water.leakageRate / 100);
  water.totalDemand = 1200 + state.national.population / 50000 * 50;
  water.deficit = Math.max(0, water.totalDemand - water.totalSupply);

  // Access
  water.urbanAccess = clamp(water.urbanAccess + (waterBudget > 400 ? 0.3 : -0.2) + randomRange(-0.3, 0.3), 20, 95);
  water.ruralAccess = clamp(water.ruralAccess + (waterBudget > 400 ? 0.2 : -0.15) + randomRange(-0.2, 0.2), 10, 90);

  // Water quality
  water.waterQuality = clamp(water.waterQuality + (waterBudget > 400 ? 0.5 : -0.5) - water.leakageRate * 0.02 + randomRange(-1, 1), 10, 95);
}

function simulateInfrastructure(state: GameState): void {
  const { infrastructure, budget } = state;
  const roadBudget = budget.items.find(b => b.category === 'roads')?.allocated || 0;

  // Road decay and repair
  infrastructure.roadQuality = clamp(
    infrastructure.roadQuality - 0.3 + (roadBudget > 500 ? 0.5 : 0) + randomRange(-0.3, 0.3),
    5, 95
  );

  // Water reliability
  infrastructure.waterReliability = state.water.urbanAccess * 0.8 + state.water.waterQuality * 0.2;

  // Electricity
  infrastructure.electricityAvailability = clamp(100 - state.energy.loadSheddingHoursPerDay * 4, 5, 95);

  // Internet
  const ictBudget = budget.items.find(b => b.category === 'ict')?.allocated || 0;
  infrastructure.internetPenetration = clamp(
    infrastructure.internetPenetration + (ictBudget > 150 ? 0.3 : 0.05) + randomRange(-0.1, 0.2),
    15, 95
  );

  // Hospital beds
  const healthBudget = budget.items.find(b => b.category === 'hospitals')?.allocated || 0;
  infrastructure.hospitalBedsPer1000 = clamp(
    infrastructure.hospitalBedsPer1000 + (healthBudget > 600 ? 0.02 : -0.01),
    0.5, 5
  );

  // Housing
  const housingBudget = budget.items.find(b => b.category === 'housing')?.allocated || 0;
  infrastructure.housingBacklog = clamp(
    infrastructure.housingBacklog + state.national.population * 0.0001 - (housingBudget > 300 ? 500 : 100),
    100000, 3000000
  );
}

function simulatePopulation(state: GameState): void {
  const { national } = state;
  const growth = (national.birthRate - national.deathRate + national.netMigration / national.population * 1000) / 1000;
  national.population = Math.max(1000000, Math.round(national.population * (1 + growth / 12)));
  national.urbanPopulation = clamp(national.urbanPopulation + randomRange(-0.05, 0.08), 15, 75);
  national.lifeExpectancy = clamp(national.lifeExpectancy + randomRange(-0.05, 0.08), 45, 80);
  national.medianAge = clamp(national.medianAge + randomRange(-0.01, 0.02), 15, 35);
}

function simulateCorruption(state: GameState): void {
  const { corruption, ministers, budget } = state;

  // Average minister corruption
  const avgMinisterCorruption = ministers.filter(m => m.isActive).reduce((sum, m) => sum + m.corruption, 0) / Math.max(1, ministers.filter(m => m.isActive).length);

  // Budget allocation affects corruption (more spending = more opportunities)
  const totalSpending = budget.items.reduce((sum, item) => sum + item.allocated, 0);
  const totalLeakage = budget.items.reduce((sum, item) => sum + (item.allocated * item.corruptionLeakage / 100), 0);
  corruption.fundsLostToCorruption = totalLeakage / 1000 * 100;

  corruption.nationalLevel = clamp(
    corruption.nationalLevel * 0.95 + avgMinisterCorruption * 0.05 + randomRange(-1, 1),
    10, 95
  );
  corruption.publicPerception = clamp(
    corruption.publicPerception * 0.9 + corruption.nationalLevel * 0.1 + randomRange(-1, 1),
    10, 95
  );
}

function simulateServices(state: GameState): void {
  const { publicServices, citizenSatisfaction, budget, energy, water, infrastructure } = state;

  // Education
  const eduBudget = budget.items.find(b => b.category === 'education')?.allocated || 0;
  publicServices.schools = clamp(publicServices.schools + (eduBudget > 700 ? 0.5 : -0.3) + randomRange(-0.2, 0.3), 10, 95);

  // Hospitals
  const healthBudget = budget.items.find(b => b.category === 'hospitals')?.allocated || 0;
  publicServices.hospitals = clamp(publicServices.hospitals + (healthBudget > 600 ? 0.4 : -0.3) + randomRange(-0.2, 0.3), 10, 95);

  // Roads
  publicServices.roads = infrastructure.roadQuality;

  // Water
  publicServices.water = water.urbanAccess * 0.6 + water.waterQuality * 0.4;

  // Electricity
  publicServices.electricity = infrastructure.electricityAvailability;

  // Transport
  const transportBudget = budget.items.find(b => b.category === 'roads')?.allocated || 0;
  publicServices.publicTransport = clamp(publicServices.publicTransport + (transportBudget > 500 ? 0.2 : -0.2) + randomRange(-0.3, 0.3), 10, 80);

  // Waste
  publicServices.wasteCollection = clamp(publicServices.wasteCollection + (budget.items.find(b => b.category === 'administration')?.allocated || 0 > 250 ? 0.2 : -0.1), 10, 80);

  // Internet
  publicServices.internet = infrastructure.internetPenetration;

  // Police
  const policeBudget = budget.items.find(b => b.category === 'police')?.allocated || 0;
  publicServices.police = clamp(publicServices.police + (policeBudget > 450 ? 0.3 : -0.2), 10, 85);

  // Fire
  publicServices.fireServices = clamp(publicServices.fireServices + randomRange(-0.3, 0.3), 10, 80);

  // ─── Citizen Satisfaction ───
  const servicesAvg = (publicServices.schools + publicServices.hospitals + publicServices.roads + publicServices.water + publicServices.electricity) / 5;
  citizenSatisfaction.services = clamp(servicesAvg * 0.9 + randomRange(-1, 1), 5, 95);
  citizenSatisfaction.economy = clamp(
    (100 - state.economic.inflation * 0.8) * 0.4 +
    (100 - state.economic.unemploymentRate * 1.2) * 0.3 +
    (state.economic.gdpGrowth > 0 ? 30 : 10) * 0.3 +
    randomRange(-1, 1),
    5, 95
  );
  citizenSatisfaction.governance = clamp(
    (100 - state.corruption.publicPerception * 0.7) * 0.5 +
    state.player.legitimacy * 0.3 +
    citizenSatisfaction.freedom * 0.2 +
    randomRange(-1, 1),
    5, 95
  );
  citizenSatisfaction.security = clamp(100 - (100 - publicServices.police) * 0.6 + randomRange(-2, 2), 5, 95);
  citizenSatisfaction.infrastructure = clamp(servicesAvg, 5, 95);
  citizenSatisfaction.future = clamp(
    citizenSatisfaction.economy * 0.3 +
    citizenSatisfaction.governance * 0.3 +
    citizenSatisfaction.services * 0.2 +
    (state.economic.gdpGrowth > 2 ? 50 : 20) * 0.2 +
    randomRange(-1, 1),
    5, 95
  );
  citizenSatisfaction.overall = clamp(
    citizenSatisfaction.economy * 0.25 +
    citizenSatisfaction.services * 0.25 +
    citizenSatisfaction.governance * 0.2 +
    citizenSatisfaction.security * 0.1 +
    citizenSatisfaction.infrastructure * 0.1 +
    citizenSatisfaction.future * 0.1 +
    randomRange(-0.5, 0.5),
    5, 95
  );

  // Popularity tracks satisfaction
  state.player.popularity = clamp(
    state.player.popularity * 0.85 + citizenSatisfaction.overall * 0.15,
    0, 100
  );
}

function simulateProvinces(state: GameState): void {
  for (const province of state.provinces) {
    province.healthIndex = clamp(province.healthIndex + randomRange(-1, 1.2), 10, 95);
    province.educationIndex = clamp(province.educationIndex + randomRange(-0.8, 1), 10, 95);
    province.infrastructureIndex = clamp(province.infrastructureIndex + randomRange(-0.5, 0.8), 10, 95);
    province.satisfactionIndex = clamp(
      province.satisfactionIndex * 0.9 + (100 - province.povertyRate * 0.8) * 0.1 + randomRange(-1, 1),
      5, 95
    );
    province.politicalSupport = clamp(
      state.player.popularity * 0.3 + province.satisfactionIndex * 0.5 + province.politicalSupport * 0.2 + randomRange(-2, 2),
      5, 95
    );

    // District-level changes
    for (const district of province.districts) {
      district.citizenSatisfaction = clamp(
        district.citizenSatisfaction + (district.waterReliability > 50 ? 0.2 : -0.3) + (district.electricityAvailability > 50 ? 0.2 : -0.3) + randomRange(-1, 1),
        5, 95
      );
    }
  }

  // Update player approval by province
  for (const province of state.provinces) {
    state.player.approvalByProvince[province.id] = province.politicalSupport;
  }
}

function simulateParliament(state: GameState): void {
  const { parliament, player, citizenSatisfaction } = state;
  parliament.publicSupportForGovernment = clamp(
    parliament.publicSupportForGovernment * 0.9 + player.popularity * 0.1 + randomRange(-1, 1),
    10, 90
  );

  // MPs may shift loyalty
  const totalSeats = parliament.totalSeats;
  const rulingSeats = Math.round(totalSeats * (parliament.publicSupportForGovernment / 100) * 0.9 + randomRange(-5, 5));
  parliament.rulingPartySeats = clamp(rulingSeats, Math.floor(totalSeats * 0.2), Math.floor(totalSeats * 0.75));
  parliament.oppositionSeats = totalSeats - parliament.rulingPartySeats - parliament.independentSeats;
}

function simulateCommodities(state: GameState): void {
  const { commodities } = state;
  commodities.gold = clamp(commodities.gold + randomRange(-30, 30), 1500, 2500);
  commodities.platinum = clamp(commodities.platinum + randomRange(-20, 20), 800, 1200);
  commodities.lithium = clamp(commodities.lithium + randomRange(-3000, 3000), 50000, 100000);
  commodities.chrome = clamp(commodities.chrome + randomRange(-10, 10), 120, 250);
  commodities.tobacco = clamp(commodities.tobacco + randomRange(-0.3, 0.3), 3, 8);
  commodities.maize = clamp(commodities.maize + randomRange(-15, 15), 200, 400);
  commodities.fuel = clamp(commodities.fuel + randomRange(-3, 3), 60, 120);
}

function simulateProjects(state: GameState): void {
  for (const project of state.projects) {
    if (project.status === 'in_progress') {
      project.progress = clamp(project.progress + randomRange(3, 12), 0, 100);
      if (project.progress >= 100) {
        project.status = 'completed';
        project.completedTurn = state.player.turn;
        state.gameLog.push(`Project completed: ${project.name}`);

        // Apply project effects
        switch (project.category) {
          case 'roads': state.infrastructure.roadQuality = clamp(state.infrastructure.roadQuality + 3, 0, 100); break;
          case 'water': state.water.urbanAccess = clamp(state.water.urbanAccess + 2, 0, 100); break;
          case 'energy': state.energy.totalSupply += project.employmentCreated * 0.1; break;
          case 'healthcare': state.publicServices.hospitals = clamp(state.publicServices.hospitals + 2, 0, 100); break;
          case 'education': state.publicServices.schools = clamp(state.publicServices.schools + 2, 0, 100); break;
        }

        state.player.popularity = clamp(state.player.popularity + project.politicalPopularity * 0.1, 0, 100);
      }
    }
  }
}

function simulateFactions(state: GameState): void {
  for (const faction of state.factions) {
    const satisfaction = faction.demands.reduce((sum, demand) => {
      if (demand.includes('corruption') && state.corruption.nationalLevel < 50) return sum + 1;
      if (demand.includes('budget') && state.budget.totalRevenue > state.budget.totalSpent) return sum + 1;
      if (demand.includes('infrastructure') && state.infrastructure.roadQuality > 50) return sum + 1;
      return sum;
    }, 0) / faction.demands.length * 50;

    faction.supportLevel = clamp(faction.supportLevel * 0.95 + satisfaction * 0.05 + randomRange(-2, 2), 5, 80);

    // Update stance
    if (faction.supportLevel > 50 && faction.stance === 'opponent') faction.stance = 'neutral';
    if (faction.supportLevel > 60) faction.stance = 'ally';
    if (faction.supportLevel < 25) faction.stance = 'opponent';
    if (faction.supportLevel < 15) faction.stance = 'rebel';
  }
}

function buildEventFromTemplate(state: GameState, template: (typeof EVENT_TEMPLATES)[number]): GameEvent {
  return {
    id: uid(),
    templateId: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    severity: template.severity,
    turn: state.player.turn,
    month: state.player.month,
    year: state.player.year,
    choices: template.choices.map((c, i) => ({
      id: `${template.id}_choice_${i}`,
      text: c.text,
      shortDescription: c.shortDesc,
      effects: c.effects.map(e => ({
        target: e.target,
        operation: e.op as any,
        value: e.value,
        duration: e.dur,
      })),
      politicalRisk: c.politicalRisk,
      popularityImpact: c.popularityImpact,
      setFlags: c.setFlags,
      clearFlags: c.clearFlags,
      nextEventId: c.nextEventId,
      consequenceDelay: c.consequenceDelay,
    })),
    isRandom: true,
    resolved: false,
  };
}

// Fire scheduled consequences (cascading crises) whose turn has arrived.
export function fireDueConsequences(state: GameState): GameEvent[] {
  const fired: GameEvent[] = [];
  const due = state.pendingConsequences.filter(c => c.fireTurn <= state.player.turn);
  if (due.length === 0) return fired;
  state.pendingConsequences = state.pendingConsequences.filter(c => c.fireTurn > state.player.turn);

  for (const c of due) {
    const template = EVENT_TEMPLATES.find(t => t.id === c.templateId);
    if (!template) continue;
    if (template.requiredFlags && !template.requiredFlags.every(f => state.flags.includes(f))) continue;
    for (const f of c.clearFlags) state.flags = state.flags.filter(x => x !== f);
    for (const f of [...(c.setFlags ?? []), ...(template.setFlags ?? [])]) {
      if (!state.flags.includes(f)) state.flags.push(f);
    }
    const ev = buildEventFromTemplate(state, template);
    fired.push(ev);
    state.gameLog.push(`Crisis follow-up: ${template.title}`);
  }
  return fired;
}

// Public mood label derived from popularity, satisfaction, and inflation.
export function getPublicMood(state: GameState): { key: PublicMood; score: number } {
  const score = state.player.popularity * 0.5 + state.citizenSatisfaction.overall * 0.3 + Math.max(0, 100 - state.economic.inflation) * 0.2;
  const key: PublicMood = score >= 75 ? 'euphoric' : score >= 60 ? 'optimistic' : score >= 45 ? 'content' : score >= 30 ? 'restless' : 'defiant';
  return { key, score };
}

// Titles awarded automatically when the player's record meets thresholds.
export const TITLE_RULES: { key: string; check: (s: GameState) => boolean }[] = [
  { key: 'people_champion', check: s => s.player.popularity >= 80 },
  { key: 'engine_of_growth', check: s => s.economic.gdpGrowth >= 5 },
  { key: 'clean_hands', check: s => s.corruption.nationalLevel <= 20 },
  { key: 'guardian_of_peace', check: s => s.player.popularity >= 60 && s.citizenSatisfaction.security >= 60 },
  { key: 'champion_of_literacy', check: s => s.national.literacyRate >= 92 },
  { key: 'formal_economy_builder', check: s => s.economic.informalEconomySize <= 35 },
  { key: 'chief_queue_attendee', check: s => s.energy.loadSheddingHoursPerDay > 10 },
];

function generateEvents(state: GameState): GameEvent[] {
  const newEvents: GameEvent[] = [];

  // Weighted selection from eligible templates
  const candidates = EVENT_TEMPLATES.filter(
    t => t.condition(state) && (!t.requiredFlags || t.requiredFlags.every(f => state.flags.includes(f)))
  );
  if (candidates.length > 0) {
    const diffMult = state.difficulty === 'hard' ? 1.3 : state.difficulty === 'easy' ? 0.8 : 1;
    const sevMult: Record<string, number> = { minor: 1, moderate: 1.5, major: 2.2, crisis: 2.8 };
    const total = candidates.reduce((sum, t) => sum + (t.weight ?? 1) * sevMult[t.severity] * diffMult, 0);
    let roll = Math.random() * total;
    let chosen = candidates[0];
    for (const t of candidates) {
      roll -= (t.weight ?? 1) * sevMult[t.severity] * diffMult;
      if (roll <= 0) { chosen = t; break; }
    }

    // Foresight: major/crisis events with a foreshadow text may surface as a
    // rumor one turn before they actually fire.
    if (chosen.foreshadow && (chosen.severity === 'major' || chosen.severity === 'crisis') && Math.random() < 0.4) {
      state.rumors = [...state.rumors, chosen.foreshadow].slice(-10);
      state.pendingConsequences = [...state.pendingConsequences, {
        id: uid(),
        fireTurn: state.player.turn + 1,
        templateId: chosen.id,
        setFlags: [],
        clearFlags: [],
      }];
      state.gameLog.push(`Rumor: ${chosen.foreshadow}`);
    } else {
      const ev = buildEventFromTemplate(state, chosen);
      if (chosen.setFlags) {
        for (const f of chosen.setFlags) {
          if (!state.flags.includes(f)) state.flags.push(f);
        }
      }
      newEvents.push(ev);
    }
  }

  // Always generate 0-2 minor random events
  if (Math.random() < 0.6) {
    const minorEvents = [
      { title: 'Minor Earthquake Felt in Eastern Highlands', description: 'A 4.2 magnitude earthquake was felt in Manicaland. No major damage reported but residents are shaken.', category: 'natural_disaster' as const, severity: 'minor' as const },
      { title: 'Successful Agricultural Show in Harare', description: 'The annual agricultural exhibition attracted record attendance and showcased new farming technologies.', category: 'agriculture' as const, severity: 'minor' as const },
      { title: 'New Highway Opens Between Harare and Bulawayo', description: 'The upgraded highway reduces travel time between the two largest cities by 2 hours.', category: 'infrastructure' as const, severity: 'minor' as const },
      { title: 'University Graduates Record Number of Students', description: 'The University has graduated 8,000 students this year, the highest number in its history.', category: 'education' as const, severity: 'minor' as const },
      { title: 'Wildlife Poaching Report Released', description: 'Conservation authorities report a 15% decline in poaching incidents compared to last year.', category: 'social' as const, severity: 'minor' as const },
    ];
    const evt = minorEvents[Math.floor(Math.random() * minorEvents.length)];
    const ev: GameEvent = {
      id: uid(), ...evt,
      turn: state.player.turn, month: state.player.month, year: state.player.year,
      isRandom: true, resolved: true,
    };
    newEvents.push(ev);
    state.eventArchive = [...state.eventArchive, {
      id: ev.id,
      title: ev.title,
      category: ev.category,
      severity: ev.severity,
      turn: ev.turn,
      month: ev.month,
      year: ev.year,
      outcome: 'resolved' as const,
    }].slice(-200);
    state.gameLog.push(`Event: ${evt.title}`);
  }

  return newEvents;
}

function processBudgetFiscalYear(state: GameState): void {
  const { budget, economic } = state;

  // Revenue growth
  budget.totalRevenue = Math.round(economic.governmentRevenue * 1000);
  budget.fiscalYear = state.player.year;
  budget.totalSpent = budget.totalAllocated;
  budget.deficit = budget.totalSpent - budget.totalRevenue;

  // Store previous year actual
  budget.previousYearActual = { ...budget.previousYearActual };
  for (const item of budget.items) {
    (budget.previousYearActual as any)[item.category] = item.allocated;
  }
}

// ═══════════════════════════════════════════════════════
// ELECTION SIMULATION
// ═══════════════════════════════════════════════════════

function simulateElections(state: GameState): void {
  if (state.elections.length === 0) return;

  const election = state.elections[state.elections.length - 1];

  // If election is already over, don't process
  if (election.isOver) return;

  const { player, citizenSatisfaction, economic } = state;

  // ─── Update Polls (every 3 turns) ───
  if (player.turn % 3 === 0) {
    // Calculate player poll percentage based on multiple factors
    const basePopularity = player.popularity * 0.5;
    const satisfactionBonus = citizenSatisfaction.overall * 0.2;
    const legitimacyBonus = player.legitimacy * 0.15;
    const economicBonus = (economic.gdpGrowth > 0 ? Math.min(economic.gdpGrowth * 2, 10) : economic.gdpGrowth * 2) * 0.1;
    const inflationPenalty = economic.inflation > 30 ? -(economic.inflation - 30) * 0.1 : 0;
    const loadSheddingPenalty = state.energy.loadSheddingHoursPerDay > 4 ? -(state.energy.loadSheddingHoursPerDay - 4) * 0.3 : 0;

    let playerPercent = clamp(
      basePopularity + satisfactionBonus + legitimacyBonus + economicBonus + inflationPenalty + loadSheddingPenalty + randomRange(-3, 3),
      15, 75
    );
    const opponentPercent = clamp(100 - playerPercent + randomRange(-5, 5), 20, 80);

    election.polls.push({
      turn: player.turn,
      playerPercent,
      opponentPercent,
    });
  }

  // ─── Check if Election Day Has Arrived ───
  if (player.year === election.year && player.month === election.month) {
    // Calculate final results
    const latestPoll = election.polls[election.polls.length - 1];

    // Base from latest polls
    let playerVotePercent = latestPoll.playerPercent;

    // Campaign funds bonus (more money = better outreach)
    playerVotePercent += player.campaignFunds * 0.15;

    // Turnout: base + satisfaction, modulated by GDP growth, inflation, and cabinet strength
    const gdpFactor = clamp(economic.gdpGrowth, -10, 10) * 0.5;
    const inflationFactor = clamp((25 - economic.inflation) * 0.15, -12, 3);
    const activeMinisters = state.ministers.filter(m => m.isActive);
    const avgMinisterPopularity = activeMinisters.length ? activeMinisters.reduce((sum, m) => sum + m.popularity, 0) / activeMinisters.length : 0;
    const ministerFactor = avgMinisterPopularity * 0.1 - (state.ministers.length - activeMinisters.length) * 1.5;
    const turnout = clamp(55 + citizenSatisfaction.overall * 0.3 + gdpFactor + inflationFactor + ministerFactor + randomRange(-5, 5), 40, 85);
    election.turnoutPercent = turnout;

    // If turnout is high and satisfaction is low, opposition benefits
    if (turnout > 70 && citizenSatisfaction.overall < 40) {
      playerVotePercent -= 5;
    }

    // Final clamp with randomness (±5% swing on election day)
    playerVotePercent = clamp(playerVotePercent + randomRange(-5, 5), 15, 80);
    const opponentVotePercent = clamp(100 - playerVotePercent + randomRange(-3, 3), 15, 80);

    // Total votes
    const totalVotesCast = Math.round(election.totalVoters * (turnout / 100));
    election.playerVotes = Math.round(totalVotesCast * (playerVotePercent / 100));
    election.opponentVotes = totalVotesCast - election.playerVotes;

    // Determine winner (need >50% to win outright, or >45% with 5% margin)
    const playerWon = playerVotePercent > 50 || (playerVotePercent > 45 && playerVotePercent - opponentVotePercent > 5);
    election.playerWon = playerWon;
    election.isOver = true;
    election.isCampaigning = false;

    if (playerWon) {
      // Record in historical results
      election.historicalResults = [
        ...(election.historicalResults || []),
        { year: election.year, playerParty: Math.round(playerVotePercent), opposition: Math.round(opponentVotePercent) },
      ];
      state.gameLog.push(`🗳️ ELECTION VICTORY! You won with ${playerVotePercent.toFixed(1)}% of the vote in ${MONTH_NAMES[election.month - 1]} ${election.year}. Your mandate is renewed!`);
      state.player.legitimacy = clamp(state.player.legitimacy + 15, 0, 100);
      state.player.popularity = clamp(state.player.popularity + 5, 0, 100);

      // Create next election (5 years later, in August)
      const nextElection: typeof election = {
        id: `e_${player.year + 5}`,
        type: 'presidential',
        year: election.year + 5,
        month: 8,
        isCampaigning: false,
        campaignTurnsLeft: 0,
        playerVotes: 0,
        opponentVotes: 0,
        totalVoters: Math.round(state.national.population * 0.45), // ~45% of population eligible
        turnoutPercent: 0,
        playerManifesto: [],
        polls: [{ turn: player.turn, playerPercent: playerVotePercent - 2, opponentPercent: opponentVotePercent + 2 }],
        isOver: false,
        playerWon: false,
        historicalResults: election.historicalResults || [],
      };
      state.elections.push(nextElection);
    } else {
      state.gameLog.push(`🗳️ ELECTION DEFEAT. The opposition won with ${opponentVotePercent.toFixed(1)}% of the vote. You received ${playerVotePercent.toFixed(1)}%. Your presidency is over.`);
      state.isGameOver = true;
      state.gameOverReason = `ELECTION DEFEAT — The opposition secured ${opponentVotePercent.toFixed(1)}% of the vote to your ${playerVotePercent.toFixed(1)}%. The people have spoken and chosen new leadership. After ${(player.turn / 12).toFixed(1)} years in power, your presidency comes to an end.`;
    }
  }
}

function checkGameOver(state: GameState): void {
  const { player, economic, citizenSatisfaction } = state;

  // Hyperinflation collapse
  if (economic.inflation > 300) {
    state.isGameOver = true;
    state.gameOverReason = 'HYPERINFLATION — The economy has collapsed under uncontrolled inflation. Currency is worthless, markets have emptied, and the nation faces total economic ruin.';
    return;
  }

  // Sovereign default
  if (economic.debtToGdp > 150) {
    state.isGameOver = true;
    state.gameOverReason = 'SOVEREIGN DEFAULT — The nation has defaulted on its debts. International creditors have frozen all lending. Government operations are paralyzed.';
    return;
  }

  // Popular uprising
  if (citizenSatisfaction.overall < 8 && player.popularity < 10) {
    state.isGameOver = true;
    state.gameOverReason = 'MASS UPRISING — Citizens have taken to the streets in unprecedented numbers. The government has lost all legitimacy and control.';
    return;
  }

  // Military coup (rare)
  if (player.popularity < 15 && player.legitimacy < 15 && Math.random() < 0.02) {
    state.isGameOver = true;
    state.gameOverReason = 'MILITARY INTERVENTION — With the government in freefall, the military has assumed control. Your presidency is over.';
    return;
  }
}

// ═══════════════════════════════════════════════════════
// PROJECT GENERATION
// ═══════════════════════════════════════════════════════

export function generateAvailableProjects(state: GameState): InfrastructureProject[] {
  const projects: InfrastructureProject[] = [];
  const provinces = state.provinces;

  const projectTemplates = [
    { name: 'Highway Rehabilitation', category: 'roads' as const, cost: 450, maintenance: 15, time: 8, pop: 15, econ: 25, jobs: 2000, env: -5, corr: 30 },
    { name: 'Pothole Repair Program', category: 'roads' as const, cost: 80, maintenance: 5, time: 3, pop: 20, econ: 10, jobs: 500, env: 0, corr: 15 },
    { name: 'New Bridge Construction', category: 'roads' as const, cost: 300, maintenance: 8, time: 12, pop: 10, econ: 30, jobs: 1500, env: -10, corr: 35 },
    { name: 'Water Treatment Plant Upgrade', category: 'water' as const, cost: 350, maintenance: 12, time: 10, pop: 18, econ: 15, jobs: 800, env: 10, corr: 25 },
    { name: 'Pipeline Replacement Program', category: 'water' as const, cost: 200, maintenance: 5, time: 6, pop: 8, econ: 10, jobs: 600, env: 5, corr: 20 },
    { name: 'Solar Farm Installation', category: 'energy' as const, cost: 250, maintenance: 8, time: 8, pop: 12, econ: 20, jobs: 400, env: 15, corr: 18 },
    { name: 'Hydroelectric Expansion', category: 'energy' as const, cost: 800, maintenance: 20, time: 18, pop: 8, econ: 35, jobs: 3000, env: -15, corr: 40 },
    { name: 'Rural Electrification', category: 'energy' as const, cost: 180, maintenance: 5, time: 6, pop: 15, econ: 12, jobs: 300, env: 5, corr: 15 },
    { name: 'District Hospital Construction', category: 'healthcare' as const, cost: 400, maintenance: 25, time: 14, pop: 22, econ: 10, jobs: 600, env: 0, corr: 22 },
    { name: 'Primary School Building Program', category: 'education' as const, cost: 120, maintenance: 8, time: 6, pop: 20, econ: 12, jobs: 400, env: 0, corr: 12 },
    { name: 'University Expansion', category: 'education' as const, cost: 350, maintenance: 20, time: 12, pop: 15, econ: 20, jobs: 800, env: 5, corr: 18 },
    { name: 'Low-Cost Housing Development', category: 'housing' as const, cost: 280, maintenance: 10, time: 10, pop: 25, econ: 15, jobs: 2500, env: -5, corr: 28 },
    { name: 'Industrial Park Development', category: 'manufacturing' as const, cost: 500, maintenance: 15, time: 12, pop: 12, econ: 35, jobs: 5000, env: -15, corr: 35 },
    { name: 'Tourism Lodge Construction', category: 'tourism' as const, cost: 150, maintenance: 8, time: 8, pop: 8, econ: 20, jobs: 300, env: 5, corr: 15 },
    { name: 'ICT Hub Development', category: 'telecommunications' as const, cost: 200, maintenance: 10, time: 8, pop: 10, econ: 25, jobs: 1000, env: 5, corr: 12 },
    { name: 'Market Construction', category: 'agriculture' as const, cost: 60, maintenance: 3, time: 4, pop: 18, econ: 8, jobs: 200, env: 0, corr: 10 },
    { name: 'Irrigation Scheme', category: 'agriculture' as const, cost: 300, maintenance: 12, time: 10, pop: 10, econ: 22, jobs: 1500, env: 5, corr: 20 },
    { name: 'Mine Expansion', category: 'mining' as const, cost: 600, maintenance: 25, time: 14, pop: 5, econ: 40, jobs: 4000, env: -20, corr: 45 },
  ];

  for (const template of projectTemplates) {
    if (Math.random() < 0.5) {
      const province = provinces[Math.floor(Math.random() * provinces.length)];
      projects.push({
        id: uid(),
        name: `${template.name} — ${province.name}`,
        category: template.category,
        province: province.id,
        description: `${template.name} project in ${province.name}. Cost: ZiG ${template.cost}M. Completion: ${template.time} turns.`,
        cost: template.cost,
        maintenanceCost: template.maintenance,
        completionTime: template.time,
        progress: 0,
        politicalPopularity: template.pop,
        economicImpact: template.econ,
        employmentCreated: template.jobs,
        environmentalImpact: template.env,
        corruptionRisk: template.corr,
        status: 'proposed',
      });
    }
  }

  return projects.slice(0, 8);
}

// ═══════════════════════════════════════════════════════
// GET HISTORICAL DATA
// ═══════════════════════════════════════════════════════

export function getHistoricalDataPoint(state: GameState): HistoricalDataPoint {
  return {
    turn: state.player.turn,
    month: state.player.month,
    year: state.player.year,
    gdp: state.economic.gdp,
    inflation: state.economic.inflation,
    unemployment: state.economic.unemploymentRate,
    popularity: state.player.popularity,
    satisfaction: state.citizenSatisfaction.overall,
    exchangeRate: state.economic.exchangeRate,
    debtToGdp: state.economic.debtToGdp,
    loadSheddingHours: state.energy.loadSheddingHoursPerDay,
    waterReliability: state.water.urbanAccess,
    roadQuality: state.infrastructure.roadQuality,
    crime: 100 - state.citizenSatisfaction.security,
    corruption: state.corruption.nationalLevel,
  };
}
