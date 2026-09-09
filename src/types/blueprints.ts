export type BlueprintCategory = 'progression' | 'combat' | 'starter' | 'technology' | 'custom';

export interface Blueprint {
  id: string;
  title: string;
  description: string;
  category: BlueprintCategory;
  icon: string;
  isCustom?: boolean;
  quests: any[];
}
