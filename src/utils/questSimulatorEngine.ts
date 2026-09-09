/**
 * questSimulatorEngine.ts
 *
 * Motor de simulación de progresión y playtesting del jugador para FTB Quests.
 * Permite simular una partida real desde cero:
 * - Desbloqueo dinámico por dependencias (estándar, mínimas y entre capítulos).
 * - Inventario virtual acumulativo de ítems entregados como recompensas.
 * - Contador de Experiencia (Puntos y Niveles de Minecraft).
 * - Tirada ponderada real de Tablas de Recompensas (Loot Tables) con probabilidades.
 * - Resolución de prerrequisitos en cascada y reversión de misiones.
 */

import type { RewardTable } from '../types/rewardTable';

export interface VirtualRewardGrant {
  type: string;
  id?: string;
  item?: any;
  count?: number;
  xp?: number;
  xpLevels?: number;
  title?: string;
  tableName?: string;
}

export interface SimulatorHistoryEntry {
  questId: string;
  questTitle: string;
  timestamp: number;
  rewards: VirtualRewardGrant[];
}

export interface SimulatorState {
  isActive: boolean;
  completedQuestIds: Set<string>;
  unlockedQuestIds: Set<string>;
  virtualInventory: Record<string, { count: number; icon?: any; title?: string }>;
  virtualXp: number;
  virtualXpLevels: number;
  history: SimulatorHistoryEntry[];
}

/**
 * Normaliza cualquier ID de misión a string hexadecimal en mayúsculas
 */
export function normalizeQuestId(rawId: any): string {
  if (rawId === undefined || rawId === null) return '';
  if (typeof rawId === 'string') return rawId.toUpperCase();
  if (typeof rawId === 'number') return rawId.toString(16).toUpperCase();
  if (typeof rawId === 'object' && rawId.id) return String(rawId.id).toUpperCase();
  return String(rawId).toUpperCase();
}

/**
 * Determina si una misión está desbloqueada en base a las misiones completadas actualmente.
 */
export function isQuestUnlocked(
  quest: any,
  completedIds: Set<string>
): boolean {
  const qId = normalizeQuestId(quest.id);
  if (completedIds.has(qId)) return true;

  const rawDeps: any[] = quest.dependencies || [];
  if (!Array.isArray(rawDeps) || rawDeps.length === 0) {
    return true; // Misión raíz sin prerrequisitos
  }

  const depIds: string[] = rawDeps.map((d: any) => {
    if (typeof d === 'string' || typeof d === 'number') return normalizeQuestId(d);
    if (typeof d === 'object' && d.id) return normalizeQuestId(d.id);
    return '';
  }).filter(Boolean);

  if (depIds.length === 0) return true;

  const minRequired = typeof quest.min_required_dependencies === 'number' && quest.min_required_dependencies > 0
    ? quest.min_required_dependencies
    : depIds.length;

  let satisfiedCount = 0;
  for (const depId of depIds) {
    if (completedIds.has(depId)) {
      satisfiedCount++;
    }
  }

  return satisfiedCount >= minRequired;
}

/**
 * Recalcula el conjunto de misiones desbloqueadas para el conjunto de misiones dadas.
 */
export function computeUnlockedQuests(
  allQuests: any[],
  completedIds: Set<string>
): Set<string> {
  const unlocked = new Set<string>();

  for (const quest of allQuests) {
    const qId = normalizeQuestId(quest.id);
    if (isQuestUnlocked(quest, completedIds)) {
      unlocked.add(qId);
    }
  }

  return unlocked;
}

/**
 * Realiza una tirada ponderada sobre una RewardTable de FTB Quests.
 */
export function rollRewardTableItem(table: RewardTable): { item: any; count: number; title: string } | null {
  const rewards = table.rewards || [];
  if (rewards.length === 0) return null;

  let totalWeight = 0;
  for (const r of rewards) {
    const w = typeof r.weight === 'number' && r.weight > 0 ? r.weight : 1;
    totalWeight += w;
  }

  if (totalWeight <= 0) return null;

  let randomVal = Math.random() * totalWeight;
  for (const r of rewards) {
    const w = typeof r.weight === 'number' && r.weight > 0 ? r.weight : 1;
    if (randomVal <= w) {
      const count = typeof r.count === 'number' ? r.count : 1;
      const title = r.title || (typeof r.item === 'string' ? r.item : r.item?.id || 'Recompensa');
      return { item: r.item, count, title };
    }
    randomVal -= w;
  }

  const fallback = rewards[0];
  return {
    item: fallback.item,
    count: typeof fallback.count === 'number' ? fallback.count : 1,
    title: fallback.title || 'Recompensa',
  };
}

/**
 * Completa una misión, recolecta sus recompensas e incrementa el inventario y XP virtual.
 */
