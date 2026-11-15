import { describe, expect, it } from 'vitest';
import { classifyQuestFiles, createDefaultQuestBookData, readQuestExtras, snbtNumber, withNumber } from './questBook';
import { parseSNBT, stringifySNBT } from './snbt';

function fakeFile(name: string, content: string, relativePath?: string): File {
  const file = new File([content], name);
  if (relativePath) Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });
  return file;
}

describe('classifyQuestFiles', () => {
  it('distingue capítulos, reward tables, data y grupos por carpeta y nombre', () => {
    const files = [
      fakeFile('data.snbt', '{}', 'quests/data.snbt'),
      fakeFile('chapter_groups.snbt', '{}', 'quests/chapter_groups.snbt'),
      fakeFile('alpha.snbt', '{}', 'quests/chapters/alpha.snbt'),
      fakeFile('epic.snbt', '{}', 'quests/reward_tables/epic.snbt'),
    ];
    expect(classifyQuestFiles(files).map((c) => c.kind)).toEqual(['data', 'chapter_groups', 'chapter', 'reward_table']);
  });

  it('ignora lo que no es .snbt (respaldos .tar.gz, etc.)', () => {
    const files = [fakeFile('backup.tar.gz', 'x', 'quests/chapters/backup.tar.gz'), fakeFile('a.snbt', '{}', 'quests/chapters/a.snbt')];
    expect(classifyQuestFiles(files)).toHaveLength(1);
  });

  it('un .snbt suelto (sin carpeta) es un capítulo, pero data.snbt suelto es data', () => {
    const kinds = classifyQuestFiles([fakeFile('mi_capitulo.snbt', '{}'), fakeFile('data.snbt', '{}')]).map((c) => c.kind);
    expect(kinds).toEqual(['chapter', 'data']);
  });

  it('un capítulo llamado data.snbt dentro de chapters/ sigue siendo un capítulo', () => {
    expect(classifyQuestFiles([fakeFile('data.snbt', '{}', 'q/chapters/data.snbt')])[0].kind).toBe('chapter');
  });
});

describe('readQuestExtras', () => {
  it('lee data, grupos y reward tables, y no toca los capítulos', async () => {
    const classified = classifyQuestFiles([
      fakeFile('data.snbt', '{ title: "Pack"\n grid_scale: 0.5d }', 'q/data.snbt'),
      fakeFile('chapter_groups.snbt', '{ chapter_groups: [{ id: "3A7C616923904F66", title: "Eras" }] }', 'q/chapter_groups.snbt'),
      fakeFile('epic.snbt', '{ id: "0000000000000001", rewards: [{ item: "a:b", random_bonus: 2 }] }', 'q/reward_tables/epic.snbt'),
      fakeFile('alpha.snbt', '{ title: "Alpha" }', 'q/chapters/alpha.snbt'),
    ]);
    const extras = await readQuestExtras(classified);

    expect(extras.data.title).toBe('Pack');
    expect(extras.chapterGroups).toEqual([{ id: '3A7C616923904F66', title: 'Eras' }]);
    expect(extras.rewardTables).toHaveLength(1);
    expect(extras.rewardTables[0].rewards[0].random_bonus).toBe(2);
    expect(extras.errors).toEqual([]);
  });

  it('informa de los archivos que no se pueden leer sin abortar el resto', async () => {
    const classified = classifyQuestFiles([
      fakeFile('data.snbt', '{ a 1 }', 'q/data.snbt'),
      fakeFile('chapter_groups.snbt', '{ chapter_groups: [{ id: "AAAAAAAAAAAAAAAA", title: "Ok" }] }', 'q/chapter_groups.snbt'),
    ]);
    const extras = await readQuestExtras(classified);
    expect(extras.chapterGroups).toHaveLength(1);
    expect(extras.data).toBeUndefined();
    expect(extras.errors).toHaveLength(1);
    expect(extras.errors[0]).toContain('data.snbt');
  });
});

describe('data.snbt', () => {
  it('los valores por defecto se escriben como SNBT válido', () => {
    const out = stringifySNBT(createDefaultQuestBookData());
    const parsed = parseSNBT(out);
    expect(parsed.default_quest_shape).toBe('circle');
    expect(parsed.progression_mode).toBe('flexible');
    expect(out).toContain('grid_scale: 0.5d');
    expect(parsed.loot_crate_no_drop.monster.value).toBe(600);
  });

  it('withNumber conserva el sufijo existente y snbtNumber lee ambos formatos', () => {
    const prev = parseSNBT('{ g: 0.5d }').g;
    expect(stringifySNBT({ g: withNumber(prev, 1.5, 'd') })).toContain('g: 1.5d');
    expect(withNumber(undefined, 20)).toEqual({ __type: 'number', value: 20, suffix: '' });
    expect(snbtNumber(prev)).toBe(0.5);
    expect(snbtNumber(7)).toBe(7);
    expect(snbtNumber(undefined, 3)).toBe(3);
  });

  it('un data.snbt real se reescribe sin perder campos desconocidos', () => {
    const source = `{
	default_quest_shape: "none"
	icon: { Count: 1, id: "atilas_armors:atila_hat", tag: { Damage: 0 } }
	future_option: "keep me"
	title: "HunosCraft 4"
	version: 13
}`;
    const parsed = parseSNBT(source);
    const edited = { ...parsed, title: 'Otro' };
    const out = parseSNBT(stringifySNBT(edited));
    expect(out.future_option).toBe('keep me');
    expect(out.icon.id).toBe('atilas_armors:atila_hat');
    expect(out.title).toBe('Otro');
  });
});
