export interface ChapterAnalyticsItem {
  id: string;
  title: string;
  filename: string;
  questCount: number;
  percentage: number;
  groupId: string | null;
  groupTitle: string;
}

export interface GroupAnalyticsItem {
  groupId: string;
  groupTitle: string;
  chapterCount: number;
  questCount: number;
  percentage: number;
}

export interface EconomyAnalytics {
  totalDirectXp: number;
  totalXpLevels: number;
  totalLootCratesRewards: number;
  totalRewardTables: number;
  rewardTablesWithCrates: number;
  itemTasksCount: number;
  killTasksCount: number;
  itemToKillRatio: number;
  otherTasksCount: number;
  totalTasks: number;
  tasksBreakdown: Record<string, number>;
  rewardsBreakdown: Record<string, number>;
}

export interface BottleneckQuest {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  directDependentsCount: number;
  transitiveDependentsCount: number;
  x: number;
  y: number;
  icon?: any;
}

export interface OrphanQuest {
  id: string;
  title: string;
  chapterId: string;
  chapterTitle: string;
  x: number;
  y: number;
  icon?: any;
}

export interface ModpackAnalyticsReport {
  totalChapters: number;
  emptyChaptersCount: number;
  totalQuests: number;
  chapterDistribution: ChapterAnalyticsItem[];
  groupDistribution: GroupAnalyticsItem[];
  economy: EconomyAnalytics;
  bottlenecks: BottleneckQuest[];
  orphans: OrphanQuest[];
  totalRewardTables: number;
  totalChapterGroups: number;
}
