import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Plus, Trash2, Copy, Download, Upload, Search, 
  Sparkles, Gift, Package, Layers, Check, AlertCircle 
} from 'lucide-react';
import type { RewardTable, RewardTableEntry } from '../types/rewardTable';
import { rewardTableToSNBT, snbtToRewardTable } from '../types/rewardTable';

interface RewardTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardTables: RewardTable[];
  onSaveRewardTables?: (tables: RewardTable[]) => void;
  onUpdateRewardTables?: (tables: RewardTable[]) => void;
  onOpenTexturePicker: (targetType: string, onSelect: (val: string) => void) => void;
}

const generateHexId = () => 
  Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

const PROBABILITY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#e11d48'
];

export const RewardTableModal: React.FC<RewardTableModalProps> = ({
  isOpen,
  onClose,
  rewardTables: initialRewardTables,
  onSaveRewardTables,
  onUpdateRewardTables,
  onOpenTexturePicker
}) => {
  const saveCallback = onSaveRewardTables || onUpdateRewardTables;
  const [tables, setTables] = useState<RewardTable[]>(() => {
    if (initialRewardTables.length > 0) return JSON.parse(JSON.stringify(initialRewardTables));
    // Si no hay tablas, crear una por defecto
    const defaultTable: RewardTable = {
      id: generateHexId(),
      filename: 'recompensas_comunes',
      order_index: 0,
      title: 'Recompensas Comunes',
      icon: 'minecraft:chest',
      loot_size: 1,
      empty_weight: 0,
      rewards: [
        { id: generateHexId(), type: 'item', item: 'minecraft:iron_ingot', count: 8, weight: 10.0 },
        { id: generateHexId(), type: 'item', item: 'minecraft:gold_ingot', count: 4, weight: 5.0 },
        { id: generateHexId(), type: 'item', item: 'minecraft:diamond', count: 1, weight: 1.0 },
        { id: generateHexId(), type: 'xp', xp: 50, weight: 8.0 }
      ]
    };
    return [defaultTable];
  });

  const [selectedTableId, setSelectedTableId] = useState<string>(() => tables[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentTable = tables.find(t => t.id === selectedTableId) || tables[0];

  // Cálculo de pesos y probabilidades
  const totalWeight = useMemo(() => {
    if (!currentTable) return 0;
    const rewardsWeight = currentTable.rewards.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
    const emptyWeight = Number(currentTable.empty_weight) || 0;
    return rewardsWeight + emptyWeight;
  }, [currentTable]);

  const updateCurrentTable = (updates: Partial<RewardTable>) => {
    if (!currentTable) return;
    setTables(prev => prev.map(t => t.id === currentTable.id ? { ...t, ...updates } : t));
  };

  const handleAddNewTable = () => {
    const newId = generateHexId();
    const newTable: RewardTable = {
      id: newId,
      filename: `tabla_${tables.length + 1}`,
      order_index: tables.length,
      title: `Nueva Tabla ${tables.length + 1}`,
      icon: 'minecraft:chest',
      loot_size: 1,
      empty_weight: 0,
      rewards: [
        { id: generateHexId(), type: 'item', item: 'minecraft:iron_ingot', count: 4, weight: 1.0 }
      ]
    };
    setTables(prev => [...prev, newTable]);
    setSelectedTableId(newId);
  };

  const handleDuplicateTable = (tableToDup: RewardTable, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = generateHexId();
    const duplicated: RewardTable = {
      ...JSON.parse(JSON.stringify(tableToDup)),
      id: newId,
      filename: `${tableToDup.filename || 'tabla'}_copia`,
      title: `${tableToDup.title} (Copia)`,
      order_index: tables.length,
      rewards: tableToDup.rewards.map(r => ({ ...r, id: generateHexId() }))
    };
    setTables(prev => [...prev, duplicated]);
    setSelectedTableId(newId);
  };

  const handleDeleteTable = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tables.length <= 1) {
      alert('Debes mantener al menos una tabla de recompensas.');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar esta tabla de recompensas?')) return;
    const nextTables = tables.filter(t => t.id !== idToDelete);
    setTables(nextTables);
    if (selectedTableId === idToDelete) {
      setSelectedTableId(nextTables[0]?.id || '');
    }
  };

  const handleAddRewardEntry = () => {
    if (!currentTable) return;
    const newEntry: RewardTableEntry = {
      id: generateHexId(),
      type: 'item',
      item: 'minecraft:bread',
      count: 1,
      weight: 1.0
    };
    updateCurrentTable({
      rewards: [...currentTable.rewards, newEntry]
    });
  };

  const updateRewardEntry = (index: number, updates: Partial<RewardTableEntry>) => {
    if (!currentTable) return;
    const newRewards = [...currentTable.rewards];
    newRewards[index] = { ...newRewards[index], ...updates };
    updateCurrentTable({ rewards: newRewards });
  };

  const handleDeleteRewardEntry = (index: number) => {
    if (!currentTable) return;
    const newRewards = currentTable.rewards.filter((_, i) => i !== index);
    updateCurrentTable({ rewards: newRewards });
  };

  const handleExportSingleSNBT = () => {
    if (!currentTable) return;
    const snbt = rewardTableToSNBT(currentTable);
    const blob = new Blob([snbt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTable.filename || currentTable.id}.snbt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSNBT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = snbtToRewardTable(content, file.name.replace(/\.snbt$/i, ''));
          setTables(prev => {
            const existingIdx = prev.findIndex(t => t.id === imported.id);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = imported;
              return updated;
            }
            return [...prev, imported];
          });
          setSelectedTableId(imported.id);
        } catch (err) {
          console.error('Error al importar reward_table:', err);
          alert(`Error al procesar ${file.name}. Formato SNBT inválido.`);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleSaveAndClose = () => {
    saveCallback?.(tables);
    onClose();
  };

  const filteredTables = tables.filter(t => 
    t.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
    t.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        className="glass-panel" 
        style={{ 
          width: '94%', 
          maxWidth: '1100px', 
          height: '85vh', 
          maxHeight: '850px',
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: '16px',
          border: '1px solid var(--panel-border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Cabecera Principal */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Gift size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Gestor de Tablas de Recompensas (reward_tables)
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Crea cajas de botín (Loot Crates) y tablas con probabilidades ponderadas para misiones
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Importar .snbt
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".snbt" 
              multiple 
              onChange={handleImportSNBT} 
            />

            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }} onClick={handleSaveAndClose}>
              <Check size={14} /> Guardar Tablas
            </button>

            <button 
              className="btn-icon" 
              style={{ padding: '6px', color: 'var(--text-secondary)' }} 
              onClick={onClose}
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo Dividido en 2 Columnas */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Panel Izquierdo: Lista de Tablas */}
          <div style={{ 
            width: '300px', 
            borderRight: '1px solid rgba(255,255,255,0.08)', 
            display: 'flex', 
            flexDirection: 'column',
            background: 'rgba(0,0,0,0.15)'
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ fontSize: '0.78rem', height: '32px', paddingLeft: '28px' }}
                    placeholder="Buscar tabla..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: 'var(--text-secondary)' }} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0 10px', height: '32px', fontSize: '0.78rem' }}
                  onClick={handleAddNewTable}
                  title="Crear nueva tabla de recompensas"
                >
                  <Plus size={15} />
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {filteredTables.length} tabla{filteredTables.length !== 1 ? 's' : ''} disponible{filteredTables.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {filteredTables.map(t => {
                const isSelected = t.id === currentTable?.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTableId(t.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(123, 97, 255, 0.18)' : 'transparent',
                      border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    className="reward-table-list-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {t.title || 'Sin Título'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          style={{ padding: '2px', color: 'var(--text-secondary)' }}
                          title="Duplicar tabla"
                          onClick={(e) => handleDuplicateTable(t, e)}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ padding: '2px', color: '#f38ba8' }}
                          title="Eliminar tabla"
                          onClick={(e) => handleDeleteTable(t.id, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontFamily: 'monospace' }}>#{t.id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{t.rewards.length} ítem{t.rewards.length !== 1 ? 's' : ''}</span>
                      {t.loot_crate && (
                        <span style={{ 
                          background: 'rgba(245, 158, 11, 0.2)', 
                          color: '#f59e0b', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700 
                        }}>
                          CRATE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Derecho: Editor de la Tabla Activa */}
          {currentTable ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sección 1: Metadatos Básicos */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} className="text-accent" /> Propiedades de la Tabla
                  </h3>
                  <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '4px 10px', height: '28px', gap: '6px' }}
                    onClick={handleExportSingleSNBT}
                    title="Descargar esta tabla individual en formato .snbt"
                  >
                    <Download size={13} /> Exportar .snbt
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Título de la Tabla</label>
                    <input
                      type="text"
                      className="input-field"
                      value={currentTable.title}
                      onChange={(e) => updateCurrentTable({ title: e.target.value })}
                      placeholder="Ej. Recompensas Mágicas"
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label>ID Hexadecimal</label>
                    <input
                      type="text"
                      className="input-field"
                      value={currentTable.id}
                      onChange={(e) => updateCurrentTable({ id: e.target.value.toUpperCase() })}
                      style={{ fontFamily: 'monospace' }}
                      maxLength={16}
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Nombre de archivo (.snbt)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={currentTable.filename || ''}
                      onChange={(e) => updateCurrentTable({ filename: e.target.value })}
                      placeholder="recompensas_comunes"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Ícono (Item / Textura)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        className="input-field"
                        value={typeof currentTable.icon === 'string' ? currentTable.icon : (currentTable.icon?.id || '')}
                        onChange={(e) => updateCurrentTable({ icon: e.target.value })}
                        placeholder="minecraft:chest"
                      />
                      <button
                        className="btn-icon"
                        title="Explorar en catálogo de texturas"
                        onClick={() => onOpenTexturePicker('icon', (val) => updateCurrentTable({ icon: val }))}
                        style={{ color: 'var(--accent-color)', background: 'rgba(255,255,255,0.06)' }}
                      >
                        <Search size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Tiradas (loot_size)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="input-field"
                      value={currentTable.loot_size ?? 1}
                      onChange={(e) => updateCurrentTable({ loot_size: parseInt(e.target.value) || 1 })}
                      title="Cantidad de ítems que se entregan al abrir la caja o cobrar recompensa"
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Peso Vacío (empty_weight)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      className="input-field"
                      value={currentTable.empty_weight ?? 0}
                      onChange={(e) => updateCurrentTable({ empty_weight: parseFloat(e.target.value) || 0 })}
                      title="Probabilidad de no obtener nada (0 = siempre entrega algo)"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={currentTable.hide_tooltip === true}
                      onChange={(e) => updateCurrentTable({ hide_tooltip: e.target.checked })}
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    <span>Ocultar tooltip en juego (<code>hide_tooltip</code>)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={currentTable.use_title === true}
                      onChange={(e) => updateCurrentTable({ use_title: e.target.checked })}
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    <span>Mostrar título de la tabla (<code>use_title</code>)</span>
                  </label>
                </div>
              </div>

              {/* Sección 2: Barra de Probabilidades Ponderadas y Distribución */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: '#fbbf24' }} /> Probabilidades en Tiempo Real (Total Peso: {totalWeight.toFixed(1)})
                  </h3>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '5px 12px', gap: '6px' }}
                    onClick={handleAddRewardEntry}
                  >
                    <Plus size={14} /> Añadir Recompensa al Pool
                  </button>
                </div>

                {/* Barra Visual de Probabilidad Segmentada */}
                <div style={{
                  height: '14px',
                  borderRadius: '7px',
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  display: 'flex',
                  margin: '12px 0 16px 0',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                }}>
                  {totalWeight > 0 ? (
                    currentTable.rewards.map((r, i) => {
                      const pct = ((Number(r.weight) || 0) / totalWeight) * 100;
                      if (pct <= 0) return null;
                      const color = PROBABILITY_COLORS[i % PROBABILITY_COLORS.length];
                      return (
                        <div
                          key={r.id || i}
                          style={{
                            width: `${pct}%`,
                            background: color,
                            transition: 'width 0.2s ease'
                          }}
                          title={`${r.type === 'item' ? (typeof r.item === 'string' ? r.item : r.item?.id) : r.type}: ${pct.toFixed(1)}%`}
                        />
                      );
                    })
                  ) : (
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  {Number(currentTable.empty_weight) > 0 && totalWeight > 0 && (
                    <div
                      style={{
                        width: `${((Number(currentTable.empty_weight) / totalWeight) * 100)}%`,
                        background: '#64748b'
                      }}
                      title={`Vacío (Nada): ${((Number(currentTable.empty_weight) / totalWeight) * 100).toFixed(1)}%`}
                    />
                  )}
                </div>

                {/* Lista de Recompensas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentTable.rewards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      No hay recompensas en esta tabla. Presiona "+ Añadir Recompensa al Pool" para empezar.
                    </div>
                  ) : (
                    currentTable.rewards.map((reward, idx) => {
                      const pct = totalWeight > 0 ? (((Number(reward.weight) || 0) / totalWeight) * 100).toFixed(1) : '0.0';
                      const color = PROBABILITY_COLORS[idx % PROBABILITY_COLORS.length];

                      return (
                        <div
                          key={reward.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderLeft: `4px solid ${color}`,
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        >
                          {/* Tipo */}
                          <div style={{ width: '110px' }}>
                            <select
                              className="input-field"
                              style={{ fontSize: '0.78rem', height: '30px' }}
                              value={reward.type || 'item'}
                              onChange={(e) => updateRewardEntry(idx, { type: e.target.value as any })}
                            >
                              <option value="item">📦 Ítem</option>
                              <option value="xp">🌟 Puntos XP</option>
                              <option value="xp_levels">🆙 Niveles XP</option>
                              <option value="command">💻 Comando</option>
                            </select>
                          </div>

                          {/* Valor según tipo */}
                          <div style={{ flex: 1 }}>
                            {reward.type === 'item' ? (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="text"
                                  className="input-field"
                                  style={{ fontSize: '0.78rem', height: '30px' }}
                                  value={typeof reward.item === 'string' ? reward.item : (reward.item?.id || '')}
                                  placeholder="minecraft:diamond"
                                  onChange={(e) => updateRewardEntry(idx, { item: e.target.value })}
                                />
                                <button
                                  className="btn-icon"
                                  style={{ color: 'var(--accent-color)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px' }}
                                  title="Buscar en catálogo de texturas"
                                  onClick={() => onOpenTexturePicker('icon', (val) => updateRewardEntry(idx, { item: val }))}
                                >
                                  <Search size={13} />
                                </button>
                              </div>
                            ) : reward.type === 'command' ? (
                              <input
                                type="text"
                                className="input-field"
                                style={{ fontSize: '0.78rem', height: '30px', fontFamily: 'monospace' }}
                                value={reward.command || ''}
                                placeholder="/give @p diamond 1"
                                onChange={(e) => updateRewardEntry(idx, { command: e.target.value })}
                              />
                            ) : (
                              <input
                                type="number"
                                min={1}
                                className="input-field"
                                style={{ fontSize: '0.78rem', height: '30px' }}
                                value={reward.type === 'xp_levels' ? (reward.xp_levels || 1) : (reward.xp || 50)}
                                placeholder="Cantidad de XP"
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  if (reward.type === 'xp_levels') {
                                    updateRewardEntry(idx, { xp_levels: val });
                                  } else {
                                    updateRewardEntry(idx, { xp: val });
                                  }
                                }}
                              />
                            )}
                          </div>

                          {/* Cantidad (solo para item) */}
                          {reward.type === 'item' && (
                            <div style={{ width: '70px' }}>
                              <input
                                type="number"
                                min={1}
                                max={64}
                                className="input-field"
                                style={{ fontSize: '0.78rem', height: '30px', textAlign: 'center' }}
                                value={reward.count ?? 1}
                                title="Cantidad de ítems"
                                onChange={(e) => updateRewardEntry(idx, { count: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                          )}

                          {/* Peso (Weight) */}
                          <div style={{ width: '90px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min={0.01}
                              step={0.5}
                              className="input-field"
                              style={{ fontSize: '0.78rem', height: '30px', textAlign: 'center', fontWeight: 600 }}
                              value={reward.weight ?? 1.0}
                              title="Peso ponderado (mayor peso = más probable)"
                              onChange={(e) => updateRewardEntry(idx, { weight: parseFloat(e.target.value) || 0.1 })}
                            />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>w</span>
                          </div>

                          {/* Probabilidad Porcentual Calculada */}
                          <div style={{ width: '80px', textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: Number(pct) > 20 ? '#10b981' : (Number(pct) > 5 ? '#f59e0b' : '#ec4899'),
                              background: 'rgba(255,255,255,0.06)',
                              padding: '4px 8px',
                              borderRadius: '6px'
                            }}>
                              {pct}%
                            </span>
                          </div>

                          {/* Eliminar Recompensa */}
                          <button
                            className="btn-icon"
                            style={{ padding: '6px', color: '#f38ba8' }}
                            title="Eliminar ítem del pool"
                            onClick={() => handleDeleteRewardEntry(idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sección 3: Configuración de Caja de Botín (Loot Crate) */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} className="text-accent" /> Caja de Botín Física (Loot Crate)
                  </h3>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={!!currentTable.loot_crate}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateCurrentTable({
                            loot_crate: {
                              string_id: `${currentTable.filename || 'crate'}_crate`,
                              item_name: `Caja: ${currentTable.title}`,
                              color: 16777215,
                              glow: false,
                              drops: { boss: 0, monster: 0, passive: 0 }
                            }
                          });
                        } else {
                          updateCurrentTable({ loot_crate: undefined });
                        }
                      }}
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    <span>Habilitar como ítem de Crate en Minecraft</span>
                  </label>
                </div>

                {currentTable.loot_crate && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 120px 100px', gap: '10px' }}>
                      <div className="input-group" style={{ margin: 0 }}>
                        <label>String ID (identificador)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={currentTable.loot_crate.string_id}
                          onChange={(e) => updateCurrentTable({
                            loot_crate: { ...currentTable.loot_crate!, string_id: e.target.value }
                          })}
                          placeholder="common_crate"
                        />
                      </div>

                      <div className="input-group" style={{ margin: 0 }}>
                        <label>Nombre del Ítem</label>
                        <input
                          type="text"
                          className="input-field"
                          value={currentTable.loot_crate.item_name}
                          onChange={(e) => updateCurrentTable({
                            loot_crate: { ...currentTable.loot_crate!, item_name: e.target.value }
                          })}
                          placeholder="Caja de Botín"
                        />
                      </div>

                      <div className="input-group" style={{ margin: 0 }}>
                        <label>Color Crate</label>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={`#${(currentTable.loot_crate.color || 16777215).toString(16).padStart(6, '0')}`}
                            onChange={(e) => {
                              const hex = e.target.value.replace('#', '');
                              updateCurrentTable({
                                loot_crate: { ...currentTable.loot_crate!, color: parseInt(hex, 16) }
                              });
                            }}
                            style={{ width: '32px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>
                            #{ (currentTable.loot_crate.color || 16777215).toString(16).toUpperCase() }
                          </span>
                        </div>
                      </div>

                      <div className="input-group" style={{ margin: 0, justifyContent: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '18px', fontSize: '0.78rem' }}>
                          <input
                            type="checkbox"
                            checked={currentTable.loot_crate.glow === true}
                            onChange={(e) => updateCurrentTable({
                              loot_crate: { ...currentTable.loot_crate!, glow: e.target.checked }
                            })}
                            style={{ accentColor: 'var(--accent-color)' }}
                          />
                          <span>Brillo (Glow)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Selecciona o crea una tabla de recompensas para editarla
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
