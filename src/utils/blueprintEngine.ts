import type { Blueprint } from '../types/blueprints';

export function generateHexId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

export const OFFICIAL_BLUEPRINTS: Blueprint[] = [
  // 1. Progresión por Tiers (5 Niveles)
  {
    id: 'tier_progression_5',
    title: 'Progresión por Tiers (5 Niveles)',
    description: 'Rama escalonada de 5 niveles conectados en serie: Básico ➔ Avanzado ➔ Élite ➔ Maestro ➔ Definitivo.',
    category: 'progression',
    icon: 'minecraft:netherite_upgrade_smithing_template',
    quests: [
      {
        id: 'T1',
        title: 'Tier 1: Básico',
        subtitle: 'Primeros pasos e infraestructura inicial',
        x: -4.0,
        y: 0.0,
        shape: 'square',
        tasks: [{ id: 'task_t1', type: 'item', item: 'minecraft:iron_ingot', count: 8 }],
        rewards: [{ id: 'rew_t1', type: 'xp', xp: 50 }],
        dependencies: []
      },
      {
        id: 'T2',
        title: 'Tier 2: Avanzado',
        subtitle: 'Metales pesados y automatización temprana',
        x: -2.0,
        y: 0.0,
        shape: 'hexagon',
        tasks: [{ id: 'task_t2', type: 'item', item: 'minecraft:gold_ingot', count: 8 }],
        rewards: [{ id: 'rew_t2', type: 'xp', xp: 100 }],
        dependencies: ['T1']
      },
      {
        id: 'T3',
        title: 'Tier 3: Élite',
        subtitle: 'Aleaciones complejas y energía estable',
        x: 0.0,
        y: 0.0,
        shape: 'diamond',
        tasks: [{ id: 'task_t3', type: 'item', item: 'minecraft:diamond', count: 4 }],
        rewards: [{ id: 'rew_t3', type: 'xp', xp: 250 }],
        dependencies: ['T2']
      },
      {
        id: 'T4',
        title: 'Tier 4: Maestro',
        subtitle: 'Materiales del inframundo y precisión industrial',
        x: 2.0,
        y: 0.0,
        shape: 'pentagon',
        tasks: [{ id: 'task_t4', type: 'item', item: 'minecraft:netherite_ingot', count: 1 }],
        rewards: [{ id: 'rew_t4', type: 'xp', xp: 500 }],
        dependencies: ['T3']
      },
      {
        id: 'T5',
        title: 'Tier 5: Definitivo',
        subtitle: 'Poder absoluto y maestría total',
        x: 4.0,
        y: 0.0,
        shape: 'octagon',
        tasks: [{ id: 'task_t5', type: 'item', item: 'minecraft:nether_star', count: 1 }],
        rewards: [{ id: 'rew_t5', type: 'xp', xp: 1000 }],
        dependencies: ['T4']
      }
    ]
  },

  // 2. Boss Rush (Pirámide de Jefes)
  {
    id: 'boss_rush_pyramid',
    title: 'Boss Rush (Pirámide de Jefes)',
    description: 'Estructura piramidal con 3 jefes de apertura, 2 jefes mayores intermedios y el Boss Final en la cúspide.',
    category: 'combat',
    icon: 'minecraft:netherite_sword',
    quests: [
      // Base: 3 jefes
      {
        id: 'B1',
        title: 'Desafío I: Bestias Terrestres',
        subtitle: 'Derrota a las amenazas superficiales',
        x: -2.5,
        y: 2.0,
        shape: 'rsquare',
        tasks: [{ id: 'task_b1', type: 'kill', entity: 'minecraft:ravager', value: 1 }],
        rewards: [{ id: 'rew_b1', type: 'xp', xp: 150 }],
        dependencies: []
      },
      {
        id: 'B2',
        title: 'Desafío II: Ojo del Abismo',
        subtitle: 'Explora las profundidades marinas',
        x: 0.0,
        y: 2.0,
        shape: 'rsquare',
        tasks: [{ id: 'task_b2', type: 'kill', entity: 'minecraft:elder_guardian', value: 1 }],
        rewards: [{ id: 'rew_b2', type: 'xp', xp: 200 }],
        dependencies: []
      },
      {
        id: 'B3',
        title: 'Desafío III: Furia de la Incursión',
        subtitle: 'Vence a los invocadores oscuros',
        x: 2.5,
        y: 2.0,
        shape: 'rsquare',
        tasks: [{ id: 'task_b3', type: 'kill', entity: 'minecraft:evoker', value: 2 }],
        rewards: [{ id: 'rew_b3', type: 'xp', xp: 150 }],
        dependencies: []
      },
      // Nivel medio: 2 jefes
      {
        id: 'B_MID1',
        title: 'Guardián del Nether: Wither',
        subtitle: 'Reclama la estrella de las sombras',
        x: -1.25,
        y: 0.5,
        shape: 'diamond',
        tasks: [{ id: 'task_bm1', type: 'kill', entity: 'minecraft:wither', value: 1 }],
        rewards: [{ id: 'rew_bm1', type: 'xp', xp: 500 }],
        dependencies: ['B1', 'B2']
      },
      {
        id: 'B_MID2',
        title: 'El Eco Profundo: Warden',
        subtitle: 'Silencia a la bestia de las ciudades antiguas',
        x: 1.25,
        y: 0.5,
        shape: 'diamond',
        tasks: [{ id: 'task_bm2', type: 'kill', entity: 'minecraft:warden', value: 1 }],
        rewards: [{ id: 'rew_bm2', type: 'xp', xp: 600 }],
        dependencies: ['B2', 'B3']
      },
      // Cúspide: Boss Final
      {
        id: 'B_FINAL',
        title: 'Boss Final: Dragón del Fin',
        subtitle: 'El conquistador de las dimensiones',
        x: 0.0,
        y: -1.2,
        shape: 'octagon',
        tasks: [{ id: 'task_bf', type: 'kill', entity: 'minecraft:ender_dragon', value: 1 }],
        rewards: [{ id: 'rew_bf', type: 'xp', xp: 1500 }],
        dependencies: ['B_MID1', 'B_MID2']
      }
    ]
  },

  // 3. Checklist de Inicio (Cruz en Abanico)
  {
    id: 'starter_cross_checklist',
    title: 'Checklist de Inicio (Cruz en 4 Ramas)',
    description: 'Misión central de bienvenida que desbloquea 4 senderos introductorios (Refugio, Minería, Granja y Magia/Técnica).',
    category: 'starter',
    icon: 'minecraft:compass',
    quests: [
      {
        id: 'S_CENTER',
        title: '¡Bienvenido al Modpack!',
        subtitle: 'Tu aventura comienza aquí',
        x: 0.0,
        y: 0.0,
        shape: 'circle',
        tasks: [{ id: 'task_sc', type: 'checkmark', title: 'Comenzar aventura' }],
        rewards: [{ id: 'rew_sc', type: 'item', item: 'minecraft:cooked_beef', count: 16 }],
        dependencies: []
      },
      {
        id: 'S_NORTH',
        title: 'Refugio y Supervivencia',
        subtitle: 'Asegura tu primera cama y antorchas',
        x: 0.0,
        y: -2.0,
        shape: 'square',
        tasks: [{ id: 'task_sn', type: 'item', item: 'minecraft:white_bed', count: 1 }],
        rewards: [{ id: 'rew_sn', type: 'xp', xp: 50 }],
        dependencies: ['S_CENTER']
      },
      {
        id: 'S_EAST',
        title: 'Minería y Herramientas',
        subtitle: 'Extrae piedra y hierro de las profundidades',
        x: 2.0,
        y: 0.0,
        shape: 'square',
        tasks: [{ id: 'task_se', type: 'item', item: 'minecraft:iron_pickaxe', count: 1 }],
        rewards: [{ id: 'rew_se', type: 'xp', xp: 50 }],
        dependencies: ['S_CENTER']
      },
      {
        id: 'S_SOUTH',
        title: 'Agricultura y Comida',
        subtitle: 'Establece tu primer sembradío sustentable',
        x: 0.0,
        y: 2.0,
        shape: 'square',
        tasks: [{ id: 'task_ss', type: 'item', item: 'minecraft:bread', count: 8 }],
        rewards: [{ id: 'rew_ss', type: 'xp', xp: 50 }],
        dependencies: ['S_CENTER']
      },
      {
        id: 'S_WEST',
        title: 'Magia y Tecnología',
        subtitle: 'Primeros artefactos y componentes',
        x: -2.0,
        y: 0.0,
        shape: 'square',
        tasks: [{ id: 'task_sw', type: 'item', item: 'minecraft:redstone', count: 16 }],
        rewards: [{ id: 'rew_sw', type: 'xp', xp: 50 }],
        dependencies: ['S_CENTER']
      }
    ]
  },

  // 4. Bifurcación Tecnológica / Mágica (Dual Path)
  {
    id: 'dual_path_tech_magic',
    title: 'Bifurcación: Ciencia vs Magia',
    description: 'Árbol que divide en dos caminos paralelos especializados con misiones vinculadas.',
    category: 'technology',
    icon: 'minecraft:enchanting_table',
    quests: [
      {
        id: 'ROOT',
        title: 'El Despertar del Saber',
        subtitle: 'La encrucijada del conocimiento',
        x: 0.0,
        y: -1.8,
        shape: 'hexagon',
        tasks: [{ id: 'task_root', type: 'checkmark', title: 'Elegir senda' }],
        rewards: [{ id: 'rew_root', type: 'xp', xp: 50 }],
        dependencies: []
      },
      // Rama A: Tecnología
      {
        id: 'TECH_1',
        title: 'Mecanismos y Vapor',
        subtitle: 'Engranajes, cinemática y energía',
        x: -1.8,
        y: -0.4,
        shape: 'rsquare',
        tasks: [{ id: 'task_t1_gear', type: 'item', item: 'minecraft:copper_ingot', count: 8 }],
        rewards: [{ id: 'rew_t1_g', type: 'xp', xp: 75 }],
        dependencies: ['ROOT']
      },
      {
        id: 'TECH_2',
        title: 'Fábrica Automatizada',
        subtitle: 'Procesamiento masivo de recursos',
        x: -1.8,
        y: 1.0,
        shape: 'square',
        tasks: [{ id: 'task_t2_mach', type: 'item', item: 'minecraft:dispenser', count: 1 }],
        rewards: [{ id: 'rew_t2_m', type: 'xp', xp: 150 }],
        dependencies: ['TECH_1']
      },
      // Rama B: Magia
      {
        id: 'MAGIC_1',
        title: 'Alquimia y Esencias',
        subtitle: 'Brebajes, cristales y botánica',
        x: 1.8,
        y: -0.4,
        shape: 'rsquare',
        tasks: [{ id: 'task_m1_pot', type: 'item', item: 'minecraft:brewing_stand', count: 1 }],
        rewards: [{ id: 'rew_m1_p', type: 'xp', xp: 75 }],
        dependencies: ['ROOT']
      },
      {
        id: 'MAGIC_2',
        title: 'Encantamientos Arcanos',
        subtitle: 'Poder de los grimorios arcanos',
        x: 1.8,
        y: 1.0,
        shape: 'square',
        tasks: [{ id: 'task_m2_ench', type: 'item', item: 'minecraft:enchanting_table', count: 1 }],
        rewards: [{ id: 'rew_m2_e', type: 'xp', xp: 150 }],
        dependencies: ['MAGIC_1']
      }
    ]
  }
];

