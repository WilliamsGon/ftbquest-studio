import { parseSNBT, stringifySNBT } from '../utils/snbt';

export interface RewardTableEntry {
  id?: string;
  type?: 'item' | 'xp' | 'xp_levels' | 'command' | 'random';
  item?: string | { id: string; Count?: number; tag?: any };
  count?: number;
  xp?: number;
  xp_levels?: number;
  command?: string;
  player_command?: boolean;
  weight: number;
  title?: string;
  icon?: string | any;
}

export interface LootCrateConfig {
  string_id: string;
  item_name: string;
  color: number; // Decimal color code (e.g. 16777215 for white, 16755200 for gold)
  glow?: boolean;
  drops?: {
    boss?: number;
    monster?: number;
    passive?: number;
  };
}

export interface RewardTable {
  id: string;
  filename?: string;
  order_index: number;
  title: string;
  icon?: string | any;
  loot_size?: number;
  hide_tooltip?: boolean;
  use_title?: boolean;
  empty_weight?: number;
  rewards: RewardTableEntry[];
  loot_crate?: LootCrateConfig;
}

const getNum = (v: any, def = 0): number => {
  if (v && v.__type === 'number') return v.value;
  if (typeof v === 'number') return v;
  return def;
};

export function rewardTableToSNBT(table: RewardTable): string {
  const snbtObj: any = {
    id: table.id,
    order_index: table.order_index,
    title: table.title,
    icon: table.icon || 'minecraft:chest',
    loot_size: table.loot_size ?? 1,
    rewards: table.rewards.map(r => {
      const entry: any = { ...r };
      if (entry.weight !== undefined) {
        entry.weight = { __type: 'number', value: entry.weight, suffix: 'f' };
      }
      return entry;
    })
  };

  if (table.hide_tooltip) snbtObj.hide_tooltip = true;
  if (table.use_title) snbtObj.use_title = true;
  if (table.empty_weight && table.empty_weight > 0) {
    snbtObj.empty_weight = { __type: 'number', value: table.empty_weight, suffix: 'f' };
  }

  if (table.loot_crate) {
    snbtObj.loot_crate = {
      string_id: table.loot_crate.string_id,
      item_name: table.loot_crate.item_name,
      color: table.loot_crate.color,
      glow: table.loot_crate.glow
        ? { __type: 'number', value: 1, suffix: 'b' }
        : { __type: 'number', value: 0, suffix: 'b' },
      drops: {
        boss: table.loot_crate.drops?.boss ?? 0,
        monster: table.loot_crate.drops?.monster ?? 0,
        passive: table.loot_crate.drops?.passive ?? 0
      }
    };
  }

  return stringifySNBT(snbtObj);
}

export function snbtToRewardTable(snbtString: string, fallbackFilename = 'reward_table'): RewardTable {
  const parsed = parseSNBT(snbtString);

  const rewards = Array.isArray(parsed.rewards) ? parsed.rewards.map((r: any) => ({
    id: r.id,
    type: r.type || 'item',
    item: r.item,
    count: getNum(r.count, 1),
    xp: getNum(r.xp, 0),
    xp_levels: getNum(r.xp_levels, 0),
    command: r.command,
    player_command: r.player_command,
    weight: getNum(r.weight, 1.0),
    title: r.title,
    icon: r.icon
  })) : [];

  let lootCrate: LootCrateConfig | undefined = undefined;
  if (parsed.loot_crate) {
    lootCrate = {
      string_id: String(parsed.loot_crate.string_id || ''),
      item_name: String(parsed.loot_crate.item_name || ''),
      color: getNum(parsed.loot_crate.color, 16777215),
      glow: parsed.loot_crate.glow === true || (parsed.loot_crate.glow && parsed.loot_crate.glow.value === 1),
      drops: {
        boss: getNum(parsed.loot_crate.drops?.boss, 0),
        monster: getNum(parsed.loot_crate.drops?.monster, 0),
        passive: getNum(parsed.loot_crate.drops?.passive, 0)
      }
    };
  }

  return {
    id: parsed.id ? String(parsed.id) : Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
    filename: fallbackFilename,
    order_index: getNum(parsed.order_index, 0),
    title: String(parsed.title || 'Nueva Tabla de Recompensas'),
    icon: parsed.icon,
    loot_size: getNum(parsed.loot_size, 1),
    hide_tooltip: parsed.hide_tooltip === true,
    use_title: parsed.use_title === true,
    empty_weight: getNum(parsed.empty_weight, 0),
    rewards,
    loot_crate: lootCrate
  };
}
