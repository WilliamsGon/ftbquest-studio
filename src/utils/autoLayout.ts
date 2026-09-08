/**
 * Auto-Layout (DAG Sugiyama / Topological Layering) para misiones de FTB Quests.
 * 
 * Organiza grafos de misiones respetando la direccion de dependencias:
 * - Prerrequisitos (dependencias) se ubican en capas previas.
 * - Dependientes se ubican en capas posteriores.
 * - Minimiza el cruce de cables mediante ordenamiento por baricentro.
 * - Preserva el centroide original de las misiones para que no salten a coordenadas lejanas.
 */

export interface AutoLayoutOptions {
  direction?: 'LR' | 'TB';      // 'LR' = Horizontal (Izquierda a Derecha), 'TB' = Vertical (Arriba a Abajo)
  nodeSpacing?: number;         // Espaciado entre nodos hermanos paralelos en la misma capa (default: 2.0)
  layerSpacing?: number;        // Espaciado entre capas o niveles de progresion (default: 2.5)
  targetQuestIds?: string[];    // Si se pasa, solo reubica este subconjunto de misiones
}

export interface AutoLayoutResult {
  positions: Map<string, { x: number; y: number }>;
  totalLayers: number;
  organizedCount: number;
}

function getDValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof val.value === 'number') return val.value;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
}

function extractDependencies(q: any): string[] {
  if (!q || !q.dependencies) return [];
  if (Array.isArray(q.dependencies)) {
    return q.dependencies.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
  }
  if (typeof q.dependencies === 'string') return [q.dependencies];
  if (typeof q.dependencies === 'object' && q.dependencies.id) return [q.dependencies.id];
  return [];
}

