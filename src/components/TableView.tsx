import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Trash2, Tag, Gift, Clipboard, Download, 
  Sparkles, ArrowUpDown, ArrowUp, ArrowDown, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckSquare, X
} from 'lucide-react';
import { TableBatchModal, type QuestBatchConfig, type TaskBatchConfig, type RewardBatchConfig } from './TableBatchModal';

interface TableViewProps {
  quests: any[];
  images: any[];
  updateQuest: (idOrUpdatesList: any, updates?: any) => void;
  updateImage: (indexOrUpdatesList: any, updates?: any) => void;
  onOpenNbtEditor?: (title: string, value: any, onSave: (val: any) => void) => void;
}

const defaultColumnWidths: { [key: string]: number } = {
  // Quests
  'quests-select': 44,
  'quests-id': 180,
  'quests-title': 220,
  'quests-icon': 200,
  'quests-x': 80,
  'quests-y': 80,
  'quests-size': 90,
  'quests-shape': 120,
  'quests-hide_deps': 130,
  'quests-actions': 80,

  // Tasks
  'tasks-select': 44,
  'tasks-parent': 180,
  'tasks-id': 170,
  'tasks-type': 120,
  'tasks-item': 260,
  'tasks-count': 110,
  'tasks-consume': 140,
  'tasks-actions': 80,

  // Rewards
  'rewards-select': 44,
  'rewards-parent': 180,
  'rewards-id': 170,
  'rewards-type': 130,
  'rewards-item': 260,
  'rewards-count': 110,
  'rewards-bonus': 120,
  'rewards-auto': 140,
  'rewards-team': 140,
  'rewards-op': 140,
  'rewards-ignore_block': 140,
  'rewards-claim_all': 140,
  'rewards-silent': 140,
  'rewards-only_one': 140,
  'rewards-title': 160,
  'rewards-icon': 160,
  'rewards-actions': 80
};

