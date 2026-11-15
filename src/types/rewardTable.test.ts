import { describe, expect, it } from 'vitest';
import { parseSNBT } from '../utils/snbt';
import { rewardTableToSNBT, snbtToRewardTable } from './rewardTable';

// Formato real de FTB Quests: las entradas de ítem no llevan `type`
const SAMPLE = `{
	id: "0C83C7A93ED80A36"
	loot_size: 1
	order_index: 33
	rewards: [
		{ count: 4, item: "naturesaura:gold_fiber", random_bonus: 4, weight: 2.0f }
		{ item: "naturesaura:ancient_sapling", weight: 0.75f }
		{ item: "mekanism:pellet_polonium" }
		{
			item: {
				Count: 1
				id: "naturesaura:aura_bottle"
				tag: {
					stored_type: "naturesaura:nether"
				}
			}
			random_bonus: 1
		}
		{
			type: "xp_levels"
			xp_levels: 50
		}
	]
	title: "&dEpic Reward"
	use_title: true
}`;

describe('reward tables', () => {
  it('lee random_bonus, cantidades, pesos y entradas que no son ítems', () => {
    const table = snbtToRewardTable(SAMPLE, 'epic');
    expect(table.id).toBe('0C83C7A93ED80A36');
    expect(table.title).toBe('&dEpic Reward');
    expect(table.use_title).toBe(true);
    expect(table.rewards).toHaveLength(5);
    expect(table.rewards[0]).toMatchObject({ item: 'naturesaura:gold_fiber', count: 4, random_bonus: 4, weight: 2 });
    expect(table.rewards[2].weight).toBe(1);
    expect(table.rewards[3].random_bonus).toBe(1);
    expect(table.rewards[4]).toMatchObject({ type: 'xp_levels', xp_levels: 50 });
  });

  it('las entradas de ítem se guardan sin type, sin campos vacíos y sin id interno', () => {
    const table = snbtToRewardTable(SAMPLE);
    table.rewards[0].id = 'ID-INTERNO-DEL-EDITOR';
    const out = rewardTableToSNBT(table);
    const parsed = parseSNBT(out);
    const first = parsed.rewards[0];

    expect(first.type).toBeUndefined();
    expect(first.id).toBeUndefined();
    expect(first.xp).toBeUndefined();
    expect(first.xp_levels).toBeUndefined();
    expect(first.command).toBeUndefined();
    expect(first.item).toBe('naturesaura:gold_fiber');
    expect(first.random_bonus.value).toBe(4);
    expect(out).toContain('weight: 2f');
  });

  it('omite weight cuando vale 1 y count cuando vale 1', () => {
    const parsed = parseSNBT(rewardTableToSNBT(snbtToRewardTable(SAMPLE)));
    expect(parsed.rewards[2]).toEqual({ item: 'mekanism:pellet_polonium' });
  });

  it('conserva el NBT de ítems y las entradas de XP', () => {
    const parsed = parseSNBT(rewardTableToSNBT(snbtToRewardTable(SAMPLE)));
    expect(parsed.rewards[3].item.tag.stored_type).toBe('naturesaura:nether');
    expect(parsed.rewards[4].type).toBe('xp_levels');
    expect(parsed.rewards[4].xp_levels.value).toBe(50);
  });

  it('conserva campos desconocidos de las entradas', () => {
    const source = '{ id: "0000000000000001", rewards: [{ item: "a:b", weight: 3.0f, future_field: "keep" }] }';
    const parsed = parseSNBT(rewardTableToSNBT(snbtToRewardTable(source)));
    expect(parsed.rewards[0].future_field).toBe('keep');
  });

  it('el contenido no cambia tras cargar y guardar (ignorando el orden de claves)', () => {
    const sortKeys = (v: any): any =>
      Array.isArray(v)
        ? v.map(sortKeys)
        : v && typeof v === 'object'
          ? Object.fromEntries(
              Object.keys(v)
                .sort()
                .map((k) => [k, sortKeys(v[k])])
            )
          : v;
    const plain = (v: any) => sortKeys(JSON.parse(JSON.stringify(v, (_k, x) => (x && x.__type === 'number' ? x.value : x))));

    const before = plain(parseSNBT(SAMPLE));
    const after = plain(parseSNBT(rewardTableToSNBT(snbtToRewardTable(SAMPLE))));
    // el editor siempre escribe icon y title; se compara solo lo que importa para el juego
    expect(after.rewards).toEqual(before.rewards);
    expect(after.id).toBe(before.id);
    expect(after.loot_size).toBe(before.loot_size);
  });

  it('guarda el loot crate con glow como byte', () => {
    const source = `{
      id: "0000000000000009"
      loot_crate: { color: 16777215, drops: { boss: 0, monster: 0, passive: 0 }, glow: 1b, string_id: "box" }
      rewards: [{ item: "a:b" }]
    }`;
    const table = snbtToRewardTable(source);
    expect(table.loot_crate).toMatchObject({ string_id: 'box', glow: true, color: 16777215 });
    expect(rewardTableToSNBT(table)).toContain('glow: 1b');
  });
});
