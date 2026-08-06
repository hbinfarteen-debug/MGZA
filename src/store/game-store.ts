// ═══════════════════════════════════════════════════════
// MAKE GREAT ZIMBABWE AGAIN - Game Store (Zustand)
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, InfrastructureProject, GameEvent, BudgetItem, Minister, HistoricalDataPoint } from '@/lib/game/types';
import { createInitialGameState } from '@/lib/game/constants';
import { simulateTurn, generateAvailableProjects, getHistoricalDataPoint } from '@/lib/game/engine';

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
  | 'game_over';

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

  // Actions
  startNewGame: (name: string, partyName: string, difficulty: 'easy' | 'normal' | 'hard') => void;
  endTurn: () => void;
  setScreen: (screen: GameScreen) => void;
  resolveEvent: (eventId: string, choiceId: string) => void;
  approveProject: (projectId: string) => void;
  updateBudget: (category: string, amount: number) => void;
  allocateBudget: () => void;
  fireMinister: (ministerId: string) => void;
  appointMinister: (minister: Minister) => void;
  selectProvince: (provinceId: string | null) => void;
  setShowEventModal: (event: GameEvent | null) => void;
  dismissEvent: () => void;
  resetGame: () => void;
  setShowNewGameDialog: (show: boolean) => void;
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

      startNewGame: (name, partyName, difficulty) => {
        const state = createInitialGameState(difficulty);
        state.player.name = name || 'Comrade Leader';
        state.player.partyName = partyName || 'Zimbabwe Peoples Party';
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

        // Simulate the turn
        const newState = simulateTurn(gameState);
        const historyPoint = getHistoricalDataPoint(newState);

        // Generate new projects occasionally
        let availableProjects = get().availableProjects;
        if (Math.random() < 0.4) {
          availableProjects = [...availableProjects, ...generateAvailableProjects(newState)].slice(0, 15);
        }

        // Check for unresolved events that need attention
        const unresolvedEvent = newState.events.find(e => !e.resolved && e.choices && e.choices.length > 0);

        set({
          gameState: newState,
          historicalData: [...get().historicalData, historyPoint],
          availableProjects,
          isProcessingTurn: false,
          showEventModal: unresolvedEvent || null,
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

        // Apply effects
        for (const effect of choice.effects) {
          applyEffect(newState, effect.target, effect.operation, effect.value);
        }

        event.resolved = true;
        event.choiceMade = choiceId;
        newState.player.popularity = Math.max(0, Math.min(100, newState.player.popularity + choice.popularityImpact));
        newState.player.politicalInfluence = Math.max(0, Math.min(100, newState.player.politicalInfluence + choice.politicalRisk));
        newState.gameLog.push(`Decision: ${event.title} — Chose: "${choice.text}"`);

        set({ gameState: newState, showEventModal: null });
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
        if (minister) {
          minister.isActive = false;
          newState.gameLog.push(`Minister fired: ${minister.name} (${minister.portfolio})`);
        }
        set({ gameState: newState });
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

      selectProvince: (provinceId) => set({ selectedProvince: provinceId }),
      setShowEventModal: (event) => set({ showEventModal: event }),
      dismissEvent: () => set({ showEventModal: null }),
      resetGame: () => set({ gameState: null, currentScreen: 'start', historicalData: [], availableProjects: [] }),
      setShowNewGameDialog: (show) => set({ showNewGameDialog: show }),
    }),
    {
      name: 'mgza-game-store',
      partialize: (state) => ({
        gameState: state.gameState,
        historicalData: state.historicalData,
        availableProjects: state.availableProjects,
      }),
    }
  )
);

// Helper to apply event effects to game state
function applyEffect(state: GameState, target: string, operation: string, value: number): void {
  const parts = target.split('.');
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
