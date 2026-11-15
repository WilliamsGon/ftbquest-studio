import { describe, expect, it } from 'vitest';
import {
  generateKubeJsTestScript,
  getCompleteChapterCommands,
  getCompleteQuestCommand,
  getGiveRequiredItemsCommands,
  getResetQuestCommand,
} from './commandGenerator';

describe('commandGenerator', () => {
  it('/ftbquests change_progress lleva el orden <jugador> <acción> <id>', () => {
    expect(getCompleteQuestCommand('0a1b2c3d4e5f6789')).toBe('/ftbquests change_progress @p complete 0A1B2C3D4E5F6789');
    expect(getResetQuestCommand('0A1B2C3D4E5F6789', 'Steve')).toBe('/ftbquests change_progress Steve reset 0A1B2C3D4E5F6789');
  });

  it('genera un comando por misión para completar un capítulo', () => {
    expect(getCompleteChapterCommands([{ id: 'A' }, { id: 'B' }], '@a')).toEqual([
      '/ftbquests change_progress @a complete A',
      '/ftbquests change_progress @a complete B',
    ]);
  });

  describe('getGiveRequiredItemsCommands', () => {
    const count = (value: number) => ({ __type: 'number', value, suffix: 'L' });

    it('suma las cantidades de un mismo ítem entre tareas, aunque el count sea un número SNBT', () => {
      const quests = [
        { tasks: [{ type: 'item', item: 'minecraft:iron_ingot', count: count(4) }] },
        { tasks: [{ type: 'item', item: 'minecraft:iron_ingot', count: count(6) }, { type: 'item', item: 'minecraft:gold_ingot' }] },
      ];
      expect(getGiveRequiredItemsCommands(quests)).toEqual(['/give @p minecraft:iron_ingot 10', '/give @p minecraft:gold_ingot 1']);
    });

    it('lee el id de ítems con NBT, ignora tags y tareas que no son de ítem', () => {
      const quests = [
        {
          tasks: [
            { type: 'item', item: { id: 'gtceu:iron_hammer', Count: 1 } },
            { type: 'item', item: '#forge:ingots/iron' },
            { type: 'kill', entity: 'minecraft:zombie' },
          ],
        },
      ];
      expect(getGiveRequiredItemsCommands(quests)).toEqual(['/give @p gtceu:iron_hammer 1']);
    });
  });

  it('el script KubeJS incluye el título del capítulo y los ids de las misiones', () => {
    const script = generateKubeJsTestScript('Mi Capítulo', [{ id: 'ABCDEF0123456789' }]);
    expect(script).toContain('Mi Capítulo');
    expect(script).toContain('ABCDEF0123456789');
  });
});