/**
 * Instancia un Blueprint en el canvas:
 * 1. Genera nuevos IDs hexadecimales únicos de 16 caracteres para cada misión y tarea.
 * 2. Remapea las dependencias internas para que apunten a los nuevos IDs.
 * 3. Centra las misiones respecto a centerPos (coordenadas del canvas).
 */
export function instantiateBlueprint(
  blueprint: Blueprint,
  centerPos: { x: number; y: number } = { x: 0, y: 0 }
): { newQuests: any[] } {
  const quests = blueprint.quests || [];
  if (quests.length === 0) return { newQuests: [] };

  // 1. Calcular el centro del blueprint original
  let totalX = 0;
  let totalY = 0;
  quests.forEach((q) => {
    totalX += typeof q.x === 'number' ? q.x : (q.x?.value || 0);
    totalY += typeof q.y === 'number' ? q.y : (q.y?.value || 0);
  });
  const avgX = totalX / quests.length;
  const avgY = totalY / quests.length;

  // 2. Crear mapeo de IDs viejos a nuevos
  const idMap = new Map<string, string>();
  quests.forEach((q) => {
    const oldId = String(q.id);
    const newId = generateHexId();
    idMap.set(oldId, newId);
  });

  // 3. Clonar y remapear cada misión
  const newQuests = quests.map((q) => {
    const oldId = String(q.id);
    const newId = idMap.get(oldId) || generateHexId();
    const rawX = typeof q.x === 'number' ? q.x : (q.x?.value || 0);
    const rawY = typeof q.y === 'number' ? q.y : (q.y?.value || 0);

    // Ajustar coordenadas relativas al centro solicitado (redondeado a 0.5 para el grid)
    const relX = rawX - avgX;
    const relY = rawY - avgY;
    const finalX = Math.round((centerPos.x + relX) * 2) / 2;
    const finalY = Math.round((centerPos.y + relY) * 2) / 2;

    // Remapear dependencias internas
    let rawDeps = q.dependencies || [];
    if (!Array.isArray(rawDeps)) {
      rawDeps = [rawDeps];
    }
    const newDeps = rawDeps.map((d: any) => {
      const depStrId = typeof d === 'object' && d !== null ? String(d.id) : String(d);
      return idMap.has(depStrId) ? idMap.get(depStrId)! : depStrId;
    });

    // Clonar tareas y recompensas con nuevos IDs
    const newTasks = Array.isArray(q.tasks) ? q.tasks.map((t: any) => ({
      ...t,
      id: generateHexId()
    })) : [];

    const newRewards = Array.isArray(q.rewards) ? q.rewards.map((r: any) => ({
      ...r,
      id: generateHexId()
    })) : [];

    return {
      ...JSON.parse(JSON.stringify(q)),
      id: newId,
      x: finalX,
      y: finalY,
      dependencies: newDeps,
      tasks: newTasks,
      rewards: newRewards
    };
  });

  return { newQuests };
}

const STORAGE_KEY = 'ftb_custom_blueprints_v1';

/**
 * Obtiene las plantillas personalizadas guardadas por el usuario.
 */
export function getCustomBlueprints(): Blueprint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading custom blueprints:', e);
    return [];
  }
}

/**
 * Guarda una nueva plantilla personalizada en localStorage.
 */
export function saveCustomBlueprint(blueprint: Blueprint): void {
  try {
    const current = getCustomBlueprints();
    const updated = [blueprint, ...current.filter((b) => b.id !== blueprint.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving custom blueprint:', e);
  }
}

/**
 * Elimina una plantilla personalizada de localStorage.
 */
export function deleteCustomBlueprint(id: string): void {
  try {
    const current = getCustomBlueprints();
    const updated = current.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting custom blueprint:', e);
  }
}
