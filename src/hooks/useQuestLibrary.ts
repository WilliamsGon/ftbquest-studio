import { useState } from 'react';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';

/** Guarda en localStorage sin romper la app si el navegador lo bloquea o está lleno. */
function persist(key: string, value: unknown, label: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${label}:`, e);
  }
}

/**
 * Biblioteca del libro de misiones que se conserva entre sesiones (localStorage):
 * reward tables, grupos de capítulos, ajustes del libro (data.snbt) y prefabs anclados.
 */
export function useQuestLibrary() {
  const [rewardTables, setRewardTables] = useState<RewardTable[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_reward_tables');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading reward tables from localStorage:', e);
    }
    return [
      {
        id: '2B1C94A7E0182C3D',
        title: 'Recompensas Básicas',
        icon: 'minecraft:chest',
        empty_weight: 0,
        loot_size: 1,
        order_index: 0,
        rewards: [
          { item: 'minecraft:iron_ingot', count: 4, weight: 10.0 },
          { item: 'minecraft:gold_ingot', count: 2, weight: 5.0 },
          { item: 'minecraft:diamond', count: 1, weight: 1.0 },
          { item: 'minecraft:bread', count: 8, weight: 15.0 },
        ],
        loot_crate: {
          string_id: 'basic_crate',
          color: 0x55ff55,
          glow: true,
        },
      }
    ];
  });
  const [chapterGroups, setChapterGroups] = useState<ChapterGroup[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_chapter_groups');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading chapter groups from localStorage:', e);
    }
    return [
      { id: '7E48F1A2D091B3C4', title: 'Tutorial / Inicio' },
      { id: '3A92F5C8E104D6B7', title: 'Tecnología' },
      { id: '1B83D4E7F209A5C6', title: 'Magia y Dimensiones' },
    ];
  });
  const [questBookData, setQuestBookData] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('ftb_quest_book_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading quest book data from localStorage:', e);
    }
    return null;
  });
  const [pinnedAssets, setPinnedAssets] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_quest_pinned_assets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const savePinnedAssets = (assets: any[]) => {
    setPinnedAssets(assets);
    persist('ftb_quest_pinned_assets', assets, 'pinned assets');
  };

  const handleUpdateRewardTables = (newTables: RewardTable[]) => {
    setRewardTables(newTables);
    persist('ftb_reward_tables', newTables, 'reward tables');
  };

  const handleUpdateQuestBook = (newData: any) => {
    setQuestBookData(newData);
    persist('ftb_quest_book_data', newData, 'quest book data');
  };

  const handleUpdateChapterGroups = (newGroups: ChapterGroup[]) => {
    setChapterGroups(newGroups);
    persist('ftb_chapter_groups', newGroups, 'chapter groups');
  };

  return {
    rewardTables, setRewardTables, handleUpdateRewardTables,
    chapterGroups, setChapterGroups, handleUpdateChapterGroups,
    questBookData, setQuestBookData, handleUpdateQuestBook,
    pinnedAssets, setPinnedAssets, savePinnedAssets,
  };
}
