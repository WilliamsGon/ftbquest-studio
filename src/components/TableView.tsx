import React, { useState, useMemo } from 'react';
import { Search, Trash2, Tag, Gift, Clipboard } from 'lucide-react';

interface TableViewProps {
  quests: any[];
  images: any[];
  updateQuest: (idOrUpdatesList: any, updates?: any) => void;
  updateImage: (indexOrUpdatesList: any, updates?: any) => void;
  onOpenNbtEditor?: (title: string, value: any, onSave: (val: any) => void) => void;
}

const defaultColumnWidths: { [key: string]: number } = {
  // Quests
  'quests-id': 180,
  'quests-title': 220,
  'quests-icon': 200,
  'quests-x': 80,
  'quests-y': 80,
  'quests-size': 90,
  'quests-shape': 120,
  'quests-hide_deps': 130,
  'quests-actions': 90,

  // Tasks
  'tasks-parent': 180,
  'tasks-id': 170,
  'tasks-type': 120,
  'tasks-item': 260,
  'tasks-count': 110,
  'tasks-consume': 140,
  'tasks-actions': 90,

  // Rewards
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
  'rewards-actions': 90
};

export const TableView: React.FC<TableViewProps> = ({ quests, updateQuest, onOpenNbtEditor }) => {
  const [subTab, setSubTab] = useState<'quests' | 'tasks' | 'rewards'>('quests');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const newWidth = Math.max(50, currentWidth + deltaX);
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

  const renderHeader = (colKey: string, children: React.ReactNode, style?: React.CSSProperties) => {
    const w = getColWidth(colKey);
    return (
      <th 
        style={{ 
          width: w ? `${w}px` : undefined, 
          minWidth: w ? `${w}px` : undefined,
          position: 'relative',
          ...style 
        }}
      >
        {children}
        <div 
          className={`column-resize-handle ${resizingCol === colKey ? 'active' : ''}`}
          onMouseDown={(e) => handleResizeStart(e, colKey)}
          onDoubleClick={() => handleResetWidth(colKey)}
          title="Arrastrar para cambiar ancho / Doble clic para restablecer"
        />
      </th>
    );
  };


  // Helper para obtener el valor plano de SNBT
  const getDValue = (val: any) => {
    return typeof val === 'object' && val !== null ? val.value : val;
  };

  // Copia rápida al portapapeles
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

  // --- 4. EDICIÓN DE TAREAS Y RECOMPENSAS ---
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

  // --- 5. ACCIONES DE BORRADO ---
  const handleDeleteQuest = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta misión?')) {
      const nextQuests = quests.filter(q => q.id !== id);
      updateQuest(nextQuests, undefined); // Si pasamos array actualiza el total
    }
  };

  const handleDeleteTask = (questId: string, taskIndex: number) => {
    if (window.confirm('¿Deseas quitar esta tarea?')) {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      const tasksArray = Array.isArray(quest.tasks) ? [...quest.tasks] : (quest.tasks ? [quest.tasks] : []);
      tasksArray.splice(taskIndex, 1);
      updateQuest(questId, { tasks: tasksArray });
    }
  };

  const handleDeleteReward = (questId: string, rewardIndex: number) => {
    if (window.confirm('¿Deseas quitar esta recompensa?')) {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;
      const rewardsArray = Array.isArray(quest.rewards) ? [...quest.rewards] : (quest.rewards ? [quest.rewards] : []);
      rewardsArray.splice(rewardIndex, 1);
      updateQuest(questId, { rewards: rewardsArray });
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

  // --- 6. LÓGICA DE MARCAR TODOS (BULK CHECKBOX TOGGLE) ---
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

  return (
    <div className="table-view-container">
      {/* Selector de Pestañas Interno e Input de Búsqueda */}
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
      </div>

      {/* Contenedor de la Tabla Principal */}
      <div className="table-wrapper">
        {subTab === 'quests' && (
          <table className="editor-table">
            <thead>
              <tr>
                {renderHeader('quests-id', 'ID')}
                {renderHeader('quests-title', 'Título')}
                {renderHeader('quests-icon', 'Icono')}
                {renderHeader('quests-x', 'X')}
                {renderHeader('quests-y', 'Y')}
                {renderHeader('quests-size', 'Tamaño')}
                {renderHeader('quests-shape', 'Forma (Shape)')}
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
                ), { textAlign: 'center' })}
                {renderHeader('quests-actions', 'Acciones', { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {filteredQuests.map((q) => (
                <tr key={q.id}>
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
              ))}
              {filteredQuests.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
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
                {renderHeader('tasks-parent', 'Misión Padre')}
                {renderHeader('tasks-id', 'ID Tarea')}
                {renderHeader('tasks-type', 'Tipo')}
                {renderHeader('tasks-item', 'Ítem / Target')}
                {renderHeader('tasks-count', 'Cantidad')}
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
                ), { textAlign: 'center' })}
                {renderHeader('tasks-actions', 'Acciones', { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t, idx) => {
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
                  <tr key={`${t.questId}-task-${idx}`}>
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
                            // Si es tipo item:
                            // Si la cantidad ya estaba en t.taskObj.item.Count (u objeto), la editamos allí
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
                              // De lo contrario, lo editamos en count a nivel de raíz
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
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
                {renderHeader('rewards-parent', 'Misión Padre')}
                {renderHeader('rewards-id', 'ID Recompensa')}
                {renderHeader('rewards-type', 'Tipo')}
                {renderHeader('rewards-item', 'Ítem / Comando / Tabla')}
                {renderHeader('rewards-count', 'Cantidad')}
                {renderHeader('rewards-bonus', 'Bono Aleatorio', { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
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
                ), { textAlign: 'center' })}
                {renderHeader('rewards-title', 'Título Custom')}
                {renderHeader('rewards-icon', 'Ícono Custom')}
                {renderHeader('rewards-actions', 'Acciones', { width: '80px', textAlign: 'center' })}
              </tr>
            </thead>
            <tbody>
              {filteredRewards.map((r, idx) => {
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
                  <tr key={`${r.questId}-reward-${idx}`}>
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
                          placeholder="Loot Table ID / Hex (ej. 4196188979167302596L)"
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
                  <td colSpan={16} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron recompensas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
