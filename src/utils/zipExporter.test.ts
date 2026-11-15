import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildModpackZip } from './zipExporter';
import { parseSNBT } from './snbt';

async function open(blob: Blob) {
  return JSZip.loadAsync(await blob.arrayBuffer());
}

describe('buildModpackZip', () => {
  it('crea la estructura config/ftbquests/quests con capítulos, tablas, grupos y data', async () => {
    const blob = await buildModpackZip({
      chapters: [
        { filename: 'alpha', snbtData: { title: 'Alpha', quests: [] } },
        { filename: 'beta.snbt', content: '{ title: "Beta" }' },
      ],
      rewardTables: [
        {
          id: '0C83C7A93ED80A36',
          order_index: 1,
          title: 'Tabla',
          rewards: [{ item: 'minecraft:diamond', weight: 1 }],
        },
      ],
      chapterGroups: [{ id: '3A7C616923904F66', title: 'Eras' }],
      questData: { title: 'Pack', version: { __type: 'number', value: 13, suffix: '' } },
    });

    const zip = await open(blob);
    const names = Object.keys(zip.files)
      .filter((n) => !zip.files[n].dir)
      .sort();
    expect(names).toEqual([
      'config/ftbquests/quests/chapter_groups.snbt',
      'config/ftbquests/quests/chapters/alpha.snbt',
      'config/ftbquests/quests/chapters/beta.snbt',
      'config/ftbquests/quests/data.snbt',
      'config/ftbquests/quests/reward_tables/0c83c7a93ed80a36.snbt',
    ]);
  });

  it('los archivos del ZIP se pueden volver a leer', async () => {
    const zip = await open(
      await buildModpackZip({
        chapters: [{ filename: 'alpha', snbtData: { title: 'Alpha' } }],
        chapterGroups: [{ id: '3A7C616923904F66', title: 'Eras' }],
        questData: { title: 'Pack' },
      })
    );
    const base = 'config/ftbquests/quests/';
    expect(parseSNBT(await zip.file(`${base}chapters/alpha.snbt`)!.async('string')).title).toBe('Alpha');
    expect(parseSNBT(await zip.file(`${base}data.snbt`)!.async('string')).title).toBe('Pack');
    expect(parseSNBT(await zip.file(`${base}chapter_groups.snbt`)!.async('string')).chapter_groups[0]).toEqual({
      id: '3A7C616923904F66',
      title: 'Eras',
    });
  });

  it('sin tablas, grupos ni data no crea esos archivos', async () => {
    const zip = await open(await buildModpackZip({ chapters: [{ filename: 'solo', content: '{}' }] }));
    const files = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    expect(files).toEqual(['config/ftbquests/quests/chapters/solo.snbt']);
  });
});
