'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore, type GameScreen, type FontSize } from '@/store/game-store';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  LayoutDashboard, DollarSign, Building2, Landmark, Newspaper, Map,
  Users, Zap, Droplets, ShieldAlert, Vote, ChevronRight, Play,
  Skull, Settings, Clock, TrendingUp, AlertTriangle, Flame,
  ChevronLeft, Menu, Gamepad2, X, Heart, Star, Trophy, Check, Lightbulb, Info,
  Sun, Moon, Type, Globe,
} from 'lucide-react';
import { MONTH_NAMES } from '@/lib/game/constants';

// ═══════════════════════════════════════════════════════
// TIP SYSTEM — Contextual hover tip cards
// ═══════════════════════════════════════════════════════

interface GameTip {
  id: string;
  screen?: GameScreen;
  title: string;
  description: string;
  strategy: string;
  icon?: string;
}

const GAME_TIPS: Record<string, GameTip> = {
  // ── Global / Header ──
  end_turn: {
    id: 'end_turn',
    title: 'End Turn',
    description: 'Advances time by one month. All simulators run: economy, population, infrastructure, energy, water, corruption, and more.',
    strategy: 'Before ending a turn, check your budget allocation and any pending events. Unresolved events can escalate!',
    icon: 'ChevronRight',
  },
  popularity: {
    id: 'popularity',
    title: 'Popularity',
    description: 'Your approval rating among citizens. High popularity helps in elections and reduces political risk.',
    strategy: 'Balance populist policies with long-term investment. Ignoring citizen needs for too long will cost you votes.',
    icon: 'Heart',
  },
  gdp: {
    id: 'gdp',
    title: 'GDP Growth',
    description: 'The rate of economic expansion. Higher GDP means more tax revenue and happier citizens.',
    strategy: 'Invest in infrastructure, mining, and agriculture. Over-taxation and corruption slow GDP growth.',
    icon: 'TrendingUp',
  },
  inflation: {
    id: 'inflation',
    title: 'Inflation Rate',
    description: 'Rising prices erode purchasing power. High inflation makes citizens unhappy and destabilizes the economy.',
    strategy: 'Control money supply, invest in agriculture to increase food supply, and avoid excessive deficit spending.',
    icon: 'Flame',
  },
  satisfaction: {
    id: 'satisfaction',
    title: 'Citizen Satisfaction',
    description: 'Overall happiness of your citizens across all services and economic conditions.',
    strategy: 'A balanced approach to all sectors works best. Don\'t neglect water, energy, or healthcare.',
    icon: 'Star',
  },
  load_shedding: {
    id: 'load_shedding',
    title: 'Load Shedding Hours',
    description: 'Daily hours of scheduled power cuts. Citizens hate load shedding — it hurts businesses and daily life.',
    strategy: 'Invest in new power generation (solar, wind) and maintain existing infrastructure to reduce load shedding.',
    icon: 'Zap',
  },

  // ── Dashboard ──
  dashboard_economic: {
    id: 'dashboard_economic',
    screen: 'dashboard',
    title: 'Economic Indicators',
    description: 'Key metrics showing the health of Zimbabwe\'s economy: GDP, inflation, unemployment, and trade balance.',
    strategy: 'Watch GDP growth and inflation closely. A recession with high inflation is the most dangerous combination.',
    icon: 'TrendingUp',
  },
  dashboard_infrastructure: {
    id: 'dashboard_infrastructure',
    screen: 'dashboard',
    title: 'Infrastructure Health',
    description: 'Overall condition of roads, bridges, water systems, power grid, and telecommunications.',
    strategy: 'Approve infrastructure projects regularly. Neglected infrastructure decays faster than you think.',
    icon: 'Building2',
  },
  dashboard_gdp_trend: {
    id: 'dashboard_gdp_trend',
    screen: 'dashboard',
    title: 'GDP Trend',
    description: 'Historical GDP growth over recent turns. Look for patterns — sustained decline needs urgent action.',
    strategy: 'If GDP is dropping for 3+ consecutive months, increase investment in growth sectors immediately.',
    icon: 'TrendingUp',
  },
  dashboard_popularity_trend: {
    id: 'dashboard_popularity_trend',
    screen: 'dashboard',
    title: 'Popularity Trend',
    description: 'Your approval rating over time. This is the single most important metric for re-election.',
    strategy: 'Popularity below 30% is danger territory — you may face a no-confidence vote or coup risk.',
    icon: 'Heart',
  },

  // ── Budget ──
  budget_overview: {
    id: 'budget_overview',
    screen: 'budget',
    title: 'National Budget',
    description: 'Zimbabwe\'s annual budget allocation across 17 categories. Revenue comes from taxes, mining, and exports.',
    strategy: 'Balance spending between essential services and growth investment. Running a deficit increases debt.',
    icon: 'DollarSign',
  },
  budget_sliders: {
    id: 'budget_sliders',
    screen: 'budget',
    title: 'Budget Allocation',
    description: 'Drag sliders to re-allocate funds between categories. Changes take effect after you click "Allocate Budget".',
    strategy: 'Don\'t starve any one sector. Underfunded healthcare or water leads to crises that cost more to fix later.',
    icon: 'DollarSign',
  },
  allocate_button: {
    id: 'allocate_button',
    screen: 'budget',
    title: 'Allocate Budget',
    description: 'Locks in your budget choices for this turn. Revenue is collected and spending is distributed.',
    strategy: 'Review your deficit/surplus before allocating. A small deficit is OK, but persistent deficits spiral into debt crisis.',
    icon: 'Check',
  },

  // ── Infrastructure ──
  infrastructure_projects: {
    id: 'infrastructure_projects',
    screen: 'infrastructure',
    title: 'Infrastructure Projects',
    description: 'Proposed development projects. Each has a cost, duration, and expected impact on provinces.',
    strategy: 'Prioritize projects in provinces with lowest satisfaction. Roads and power projects have the widest impact.',
    icon: 'Building2',
  },
  approve_project: {
    id: 'approve_project',
    screen: 'infrastructure',
    title: 'Approve Project',
    description: 'Starts construction on a project. Costs are deducted from the budget and the project runs for its stated duration.',
    strategy: 'Only approve projects you can afford. Too many concurrent projects stretch resources thin.',
    icon: 'Check',
  },

  // ── Politics ──
  parliament: {
    id: 'parliament',
    screen: 'politics',
    title: 'Parliament',
    description: 'Your parliamentary majority determines how easily you can pass legislation. A strong majority gives you more power.',
    strategy: 'Keep your majority above 50%. If opposition gains ground, political risk increases significantly.',
    icon: 'Landmark',
  },
  factions: {
    id: 'factions',
    screen: 'politics',
    title: 'Political Factions',
    description: 'Power groups within your party. Each faction has its own agenda and influence level.',
    strategy: 'Keep factions satisfied by allocating budget to their preferred sectors. Angry factions can destabilize your government.',
    icon: 'Users',
  },
  legitimacy: {
    id: 'legitimacy',
    screen: 'politics',
    title: 'Government Legitimacy',
    description: 'How legitimate citizens perceive your government. Low legitimacy leads to protests and reduced cooperation.',
    strategy: 'Fight corruption, deliver on promises, and handle crises transparently to maintain legitimacy.',
    icon: 'ShieldAlert',
  },

  // ── Ministers ──
  ministers_cabinet: {
    id: 'ministers_cabinet',
    screen: 'ministers',
    title: 'Cabinet Ministers',
    description: 'Your 12 ministers each manage a government portfolio. Their competence affects how well their sector performs.',
    strategy: 'Fire corrupt or incompetent ministers promptly. Good ministers boost sector performance by up to 15%.',
    icon: 'Users',
  },
  fire_minister: {
    id: 'fire_minister',
    screen: 'ministers',
    title: 'Fire Minister',
    description: 'Removes a minister from their position. This may anger their faction and reduce your political influence.',
    strategy: 'Only fire ministers with very low loyalty or very high corruption. A replacement will appear eventually.',
    icon: 'X',
  },

  // ── Energy ──
  energy_overview: {
    id: 'energy_overview',
    screen: 'energy',
    title: 'Energy Sector',
    description: 'Zimbabwe\'s power generation mix: hydroelectric, coal, solar, wind, diesel, and imports.',
    strategy: 'Diversify energy sources. Over-reliance on hydro (Kariba) is risky during droughts.',
    icon: 'Zap',
  },
  load_shedding_screen: {
    id: 'load_shedding_screen',
    screen: 'energy',
    title: 'Load Shedding Stages',
    description: 'Higher stages mean more power cuts. Stage 1 = minor, Stage 8 = severe (12+ hours/day).',
    strategy: 'Invest in new generation capacity and maintain existing plants to prevent load shedding increases.',
    icon: 'Zap',
  },
  hydroelectric: {
    id: 'hydroelectric',
    screen: 'energy',
    title: 'Kariba Dam (Hydroelectric)',
    description: 'Zimbabwe\'s largest power source. Output depends on water levels which fluctuate with rainfall.',
    strategy: 'During drought years, ensure alternative power sources are online. Budget for dam maintenance.',
    icon: 'Droplets',
  },

  // ── Water ──
  water_overview: {
    id: 'water_overview',
    screen: 'water',
    title: 'Water System',
    description: 'Clean water access, treatment capacity, and dam levels across all provinces.',
    strategy: 'Invest in water treatment and distribution. Water crises cause disease outbreaks and mass discontent.',
    icon: 'Droplets',
  },
  dam_levels: {
    id: 'dam_levels',
    screen: 'water',
    title: 'Dam Levels',
    description: 'Water reserves in major dams. Low levels affect both water supply and hydroelectric power.',
    strategy: 'Monitor dam levels closely during dry season. Budget for water infrastructure before crisis hits.',
    icon: 'Droplets',
  },

  // ── Map ──
  province_overview: {
    id: 'province_overview',
    screen: 'map',
    title: 'Provinces',
    description: 'Zimbabwe\'s 10 provinces, each with unique demographics, infrastructure, and political leanings.',
    strategy: 'Click a province to see detailed stats. Focus development on provinces with lowest satisfaction first.',
    icon: 'Map',
  },
  province_support: {
    id: 'province_support',
    screen: 'map',
    title: 'Province Support',
    description: 'How much each province supports your government. Critical for election predictions.',
    strategy: 'Provinces with low support are at risk of opposition gains. Target infrastructure projects there.',
    icon: 'Vote',
  },

  // ── Events ──
  events_pending: {
    id: 'events_pending',
    screen: 'events',
    title: 'Pending Events',
    description: 'Crisis situations requiring your immediate decision. Events have time-sensitive consequences.',
    strategy: 'Always resolve events promptly. Ignoring events makes them worse and can cascade into multiple crises.',
    icon: 'AlertTriangle',
  },

  // ── News ──
  news_feed: {
    id: 'news_feed',
    screen: 'news',
    title: 'National News',
    description: 'Generated news articles reflecting the state of Zimbabwe. News affects public opinion.',
    strategy: 'Good news boosts popularity, bad news hurts it. The news is influenced by your actual performance.',
    icon: 'Newspaper',
  },

  // ── Elections ──
  election_countdown: {
    id: 'election_countdown',
    screen: 'elections',
    title: 'Election Countdown',
    description: 'Time remaining until the next national election. Prepare your campaign early!',
    strategy: 'Start boosting popularity at least 6 months before elections. Last-minute changes are rarely enough.',
    icon: 'Vote',
  },
  campaign_fund: {
    id: 'campaign_fund',
    screen: 'elections',
    title: 'Campaign Fund',
    description: 'Money available for election campaigning. More funds = better voter outreach.',
    strategy: 'Allocate budget to your campaign fund in the months leading up to the election.',
    icon: 'DollarSign',
  },
};

