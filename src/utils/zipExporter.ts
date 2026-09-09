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
  zipName?: string;
  zipFilename?: string;
}

/**
 * Empaqueta todos los capítulos y tablas de recompensas en un único archivo .ZIP
 * con la estructura canónica de carpetas de FTB Quests para Minecraft:
 * 
 * config/
 * └── ftbquests/
 *     └── quests/
 *         ├── chapters/
 *         │   └── *.snbt
 *         └── reward_tables/
 *             └── *.snbt
 */
export async function exportModpackToZip(options: ModpackZipOptions): Promise<void> {
  const { chapters, rewardTables = [], chapterGroups = [], zipName, zipFilename } = options;
  const finalZipName = zipFilename || zipName || 'ftbquests-modpack.zip';

  const zip = new JSZip();
  const basePath = 'config/ftbquests/quests';

  // Carpeta de Capítulos
  const chaptersFolder = zip.folder(`${basePath}/chapters`);
  if (chaptersFolder) {
    chapters.forEach((item) => {
      const cleanName = item.filename.endsWith('.snbt') ? item.filename : `${item.filename}.snbt`;
      const fileContent = item.content !== undefined ? item.content : (item.snbtData ? stringifySNBT(item.snbtData) : '');
      chaptersFolder.file(cleanName, fileContent);
    });
  }

  // Carpeta de Tablas de Recompensas (si existen)
  if (rewardTables.length > 0) {
    const rewardTablesFolder = zip.folder(`${basePath}/reward_tables`);
    if (rewardTablesFolder) {
      rewardTables.forEach((entry) => {
        if ('rewards' in entry) {
          const table = entry as RewardTable;
          const cleanName = `${(table.id || 'table').toLowerCase()}.snbt`;
          const content = rewardTableToSNBT(table);
          rewardTablesFolder.file(cleanName, content);
        } else {
          const file = entry as ZipExportFile;
          const cleanName = file.filename.endsWith('.snbt') ? file.filename : `${file.filename}.snbt`;
          const content = file.content !== undefined ? file.content : (file.snbtData ? stringifySNBT(file.snbtData) : '');
          rewardTablesFolder.file(cleanName, content);
        }
      });
    }
  }

  // Archivo chapter_groups.snbt (si existen grupos de capítulos definidos)
  if (chapterGroups && chapterGroups.length > 0) {
    const groupsSNBT = stringifySNBT({
      chapter_groups: chapterGroups.map((g) => ({
        id: g.id,
        title: g.title,
      })),
    });
    zip.file(`${basePath}/chapter_groups.snbt`, groupsSNBT);
  }

  // Generar blob y descargar
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalZipName.endsWith('.zip') ? finalZipName : `${finalZipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
