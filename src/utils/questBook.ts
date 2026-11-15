/**
 * Libro de misiones completo (carpeta config/ftbquests/quests):
 *   data.snbt            -> ajustes globales del libro
 *   chapter_groups.snbt  -> grupos de capítulos
 *   chapters/*.snbt      -> capítulos
 *   reward_tables/*.snbt -> tablas de recompensas
 */
import { parseSNBT } from './snbt';
import { snbtToRewardTable } from '../types/rewardTable';
import type { RewardTable } from '../types/rewardTable';
import type { ChapterGroup } from '../types/chapterGroup';

export type QuestFileKind = 'chapter' | 'reward_table' | 'chapter_groups' | 'data';

export interface ClassifiedFile {
  file: File;
  kind: QuestFileKind;
}

/** Ruta del archivo dentro de la carpeta elegida (si el navegador la expone) o su nombre. */
function filePath(file: File): string {
  return ((file as any).webkitRelativePath || file.name).replace(/\\/g, '/');
}

/**
 * Decide qué es cada archivo .snbt por su nombre y carpeta:
 * data.snbt y chapter_groups.snbt en la raíz, reward_tables/ y chapters/.
 * Un .snbt suelto sin carpeta se considera un capítulo.
 */
export function classifyQuestFiles(files: File[]): ClassifiedFile[] {
  const result: ClassifiedFile[] = [];
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.snbt')) continue;
    const parts = filePath(file).split('/');
    const name = parts[parts.length - 1].toLowerCase();
    const dir = parts.length > 1 ? parts[parts.length - 2].toLowerCase() : '';

    let kind: QuestFileKind = 'chapter';
    if (dir === 'reward_tables') kind = 'reward_table';
    else if (dir === 'chapters') kind = 'chapter';
    else if (name === 'data.snbt') kind = 'data';
    else if (name === 'chapter_groups.snbt') kind = 'chapter_groups';
    result.push({ file, kind });
  }
  return result;
}

export interface ImportedQuestExtras {
  data?: any;
  chapterGroups?: ChapterGroup[];
  rewardTables: RewardTable[];
  errors: string[];
}

/** Lee data.snbt, chapter_groups.snbt y las reward tables (los capítulos los gestiona la app). */
export async function readQuestExtras(classified: ClassifiedFile[]): Promise<ImportedQuestExtras> {
  const out: ImportedQuestExtras = { rewardTables: [], errors: [] };

  for (const { file, kind } of classified) {
    if (kind === 'chapter') continue;
    try {
      const text = await file.text();
      if (kind === 'data') {
        out.data = parseSNBT(text);
      } else if (kind === 'chapter_groups') {
        const parsed = parseSNBT(text);
        out.chapterGroups = (Array.isArray(parsed?.chapter_groups) ? parsed.chapter_groups : [])
          .filter((g: any) => g && g.id)
          .map((g: any) => ({ id: String(g.id), title: String(g.title ?? '') }));
      } else if (kind === 'reward_table') {
        out.rewardTables.push(snbtToRewardTable(text, file.name.replace(/\.snbt$/i, '')));
      }
    } catch (err: any) {
      out.errors.push(`${file.name}: ${err?.message || err}`);
    }
  }
  return out;
}

// ----------------------------------------------------------------------------
// data.snbt
// ----------------------------------------------------------------------------

export const QUEST_SHAPES = ['none', 'circle', 'square', 'rsquare', 'diamond', 'pentagon', 'hexagon', 'octagon', 'gear', 'heart'];
export const PROGRESSION_MODES = ['flexible', 'linear'];
export const AUTOCLAIM_MODES = ['disabled', 'enabled', 'no_toast', 'invisible'];

/** Valores por defecto de FTB Quests 2001.x para un libro nuevo. */
export function createDefaultQuestBookData(): any {
  const int = (value: number) => ({ __type: 'number', value, suffix: '' });
  return {
    default_autoclaim_rewards: 'disabled',
    default_consume_items: false,
    default_quest_disable_jei: false,
    default_quest_shape: 'circle',
    default_reward_team: false,
    detection_delay: int(20),
    disable_gui: false,
    drop_book_on_death: false,
    drop_loot_crates: false,
    emergency_items_cooldown: int(300),
    grid_scale: { __type: 'number', value: 0.5, suffix: 'd', raw: '0.5' },
    hide_excluded_quests: false,
    lock_message: '',
    loot_crate_no_drop: { boss: int(0), monster: int(600), passive: int(4000) },
    pause_game: false,
    progression_mode: 'flexible',
    show_lock_icons: true,
    title: '',
    version: int(13),
  };
}

/** Lee un número SNBT (objeto con value) o primitivo. */
export function snbtNumber(v: any, def = 0): number {
  if (v && typeof v === 'object' && typeof v.value === 'number') return v.value;
  return typeof v === 'number' ? v : def;
}

/** Escribe un número conservando el sufijo que ya tenía (ej. 0.5d, 20) o usando uno por defecto. */
export function withNumber(prev: any, value: number, defaultSuffix = ''): any {
  const suffix = prev && typeof prev === 'object' && typeof prev.suffix === 'string' ? prev.suffix : defaultSuffix;
  return { __type: 'number', value, suffix };
}
