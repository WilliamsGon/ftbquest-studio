export interface TranslationEntry {
  key: string;
  chapterId: string;
  chapterTitle: string;
  questId?: string;
  questTitle?: string;
  fieldType: 'chapter_title' | 'title' | 'subtitle' | 'description';
  descIndex?: number;
  es: string;
  en: string;
  isCustomKey?: boolean;
}

export interface I18nStats {
  totalEntries: number;
  translatedEnCount: number;
  translatedEsCount: number;
  pendingEnCount: number;
  completionPercentage: number;
}
