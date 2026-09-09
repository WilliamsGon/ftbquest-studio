import type { ChapterTab } from '../types/chapter';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';
import type {
  ModpackAnalyticsReport,
  ChapterAnalyticsItem,
  GroupAnalyticsItem,
  EconomyAnalytics,
  BottleneckQuest,
  OrphanQuest
} from '../types/analytics';

/**
 * Extrae de forma segura un valor numérico de estructuras SNBT primitivas o números directos.
 */
export function extractNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'object' && val !== null && 'value' in val) {
    const num = Number(val.value);
    return isNaN(num) ? fallback : num;
  }
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Extrae los IDs de dependencias de una misión de forma unificada.
 */
export function extractDependencies(deps: any): string[] {
  if (!deps) return [];
  if (Array.isArray(deps)) {
    return deps.map((d: any) => {
      if (typeof d === 'string') return d;
      if (typeof d === 'object' && d !== null && d.id) return String(d.id);
      return String(d);
    }).filter(Boolean);
  }
  if (typeof deps === 'string') return [deps];
  if (typeof deps === 'object' && deps.id) return [String(deps.id)];
  return [];
}

/**
 * Calcula todas las estadísticas y métricas del modpack en memoria.
 */
export function calculateModpackAnalytics(
  chapters: ChapterTab[] = [],
  rewardTables: RewardTable[] = [],
  chapterGroups: ChapterGroup[] = []
): ModpackAnalyticsReport {
  let totalQuests = 0;
  let emptyChaptersCount = 0;

  // Mapa de grupos por ID para consulta rápida
  const groupMap = new Map<string, string>();
  chapterGroups.forEach((g) => {
    groupMap.set(g.id, g.title);
  });

  // Mapa global de misiones: questId -> metadata
  interface QuestMeta {
    quest: any;
    chapterId: string;
    chapterTitle: string;
    dependencies: string[];
  }
  const allQuestsMap = new Map<string, QuestMeta>();
  // Invert graph: prerequisiteId -> Set of dependentQuestIds
  const downstreamMap = new Map<string, Set<string>>();

  // 1. Recolección de capítulos y misiones
  chapters.forEach((ch) => {
    const questList = Array.isArray(ch.quests) ? ch.quests : [];
    if (questList.length === 0) {
      emptyChaptersCount++;
    }

    questList.forEach((q) => {
      if (!q || !q.id) return;
      const qId = String(q.id);
      totalQuests++;

      const deps = extractDependencies(q.dependencies);
      allQuestsMap.set(qId, {
        quest: q,
        chapterId: ch.id,
        chapterTitle: ch.title || ch.filename || 'Sin Título',
        dependencies: deps
      });

      // Registrar en el grafo downstream
      deps.forEach((depId) => {
        if (!downstreamMap.has(depId)) {
          downstreamMap.set(depId, new Set<string>());
        }
        downstreamMap.get(depId)!.add(qId);
      });
    });
  });

  // 2. Distribución por capítulos
  const chapterDistribution: ChapterAnalyticsItem[] = chapters.map((ch) => {
    const questCount = Array.isArray(ch.quests) ? ch.quests.length : 0;
    const percentage = totalQuests > 0 ? Number(((questCount / totalQuests) * 100).toFixed(1)) : 0;
    
    let rawGroup = ch.snbtData?.group;
    if (typeof rawGroup === 'object' && rawGroup !== null && 'value' in rawGroup) {
      rawGroup = rawGroup.value;
    }
    const groupId = rawGroup ? String(rawGroup) : null;
    const groupTitle = groupId ? (groupMap.get(groupId) || 'Grupo Desconocido') : 'Sin Grupo';

    return {
      id: ch.id,
      title: ch.title || ch.filename || 'Capítulo Sin Nombre',
      filename: ch.filename,
      questCount,
      percentage,
      groupId,
      groupTitle
    };
  });

  // 3. Distribución por grupos de capítulos
  const groupCounts = new Map<string, { groupTitle: string; chapterCount: number; questCount: number }>();
  
  // Inicializar con grupos conocidos
  chapterGroups.forEach((g) => {
    groupCounts.set(g.id, {
      groupTitle: g.title,
      chapterCount: 0,
      questCount: 0
    });
  });
  // Entrada para huérfanos de grupo
  groupCounts.set('ungrouped', {
    groupTitle: 'Sin Grupo',
    chapterCount: 0,
    questCount: 0
  });

  chapterDistribution.forEach((cd) => {
    const targetKey = cd.groupId && groupCounts.has(cd.groupId) ? cd.groupId : 'ungrouped';
    const entry = groupCounts.get(targetKey)!;
    entry.chapterCount += 1;
    entry.questCount += cd.questCount;
  });

  const groupDistribution: GroupAnalyticsItem[] = Array.from(groupCounts.entries())
    .map(([groupId, data]) => ({
      groupId,
      groupTitle: data.groupTitle,
      chapterCount: data.chapterCount,
      questCount: data.questCount,
      percentage: totalQuests > 0 ? Number(((data.questCount / totalQuests) * 100).toFixed(1)) : 0
    }))
    .filter((g) => g.chapterCount > 0 || g.groupId !== 'ungrouped'); // Mostrar solo activos o creados

  // 4. Análisis de Economía y Recompensas / Tareas
  let totalDirectXp = 0;
  let totalXpLevels = 0;
  let totalLootCratesRewards = 0;
  let itemTasksCount = 0;
  let killTasksCount = 0;
  let otherTasksCount = 0;
  let totalTasks = 0;
  const tasksBreakdown: Record<string, number> = {};
  const rewardsBreakdown: Record<string, number> = {};

  allQuestsMap.forEach(({ quest }) => {
    // Tareas
    const tasks = Array.isArray(quest.tasks) ? quest.tasks : [];
    tasks.forEach((t: any) => {
      totalTasks++;
      const tType = t?.type || 'item';
      tasksBreakdown[tType] = (tasksBreakdown[tType] || 0) + 1;

      if (tType === 'item') {
        itemTasksCount++;
      } else if (tType === 'kill') {
        killTasksCount++;
      } else {
        otherTasksCount++;
      }
    });

    // Recompensas
    const rewards = Array.isArray(quest.rewards) ? quest.rewards : [];
    rewards.forEach((r: any) => {
      const rType = r?.type || 'item';
      rewardsBreakdown[rType] = (rewardsBreakdown[rType] || 0) + 1;

      if (rType === 'xp') {
        const val = extractNumber(r.xp ?? r.value ?? r.points ?? 0);
        totalDirectXp += val;
      } else if (rType === 'xp_levels') {
        const val = extractNumber(r.xp_levels ?? r.value ?? r.levels ?? 0);
        totalXpLevels += val;
      } else if (rType === 'random' || r.table_id !== undefined || rType === 'loot') {
        totalLootCratesRewards++;
      }
    });
  });

  const rewardTablesWithCrates = rewardTables.filter((t) => !!t.loot_crate).length;
  const itemToKillRatio = killTasksCount === 0
    ? itemTasksCount
    : Number((itemTasksCount / killTasksCount).toFixed(2));

  const economy: EconomyAnalytics = {
    totalDirectXp,
    totalXpLevels,
    totalLootCratesRewards,
    totalRewardTables: rewardTables.length,
    rewardTablesWithCrates,
    itemTasksCount,
    killTasksCount,
    itemToKillRatio,
    otherTasksCount,
    totalTasks,
    tasksBreakdown,
    rewardsBreakdown
  };

  // 5. Análisis de Cuellos de Botella y Misiones Huérfanas
  const bottlenecks: BottleneckQuest[] = [];
  const orphans: OrphanQuest[] = [];

  // Función para calcular dependientes transitivos (conteo de alcance aguas abajo con prevención de bucles)
  const computeTransitiveCount = (startId: string): number => {
    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const down = downstreamMap.get(curr);
      if (down) {
        down.forEach((nextId) => {
          if (!visited.has(nextId)) {
            visited.add(nextId);
            queue.push(nextId);
          }
        });
      }
    }
    // Restamos el nodo inicial
    return Math.max(0, visited.size - 1);
  };

  allQuestsMap.forEach(({ quest, chapterId, chapterTitle, dependencies }, qId) => {
    const directDependents = downstreamMap.get(qId);
    const directCount = directDependents ? directDependents.size : 0;
    const hasDeps = dependencies.length > 0;

    // Detección de Huérfanas: Sin dependencias entrantes Y sin dependientes salientes
    if (!hasDeps && directCount === 0) {
      orphans.push({
        id: qId,
        title: quest.title || quest.subtitle || `Misión #${qId.slice(-4)}`,
        chapterId,
        chapterTitle,
        x: extractNumber(quest.x, 0),
        y: extractNumber(quest.y, 0),
        icon: quest.icon
      });
    }

    // Detección de Cuellos de Botella: Nodos críticos de los que dependen múltiples misiones
    if (directCount >= 2) {
      const transitiveCount = computeTransitiveCount(qId);
      bottlenecks.push({
        id: qId,
        title: quest.title || quest.subtitle || `Misión #${qId.slice(-4)}`,
        chapterId,
        chapterTitle,
        directDependentsCount: directCount,
        transitiveDependentsCount: transitiveCount,
        x: extractNumber(quest.x, 0),
        y: extractNumber(quest.y, 0),
        icon: quest.icon
      });
    }
  });

  // Ordenar cuellos de botella por impacto: primero transitivos, luego directos
  bottlenecks.sort((a, b) => {
    if (b.transitiveDependentsCount !== a.transitiveDependentsCount) {
      return b.transitiveDependentsCount - a.transitiveDependentsCount;
    }
    return b.directDependentsCount - a.directDependentsCount;
  });

  // Ordenar huérfanas alfabéticamente por capítulo y título
  orphans.sort((a, b) => a.chapterTitle.localeCompare(b.chapterTitle));

  return {
    totalChapters: chapters.length,
    emptyChaptersCount,
    totalQuests,
    chapterDistribution,
    groupDistribution,
    economy,
    bottlenecks,
    orphans,
    totalRewardTables: rewardTables.length,
    totalChapterGroups: chapterGroups.length
  };
}