// ═══════════════════════════════════════════════════════
// FONT SIZE MAP — Maps size setting to CSS root variable
// ═══════════════════════════════════════════════════════

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

// ═══════════════════════════════════════════════════════
// HOVER TIP COMPONENT
// Uses position:fixed + getBoundingClientRect to escape overflow:auto clipping.
// Always renders wrapper div to prevent layout shift when toggling.
// ═══════════════════════════════════════════════════════

function HoverTip({ tipId, children, screenId }: { tipId: string; children: React.ReactNode; screenId?: GameScreen }) {
  const { enableTips, currentScreen } = useGameStore();
  const { getTip } = useTranslation();
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, arrowSide: 'top' as 'top' | 'bottom' });
  const gameTip = GAME_TIPS[tipId];
  const isActive = enableTips && gameTip && (!gameTip.screen || gameTip.screen === screenId || gameTip.screen === currentScreen);
  const tip = getTip(tipId);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Check if tip should render at all
  // isActive already computed above using gameTip for screen check, tip for display

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tipWidth = 320; // w-80 = 20rem = 320px
    const tipHeight = 180; // approximate
    const gap = 8;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Prefer showing above, but flip below if no room
    const showAbove = rect.top > tipHeight + gap + 50; // 50px buffer for header
    const arrowSide = showAbove ? 'top' : 'bottom';

    let top: number;
    if (showAbove) {
      top = rect.top - tipHeight - gap;
    } else {
      top = rect.bottom + gap;
    }

    // Center horizontally, but clamp to viewport edges
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    left = Math.max(8, Math.min(left, viewportWidth - tipWidth - 8));

    setCoords({ top: Math.max(4, top), left, arrowSide });
  }, []);

  const handleEnter = useCallback(() => {
    if (!isActive) return;
    updatePosition();
    setShow(true);
  }, [isActive, updatePosition]);

  const handleLeave = useCallback(() => setShow(false), []);

  // Update position on scroll / resize while visible
  useEffect(() => {
    if (!show) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [show, updatePosition]);

  return (
    <div
      ref={triggerRef}
      className="contents"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      <AnimatePresence>
        {show && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: 320, zIndex: 9999 }}
            className="pointer-events-none"
          >
            <div className="bg-popover border border-border rounded-lg shadow-xl p-3.5 text-left">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/15 text-amber-500 shrink-0">
                  <Lightbulb className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">{tip.title}</h4>
              </div>
              {/* Description */}
              <p className="text-[0.6875rem] text-muted-foreground leading-relaxed mb-2">{tip.description}</p>
              {/* Strategy */}
              <div className="border-t border-border/50 pt-2">
                <div className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[0.625rem] text-amber-600 font-medium leading-relaxed">{tip.strategy}</p>
                </div>
              </div>
            </div>
            {/* Arrow */}
            {coords.arrowSide === 'bottom' ? (
              <div className="absolute bottom-full left-[var(--arrow-x)] -translate-x-1/2 -mb-px">
                <div className="w-2 h-2 bg-popover border-l border-t border-border rotate-45" />
              </div>
            ) : (
              <div className="absolute top-full left-[var(--arrow-x)] -translate-x-1/2 -mt-px">
                <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════

function DashboardScreen() {
  const { gameState, historicalData, setScreen } = useGameStore();
  const { t } = useTranslation();
  if (!gameState) return null;

  const { player, economic, energy, water, infrastructure, citizenSatisfaction, national, corruption } = gameState;
  const recentHistory = historicalData.slice(-12);
  const recentNews = gameState.newsHistory.slice(0, 5);
  const activeEvents = gameState.events.filter(e => !e.resolved).slice(0, 3);
  const activeProjects = gameState.projects.filter(p => p.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Player Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HoverTip tipId="popularity"><div><AnimatedStatCard label={t('dash.popularity')} value={`${player.popularity.toFixed(0)}%`} numericValue={player.popularity} icon={<Heart className="h-4 w-4" />} color={player.popularity > 50 ? 'text-green-500' : player.popularity > 30 ? 'text-yellow-500' : 'text-red-500'} index={0} /></div></HoverTip>
        <HoverTip tipId="gdp"><div><AnimatedStatCard label={t('dash.gdpGrowth')} value={`${economic.gdpGrowth.toFixed(1)}%`} numericValue={economic.gdpGrowth} icon={<TrendingUp className="h-4 w-4" />} color={economic.gdpGrowth > 3 ? 'text-green-500' : economic.gdpGrowth > 0 ? 'text-yellow-500' : 'text-red-500'} index={1} /></div></HoverTip>
        <HoverTip tipId="inflation"><div><AnimatedStatCard label={t('dash.inflation')} value={`${economic.inflation.toFixed(1)}%`} numericValue={economic.inflation} icon={<Flame className="h-4 w-4" />} color={economic.inflation < 15 ? 'text-green-500' : economic.inflation < 30 ? 'text-yellow-500' : 'text-red-500'} index={2} /></div></HoverTip>
        <HoverTip tipId="satisfaction"><div><AnimatedStatCard label={t('dash.satisfaction')} value={`${citizenSatisfaction.overall.toFixed(0)}%`} numericValue={citizenSatisfaction.overall} icon={<Star className="h-4 w-4" />} color={citizenSatisfaction.overall > 50 ? 'text-green-500' : citizenSatisfaction.overall > 30 ? 'text-yellow-500' : 'text-red-500'} index={3} /></div></HoverTip>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HoverTip tipId="dashboard_economic" screenId="dashboard"><div><AnimatedMetricCard title={t('dash.economicIndicators')} index={0} items={[
          { label: t('dash.gdp'), value: `$${economic.gdp.toFixed(1)}B` },
          { label: t('dash.unemployment'), value: `${economic.unemploymentRate.toFixed(1)}%` },
          { label: t('dash.exchangeRate'), value: `${economic.exchangeRate.toLocaleString()} ZWL/USD` },
          { label: t('dash.debtGdp'), value: `${economic.debtToGdp.toFixed(0)}%` },
          { label: t('dash.investorConfidence'), value: `${economic.investorConfidence.toFixed(0)}` },
          { label: t('dash.informalEconomy'), value: `${economic.informalEconomySize.toFixed(0)}%` },
        ]} /></div></HoverTip>
        <HoverTip tipId="dashboard_infrastructure" screenId="dashboard"><div><AnimatedMetricCard title={t('dash.infrastructure')} index={1} items={[
          { label: t('dash.roadQuality'), value: `${infrastructure.roadQuality.toFixed(0)}/100` },
          { label: t('dash.waterReliability'), value: `${infrastructure.waterReliability.toFixed(0)}/100` },
          { label: t('dash.electricity'), value: `${infrastructure.electricityAvailability.toFixed(0)}/100` },
          { label: t('dash.internet'), value: `${infrastructure.internetPenetration.toFixed(0)}%` },
          { label: t('dash.loadShedding'), value: `${energy.loadSheddingHoursPerDay.toFixed(1)} hrs/day` },
          { label: t('dash.housingBacklog'), value: `${(infrastructure.housingBacklog / 1000).toFixed(0)}K units` },
        ]} /></div></HoverTip>
        <AnimatedMetricCard title="SOCIAL INDICATORS" index={2} items={[
          { label: 'Population', value: `${(national.population / 1e6).toFixed(1)}M` },
          { label: 'Literacy', value: `${national.literacyRate.toFixed(0)}%` },
          { label: 'Life Expectancy', value: `${national.lifeExpectancy.toFixed(0)} yrs` },
          { label: 'Urban Pop.', value: `${national.urbanPopulation.toFixed(0)}%` },
          { label: 'Youth Unemployment', value: `${economic.youthUnemployment.toFixed(0)}%` },
          { label: 'Schools', value: `${gameState.publicServices.schools.toFixed(0)}/100` },
        ]} />
        <HoverTip tipId="legitimacy" screenId="dashboard"><div><AnimatedMetricCard title="GOVERNANCE" index={3} items={[
          { label: 'Corruption Index', value: `${corruption.nationalLevel.toFixed(0)}/100` },
          { label: 'Legitimacy', value: `${player.legitimacy.toFixed(0)}/100` },
          { label: 'Parliament Seats', value: `${gameState.parliament.rulingPartySeats}/${gameState.parliament.totalSeats}` },
          { label: 'Dam Level', value: `${energy.damLevel.toFixed(0)}%` },
          { label: 'Water Reservoirs', value: `${water.reservoirLevels.toFixed(0)}%` },
          { label: 'Funds Lost to Corruption', value: `$${corruption.fundsLostToCorruption.toFixed(0)}M/mo` },
        ]} /></div></HoverTip>
      </div>

      {/* Quick Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GDP Trend */}
        <HoverTip tipId="dashboard_gdp_trend" screenId="dashboard"><div><TrendCard
          title="GDP TREND"
          data={recentHistory.map(h => ({ label: `${h.month}/${h.year.toString().slice(2)}`, value: h.gdp }))}
          color="#4CAF50"
          formatValue={(v) => `$${v.toFixed(1)}B`}
        /></div></HoverTip>
        <HoverTip tipId="dashboard_popularity_trend" screenId="dashboard"><div><TrendCard
          title="POPULARITY TREND"
          data={recentHistory.map(h => ({ label: `${h.month}/${h.year.toString().slice(2)}`, value: h.popularity }))}
          color={player.popularity > 50 ? '#4CAF50' : '#f44336'}
          formatValue={(v) => `${v.toFixed(0)}%`}
        /></div></HoverTip>
      </div>

      {/* Active Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent News */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Latest News</h3>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {recentNews.map((article) => (
                <div key={article.id} className="pb-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={article.isBreaking ? 'destructive' : article.sentiment === 'positive' ? 'default' : article.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-[0.625rem] px-1.5 py-0">
                      {article.isBreaking ? 'BREAKING' : article.category}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{article.headline}</p>
                  <p className="text-xs text-muted-foreground mt-1">{article.subheadline}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Active Events */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Active Events</h3>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {activeEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active events this month.</p>
              ) : activeEvents.map((event) => (
                <div key={event.id} className="pb-3 border-b border-border/50 last:border-0">
                  <Badge variant={event.severity === 'crisis' ? 'destructive' : event.severity === 'major' ? 'default' : 'secondary'} className="text-[0.625rem] px-1.5 py-0 mb-1">
                    {event.severity.toUpperCase()}
                  </Badge>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Active Projects */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Active Projects</h3>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active projects. Visit Infrastructure to start new projects.</p>
              ) : activeProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="pb-3 border-b border-border/50 last:border-0">
                  <p className="text-sm font-medium">{project.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{project.progress.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BUDGET SCREEN
// ═══════════════════════════════════════════════════════

function BudgetScreen() {
  const { gameState, updateBudget, allocateBudget } = useGameStore();
  const [localBudget, setLocalBudget] = useState<Record<string, number>>(() => {
    if (!gameState) return {};
    return Object.fromEntries(gameState.budget.items.map(i => [i.category, i.allocated]));
  });

  // Sync when game state changes (but not via setState in effect body)
  const lastTurn = gameState?.player.turn ?? 0;
  const [prevTurn, setPrevTurn] = useState(lastTurn);
  if (lastTurn !== prevTurn && gameState) {
    setPrevTurn(lastTurn);
    const map = Object.fromEntries(gameState.budget.items.map(i => [i.category, i.allocated]));
    setLocalBudget(map);
  }

  if (!gameState) return null;
  const { budget, economic } = gameState;
  const totalAllocated = Object.values(localBudget).reduce((s, v) => s + v, 0);
  const deficit = totalAllocated - budget.totalRevenue;
  const revenuePerCategory = budget.totalRevenue / budget.items.length;

  const handleAllocate = () => {
    Object.entries(localBudget).forEach(([cat, amt]) => updateBudget(cat, amt));
    allocateBudget();
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <HoverTip tipId="budget_overview" screenId="budget"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={`$${budget.totalRevenue.toLocaleString()}M`} icon={<DollarSign className="h-4 w-4" />} color="text-green-500" />
        <StatCard label="Allocated" value={`$${totalAllocated.toLocaleString()}M`} icon={<DollarSign className="h-4 w-4" />} color={deficit > 0 ? 'text-red-500' : 'text-green-500'} />
        <StatCard label="Deficit" value={`$${deficit.toLocaleString()}M`} icon={<AlertTriangle className="h-4 w-4" />} color={deficit > 0 ? 'text-red-500' : 'text-green-500'} />
        <StatCard label="GDP" value={`$${economic.gdp.toFixed(1)}B`} icon={<TrendingUp className="h-4 w-4" />} color={economic.gdpGrowth > 0 ? 'text-green-500' : 'text-red-500'} />
      </div></HoverTip>

      <div className="flex justify-end">
        <HoverTip tipId="allocate_button" screenId="budget"><Button onClick={handleAllocate} size="sm" className="bg-amber-600 hover:bg-amber-700">
          <Check className="h-4 w-4 mr-1" /> Allocate Budget
        </Button></HoverTip>
      </div>

      {/* Budget Items */}
      <HoverTip tipId="budget_sliders" screenId="budget"><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {budget.items.map((item) => {
          const pct = (localBudget[item.category] || 0) / budget.totalRevenue * 100;
          const meetsMin = (localBudget[item.category] || 0) >= item.minimumRequired;
          return (
            <div key={item.category} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold">{item.displayName}</h4>
                    <p className="text-[0.625rem] text-muted-foreground">Min: ${item.minimumRequired}M | Rec: ${item.recommended}M</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${!meetsMin ? 'text-red-500' : ''}`}>
                    ${localBudget[item.category]?.toLocaleString() || 0}M
                  </span>
                  <p className="text-[0.625rem] text-muted-foreground">{pct.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mb-1">
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={10}
                  value={localBudget[item.category] || 0}
                  onChange={(e) => setLocalBudget(prev => ({ ...prev, [item.category]: Number(e.target.value) }))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <div className="flex items-center gap-3 text-[0.625rem] text-muted-foreground">
                <span>Efficiency: {item.efficiency}%</span>
                <span>Corruption: {item.corruptionLeakage}%</span>
                {!meetsMin && <Badge variant="destructive" className="text-[0.5625rem] px-1">Below Min</Badge>}
              </div>
            </div>
          );
        })}
      </div></HoverTip>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// INFRASTRUCTURE SCREEN

function InfrastructureScreen() {
  const { gameState, approveProject, availableProjects } = useGameStore();
  if (!gameState) return null;

  const activeProjects = gameState.projects.filter(p => p.status === 'in_progress');
  const completedProjects = gameState.projects.filter(p => p.status === 'completed').slice(-5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Projects" value={`${activeProjects.length}`} icon={<Building2 className="h-4 w-4" />} color="text-amber-500" />
        <StatCard label="Completed" value={`${gameState.projects.filter(p => p.status === 'completed').length}`} icon={<Trophy className="h-4 w-4" />} color="text-green-500" />
        <StatCard label="Total Invested" value={`$${gameState.projects.reduce((s, p) => s + p.cost, 0).toLocaleString()}M`} icon={<DollarSign className="h-4 w-4" />} color="text-blue-500" />
        <StatCard label="Jobs Created" value={`${gameState.projects.reduce((s, p) => s + p.employmentCreated, 0).toLocaleString()}`} icon={<Users className="h-4 w-4" />} color="text-green-500" />
      </div>

      {/* Available Projects */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Available Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableProjects.map((project) => (
            <div key={project.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold">{project.name}</h4>
                  <Badge variant="secondary" className="text-[0.625rem] mt-1">{project.category}</Badge>
                </div>
                <Button size="sm" onClick={() => approveProject(project.id)} className="bg-amber-600 hover:bg-amber-700 text-xs">
                  Approve
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{project.description}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground">Cost:</span> <span className="font-bold">${project.cost}M</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-bold">{project.completionTime} mo</span></div>
                <div><span className="text-muted-foreground">Jobs:</span> <span className="font-bold">{project.employmentCreated.toLocaleString()}</span></div>
              </div>
              <div className="flex gap-3 mt-2 text-[0.625rem] text-muted-foreground">
                <span>Popularity: {project.politicalPopularity > 0 ? '+' : ''}{project.politicalPopularity}</span>
                <span>Economic: {project.economicImpact > 0 ? '+' : ''}{project.economicImpact}</span>
                <span>Corruption Risk: {project.corruptionRisk}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> In Progress
        </h3>
        <div className="space-y-2">
          {activeProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects currently in progress.</p>
          ) : activeProjects.map((project) => (
            <div key={project.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-bold">{project.name}</h4>
                  <p className="text-xs text-muted-foreground">{project.province}</p>
                </div>
                <div className="w-32">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{project.progress.toFixed(0)}%</span>
                    <span>{project.completionTime - Math.floor(project.progress / (100 / project.completionTime))} mo left</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// POLITICS SCREEN
// ═══════════════════════════════════════════════════════

function PoliticsScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { parliament, factions, bills, player } = gameState;

  return (
    <div className="space-y-6">
      {/* Parliament Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-amber-500" /> Parliament
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <StatCard label="Total Seats" value={`${parliament.totalSeats}`} color="text-foreground" />
          <StatCard label="Ruling Party" value={`${parliament.rulingPartySeats}`} color="text-amber-500" />
          <StatCard label="Opposition" value={`${parliament.oppositionSeats}`} color="text-red-500" />
          <StatCard label="Public Support" value={`${parliament.publicSupportForGovernment.toFixed(0)}%`} color={parliament.publicSupportForGovernment > 50 ? 'text-green-500' : 'text-red-500'} />
          <StatCard label="MP Satisfaction" value={`${parliament.mpSatisfaction.toFixed(0)}%`} color="text-blue-500" />
        </div>

        {/* Parliament Seat Visualization */}
        <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
          <div className="bg-amber-500 rounded-l-md flex items-center justify-center" style={{ width: `${parliament.rulingPartySeats / parliament.totalSeats * 100}%` }}>
            <span className="text-[0.625rem] font-bold text-black">{parliament.rulingPartySeats}</span>
          </div>
          <div className="bg-red-500 flex items-center justify-center" style={{ width: `${parliament.oppositionSeats / parliament.totalSeats * 100}%` }}>
            <span className="text-[0.625rem] font-bold">{parliament.oppositionSeats}</span>
          </div>
          <div className="bg-gray-400 rounded-r-md flex items-center justify-center" style={{ width: `${parliament.independentSeats / parliament.totalSeats * 100}%` }}>
            <span className="text-[0.625rem] font-bold">{parliament.independentSeats}</span>
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-[0.625rem] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Ruling Party</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Opposition</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Independent</span>
        </div>
      </div>

      {/* Factions */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Political Factions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {factions.map((faction) => (
            <div key={faction.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold">{faction.name}</h4>
                <Badge variant={
                  faction.stance === 'ally' ? 'default' :
                  faction.stance === 'neutral' ? 'secondary' :
                  faction.stance === 'opponent' ? 'destructive' : 'destructive'
                }>
                  {faction.stance.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{faction.ideology}</p>
              <p className="text-[0.625rem] text-muted-foreground">Leader: {faction.leaderName}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Support</span>
                  <span>{faction.supportLevel.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${faction.supportLevel}%`,
                      backgroundColor: faction.stance === 'ally' ? '#4CAF50' : faction.stance === 'neutral' ? '#FF9800' : '#f44336',
                    }}
                  />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {faction.demands.map((demand, i) => (
                  <div key={i} className="text-[0.625rem] text-muted-foreground flex items-center gap-1">
                    <ChevronRight className="h-2 w-2" /> {demand}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MINISTERS SCREEN
// ═══════════════════════════════════════════════════════

function MinistersScreen() {
  const { gameState, fireMinister } = useGameStore();
  if (!gameState) return null;

  const activeMinisters = gameState.ministers.filter(m => m.isActive);
  const inactiveMinisters = gameState.ministers.filter(m => !m.isActive);

  return (
    <div className="space-y-6">
      <HoverTip tipId="ministers_cabinet" screenId="ministers"><div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Active Cabinet ({activeMinisters.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeMinisters.map((minister) => (
            <div key={minister.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold">{minister.name}</h4>
                  <Badge variant="secondary" className="text-[0.625rem] mt-1">{minister.portfolio}</Badge>
                </div>
                <HoverTip tipId="fire_minister" screenId="ministers"><Button size="sm" variant="destructive" className="text-[0.625rem] px-2 py-0 h-6" onClick={() => fireMinister(minister.id)}>
                  Fire
                </Button></HoverTip>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <MiniStat label="Competence" value={minister.competence} />
                <MiniStat label="Loyalty" value={minister.loyalty} />
                <MiniStat label="Corruption" value={minister.corruption} inverted />
                <MiniStat label="Popularity" value={minister.popularity} />
              </div>
              <p className="text-[0.625rem] text-muted-foreground mt-2">Faction: {minister.faction} | Age: {minister.age}</p>
            </div>
          ))}
        </div>
      </div></HoverTip>

      {inactiveMinisters.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground">Dismissed Ministers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inactiveMinisters.map((minister) => (
              <div key={minister.id} className="bg-card border border-border/50 rounded-lg p-4 opacity-50">
                <h4 className="text-sm font-bold">{minister.name} — {minister.portfolio}</h4>
                <p className="text-[0.625rem] text-muted-foreground">Previously dismissed</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ENERGY SCREEN
// ═══════════════════════════════════════════════════════

function EnergyScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { energy } = gameState;
  const totalOutput = Object.values(energy.sources).reduce((s, src) => s + src.output, 0);

  return (
    <div className="space-y-6">
      <HoverTip tipId="energy_overview" screenId="energy"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Demand" value={`${energy.totalDemand.toLocaleString()} MW`} icon={<Zap className="h-4 w-4" />} color="text-amber-500" />
        <StatCard label="Supply" value={`${energy.totalSupply.toLocaleString()} MW`} icon={<Zap className="h-4 w-4" />} color={energy.totalSupply >= energy.totalDemand ? 'text-green-500' : 'text-red-500'} />
        <StatCard label="Deficit" value={`${energy.deficit.toLocaleString()} MW`} icon={<AlertTriangle className="h-4 w-4" />} color={energy.deficit > 0 ? 'text-red-500' : 'text-green-500'} />
        <StatCard label="Load Shedding" value={`${energy.loadSheddingHoursPerDay.toFixed(1)} hrs/day`} icon={<Clock className="h-4 w-4" />} color={energy.loadSheddingHoursPerDay < 4 ? 'text-green-500' : energy.loadSheddingHoursPerDay < 8 ? 'text-yellow-500' : 'text-red-500'} />
      </div></HoverTip>

      {/* Load Shedding Stages */}
      <HoverTip tipId="load_shedding_screen" screenId="energy"><div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">LOAD SHEDDING STAGE: {energy.loadSheddingStage}</h3>
        <div className="flex gap-1 mb-2">
          {[0,1,2,3,4,5,6,7,8].map(stage => (
            <div
              key={stage}
              className={`flex-1 h-8 rounded flex items-center justify-center text-[0.625rem] font-bold ${
                stage <= energy.loadSheddingStage
                  ? stage <= 2 ? 'bg-green-500/80 text-white' : stage <= 5 ? 'bg-yellow-500/80 text-black' : 'bg-red-500/80 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              S{stage}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Stage {energy.loadSheddingStage}: {energy.loadSheddingHoursPerDay.toFixed(0)} hours of load shedding per day
          {energy.loadSheddingStage >= 6 && ' — CRITICAL: Major economic disruption'}
          {energy.loadSheddingStage >= 3 && energy.loadSheddingStage < 6 && ' — Businesses severely affected'}
          {energy.loadSheddingStage < 3 && ' — Managed load shedding'}
        </p>
      </div></HoverTip>

      {/* Power Sources */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Power Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(energy.sources).map(([source, data]) => (
            <div key={source} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold capitalize">{source.replace('_', ' ')}</h4>
                <span className="text-sm font-bold">{data.output.toLocaleString()} / {data.capacity.toLocaleString()} MW</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${data.output / data.capacity > 0.7 ? 'bg-green-500' : data.output / data.capacity > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(data.output / data.capacity) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[0.625rem] text-muted-foreground">
                <span>Reliability: {data.reliability}%</span>
                <span>Cost: ${data.costPerMW}/MW</span>
                <span>Env: {data.environmentalImpact}/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dam Levels */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Hydroelectric System</h3>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Dam Level" value={energy.damLevel} suffix="%" />
          <MiniStat label="Rainfall Index" value={energy.rainfallIndex} suffix="%" />
          <MiniStat label="Maintenance Backlog" value={energy.maintenanceBacklog} suffix="%" inverted />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Renewable Energy</span>
            <span>{energy.renewablePercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${energy.renewablePercentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WATER SCREEN
// ═══════════════════════════════════════════════════════

function WaterScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const { water } = gameState;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Demand" value={`${water.totalDemand.toLocaleString()} ML/day`} icon={<Droplets className="h-4 w-4" />} color="text-blue-500" />
        <StatCard label="Supply" value={`${water.totalSupply.toLocaleString()} ML/day`} icon={<Droplets className="h-4 w-4" />} color={water.totalSupply >= water.totalDemand ? 'text-green-500' : 'text-red-500'} />
        <StatCard label="Reservoir" value={`${water.reservoirLevels.toFixed(0)}%`} icon={<Droplets className="h-4 w-4" />} color={water.reservoirLevels > 50 ? 'text-green-500' : water.reservoirLevels > 25 ? 'text-yellow-500' : 'text-red-500'} />
        <StatCard label="Urban Access" value={`${water.urbanAccess.toFixed(0)}%`} icon={<Users className="h-4 w-4" />} color={water.urbanAccess > 70 ? 'text-green-500' : 'text-yellow-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Water Quality</h3>
          <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full ${water.waterQuality > 60 ? 'bg-green-500' : water.waterQuality > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${water.waterQuality}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MiniStat label="Treatment Capacity" value={water.treatmentCapacity} suffix="%" />
            <MiniStat label="Pipeline Condition" value={water.pipelineCondition} suffix="%" />
            <MiniStat label="Leakage Rate" value={water.leakageRate} suffix="%" inverted />
            <MiniStat label="Sewer Condition" value={water.sewerCondition} suffix="%" inverted />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Access & Risk</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Urban Access</span><span>{water.urbanAccess.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${water.urbanAccess}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Rural Access</span><span>{water.ruralAccess.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${water.ruralAccess}%` }} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Drought Risk" value={water.droughtRisk} suffix="%" inverted />
              <MiniStat label="Flooding Risk" value={water.floodingRisk} suffix="%" inverted />
              <MiniStat label="Boreholes" value={water.boreholeCount} />
              <MiniStat label="Deficit" value={water.deficit} suffix=" ML/day" inverted />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EVENTS SCREEN
// ═══════════════════════════════════════════════════════

function EventsScreen() {
  const { gameState, setShowEventModal } = useGameStore();
  if (!gameState) return null;

  const unresolvedEvents = gameState.events.filter(e => !e.resolved);
  const resolvedEvents = gameState.events.filter(e => e.resolved).slice(-10).reverse();

  return (
    <div className="space-y-6">
      <HoverTip tipId="events_pending" screenId="events"><div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" /> Pending Events ({unresolvedEvents.length})
        </h3>
        <div className="space-y-3">
          {unresolvedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending events. End turn to see what happens next.</p>
          ) : unresolvedEvents.map((event) => (
            <div key={event.id} className="bg-card border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={event.severity === 'crisis' ? 'destructive' : event.severity === 'major' ? 'default' : 'secondary'}>
                  {event.severity.toUpperCase()}
                </Badge>
                <Badge variant="secondary" className="text-[0.625rem]">{event.category}</Badge>
              </div>
              <h4 className="text-sm font-bold mb-1">{event.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{event.description}</p>
              {event.choices && event.choices.length > 0 && (
                <Button size="sm" onClick={() => setShowEventModal(event)} className="bg-amber-600 hover:bg-amber-700">
                  Make Decision
                </Button>
              )}
            </div>
          ))}
        </div>
      </div></HoverTip>

      <Separator />

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground">Resolved Events</h3>
        <div className="space-y-2">
          {resolvedEvents.map((event) => (
            <div key={event.id} className="bg-card border border-border/50 rounded-lg p-3 opacity-70">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium">{event.title}</span>
                <span className="text-[0.625rem] text-muted-foreground">{MONTH_NAMES[event.month - 1]} {event.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAP SCREEN
// ═══════════════════════════════════════════════════════

function MapScreen() {
  const { gameState, selectProvince } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Province Grid Map */}
        <HoverTip tipId="province_overview" screenId="map"><div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">PROVINCES</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
              {gameState.provinces.map((province) => (
                <button
                  key={province.id}
                  onClick={() => selectProvince(province.id)}
                  className="bg-muted hover:bg-muted/80 border border-border rounded-lg p-4 text-left transition-colors"
                >
                  <h4 className="text-sm font-bold">{province.name}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[0.625rem]">
                    <span>Pop: {(province.population / 1e6).toFixed(1)}M</span>
                    <span>Urban: {province.urbanization.toFixed(0)}%</span>
                    <span>Support: {province.politicalSupport.toFixed(0)}%</span>
                    <span>Happy: {province.satisfactionIndex.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${province.satisfactionIndex}%`,
                        backgroundColor: province.satisfactionIndex > 50 ? '#4CAF50' : province.satisfactionIndex > 30 ? '#FF9800' : '#f44336',
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div></HoverTip>

        {/* Province Details */}
        <HoverTip tipId="province_support" screenId="map"><div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">PROVINCE COMPARISON</h3>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {gameState.provinces.map((province) => (
                <div key={province.id} className="pb-3 border-b border-border/50 last:border-0">
                  <h4 className="text-xs font-bold mb-1">{province.name}</h4>
                  <div className="grid grid-cols-2 gap-1 text-[0.625rem] text-muted-foreground">
                    <span>Health: {province.healthIndex.toFixed(0)}</span>
                    <span>Education: {province.educationIndex.toFixed(0)}</span>
                    <span>Infrastructure: {province.infrastructureIndex.toFixed(0)}</span>
                    <span>Safety: {province.safetyIndex.toFixed(0)}</span>
                    <span>Poverty: {province.povertyRate.toFixed(0)}%</span>
                    <span>Unemployment: {province.unemploymentRate.toFixed(0)}%</span>
                    <span>Agri: {province.agriculturalOutput}</span>
                    <span>Mining: {province.miningOutput}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div></HoverTip>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEWS SCREEN
// ═══════════════════════════════════════════════════════

function NewsScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="space-y-4">
      <HoverTip tipId="news_feed" screenId="news"><h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-amber-500" /> National News Feed
      </h3></HoverTip>
      <div className="space-y-3">
        {gameState.newsHistory.map((article) => (
          <div key={article.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={article.isBreaking ? 'destructive' : article.sentiment === 'positive' ? 'default' : article.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-[0.625rem]">
                {article.isBreaking ? 'BREAKING' : article.sentiment.toUpperCase()}
              </Badge>
              <span className="text-[0.625rem] text-muted-foreground">{MONTH_NAMES[article.month - 1]} {article.year}</span>
            </div>
            <h4 className="text-sm font-bold mb-1">{article.headline}</h4>
            <p className="text-xs text-muted-foreground">{article.subheadline}</p>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{article.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ELECTIONS SCREEN
// ═══════════════════════════════════════════════════════

function ElectionsScreen() {
  const { gameState } = useGameStore();
  const { t } = useTranslation();

  const election = gameState ? gameState.elections[gameState.elections.length - 1] : null;

  // Confetti on election win — must be before any early returns (hooks rule)
  useEffect(() => {
    if (!election?.isOver || !election.playerWon) return;
    // Dynamic import for client-side only library
    import('canvas-confetti').then((mod) => {
      const confetti = mod.default;
      const fire = () => {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2E8B37', '#E8A817', '#CC2936', '#FAFAF7'],
        });
      };
      fire();
      setTimeout(fire, 300);
      setTimeout(fire, 700);
    });
  }, [election?.isOver, election?.playerWon]);

  if (!gameState || !election) return null;

  const monthsUntilElection = ((election.year - gameState.player.year) * 12 + election.month - gameState.player.month);
  const turnsUntilElection = Math.max(0, monthsUntilElection);
  const latestPoll = election.polls[election.polls.length - 1];
  const isUrgent = turnsUntilElection <= 0 && !election.isOver;

  return (
    <div className="space-y-6">
      {/* Urgency banner */}
      {isUrgent && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <p className="text-sm font-bold text-red-500">🗳️ THE ELECTION IS HERE!</p>
          <p className="text-xs text-muted-foreground mt-1">The next time you press End Turn, the election will be held. Make sure you're ready!</p>
        </div>
      )}

      <HoverTip tipId="election_countdown" screenId="elections"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Election Type" value={election.type.charAt(0).toUpperCase() + election.type.slice(1)} color="text-amber-500" />
        <StatCard label="Election Date" value={`${MONTH_NAMES[election.month - 1]} ${election.year}`} color="text-foreground" />
        <StatCard label="Turns Until" value={`${turnsUntilElection}`} color={turnsUntilElection < 12 ? 'text-red-500' : 'text-green-500'} />
        <StatCard label="Current Polls" value={`${latestPoll?.playerPercent.toFixed(0) || 48}%`} color={(latestPoll?.playerPercent || 0) > 50 ? 'text-green-500' : 'text-yellow-500'} />
      </div></HoverTip>

      {/* Election Status */}
      {election.isOver && (
        <div className={`rounded-lg p-6 text-center ${election.playerWon ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          {election.playerWon ? (
            <>
              <p className="text-2xl mb-2">🎉</p>
              <h3 className="text-lg font-bold text-green-500">YOU WON THE ELECTION!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You secured {(election.playerVotes / (election.playerVotes + election.opponentVotes) * 100).toFixed(1)}% of the vote.
                Your mandate is renewed!
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-2">😢</p>
              <h3 className="text-lg font-bold text-red-500">YOU LOST THE ELECTION</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The opposition won with {(election.opponentVotes / (election.playerVotes + election.opponentVotes) * 100).toFixed(1)}% of the vote.
                Your presidency is over.
              </p>
            </>
          )}
          {election.isOver && (
            <div className="mt-4 flex justify-center gap-8">
              <div>
                <p className="text-[0.625rem] text-muted-foreground">Your Votes</p>
                <p className="text-lg font-bold text-amber-500">{(election.playerVotes / 1e6).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-[0.625rem] text-muted-foreground">Opposition Votes</p>
                <p className="text-lg font-bold text-red-500">{(election.opponentVotes / 1e6).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-[0.625rem] text-muted-foreground">Turnout</p>
                <p className="text-lg font-bold">{election.turnoutPercent.toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4">Campaign Status</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {election.isOver ? (election.playerWon ? 'Congratulations on your victory! A new election cycle has begun.' : 'The election has been decided. Your time in office is over.') :
           turnsUntilElection > 24 ? 'The next election is still far away. Focus on governance to build popularity.' :
           turnsUntilElection > 12 ? 'Election season approaches. Start planning your campaign strategy.' :
           turnsUntilElection > 6 ? 'Campaign time! Start holding rallies and announcing your manifesto.' :
           turnsUntilElection > 0 ? 'The election is imminent! Final push for votes.' :
           'The election is THIS MONTH. Make every decision count!'}
        </p>

        {/* Polls Chart */}
        <div className="h-40 flex items-end gap-2 mb-4">
          {election.polls.slice(-20).map((poll, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5">
              <div className="flex gap-0.5 items-end h-32">
                <div className="flex-1 bg-amber-500 rounded-t" style={{ height: `${poll.playerPercent}%` }} />
                <div className="flex-1 bg-red-500 rounded-t" style={{ height: `${poll.opponentPercent}%` }} />
              </div>
              <span className="text-[0.5625rem] text-center text-muted-foreground">T{poll.turn}</span>
            </div>
          ))}
        </div>

        {/* Historical Results */}
        {election.historicalResults && (
          <div>
            <h4 className="text-sm font-bold mb-2">Historical Election Results</h4>
            <div className="space-y-2">
              {election.historicalResults.map((result, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-12">{result.year}</span>
                  <div className="flex-1 flex h-4 rounded overflow-hidden">
                    <div className="bg-amber-500 flex items-center justify-center" style={{ width: `${result.playerParty}%` }}>
                      <span className="text-[0.5625rem] font-bold">{result.playerParty}%</span>
                    </div>
                    <div className="bg-red-500 flex items-center justify-center" style={{ width: `${result.opposition}%` }}>
                      <span className="text-[0.5625rem] font-bold">{result.opposition}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Election Tips */}
      {!election.isOver && (
        <div className="bg-card border border-amber-500/20 rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Election Strategy
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Your poll numbers are based on popularity, satisfaction, and legitimacy</li>
            <li>• Keep inflation low and GDP growing to boost your numbers</li>
            <li>• Resolve crises quickly — unresolved events hurt your standing</li>
            {turnsUntilElection <= 6 && <li className="text-red-500 font-bold">• ⚠️ URGENT: Focus all efforts on boosting popularity now!</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GAME OVER SCREEN
// ═══════════════════════════════════════════════════════

function GameOverScreen() {
  const { gameState, resetGame, setShowNewGameDialog } = useGameStore();
  const { t } = useTranslation();
  if (!gameState) return null;

  const { player, economic, citizenSatisfaction, national } = gameState;
  const isElectionLoss = gameState.gameOverReason?.includes('ELECTION');

  const turnsSurvived = player.turn;
  const yearsSurvived = turnsSurvived / 12;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-lg p-8 max-w-lg text-center ${isElectionLoss ? 'bg-card border border-red-500/30' : 'bg-card border border-red-500/30'}`}
      >
        {isElectionLoss ? (
          <div className="text-6xl mb-4">🗳️</div>
        ) : (
          <Skull className="h-16 w-16 text-red-500 mx-auto mb-4" />
        )}
        <h2 className="text-2xl font-bold mb-2">{t('gameOver.title')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{gameState.gameOverReason}</p>

        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.turnsSurvived')}</p>
            <p className="text-lg font-bold">{turnsSurvived}</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.yearsInOffice')}</p>
            <p className="text-lg font-bold">{yearsSurvived.toFixed(1)}</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.finalGDP')}</p>
            <p className="text-lg font-bold">${economic.gdp.toFixed(1)}B</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.finalPopularity')}</p>
            <p className="text-lg font-bold">{player.popularity.toFixed(0)}%</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.population')}</p>
            <p className="text-lg font-bold">{(national.population / 1e6).toFixed(1)}M</p>
          </div>
          <div className="bg-muted rounded p-3">
            <p className="text-[0.625rem] text-muted-foreground">{t('gameOver.satisfaction')}</p>
            <p className="text-lg font-bold">{citizenSatisfaction.overall.toFixed(0)}%</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/70 italic mb-6">
          {t('gameOver.proverb')}
        </p>

        <div className="flex gap-3">
          <Button onClick={() => { resetGame(); setShowNewGameDialog(true); }} className="flex-1 bg-amber-600 hover:bg-amber-700">
            <Gamepad2 className="h-4 w-4 mr-2" /> {t('gameOver.playAgain')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════

function StartScreen() {
  const { startNewGame, setShowNewGameDialog, fontSize, darkMode, setDarkMode, setFontSize, language, setLanguage } = useGameStore();
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [showStartSettings, setShowStartSettings] = useState(false);
  const mountedRef = useRef(false);

  // Mark as mounted and sync dark mode from store to next-themes (one-way)
  useEffect(() => {
    mountedRef.current = true;
    setTheme(darkMode ? 'dark' : 'light');
  }, []);

  // Sync dark mode changes after mount
  useEffect(() => {
    if (!mountedRef.current) return;
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode, setTheme]);

  // Apply font size via CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--mgza-font-size', FONT_SIZE_MAP[fontSize]);
  }, [fontSize]);

  return (
    <div className="flex flex-col min-h-[80vh] bg-gradient-to-b from-[#2E8B37]/5 via-background to-background zim-hero-bg">
      {/* Zimbabwe Flag Stripe Bar */}
      <div className="w-full flex flex-col">
        <div className="w-full h-1" style={{ backgroundColor: '#2E8B37' }} />
        <div className="w-full h-1" style={{ backgroundColor: '#FFFFFF' }} />
        <div className="w-full h-1" style={{ backgroundColor: '#CC2936' }} />
      </div>

      {/* Settings bar */}
      <div className="flex justify-end p-2">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowStartSettings(!showStartSettings)}>
          <Settings className="h-3.5 w-3.5 mr-1.5" /> {t('common.settings')}
        </Button>
      </div>

      {/* Inline Settings Panel */}
      {showStartSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-auto max-w-md w-full px-4 mb-4"
        >
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">{t('common.language')}</span>
              </div>
              <div className="flex gap-1">
                {(['en', 'sn', 'nd'] as import('@/lib/i18n').Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-1 rounded text-[0.625rem] font-medium transition-all ${
                      language === lang
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {LANGUAGE_FLAGS[lang]} {LANGUAGE_NAMES[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">{t('common.darkMode')}</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            {/* Text Size */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">{t('common.textSize')}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      fontSize === size
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                        : 'border-border bg-card hover:border-amber-500/50'
                    }`}
                  >
                    <span className={`block font-bold leading-none ${
                      size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg'
                    }`}>
                      Aa
                    </span>
                    <span className="text-[0.625rem] text-muted-foreground mt-1 block capitalize">{size}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-xl px-4"
        >
          <div className="mb-6">
            <div className="text-6xl mb-4">🇿🇼</div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              <div className="zim-title-shimmer">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2E8B37] to-[#E8A817]">{t('start.title1')}</span><br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E8A817] to-[#2E8B37]">{t('start.title2')}</span><br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2E8B37] to-[#E8A817]">{t('start.title3')}</span>
              </div>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t('start.subtitle')}
            </p>
            <p className="text-xs text-muted-foreground/70 italic mt-1">
              {t('start.proverb')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary">{t('common.turnBased')}</Badge>
              <Badge variant="secondary">{t('common.strategy')}</Badge>
              <Badge variant="secondary">{t('common.simulation')}</Badge>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-3 text-center shadow-sm"
            >
              <div className="text-2xl mb-1 zim-float">🇿🇼</div>
              <p className="text-xs font-bold">{t('start.leadZimbabwe')}</p>
              <p className="text-[0.625rem] text-muted-foreground mt-0.5">{t('start.leadZimbabweDesc')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-3 text-center shadow-sm"
            >
              <div className="text-2xl mb-1 zim-float zim-float-delay-1">📊</div>
              <p className="text-xs font-bold">{t('start.manageEconomy')}</p>
              <p className="text-[0.625rem] text-muted-foreground mt-0.5">{t('start.manageEconomyDesc')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
              className="bg-card border border-border rounded-lg p-3 text-center shadow-sm"
            >
              <div className="text-2xl mb-1 zim-float zim-float-delay-2">🗳️</div>
              <p className="text-xs font-bold">{t('start.winElections')}</p>
              <p className="text-[0.625rem] text-muted-foreground mt-0.5">{t('start.winElectionsDesc')}</p>
            </motion.div>
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {t('start.description')}
          </p>

          <motion.div
            whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(46, 139, 55, 0.35)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-block"
          >
            <Button
              size="lg"
              className="bg-[#2E8B37] hover:bg-[#247A2E] text-lg font-bold px-10 py-7 rounded-xl shadow-lg shadow-green-500/20"
              onClick={() => setShowNewGameDialog(true)}
            >
              <Play className="h-5 w-5 mr-2" /> {t('start.startNewGame')}
            </Button>
          </motion.div>

          <p className="text-[0.625rem] text-muted-foreground/50 mt-6">
            {t('start.footer')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NEW GAME DIALOG
// ═══════════════════════════════════════════════════════

function NewGameDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { startNewGame, enableTips, setEnableTips } = useGameStore();
  const { t } = useTranslation();
  const [name, setName] = useState('Comrade Leader');
  const [partyName, setPartyName] = useState('Zimbabwe Peoples Party');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  const handleStart = () => {
    startNewGame(name, partyName, difficulty);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newGame.title')}</DialogTitle>
          <DialogDescription>{t('newGame.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('newGame.yourName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('newGame.namePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('newGame.partyName')}</Label>
            <Input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder={t('newGame.partyPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('newGame.difficulty')}</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div><span className="font-bold">Easy</span> — For new players. More forgiving.</div>
                </SelectItem>
                <SelectItem value="normal">
                  <div><span className="font-bold">Normal</span> — The intended experience.</div>
                </SelectItem>
                <SelectItem value="hard">
                  <div><span className="font-bold">Hard</span> — For experienced strategists.</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/15 text-amber-500">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('newGame.enableTips')}</p>
                <p className="text-[0.625rem] text-muted-foreground">{t('newGame.tipsDesc')}</p>
              </div>
            </div>
            <Switch checked={enableTips} onCheckedChange={setEnableTips} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStart} className="bg-amber-600 hover:bg-amber-700">
            <Play className="h-4 w-4 mr-2" /> {t('newGame.beginJourney')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// EVENT MODAL
// ═══════════════════════════════════════════════════════

function EventModal() {
  const { showEventModal, resolveEvent, setShowEventModal } = useGameStore();
  const { t } = useTranslation();
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  if (!showEventModal || !showEventModal.choices || showEventModal.choices.length === 0) return null;

  const event = showEventModal;

  const handleResolve = () => {
    if (selectedChoice) {
      resolveEvent(event.id, selectedChoice);
      setSelectedChoice(null);
    }
  };

  return (
    <Dialog open={!!showEventModal} onOpenChange={(open) => { if (!open) { setShowEventModal(null); setSelectedChoice(null); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant={event.severity === 'crisis' ? 'destructive' : event.severity === 'major' ? 'default' : 'secondary'}>
              {event.severity.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-[0.625rem]">{event.category}</Badge>
          </div>
          <DialogTitle className="text-lg">{event.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{event.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {event.choices!.map((choice) => (
            <button
              key={choice.id}
              onClick={() => setSelectedChoice(choice.id)}
              className={`w-full text-left rounded-lg border p-4 transition-all ${
                selectedChoice === choice.id
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-border bg-card hover:border-amber-500/50'
              }`}
            >
              <h4 className="text-sm font-bold mb-1">{choice.text}</h4>
              <p className="text-xs text-muted-foreground">{choice.shortDescription}</p>
              <div className="flex gap-3 mt-2">
                <span className={`text-[0.625rem] ${choice.popularityImpact > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Popularity: {choice.popularityImpact > 0 ? '+' : ''}{choice.popularityImpact}
                </span>
                <span className={`text-[0.625rem] ${choice.politicalRisk > 0 ? 'text-green-500' : choice.politicalRisk < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  Influence: {choice.politicalRisk > 0 ? '+' : ''}{choice.politicalRisk}
                </span>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleResolve} disabled={!selectedChoice} className="bg-amber-600 hover:bg-amber-700">
            {t('events.confirmDecision')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// MINISTER REPLACEMENT DIALOG
// ═══════════════════════════════════════════════════════

function MinisterReplacementDialog() {
  const { gameState, showReplacementDialog, replaceMinister, setShowReplacementDialog } = useGameStore();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  if (!showReplacementDialog || !gameState) return null;

  const { portfolio, candidates } = showReplacementDialog;
  const selected = candidates.find(c => c.id === selectedCandidate);

  const handleReplace = () => {
    if (selectedCandidate && selected) {
      replaceMinister(selectedCandidate, selected.popularityImpact);
      setSelectedCandidate(null);
    }
  };

  const handleSkip = () => {
    // Leave the position vacant — popularity penalty
    replaceMinister('', -5);
    setSelectedCandidate(null);
  };

  return (
    <Dialog open={!!showReplacementDialog} onOpenChange={(open) => { if (!open) { setShowReplacementDialog(null); setSelectedCandidate(null); } }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Choose a Replacement — {portfolio}</DialogTitle>
          <DialogDescription>
            The previous minister has been dismissed. Select a replacement from 3 candidates. Your choice will affect your public standing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate.id)}
              className={`w-full text-left rounded-lg border p-4 transition-all ${
                selectedCandidate === candidate.id
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-border bg-card hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold">{candidate.name}</h4>
                  <p className="text-[0.625rem] text-muted-foreground">{candidate.faction} • Age {candidate.age}</p>
                </div>
                <span className={`text-xs font-bold ${candidate.popularityImpact > 0 ? 'text-green-500' : candidate.popularityImpact < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {candidate.popularityImpact > 0 ? '+' : ''}{candidate.popularityImpact} Popularity
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{candidate.description}</p>
              <div className="grid grid-cols-4 gap-2">
                <MiniStat label="Competence" value={candidate.competence} />
                <MiniStat label="Loyalty" value={candidate.loyalty} />
                <MiniStat label="Corruption" value={candidate.corruption} inverted />
                <MiniStat label="Public Image" value={candidate.popularity} />
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
            Leave Vacant (-5 Popularity)
          </Button>
          <Button onClick={handleReplace} disabled={!selectedCandidate} className="bg-amber-600 hover:bg-amber-700 text-xs">
            <Check className="h-3.5 w-3.5 mr-1" /> Appoint Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// SETTINGS DIALOG
// ═══════════════════════════════════════════════════════

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { fontSize, setFontSize, darkMode, setDarkMode, language, setLanguage } = useGameStore();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-amber-500" /> {t('common.settings')}
          </DialogTitle>
          <DialogDescription>{t('common.languageDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Language */}
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/15 text-amber-500">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('common.language')}</p>
                <p className="text-[0.625rem] text-muted-foreground">{t('common.languageDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['en', 'sn', 'nd'] as import('@/lib/i18n').Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    language === lang
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-border bg-card hover:border-amber-500/50'
                  }`}
                >
                  <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
                  <span className="text-[0.625rem] text-muted-foreground block mt-0.5">{LANGUAGE_NAMES[lang]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-md ${darkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-500'}`}>
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">{t('common.darkMode')}</p>
                <p className="text-[0.625rem] text-muted-foreground">{t('common.darkModeDesc')}</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          {/* Text Size */}
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-500/15 text-amber-500">
                <Type className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{t('common.textSize')}</p>
                <p className="text-[0.625rem] text-muted-foreground">{t('common.textSizeDesc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    fontSize === size
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                      : 'border-border bg-card hover:border-amber-500/50'
                  }`}
                >
                  <span className={`block font-bold leading-none ${
                    size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg'
                  }`}>
                    Aa
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground mt-1 block capitalize">{size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// PREMIUM ANIMATED COMPONENTS & HOOKS
// ═══════════════════════════════════════════════════════

// ── useTilt hook — 3D mouse-follow tilt effect ───────────
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 12;
    const rotateY = (x - 0.5) * 12;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}

// ── AnimatedNumber — smooth number transitions ───────────
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 30, mass: 0.5 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  const [displayText, setDisplayText] = useState(value.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayText(v));
    return unsubscribe;
  }, [display]);

  return <span>{displayText}</span>;
}

// ── AnimatedStatCard — wrapped StatCard with premium FX ─
function AnimatedStatCard({ label, value, numericValue, icon, color = 'text-foreground', index = 0 }: {
  label: string; value: string | number; numericValue?: number; icon?: React.ReactNode; color?: string; index?: number;
}) {
  const { ref, handleMouseMove, handleMouseLeave } = useTilt();

  const pulseClass = color.startsWith('text-red')
    ? 'zim-pulse-danger'
    : color.startsWith('text-yellow')
      ? 'zim-pulse-warning'
      : color.startsWith('text-green')
        ? 'zim-pulse-success'
        : '';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.08 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`zim-tilt-card bg-card border border-border rounded-lg p-4 ${pulseClass}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: color.startsWith('text-green') ? '#2E8B37' : color.startsWith('text-yellow') ? '#E8A817' : color.startsWith('text-red') ? '#CC2936' : '#888' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className={color}>{icon}</span>}
      </div>
      <p className={`text-xl font-bold mt-1.5 ${color}`}>
        {numericValue !== undefined ? <AnimatedNumber value={numericValue} decimals={numericValue % 1 !== 0 ? 1 : 0} /> : value}
      </p>
    </motion.div>
  );
}

// ── AnimatedMetricCard — wrapped MetricCard with glow border
function AnimatedMetricCard({ title, items, index = 0 }: { title: string; items: { label: string; value: string }[]; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 + index * 0.08 }}
      whileHover={{ y: -2 }}
      className="zim-glow-border rounded-lg"
    >
      <div className="bg-card border border-border rounded-lg p-4 relative z-10" style={{ borderTopWidth: '2px', borderTopColor: '#E8A817' }}>
        <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-bold tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════

function StatCard({ label, value, icon, color = 'text-foreground' }: { label: string; value: string | number; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4" style={{ borderLeftWidth: '3px', borderLeftColor: color.startsWith('text-green') ? '#2E8B37' : color.startsWith('text-yellow') ? '#E8A817' : color.startsWith('text-red') ? '#CC2936' : '#888' }}>
      <div className="flex items-center justify-between">
        <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className={color}>{icon}</span>}
      </div>
      <p className={`text-xl font-bold mt-1.5 ${color}`}>{value}</p>
    </div>
  );
}

function MetricCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4" style={{ borderTopWidth: '2px', borderTopColor: '#E8A817' }}>
      <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-bold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix = '', inverted = false }: { label: string; value: number; suffix?: string; inverted?: boolean }) {
  const color = inverted
    ? value > 60 ? 'text-red-500' : value > 30 ? 'text-yellow-500' : 'text-green-500'
    : value > 60 ? 'text-green-500' : value > 30 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div>
      <span className="text-[0.625rem] text-muted-foreground">{label}</span>
      <p className={`text-xs font-bold ${color}`}>{value}{suffix}</p>
    </div>
  );
}

function TrendCard({ title, data, color, formatValue }: { title: string; data: { label: string; value: number }[]; color: string; formatValue: (v: number) => string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-[0.625rem] font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex items-end gap-1 h-24">
        {data.map((point, i) => {
          const barHeight = (point.value / maxVal) * 80;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[0.5625rem] text-muted-foreground font-medium">{formatValue(point.value)}</span>
              <motion.div
                className="w-full rounded-t zim-progress-bar"
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}px` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.04 }}
                style={{ background: `linear-gradient(to top, ${color}, ${color}88)` }}
              />
              <span className="text-[0.5rem] text-muted-foreground font-medium">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN GAME PAGE
// ═══════════════════════════════════════════════════════

export default function GamePage() {
  const { gameState, currentScreen, setScreen, endTurn, isProcessingTurn, showNewGameDialog, setShowNewGameDialog, resetGame, enableTips, setEnableTips, fontSize, darkMode, setDarkMode } = useGameStore();
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const mountedRef = useRef(false);

  const NAV_ITEMS = [
    { id: 'dashboard' as GameScreen, label: t('nav.dashboard'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'budget' as GameScreen, label: t('nav.budget'), icon: <DollarSign className="h-4 w-4" /> },
    { id: 'infrastructure' as GameScreen, label: t('nav.infrastructure'), icon: <Building2 className="h-4 w-4" /> },
    { id: 'politics' as GameScreen, label: t('nav.politics'), icon: <Landmark className="h-4 w-4" /> },
    { id: 'ministers' as GameScreen, label: t('nav.ministers'), icon: <Users className="h-4 w-4" /> },
    { id: 'energy' as GameScreen, label: t('nav.energy'), icon: <Zap className="h-4 w-4" /> },
    { id: 'water' as GameScreen, label: t('nav.water'), icon: <Droplets className="h-4 w-4" /> },
    { id: 'map' as GameScreen, label: t('nav.map'), icon: <Map className="h-4 w-4" /> },
    { id: 'events' as GameScreen, label: t('nav.events'), icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'news' as GameScreen, label: t('nav.news'), icon: <Newspaper className="h-4 w-4" /> },
    { id: 'elections' as GameScreen, label: t('nav.elections'), icon: <Vote className="h-4 w-4" /> },
  ];

  // Mark as mounted and sync dark mode from store to next-themes (one-way)
  useEffect(() => {
    mountedRef.current = true;
    setTheme(darkMode ? 'dark' : 'light');
  }, []);

  // Sync dark mode changes after mount
  useEffect(() => {
    if (!mountedRef.current) return;
    setTheme(darkMode ? 'dark' : 'light');
  }, [darkMode, setTheme]);

  // Apply font size via CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--mgza-font-size', FONT_SIZE_MAP[fontSize]);
  }, [fontSize]);

  // Start Screen
  if (currentScreen === 'start') {
    return (
      <div className="min-h-screen bg-background flex flex-col zim-force-light">
        <StartScreen />
        <NewGameDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog} />
      </div>
    );
  }

  // Game Over Screen
  if (currentScreen === 'game_over' || gameState?.isGameOver) {
    return (
      <div className="min-h-screen bg-background flex flex-col zim-force-light">
        <GameOverScreen />
      </div>
    );
  }

  const { player, economic, energy, citizenSatisfaction } = gameState || {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="lg:hidden p-0 h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-amber-500" />
              <h1 className="text-sm font-black tracking-tight hidden sm:block">MGZA</h1>
            </div>
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="secondary" className="text-[0.625rem]">{MONTH_NAMES[(player?.month || 1) - 1]} {player?.year || 2025}</Badge>
              <Badge variant="secondary" className="text-[0.625rem]">Turn {player?.turn || 1}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-3 text-[0.625rem]">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400" />
                <span className="font-bold">{(player?.popularity || 0).toFixed(0)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="font-bold">{(economic?.gdpGrowth || 0).toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="font-bold">{(energy?.loadSheddingHoursPerDay || 0).toFixed(0)}h</span>
              </span>
            </div>

            <Separator orientation="vertical" className="h-5 hidden md:block" />

            {/* Event Alert */}
            {gameState && gameState.events.filter(e => !e.resolved).length > 0 && (
              <Button variant="destructive" size="sm" className="text-[0.625rem] h-7 px-2 animate-pulse" onClick={() => setScreen('events')}>
                <AlertTriangle className="h-3 w-3 mr-1" /> {gameState.events.filter(e => !e.resolved).length}
              </Button>
            )}

            {/* Game Log Toggle */}
            <Button variant="ghost" size="sm" className="text-[0.625rem] h-7 px-2" onClick={() => setShowLog(!showLog)} title="Game Log">
              <Newspaper className="h-3 w-3" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="text-[0.625rem] h-7 px-2" onClick={() => setShowSettings(true)} title="Settings">
              <Settings className="h-3 w-3" />
            </Button>

            {/* End Turn Button */}
            <HoverTip tipId="end_turn">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(232, 168, 23, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="inline-block"
              >
                <Button
                  size="sm"
                  onClick={endTurn}
                  disabled={isProcessingTurn}
                  className="bg-amber-600 hover:bg-amber-700 text-xs font-bold px-4"
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t('nav.endTurn')}</span>
                  <span className="sm:hidden">{t('nav.endTurnShort')}</span>
                </Button>
              </motion.div>
            </HoverTip>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-56 bg-card border-r border-border
          transform transition-transform lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:w-48 xl:w-56
        `}>
          <div className="flex flex-col h-full">
            <div className="lg:hidden flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-bold">{t('common.settings')}</span>
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Player Info */}
            {gameState && (
              <div className="p-3 border-b border-border">
                <p className="text-xs font-bold">{gameState.player.name}</p>
                <p className="text-[0.625rem] text-muted-foreground">{gameState.player.partyName}</p>
                <Badge variant="secondary" className="text-[0.625rem] mt-1">
                  {gameState.player.careerLevel.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            )}

            <ScrollArea className="flex-1">
              <nav className="p-2 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setScreen(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                      currentScreen === item.id
                        ? 'bg-amber-600/20 text-amber-500 font-bold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.id === 'events' && gameState && gameState.events.filter(e => !e.resolved).length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[0.5625rem] rounded-full w-4 h-4 flex items-center justify-center">
                        {gameState.events.filter(e => !e.resolved).length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </ScrollArea>

            <div className="p-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  <span className="text-[0.625rem] text-muted-foreground">{t('common.tips')}</span>
                </div>
                <Switch checked={enableTips} onCheckedChange={setEnableTips} className="scale-75" />
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setShowSettings(true)}>
                <Settings className="h-3 w-3 mr-1" /> {t('common.settings')}
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { resetGame(); setShowNewGameDialog(true); }}>
                <Gamepad2 className="h-3 w-3 mr-1" /> {t('common.newGame')}
              </Button>
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                key={currentScreen}
              >
                {currentScreen === 'dashboard' && <DashboardScreen />}
                {currentScreen === 'budget' && <BudgetScreen />}
                {currentScreen === 'infrastructure' && <InfrastructureScreen />}
                {currentScreen === 'politics' && <PoliticsScreen />}
                {currentScreen === 'ministers' && <MinistersScreen />}
                {currentScreen === 'energy' && <EnergyScreen />}
                {currentScreen === 'water' && <WaterScreen />}
                {currentScreen === 'map' && <MapScreen />}
                {currentScreen === 'events' && <EventsScreen />}
                {currentScreen === 'news' && <NewsScreen />}
                {currentScreen === 'elections' && <ElectionsScreen />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Game Log Drawer */}
          {showLog && gameState && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="fixed right-0 top-0 h-full w-72 bg-card border-l border-border z-50 p-4 overflow-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">{t('common.gameLog')}</h3>
                <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => setShowLog(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {gameState.gameLog.slice().reverse().map((log, i) => (
                  <div key={i} className="text-[0.625rem] text-muted-foreground border-b border-border/30 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card/95 backdrop-blur mt-auto">
        <div className="w-full h-0.5" style={{ backgroundColor: '#2E8B37' }} />
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-[0.625rem] text-muted-foreground max-w-7xl mx-auto">
            <span className="flex items-center gap-1">
              <Gamepad2 className="h-3 w-3 text-amber-500" /> Make Great Zimbabwe Again — v1.0
            </span>
            <span>{MONTH_NAMES[(player?.month || 1) - 1]} {player?.year || 2025} | Turn {(player?.turn || 1)} | {(citizenSatisfaction?.overall || 0).toFixed(0)}% Satisfaction</span>
          </div>
        </div>
      </footer>

      {/* Event Modal */}
      <EventModal />
      <MinisterReplacementDialog />
      <NewGameDialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
