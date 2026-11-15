import { describe, expect, it } from 'vitest';
import { applyDoctorBatchAutoFix, runModpackDiagnosis } from './modpackDoctor';
import { completeQuestInSimulator, createInitialSimulatorState } from './questSimulatorEngine';
import { parseSNBT } from './snbt';
import { hexToTableIdNumber } from './tableId';

const n = (value: number, suffix = '') => ({ __type: 'number', value, suffix, raw: String(value) });
const quest = (id: string, extra: any = {}) => ({ id, title: 'Misión ' + id, tasks: [{ type: 'item', item: 'minecraft:dirt', count: n(1, 'L') }], ...extra });
const titles = (r: ReturnType<typeof runModpackDiagnosis>) => r.issues.map((i) => i.title);

describe('Doctor con números SNBT', () => {
  it('no marca como inválida una cantidad leída del SNBT', () => {
    const r = runModpackDiagnosis([quest('0000000000000001', { tasks: [{ type: 'item', item: 'minecraft:dirt', count: n(64, 'L') }] })]);
    expect(r.issues.filter((i) => i.fixType === 'fix_task_count')).toHaveLength(0);
  });

  it('detecta cantidad <= 0 y la repara', () => {
    const qs = [quest('0000000000000001', { tasks: [{ type: 'item', item: 'minecraft:dirt', count: n(0, 'L') }] })];
    const r = runModpackDiagnosis(qs);
    expect(r.issues.some((i) => i.fixType === 'fix_task_count')).toBe(true);
    const { updatedQuests, fixedCount } = applyDoctorBatchAutoFix(r.issues, qs);
    expect(fixedCount).toBe(1);
    expect(runModpackDiagnosis(updatedQuests).issues.some((i) => i.fixType === 'fix_task_count')).toBe(false);
  });
});

describe('Doctor con tipos nuevos', () => {
  it('detecta tareas incompletas', () => {
    const tasks = [
      { type: 'fluid', fluid: '', amount: n(1000) },
      { type: 'forge_energy', value: n(0) },
      { type: 'stat', stat: '', value: n(0) },
      { type: 'advancement', advancement: '' },
      { type: 'observation', to_observe: '' },
      { type: 'dimension', dimension: '' },
    ];
    const t = titles(runModpackDiagnosis([quest('0000000000000001', { tasks })]));
    expect(t).toEqual(expect.arrayContaining([
      expect.stringContaining('de fluido vacía'),
      expect.stringContaining('Energía requerida inválida'),
      expect.stringContaining('sin estadística'),
      expect.stringContaining('de logro sin logro'),
      expect.stringContaining('sin objetivo'),
      expect.stringContaining('sin dimensión'),
    ]));
  });

  it('no avisa de tareas bien formadas', () => {
    const tasks = [
      { type: 'fluid', fluid: 'minecraft:water', amount: n(1000) },
      { type: 'forge_energy', value: n(5000, 'L') },
      { type: 'stat', stat: 'minecraft:jump', value: n(10) },
      { type: 'advancement', advancement: 'minecraft:story/root' },
    ];
    expect(runModpackDiagnosis([quest('0000000000000001', { tasks })]).issues).toHaveLength(0);
  });

  it('detecta recompensas vacías', () => {
    const rewards = [
      { type: 'command', command: '' },
      { type: 'advancement', advancement: '' },
      { type: 'gamestage', stage: '' },
      { type: 'xp', xp: n(0) },
    ];
    expect(runModpackDiagnosis([quest('0000000000000001', { rewards })]).issues.filter((i) => i.category === 'broken_reward')).toHaveLength(4);
  });

  it('valida table_id numérico (long) contra las tablas existentes', () => {
    const table: any = { id: '51D81405A1552C58', title: 'T', rewards: [] };
    const ok = quest('0000000000000001', { rewards: [{ type: 'loot', table_id: hexToTableIdNumber('51D81405A1552C58') }] });
    const bad = quest('0000000000000002', { rewards: [{ type: 'loot', table_id: hexToTableIdNumber('1111111111111111') }] });
    const r = runModpackDiagnosis([ok, bad], [table]);
    expect(r.issues.filter((i) => i.title.includes('inexistente')).map((i) => i.questId)).toEqual(['0000000000000002']);
  });

  it('funciona con un capítulo parseado de verdad', () => {
    const ch: any = parseSNBT('{ quests: [{ id: "0000000000000001" title: "A" tasks: [{ id: "1" type: "item" item: "minecraft:dirt" count: 3L }] rewards: [{ id: "2" type: "xp" xp: 50 }] }] }');
    expect(runModpackDiagnosis(ch.quests).issues).toHaveLength(0);
  });
});

describe('Simulador con números SNBT y tipos nuevos', () => {
  const table: any = {
    id: '51D81405A1552C58', title: 'Botín',
    rewards: [{ item: 'minecraft:gold_ingot', count: 2, weight: 1 }, { item: 'minecraft:iron_ingot', count: 3, weight: 1 }],
  };

  it('suma cantidad y XP leídas como números SNBT', () => {
    const qs = [quest('0000000000000001', { rewards: [
      { type: 'item', item: 'minecraft:apple', count: n(5) },
      { type: 'xp', xp: n(200) },
      { type: 'xp_levels', xp_levels: n(3) },
    ] })];
    const s = completeQuestInSimulator('0000000000000001', createInitialSimulatorState(qs), qs);
    expect(s.virtualInventory['minecraft:apple'].count).toBe(5);
    expect(s.virtualXp).toBe(200);
    expect(s.virtualXpLevels).toBe(3);
  });

  it('all_table entrega todas las entradas de la tabla', () => {
    const qs = [quest('0000000000000001', { rewards: [{ type: 'all_table', table_id: hexToTableIdNumber(table.id) }] })];
    const s = completeQuestInSimulator('0000000000000001', createInitialSimulatorState(qs), qs, [table]);
    expect(s.virtualInventory['minecraft:gold_ingot'].count).toBe(2);
    expect(s.virtualInventory['minecraft:iron_ingot'].count).toBe(3);
  });

  it('loot entrega exactamente una entrada', () => {
    const qs = [quest('0000000000000001', { rewards: [{ type: 'loot', table_id: hexToTableIdNumber(table.id) }] })];
    const s = completeQuestInSimulator('0000000000000001', createInitialSimulatorState(qs), qs, [table]);
    expect(Object.keys(s.virtualInventory)).toHaveLength(1);
  });

  it('registra recompensas sin inventario en el historial', () => {
    const qs = [quest('0000000000000001', { rewards: [{ type: 'advancement', advancement: 'minecraft:story/root' }, { type: 'command', command: '/say hi' }] })];
    const s = completeQuestInSimulator('0000000000000001', createInitialSimulatorState(qs), qs);
    expect(s.history[0].rewards.map((r) => r.type)).toEqual(['advancement', 'command']);
  });

  it('respeta min_required_dependencies como número SNBT', () => {
    const qs = [
      quest('0000000000000001'), quest('0000000000000002'),
      quest('0000000000000003', { dependencies: ['0000000000000001', '0000000000000002'], min_required_dependencies: n(1) }),
    ];
    const s = completeQuestInSimulator('0000000000000001', createInitialSimulatorState(qs), qs);
    expect(s.unlockedQuestIds.has('0000000000000003')).toBe(true);
  });
});
