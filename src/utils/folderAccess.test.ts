import { describe, expect, it } from 'vitest';
import { readQuestFolder, resolveQuestsDir, writeQuestFiles } from './folderAccess';
import { buildModpackFiles } from './zipExporter';
import { classifyQuestFiles } from './questBook';

/** Carpeta en memoria con la forma mínima de FileSystemDirectoryHandle. */
function fakeDir(name: string, tree: Record<string, any> = {}): any {
  const dir: any = {
    kind: 'directory', name, tree,
    async getDirectoryHandle(n: string, o?: { create?: boolean }) {
      if (!(tree[n] instanceof Object) || typeof tree[n] === 'string') {
        if (!o?.create) throw new Error('NotFound');
        tree[n] = {};
      }
      return fakeDir(n, tree[n]);
    },
    async getFileHandle(n: string, o?: { create?: boolean }) {
      if (typeof tree[n] !== 'string' && !o?.create) throw new Error('NotFound');
      return {
        kind: 'file', name: n,
        async getFile() { return new File([tree[n]], n); },
        async createWritable() {
          let buf = '';
          return { async write(c: string) { buf += c; }, async close() { tree[n] = buf; } };
        },
      };
    },
    async *entries() {
      for (const [k, v] of Object.entries(tree)) {
        yield [k, typeof v === 'string'
          ? { kind: 'file', name: k, getFile: async () => new File([v as string], k) }
          : fakeDir(k, v)];
      }
    },
  };
  return dir;
}

describe('buildModpackFiles', () => {
  it('genera rutas relativas a la carpeta quests', () => {
    const files = buildModpackFiles({
      chapters: [{ filename: 'inicio', content: '{}' }],
      rewardTables: [{ id: 'AAAA0000AAAA0000', title: 'T', rewards: [] } as any],
      chapterGroups: [{ id: 'G1', title: 'Grupo' } as any],
      questData: { title: 'Libro' },
    });
    expect(files.map((f) => f.path).sort()).toEqual(
      ['chapter_groups.snbt', 'chapters/inicio.snbt', 'data.snbt', 'reward_tables/aaaa0000aaaa0000.snbt'].sort()
    );
  });
});

describe('acceso a carpeta', () => {
  it('escribe creando subcarpetas y sobrescribe lo existente', async () => {
    const root = fakeDir('quests', { chapters: { 'a.snbt': 'viejo' } });
    const n = await writeQuestFiles(root, [
      { path: 'chapters/a.snbt', content: 'nuevo' },
      { path: 'reward_tables/t.snbt', content: 'tabla' },
      { path: 'data.snbt', content: 'datos' },
    ]);
    expect(n).toBe(3);
    expect(root.tree.chapters['a.snbt']).toBe('nuevo');
    expect(root.tree.reward_tables['t.snbt']).toBe('tabla');
    expect(root.tree['data.snbt']).toBe('datos');
  });

  it('lee la carpeta y los archivos se clasifican por su ruta', async () => {
    const root = fakeDir('quests', {
      'data.snbt': '{}', 'chapter_groups.snbt': '{}', 'leeme.txt': 'x',
      chapters: { 'a.snbt': '{}' }, reward_tables: { 't.snbt': '{}' },
    });
    const kinds = classifyQuestFiles(await readQuestFolder(root)).map((c) => `${c.file.name}:${c.kind}`).sort();
    expect(kinds).toEqual(['a.snbt:chapter', 'chapter_groups.snbt:chapter_groups', 'data.snbt:data', 't.snbt:reward_table']);
  });

  it('desde una carpeta superior baja hasta config/ftbquests/quests', async () => {
    const root = fakeDir('instancia', { config: { ftbquests: { quests: { chapters: {} } } } });
    expect((await resolveQuestsDir(root)).name).toBe('quests');
    const direct = fakeDir('quests', { chapters: {} });
    expect((await resolveQuestsDir(direct)).name).toBe('quests');
  });
});
