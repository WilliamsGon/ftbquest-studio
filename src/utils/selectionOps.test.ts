import { describe, expect, it } from 'vitest';
import { alignItems, distributeItems } from './selectionOps';
import { createReplacer } from './batchReplace';

const d = (value: number) => ({ __type: 'number', value, suffix: 'd' });
const q = (id: string, x: number, y: number, size = 1) => ({ id, x: d(x), y: d(y), size: d(size) });
const sel = (...ids: string[]) => ids.map((id) => ({ type: 'quest' as const, id }));
const xOf = (r: any, id: string) => r.quests.find((k: any) => k.id === id).x.value;
const yOf = (r: any, id: string) => r.quests.find((k: any) => k.id === id).y.value;

describe('alignItems', () => {
  const quests = [q('A', 0, 0), q('B', 4, 3), q('C', 10, 6)];

  it('alinea a la izquierda, centro y derecha', () => {
    expect(['A', 'B', 'C'].map((i) => xOf(alignItems(sel('A', 'B', 'C'), quests, [], 'left'), i))).toEqual([0, 0, 0]);
    expect(['A', 'B', 'C'].map((i) => xOf(alignItems(sel('A', 'B', 'C'), quests, [], 'right'), i))).toEqual([10, 10, 10]);
    expect(xOf(alignItems(sel('A', 'B', 'C'), quests, [], 'center'), 'B')).toBe(5);
  });

  it('alinea en vertical', () => {
    expect(yOf(alignItems(sel('A', 'B', 'C'), quests, [], 'top'), 'C')).toBe(0);
    expect(yOf(alignItems(sel('A', 'B', 'C'), quests, [], 'bottom'), 'A')).toBe(6);
  });

  it('no hace nada con menos de dos elementos', () => {
    expect(alignItems(sel('A'), quests, [], 'left')).toBeNull();
  });

  it('no modifica el original y conserva el resto de misiones', () => {
    const r = alignItems(sel('A', 'B'), quests, [], 'right')!;
    expect(xOf({ quests }, 'A')).toBe(0);
    expect(r.quests).toHaveLength(3);
    expect(xOf(r, 'C')).toBe(10);
  });
});

describe('distributeItems', () => {
  it('reparte con espacios iguales en horizontal', () => {
    const quests = [q('A', 0, 0), q('B', 1, 0), q('C', 10, 0)];
    const r = distributeItems(sel('A', 'B', 'C'), quests, [], 'horizontal')!;
    expect(xOf(r, 'B')).toBeCloseTo(5);
    expect(r.message).toContain('horizontal');
  });

  it('exige al menos tres elementos', () => {
    expect(distributeItems(sel('A', 'B'), [q('A', 0, 0), q('B', 5, 0)], [], 'horizontal')).toBeNull();
  });
});

describe('createReplacer', () => {
  const fields = { titles: true, descriptions: true, tasks: true, rewards: true, icons: true };

  it('reemplaza en título, tareas, recompensas e iconos y cuenta las ocurrencias', () => {
    const { replaceInQuest, stats } = createReplacer('iron', 'gold', fields);
    const out = replaceInQuest({
      id: '1', title: 'iron iron', icon: 'minecraft:iron_ingot',
      tasks: [{ item: 'minecraft:iron_ore' }], rewards: [{ item: { id: 'minecraft:iron_block' } }],
    });
    expect(out.title).toBe('gold gold');
    expect(out.icon).toBe('minecraft:gold_ingot');
    expect(out.tasks[0].item).toBe('minecraft:gold_ore');
    expect(out.rewards[0].item.id).toBe('minecraft:gold_block');
    expect(stats).toEqual({ totalReplacements: 5, modifiedQuestsCount: 1 });
  });

  it('respeta los campos desactivados y devuelve el mismo objeto si no hay cambios', () => {
    const { replaceInQuest, stats } = createReplacer('iron', 'gold', { ...fields, titles: false });
    const quest = { id: '1', title: 'iron' };
    expect(replaceInQuest(quest)).toBe(quest);
    expect(stats.totalReplacements).toBe(0);
  });

  it('reemplaza en imágenes solo si icons está activo', () => {
    const imgs = [{ image: 'a/iron.png' }];
    expect(createReplacer('iron', 'gold', fields).replaceInImages(imgs)[0].image).toBe('a/gold.png');
    expect(createReplacer('iron', 'gold', { ...fields, icons: false }).replaceInImages(imgs)).toBe(imgs);
  });
});
