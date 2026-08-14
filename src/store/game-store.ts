// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Game Store (Zustand)
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, InfrastructureProject, GameEvent, BudgetItem, Minister, HistoricalDataPoint } from '@/lib/game/types';
import { createInitialGameState, EVENT_DECISION_SECONDS, EVENT_TIMEOUT_PENALTY, TITLE_TURNS_REQUIRED, MONTH_NAMES } from '@/lib/game/constants';
import { simulateTurn, generateAvailableProjects, getHistoricalDataPoint, TITLE_RULES } from '@/lib/game/engine';
import type { Language } from '@/lib/i18n';

export type GameScreen =
  | 'start'
  | 'dashboard'
  | 'budget'
  | 'infrastructure'
  | 'politics'
  | 'events'
  | 'map'
  | 'ministers'
  | 'energy'
  | 'water'
  | 'corruption'
  | 'news'
  | 'elections'
  | 'history'
  | 'leaderboard'
  | 'game_over';

interface ReplacementCandidate {
  id: string;
  name: string;
  portfolio: string;
  competence: number;
  loyalty: number;
  corruption: number;
  popularity: number;
  faction: string;
  age: number;
  description: string;
  popularityImpact: number;
}

interface ReplacementDialogState {
  portfolio: string;
  candidates: ReplacementCandidate[];
}

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ElectionResultData {
  year: number;
  month: number;
  playerWon: boolean;
  playerVotes: number;
  opponentVotes: number;
  totalVoters: number;
  turnoutPercent: number;
  playerVotePercent: number;
  opponentVotePercent: number;
}

interface GameStore {
  // State
  gameState: GameState | null;
  currentScreen: GameScreen;
  historicalData: HistoricalDataPoint[];
  isProcessingTurn: boolean;
  selectedProvince: string | null;
  showEventModal: GameEvent | null;
  availableProjects: InfrastructureProject[];
  showNewGameDialog: boolean;
  enableTips: boolean;
  showReplacementDialog: ReplacementDialogState | null;
  showElectionResult: ElectionResultData | null;
  turnEventsResolved: number;
  turnEventsExpired: number;
  fontSize: FontSize;
  darkMode: boolean;
  language: Language;

  // Actions
  startNewGame: (name: string, partyName: string, difficulty: 'easy' | 'normal' | 'hard') => void;
  endTurn: () => void;
  setScreen: (screen: GameScreen) => void;
  resolveEvent: (eventId: string, choiceId: string) => void;
  checkEventDeadlines: () => void;
  approveProject: (projectId: string) => void;
  updateBudget: (category: string, amount: number) => void;
  allocateBudget: () => void;
  fireMinister: (ministerId: string) => void;
  appointMinister: (minister: Minister) => void;
  replaceMinister: (candidateId: string, popularityImpact: number) => void;
  selectProvince: (provinceId: string | null) => void;
  setShowEventModal: (event: GameEvent | null) => void;
  dismissEvent: () => void;
  resetGame: () => void;
  setShowNewGameDialog: (show: boolean) => void;
  setEnableTips: (enable: boolean) => void;
  setShowReplacementDialog: (state: ReplacementDialogState | null) => void;
  setShowElectionResult: (data: ElectionResultData | null) => void;
  setFontSize: (size: FontSize) => void;
  setDarkMode: (dark: boolean) => void;
  setLanguage: (lang: Language) => void;
  exportSave: () => string;
  importSave: (json: string) => boolean;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      currentScreen: 'start',
      historicalData: [],
      isProcessingTurn: false,
      selectedProvince: null,
      showEventModal: null,
      availableProjects: [],
      showNewGameDialog: false,
      enableTips: true,
      showReplacementDialog: null,
      showElectionResult: null,
      turnEventsResolved: 0,
      turnEventsExpired: 0,
      fontSize: 'medium' as FontSize,
      darkMode: false,
      language: 'en' as Language,

      startNewGame: (name, partyName, difficulty) => {
        const state = createInitialGameState(difficulty);
        state.player.name = name || 'Comrade Leader';
        state.player.partyName = partyName || 'Zimbabwe Peoples Party';
        state.runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        state.availableProjects = generateAvailableProjects(state);
        set({
          gameState: state,
          currentScreen: 'dashboard',
          historicalData: [getHistoricalDataPoint(state)],
          availableProjects: generateAvailableProjects(state),
          showNewGameDialog: false,
        });
      },

