import React, { useState } from 'react';
import { 
  Plus, Trash2, Copy, ChevronUp, ChevronDown, Settings, Search,
  Package, Tag, CheckCircle2, Swords, Compass, Trophy, Castle, Sparkles,
  Gift, Terminal, Dices, Layers, Trees, ShieldAlert
} from 'lucide-react';
import type { RewardTable } from '../types/rewardTable';
import { ItemTagPickerModal } from './ItemTagPickerModal';
import { QuestItemThumbnail } from '../utils/textureHelper';
import { isItemTag } from '../utils/itemTagCatalogs';
import { 
  MINECRAFT_ENTITIES, 
  MINECRAFT_BIOMES, 
  MINECRAFT_STRUCTURES, 
  MINECRAFT_DIMENSIONS, 
  GAMESTAGE_PRESETS 
} from '../utils/minecraftCatalogs';

interface QuestTaskRewardManagerProps {
  tasks: any[];
  rewards: any[];
  onUpdateTasks: (newTasks: any[]) => void;
  onUpdateRewards: (newRewards: any[]) => void;
  onOpenTexturePicker: (targetType: string, onSelect: (val: string) => void) => void;
  onOpenNbtEditor: (title: string, value: any, onSave: (val: any) => void) => void;
  rewardTables?: RewardTable[];
  onOpenRewardTableModal?: () => void;
}

function generateHexId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

function getDValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof val.value === 'number') return val.value;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
}

const ItemThumbnail: React.FC<{ icon: any; altText?: string }> = ({ icon, altText = 'item' }) => {
  return (
    <div 
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '6px',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        overflow: 'hidden'
      }}
    >
      <QuestItemThumbnail icon={icon} size={28} altText={altText} />
    </div>
  );
};

