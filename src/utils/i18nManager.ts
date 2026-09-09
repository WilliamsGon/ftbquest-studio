import type { ChapterTab } from '../types/chapter';
import type { TranslationEntry, I18nStats } from '../types/i18n';

function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}

/**
 * Extrae todas las cadenas de texto traducibles de los capítulos cargados.
 */
export function extractTranslationEntries(chapters: ChapterTab[]): TranslationEntry[] {
  const entries: TranslationEntry[] = [];
  const seenKeys = new Set<string>();

  chapters.forEach((ch) => {
    const chSlug = slugify(ch.filename ? ch.filename.replace(/\.snbt$/, '') : (ch.title || ch.id));
    const chTitle = ch.title || ch.filename || 'Capítulo';

    // 1. Título del Capítulo
    if (ch.title) {
      const isKey = ch.title.startsWith('{') && ch.title.endsWith('}');
      const rawKey = isKey ? ch.title.slice(1, -1) : `chapter.${chSlug}.title`;
      if (!seenKeys.has(rawKey)) {
        seenKeys.add(rawKey);
        entries.push({
          key: rawKey,
          chapterId: ch.id,
          chapterTitle: chTitle,
          fieldType: 'chapter_title',
          es: isKey ? '' : ch.title,
          en: '',
          isCustomKey: isKey
        });
      }
    }

    // 2. Misiones del Capítulo
    const quests = Array.isArray(ch.quests) ? ch.quests : [];
    quests.forEach((q) => {
      if (!q) return;
      const qId = String(q.id || 'quest');
      const qTitleText = q.title || `Misión #${qId.slice(-4)}`;
      const qSlug = slugify(q.title || qId.slice(-6));

      // Título de la Misión
      if (q.title) {
        const isKey = q.title.startsWith('{') && q.title.endsWith('}');
        const rawKey = isKey ? q.title.slice(1, -1) : `chapter.${chSlug}.quest.${qSlug}.title`;
        if (!seenKeys.has(rawKey)) {
          seenKeys.add(rawKey);
          entries.push({
            key: rawKey,
            chapterId: ch.id,
            chapterTitle: chTitle,
            questId: qId,
            questTitle: qTitleText,
            fieldType: 'title',
            es: isKey ? '' : q.title,
            en: '',
            isCustomKey: isKey
          });
        }
      }

      // Subtítulo de la Misión
      if (q.subtitle) {
        const isKey = q.subtitle.startsWith('{') && q.subtitle.endsWith('}');
        const rawKey = isKey ? q.subtitle.slice(1, -1) : `chapter.${chSlug}.quest.${qSlug}.subtitle`;
        if (!seenKeys.has(rawKey)) {
          seenKeys.add(rawKey);
          entries.push({
            key: rawKey,
            chapterId: ch.id,
            chapterTitle: chTitle,
            questId: qId,
            questTitle: qTitleText,
            fieldType: 'subtitle',
            es: isKey ? '' : q.subtitle,
            en: '',
            isCustomKey: isKey
          });
        }
      }

      // Descripción (puede ser string o array de líneas)
      if (q.description) {
        const lines = Array.isArray(q.description) ? q.description : [q.description];
        lines.forEach((line: string, lIdx: number) => {
          if (!line || !line.trim()) return;
          const isKey = line.startsWith('{') && line.endsWith('}');
          const rawKey = isKey ? line.slice(1, -1) : `chapter.${chSlug}.quest.${qSlug}.desc.${lIdx + 1}`;
          if (!seenKeys.has(rawKey)) {
            seenKeys.add(rawKey);
            entries.push({
              key: rawKey,
              chapterId: ch.id,
              chapterTitle: chTitle,
              questId: qId,
              questTitle: qTitleText,
              fieldType: 'description',
              descIndex: lIdx,
              es: isKey ? '' : line,
              en: '',
              isCustomKey: isKey
            });
          }
        });
      }
    });
  });

  return entries;
}

/**
 * Calcula estadísticas de progreso de internacionalización.
 */
export function calculateI18nStats(entries: TranslationEntry[]): I18nStats {
  const totalEntries = entries.length;
  let translatedEnCount = 0;
  let translatedEsCount = 0;

  entries.forEach((e) => {
    if (e.en && e.en.trim().length > 0) translatedEnCount++;
    if (e.es && e.es.trim().length > 0) translatedEsCount++;
  });

  const pendingEnCount = totalEntries - translatedEnCount;
  const completionPercentage = totalEntries > 0
    ? Math.round((translatedEnCount / totalEntries) * 100)
    : 100;

  return {
    totalEntries,
    translatedEnCount,
    translatedEsCount,
    pendingEnCount,
    completionPercentage
  };
}

/**
 * Exporta el diccionario de idioma a formato JSON estándar para Minecraft/KubeJS (en_us.json / es_es.json).
 */
export function exportLangJson(entries: TranslationEntry[], lang: 'es' | 'en'): string {
  const dict: Record<string, string> = {};
  entries.forEach((e) => {
    const val = lang === 'en' ? (e.en || e.es) : (e.es || e.en);
    dict[e.key] = val || '';
  });
  return JSON.stringify(dict, null, 2);
}

/**
 * Importa traducciones desde un archivo JSON para actualizar las entradas en memoria.
 */
export function importLangJson(
  jsonContent: string,
  currentEntries: TranslationEntry[],
  lang: 'es' | 'en'
): TranslationEntry[] {
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    console.warn('Error parsing lang json:', err);
    return currentEntries;
  }

  return currentEntries.map((entry) => {
    if (parsed[entry.key] !== undefined) {
      return {
        ...entry,
        [lang]: parsed[entry.key]
      };
    }
    return entry;
  });
}

/**
 * Convierte los textos directos del modpack en claves de traducción {clave}
 * permitiendo compatibilidad multi-idioma con CurseForge sin romper las misiones.
 */
export function applyI18nKeysToChapters(
  chapters: ChapterTab[],
  entries: TranslationEntry[]
): ChapterTab[] {
  // Mapa de clave por campo: questId + fieldType + descIndex -> key
  const keyMap = new Map<string, string>();
  entries.forEach((e) => {
    const id = e.questId || e.chapterId;
    const lookup = `${id}_${e.fieldType}_${e.descIndex ?? 0}`;
    keyMap.set(lookup, `{${e.key}}`);
  });

  return chapters.map((ch) => {
    const chCopy = { ...ch };
    const chKeyLookup = `${ch.id}_chapter_title_0`;
    if (keyMap.has(chKeyLookup)) {
      chCopy.title = keyMap.get(chKeyLookup)!;
      if (chCopy.snbtData) {
        chCopy.snbtData.title = chCopy.title;
      }
    }

    if (Array.isArray(chCopy.quests)) {
      chCopy.quests = chCopy.quests.map((q) => {
        if (!q) return q;
        const qCopy = { ...q };
        const qId = String(q.id);

        const titleKey = keyMap.get(`${qId}_title_0`);
        if (titleKey) qCopy.title = titleKey;

        const subtitleKey = keyMap.get(`${qId}_subtitle_0`);
        if (subtitleKey) qCopy.subtitle = subtitleKey;

        if (Array.isArray(qCopy.description)) {
          qCopy.description = qCopy.description.map((line: string, idx: number) => {
            const descKey = keyMap.get(`${qId}_description_${idx}`);
            return descKey || line;
          });
        }

        return qCopy;
      });
    }

    return chCopy;
  });
}