      endTurn: () => {
        const { gameState } = get();
        if (!gameState || gameState.isGameOver) return;

        set({ isProcessingTurn: true });

        const prev = JSON.parse(JSON.stringify(gameState)) as GameState;

        // Simulate the turn
        const newState = simulateTurn(gameState);
        const historyPoint = getHistoricalDataPoint(newState);

        // Generate new projects occasionally
        let availableProjects = get().availableProjects;
        if (Math.random() < 0.4) {
          availableProjects = [...availableProjects, ...generateAvailableProjects(newState)].slice(0, 15);
        }

        // Give every surfaced event a decision deadline so none linger forever:
        // expired events are archived and leave the active list.
        const now = Date.now();
        for (const ev of newState.events) {
          if (!ev.resolved && !ev.deadline) {
            ev.deadline = now + EVENT_DECISION_SECONDS * 1000;
          }
        }

        // Check for unresolved events that need attention
        const unresolvedEvent = newState.events.find(e => !e.resolved && e.choices && e.choices.length > 0);

        // Check if an election just concluded this turn
        const finishedElection = newState.elections.find(e => e.isOver && !gameState.elections.find(ge => ge.id === e.id && ge.isOver));
        let showElectionResult: ElectionResultData | null = null;
        if (finishedElection && finishedElection.playerVotes > 0) {
          const pvp = finishedElection.playerVotes / (finishedElection.playerVotes + finishedElection.opponentVotes) * 100;
          const ovp = finishedElection.opponentVotes / (finishedElection.playerVotes + finishedElection.opponentVotes) * 100;
          showElectionResult = {
            year: finishedElection.year,
            month: finishedElection.month,
            playerWon: finishedElection.playerWon,
            playerVotes: finishedElection.playerVotes,
            opponentVotes: finishedElection.opponentVotes,
            totalVoters: finishedElection.totalVoters,
            turnoutPercent: finishedElection.turnoutPercent,
            playerVotePercent: Math.round(pvp * 10) / 10,
            opponentVotePercent: Math.round(ovp * 10) / 10,
          };
        }

        // Award titles as milestones: a rule must hold for TITLE_TURNS_REQUIRED
        // consecutive turns before the title is earned (and it is earned only once).
        const titlesAwarded: string[] = [];
        const titleProgress = { ...newState.titleProgress };
        for (const rule of TITLE_RULES) {
          const owned = newState.player.titles.includes(rule.key);
          if (owned) { delete titleProgress[rule.key]; continue; }
          const met = rule.check(newState);
          titleProgress[rule.key] = met ? (titleProgress[rule.key] ?? 0) + 1 : 0;
          if (titleProgress[rule.key] >= TITLE_TURNS_REQUIRED) {
            newState.player.titles = [...newState.player.titles, rule.key];
            titlesAwarded.push(rule.key);
            delete titleProgress[rule.key];
          }
        }
        newState.titleProgress = titleProgress;
        if (titlesAwarded.length > 0) {
          newState.gameLog.push(`Titles earned: ${titlesAwarded.join(', ')}`);
        }

        // Build the end-of-turn report as a game log entry
        const fmtDelta = (v: number) => `${v > 0 ? '+' : ''}${v}%`;
        const reportParts = [
          `${MONTH_NAMES[newState.player.month - 1]} ${newState.player.year}: Turn ${newState.player.turn} report`,
          `Popularity ${fmtDelta(Math.round((newState.player.popularity - prev.player.popularity) * 10) / 10)}`,
          `Legitimacy ${fmtDelta(Math.round((newState.player.legitimacy - prev.player.legitimacy) * 10) / 10)}`,
          `Satisfaction ${fmtDelta(Math.round((newState.citizenSatisfaction.overall - prev.citizenSatisfaction.overall) * 10) / 10)}`,
          `GDP growth ${fmtDelta(Math.round(newState.economic.gdpGrowth * 10) / 10)}`,
          `Inflation ${fmtDelta(Math.round((newState.economic.inflation - prev.economic.inflation) * 10) / 10)}`,
          `Debt/GDP ${Math.round(newState.economic.debtToGdp * 10) / 10}%`,
          `Unemployment ${Math.round(newState.economic.unemploymentRate * 10) / 10}%`,
          `Events: ${get().turnEventsResolved} resolved, ${get().turnEventsExpired} expired`,
          `Promises: ${newState.player.fulfilledPromises.length - prev.player.fulfilledPromises.length} kept, ${newState.player.brokenPromises.length - prev.player.brokenPromises.length} broken`,
        ];
        if (titlesAwarded.length > 0) {
          reportParts.push(`Titles earned: ${titlesAwarded.join(', ')}`);
        }
        newState.gameLog.push(reportParts.join(' | '));

        set({
          gameState: newState,
          historicalData: [...get().historicalData, historyPoint],
          availableProjects,
          isProcessingTurn: false,
          showEventModal: unresolvedEvent || null,
          showElectionResult,
          turnEventsResolved: 0,
          turnEventsExpired: 0,
        });
      },

