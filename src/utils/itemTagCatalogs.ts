export interface ItemTagItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  example?: string;
}

export const FORGE_TAG_CATEGORIES = [
  'Todos',
  'Lingotes',
  'Materias Primas',
  'Polvos',
  'Gemas',
  'Bloques de Almacenamiento',
  'Menas (Ores)',
  'Componentes (Plates/Gears)',
  'Herramientas y Armas',
  'Armaduras',
  'Cultivos y Alimentos',
  'Madera y Construcción'
] as const;

export type ForgeTagCategory = typeof FORGE_TAG_CATEGORIES[number];

export const FORGE_ITEM_TAGS: ItemTagItem[] = [
  // --- LINGOTES (#forge:ingots/*) ---
  { id: '#forge:ingots/iron', name: 'Lingote de Hierro', category: 'Lingotes', description: 'Acepta lingotes de hierro vanilla y de cualquier mod tecnológico.' },
  { id: '#forge:ingots/gold', name: 'Lingote de Oro', category: 'Lingotes', description: 'Lingotes de oro de cualquier mod.' },
  { id: '#forge:ingots/copper', name: 'Lingote de Cobre', category: 'Lingotes', description: 'Lingotes de cobre de cualquier mod.' },
  { id: '#forge:ingots/netherite', name: 'Lingote de Netherita', category: 'Lingotes', description: 'Lingote de netherita.' },
  { id: '#forge:ingots/steel', name: 'Lingote de Acero', category: 'Lingotes', description: 'Acero de Create, Immersive Engineering, Mekanism, etc.' },
  { id: '#forge:ingots/bronze', name: 'Lingote de Bronce', category: 'Lingotes', description: 'Aleación de bronce de mods técnicos.' },
  { id: '#forge:ingots/tin', name: 'Lingote de Estaño (Tin)', category: 'Lingotes', description: 'Estaño de mods técnicos y de generación.' },
  { id: '#forge:ingots/zinc', name: 'Lingote de Cinc (Zinc)', category: 'Lingotes', description: 'Cinc de Create o mods de metales.' },
  { id: '#forge:ingots/brass', name: 'Lingote de Latón (Brass)', category: 'Lingotes', description: 'Latón de Create o aleaciones.' },
  { id: '#forge:ingots/lead', name: 'Lingote de Plomo (Lead)', category: 'Lingotes', description: 'Plomo de Thermal, IE, Mekanism, etc.' },
  { id: '#forge:ingots/silver', name: 'Lingote de Plata (Silver)', category: 'Lingotes', description: 'Plata común de modpacks.' },
  { id: '#forge:ingots/nickel', name: 'Lingote de Níquel (Nickel)', category: 'Lingotes', description: 'Níquel de Thermal o Immersive.' },
  { id: '#forge:ingots/electrum', name: 'Lingote de Electrum', category: 'Lingotes', description: 'Aleación de oro y plata.' },
  { id: '#forge:ingots/invar', name: 'Lingote de Invar', category: 'Lingotes', description: 'Aleación de hierro y níquel.' },
  { id: '#forge:ingots/constantan', name: 'Lingote de Constantano', category: 'Lingotes', description: 'Aleación de cobre y níquel.' },
  { id: '#forge:ingots/osmium', name: 'Lingote de Osmio (Osmium)', category: 'Lingotes', description: 'Metal base de Mekanism.' },
  { id: '#forge:ingots/uranium', name: 'Lingote de Uranio', category: 'Lingotes', description: 'Metal radiactivo de IE o Mekanism.' },
  { id: '#forge:ingots/aluminum', name: 'Lingote de Aluminio (Bauxita)', category: 'Lingotes', description: 'Aluminio de Immersive o mods técnicos.' },

  // --- MATERIAS PRIMAS (#forge:raw_materials/*) ---
  { id: '#forge:raw_materials/iron', name: 'Hierro en Bruto (Raw Iron)', category: 'Materias Primas', description: 'Materia prima de hierro extraída de menas.' },
  { id: '#forge:raw_materials/copper', name: 'Cobre en Bruto (Raw Copper)', category: 'Materias Primas', description: 'Materia prima de cobre.' },
  { id: '#forge:raw_materials/gold', name: 'Oro en Bruto (Raw Gold)', category: 'Materias Primas', description: 'Materia prima de oro.' },
  { id: '#forge:raw_materials/zinc', name: 'Cinc en Bruto (Raw Zinc)', category: 'Materias Primas', description: 'Materia prima de cinc (Create).' },
  { id: '#forge:raw_materials/tin', name: 'Estaño en Bruto (Raw Tin)', category: 'Materias Primas', description: 'Materia prima de estaño.' },
  { id: '#forge:raw_materials/lead', name: 'Plomo en Bruto (Raw Lead)', category: 'Materias Primas', description: 'Materia prima de plomo.' },
  { id: '#forge:raw_materials/silver', name: 'Plata en Bruto (Raw Silver)', category: 'Materias Primas', description: 'Materia prima de plata.' },
  { id: '#forge:raw_materials/nickel', name: 'Níquel en Bruto (Raw Nickel)', category: 'Materias Primas', description: 'Materia prima de níquel.' },
  { id: '#forge:raw_materials/osmium', name: 'Osmio en Bruto (Raw Osmium)', category: 'Materias Primas', description: 'Materia prima de osmio (Mekanism).' },
  { id: '#forge:raw_materials/uranium', name: 'Uranio en Bruto (Raw Uranium)', category: 'Materias Primas', description: 'Materia prima de uranio.' },

  // --- POLVOS (#forge:dusts/*) ---
  { id: '#forge:dusts/iron', name: 'Polvo de Hierro', category: 'Polvos', description: 'Hierro pulverizado para metalurgia.' },
  { id: '#forge:dusts/gold', name: 'Polvo de Oro', category: 'Polvos', description: 'Oro pulverizado.' },
  { id: '#forge:dusts/copper', name: 'Polvo de Cobre', category: 'Polvos', description: 'Cobre pulverizado.' },
  { id: '#forge:dusts/redstone', name: 'Polvo de Redstone', category: 'Polvos', description: 'Redstone pulverizado estándar.' },
  { id: '#forge:dusts/glowstone', name: 'Polvo de Piedra Luminosa', category: 'Polvos', description: 'Polvo de glowstone.' },
  { id: '#forge:dusts/diamond', name: 'Polvo de Diamante', category: 'Polvos', description: 'Diamante molido.' },
  { id: '#forge:dusts/emerald', name: 'Polvo de Esmeralda', category: 'Polvos', description: 'Esmeralda molida.' },
  { id: '#forge:dusts/lapis', name: 'Polvo de Lapislázuli', category: 'Polvos', description: 'Lapislázuli molido.' },
  { id: '#forge:dusts/coal', name: 'Polvo de Carbón', category: 'Polvos', description: 'Carbón vegetal o mineral molido.' },
  { id: '#forge:dusts/sulfur', name: 'Polvo de Azufre (Sulfur)', category: 'Polvos', description: 'Azufre común en recetas químicas y pólvora.' },
  { id: '#forge:dusts/obsidian', name: 'Polvo de Obsidiana', category: 'Polvos', description: 'Obsidiana triturada.' },
  { id: '#forge:dusts/wood', name: 'Serrín / Polvo de Madera', category: 'Polvos', description: 'Subproducto de corte y molienda de madera.' },

  // --- GEMAS (#forge:gems/*) ---
  { id: '#forge:gems/diamond', name: 'Diamante (Gema)', category: 'Gemas', description: 'Diamante vanilla o gemológico de mods.' },
  { id: '#forge:gems/emerald', name: 'Esmeralda (Gema)', category: 'Gemas', description: 'Esmeralda de comercio y minería.' },
  { id: '#forge:gems/lapis', name: 'Lapislázuli (Gema)', category: 'Gemas', description: 'Lapislázuli.' },
  { id: '#forge:gems/amethyst', name: 'Fragmento de Amatista', category: 'Gemas', description: 'Amatista.' },
  { id: '#forge:gems/quartz', name: 'Cuarzo del Nether', category: 'Gemas', description: 'Cuarzo vanilla.' },
  { id: '#forge:gems/ruby', name: 'Rubí', category: 'Gemas', description: 'Rubí de mods de biomas y minerales.' },
  { id: '#forge:gems/sapphire', name: 'Zafiro', category: 'Gemas', description: 'Zafiro de mods de biomas y minerales.' },
  { id: '#forge:gems/certus_quartz', name: 'Cuarzo Certus', category: 'Gemas', description: 'Cuarzo Certus de Applied Energistics 2.' },

  // --- BLOQUES DE ALMACENAMIENTO (#forge:storage_blocks/*) ---
  { id: '#forge:storage_blocks/iron', name: 'Bloque de Hierro', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de 9 lingotes de hierro.' },
  { id: '#forge:storage_blocks/gold', name: 'Bloque de Oro', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de 9 lingotes de oro.' },
  { id: '#forge:storage_blocks/copper', name: 'Bloque de Cobre', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de cobre.' },
  { id: '#forge:storage_blocks/diamond', name: 'Bloque de Diamante', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de diamantes.' },
  { id: '#forge:storage_blocks/emerald', name: 'Bloque de Esmeralda', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de esmeraldas.' },
  { id: '#forge:storage_blocks/raw_iron', name: 'Bloque de Hierro en Bruto', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de raw iron.' },
  { id: '#forge:storage_blocks/raw_gold', name: 'Bloque de Oro en Bruto', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de raw gold.' },
  { id: '#forge:storage_blocks/raw_copper', name: 'Bloque de Cobre en Bruto', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de raw copper.' },
  { id: '#forge:storage_blocks/steel', name: 'Bloque de Acero', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de acero.' },
  { id: '#forge:storage_blocks/bronze', name: 'Bloque de Bronce', category: 'Bloques de Almacenamiento', description: 'Bloque compacto de bronce.' },

  // --- MENAS / ORES (#forge:ores/*) ---
  { id: '#forge:ores/coal', name: 'Mena de Carbón', category: 'Menas (Ores)', description: 'Cualquier variante de mena de carbón (normal y deepslate).' },
  { id: '#forge:ores/iron', name: 'Mena de Hierro', category: 'Menas (Ores)', description: 'Cualquier variante de mena de hierro.' },
  { id: '#forge:ores/copper', name: 'Mena de Cobre', category: 'Menas (Ores)', description: 'Cualquier variante de mena de cobre.' },
  { id: '#forge:ores/gold', name: 'Mena de Oro', category: 'Menas (Ores)', description: 'Cualquier variante de mena de oro.' },
  { id: '#forge:ores/redstone', name: 'Mena de Redstone', category: 'Menas (Ores)', description: 'Cualquier variante de mena de redstone.' },
  { id: '#forge:ores/diamond', name: 'Mena de Diamante', category: 'Menas (Ores)', description: 'Cualquier variante de mena de diamante.' },
  { id: '#forge:ores/emerald', name: 'Mena de Esmeralda', category: 'Menas (Ores)', description: 'Cualquier variante de mena de esmeralda.' },
  { id: '#forge:ores/lapis', name: 'Mena de Lapislázuli', category: 'Menas (Ores)', description: 'Cualquier variante de mena de lapislázuli.' },
  { id: '#forge:ores/quartz', name: 'Mena de Cuarzo del Nether', category: 'Menas (Ores)', description: 'Mena de cuarzo del nether.' },
  { id: '#forge:ores/zinc', name: 'Mena de Cinc (Zinc Ore)', category: 'Menas (Ores)', description: 'Menas de cinc añadidas por Create.' },

  // --- COMPONENTES (#forge:plates/*, #forge:gears/*, #forge:rods/*) ---
  { id: '#forge:plates/iron', name: 'Placa de Hierro (Iron Sheet)', category: 'Componentes (Plates/Gears)', description: 'Láminas/chapas de hierro de Create o Thermal.' },
  { id: '#forge:plates/copper', name: 'Placa de Cobre', category: 'Componentes (Plates/Gears)', description: 'Láminas de cobre.' },
  { id: '#forge:plates/gold', name: 'Placa de Oro', category: 'Componentes (Plates/Gears)', description: 'Láminas de oro.' },
  { id: '#forge:plates/brass', name: 'Placa de Latón (Brass Sheet)', category: 'Componentes (Plates/Gears)', description: 'Lámina de latón para filtros y precisión en Create.' },
  { id: '#forge:plates/steel', name: 'Placa de Acero', category: 'Componentes (Plates/Gears)', description: 'Lámina de acero de mods industriales.' },
  { id: '#forge:gears/iron', name: 'Engranaje de Hierro', category: 'Componentes (Plates/Gears)', description: 'Engranaje de hierro común en recetas técnicas.' },
  { id: '#forge:gears/gold', name: 'Engranaje de Oro', category: 'Componentes (Plates/Gears)', description: 'Engranaje de oro.' },
  { id: '#forge:gears/copper', name: 'Engranaje de Cobre', category: 'Componentes (Plates/Gears)', description: 'Engranaje de cobre.' },
  { id: '#forge:rods/wooden', name: 'Palos de Madera (Rods)', category: 'Componentes (Plates/Gears)', description: 'Palos y varillas de madera.' },
  { id: '#forge:rods/blaze', name: 'Varas de Blaze', category: 'Componentes (Plates/Gears)', description: 'Varas de fuego.' },

  // --- HERRAMIENTAS Y ARMAS (#forge:tools/*) ---
  { id: '#forge:tools/pickaxes', name: 'Cualquier Pico (Pickaxes)', category: 'Herramientas y Armas', description: 'Acepta picos de madera, piedra, hierro, diamante o mods.' },
  { id: '#forge:tools/axes', name: 'Cualquier Hacha (Axes)', category: 'Herramientas y Armas', description: 'Acepta hachas de cualquier material o mod.' },
  { id: '#forge:tools/shovels', name: 'Cualquier Pala (Shovels)', category: 'Herramientas y Armas', description: 'Acepta palas de cualquier tipo.' },
  { id: '#forge:tools/swords', name: 'Cualquier Espada (Swords)', category: 'Herramientas y Armas', description: 'Acepta espadas de cualquier material.' },
  { id: '#forge:tools/hoes', name: 'Cualquier Azada (Hoes)', category: 'Herramientas y Armas', description: 'Acepta azadas de agricultura.' },
  { id: '#forge:tools/bows', name: 'Cualquier Arco (Bows)', category: 'Herramientas y Armas', description: 'Arcos vanilla o de mods.' },
  { id: '#forge:tools/shields', name: 'Cualquier Escudo (Shields)', category: 'Herramientas y Armas', description: 'Escudos protectores.' },
  { id: '#forge:tools/wrenches', name: 'Llaves Inglesas (Wrenches)', category: 'Herramientas y Armas', description: 'Llaves de configuración de máquinas (Create Wrench, etc.).' },

  // --- ARMADURAS (#forge:armors/*) ---
  { id: '#forge:armors/helmets', name: 'Cualquier Casco (Helmets)', category: 'Armaduras', description: 'Cascos de protección.' },
  { id: '#forge:armors/chestplates', name: 'Cualquier Peto (Chestplates)', category: 'Armaduras', description: 'Pechos/corazas.' },
  { id: '#forge:armors/leggings', name: 'Cualquier Greba (Leggings)', category: 'Armaduras', description: 'Pantalones de armadura.' },
  { id: '#forge:armors/boots', name: 'Cualquier Bota (Boots)', category: 'Armaduras', description: 'Botas de armadura.' },

  // --- CULTIVOS Y ALIMENTOS (#forge:crops/*, #forge:eggs, etc.) ---
  { id: '#forge:crops/wheat', name: 'Trigo (Wheat)', category: 'Cultivos y Alimentos', description: 'Trigo para panadería y crianza.' },
  { id: '#forge:crops/potato', name: 'Patatas (Potatoes)', category: 'Cultivos y Alimentos', description: 'Patatas vanilla o de mods agrícolas.' },
  { id: '#forge:crops/carrot', name: 'Zanahorias (Carrots)', category: 'Cultivos y Alimentos', description: 'Zanahorias.' },
  { id: '#forge:crops/beetroot', name: 'Remolachas (Beetroots)', category: 'Cultivos y Alimentos', description: 'Remolachas.' },
  { id: '#forge:vegetables', name: 'Cualquier Verdura', category: 'Cultivos y Alimentos', description: 'Tag amplio de vegetales (Farmer\'s Delight, Pam\'s HarvestCraft).' },
  { id: '#forge:fruits', name: 'Cualquier Fruta', category: 'Cultivos y Alimentos', description: 'Tag de frutas comunes.' },
  { id: '#forge:eggs', name: 'Huevos', category: 'Cultivos y Alimentos', description: 'Huevos de aves.' },

  // --- MADERA Y CONSTRUCCIÓN ---
  { id: '#minecraft:logs', name: 'Cualquier Tronco de Madera', category: 'Madera y Construcción', description: 'Troncos de roble, abedul, abeto o maderas añadidas por mods.' },
  { id: '#minecraft:planks', name: 'Cualquier Tablón de Madera', category: 'Madera y Construcción', description: 'Tablones de cualquier tipo de árbol.' },
  { id: '#minecraft:wooden_slabs', name: 'Losas de Madera', category: 'Madera y Construcción', description: 'Losas de madera de cualquier árbol.' },
  { id: '#minecraft:wooden_stairs', name: 'Escaleras de Madera', category: 'Madera y Construcción', description: 'Escaleras de madera.' }
];

/**
 * Determina si el identificador corresponde a un Item Tag (#tag).
 */
export function isItemTag(itemId: any): boolean {
  if (!itemId) return false;
  if (typeof itemId === 'string') {
    return itemId.trim().startsWith('#');
  }
  if (typeof itemId === 'object' && itemId !== null && itemId.id) {
    return String(itemId.id).trim().startsWith('#');
  }
  return false;
}

/**
 * Normaliza un tag asegurando que comience con '#' y sin espacios.
 */
export function normalizeItemTag(tag: string): string {
  const clean = tag.trim();
  if (!clean) return '#forge:ingots/iron';
  return clean.startsWith('#') ? clean : `#${clean}`;
}

/**
 * Realiza búsqueda y filtrado en el catálogo curado de Forge/Common tags.
 */
export function searchItemTags(query: string, category?: string): ItemTagItem[] {
  const q = query.trim().toLowerCase();
  return FORGE_ITEM_TAGS.filter((tag) => {
    const matchesCategory = !category || category === 'Todos' || tag.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      tag.id.toLowerCase().includes(q) ||
      tag.name.toLowerCase().includes(q) ||
      (tag.description && tag.description.toLowerCase().includes(q))
    );
  });
}
