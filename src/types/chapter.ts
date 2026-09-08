export interface ChapterTab {
  id: string;
  filename: string;
  title: string;
  snbtData: any;
  quests: any[];
  images: any[];
  history: { quests: any[]; images: any[]; snbtData: any }[];
  historyIndex: number;
  selection: {
    type: 'quest' | 'image' | 'mixed' | 'dependency' | null;
    ids: (string | number)[];
    items: { type: 'quest' | 'image'; id: string | number }[];
    dependency?: { sourceId: string; targetId: string } | null;
  };
  lockedKeys: string[];
  viewMode: 'map' | 'table';
  stagePos?: { x: number; y: number };
  stageScale?: number;
  isDirty?: boolean;
}