      setScreen: (screen) => set({ currentScreen: screen }),

      resolveEvent: (eventId, choiceId) => {
        const { gameState } = get();
        if (!gameState) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        const event = newState.events.find(e => e.id === eventId);
        if (!event) return;

        const choice = event.choices?.find(c => c.id === choiceId);
        if (!choice) return;

        // Decision window expired: reject resolution
        if (event.deadline && Date.now() >= event.deadline) return;

        // Apply effects
        for (const effect of choice.effects) {
          applyEffect(newState, effect.target, effect.operation, effect.value);
        }

        // Apply flag changes from the choice
        for (const f of choice.setFlags ?? []) {
          if (!newState.flags.includes(f)) newState.flags.push(f);
        }
        for (const f of choice.clearFlags ?? []) {
          newState.flags = newState.flags.filter(x => x !== f);
        }

        // Schedule a follow-up (cascading crisis) if the choice triggers one
        if (choice.nextEventId) {
          newState.pendingConsequences = [...newState.pendingConsequences, {
            id: `con_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
            fireTurn: newState.player.turn + (choice.consequenceDelay ?? 1),
            templateId: choice.nextEventId,
            setFlags: [],
            clearFlags: [],
          }];
          newState.gameLog.push(`A consequence of "${event.title}" is brewing for turn ${newState.player.turn + (choice.consequenceDelay ?? 1)}.`);
        }

        event.resolved = true;
        event.choiceMade = choiceId;
        newState.player.popularity = Math.max(0, Math.min(100, newState.player.popularity + choice.popularityImpact));
        newState.player.politicalInfluence = Math.max(0, Math.min(100, newState.player.politicalInfluence + choice.politicalRisk));
        newState.gameLog.push(`Decision: ${event.title} — Chose: "${choice.text}"`);
        newState.eventArchive = [...newState.eventArchive, {
          id: event.id,
          templateId: event.templateId,
          title: event.title,
          category: event.category,
          severity: event.severity,
          turn: event.turn,
          month: event.month,
          year: event.year,
          choiceText: choice.text,
          outcome: 'resolved' as const,
          popularityImpact: choice.popularityImpact,
          politicalRisk: choice.politicalRisk,
        }].slice(-200);

        set({ gameState: newState, showEventModal: null, turnEventsResolved: get().turnEventsResolved + 1 });
      },

      approveProject: (projectId) => {
        const { gameState, availableProjects } = get();
        if (!gameState) return;

        const project = availableProjects.find(p => p.id === projectId);
        if (!project) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        project.status = 'in_progress';
        project.startedTurn = newState.player.turn;
        newState.projects.push(project);
        newState.gameLog.push(`Project approved: ${project.name} ($${project.cost}M)`);
        newState.availableProjects = availableProjects.filter(p => p.id !== projectId);

        set({
          gameState: newState,
          availableProjects: availableProjects.filter(p => p.id !== projectId),
        });
      },

      updateBudget: (category, amount) => {
        const { gameState } = get();
        if (!gameState) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        const item = newState.budget.items.find(i => i.category === category);
        if (item) {
          item.allocated = Math.max(0, Math.round(amount));
        }
        newState.budget.totalAllocated = newState.budget.items.reduce((sum, i) => sum + i.allocated, 0);
        newState.budget.deficit = newState.budget.totalAllocated - newState.budget.totalRevenue;

        set({ gameState: newState });
      },

      allocateBudget: () => {
        const { gameState } = get();
        if (!gameState) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        newState.budget.totalAllocated = newState.budget.items.reduce((sum, i) => sum + i.allocated, 0);
        newState.budget.deficit = newState.budget.totalAllocated - newState.budget.totalRevenue;
        newState.gameLog.push(`Budget allocated: Total $${newState.budget.totalAllocated}M`);

        set({ gameState: newState });
      },

      fireMinister: (ministerId) => {
        const { gameState } = get();
        if (!gameState) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        const minister = newState.ministers.find(m => m.id === ministerId);
        if (!minister) return;

        minister.isActive = false;
        newState.gameLog.push(`Minister fired: ${minister.name} (${minister.portfolio})`);

        // Generate 3 replacement candidates
        const candidates = generateReplacementCandidates(minister.portfolio);

        set({
          gameState: newState,
          showReplacementDialog: {
            portfolio: minister.portfolio,
            candidates,
          },
        });
      },

      appointMinister: (minister) => {
        const { gameState } = get();
        if (!gameState) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        // Remove inactive version if exists
        newState.ministers = newState.ministers.filter(m => m.id !== minister.id);
        minister.isActive = true;
        newState.ministers.push(minister);
        newState.gameLog.push(`Minister appointed: ${minister.name} (${minister.portfolio})`);

        set({ gameState: newState });
      },

      replaceMinister: (candidateId, popularityImpact) => {
        const { gameState, showReplacementDialog } = get();
        if (!gameState || !showReplacementDialog) return;

        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;

        if (candidateId && candidateId !== '') {
          // Appoint the selected candidate
          const candidate = showReplacementDialog.candidates.find(c => c.id === candidateId);
          if (candidate) {
            const newMinister: Minister = {
              id: candidate.id,
              name: candidate.name,
              portfolio: candidate.portfolio,
              competence: candidate.competence,
              loyalty: candidate.loyalty,
              corruption: candidate.corruption,
              popularity: candidate.popularity,
              faction: candidate.faction,
              age: candidate.age,
              isActive: true,
            };
            newState.ministers.push(newMinister);
            newState.player.popularity = Math.max(0, Math.min(100, newState.player.popularity + candidate.popularityImpact));
            newState.gameLog.push(`Minister appointed: ${candidate.name} (${candidate.portfolio}) — Popularity ${candidate.popularityImpact > 0 ? '+' : ''}${candidate.popularityImpact}`);
          }
        } else {
          // Left vacant
          newState.player.popularity = Math.max(0, Math.min(100, newState.player.popularity + popularityImpact));
          newState.gameLog.push(`${showReplacementDialog.portfolio} portfolio left vacant — Popularity ${popularityImpact}`);
        }

        set({ gameState: newState, showReplacementDialog: null });
      },

      selectProvince: (provinceId) => set({ selectedProvince: provinceId }),
      setShowEventModal: (event) => {
        if (event && !event.deadline) {
          event.deadline = Date.now() + EVENT_DECISION_SECONDS * 1000;
        }
        set({ showEventModal: event });
      },
      checkEventDeadlines: () => {
        const { gameState } = get();
        if (!gameState) return;

        const now = Date.now();
        const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
        let expiredCount = 0;

        for (const event of newState.events) {
          if (event.resolved || !event.deadline || event.penaltyApplied) continue;
          if (now < event.deadline) continue;

          event.penaltyApplied = true;
          expiredCount++;
          newState.player.popularity = Math.max(0, newState.player.popularity - EVENT_TIMEOUT_PENALTY.popularity);
          newState.player.legitimacy = Math.max(0, newState.player.legitimacy - EVENT_TIMEOUT_PENALTY.legitimacy);
          newState.citizenSatisfaction.governance = Math.max(0, newState.citizenSatisfaction.governance - EVENT_TIMEOUT_PENALTY.governance);
          newState.gameLog.push(`Indecision penalty: People lose confidence (-${EVENT_TIMEOUT_PENALTY.popularity} popularity, -${EVENT_TIMEOUT_PENALTY.legitimacy} legitimacy, -${EVENT_TIMEOUT_PENALTY.governance} governance) for failing to address "${event.title}" promptly.`);
          newState.eventArchive = [...newState.eventArchive, {
            id: event.id,
            templateId: event.templateId,
            title: event.title,
            category: event.category,
            severity: event.severity,
            turn: event.turn,
            month: event.month,
            year: event.year,
            outcome: 'expired' as const,
          }].slice(-200);
        }

        // Expired events leave the active list: they only live on in the archive
        newState.events = newState.events.filter(e => !(e.deadline && Date.now() >= e.deadline && !e.resolved));

        if (expiredCount > 0) {
          set({ gameState: newState, turnEventsExpired: get().turnEventsExpired + expiredCount });
        }
      },
      dismissEvent: () => set({ showEventModal: null }),
      resetGame: () => set({ gameState: null, currentScreen: 'start', historicalData: [], availableProjects: [], turnEventsResolved: 0, turnEventsExpired: 0 }),
      setShowNewGameDialog: (show) => set({ showNewGameDialog: show }),
      setEnableTips: (enable) => set({ enableTips: enable }),
      setShowReplacementDialog: (state) => set({ showReplacementDialog: state }),
      setShowElectionResult: (data) => set({ showElectionResult: data }),
      setFontSize: (size) => set({ fontSize: size }),
      setDarkMode: (dark) => set({ darkMode: dark }),
      setLanguage: (lang) => set({ language: lang }),
      exportSave: () => {
        const s = get();
        return JSON.stringify({
          app: 'mgza',
          version: 1,
          savedAt: new Date().toISOString(),
          state: {
            gameState: s.gameState,
            historicalData: s.historicalData,
            availableProjects: s.availableProjects,
            enableTips: s.enableTips,
            fontSize: s.fontSize,
            darkMode: s.darkMode,
            language: s.language,
          },
        });
      },
      importSave: (json) => {
        try {
          const parsed = JSON.parse(json);
          if (parsed?.app !== 'mgza' || !parsed?.state?.gameState) return false;
          const gs = parsed.state.gameState;
          if (!gs?.player || !gs?.economic || !Array.isArray(gs?.events)) return false;
          if (!Array.isArray(gs.flags)) gs.flags = [];
          if (!Array.isArray(gs.pendingConsequences)) gs.pendingConsequences = [];
          if (!Array.isArray(gs.rumors)) gs.rumors = [];
          if (!Array.isArray(gs.eventArchive)) gs.eventArchive = [];
          if (!Array.isArray(gs.player.titles)) gs.player.titles = [];
          set({
            gameState: gs,
            historicalData: parsed.state.historicalData ?? [],
            availableProjects: parsed.state.availableProjects ?? [],
            currentScreen: 'dashboard',
            turnEventsResolved: 0,
            turnEventsExpired: 0,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'mgza-game-store',
      partialize: (state) => ({
        gameState: state.gameState,
        historicalData: state.historicalData,
        availableProjects: state.availableProjects,
        enableTips: state.enableTips,
        fontSize: state.fontSize,
        darkMode: state.darkMode,
        language: state.language,
      }),
    }
  )
);

// Helper to apply event effects to game state
function applyEffect(state: GameState, target: string, operation: string, value: number): void {
  const parts = target.split('.');

  // Flag operations
  if (operation === 'setFlag') {
    if (!state.flags.includes(target)) state.flags.push(target);
    return;
  }
  if (operation === 'clearFlag') {
    state.flags = state.flags.filter(f => f !== target);
    return;
  }

  // Minister targeting: target like 'minister:Finance.popularity'
  if (target.startsWith('minister:')) {
    const rest = target.slice('minister:'.length);
    const [portfolio, field] = rest.split('.');
    const minister = state.ministers.find(m => m.portfolio === portfolio && m.isActive);
    if (minister && field && (minister as any)[field] !== undefined) {
      const current = (minister as any)[field];
      if (operation === 'add') (minister as any)[field] = Math.max(0, Math.min(100, current + value));
      else if (operation === 'subtract') (minister as any)[field] = Math.max(0, Math.min(100, current - value));
      else if (operation === 'set') (minister as any)[field] = Math.max(0, Math.min(100, value));
    }
    return;
  }

  const setNested = (obj: any, path: string[], val: number) => {
    const key = path[0];
    if (path.length === 1) {
      switch (operation) {
        case 'add': obj[key] = (obj[key] || 0) + val; break;
        case 'subtract': obj[key] = (obj[key] || 0) - val; break;
        case 'multiply': obj[key] = (obj[key] || 1) * val; break;
        case 'set': obj[key] = val; break;
      }
    } else if (obj[key] !== undefined) {
      setNested(obj[key], path.slice(1), val);
    }
  };

  // Try to apply to player state
  if (target.startsWith('player.')) {
    setNested(state.player, parts.slice(1), value);
  } else if (target.startsWith('economic.')) {
    setNested(state.economic, parts.slice(1), value);
  } else if (target.startsWith('national.')) {
    setNested(state.national, parts.slice(1), value);
  } else if (target.startsWith('citizenSatisfaction.')) {
    setNested(state.citizenSatisfaction, parts.slice(1), value);
  } else if (target.startsWith('publicServices.')) {
    setNested(state.publicServices, parts.slice(1), value);
  } else if (target.startsWith('energy.')) {
    setNested(state.energy, parts.slice(1), value);
  } else if (target.startsWith('water.')) {
    setNested(state.water, parts.slice(1), value);
  } else if (target.startsWith('corruption.')) {
    setNested(state.corruption, parts.slice(1), value);
  } else if (target.startsWith('infrastructure.')) {
    setNested(state.infrastructure, parts.slice(1), value);
  } else if (target.startsWith('trade.')) {
    setNested(state.trade, parts.slice(1), value);
  } else if (target.startsWith('budget.')) {
    const budgetTarget = parts.slice(1).join('.');
    for (const item of state.budget.items) {
      if (item.category === budgetTarget) {
        item.allocated = Math.max(0, item.allocated + value);
        break;
      }
    }
  } else if (target === 'politicalInfluence') {
    state.player.politicalInfluence = Math.max(0, Math.min(100, state.player.politicalInfluence + value));
  } else if (target === 'budget') {
    // generic budget effect
  }
}

// ═══════════════════════════════════════════════════════
// MINISTER REPLACEMENT CANDIDATE GENERATOR
// ═══════════════════════════════════════════════════════

const FIRST_NAMES = [
  'Dr. Amos', 'Adv. Brenda', 'Prof. Chengetai', 'Cde. Danford', 'Ms. Eunice',
  'Eng. Farai', 'Mrs. Grace', 'Mr. Happiness', 'Dr. Isaac', 'Ms. Joice',
  'Mr. Knowledge', 'Mrs. Linnet', 'Dr. Maxwell', 'Ms. Nomathemba', 'Cde. Obert',
  'Prof. Phineas', 'Mrs. Rufaro', 'Dr. Shadreck', 'Ms. Tambudzai', 'Mr. Webster',
];

const LAST_NAMES = [
  'Banda', 'Chigumba', 'Dube', 'Gono', 'Hungwe', 'Jiri', 'Kaseke',
  'Mlambo', 'Ncube', 'Nyoni', 'Phiri', 'Ruzvidzo', 'Sibanda', 'Tsvangirai',
  'Moyo', 'Chikwata', 'Gumede', 'Mudzonga', 'Ndhlovu', 'Zindoga',
];

const FACTIONS = ['technocrats', 'reformers', 'old_guard', 'business', 'military'];
const DESCRIPTIONS = [
  'A seasoned administrator with deep experience in government operations.',
  'A young, dynamic reformer who promises to modernize the portfolio.',
  'A loyal party loyalist with strong connections to traditional structures.',
  'A technocratic expert with an impressive academic background.',
  'A pragmatic manager known for getting things done quietly.',
  'A charismatic figure popular with the grassroots membership.',
  'A former military officer with a reputation for discipline.',
  'A controversial figure — bold but carries political baggage.',
  'A compromise candidate acceptable to multiple factions.',
  'A rising star with potential, but limited experience.',
];

function generateReplacementCandidates(portfolio: string): ReplacementCandidate[] {
  const usedNames = new Set<string>();
  const candidates: ReplacementCandidate[] = [];

  // Generate 3 candidates with different profiles
  const profiles = [
    { competenceBias: [55, 75], loyaltyBias: [40, 65], corruptionBias: [15, 35], popularityBias: [50, 70], popImpactRange: [2, 8] }, // Good choice
    { competenceBias: [40, 60], loyaltyBias: [55, 80], corruptionBias: [25, 45], popularityBias: [30, 50], popImpactRange: [-2, 4] }, // Loyal but mediocre
    { competenceBias: [60, 85], loyaltyBias: [25, 45], corruptionBias: [30, 55], popularityBias: [35, 55], popImpactRange: [-5, 5] }, // Competent but risky
  ];

  for (const profile of profiles) {
    let name: string;
    do {
      name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const competence = randomInt(profile.competenceBias[0], profile.competenceBias[1]);
    const loyalty = randomInt(profile.loyaltyBias[0], profile.loyaltyBias[1]);
    const corruption = randomInt(profile.corruptionBias[0], profile.corruptionBias[1]);
    const popularity = randomInt(profile.popularityBias[0], profile.popularityBias[1]);
    const popularityImpact = randomInt(profile.popImpactRange[0], profile.popImpactRange[1]);
    const faction = FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
    const age = randomInt(35, 72);
    const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

    candidates.push({
      id: `rep_${Math.random().toString(36).substring(2, 9)}`,
      name,
      portfolio,
      competence,
      loyalty,
      corruption,
      popularity,
      faction,
      age,
      description,
      popularityImpact,
    });
  }

  return candidates;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
