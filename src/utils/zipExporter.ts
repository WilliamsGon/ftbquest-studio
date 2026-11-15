import JSZip from 'jszip';
import { stringifySNBT } from './snbt';
import { rewardTableToSNBT } from '../types/rewardTable';
import type { RewardTable } from '../types/rewardTable';
import type { ChapterGroup } from '../types/chapterGroup';

export interface ZipExportFile {
  filename: string;
  content?: string;
  snbtData?: any;
}

export interface ModpackZipOptions {
  chapters: ZipExportFile[];
  rewardTables?: (RewardTable | ZipExportFile)[];
  chapterGroups?: ChapterGroup[];
  /** Contenido de data.snbt (ajustes globales del libro) */
  questData?: any;
  zipName?: string;
  zipFilename?: string;
}

export interface ModpackFile {
  /** Ruta relativa a la carpeta quests (ej. "chapters/a.snbt") */
  path: string;
  content: string;
}

const withSnbt = (name: string) => (name.endsWith('.snbt') ? name : `${name}.snbt`);
const contentOf = (f: ZipExportFile) => (f.content !== undefined ? f.content : f.snbtData ? stringifySNBT(f.snbtData) : '');

/**
 * Lista de archivos de un libro de misiones, con rutas relativas a la carpeta `quests`:
 * chapters/*.snbt, reward_tables/*.snbt, data.snbt y chapter_groups.snbt.
 */
export function buildModpackFiles(options: ModpackZipOptions): ModpackFile[] {
  const { chapters, rewardTables = [], chapterGroups = [], questData } = options;
  const files: ModpackFile[] = [];

  chapters.forEach((item) => files.push({ path: `chapters/${withSnbt(item.filename)}`, content: contentOf(item) }));

  rewardTables.forEach((entry) => {
    if ('rewards' in entry) {
      const table = entry as RewardTable;
      files.push({ path: `reward_tables/${(table.id || 'table').toLowerCase()}.snbt`, content: rewardTableToSNBT(table) });
    } else {
      const file = entry as ZipExportFile;
      files.push({ path: `reward_tables/${withSnbt(file.filename)}`, content: contentOf(file) });
    }
  });

  if (questData) files.push({ path: 'data.snbt', content: stringifySNBT(questData) });

  if (chapterGroups.length > 0) {
    files.push({
      path: 'chapter_groups.snbt',
      content: stringifySNBT({ chapter_groups: chapterGroups.map((g) => ({ id: g.id, title: g.title })) }),
    });
  }

  return files;
}

/**
 * Empaqueta todos los capítulos y tablas de recompensas en un único archivo .ZIP
 * con la estructura canónica de carpetas de FTB Quests: config/ftbquests/quests/...
 */
export async function buildModpackZip(options: ModpackZipOptions): Promise<Blob> {
  const zip = new JSZip();
  const basePath = 'config/ftbquests/quests';
  for (const f of buildModpackFiles(options)) zip.file(`${basePath}/${f.path}`, f.content);

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
}

/** Genera el ZIP y lo descarga en el navegador. */
export async function exportModpackToZip(options: ModpackZipOptions): Promise<void> {
  const finalZipName = options.zipFilename || options.zipName || 'ftbquests-modpack.zip';
  const blob = await buildModpackZip(options);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalZipName.endsWith('.zip') ? finalZipName : `${finalZipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
