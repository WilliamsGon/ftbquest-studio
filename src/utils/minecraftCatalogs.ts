export interface CatalogItem {
  id: string;
  name: string;
  category?: string;
}

/**
 * Catálogo curado de entidades y mobs comunes (Vanilla + Mods populares en 1.20.1)
 */
export const MINECRAFT_ENTITIES: CatalogItem[] = [
  // Vanilla Hostiles Comunes
  { id: 'minecraft:zombie', name: 'Zombi', category: 'Vanilla Hostil' },
  { id: 'minecraft:skeleton', name: 'Esqueleto', category: 'Vanilla Hostil' },
  { id: 'minecraft:creeper', name: 'Creeper', category: 'Vanilla Hostil' },
  { id: 'minecraft:spider', name: 'Araña', category: 'Vanilla Hostil' },
  { id: 'minecraft:cave_spider', name: 'Araña de cueva', category: 'Vanilla Hostil' },
  { id: 'minecraft:enderman', name: 'Enderman', category: 'Vanilla Hostil' },
  { id: 'minecraft:witch', name: 'Bruja', category: 'Vanilla Hostil' },
  { id: 'minecraft:slime', name: 'Slime', category: 'Vanilla Hostil' },
  { id: 'minecraft:drowned', name: 'Ahogado', category: 'Vanilla Hostil' },
  { id: 'minecraft:husk', name: 'Zombi momificado (Husk)', category: 'Vanilla Hostil' },
  { id: 'minecraft:stray', name: 'Esqueleto glacial (Stray)', category: 'Vanilla Hostil' },
  { id: 'minecraft:phantom', name: 'Fantasma (Phantom)', category: 'Vanilla Hostil' },
  { id: 'minecraft:silverfish', name: 'Lepisma', category: 'Vanilla Hostil' },

  // Vanilla Nether
  { id: 'minecraft:blaze', name: 'Blaze', category: 'Nether' },
  { id: 'minecraft:ghast', name: 'Ghast', category: 'Nether' },
  { id: 'minecraft:wither_skeleton', name: 'Esqueleto del Wither', category: 'Nether' },
  { id: 'minecraft:magma_cube', name: 'Cubo de magma', category: 'Nether' },
  { id: 'minecraft:piglin', name: 'Piglin', category: 'Nether' },
  { id: 'minecraft:piglin_brute', name: 'Piglin bruto', category: 'Nether' },
  { id: 'minecraft:zombified_piglin', name: 'Piglin zombificado', category: 'Nether' },
  { id: 'minecraft:hoglin', name: 'Hoglin', category: 'Nether' },
  { id: 'minecraft:zoglin', name: 'Zoglin', category: 'Nether' },

  // Vanilla End
  { id: 'minecraft:shulker', name: 'Shulker', category: 'End' },
  { id: 'minecraft:endermite', name: 'Endermite', category: 'End' },

  // Vanilla Illeagers & Raids
  { id: 'minecraft:pillager', name: 'Saqueador (Pillager)', category: 'Incursión' },
  { id: 'minecraft:vindicator', name: 'Vindicador', category: 'Incursión' },
  { id: 'minecraft:evoker', name: 'Invocador (Evoker)', category: 'Incursión' },
  { id: 'minecraft:ravager', name: 'Devastador (Ravager)', category: 'Incursión' },
  { id: 'minecraft:vex', name: 'Ánima (Vex)', category: 'Incursión' },

  // Vanilla Bosses & Grandes Enemigos
  { id: 'minecraft:wither', name: 'Wither', category: 'Jefes (Bosses)' },
  { id: 'minecraft:ender_dragon', name: 'Dragón del Fin', category: 'Jefes (Bosses)' },
  { id: 'minecraft:warden', name: 'Warden (Guardián)', category: 'Jefes (Bosses)' },
  { id: 'minecraft:elder_guardian', name: 'Guardián anciano', category: 'Jefes (Bosses)' },
  { id: 'minecraft:guardian', name: 'Guardián', category: 'Jefes (Bosses)' },
  { id: 'minecraft:iron_golem', name: 'Gólem de hierro', category: 'Neutral/Útil' },

  // Mods Populares (Twilight Forest)
  { id: 'twilightforest:naga', name: 'Naga (Twilight Forest)', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:lich', name: 'Twilight Lich', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:minoshroom', name: 'Minoshroom', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:hydra', name: 'Hidra (Hydra)', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:knight_phantom', name: 'Knight Phantom', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:ur_ghast', name: 'Ur-Ghast', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:alpha_yeti', name: 'Alpha Yeti', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:snow_queen', name: 'Snow Queen', category: 'Mod: Twilight Forest' },

  // Mods Populares (L_Ender's Cataclysm)
  { id: 'cataclysm:netherite_monstrosity', name: 'Netherite Monstrosity', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:ender_guardian', name: 'Ender Guardian', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:ignis', name: 'Ignis', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:the_harbinger', name: 'The Harbinger', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:the_leviathan', name: 'The Leviathan', category: 'Mod: Cataclysm' },

  // Mods Populares (Alex's Mobs & Mowzie's)
  { id: 'alexsmobs:crimson_mosquito', name: 'Crimson Mosquito', category: 'Mod: Alex\'s Mobs' },
  { id: 'alexsmobs:warped_mosco', name: 'Warped Mosco', category: 'Mod: Alex\'s Mobs' },
  { id: 'alexsmobs:void_worm', name: 'Void Worm', category: 'Mod: Alex\'s Mobs' },
  { id: 'mowziesmobs:ferrous_wroughtnaut', name: 'Ferrous Wroughtnaut', category: 'Mod: Mowzie\'s Mobs' },
  { id: 'mowziesmobs:frostmaw', name: 'Frostmaw', category: 'Mod: Mowzie\'s Mobs' },
];

/**
 * Catálogo curado de Biomas
 */
export const MINECRAFT_BIOMES: CatalogItem[] = [
  // Overworld Templados y Bosques
  { id: 'minecraft:plains', name: 'Llanuras (Plains)', category: 'Overworld' },
  { id: 'minecraft:sunflower_plains', name: 'Llanuras de girasoles', category: 'Overworld' },
  { id: 'minecraft:forest', name: 'Bosque (Forest)', category: 'Overworld' },
  { id: 'minecraft:flower_forest', name: 'Bosque florido', category: 'Overworld' },
  { id: 'minecraft:birch_forest', name: 'Bosque de abedules', category: 'Overworld' },
  { id: 'minecraft:dark_forest', name: 'Bosque oscuro', category: 'Overworld' },
  { id: 'minecraft:cherry_grove', name: 'Arboleda de cerezos (Cherry Grove)', category: 'Overworld' },
  { id: 'minecraft:meadow', name: 'Prado (Meadow)', category: 'Overworld' },
  
  // Overworld Fríos y Montañas
  { id: 'minecraft:taiga', name: 'Taiga', category: 'Overworld Frío' },
  { id: 'minecraft:snowy_taiga', name: 'Taiga nevada', category: 'Overworld Frío' },
  { id: 'minecraft:snowy_plains', name: 'Llanuras nevadas', category: 'Overworld Frío' },
  { id: 'minecraft:ice_spikes', name: 'Picos de hielo', category: 'Overworld Frío' },
  { id: 'minecraft:jagged_peaks', name: 'Picos escarpados', category: 'Overworld Frío' },
  { id: 'minecraft:frozen_peaks', name: 'Picos congelados', category: 'Overworld Frío' },

  // Overworld Cálidos y Húmedos
  { id: 'minecraft:desert', name: 'Desierto', category: 'Overworld Cálido' },
  { id: 'minecraft:savanna', name: 'Sabana', category: 'Overworld Cálido' },
  { id: 'minecraft:badlands', name: 'Tierras baldías (Badlands)', category: 'Overworld Cálido' },
  { id: 'minecraft:jungle', name: 'Jungla', category: 'Overworld Cálido' },
  { id: 'minecraft:bamboo_jungle', name: 'Jungla de bambú', category: 'Overworld Cálido' },
  { id: 'minecraft:swamp', name: 'Pantano', category: 'Overworld Acuático' },
  { id: 'minecraft:mangrove_swamp', name: 'Manglar', category: 'Overworld Acuático' },

  // Cuevas Subterráneas
  { id: 'minecraft:lush_caves', name: 'Cuevas frondosas (Lush Caves)', category: 'Subterráneo' },
  { id: 'minecraft:dripstone_caves', name: 'Cuevas de espeleotemas (Dripstone)', category: 'Subterráneo' },
  { id: 'minecraft:deep_dark', name: 'Oscuridad profunda (Deep Dark)', category: 'Subterráneo' },

  // Océanos
  { id: 'minecraft:ocean', name: 'Océano', category: 'Océanos' },
  { id: 'minecraft:warm_ocean', name: 'Océano cálido (Arrecife)', category: 'Océanos' },
  { id: 'minecraft:deep_ocean', name: 'Océano profundo', category: 'Océanos' },

  // Nether
  { id: 'minecraft:nether_wastes', name: 'Yermos del Nether', category: 'Nether' },
  { id: 'minecraft:crimson_forest', name: 'Bosque carmesí', category: 'Nether' },
  { id: 'minecraft:warped_forest', name: 'Bosque distorsionado', category: 'Nether' },
  { id: 'minecraft:soul_sand_valley', name: 'Valle de arena de almas', category: 'Nether' },
  { id: 'minecraft:basalt_deltas', name: 'Deltas de basalto', category: 'Nether' },

  // End
  { id: 'minecraft:the_end', name: 'El Fin (The End)', category: 'End' },
  { id: 'minecraft:end_highlands', name: 'Tierras altas del End', category: 'End' },
  { id: 'minecraft:end_midlands', name: 'Tierras medias del End', category: 'End' },
  { id: 'minecraft:small_end_islands', name: 'Islas pequeñas del End', category: 'End' },

  // Mods
  { id: 'twilightforest:twilight_forest', name: 'Bosque del Ocaso', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:dense_forest', name: 'Bosque denso', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:fire_swamp', name: 'Pantano de fuego', category: 'Mod: Twilight Forest' },
  { id: 'biomesoplenty:origin_valley', name: 'Origin Valley', category: 'Mod: Biomes O\' Plenty' },
  { id: 'biomesoplenty:bayou', name: 'Bayou', category: 'Mod: Biomes O\' Plenty' },
];

/**
 * Catálogo curado de Estructuras
 */
export const MINECRAFT_STRUCTURES: CatalogItem[] = [
  // Vanilla Overworld
  { id: 'minecraft:village_plains', name: 'Aldea de las llanuras', category: 'Aldeas' },
  { id: 'minecraft:village_desert', name: 'Aldea del desierto', category: 'Aldeas' },
  { id: 'minecraft:village_savanna', name: 'Aldea de la sabana', category: 'Aldeas' },
  { id: 'minecraft:village_snowy', name: 'Aldea nevada', category: 'Aldeas' },
  { id: 'minecraft:village_taiga', name: 'Aldea de la taiga', category: 'Aldeas' },
  { id: 'minecraft:pillager_outpost', name: 'Puesto de saqueadores', category: 'Exploración' },
  { id: 'minecraft:mineshaft', name: 'Mina abandonada', category: 'Exploración' },
  { id: 'minecraft:mansion', name: 'Mansión del bosque', category: 'Mazmorras' },
  { id: 'minecraft:monument', name: 'Monumento oceánico', category: 'Mazmorras' },
  { id: 'minecraft:stronghold', name: 'Fortaleza subterránea (Stronghold)', category: 'Mazmorras' },
  { id: 'minecraft:ancient_city', name: 'Ciudad Antigua (Ancient City)', category: 'Mazmorras' },
  { id: 'minecraft:trial_chambers', name: 'Cámaras de desafío (Trial Chambers)', category: 'Mazmorras' },
  { id: 'minecraft:desert_pyramid', name: 'Pirámide del desierto', category: 'Templos' },
  { id: 'minecraft:jungle_pyramid', name: 'Templo de la jungla', category: 'Templos' },
  { id: 'minecraft:swamp_hut', name: 'Choza de bruja', category: 'Exploración' },
  { id: 'minecraft:shipwreck', name: 'Barco naufragado', category: 'Acuático' },
  { id: 'minecraft:ocean_ruin_cold', name: 'Ruinas oceánicas frías', category: 'Acuático' },
  { id: 'minecraft:trail_ruins', name: 'Ruinas del sendero', category: 'Arqueología' },

  // Nether
  { id: 'minecraft:fortress', name: 'Fortaleza del Nether', category: 'Nether' },
  { id: 'minecraft:bastion_remnant', name: 'Restos de bastión', category: 'Nether' },
  { id: 'minecraft:nether_fossil', name: 'Fósil del Nether', category: 'Nether' },

  // End
  { id: 'minecraft:end_city', name: 'Ciudad del Fin (End City)', category: 'End' },

  // Mods
  { id: 'twilightforest:naga_courtyard', name: 'Patio de la Naga', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:lich_tower', name: 'Torre del Lich', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:labyrinth', name: 'Laberinto del Minoshroom', category: 'Mod: Twilight Forest' },
  { id: 'twilightforest:hydra_lair', name: 'Guarida de la Hidra', category: 'Mod: Twilight Forest' },
  { id: 'cataclysm:burning_arena', name: 'Burning Arena (Ignis)', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:soul_black_smith', name: 'Soul Black Smith', category: 'Mod: Cataclysm' },
  { id: 'cataclysm:ancient_factory', name: 'Ancient Factory (Harbinger)', category: 'Mod: Cataclysm' },
];

/**
 * Catálogo curado de Dimensiones
 */
export const MINECRAFT_DIMENSIONS: CatalogItem[] = [
  { id: 'minecraft:overworld', name: 'Overworld', category: 'Vanilla' },
  { id: 'minecraft:the_nether', name: 'The Nether', category: 'Vanilla' },
  { id: 'minecraft:the_end', name: 'The End', category: 'Vanilla' },

  // Mods Populares
  { id: 'twilightforest:twilight_forest', name: 'The Twilight Forest', category: 'Mod' },
  { id: 'blue_skies:everbright', name: 'Everbright', category: 'Mod: Blue Skies' },
  { id: 'blue_skies:everdawn', name: 'Everdawn', category: 'Mod: Blue Skies' },
  { id: 'the_bumblezone:the_bumblezone', name: 'The Bumblezone', category: 'Mod' },
  { id: 'deeperdarker:otherside', name: 'The Otherside', category: 'Mod: Deeper and Darker' },
  { id: 'undergarden:undergarden', name: 'The Undergarden', category: 'Mod' },
  { id: 'aether:the_aether', name: 'The Aether', category: 'Mod' },
  { id: 'ad_astra:earth_orbit', name: 'Órbita Terrestre', category: 'Mod: Ad Astra' },
  { id: 'ad_astra:moon', name: 'La Luna', category: 'Mod: Ad Astra' },
  { id: 'ad_astra:mars', name: 'Marte', category: 'Mod: Ad Astra' },
  { id: 'ad_astra:venus', name: 'Venus', category: 'Mod: Ad Astra' },
  { id: 'ad_astra:mercury', name: 'Mercurio', category: 'Mod: Ad Astra' },
  { id: 'ad_astra:glacio', name: 'Glacio', category: 'Mod: Ad Astra' },
];

/**
 * Presets comunes de GameStages (GameStages / KubeJS)
 */
export const GAMESTAGE_PRESETS: CatalogItem[] = [
  { id: 'stage_one', name: 'Etapa Uno (stage_one)', category: 'Básica' },
  { id: 'stage_two', name: 'Etapa Dos (stage_two)', category: 'Básica' },
  { id: 'stage_three', name: 'Etapa Tres (stage_three)', category: 'Básica' },
  { id: 'nether_unlocked', name: 'Acceso al Nether desbloqueado', category: 'Progresión' },
  { id: 'end_unlocked', name: 'Acceso al End desbloqueado', category: 'Progresión' },
  { id: 'magic_tier_1', name: 'Magia Nivel 1', category: 'Magia' },
  { id: 'magic_tier_2', name: 'Magia Nivel 2', category: 'Magia' },
  { id: 'tech_tier_1', name: 'Tecnología Nivel 1 (Vapor)', category: 'Tecnología' },
  { id: 'tech_tier_2', name: 'Tecnología Nivel 2 (Electricidad)', category: 'Tecnología' },
  { id: 'tech_tier_3', name: 'Tecnología Nivel 3 (Automatización)', category: 'Tecnología' },
  { id: 'master_crafter', name: 'Maestro Crafteador', category: 'Desafíos' },
];