export const QuestTaskRewardManager: React.FC<QuestTaskRewardManagerProps> = ({
  tasks,
  rewards,
  onUpdateTasks,
  onUpdateRewards,
  onOpenTexturePicker,
  onOpenNbtEditor,
  rewardTables = [],
  onOpenRewardTableModal
}) => {
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const [isRewardMenuOpen, setIsRewardMenuOpen] = useState(false);
  const [tagPickerState, setTagPickerState] = useState<{ isOpen: boolean; taskIndex: number; currentTag: string }>({
    isOpen: false,
    taskIndex: -1,
    currentTag: ''
  });

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeRewards = Array.isArray(rewards) ? rewards : [];

  // ---- Task Handlers ----
  const addTaskPreset = (type: string) => {
    setIsTaskMenuOpen(false);
    const newId = generateHexId();
    let newTask: any = { id: newId, type };

    switch (type) {
      case 'item':
        newTask = {
          id: newId,
          type: 'item',
          item: 'minecraft:iron_ingot',
          count: { __type: 'number', value: 1, suffix: 'L' }
        };
        break;
      case 'checkmark':
        newTask = {
          id: newId,
          type: 'checkmark',
          title: 'Confirmar tarea'
        };
        break;
      case 'kill':
        newTask = {
          id: newId,
          type: 'kill',
          entity: 'minecraft:zombie',
          value: { __type: 'number', value: 10, suffix: 'L' }
        };
        break;
      case 'dimension':
        newTask = {
          id: newId,
          type: 'dimension',
          dimension: 'minecraft:the_nether'
        };
        break;
      case 'advancement':
        newTask = {
          id: newId,
          type: 'advancement',
          advancement: 'minecraft:story/root',
          criterion: ''
        };
        break;
      case 'structure':
        newTask = {
          id: newId,
          type: 'structure',
          structure: 'minecraft:fortress'
        };
        break;
      case 'xp':
        newTask = {
          id: newId,
          type: 'xp',
          value: { __type: 'number', value: 100, suffix: 'L' }
        };
        break;
      case 'biome':
        newTask = {
          id: newId,
          type: 'biome',
          biome: 'minecraft:plains',
        };
        break;
      case 'gamestage':
        newTask = {
          id: newId,
          type: 'gamestage',
          stage: 'stage_one',
        };
        break;
      default:
        newTask = { id: newId, type };
        break;
    }

    onUpdateTasks([...safeTasks, newTask]);
  };

  const moveTask = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= safeTasks.length) return;
    const next = [...safeTasks];
    const item = next.splice(idx, 1)[0];
    next.splice(targetIdx, 0, item);
    onUpdateTasks(next);
  };

  const duplicateTask = (idx: number) => {
    const item = safeTasks[idx];
    if (!item) return;
    const clone = JSON.parse(JSON.stringify(item));
    clone.id = generateHexId();
    const next = [...safeTasks];
    next.splice(idx + 1, 0, clone);
    onUpdateTasks(next);
  };

  const deleteTask = (idx: number) => {
    const next = [...safeTasks];
    next.splice(idx, 1);
    onUpdateTasks(next);
  };

  const updateTaskField = (idx: number, field: string, val: any) => {
    const next = [...safeTasks];
    if (val === undefined) {
      delete next[idx][field];
    } else {
      next[idx] = { ...next[idx], [field]: val };
    }
    onUpdateTasks(next);
  };

  // ---- Reward Handlers ----
  const addRewardPreset = (type: string) => {
    setIsRewardMenuOpen(false);
    const newId = generateHexId();
    let newReward: any = { id: newId, type };

    switch (type) {
      case 'item':
        newReward = {
          id: newId,
          type: 'item',
          item: 'minecraft:diamond',
          count: 1
        };
        break;
      case 'xp':
        newReward = {
          id: newId,
          type: 'xp',
          xp: 100
        };
        break;
      case 'xp_levels':
        newReward = {
          id: newId,
          type: 'xp_levels',
          xp_levels: 5
        };
        break;
      case 'command':
        newReward = {
          id: newId,
          type: 'command',
          command: '/say ¡Misión completada!',
          title: 'Comando de Consola',
          elevate_perms: true
        };
        break;
      case 'random':
        newReward = {
          id: newId,
          type: 'random',
          table_id: { __type: 'number', value: 1, suffix: 'L' }
        };
        break;
      default:
        newReward = { id: newId, type };
        break;
    }

    onUpdateRewards([...safeRewards, newReward]);
  };

  const moveReward = (idx: number, delta: number) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= safeRewards.length) return;
    const next = [...safeRewards];
    const item = next.splice(idx, 1)[0];
    next.splice(targetIdx, 0, item);
    onUpdateRewards(next);
  };

  const duplicateReward = (idx: number) => {
    const item = safeRewards[idx];
    if (!item) return;
    const clone = JSON.parse(JSON.stringify(item));
    clone.id = generateHexId();
    const next = [...safeRewards];
    next.splice(idx + 1, 0, clone);
    onUpdateRewards(next);
  };

  const deleteReward = (idx: number) => {
    const next = [...safeRewards];
    next.splice(idx, 1);
    onUpdateRewards(next);
  };

  const updateRewardField = (idx: number, field: string, val: any) => {
    const next = [...safeRewards];
    if (val === undefined) {
      delete next[idx][field];
    } else {
      next[idx] = { ...next[idx], [field]: val };
    }
    onUpdateRewards(next);
  };

  // Helper para insignias de tipo de tarea
  const getTaskTypeBadge = (type: string) => {
    switch (type) {
      case 'item':
        return { icon: <Package size={13} />, label: 'Ítem', color: '#89b4fa', bg: 'rgba(137, 180, 250, 0.15)' };
      case 'checkmark':
        return { icon: <CheckCircle2 size={13} />, label: 'Checkmark', color: '#a6e3a1', bg: 'rgba(166, 227, 161, 0.15)' };
      case 'kill':
        return { icon: <Swords size={13} />, label: 'Caza (Kill)', color: '#f38ba8', bg: 'rgba(243, 139, 168, 0.15)' };
      case 'dimension':
        return { icon: <Compass size={13} />, label: 'Dimensión', color: '#cba6f7', bg: 'rgba(203, 166, 247, 0.15)' };
      case 'advancement':
        return { icon: <Trophy size={13} />, label: 'Logro', color: '#f9e2af', bg: 'rgba(249, 226, 175, 0.15)' };
      case 'structure':
        return { icon: <Castle size={13} />, label: 'Estructura', color: '#fab387', bg: 'rgba(250, 179, 135, 0.15)' };
      case 'xp':
        return { icon: <Sparkles size={13} />, label: 'XP Requerida', color: '#94e2d5', bg: 'rgba(148, 226, 213, 0.15)' };
      case 'biome':
        return { icon: <Trees size={13} />, label: 'Bioma', color: '#a6e3a1', bg: 'rgba(166, 227, 161, 0.15)' };
      case 'gamestage':
        return { icon: <ShieldAlert size={13} />, label: 'GameStage', color: '#f5c2e7', bg: 'rgba(245, 194, 231, 0.15)' };
      default:
        return { icon: <Layers size={13} />, label: type || 'Tarea', color: '#a6adc8', bg: 'rgba(166, 173, 200, 0.15)' };
    }
  };

  // Helper para insignias de tipo de recompensa
  const getRewardTypeBadge = (type: string) => {
    switch (type) {
      case 'item':
        return { icon: <Gift size={13} />, label: 'Ítem', color: '#89b4fa', bg: 'rgba(137, 180, 250, 0.15)' };
      case 'xp':
        return { icon: <Sparkles size={13} />, label: 'Puntos XP', color: '#a6e3a1', bg: 'rgba(166, 227, 161, 0.15)' };
      case 'xp_levels':
        return { icon: <Sparkles size={13} />, label: 'Niveles XP', color: '#94e2d5', bg: 'rgba(148, 226, 213, 0.15)' };
      case 'command':
        return { icon: <Terminal size={13} />, label: 'Comando', color: '#fab387', bg: 'rgba(250, 179, 135, 0.15)' };
      case 'random':
      case 'loot':
        return { icon: <Dices size={13} />, label: 'Loot Aleatorio', color: '#f5c2e7', bg: 'rgba(245, 194, 231, 0.15)' };
      default:
        return { icon: <Layers size={13} />, label: type || 'Recompensa', color: '#a6adc8', bg: 'rgba(166, 173, 200, 0.15)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
      
      {/* ======================================================== */}
      {/* SECCIÓN DE TAREAS (TASKS)                                */}
      {/* ======================================================== */}
      <div className="tasks-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={15} className="text-accent" />
              <span>Tareas (Tasks)</span>
            </h3>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              background: 'rgba(255,255,255,0.08)', 
              color: 'var(--text-secondary)', 
              padding: '1px 6px', 
              borderRadius: '10px' 
            }}>
              {safeTasks.length}
            </span>
          </div>

          {/* Menú para Añadir Tarea */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', gap: '4px' }}
              onClick={() => {
                setIsTaskMenuOpen(!isTaskMenuOpen);
                setIsRewardMenuOpen(false);
              }}
              title="Añadir nueva tarea a la misión"
            >
              <Plus size={14} /> Tarea
            </button>

            {isTaskMenuOpen && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  zIndex: 200,
                  minWidth: '200px',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  background: 'rgba(24, 27, 34, 0.98)',
                  border: '1px solid var(--panel-border)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 8px', fontWeight: 600 }}>
                  TIPO DE TAREA
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('item')}
                >
                  <Package size={14} style={{ color: '#89b4fa' }} /> 📦 Ítem (Recolectar)
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('checkmark')}
                >
                  <CheckCircle2 size={14} style={{ color: '#a6e3a1' }} /> ✅ Checkmark (Simple)
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('kill')}
                >
                  <Swords size={14} style={{ color: '#f38ba8' }} /> ⚔️ Caza de Entidad (Kill)
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('dimension')}
                >
                  <Compass size={14} style={{ color: '#cba6f7' }} /> 🌌 Visitar Dimensión
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('advancement')}
                >
                  <Trophy size={14} style={{ color: '#f9e2af' }} /> 🏆 Logro (Advancement)
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('structure')}
                >
                  <Castle size={14} style={{ color: '#fab387' }} /> 🏛️ Estructura
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('biome')}
                >
                  <Trees size={14} style={{ color: '#a6e3a1' }} /> 🏞️ Descubrir Bioma
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('gamestage')}
                >
                  <ShieldAlert size={14} style={{ color: '#f5c2e7' }} /> 🔮 Etapa GameStage
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addTaskPreset('xp')}
                >
                  <Sparkles size={14} style={{ color: '#94e2d5' }} /> 🔮 Nivel de XP Requerido
                </button>
              </div>
            )}
          </div>
        </div>

        {safeTasks.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            background: 'rgba(0,0,0,0.15)', 
            borderRadius: '8px', 
            border: '1px dashed rgba(255,255,255,0.08)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            Sin tareas requeridas (la misión se completará automáticamente si no tiene tareas).
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeTasks.map((task: any, tIdx: number) => {
              if (!task) return null;
              const badge = getTaskTypeBadge(task.type);

              return (
                <div 
                  key={task.id || tIdx} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px', 
                    padding: '10px',
                    transition: 'border-color 0.2s ease',
                    minWidth: 0,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Encabezado de la Tarjeta de Tarea */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '0.72rem', 
                          fontWeight: 600, 
                          color: badge.color, 
                          background: badge.bg,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      {task.id && (
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          #{String(task.id).slice(-4)}
                        </span>
                      )}
                    </div>

                    {/* Acciones de la Tarea */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button 
                        className="btn-icon" 
                        title="Subir posición"
                        disabled={tIdx === 0}
                        style={{ opacity: tIdx === 0 ? 0.3 : 0.8, padding: '3px' }}
                        onClick={() => moveTask(tIdx, -1)}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Bajar posición"
                        disabled={tIdx === safeTasks.length - 1}
                        style={{ opacity: tIdx === safeTasks.length - 1 ? 0.3 : 0.8, padding: '3px' }}
                        onClick={() => moveTask(tIdx, 1)}
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Duplicar tarea"
                        style={{ padding: '3px' }}
                        onClick={() => duplicateTask(tIdx)}
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar NBT en crudo"
                        style={{ padding: '3px' }}
                        onClick={() => onOpenNbtEditor(`Editar Tarea #${task.id || tIdx}`, task, (updated) => {
                          const next = [...safeTasks];
                          next[tIdx] = updated;
                          onUpdateTasks(next);
                        })}
                      >
                        <Settings size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar tarea"
                        style={{ color: 'var(--danger-color)', padding: '3px' }}
                        onClick={() => deleteTask(tIdx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo Específico según Tipo */}
                  {task.type === 'item' && (() => {
                    const currentRawItem = typeof task.item === 'string' ? task.item : (task.item?.id || '');
                    const isCurrentTag = isItemTag(currentRawItem);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Selector de modo: Ítem Específico vs Tag Forge/Common */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              border: 'none',
                              backgroundColor: !isCurrentTag ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                              color: !isCurrentTag ? '#ffffff' : '#9ca3af',
                              fontWeight: !isCurrentTag ? 600 : 400
                            }}
                            onClick={() => {
                              if (isCurrentTag) {
                                const clean = currentRawItem.replace(/^#/, '');
                                updateTaskField(tIdx, 'item', clean.includes(':') ? clean : 'minecraft:iron_ingot');
                              }
                            }}
                          >
                            <Package size={12} /> Ítem Específico
                          </button>
                          <button
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              border: 'none',
                              backgroundColor: isCurrentTag ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                              color: isCurrentTag ? '#ffffff' : '#9ca3af',
                              fontWeight: isCurrentTag ? 600 : 400
                            }}
                            onClick={() => {
                              if (!isCurrentTag) {
                                const newTag = currentRawItem ? `#forge:${currentRawItem.split(':').pop() || 'ingots/iron'}` : '#forge:ingots/iron';
                                updateTaskField(tIdx, 'item', newTag);
                              }
                            }}
                          >
                            <Tag size={12} /> 🏷️ Etiqueta Forge/Common
                          </button>
                        </div>

                        {/* Input y Selector según el modo */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isCurrentTag ? (
                            <div 
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#10b981',
                                flexShrink: 0
                              }}
                              title="Tarea configurada por Etiqueta (Item Tag)"
                            >
                              <Tag size={16} />
                            </div>
                          ) : (
                            <ItemThumbnail icon={task.item} altText="Task item" />
                          )}

                          <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                            <input 
                              type="text" 
                              className="input-field" 
                              style={{ 
                                fontSize: '0.8rem', 
                                padding: '5px 8px',
                                borderColor: isCurrentTag ? 'rgba(16, 185, 129, 0.4)' : undefined,
                                color: isCurrentTag ? '#6ee7b7' : undefined,
                                fontFamily: isCurrentTag ? 'monospace' : 'inherit'
                              }}
                              value={currentRawItem} 
                              placeholder={isCurrentTag ? "Tag (ej. #forge:ingots/iron)" : "Item (ej. minecraft:iron_ingot)"}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (typeof task.item === 'object' && task.item !== null) {
                                  updateTaskField(tIdx, 'item', { ...task.item, id: val });
                                } else {
                                  updateTaskField(tIdx, 'item', val);
                                }
                              }}
                            />
                            {isCurrentTag ? (
                              <button 
                                type="button"
                                className="btn-icon" 
                                title="Abrir catálogo de etiquetas Forge 1.20.1"
                                onClick={() => setTagPickerState({
                                  isOpen: true,
                                  taskIndex: tIdx,
                                  currentTag: currentRawItem
                                })}
                                style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}
                              >
                                <Tag size={14} />
                              </button>
                            ) : (
                              <button 
                                type="button"
                                className="btn-icon" 
                                title="Explorar ítems en catálogo de texturas"
                                onClick={() => onOpenTexturePicker('icon', (selectedPath) => {
                                  if (typeof task.item === 'object' && task.item !== null) {
                                    updateTaskField(tIdx, 'item', { ...task.item, id: selectedPath });
                                  } else {
                                    updateTaskField(tIdx, 'item', selectedPath);
                                  }
                                })}
                                style={{ color: 'var(--accent-color)', background: 'rgba(255,255,255,0.06)' }}
                              >
                                <Search size={14} />
                              </button>
                            )}
                          </div>

                          <div style={{ width: '70px' }}>
                            <input 
                              type="number" 
                              className="input-field" 
                              style={{ fontSize: '0.8rem', padding: '5px 8px', textAlign: 'center' }}
                              value={task.count?.value || task.count || 1} 
                              min={1}
                              placeholder="Cant."
                              title="Cantidad requerida (count: XL)"
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                updateTaskField(tIdx, 'count', { __type: 'number', value: val, suffix: 'L' });
                              }}
                            />
                          </div>
                        </div>

                        {/* Mensaje informativo de Tag */}
                        {isCurrentTag && (
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#10b981' }}>✓</span> Aceptará cualquier ítem del modpack registrado bajo este tag.
                          </div>
                        )}

                        {/* Flags avanzadas de ítems */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={!!task.consume_items}
                              onChange={(e) => updateTaskField(tIdx, 'consume_items', e.target.checked ? true : undefined)}
                            />
                            <span>Consumir al entregar</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={!!task.only_from_crafting}
                              onChange={(e) => updateTaskField(tIdx, 'only_from_crafting', e.target.checked ? true : undefined)}
                            />
                            <span>Solo por crafteo</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={!!task.match_nbt}
                              onChange={(e) => updateTaskField(tIdx, 'match_nbt', e.target.checked ? true : undefined)}
                            />
                            <span>Coincidir NBT</span>
                          </label>
                        </div>
                      </div>
                    );
                  })()}

                  {task.type === 'checkmark' && (
                    <div>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                        value={task.title || ''} 
                        placeholder="Título opcional de la tarea"
                        onChange={(e) => updateTaskField(tIdx, 'title', e.target.value)}
                      />
                    </div>
                  )}

                  {task.type === 'kill' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        list="minecraft-entities-datalist"
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.entity || ''} 
                        placeholder="Entidad o Mob (ej. minecraft:warden)"
                        onChange={(e) => updateTaskField(tIdx, 'entity', e.target.value)}
                      />
                      <select
                        className="input-field"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', fontSize: '0.74rem', padding: '3px 8px', height: '28px', boxSizing: 'border-box', cursor: 'pointer' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateTaskField(tIdx, 'entity', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>⚡ Catálogo de Mobs / Presets...</option>
                        <optgroup label="Jefes (Bosses)">
                          {MINECRAFT_ENTITIES.filter(m => m.category?.includes('Jefes')).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Vanilla Hostiles">
                          {MINECRAFT_ENTITIES.filter(m => m.category === 'Vanilla Hostil').map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Nether & Incursión">
                          {MINECRAFT_ENTITIES.filter(m => m.category === 'Nether' || m.category === 'Incursión').map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Twilight Forest">
                          {MINECRAFT_ENTITIES.filter(m => m.category?.includes('Twilight')).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Cataclysm & Mods">
                          {MINECRAFT_ENTITIES.filter(m => m.category?.includes('Cataclysm') || m.category?.includes('Alex') || m.category?.includes('Mowzie')).map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </optgroup>
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Cantidad a eliminar:</label>
                        <input 
                          type="number" 
                          className="input-field" 
                          style={{ width: '80px', fontSize: '0.8rem', padding: '3px 6px', textAlign: 'center' }}
                          value={task.value?.value || task.value || 1} 
                          min={1}
                          onChange={(e) => updateTaskField(tIdx, 'value', { __type: 'number', value: parseInt(e.target.value) || 1, suffix: 'L' })}
                        />
                      </div>
                    </div>
                  )}

                  {task.type === 'biome' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        list="minecraft-biomes-datalist"
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.biome || ''} 
                        placeholder="Bioma a descubrir (ej. minecraft:deep_dark)"
                        onChange={(e) => updateTaskField(tIdx, 'biome', e.target.value)}
                      />
                      <select 
                        className="input-field"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', fontSize: '0.74rem', padding: '3px 8px', height: '28px', boxSizing: 'border-box', cursor: 'pointer' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateTaskField(tIdx, 'biome', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>⚡ Catálogo de Biomas / Presets...</option>
                        <optgroup label="Overworld">
                          {MINECRAFT_BIOMES.filter(b => b.category?.includes('Overworld') || b.category === 'Subterráneo' || b.category === 'Océanos').map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Nether & End">
                          {MINECRAFT_BIOMES.filter(b => b.category === 'Nether' || b.category === 'End').map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Biomas Modded">
                          {MINECRAFT_BIOMES.filter(b => b.category?.includes('Mod')).map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {task.type === 'dimension' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        list="minecraft-dimensions-datalist"
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.dimension || ''} 
                        placeholder="Dimensión (ej. minecraft:the_nether)"
                        onChange={(e) => updateTaskField(tIdx, 'dimension', e.target.value)}
                      />
                      <select 
                        className="input-field"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', fontSize: '0.74rem', padding: '3px 8px', height: '28px', boxSizing: 'border-box', cursor: 'pointer' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateTaskField(tIdx, 'dimension', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>⚡ Catálogo de Dimensiones...</option>
                        <optgroup label="Vanilla">
                          {MINECRAFT_DIMENSIONS.filter(d => d.category === 'Vanilla').map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Mods Populares">
                          {MINECRAFT_DIMENSIONS.filter(d => d.category?.includes('Mod')).map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {task.type === 'advancement' && (
                    <div>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.advancement || ''} 
                        placeholder="ID del Logro (ej. minecraft:story/mine_stone)"
                        onChange={(e) => updateTaskField(tIdx, 'advancement', e.target.value)}
                      />
                    </div>
                  )}

                  {task.type === 'structure' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        list="minecraft-structures-datalist"
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.structure || ''} 
                        placeholder="Estructura a explorar (ej. minecraft:fortress)"
                        onChange={(e) => updateTaskField(tIdx, 'structure', e.target.value)}
                      />
                      <select 
                        className="input-field"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', fontSize: '0.74rem', padding: '3px 8px', height: '28px', boxSizing: 'border-box', cursor: 'pointer' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateTaskField(tIdx, 'structure', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>⚡ Catálogo de Estructuras...</option>
                        <optgroup label="Mazmorras & Templos">
                          {MINECRAFT_STRUCTURES.filter(s => s.category === 'Mazmorras' || s.category === 'Templos').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Aldeas & Exploración">
                          {MINECRAFT_STRUCTURES.filter(s => s.category === 'Aldeas' || s.category === 'Exploración').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Nether & End">
                          {MINECRAFT_STRUCTURES.filter(s => s.category === 'Nether' || s.category === 'End').map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                          ))}
                        </optgroup>
                        <optgroup label="Estructuras Modded">
                          {MINECRAFT_STRUCTURES.filter(s => s.category?.includes('Mod')).map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {task.type === 'gamestage' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        list="gamestages-datalist"
                        style={{ width: '100%', minWidth: 0, fontSize: '0.8rem', padding: '5px 8px', boxSizing: 'border-box' }}
                        value={task.stage || ''} 
                        placeholder="Etapa GameStage (ej. stage_one)"
                        onChange={(e) => updateTaskField(tIdx, 'stage', e.target.value)}
                      />
                      <select 
                        className="input-field"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%', fontSize: '0.74rem', padding: '3px 8px', height: '28px', boxSizing: 'border-box', cursor: 'pointer' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            updateTaskField(tIdx, 'stage', e.target.value);
                            e.target.value = '';
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>⚡ Presets GameStages...</option>
                        {GAMESTAGE_PRESETS.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ width: '100%', minWidth: 0, fontSize: '0.76rem', padding: '4px 8px', boxSizing: 'border-box' }}
                        value={task.title || ''} 
                        placeholder="Título descriptivo opcional para el jugador"
                        onChange={(e) => updateTaskField(tIdx, 'title', e.target.value ? e.target.value : undefined)}
                      />
                    </div>
                  )}

                  {task.type === 'xp' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Puntos XP:</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                        value={task.value?.value || task.value || 100} 
                        onChange={(e) => updateTaskField(tIdx, 'value', { __type: 'number', value: parseInt(e.target.value) || 0, suffix: 'L' })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN DE RECOMPENSAS (REWARDS)                         */}
      {/* ======================================================== */}
      <div className="rewards-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gift size={15} style={{ color: '#fab387' }} />
              <span>Recompensas (Rewards)</span>
            </h3>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              background: 'rgba(255,255,255,0.08)', 
              color: 'var(--text-secondary)', 
              padding: '1px 6px', 
              borderRadius: '10px' 
            }}>
              {safeRewards.length}
            </span>
          </div>

          {/* Menú para Añadir Recompensa */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', gap: '4px', background: '#fab387', color: '#11111b' }}
              onClick={() => {
                setIsRewardMenuOpen(!isRewardMenuOpen);
                setIsTaskMenuOpen(false);
              }}
              title="Añadir nueva recompensa a la misión"
            >
              <Plus size={14} /> Recompensa
            </button>

            {isRewardMenuOpen && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  zIndex: 200,
                  minWidth: '210px',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  background: 'rgba(24, 27, 34, 0.98)',
                  border: '1px solid var(--panel-border)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 8px', fontWeight: 600 }}>
                  TIPO DE RECOMPENSA
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addRewardPreset('item')}
                >
                  <Gift size={14} style={{ color: '#89b4fa' }} /> 🎁 Ítem de Recompensa
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addRewardPreset('xp')}
                >
                  <Sparkles size={14} style={{ color: '#a6e3a1' }} /> 🌟 Puntos de XP
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addRewardPreset('xp_levels')}
                >
                  <Sparkles size={14} style={{ color: '#94e2d5' }} /> 🆙 Niveles de XP
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addRewardPreset('command')}
                >
                  <Terminal size={14} style={{ color: '#fab387' }} /> 💻 Comando de Consola
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '0.78rem', gap: '8px' }}
                  onClick={() => addRewardPreset('random')}
                >
                  <Dices size={14} style={{ color: '#f5c2e7' }} /> 🎲 Loot Table Aleatorio
                </button>
              </div>
            )}
          </div>
        </div>

        {safeRewards.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '16px', 
            background: 'rgba(0,0,0,0.15)', 
            borderRadius: '8px', 
            border: '1px dashed rgba(255,255,255,0.08)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            Sin recompensas configuradas para esta misión.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeRewards.map((reward: any, rIdx: number) => {
              if (!reward) return null;
              const badge = getRewardTypeBadge(reward.type);

              return (
                <div 
                  key={reward.id || rIdx} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px', 
                    padding: '10px',
                    transition: 'border-color 0.2s ease',
                    minWidth: 0,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Encabezado de la Tarjeta de Recompensa */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '0.72rem', 
                          fontWeight: 600, 
                          color: badge.color, 
                          background: badge.bg,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      {reward.id && (
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          #{String(reward.id).slice(-4)}
                        </span>
                      )}
                    </div>

                    {/* Acciones de la Recompensa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <button 
                        className="btn-icon" 
                        title="Subir posición"
                        disabled={rIdx === 0}
                        style={{ opacity: rIdx === 0 ? 0.3 : 0.8, padding: '3px' }}
                        onClick={() => moveReward(rIdx, -1)}
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Bajar posición"
                        disabled={rIdx === safeRewards.length - 1}
                        style={{ opacity: rIdx === safeRewards.length - 1 ? 0.3 : 0.8, padding: '3px' }}
                        onClick={() => moveReward(rIdx, 1)}
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Duplicar recompensa"
                        style={{ padding: '3px' }}
                        onClick={() => duplicateReward(rIdx)}
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar NBT en crudo"
                        style={{ padding: '3px' }}
                        onClick={() => onOpenNbtEditor(`Editar Recompensa #${reward.id || rIdx}`, reward, (updated) => {
                          const next = [...safeRewards];
                          next[rIdx] = updated;
                          onUpdateRewards(next);
                        })}
                      >
                        <Settings size={13} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar recompensa"
                        style={{ color: 'var(--danger-color)', padding: '3px' }}
                        onClick={() => deleteReward(rIdx)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo Específico según Tipo de Recompensa */}
                  {reward.type === 'item' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <ItemThumbnail icon={reward.item} altText="Reward item" />
                        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                            value={typeof reward.item === 'string' ? reward.item : (reward.item?.id || '')} 
                            placeholder="Item (ej. minecraft:diamond)"
                            onChange={(e) => {
                              if (typeof reward.item === 'object' && reward.item !== null) {
                                updateRewardField(rIdx, 'item', { ...reward.item, id: e.target.value });
                              } else {
                                updateRewardField(rIdx, 'item', e.target.value);
                              }
                            }}
                          />
                          <button 
                            className="btn-icon" 
                            title="Explorar ítems en catálogo de texturas"
                            onClick={() => onOpenTexturePicker('icon', (selectedPath) => {
                              if (typeof reward.item === 'object' && reward.item !== null) {
                                updateRewardField(rIdx, 'item', { ...reward.item, id: selectedPath });
                              } else {
                                updateRewardField(rIdx, 'item', selectedPath);
                              }
                            })}
                            style={{ color: 'var(--accent-color)', background: 'rgba(255,255,255,0.06)' }}
                          >
                            <Search size={14} />
                          </button>
                        </div>
                        <div style={{ width: '65px' }}>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ fontSize: '0.8rem', padding: '5px 8px', textAlign: 'center' }}
                            value={getDValue(reward.count) || 1} 
                            min={1}
                            placeholder="Cant."
                            title="Cantidad entregada"
                            onChange={(e) => updateRewardField(rIdx, 'count', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>

                      {/* Opciones de entrega auto y bono */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Entrega:</label>
                          <select 
                            className="input-field"
                            style={{ fontSize: '0.76rem', padding: '2px 6px', height: '26px' }}
                            value={reward.auto || 'default'}
                            onChange={(e) => updateRewardField(rIdx, 'auto', e.target.value === 'default' ? undefined : e.target.value)}
                          >
                            <option value="default">Por Defecto</option>
                            <option value="enabled">Automática (Auto)</option>
                            <option value="disabled">Reclamar Manual</option>
                            <option value="invisible">Invisible</option>
                            <option value="no_toast">Sin Toast</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Bono extra:</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            style={{ fontSize: '0.76rem', padding: '2px 6px', height: '26px', textAlign: 'center' }}
                            value={reward.random_bonus || 0}
                            min={0}
                            placeholder="0"
                            title="Bono aleatorio extra (random_bonus)"
                            onChange={(e) => updateRewardField(rIdx, 'random_bonus', parseInt(e.target.value) || undefined)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {reward.type === 'xp' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Puntos de XP:</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                        value={getDValue(reward.xp) || 10} 
                        onChange={(e) => updateRewardField(rIdx, 'xp', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  {reward.type === 'xp_levels' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Niveles completos de XP:</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                        value={getDValue(reward.xp_levels) || 1} 
                        onChange={(e) => updateRewardField(rIdx, 'xp_levels', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  {reward.type === 'command' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ fontSize: '0.8rem', padding: '5px 8px', fontFamily: 'monospace' }}
                        value={reward.command || ''} 
                        placeholder="/comando @p ... (sin barra o con barra)"
                        onChange={(e) => updateRewardField(rIdx, 'command', e.target.value)}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          style={{ fontSize: '0.76rem', padding: '4px 6px' }}
                          value={reward.title || ''} 
                          placeholder="Título / Nombre del comando"
                          onChange={(e) => updateRewardField(rIdx, 'title', e.target.value || undefined)}
                        />
                        <select 
                          className="input-field"
                          style={{ fontSize: '0.76rem', padding: '2px 6px', height: '28px' }}
                          value={reward.auto || 'default'}
                          onChange={(e) => updateRewardField(rIdx, 'auto', e.target.value === 'default' ? undefined : e.target.value)}
                        >
                          <option value="default">Por Defecto</option>
                          <option value="enabled">Automático (Auto)</option>
                          <option value="disabled">Reclamar Manual</option>
                          <option value="invisible">Invisible</option>
                          <option value="no_toast">Sin Toast</option>
                        </select>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={!!reward.elevate_perms}
                          onChange={(e) => updateRewardField(rIdx, 'elevate_perms', e.target.checked ? true : undefined)}
                        />
                        <span>Elevar permisos (ejecutar como consola / operador)</span>
                      </label>
                    </div>
                  )}

                  {(reward.type === 'random' || reward.type === 'loot') && (() => {
                    const currentTableVal = String(reward.table_id?.value ?? reward.table_id ?? reward.table ?? '');
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {rewardTables.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select
                              className="input-field"
                              style={{ fontSize: '0.78rem', height: '30px', flex: 1 }}
                              value={currentTableVal}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                  updateRewardField(rIdx, 'table_id', selectedId);
                                }
                              }}
                            >
                              <option value="">-- Seleccionar Tabla de Recompensas ({rewardTables.length}) --</option>
                              {rewardTables.map(tbl => (
                                <option key={tbl.id} value={tbl.id}>
                                  🎁 {tbl.title} (#{tbl.id.slice(0, 8)}...)
                                </option>
                              ))}
                            </select>
                            {onOpenRewardTableModal && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0 8px', height: '30px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={onOpenRewardTableModal}
                                title="Abrir Gestor de Tablas de Recompensas"
                              >
                                <Gift size={13} style={{ color: '#f59e0b' }} />
                                <span>Tablas</span>
                              </button>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ID / Ruta:</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            style={{ fontSize: '0.8rem', padding: '4px 8px', fontFamily: 'monospace' }}
                            value={currentTableVal} 
                            placeholder="ID hexadecimal (ej. 51D981D0B7A98548)"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d+$/.test(val)) {
                                updateRewardField(rIdx, 'table_id', { __type: 'number', value: parseInt(val), suffix: 'L' });
                              } else {
                                updateRewardField(rIdx, 'table_id', val);
                              }
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Entrega:</label>
                          <select 
                            className="input-field"
                            style={{ fontSize: '0.76rem', padding: '2px 6px', height: '26px' }}
                            value={reward.auto || 'default'}
                            onChange={(e) => updateRewardField(rIdx, 'auto', e.target.value === 'default' ? undefined : e.target.value)}
                          >
                            <option value="default">Por Defecto</option>
                            <option value="enabled">Automática</option>
                            <option value="disabled">Reclamar Manual</option>
                            <option value="invisible">Invisible</option>
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tagPickerState.isOpen && (
        <ItemTagPickerModal
          isOpen={tagPickerState.isOpen}
          currentTag={tagPickerState.currentTag}
          onSelectTag={(selectedTag) => {
            updateTaskField(tagPickerState.taskIndex, 'item', selectedTag);
            setTagPickerState({ isOpen: false, taskIndex: -1, currentTag: '' });
          }}
          onClose={() => setTagPickerState({ isOpen: false, taskIndex: -1, currentTag: '' })}
        />
      )}

      {/* Datalists para autocompletado nativo */}
      <datalist id="minecraft-entities-datalist">
        {MINECRAFT_ENTITIES.map((ent) => (
          <option key={ent.id} value={ent.id}>{ent.name} {ent.category ? `(${ent.category})` : ''}</option>
        ))}
      </datalist>

      <datalist id="minecraft-biomes-datalist">
        {MINECRAFT_BIOMES.map((b) => (
          <option key={b.id} value={b.id}>{b.name} {b.category ? `(${b.category})` : ''}</option>
        ))}
      </datalist>

      <datalist id="minecraft-structures-datalist">
        {MINECRAFT_STRUCTURES.map((s) => (
          <option key={s.id} value={s.id}>{s.name} {s.category ? `(${s.category})` : ''}</option>
        ))}
      </datalist>

      <datalist id="minecraft-dimensions-datalist">
        {MINECRAFT_DIMENSIONS.map((d) => (
          <option key={d.id} value={d.id}>{d.name} {d.category ? `(${d.category})` : ''}</option>
        ))}
      </datalist>

      <datalist id="gamestages-datalist">
        {GAMESTAGE_PRESETS.map((st) => (
          <option key={st.id} value={st.id}>{st.name} {st.category ? `(${st.category})` : ''}</option>
        ))}
      </datalist>

    </div>
  );
};
