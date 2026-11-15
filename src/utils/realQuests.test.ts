/**
 * Pruebas con quests reales de modpacks. Son OPCIONALES: la carpeta `recursos-externos/` no se versiona
 * (contiene material con derechos de autor), así que si no existe estas pruebas se omiten.
 *
 * Para apuntar a otra ubicación:  FTB_REAL_QUESTS_DIR=/ruta/con/subcarpetas npm test
 * Cada subcarpeta debe tener la forma de config/ftbquests/quests (chapters/, reward_tables/, data.snbt...).
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSNBT, stringifySNBT } from './snbt';
import { snbtToRewardTable, rewardTableToSNBT } from '../types/rewardTable';
import { hexToTableIdNumber, tableIdToHex } from './tableId';

const root = path.resolve(process.env.FTB_REAL_QUESTS_DIR ?? 'recursos-externos');

const packs = fs.existsSync(root)
  ? fs
      .readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'chapters')))
      .map((e) => ({ name: e.name, dir: path.join(root, e.name) }))
  : [];

const snbtFiles = (dir: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.snbt')).map((f) => path.join(dir, f)) : [];

/** Misma estructura con claves ordenadas y números reducidos a su valor, para comparar contenido. */
const plain = (value: any): any =>
  JSON.parse(JSON.stringify(value, (_k, v) => (v && v.__type === 'number' ? v.value : v)), (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v
  );

describe.skipIf(packs.length === 0)('quests reales', () => {
  for (const pack of packs) {
    describe(pack.name, () => {
      const chapters = snbtFiles(path.join(pack.dir, 'chapters'));
      const tables = snbtFiles(path.join(pack.dir, 'reward_tables'));

      it('todos los capítulos se leen y se reescriben sin cambiar su contenido', () => {
        expect(chapters.length).toBeGreaterThan(0);
        const failures: string[] = [];
        for (const file of chapters) {
          try {
            const parsed = parseSNBT(fs.readFileSync(file, 'utf8'));
            const again = parseSNBT(stringifySNBT(parsed));
            if (JSON.stringify(plain(again)) !== JSON.stringify(plain(parsed))) failures.push(`${path.basename(file)} (distinto)`);
          } catch (err: any) {
            failures.push(`${path.basename(file)}: ${err.message}`);
          }
        }
        expect(failures).toEqual([]);
      });

      it('data.snbt y chapter_groups.snbt se leen y se reescriben', () => {
        for (const name of ['data.snbt', 'chapter_groups.snbt']) {
          const file = path.join(pack.dir, name);
          if (!fs.existsSync(file)) continue;
          const parsed = parseSNBT(fs.readFileSync(file, 'utf8'));
          expect(plain(parseSNBT(stringifySNBT(parsed)))).toEqual(plain(parsed));
        }
      });

      it('las reward tables conservan sus recompensas al cargarlas y guardarlas con el editor', () => {
        const failures: string[] = [];
        for (const file of tables) {
          const source = fs.readFileSync(file, 'utf8');
          const before = plain(parseSNBT(source)).rewards ?? [];
          const after = plain(parseSNBT(rewardTableToSNBT(snbtToRewardTable(source, 'x')))).rewards ?? [];
          for (const r of before) if (r.weight === 1) delete r.weight; // el editor omite el peso por defecto
          if (JSON.stringify(after) !== JSON.stringify(before)) failures.push(path.basename(file));
        }
        expect(failures).toEqual([]);
      });

      it('cada table_id de las recompensas apunta a una reward table existente', () => {
        const tableIds = new Set<string>();
        for (const file of tables) {
          const id = parseSNBT(fs.readFileSync(file, 'utf8')).id;
          if (id) tableIds.add(String(id).toUpperCase());
        }

        const unresolved: string[] = [];
        let references = 0;
        for (const file of chapters) {
          const chapter = parseSNBT(fs.readFileSync(file, 'utf8'));
          for (const quest of chapter.quests ?? []) {
            for (const reward of quest.rewards ?? []) {
              if (reward.table_id === undefined) continue;
              references++;
              const hex = tableIdToHex(reward.table_id);
              if (!tableIds.has(hex)) unresolved.push(`${path.basename(file)}:${hex}`);
              // el número vuelve a escribirse idéntico
              expect(stringifySNBT(hexToTableIdNumber(hex))).toBe(stringifySNBT(reward.table_id));
            }
          }
        }
        expect(references).toBeGreaterThanOrEqual(0);
        expect(unresolved).toEqual([]);
      });
    });
  }
});