export const TableView: React.FC<TableViewProps> = ({ quests, updateQuest, onOpenNbtEditor }) => {
  const [subTab, setSubTab] = useState<'quests' | 'tasks' | 'rewards'>('quests');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Masivo
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Selección Múltiple
  const [selectedQuestIds, setSelectedQuestIds] = useState<Set<string>>(new Set());
  const [selectedTaskKeys, setSelectedTaskKeys] = useState<Set<string>>(new Set());
  const [selectedRewardKeys, setSelectedRewardKeys] = useState<Set<string>>(new Set());

  // Ordenamiento
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Paginación
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Resetear página al cambiar pestaña, filtro o tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, filterQuery, pageSize]);

  // Ancho de columnas redimensionables
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('ftb_table_col_widths');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [resizingCol, setResizingCol] = useState<string | null>(null);

  const getColWidth = (colKey: string) => {
    return columnWidths[colKey] || defaultColumnWidths[colKey] || undefined;
  };

  const handleResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const currentWidth = columnWidths[colKey] || defaultColumnWidths[colKey] || 150;
    setResizingCol(colKey);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(40, currentWidth + deltaX);
      setColumnWidths(prev => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem('ftb_table_col_widths', JSON.stringify(next));
        } catch (err) {}
        return next;
      });
    };

    const onMouseUp = () => {
      setResizingCol(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResetWidth = (colKey: string) => {
    setColumnWidths(prev => {
      const next = { ...prev };
      delete next[colKey];
      try {
        localStorage.setItem('ftb_table_col_widths', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  // Helper para alternar sort
  const handleSort = (fieldKey: string) => {
    if (sortCol === fieldKey) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(fieldKey);
      setSortDir('asc');
    }
  };

  const renderHeader = (
    colKey: string, 
    children: React.ReactNode, 
    sortField?: string,
    style?: React.CSSProperties
  ) => {
    const w = getColWidth(colKey);
    const isSorted = sortField && sortCol === sortField;
    return (
      <th 
        style={{ 
          width: w ? `${w}px` : undefined, 
          minWidth: w ? `${w}px` : undefined,
          position: 'relative',
          cursor: sortField ? 'pointer' : 'default',
          userSelect: 'none',
          ...style 
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.column-resize-handle') || target.tagName === 'SELECT' || target.tagName === 'INPUT') {
            return;
          }
          if (sortField) handleSort(sortField);
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span>{children}</span>
          {sortField && (
            <span style={{ display: 'inline-flex', opacity: isSorted ? 1 : 0.25 }}>
              {isSorted ? (
                sortDir === 'asc' ? <ArrowUp size={13} color="var(--accent-color)" /> : <ArrowDown size={13} color="var(--accent-color)" />
              ) : (
                <ArrowUpDown size={13} />
              )}
            </span>
          )}
        </div>
        <div 
          className={`column-resize-handle ${resizingCol === colKey ? 'active' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, colKey)}
          onDoubleClick={() => handleResetWidth(colKey)}
          title="Arrastrar para cambiar ancho / Doble clic para restablecer"
        />
      </th>
    );
  };

  const getDValue = (val: any) => {
    return typeof val === 'object' && val !== null ? val.value : val;
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // --- 1. APLANAR DATOS DE TAREAS ---
  const tasksList = useMemo(() => {
    const list: { questId: string; questTitle: string; taskIndex: number; taskObj: any }[] = [];
    quests.forEach(q => {
      const tasksArray = Array.isArray(q.tasks) 
        ? q.tasks 
        : (q.tasks ? [q.tasks] : []);
      tasksArray.forEach((t: any, tIdx: number) => {
        list.push({
          questId: q.id,
          questTitle: q.title || q.id,
          taskIndex: tIdx,
          taskObj: t
        });
      });
    });
    return list;
  }, [quests]);

  // --- 2. APLANAR DATOS DE RECOMPENSAS ---
  const rewardsList = useMemo(() => {
    const list: { questId: string; questTitle: string; rewardIndex: number; rewardObj: any }[] = [];
    quests.forEach(q => {
      const rewardsArray = Array.isArray(q.rewards) 
        ? q.rewards 
        : (q.rewards ? [q.rewards] : []);
      rewardsArray.forEach((r: any, rIdx: number) => {
        list.push({
          questId: q.id,
          questTitle: q.title || q.id,
          rewardIndex: rIdx,
          rewardObj: r
        });
      });
    });
    return list;
  }, [quests]);

  // --- 3. FILTRADO EN TIEMPO REAL ---
  const filteredQuests = useMemo(() => {
    if (subTab !== 'quests') return [];
    const query = filterQuery.toLowerCase().trim();
    if (!query) return quests;
    return quests.filter(q => 
      q.id.toLowerCase().includes(query) || 
      (q.title || '').toLowerCase().includes(query)
    );
  }, [quests, subTab, filterQuery]);

  const filteredTasks = useMemo(() => {
    if (subTab !== 'tasks') return [];
    const query = filterQuery.toLowerCase().trim();
    if (!query) return tasksList;
    return tasksList.filter(t => 
      t.questTitle.toLowerCase().includes(query) ||
      (t.taskObj.id || '').toLowerCase().includes(query) ||
      (t.taskObj.type || '').toLowerCase().includes(query) ||
      (t.taskObj.type === 'kill'
        ? (getDValue(t.taskObj.entity) || getDValue(t.taskObj.monster) || '')
        : (typeof t.taskObj.item === 'string' ? t.taskObj.item : t.taskObj.item?.id || '')
      ).toLowerCase().includes(query)
    );
  }, [tasksList, subTab, filterQuery]);

  const filteredRewards = useMemo(() => {
    if (subTab !== 'rewards') return [];
    const query = filterQuery.toLowerCase().trim();
    if (!query) return rewardsList;
    return rewardsList.filter(r => 
      r.questTitle.toLowerCase().includes(query) ||
      (r.rewardObj.id || '').toLowerCase().includes(query) ||
      (r.rewardObj.type || '').toLowerCase().includes(query) ||
      (typeof r.rewardObj.item === 'string' ? r.rewardObj.item : r.rewardObj.item?.id || '').toLowerCase().includes(query) ||
      (r.rewardObj.command || '').toLowerCase().includes(query)
    );
  }, [rewardsList, subTab, filterQuery]);

  // --- 4. ORDENAMIENTO ---
  const sortedQuests = useMemo(() => {
    if (!sortCol) return filteredQuests;
    return [...filteredQuests].sort((a, b) => {
      let aVal: any = a[sortCol];
      let bVal: any = b[sortCol];
      if (sortCol === 'x' || sortCol === 'y' || sortCol === 'size') {
        aVal = getDValue(aVal) ?? 0;
        bVal = getDValue(bVal) ?? 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredQuests, sortCol, sortDir]);

  const sortedTasks = useMemo(() => {
    if (!sortCol) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';
      if (sortCol === 'questTitle') {
        aVal = a.questTitle;
        bVal = b.questTitle;
      } else if (sortCol === 'id') {
        aVal = a.taskObj.id || '';
        bVal = b.taskObj.id || '';
      } else if (sortCol === 'type') {
        aVal = a.taskObj.type || '';
        bVal = b.taskObj.type || '';
      } else if (sortCol === 'item') {
        aVal = a.taskObj.type === 'kill' 
          ? (getDValue(a.taskObj.entity) || getDValue(a.taskObj.monster) || '') 
          : (typeof a.taskObj.item === 'string' ? a.taskObj.item : a.taskObj.item?.id || '');
        bVal = b.taskObj.type === 'kill' 
          ? (getDValue(b.taskObj.entity) || getDValue(b.taskObj.monster) || '') 
          : (typeof b.taskObj.item === 'string' ? b.taskObj.item : b.taskObj.item?.id || '');
      } else if (sortCol === 'count') {
        const aCount = a.taskObj.type === 'kill'
          ? (getDValue(a.taskObj.value) ?? 1)
          : (a.taskObj.count !== undefined ? getDValue(a.taskObj.count) : (a.taskObj.item?.Count || 1));
        const bCount = b.taskObj.type === 'kill'
          ? (getDValue(b.taskObj.value) ?? 1)
          : (b.taskObj.count !== undefined ? getDValue(b.taskObj.count) : (b.taskObj.item?.Count || 1));
        return sortDir === 'asc' ? aCount - bCount : bCount - aCount;
      } else if (sortCol === 'consume') {
        aVal = a.taskObj.consume_items ? 1 : 0;
        bVal = b.taskObj.consume_items ? 1 : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc' ? (aVal || '').toString().localeCompare((bVal || '').toString()) : (bVal || '').toString().localeCompare((aVal || '').toString());
    });
  }, [filteredTasks, sortCol, sortDir]);

  const sortedRewards = useMemo(() => {
    if (!sortCol) return filteredRewards;
    return [...filteredRewards].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';
      if (sortCol === 'questTitle') {
        aVal = a.questTitle;
        bVal = b.questTitle;
      } else if (sortCol === 'id') {
        aVal = a.rewardObj.id || '';
        bVal = b.rewardObj.id || '';
      } else if (sortCol === 'type') {
        aVal = a.rewardObj.type || '';
        bVal = b.rewardObj.type || '';
      } else if (sortCol === 'item') {
        aVal = a.rewardObj.type === 'command' 
          ? (getDValue(a.rewardObj.command) || '') 
          : (typeof a.rewardObj.item === 'string' ? a.rewardObj.item : a.rewardObj.item?.id || '');
        bVal = b.rewardObj.type === 'command' 
          ? (getDValue(b.rewardObj.command) || '') 
          : (typeof b.rewardObj.item === 'string' ? b.rewardObj.item : b.rewardObj.item?.id || '');
      } else if (sortCol === 'count') {
        const aCount = a.rewardObj.count !== undefined ? getDValue(a.rewardObj.count) : (a.rewardObj.item?.Count || 1);
        const bCount = b.rewardObj.count !== undefined ? getDValue(b.rewardObj.count) : (b.rewardObj.item?.Count || 1);
        return sortDir === 'asc' ? aCount - bCount : bCount - aCount;
      } else if (sortCol === 'team') {
        aVal = a.rewardObj.team_reward ? 1 : 0;
        bVal = b.rewardObj.team_reward ? 1 : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc' ? (aVal || '').toString().localeCompare((bVal || '').toString()) : (bVal || '').toString().localeCompare((aVal || '').toString());
    });
  }, [filteredRewards, sortCol, sortDir]);

  // --- 5. PAGINACIÓN ---
  const currentTotal = subTab === 'quests' 
    ? filteredQuests.length 
    : subTab === 'tasks' 
      ? filteredTasks.length 
      : filteredRewards.length;

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(currentTotal / pageSize));

  const paginatedQuests = useMemo(() => {
    if (pageSize === 'all') return sortedQuests;
    const start = (currentPage - 1) * pageSize;
    return sortedQuests.slice(start, start + pageSize);
  }, [sortedQuests, currentPage, pageSize]);

  const paginatedTasks = useMemo(() => {
    if (pageSize === 'all') return sortedTasks;
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  const paginatedRewards = useMemo(() => {
    if (pageSize === 'all') return sortedRewards;
    const start = (currentPage - 1) * pageSize;
    return sortedRewards.slice(start, start + pageSize);
  }, [sortedRewards, currentPage, pageSize]);

  // --- 6. SELECCIÓN ---
  const toggleQuestSelect = (id: string) => {
    setSelectedQuestIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTaskSelect = (key: string) => {
    setSelectedTaskKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRewardSelect = (key: string) => {
    setSelectedRewardKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isAllQuestsVisibleSelected = paginatedQuests.length > 0 && paginatedQuests.every(q => selectedQuestIds.has(q.id));
  const isSomeQuestsVisibleSelected = paginatedQuests.some(q => selectedQuestIds.has(q.id)) && !isAllQuestsVisibleSelected;

  const toggleAllQuestsVisible = () => {
    if (isAllQuestsVisibleSelected) {
      setSelectedQuestIds(prev => {
        const next = new Set(prev);
        paginatedQuests.forEach(q => next.delete(q.id));
        return next;
      });
    } else {
      setSelectedQuestIds(prev => {
        const next = new Set(prev);
        paginatedQuests.forEach(q => next.add(q.id));
        return next;
      });
    }
  };

  const isAllTasksVisibleSelected = paginatedTasks.length > 0 && paginatedTasks.every(t => selectedTaskKeys.has(`${t.questId}:${t.taskIndex}`));
  const isSomeTasksVisibleSelected = paginatedTasks.some(t => selectedTaskKeys.has(`${t.questId}:${t.taskIndex}`)) && !isAllTasksVisibleSelected;

  const toggleAllTasksVisible = () => {
    if (isAllTasksVisibleSelected) {
      setSelectedTaskKeys(prev => {
        const next = new Set(prev);
        paginatedTasks.forEach(t => next.delete(`${t.questId}:${t.taskIndex}`));
        return next;
      });
    } else {
      setSelectedTaskKeys(prev => {
        const next = new Set(prev);
        paginatedTasks.forEach(t => next.add(`${t.questId}:${t.taskIndex}`));
        return next;
      });
    }
  };

  const isAllRewardsVisibleSelected = paginatedRewards.length > 0 && paginatedRewards.every(r => selectedRewardKeys.has(`${r.questId}:${r.rewardIndex}`));
  const isSomeRewardsVisibleSelected = paginatedRewards.some(r => selectedRewardKeys.has(`${r.questId}:${r.rewardIndex}`)) && !isAllRewardsVisibleSelected;

  const toggleAllRewardsVisible = () => {
    if (isAllRewardsVisibleSelected) {
      setSelectedRewardKeys(prev => {
        const next = new Set(prev);
        paginatedRewards.forEach(r => next.delete(`${r.questId}:${r.rewardIndex}`));
        return next;
      });
    } else {
      setSelectedRewardKeys(prev => {
        const next = new Set(prev);
        paginatedRewards.forEach(r => next.add(`${r.questId}:${r.rewardIndex}`));
        return next;
      });
    }
  };

  const currentSelectedCount = subTab === 'quests' 
    ? selectedQuestIds.size 
    : subTab === 'tasks' 
      ? selectedTaskKeys.size 
      : selectedRewardKeys.size;

  const handleClearSelection = () => {
    if (subTab === 'quests') setSelectedQuestIds(new Set());
    else if (subTab === 'tasks') setSelectedTaskKeys(new Set());
    else setSelectedRewardKeys(new Set());
  };

  // --- 7. EDICIÓN DE TAREAS Y RECOMPENSAS ---
  const handleUpdateTask = (questId: string, taskIndex: number, updates: any) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);
    tasksArray[taskIndex] = {
      ...tasksArray[taskIndex],
      ...updates
    };
    updateQuest(questId, { tasks: tasksArray });
  };

  const handleUpdateReward = (questId: string, rewardIndex: number, updates: any) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
    rewardsArray[rewardIndex] = {
      ...rewardsArray[rewardIndex],
      ...updates
    };
    updateQuest(questId, { rewards: rewardsArray });
  };

  // --- 8. ACCIONES DE BORRADO INDIVIDUAL ---
  const handleDeleteQuest = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta misión?')) {
      const nextQuests = quests.filter(q => q.id !== id);
      updateQuest(nextQuests, undefined);
      setSelectedQuestIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteTask = (questId: string, taskIndex: number) => {
    if (window.confirm('¿Deseas quitar esta tarea?')) {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);
      tasksArray.splice(taskIndex, 1);
      updateQuest(questId, { tasks: tasksArray });
      setSelectedTaskKeys(prev => {
        const next = new Set(prev);
        next.delete(`${questId}:${taskIndex}`);
        return next;
      });
    }
  };

  const handleDeleteReward = (questId: string, rewardIndex: number) => {
    if (window.confirm('¿Deseas quitar esta recompensa?')) {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
      rewardsArray.splice(rewardIndex, 1);
      updateQuest(questId, { rewards: rewardsArray });
      setSelectedRewardKeys(prev => {
        const next = new Set(prev);
        next.delete(`${questId}:${rewardIndex}`);
        return next;
      });
    }
  };

  const handleUpdateRewardProperty = (questId: string, rewardIndex: number, propName: string, val: any) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
    const updatedReward = { ...rewardsArray[rewardIndex] };
    if (val === 'default' || val === undefined || (typeof val === 'string' && val.trim() === '')) {
      delete updatedReward[propName];
    } else {
      updatedReward[propName] = val;
    }
    rewardsArray[rewardIndex] = updatedReward;
    updateQuest(questId, { rewards: rewardsArray });
  };

  const handleRewardsBulkUpdate = (propName: string, val: any) => {
    const rewardsByQuest: { [questId: string]: number[] } = {};
    filteredRewards.forEach(r => {
      if (!rewardsByQuest[r.questId]) {
        rewardsByQuest[r.questId] = [];
      }
      rewardsByQuest[r.questId].push(r.rewardIndex);
    });

    const updatesList = Object.keys(rewardsByQuest).map(qId => {
      const quest = quests.find(q => q.id === qId);
      if (!quest) return null;
      const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
      
      rewardsByQuest[qId].forEach(idx => {
        const reward = { ...rewardsArray[idx] };
        if (val === 'default' || val === undefined || (typeof val === 'string' && val.trim() === '')) {
          delete reward[propName];
        } else {
          reward[propName] = val;
        }
        rewardsArray[idx] = reward;
      });

      return {
        id: qId,
        updates: { rewards: rewardsArray }
      };
    }).filter(item => item !== null) as { id: string; updates: any }[];

    if (updatesList.length > 0) {
      updateQuest(updatesList);
    }
  };

  const handleQuestsBulkToggle = (val: string) => {
    const nextVal = val === 'default' ? undefined : (val === 'true');
    const updatesList = filteredQuests.map(q => ({
      id: q.id,
      updates: { hide_until_deps_complete: nextVal }
    }));
    if (updatesList.length > 0) {
      updateQuest(updatesList);
    }
  };

  const isTasksAllChecked = useMemo(() => {
    return filteredTasks.length > 0 && filteredTasks.every(t => t.taskObj.consume_items);
  }, [filteredTasks]);

  const handleTasksBulkToggle = (checked: boolean) => {
    const tasksByQuest: { [questId: string]: number[] } = {};
    filteredTasks.forEach(t => {
      if (!tasksByQuest[t.questId]) {
        tasksByQuest[t.questId] = [];
      }
      tasksByQuest[t.questId].push(t.taskIndex);
    });

    const updatesList = Object.keys(tasksByQuest).map(qId => {
      const quest = quests.find(q => q.id === qId);
      if (!quest) return null;
      const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);
      tasksByQuest[qId].forEach(idx => {
        tasksArray[idx] = {
          ...tasksArray[idx],
          consume_items: checked
        };
      });
      return {
        id: qId,
        updates: { tasks: tasksArray }
      };
    }).filter(item => item !== null) as { id: string; updates: any }[];

    if (updatesList.length > 0) {
      updateQuest(updatesList);
    }
  };

  // --- 9. ACCIONES MASIVAS VIA MODAL (BATCH MODAL) ---
  const handleApplyQuestBatch = (config: QuestBatchConfig, scope: 'selected' | 'all_filtered') => {
    const targetQuests = scope === 'selected'
      ? quests.filter(q => selectedQuestIds.has(q.id))
      : filteredQuests;

    if (targetQuests.length === 0) return;

    const updatesList = targetQuests.map(q => {
      const updates: any = {};
      if (config.shape !== undefined) {
        updates.shape = config.shape === '' ? undefined : config.shape;
      }
      if (config.size !== undefined) {
        updates.size = { __type: 'number', value: config.size, suffix: 'd' };
      }
      if (config.hide_dependency_lines !== undefined) {
        updates.hide_dependency_lines = config.hide_dependency_lines;
      }
      if (config.optional !== undefined) {
        updates.optional = config.optional;
      }
      if (config.invisible !== undefined) {
        updates.invisible = config.invisible;
      }
      if (config.hide_until_deps_complete !== undefined) {
        updates.hide_until_deps_complete = config.hide_until_deps_complete;
      }
      if (config.can_repeat !== undefined) {
        updates.can_repeat = config.can_repeat;
      }
      if (config.disable_toast !== undefined) {
        updates.disable_toast = config.disable_toast;
      }
      if (config.dependency_requirement !== undefined) {
        updates.dependency_requirement = config.dependency_requirement;
      }
      if (config.addTag && config.addTag.trim()) {
        const currentTags = Array.isArray(q.tags) ? [...q.tags] : (q.tags ? [q.tags] : []);
        const tagToAdd = config.addTag.trim();
        if (!currentTags.includes(tagToAdd)) {
          updates.tags = [...currentTags, tagToAdd];
        }
      }
      return { id: q.id, updates };
    });

    updateQuest(updatesList);
    setIsBatchModalOpen(false);
  };

  const handleApplyTaskBatch = (config: TaskBatchConfig, scope: 'selected' | 'all_filtered') => {
    const targetTasks = scope === 'selected'
      ? tasksList.filter(t => selectedTaskKeys.has(`${t.questId}:${t.taskIndex}`))
      : filteredTasks;

    if (targetTasks.length === 0) return;

    const tasksByQuest: { [questId: string]: { taskIndex: number; taskObj: any }[] } = {};
    targetTasks.forEach(t => {
      if (!tasksByQuest[t.questId]) tasksByQuest[t.questId] = [];
      tasksByQuest[t.questId].push(t);
    });

    const updatesList = Object.keys(tasksByQuest).map(qId => {
      const quest = quests.find(q => q.id === qId);
      if (!quest) return null;
      const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);

      tasksByQuest[qId].forEach(t => {
        const idx = t.taskIndex;
        const task = { ...tasksArray[idx] };

        if (config.consume_items !== undefined) {
          task.consume_items = config.consume_items;
        }
        if (config.ignore_damage !== undefined) {
          task.ignore_damage = config.ignore_damage;
        }
        if (config.match_nbt !== undefined) {
          task.match_nbt = config.match_nbt;
        }
        if (config.countMode && config.countValue !== undefined) {
          const isKill = task.type === 'kill';
          const currentCount = isKill 
            ? (getDValue(task.value) ?? 1)
            : (task.count !== undefined 
                ? getDValue(task.count) 
                : (typeof task.item === 'object' && task.item !== null ? (getDValue(task.item.Count) ?? getDValue(task.item.count) ?? 1) : 1));

          let nextCount = currentCount;
          if (config.countMode === 'set') nextCount = Math.max(1, Math.round(config.countValue));
          else if (config.countMode === 'multiply') nextCount = Math.max(1, Math.round(currentCount * config.countValue));
          else if (config.countMode === 'add') nextCount = Math.max(1, Math.round(currentCount + config.countValue));

          if (isKill) {
            if (typeof task.value === 'object' && task.value !== null) task.value = { ...task.value, value: nextCount };
            else task.value = nextCount;
          } else if (typeof task.item === 'object' && task.item !== null && (task.item.Count !== undefined || task.item.count !== undefined)) {
            const isCapital = task.item.Count !== undefined;
            const k = isCapital ? 'Count' : 'count';
            const currObj = task.item[k];
            task.item = {
              ...task.item,
              [k]: typeof currObj === 'object' && currObj !== null ? { ...currObj, value: nextCount } : nextCount
            };
          } else {
            if (typeof task.count === 'object' && task.count !== null) task.count = { ...task.count, value: nextCount };
            else task.count = nextCount;
          }
        }

        tasksArray[idx] = task;
      });

      return { id: qId, updates: { tasks: tasksArray } };
    }).filter(Boolean) as { id: string; updates: any }[];

    if (updatesList.length > 0) updateQuest(updatesList);
    setIsBatchModalOpen(false);
  };

  const handleApplyRewardBatch = (config: RewardBatchConfig, scope: 'selected' | 'all_filtered') => {
    const targetRewards = scope === 'selected'
      ? rewardsList.filter(r => selectedRewardKeys.has(`${r.questId}:${r.rewardIndex}`))
      : filteredRewards;

    if (targetRewards.length === 0) return;

    const rewardsByQuest: { [questId: string]: { rewardIndex: number; rewardObj: any }[] } = {};
    targetRewards.forEach(r => {
      if (!rewardsByQuest[r.questId]) rewardsByQuest[r.questId] = [];
      rewardsByQuest[r.questId].push(r);
    });

    const updatesList = Object.keys(rewardsByQuest).map(qId => {
      const quest = quests.find(q => q.id === qId);
      if (!quest) return null;
      const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);

      rewardsByQuest[qId].forEach(r => {
        const idx = r.rewardIndex;
        const reward = { ...rewardsArray[idx] };

        if (config.team_reward !== undefined) reward.team_reward = config.team_reward;
        if (config.auto !== undefined) {
          if (config.auto === 'default') delete reward.auto;
          else reward.auto = config.auto;
        }
        if (config.exclude_from_claim_all !== undefined) reward.exclude_from_claim_all = config.exclude_from_claim_all;
        if (config.only_one !== undefined) reward.only_one = config.only_one;

        if (config.countMode && config.countValue !== undefined) {
          if (reward.type === 'xp') {
            const currentVal = getDValue(reward.xp) ?? 0;
            let nextVal = currentVal;
            if (config.countMode === 'set') nextVal = Math.max(0, Math.round(config.countValue));
            else if (config.countMode === 'multiply') nextVal = Math.max(0, Math.round(currentVal * config.countValue));
            else if (config.countMode === 'add') nextVal = Math.max(0, Math.round(currentVal + config.countValue));
            if (typeof reward.xp === 'object' && reward.xp !== null) reward.xp = { ...reward.xp, value: nextVal };
            else reward.xp = nextVal;
          } else if (reward.type === 'xp_levels') {
            const currentVal = getDValue(reward.xp_levels) ?? 0;
            let nextVal = currentVal;
            if (config.countMode === 'set') nextVal = Math.max(0, Math.round(config.countValue));
            else if (config.countMode === 'multiply') nextVal = Math.max(0, Math.round(currentVal * config.countValue));
            else if (config.countMode === 'add') nextVal = Math.max(0, Math.round(currentVal + config.countValue));
            if (typeof reward.xp_levels === 'object' && reward.xp_levels !== null) reward.xp_levels = { ...reward.xp_levels, value: nextVal };
            else reward.xp_levels = nextVal;
          } else if (reward.type === 'item') {
            const currentVal = reward.count !== undefined 
              ? getDValue(reward.count) 
              : (typeof reward.item === 'object' && reward.item !== null ? (getDValue(reward.item.Count) ?? getDValue(reward.item.count) ?? 1) : 1);
            let nextVal = currentVal;
            if (config.countMode === 'set') nextVal = Math.max(1, Math.round(config.countValue));
            else if (config.countMode === 'multiply') nextVal = Math.max(1, Math.round(currentVal * config.countValue));
            else if (config.countMode === 'add') nextVal = Math.max(1, Math.round(currentVal + config.countValue));

            if (typeof reward.item === 'object' && reward.item !== null && (reward.item.Count !== undefined || reward.item.count !== undefined)) {
              const isCapital = reward.item.Count !== undefined;
              const k = isCapital ? 'Count' : 'count';
              const currObj = reward.item[k];
              reward.item = {
                ...reward.item,
                [k]: typeof currObj === 'object' && currObj !== null ? { ...currObj, value: nextVal } : nextVal
              };
            } else {
              if (typeof reward.count === 'object' && reward.count !== null) reward.count = { ...reward.count, value: nextVal };
              else reward.count = nextVal;
            }
          }
        }

        rewardsArray[idx] = reward;
      });

      return { id: qId, updates: { rewards: rewardsArray } };
    }).filter(Boolean) as { id: string; updates: any }[];

    if (updatesList.length > 0) updateQuest(updatesList);
    setIsBatchModalOpen(false);
  };

  // --- 10. ELIMINACIÓN MASIVA DE SELECCIONADOS ---
  const handleBatchDelete = () => {
    if (subTab === 'quests') {
      if (selectedQuestIds.size === 0) return;
      if (window.confirm(`¿Seguro que deseas eliminar las ${selectedQuestIds.size} misiones seleccionadas?`)) {
        const nextQuests = quests.filter(q => !selectedQuestIds.has(q.id));
        updateQuest(nextQuests, undefined);
        setSelectedQuestIds(new Set());
      }
    } else if (subTab === 'tasks') {
      if (selectedTaskKeys.size === 0) return;
      if (window.confirm(`¿Seguro que deseas quitar las ${selectedTaskKeys.size} tareas seleccionadas?`)) {
        const tasksByQuest: { [questId: string]: number[] } = {};
        selectedTaskKeys.forEach(key => {
          const [qId, idxStr] = key.split(':');
          if (!tasksByQuest[qId]) tasksByQuest[qId] = [];
          tasksByQuest[qId].push(parseInt(idxStr, 10));
        });

        const updatesList = Object.keys(tasksByQuest).map(qId => {
          const quest = quests.find(q => q.id === qId);
          if (!quest) return null;
          const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);
          const indices = tasksByQuest[qId].sort((a, b) => b - a);
          indices.forEach(idx => {
            tasksArray.splice(idx, 1);
          });
          return { id: qId, updates: { tasks: tasksArray } };
        }).filter(Boolean) as { id: string; updates: any }[];

        if (updatesList.length > 0) updateQuest(updatesList);
        setSelectedTaskKeys(new Set());
      }
    } else if (subTab === 'rewards') {
      if (selectedRewardKeys.size === 0) return;
      if (window.confirm(`¿Seguro que deseas quitar las ${selectedRewardKeys.size} recompensas seleccionadas?`)) {
        const rewardsByQuest: { [questId: string]: number[] } = {};
        selectedRewardKeys.forEach(key => {
          const [qId, idxStr] = key.split(':');
          if (!rewardsByQuest[qId]) rewardsByQuest[qId] = [];
          rewardsByQuest[qId].push(parseInt(idxStr, 10));
        });

        const updatesList = Object.keys(rewardsByQuest).map(qId => {
          const quest = quests.find(q => q.id === qId);
          if (!quest) return null;
          const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
          const indices = rewardsByQuest[qId].sort((a, b) => b - a);
          indices.forEach(idx => {
            rewardsArray.splice(idx, 1);
          });
          return { id: qId, updates: { rewards: rewardsArray } };
        }).filter(Boolean) as { id: string; updates: any }[];

        if (updatesList.length > 0) updateQuest(updatesList);
        setSelectedRewardKeys(new Set());
      }
    }
  };

  // --- 11. EXPORTACIÓN A CSV ---
  const handleExportCsv = () => {
    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = 'ftb_misiones.csv';

    if (subTab === 'quests') {
      filename = 'misiones.csv';
      headers = ['ID', 'Título', 'Icono', 'X', 'Y', 'Tamaño', 'Forma', 'Ocultar Deps'];
      rows = filteredQuests.map(q => [
        q.id,
        q.title || '',
        q.icon || '',
        String(getDValue(q.x) ?? 0),
        String(getDValue(q.y) ?? 0),
        String(getDValue(q.size) ?? 1.0),
        q.shape || 'circle',
        q.hide_until_deps_complete ? 'true' : 'false'
      ]);
    } else if (subTab === 'tasks') {
      filename = 'tareas.csv';
      headers = ['Misión ID', 'Misión Título', 'ID Tarea', 'Tipo', 'Ítem / Entidad', 'Cantidad', 'Consumir Ítems'];
      rows = filteredTasks.map(t => {
        const isKill = t.taskObj.type === 'kill';
        const itemVal = isKill 
          ? (getDValue(t.taskObj.entity) || getDValue(t.taskObj.monster) || '')
          : (typeof t.taskObj.item === 'string' ? t.taskObj.item : (t.taskObj.item?.id || ''));
        const countVal = isKill 
          ? (getDValue(t.taskObj.value) ?? 1)
          : (t.taskObj.count !== undefined 
              ? getDValue(t.taskObj.count) 
              : (typeof t.taskObj.item === 'object' && t.taskObj.item !== null ? (getDValue(t.taskObj.item.Count) ?? 1) : 1));
        return [
          t.questId,
          t.questTitle,
          t.taskObj.id || '',
          t.taskObj.type || 'item',
          itemVal,
          String(countVal),
          t.taskObj.consume_items ? 'true' : 'false'
        ];
      });
    } else if (subTab === 'rewards') {
      filename = 'recompensas.csv';
      headers = ['Misión ID', 'Misión Título', 'ID Recompensa', 'Tipo', 'Ítem / Comando / Tabla', 'Cantidad', 'Bono Aleatorio', 'Auto Claim', 'Por Equipo'];
      rows = filteredRewards.map(r => {
        const itemVal = r.rewardObj.type === 'command'
          ? (getDValue(r.rewardObj.command) || '')
          : (typeof r.rewardObj.item === 'string'
              ? r.rewardObj.item
              : (getDValue(r.rewardObj.item?.id) || r.rewardObj.table_id || ''));
        const countVal = r.rewardObj.count !== undefined 
          ? getDValue(r.rewardObj.count) 
          : (typeof r.rewardObj.item === 'object' && r.rewardObj.item !== null ? (getDValue(r.rewardObj.item.Count) ?? 1) : 1);
        return [
          r.questId,
          r.questTitle,
          r.rewardObj.id || '',
          r.rewardObj.type || 'xp',
          itemVal,
          String(countVal),
          String(r.rewardObj.random_bonus ?? ''),
          r.rewardObj.auto || 'default',
          r.rewardObj.team_reward ? 'true' : 'false'
        ];
      });
    }

    const csvContent = '\uFEFF' + [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="table-view-container">
      {/* Barra Superior: Pestañas, Búsqueda, Acciones Rápidas */}
      <div className="table-view-header">
        <div className="table-tabs">
          <button 
            className={`table-tab-btn ${subTab === 'quests' ? 'active' : ''}`}
            onClick={() => { setSubTab('quests'); setFilterQuery(''); }}
          >
            Misiones ({quests.length})
          </button>
          <button 
            className={`table-tab-btn ${subTab === 'tasks' ? 'active' : ''}`}
            onClick={() => { setSubTab('tasks'); setFilterQuery(''); }}
          >
            Tareas ({tasksList.length})
          </button>
          <button 
            className={`table-tab-btn ${subTab === 'rewards' ? 'active' : ''}`}
            onClick={() => { setSubTab('rewards'); setFilterQuery(''); }}
          >
            Recompensas ({rewardsList.length})
          </button>
        </div>

        <div className="table-header-actions">
          <div className="table-search-wrapper">
            <Search size={16} className="table-search-icon" />
            <input 
              type="text" 
              placeholder={`Buscar por ID, título ${subTab !== 'quests' ? 'o ítem' : ''}...`}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="table-search-input"
            />
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setIsBatchModalOpen(true)}
            title="Abrir panel de modificaciones masivas"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <Sparkles size={15} color="var(--accent-color)" />
            <span>Modificación Masiva</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={handleExportCsv}
            title="Descargar tabla actual en formato CSV para Excel"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla Principal */}
      <div className="table-wrapper">
        {subTab === 'quests' && (
          <table className="editor-table">
            <thead>
              <tr>
                {renderHeader('quests-select', (
                  <input 
                    type="checkbox"
                    className="table-checkbox"
                    checked={isAllQuestsVisibleSelected}
                    ref={el => { if (el) el.indeterminate = isSomeQuestsVisibleSelected; }}
                    onChange={toggleAllQuestsVisible}
                    title="Seleccionar/Deseleccionar misiones visibles en esta página"
                  />
                ), undefined, { textAlign: 'center' })}
                {renderHeader('quests-id', 'ID', 'id')}
                {renderHeader('quests-title', 'Título', 'title')}
                {renderHeader('quests-icon', 'Icono')}
                {renderHeader('quests-x', 'X', 'x')}
                {renderHeader('quests-y', 'Y', 'y')}
                {renderHeader('quests-size', 'Tamaño', 'size')}
                {renderHeader('quests-shape', 'Forma (Shape)', 'shape')}
                {renderHeader('quests-hide_deps', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Ocultar Deps</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleQuestsBulkToggle(val);
                        }
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (True)</option>
                      <option value="false">No (False)</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('quests-actions', 'Acciones', undefined, { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {paginatedQuests.map((q) => {
                const isSelected = selectedQuestIds.has(q.id);
                return (
                  <tr key={q.id} className={isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestSelect(q.id)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="table-cell-id">{q.id}</span>
                        <button 
                          className="btn-icon" 
                          style={{ padding: '2px' }} 
                          onClick={() => handleCopyId(q.id)}
                          title="Copiar ID"
                        >
                          {copiedId === q.id ? <span style={{ color: '#2ecc71', fontSize: '0.75rem' }}>Listo</span> : <Clipboard size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input"
                        value={q.title || ''}
                        onChange={(e) => updateQuest(q.id, { title: e.target.value })}
                        placeholder="Sin título"
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="table-input"
                          value={q.icon || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateQuest(q.id, { icon: val ? val : undefined });
                          }}
                          placeholder="Ej: minecraft:apple"
                        />
                        {q.icon && (
                          <button 
                            className="btn-icon" 
                            style={{ padding: '4px', color: 'var(--text-secondary)' }}
                            onClick={() => updateQuest(q.id, { icon: undefined })}
                            title="Quitar icono"
                          >
                            <span style={{ fontSize: '1rem', lineHeight: '1', fontWeight: 'bold' }}>×</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.5" 
                        className="table-input"
                        value={getDValue(q.x) ?? 0}
                        onChange={(e) => updateQuest(q.id, { x: { __type: 'number', value: parseFloat(e.target.value) || 0, suffix: 'd' } })}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.5" 
                        className="table-input"
                        value={getDValue(q.y) ?? 0}
                        onChange={(e) => updateQuest(q.id, { y: { __type: 'number', value: parseFloat(e.target.value) || 0, suffix: 'd' } })}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.5" 
                        className="table-input"
                        value={getDValue(q.size) ?? 1.0}
                        onChange={(e) => updateQuest(q.id, { size: { __type: 'number', value: parseFloat(e.target.value) || 1.0, suffix: 'd' } })}
                      />
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={q.shape || 'circle'}
                        onChange={(e) => updateQuest(q.id, { shape: e.target.value })}
                      >
                        <option value="circle">Circle</option>
                        <option value="gear">Gear</option>
                        <option value="octagon">Octagon</option>
                        <option value="rsquare">Rounded Square</option>
                        <option value="diamond">Diamond</option>
                        <option value="square">Square</option>
                        <option value="hexagon">Hexagon</option>
                        <option value="heart">Heart</option>
                        <option value="pentagon">Pentagon</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <select 
                        className="table-select"
                        value={q.hide_until_deps_complete === undefined ? 'default' : (q.hide_until_deps_complete ? 'true' : 'false')}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextVal = val === 'default' ? undefined : (val === 'true');
                          updateQuest(q.id, { hide_until_deps_complete: nextVal });
                        }}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (True)</option>
                        <option value="false">No (False)</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--danger-color)' }}
                        onClick={() => handleDeleteQuest(q.id)}
                        title="Eliminar misión"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredQuests.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron misiones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {subTab === 'tasks' && (
          <table className="editor-table">
            <thead>
              <tr>
                {renderHeader('tasks-select', (
                  <input 
                    type="checkbox"
                    className="table-checkbox"
                    checked={isAllTasksVisibleSelected}
                    ref={el => { if (el) el.indeterminate = isSomeTasksVisibleSelected; }}
                    onChange={toggleAllTasksVisible}
                    title="Seleccionar/Deseleccionar tareas visibles en esta página"
                  />
                ), undefined, { textAlign: 'center' })}
                {renderHeader('tasks-parent', 'Misión Padre', 'questTitle')}
                {renderHeader('tasks-id', 'ID Tarea', 'id')}
                {renderHeader('tasks-type', 'Tipo', 'type')}
                {renderHeader('tasks-item', 'Ítem / Target', 'item')}
                {renderHeader('tasks-count', 'Cantidad', 'count')}
                {renderHeader('tasks-consume', (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox" 
                      className="table-checkbox"
                      checked={isTasksAllChecked}
                      onChange={(e) => handleTasksBulkToggle(e.target.checked)}
                      title="Marcar / Desmarcar todos los visibles"
                    />
                    <span>Consumir Ítems</span>
                  </div>
                ), 'consume', { textAlign: 'center' })}
                {renderHeader('tasks-actions', 'Acciones', undefined, { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {paginatedTasks.map((t) => {
                const taskKey = `${t.questId}:${t.taskIndex}`;
                const isSelected = selectedTaskKeys.has(taskKey);
                const isKillType = t.taskObj.type === 'kill';
                const itemVal = isKillType 
                  ? (getDValue(t.taskObj.entity) || getDValue(t.taskObj.monster) || '')
                  : (typeof t.taskObj.item === 'string' ? t.taskObj.item : (t.taskObj.item?.id || ''));

                const quantityVal = isKillType 
                  ? (getDValue(t.taskObj.value) ?? 1)
                  : (
                      t.taskObj.count !== undefined 
                        ? getDValue(t.taskObj.count) 
                        : (typeof t.taskObj.item === 'object' && t.taskObj.item !== null
                            ? (getDValue(t.taskObj.item.Count) ?? getDValue(t.taskObj.item.count) ?? 1)
                            : 1)
                    );

                return (
                  <tr key={taskKey} className={isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => toggleTaskSelect(taskKey)}
                      />
                    </td>
                    <td>
                      <div className="parent-quest-badge">
                        <Tag size={12} />
                        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.questTitle}>
                          {t.questTitle}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="table-cell-id">{t.taskObj.id || 'N/A'}</span>
                        {t.taskObj.id && (
                          <button 
                            className="btn-icon" 
                            style={{ padding: '2px' }} 
                            onClick={() => handleCopyId(t.taskObj.id)}
                            title="Copiar ID"
                          >
                            {copiedId === t.taskObj.id ? <span style={{ color: '#2ecc71', fontSize: '0.75rem' }}>Listo</span> : <Clipboard size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={t.taskObj.type || 'item'}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const baseUpdates: any = { type: newType };
                          if (newType === 'kill') {
                            baseUpdates.entity = 'minecraft:zombie';
                            baseUpdates.value = 100;
                          } else if (newType === 'item') {
                            baseUpdates.item = 'minecraft:stone';
                            baseUpdates.count = 1;
                          }
                          handleUpdateTask(t.questId, t.taskIndex, baseUpdates);
                        }}
                      >
                        <option value="item">Item</option>
                        <option value="kill">Kill</option>
                        <option value="xp">XP</option>
                        <option value="checkmark">Checkmark</option>
                        <option value="fluid">Fluid</option>
                        <option value="custom">Custom</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="table-input"
                          value={itemVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isKillType) {
                              if (t.taskObj.entity !== undefined) {
                                if (typeof t.taskObj.entity === 'object' && t.taskObj.entity !== null) {
                                  handleUpdateTask(t.questId, t.taskIndex, { entity: { ...t.taskObj.entity, value: val } });
                                } else {
                                  handleUpdateTask(t.questId, t.taskIndex, { entity: val });
                                }
                              } else if (t.taskObj.monster !== undefined) {
                                if (typeof t.taskObj.monster === 'object' && t.taskObj.monster !== null) {
                                  handleUpdateTask(t.questId, t.taskIndex, { monster: { ...t.taskObj.monster, value: val } });
                                } else {
                                  handleUpdateTask(t.questId, t.taskIndex, { monster: val });
                                }
                              } else {
                                handleUpdateTask(t.questId, t.taskIndex, { entity: val });
                              }
                            } else if (typeof t.taskObj.item === 'object' && t.taskObj.item !== null) {
                              handleUpdateTask(t.questId, t.taskIndex, { item: { ...t.taskObj.item, id: val } });
                            } else {
                              handleUpdateTask(t.questId, t.taskIndex, { item: val });
                            }
                          }}
                          disabled={t.taskObj.type !== 'item' && !isKillType}
                          placeholder={isKillType ? 'ej. minecraft:chicken' : 'ej. minecraft:dirt'}
                          style={{ flexGrow: 1 }}
                        />
                        {t.taskObj.type === 'item' && onOpenNbtEditor && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => {
                              const currentItem = t.taskObj.item;
                              const itemToEdit = typeof currentItem === 'object' && currentItem !== null 
                                ? currentItem 
                                : { id: currentItem || 'minecraft:air', Count: 1 };
                              
                              onOpenNbtEditor(
                                `Editar NBT de Tarea (${t.taskObj.id || 'Sin ID'})`,
                                itemToEdit,
                                (updatedNbt) => {
                                  handleUpdateTask(t.questId, t.taskIndex, { item: updatedNbt });
                                }
                              );
                            }}
                            title="Editar NBT completo del ítem (JSON)"
                          >
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-color)' }}>NBT</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="table-input"
                        value={quantityVal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          if (isKillType) {
                            if (typeof t.taskObj.value === 'object' && t.taskObj.value !== null) {
                              handleUpdateTask(t.questId, t.taskIndex, { value: { ...t.taskObj.value, value: val } });
                            } else {
                              handleUpdateTask(t.questId, t.taskIndex, { value: val });
                            }
                          } else {
                            if (typeof t.taskObj.item === 'object' && t.taskObj.item !== null && (t.taskObj.item.Count !== undefined || t.taskObj.item.count !== undefined)) {
                              const isCapitalCount = t.taskObj.item.Count !== undefined;
                              const countKey = isCapitalCount ? 'Count' : 'count';
                              const currentCountObj = t.taskObj.item[countKey];
                              
                              const updatedItem = {
                                ...t.taskObj.item,
                                [countKey]: typeof currentCountObj === 'object' && currentCountObj !== null
                                  ? { ...currentCountObj, value: val }
                                  : val
                              };
                              handleUpdateTask(t.questId, t.taskIndex, { item: updatedItem });
                            } else {
                              if (typeof t.taskObj.count === 'object' && t.taskObj.count !== null) {
                                handleUpdateTask(t.questId, t.taskIndex, { count: { ...t.taskObj.count, value: val } });
                              } else {
                                handleUpdateTask(t.questId, t.taskIndex, { count: val });
                              }
                            }
                          }
                        }}
                        disabled={t.taskObj.type !== 'item' && !isKillType}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        className="table-checkbox"
                        checked={t.taskObj.consume_items || false}
                        onChange={(e) => handleUpdateTask(t.questId, t.taskIndex, { consume_items: e.target.checked })}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--danger-color)' }}
                        onClick={() => handleDeleteTask(t.questId, t.taskIndex)}
                        title="Quitar tarea"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron tareas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {subTab === 'rewards' && (
          <table className="editor-table">
            <thead>
              <tr>
                {renderHeader('rewards-select', (
                  <input 
                    type="checkbox"
                    className="table-checkbox"
                    checked={isAllRewardsVisibleSelected}
                    ref={el => { if (el) el.indeterminate = isSomeRewardsVisibleSelected; }}
                    onChange={toggleAllRewardsVisible}
                    title="Seleccionar/Deseleccionar recompensas visibles en esta página"
                  />
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-parent', 'Misión Padre', 'questTitle')}
                {renderHeader('rewards-id', 'ID Recompensa', 'id')}
                {renderHeader('rewards-type', 'Tipo', 'type')}
                {renderHeader('rewards-item', 'Ítem / Comando / Tabla', 'item')}
                {renderHeader('rewards-count', 'Cantidad', 'count')}
                {renderHeader('rewards-bonus', 'Bono Aleatorio', undefined, { textAlign: 'center' })}
                {renderHeader('rewards-auto', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Auto-Claim</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('auto', e.target.value);
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                      <option value="invisible">Invisible</option>
                      <option value="no_toast">No Toast</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-team', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Por Equipo</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('team_reward', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (Equipo)</option>
                      <option value="false">No (Individual)</option>
                    </select>
                  </div>
                ), 'team', { textAlign: 'center' })}
                {renderHeader('rewards-op', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Permisos OP</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('elevate_perms', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (OP)</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-ignore_block', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Ignorar Bloqueo</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('ignore_reward_blocking', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (True)</option>
                      <option value="false">No (False)</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-claim_all', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Excluir Claim All</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('exclude_from_claim_all', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (True)</option>
                      <option value="false">No (False)</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-silent', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Silencioso</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('silent', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (True)</option>
                      <option value="false">No (False)</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-only_one', (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Sólo Uno</span>
                    <select 
                      className="table-select"
                      style={{ width: '110px', fontSize: '0.72rem', padding: '2px 4px', height: '24px' }}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleRewardsBulkUpdate('only_one', e.target.value === 'default' ? 'default' : e.target.value === 'true');
                      }}
                    >
                      <option value="">Definir todos...</option>
                      <option value="default">Por Defecto</option>
                      <option value="true">Sí (True)</option>
                      <option value="false">No (False)</option>
                    </select>
                  </div>
                ), undefined, { textAlign: 'center' })}
                {renderHeader('rewards-title', 'Título Custom')}
                {renderHeader('rewards-icon', 'Ícono Custom')}
                {renderHeader('rewards-actions', 'Acciones', undefined, { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {paginatedRewards.map((r) => {
                const rewardKey = `${r.questId}:${r.rewardIndex}`;
                const isSelected = selectedRewardKeys.has(rewardKey);
                const itemVal = r.rewardObj.type === 'command'
                  ? (getDValue(r.rewardObj.command) || '')
                  : (typeof r.rewardObj.item === 'string'
                      ? r.rewardObj.item
                      : (getDValue(r.rewardObj.item?.id) || ''));

                const rewardCountVal = r.rewardObj.count !== undefined 
                  ? getDValue(r.rewardObj.count) 
                  : (typeof r.rewardObj.item === 'object' && r.rewardObj.item !== null
                      ? (getDValue(r.rewardObj.item.Count) ?? getDValue(r.rewardObj.item.count) ?? 1)
                      : 1);

                return (
                  <tr key={rewardKey} className={isSelected ? 'row-selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => toggleRewardSelect(rewardKey)}
                      />
                    </td>
                    <td>
                      <div className="parent-quest-badge" style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#a2f9be', borderColor: 'rgba(46, 204, 113, 0.2)' }}>
                        <Gift size={12} />
                        <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.questTitle}>
                          {r.questTitle}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="table-cell-id">{r.rewardObj.id || 'N/A'}</span>
                        {r.rewardObj.id && (
                          <button 
                            className="btn-icon" 
                            style={{ padding: '2px' }} 
                            onClick={() => handleCopyId(r.rewardObj.id)}
                            title="Copiar ID"
                          >
                            {copiedId === r.rewardObj.id ? <span style={{ color: '#2ecc71', fontSize: '0.75rem' }}>Listo</span> : <Clipboard size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.type || 'xp'}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const baseUpdates: any = { type: newType };
                          if (newType === 'xp' && r.rewardObj.xp === undefined) baseUpdates.xp = 100;
                          if (newType === 'xp_levels' && r.rewardObj.xp_levels === undefined) baseUpdates.xp_levels = 5;
                          if (newType === 'item' && !r.rewardObj.item) baseUpdates.item = 'minecraft:stone';
                          handleUpdateReward(r.questId, r.rewardIndex, baseUpdates);
                        }}
                      >
                        <option value="xp">XP</option>
                        <option value="xp_levels">XP Levels</option>
                        <option value="item">Item</option>
                        <option value="command">Command</option>
                        <option value="choice">Choice</option>
                        <option value="random">Random</option>
                        <option value="loot">Loot Table</option>
                        <option value="toast">Toast</option>
                        <option value="custom">Custom</option>
                      </select>
                    </td>
                    <td>
                      {r.rewardObj.type === 'command' ? (
                        <input 
                          type="text" 
                          className="table-input"
                          value={itemVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (typeof r.rewardObj.command === 'object' && r.rewardObj.command !== null) {
                              handleUpdateReward(r.questId, r.rewardIndex, { command: { ...r.rewardObj.command, value: val } });
                            } else {
                              handleUpdateReward(r.questId, r.rewardIndex, { command: val });
                            }
                          }}
                          placeholder="/give @p ..."
                          style={{ width: '100%' }}
                        />
                      ) : (r.rewardObj.type === 'choice' || r.rewardObj.type === 'random' || r.rewardObj.type === 'loot') ? (
                        <input 
                          type="text" 
                          className="table-input"
                          value={r.rewardObj.table_id || r.rewardObj.table || itemVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateRewardProperty(r.questId, r.rewardIndex, 'table_id', val);
                          }}
                          placeholder="Loot Table ID / Hex"
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input 
                            type="text" 
                            className="table-input"
                            value={itemVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (typeof r.rewardObj.item === 'object' && r.rewardObj.item !== null) {
                                handleUpdateReward(r.questId, r.rewardIndex, { item: { ...r.rewardObj.item, id: val } });
                              } else {
                                handleUpdateReward(r.questId, r.rewardIndex, { item: val });
                              }
                            }}
                            disabled={r.rewardObj.type !== 'item'}
                            placeholder="ej. minecraft:diamond"
                            style={{ flexGrow: 1 }}
                          />
                          {r.rewardObj.type === 'item' && onOpenNbtEditor && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => {
                                const currentItem = r.rewardObj.item;
                                const itemToEdit = typeof currentItem === 'object' && currentItem !== null 
                                  ? currentItem 
                                  : { id: currentItem || 'minecraft:air', Count: 1 };
                                
                                onOpenNbtEditor(
                                  `Editar NBT de Recompensa (${r.rewardObj.id || 'Sin ID'})`,
                                  itemToEdit,
                                  (updatedNbt) => {
                                    handleUpdateReward(r.questId, r.rewardIndex, { item: updatedNbt });
                                  }
                                );
                              }}
                              title="Editar NBT completo del ítem (JSON)"
                            >
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-color)' }}>NBT</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.rewardObj.type === 'xp' ? (
                        <input 
                          type="number" 
                          className="table-input"
                          value={getDValue(r.rewardObj.xp) ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (typeof r.rewardObj.xp === 'object' && r.rewardObj.xp !== null) {
                              handleUpdateReward(r.questId, r.rewardIndex, { xp: { ...r.rewardObj.xp, value: val } });
                            } else {
                              handleUpdateReward(r.questId, r.rewardIndex, { xp: val });
                            }
                          }}
                        />
                      ) : r.rewardObj.type === 'xp_levels' ? (
                        <input 
                          type="number" 
                          className="table-input"
                          value={getDValue(r.rewardObj.xp_levels) ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (typeof r.rewardObj.xp_levels === 'object' && r.rewardObj.xp_levels !== null) {
                              handleUpdateReward(r.questId, r.rewardIndex, { xp_levels: { ...r.rewardObj.xp_levels, value: val } });
                            } else {
                              handleUpdateReward(r.questId, r.rewardIndex, { xp_levels: val });
                            }
                          }}
                        />
                      ) : (
                        <input 
                          type="number" 
                          className="table-input"
                          value={rewardCountVal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            if (typeof r.rewardObj.item === 'object' && r.rewardObj.item !== null && (r.rewardObj.item.Count !== undefined || r.rewardObj.item.count !== undefined)) {
                              const isCapitalCount = r.rewardObj.item.Count !== undefined;
                              const countKey = isCapitalCount ? 'Count' : 'count';
                              const currentCountObj = r.rewardObj.item[countKey];
                              
                              const updatedItem = {
                                ...r.rewardObj.item,
                                [countKey]: typeof currentCountObj === 'object' && currentCountObj !== null
                                  ? { ...currentCountObj, value: val }
                                  : val
                              };
                              handleUpdateReward(r.questId, r.rewardIndex, { item: updatedItem });
                            } else {
                              if (typeof r.rewardObj.count === 'object' && r.rewardObj.count !== null) {
                                handleUpdateReward(r.questId, r.rewardIndex, { count: { ...r.rewardObj.count, value: val } });
                              } else {
                                handleUpdateReward(r.questId, r.rewardIndex, { count: val });
                              }
                            }
                          }}
                          disabled={r.rewardObj.type !== 'item'}
                        />
                      )}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="table-input"
                        value={r.rewardObj.random_bonus !== undefined ? getDValue(r.rewardObj.random_bonus) : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 'default' : (parseInt(e.target.value) || 0);
                          handleUpdateRewardProperty(r.questId, r.rewardIndex, 'random_bonus', val === 0 ? 'default' : val);
                        }}
                        placeholder="Default"
                      />
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.auto || 'default'}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'auto', e.target.value)}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                        <option value="invisible">Invisible</option>
                        <option value="no_toast">No Toast</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.team_reward === undefined ? 'default' : (r.rewardObj.team_reward ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'team_reward', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (Equipo)</option>
                        <option value="false">No (Individual)</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.elevate_perms === undefined ? 'default' : (r.rewardObj.elevate_perms ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'elevate_perms', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                        disabled={r.rewardObj.type !== 'command'}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (OP)</option>
                        <option value="false">No</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.ignore_reward_blocking === undefined ? 'default' : (r.rewardObj.ignore_reward_blocking ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'ignore_reward_blocking', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (True)</option>
                        <option value="false">No (False)</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.exclude_from_claim_all === undefined ? 'default' : (r.rewardObj.exclude_from_claim_all ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'exclude_from_claim_all', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (True)</option>
                        <option value="false">No (False)</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.silent === undefined ? 'default' : (r.rewardObj.silent ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'silent', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                        disabled={r.rewardObj.type !== 'command'}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (True)</option>
                        <option value="false">No (False)</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="table-select"
                        value={r.rewardObj.only_one === undefined ? 'default' : (r.rewardObj.only_one ? 'true' : 'false')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'only_one', e.target.value === 'default' ? 'default' : (e.target.value === 'true'))}
                      >
                        <option value="default">Por Defecto</option>
                        <option value="true">Sí (True)</option>
                        <option value="false">No (False)</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input"
                        value={r.rewardObj.title || ''}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'title', e.target.value)}
                        placeholder="Por Defecto"
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="table-input"
                        value={typeof r.rewardObj.icon === 'string' ? r.rewardObj.icon : (r.rewardObj.icon?.id || '')}
                        onChange={(e) => handleUpdateRewardProperty(r.questId, r.rewardIndex, 'icon', e.target.value)}
                        placeholder="Por Defecto"
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        style={{ color: 'var(--danger-color)' }}
                        onClick={() => handleDeleteReward(r.questId, r.rewardIndex)}
                        title="Quitar recompensa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRewards.length === 0 && (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron recompensas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Barra Inferior de Paginación */}
      <div className="table-pagination-footer">
        <div className="pagination-info">
          <span>
            Mostrando {currentTotal === 0 ? 0 : (pageSize === 'all' ? 1 : ((currentPage - 1) * (pageSize as number) + 1))} - {pageSize === 'all' ? currentTotal : Math.min(currentPage * (pageSize as number), currentTotal)} de {currentTotal.toLocaleString()} elementos
          </span>
          {pageSize !== 'all' && (
            <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
              (Página {currentPage} de {totalPages})
            </span>
          )}
        </div>

        <div className="pagination-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filas:</span>
            <select 
              className="table-select"
              style={{ width: '80px', height: '28px', padding: '2px 6px', fontSize: '0.8rem' }}
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                setPageSize(val);
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="all">Todas</option>
            </select>
          </div>

          {pageSize !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                className="btn-icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                title="Primera página"
                style={{ opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                className="btn-icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Página anterior"
                style={{ opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div style={{ margin: '0 8px', fontSize: '0.8rem', fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </div>

              <button 
                className="btn-icon"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Página siguiente"
                style={{ opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
              <button 
                className="btn-icon"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Última página"
                style={{ opacity: currentPage >= totalPages ? 0.4 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra Flotante de Acciones Masivas cuando hay Selección */}
      {currentSelectedCount > 0 && (
        <div className="table-floating-bar">
          <div className="table-floating-content">
            <div className="table-floating-badge">
              <CheckSquare size={16} />
              <span><strong>{currentSelectedCount}</strong> {subTab === 'quests' ? 'misiones' : subTab === 'tasks' ? 'tareas' : 'recompensas'} seleccionadas</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setIsBatchModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <Sparkles size={15} />
                <span>Modificar ({currentSelectedCount})</span>
              </button>

              <button 
                className="btn btn-danger"
                onClick={handleBatchDelete}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', backgroundColor: '#e74c3c', color: 'white' }}
              >
                <Trash2 size={15} />
                <span>Eliminar ({currentSelectedCount})</span>
              </button>

              <button 
                className="btn btn-secondary"
                onClick={handleClearSelection}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '0.85rem' }}
                title="Deseleccionar todo"
              >
                <X size={15} />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Operaciones Masivas */}
      <TableBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        subTab={subTab}
        selectedCount={currentSelectedCount}
        totalFilteredCount={currentTotal}
        onApplyQuestBatch={handleApplyQuestBatch}
        onApplyTaskBatch={handleApplyTaskBatch}
        onApplyRewardBatch={handleApplyRewardBatch}
      />
    </div>
  );
};