export function computeAutoLayout(
  allQuests: any[],
  options: AutoLayoutOptions = {}
): AutoLayoutResult {
  const direction = options.direction || 'LR';
  const nodeSpacing = options.nodeSpacing ?? 2.0;
  const layerSpacing = options.layerSpacing ?? 2.5;

  // 1. Filtrar misiones objetivo
  const allMap = new Map<string, any>();
  allQuests.forEach(q => {
    if (q && q.id !== undefined && q.id !== null) {
      allMap.set(String(q.id), q);
    }
  });

  const targetSet = new Set<string>();
  if (options.targetQuestIds && options.targetQuestIds.length > 0) {
    options.targetQuestIds.forEach(id => {
      const idStr = String(id);
      if (allMap.has(idStr)) targetSet.add(idStr);
    });
  } else {
    allQuests.forEach(q => {
      if (q && q.id !== undefined && q.id !== null) {
        targetSet.add(String(q.id));
      }
    });
  }

  const targetQuests = Array.from(targetSet).map(id => allMap.get(id)!);
  if (targetQuests.length === 0) {
    return { positions: new Map(), totalLayers: 0, organizedCount: 0 };
  }

  // 2. Construir grafo dirigido restringido al targetSet
  // Prereqs: p -> u (p es prerrequisito de u)
  const prereqsOf = new Map<string, string[]>();
  const dependentsOf = new Map<string, string[]>();

  targetSet.forEach(id => {
    prereqsOf.set(id, []);
    dependentsOf.set(id, []);
  });

  targetQuests.forEach(q => {
    const qId = String(q.id);
    const rawDeps = extractDependencies(q).map(d => String(d));
    const validDeps = rawDeps.filter(depId => targetSet.has(depId) && depId !== qId);
    prereqsOf.set(qId, validDeps);
    validDeps.forEach(depId => {
      if (dependentsOf.has(depId)) {
        dependentsOf.get(depId)!.push(qId);
      }
    });
  });

  // 3. Deteccion y ruptura de ciclos defensiva para evitar bucles infinitos
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const backEdges = new Set<string>(); // 'from->to'

  function detectCyclesDFS(node: string) {
    visited.add(node);
    inStack.add(node);

    const children = dependentsOf.get(node) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        detectCyclesDFS(child);
      } else if (inStack.has(child)) {
        // Enlace de retroceso (ciclo detectado)
        backEdges.add(`${node}->${child}`);
      }
    }
    inStack.delete(node);
  }

  targetSet.forEach(id => {
    if (!visited.has(id)) {
      detectCyclesDFS(id);
    }
  });

  // 4. Asignacion de capas topologicas (Longest Path)
  // layer(u) = max(layer(p) + 1) para todos los prereqs no ciclicos
  const layerOf = new Map<string, number>();
  targetSet.forEach(id => layerOf.set(id, 0));

  let changed = true;
  let iterations = 0;
  const maxIterations = targetQuests.length + 5;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    targetSet.forEach(u => {
      const currentLayer = layerOf.get(u)!;
      const parents = prereqsOf.get(u) || [];
      for (const p of parents) {
        if (backEdges.has(`${p}->${u}`)) continue; // omitir enlaces de retroceso
        const pLayer = layerOf.get(p)!;
        if (pLayer + 1 > currentLayer) {
          layerOf.set(u, pLayer + 1);
          changed = true;
        }
      }
    });
  }

  // Agrupar nodos por capa
  const maxLayer = Math.max(0, ...Array.from(layerOf.values()));
  const layers: string[][] = Array.from({ length: maxLayer + 1 }, () => []);

  targetSet.forEach(id => {
    const l = layerOf.get(id)!;
    layers[l].push(id);
  });

  // 5. Ordenamiento de nodos en cada capa para minimizar cruces (Heuristica de Baricentro)
  // Pasar de izquierda a derecha (hacia adelante)
  for (let l = 1; l <= maxLayer; l++) {
    const prevLayerPositions = new Map<string, number>();
    layers[l - 1].forEach((id, idx) => prevLayerPositions.set(id, idx));

    layers[l].sort((a, b) => {
      const aParents = (prereqsOf.get(a) || []).filter(p => prevLayerPositions.has(p));
      const bParents = (prereqsOf.get(b) || []).filter(p => prevLayerPositions.has(p));

      const aBary = aParents.length > 0
        ? aParents.reduce((sum, p) => sum + prevLayerPositions.get(p)!, 0) / aParents.length
        : 999;
      const bBary = bParents.length > 0
        ? bParents.reduce((sum, p) => sum + prevLayerPositions.get(p)!, 0) / bParents.length
        : 999;

      return aBary - bBary;
    });
  }

  // Pasar de derecha a izquierda (hacia atras) para refinar
  for (let l = maxLayer - 1; l >= 0; l--) {
    const nextLayerPositions = new Map<string, number>();
    layers[l + 1].forEach((id, idx) => nextLayerPositions.set(id, idx));

    layers[l].sort((a, b) => {
      const aChildren = (dependentsOf.get(a) || []).filter(c => nextLayerPositions.has(c));
      const bChildren = (dependentsOf.get(b) || []).filter(c => nextLayerPositions.has(c));

      const aBary = aChildren.length > 0
        ? aChildren.reduce((sum, c) => sum + nextLayerPositions.get(c)!, 0) / aChildren.length
        : 999;
      const bBary = bChildren.length > 0
        ? bChildren.reduce((sum, c) => sum + nextLayerPositions.get(c)!, 0) / bChildren.length
        : 999;

      return aBary - bBary;
    });
  }

  // 6. Asignar coordenadas (X, Y)
  const rawPositions = new Map<string, { x: number; y: number }>();

  layers.forEach((layerNodes, layerIndex) => {
    const count = layerNodes.length;
    layerNodes.forEach((nodeId, nodeIndex) => {
      // Posicion perpendicular centrada simetricamente en 0
      const perpOffset = (nodeIndex - (count - 1) / 2) * nodeSpacing;
      // Posicion a lo largo del eje de progresion
      const parallelOffset = layerIndex * layerSpacing;

      if (direction === 'LR') {
        rawPositions.set(nodeId, { x: parallelOffset, y: perpOffset });
      } else {
        rawPositions.set(nodeId, { x: perpOffset, y: parallelOffset });
      }
    });
  });

  // 7. Preservar centro de masa original del conjunto de misiones organizadas
  let originalSumX = 0;
  let originalSumY = 0;
  targetQuests.forEach(q => {
    originalSumX += getDValue(q.x);
    originalSumY += getDValue(q.y);
  });
  const origCenterX = originalSumX / targetQuests.length;
  const origCenterY = originalSumY / targetQuests.length;

  let newSumX = 0;
  let newSumY = 0;
  rawPositions.forEach(pos => {
    newSumX += pos.x;
    newSumY += pos.y;
  });
  const newCenterX = newSumX / targetQuests.length;
  const newCenterY = newSumY / targetQuests.length;

  const shiftX = origCenterX - newCenterX;
  const shiftY = origCenterY - newCenterY;

  // Generar posiciones finales redondeadas a saltos de 0.5 (cuadricula estandar de FTB Quests)
  const finalPositions = new Map<string, { x: number; y: number }>();
  rawPositions.forEach((pos, id) => {
    const rawX = pos.x + shiftX;
    const rawY = pos.y + shiftY;
    // Redondear a multiplos de 0.5
    const snappedX = Math.round(rawX * 2) / 2;
    const snappedY = Math.round(rawY * 2) / 2;
    finalPositions.set(id, { x: snappedX, y: snappedY });
  });

  return {
    positions: finalPositions,
    totalLayers: maxLayer + 1,
    organizedCount: targetQuests.length
  };
}
