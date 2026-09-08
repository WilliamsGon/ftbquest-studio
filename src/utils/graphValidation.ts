export interface GraphValidationResult {
  cycles: string[][];
  cycleNodeIds: Set<string>;
  brokenDeps: { questId: string; missingDepId: string }[];
  brokenDepQuestIds: Set<string>;
  isValid: boolean;
}

/**
 * Valida la integridad del grafo de misiones de FTB Quests:
 * - Detección de ciclos/bucles de dependencias (evita cuelgues en el juego)
 * - Detección de dependencias que apuntan a IDs inexistentes en el capítulo
 */
export function validateQuestGraph(quests: any[]): GraphValidationResult {
  const questIdSet = new Set<string>();
  const adj = new Map<string, string[]>(); // questId -> list of dependency questIds

  quests.forEach(q => {
    if (q && q.id) {
      questIdSet.add(q.id);
      
      let deps: string[] = [];
      if (Array.isArray(q.dependencies)) {
        deps = q.dependencies.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
      } else if (typeof q.dependencies === 'string') {
        deps = [q.dependencies];
      } else if (typeof q.dependencies === 'object' && q.dependencies !== null && q.dependencies.id) {
        deps = [q.dependencies.id];
      }
      adj.set(q.id, deps);
    }
  });

  const brokenDeps: { questId: string; missingDepId: string }[] = [];
  const brokenDepQuestIds = new Set<string>();

  // 1. Detectar dependencias rotas
  adj.forEach((deps, qId) => {
    deps.forEach(depId => {
      if (!questIdSet.has(depId)) {
        brokenDeps.push({ questId: qId, missingDepId: depId });
        brokenDepQuestIds.add(qId);
      }
    });
  });

  // 2. Detectar ciclos usando DFS con estados (0: sin visitar, 1: en progreso, 2: completado)
  const state = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: string[][] = [];
  const cycleNodeIds = new Set<string>();

  const dfs = (u: string, path: string[]) => {
    state.set(u, 1);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (!questIdSet.has(v)) continue;

      const vState = state.get(v) ?? 0;
      if (vState === 1) {
        // Ciclo detectado
        const cycleStartIndex = path.indexOf(v);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex).concat(v);
          cycles.push(cyclePath);
          cyclePath.forEach(id => cycleNodeIds.add(id));
        }
      } else if (vState === 0) {
        parent.set(v, u);
        dfs(v, path);
      }
    }

    path.pop();
    state.set(u, 2);
  };

  questIdSet.forEach(qId => {
    if ((state.get(qId) ?? 0) === 0) {
      dfs(qId, []);
    }
  });

  return {
    cycles,
    cycleNodeIds,
    brokenDeps,
    brokenDepQuestIds,
    isValid: cycles.length === 0 && brokenDeps.length === 0
  };
}
