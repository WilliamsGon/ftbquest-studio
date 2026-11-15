/**
 * Acceso directo a la carpeta de quests con la File System Access API
 * (Chrome y Edge, en contexto seguro: https o localhost).
 * Permite abrir y guardar sin pasar por descargas ni ZIP.
 */
import type { ModpackFile } from './zipExporter';

export type DirHandle = any;

export function isFolderAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';
}

/** Pide al usuario una carpeta con permiso de lectura y escritura. Devuelve null si cancela. */
export async function pickQuestFolder(): Promise<DirHandle | null> {
  try {
    return await (window as any).showDirectoryPicker({ mode: 'readwrite', id: 'ftb-quests' });
  } catch (e: any) {
    if (e?.name === 'AbortError') return null;
    throw e;
  }
}

async function child(dir: DirHandle, name: string): Promise<DirHandle | null> {
  try {
    return await dir.getDirectoryHandle(name);
  } catch {
    return null;
  }
}

/**
 * Si se eligió una carpeta superior (la instancia, `config` o `ftbquests`),
 * baja hasta la carpeta `quests` real. Si no la encuentra, usa la elegida.
 */
export async function resolveQuestsDir(dir: DirHandle): Promise<DirHandle> {
  if (await child(dir, 'chapters')) return dir;
  for (const route of [['config', 'ftbquests', 'quests'], ['ftbquests', 'quests'], ['quests']]) {
    let cur: DirHandle | null = dir;
    for (const part of route) {
      cur = cur ? await child(cur, part) : null;
    }
    if (cur) return cur;
  }
  return dir;
}

/** Lee todos los .snbt de la carpeta como `File` con su ruta relativa (igual que un input webkitdirectory). */
export async function readQuestFolder(dir: DirHandle): Promise<File[]> {
  const out: File[] = [];
  const walk = async (d: DirHandle, prefix: string, depth: number) => {
    for await (const [name, entry] of d.entries()) {
      if (entry.kind === 'directory') {
        if (depth < 2) await walk(entry, `${prefix}${name}/`, depth + 1);
      } else if (name.toLowerCase().endsWith('.snbt')) {
        const f: File = await entry.getFile();
        const file = new File([f], name, { type: f.type, lastModified: f.lastModified });
        Object.defineProperty(file, 'webkitRelativePath', { value: `${dir.name}/${prefix}${name}` });
        out.push(file);
      }
    }
  };
  await walk(dir, '', 0);
  return out;
}

/** Escribe los archivos (creando chapters/ y reward_tables/ si hace falta). No borra nada. */
export async function writeQuestFiles(dir: DirHandle, files: ModpackFile[]): Promise<number> {
  let written = 0;
  for (const f of files) {
    const parts = f.path.split('/');
    const name = parts.pop() as string;
    let cur = dir;
    for (const part of parts) cur = await cur.getDirectoryHandle(part, { create: true });
    const fh = await cur.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(f.content);
    await w.close();
    written++;
  }
  return written;
}