export function completeQuestInSimulator(
  questId: string,
  state: SimulatorState,
  allQuests: any[],
  rewardTables: RewardTable[] = []
): SimulatorState {
  const normalizedId = normalizeQuestId(questId);
  if (state.completedQuestIds.has(normalizedId)) {
    // Si ya está completada, alternar a des-completar
    return uncompleteQuestInSimulator(normalizedId, state, allQuests);
  }

  const quest = allQuests.find((q) => normalizeQuestId(q.id) === normalizedId);
  const nextCompleted = new Set(state.completedQuestIds);
  nextCompleted.add(normalizedId);

  const nextInventory = { ...state.virtualInventory };
  let nextXp = state.virtualXp;
  let nextXpLevels = state.virtualXpLevels;
  const grantedRewards: VirtualRewardGrant[] = [];

  if (quest && Array.isArray(quest.rewards)) {
    for (const rew of quest.rewards) {
      const rewType = rew.type || 'item';

      if (rewType === 'item') {
        const itemObj = rew.item;
        const itemId = typeof itemObj === 'string' ? itemObj : itemObj?.id || 'item_desconocido';
        const count = typeof rew.count === 'number' ? rew.count : 1;
        const current = nextInventory[itemId] || { count: 0, icon: itemObj, title: rew.title || itemId };
        nextInventory[itemId] = {
          count: current.count + count,
          icon: itemObj,
          title: rew.title || itemId,
        };
        grantedRewards.push({ type: 'item', id: itemId, item: itemObj, count, title: rew.title });
      } else if (rewType === 'xp') {
        const xpAmount = typeof rew.xp === 'number' ? rew.xp : 100;
        nextXp += xpAmount;
        grantedRewards.push({ type: 'xp', xp: xpAmount });
      } else if (rewType === 'xp_levels') {
        const lvlAmount = typeof rew.xp_levels === 'number' ? rew.xp_levels : 1;
        nextXpLevels += lvlAmount;
        grantedRewards.push({ type: 'xp_levels', xpLevels: lvlAmount });
      } else if (rewType === 'loot' || rewType === 'choice') {
        const tableId = normalizeQuestId(rew.table_id || rew.table);
        const matchedTable = rewardTables.find((t) => normalizeQuestId(t.id) === tableId);
        if (matchedTable) {
          const rolled = rollRewardTableItem(matchedTable);
          if (rolled) {
            const itemId = typeof rolled.item === 'string' ? rolled.item : rolled.item?.id || 'loot_item';
            const current = nextInventory[itemId] || { count: 0, icon: rolled.item, title: rolled.title };
            nextInventory[itemId] = {
              count: current.count + rolled.count,
              icon: rolled.item,
              title: rolled.title,
            };
            grantedRewards.push({
              type: 'loot',
              tableName: matchedTable.title || tableId,
              item: rolled.item,
              count: rolled.count,
              title: rolled.title,
            });
          }
        }
      }
    }
  }

  const nextUnlocked = computeUnlockedQuests(allQuests, nextCompleted);

  const newHistoryEntry: SimulatorHistoryEntry = {
    questId: normalizedId,
    questTitle: quest?.title || `Misión ${normalizedId}`,
    timestamp: Date.now(),
    rewards: grantedRewards,
  };

  return {
    ...state,
    completedQuestIds: nextCompleted,
    unlockedQuestIds: nextUnlocked,
    virtualInventory: nextInventory,
    virtualXp: nextXp,
    virtualXpLevels: nextXpLevels,
    history: [newHistoryEntry, ...state.history],
  };
}

/**
 * Des-completa una misión y revierte en cascada las misiones hijas que dependan de ella.
 */
export function uncompleteQuestInSimulator(
  questId: string,
  state: SimulatorState,
  allQuests: any[]
): SimulatorState {
  const normalizedId = normalizeQuestId(questId);
  const nextCompleted = new Set(state.completedQuestIds);
  nextCompleted.delete(normalizedId);

  // Recalcular dependientes recursivamente
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of allQuests) {
      const qId = normalizeQuestId(q.id);
      if (nextCompleted.has(qId) && !isQuestUnlocked(q, nextCompleted)) {
        nextCompleted.delete(qId);
        changed = true;
      }
    }
  }

  const nextUnlocked = computeUnlockedQuests(allQuests, nextCompleted);

  return {
    ...state,
    completedQuestIds: nextCompleted,
    unlockedQuestIds: nextUnlocked,
  };
}

/**
 * Completa todos los prerrequisitos necesarios en cadena para alcanzar una misión específica.
 */
export function completeAllPrerequisitesInSimulator(
  targetQuestId: string,
  state: SimulatorState,
  allQuests: any[],
  rewardTables: RewardTable[] = []
): SimulatorState {
  const targetId = normalizeQuestId(targetQuestId);
  const questMap = new Map<string, any>();
  for (const q of allQuests) {
    questMap.set(normalizeQuestId(q.id), q);
  }

  // Búsqueda topológica de dependencias
  const toCompleteOrder: string[] = [];
  const visited = new Set<string>();

  function dfs(currId: string) {
    if (visited.has(currId)) return;
    visited.add(currId);

    const q = questMap.get(currId);
    if (!q) return;

    const deps = q.dependencies || [];
    for (const d of deps) {
      const depId = normalizeQuestId(typeof d === 'object' ? d.id : d);
      if (depId && !state.completedQuestIds.has(depId)) {
        dfs(depId);
      }
    }

    if (!state.completedQuestIds.has(currId) && currId !== targetId) {
      toCompleteOrder.push(currId);
    }
  }

  dfs(targetId);

  let currentState = state;
  for (const depId of toCompleteOrder) {
    currentState = completeQuestInSimulator(depId, currentState, allQuests, rewardTables);
  }

  return currentState;
}

/**
 * Inicializa el estado base del simulador
 */
export function createInitialSimulatorState(allQuests: any[]): SimulatorState {
  const initialCompleted = new Set<string>();
  const initialUnlocked = computeUnlockedQuests(allQuests, initialCompleted);

  return {
    isActive: true,
    completedQuestIds: initialCompleted,
    unlockedQuestIds: initialUnlocked,
    virtualInventory: {},
    virtualXp: 0,
    virtualXpLevels: 0,
    history: [],
  };
}
