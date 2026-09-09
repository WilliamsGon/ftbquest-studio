import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check, Layers } from 'lucide-react';

export interface QuestBatchConfig {
  shape?: string;
  size?: number;
  hide_dependency_lines?: boolean;
  optional?: boolean;
  invisible?: boolean;
  hide_until_deps_complete?: boolean;
  can_repeat?: boolean;
  disable_toast?: boolean;
  dependency_requirement?: 'all_completed' | 'one_completed' | 'one_started';
  addTag?: string;
}

export interface TaskBatchConfig {
  consume_items?: boolean;
  countMode?: 'set' | 'multiply' | 'add';
  countValue?: number;
  ignore_damage?: boolean;
  match_nbt?: boolean;
}

export interface RewardBatchConfig {
  team_reward?: boolean;
  auto?: 'no_toast' | 'invisible' | 'default';
  exclude_from_claim_all?: boolean;
  only_one?: boolean;
  countMode?: 'set' | 'multiply' | 'add';
  countValue?: number;
}

interface TableBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subTab: 'quests' | 'tasks' | 'rewards';
  selectedCount: number;
  totalFilteredCount: number;
  onApplyQuestBatch: (config: QuestBatchConfig, scope: 'selected' | 'all_filtered') => void;
  onApplyTaskBatch: (config: TaskBatchConfig, scope: 'selected' | 'all_filtered') => void;
  onApplyRewardBatch: (config: RewardBatchConfig, scope: 'selected' | 'all_filtered') => void;
}

const QUEST_SHAPES = [
  { value: '', label: 'Por defecto (del capítulo)' },
  { value: 'circle', label: 'Círculo (circle)' },
  { value: 'square', label: 'Cuadrado (square)' },
  { value: 'diamond', label: 'Diamante (diamond)' },
  { value: 'hexagon', label: 'Hexágono (hexagon)' },
  { value: 'octagon', label: 'Octágono (octagon)' },
  { value: 'gear', label: 'Engranaje (gear)' },
  { value: 'heart', label: 'Corazón (heart)' },
  { value: 'pentagon', label: 'Pentágono (pentagon)' }
];

export const TableBatchModal: React.FC<TableBatchModalProps> = ({
  isOpen,
  onClose,
  subTab,
  selectedCount,
  totalFilteredCount,
  onApplyQuestBatch,
  onApplyTaskBatch,
  onApplyRewardBatch
}) => {
  const [scope, setScope] = useState<'selected' | 'all_filtered'>(selectedCount > 0 ? 'selected' : 'all_filtered');

  // Quests batch form
  const [qShape, setQShape] = useState<string>('__keep__');
  const [qSize, setQSize] = useState<string>('__keep__');
  const [qHideDeps, setQHideDeps] = useState<string>('__keep__');
  const [qOptional, setQOptional] = useState<string>('__keep__');
  const [qInvisible, setQInvisible] = useState<string>('__keep__');
  const [qHideUntilDeps, setQHideUntilDeps] = useState<string>('__keep__');
  const [qCanRepeat, setQCanRepeat] = useState<string>('__keep__');
  const [qDisableToast, setQDisableToast] = useState<string>('__keep__');
  const [qDepReq, setQDepReq] = useState<string>('__keep__');
  const [qAddTag, setQAddTag] = useState<string>('');

  // Tasks batch form
  const [tConsume, setTConsume] = useState<string>('__keep__');
  const [tCountMode, setTCountMode] = useState<'none' | 'set' | 'multiply' | 'add'>('none');
  const [tCountVal, setTCountVal] = useState<number>(1);
  const [tIgnoreDamage, setTIgnoreDamage] = useState<string>('__keep__');
  const [tMatchNbt, setTMatchNbt] = useState<string>('__keep__');

  // Rewards batch form
  const [rTeam, setRTeam] = useState<string>('__keep__');
  const [rAuto, setRAuto] = useState<string>('__keep__');
  const [rClaimAll, setRClaimAll] = useState<string>('__keep__');
  const [rOnlyOne, setROnlyOne] = useState<string>('__keep__');
  const [rCountMode, setRCountMode] = useState<'none' | 'set' | 'multiply' | 'add'>('none');
  const [rCountVal, setRCountVal] = useState<number>(1);

  if (!isOpen) return null;

  const targetCount = scope === 'selected' ? selectedCount : totalFilteredCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (subTab === 'quests') {
      const config: QuestBatchConfig = {};
      if (qShape !== '__keep__') config.shape = qShape;
      if (qSize !== '__keep__') config.size = parseFloat(qSize);
      if (qHideDeps !== '__keep__') config.hide_dependency_lines = qHideDeps === 'true';
      if (qOptional !== '__keep__') config.optional = qOptional === 'true';
      if (qInvisible !== '__keep__') config.invisible = qInvisible === 'true';
      if (qHideUntilDeps !== '__keep__') config.hide_until_deps_complete = qHideUntilDeps === 'true';
      if (qCanRepeat !== '__keep__') config.can_repeat = qCanRepeat === 'true';
      if (qDisableToast !== '__keep__') config.disable_toast = qDisableToast === 'true';
      if (qDepReq !== '__keep__') config.dependency_requirement = qDepReq as any;
      if (qAddTag.trim()) config.addTag = qAddTag.trim();

      onApplyQuestBatch(config, scope);
    } else if (subTab === 'tasks') {
      const config: TaskBatchConfig = {};
      if (tConsume !== '__keep__') config.consume_items = tConsume === 'true';
      if (tIgnoreDamage !== '__keep__') config.ignore_damage = tIgnoreDamage === 'true';
      if (tMatchNbt !== '__keep__') config.match_nbt = tMatchNbt === 'true';
      if (tCountMode !== 'none' && !isNaN(tCountVal)) {
        config.countMode = tCountMode;
        config.countValue = tCountVal;
      }

      onApplyTaskBatch(config, scope);
    } else if (subTab === 'rewards') {
      const config: RewardBatchConfig = {};
      if (rTeam !== '__keep__') config.team_reward = rTeam === 'true';
      if (rAuto !== '__keep__') config.auto = rAuto === 'default' ? 'default' : rAuto as any;
      if (rClaimAll !== '__keep__') config.exclude_from_claim_all = rClaimAll === 'true';
      if (rOnlyOne !== '__keep__') config.only_one = rOnlyOne === 'true';
      if (rCountMode !== 'none' && !isNaN(rCountVal)) {
        config.countMode = rCountMode;
        config.countValue = rCountVal;
      }

      onApplyRewardBatch(config, scope);
    }

    onClose();
  };

  const getSubTabLabel = () => {
    if (subTab === 'quests') return 'Misiones';
    if (subTab === 'tasks') return 'Tareas';
    return 'Recompensas';
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: '#181b22',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0'
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#13151a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#ffffff' }}>
                Modificación Masiva: {getSubTabLabel()}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                Aplica cambios por lote a las filas seleccionadas o visibles
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Selector de Alcance (Scope) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                ¿A qué filas deseas aplicar los cambios?
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  disabled={selectedCount === 0}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                    border: '1px solid',
                    borderColor: scope === 'selected' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: scope === 'selected' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: scope === 'selected' ? '#93c5fd' : (selectedCount > 0 ? '#cbd5e1' : '#64748b'),
                    fontWeight: scope === 'selected' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={14} style={{ opacity: scope === 'selected' ? 1 : 0.3 }} />
                  <span>Filas Seleccionadas ({selectedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all_filtered')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: scope === 'all_filtered' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: scope === 'all_filtered' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: scope === 'all_filtered' ? '#93c5fd' : '#cbd5e1',
                    fontWeight: scope === 'all_filtered' ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Layers size={14} style={{ opacity: scope === 'all_filtered' ? 1 : 0.3 }} />
                  <span>Todas las Visibles ({totalFilteredCount})</span>
                </button>
              </div>
            </div>

            {/* Campos de Misiones */}
            {subTab === 'quests' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Forma (Shape):
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qShape}
                    onChange={(e) => setQShape(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    {QUEST_SHAPES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Tamaño (Size):
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qSize}
                    onChange={(e) => setQSize(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="0.75">0.75x (Pequeño)</option>
                    <option value="1.0">1.0x (Normal)</option>
                    <option value="1.25">1.25x (Mediano)</option>
                    <option value="1.5">1.5x (Grande)</option>
                    <option value="2.0">2.0x (Jefe / Hito)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Ocultar Líneas de Conexión:
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qHideDeps}
                    onChange={(e) => setQHideDeps(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Ocultar líneas)</option>
                    <option value="false">No (Mostrar líneas)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Misión Opcional (optional):
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qOptional}
                    onChange={(e) => setQOptional(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Es opcional)</option>
                    <option value="false">No (Obligatoria para capítulo)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Invisible (invisible):
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qInvisible}
                    onChange={(e) => setQInvisible(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Invisible)</option>
                    <option value="false">No (Visible)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Invisible hasta desbloquear:
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qHideUntilDeps}
                    onChange={(e) => setQHideUntilDeps(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Oculta hasta cumplir deps)</option>
                    <option value="false">No (Visible desde el inicio)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Puede repetirse (can_repeat):
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qCanRepeat}
                    onChange={(e) => setQCanRepeat(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Repetible)</option>
                    <option value="false">No (Única vez)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Requisito de dependencias:
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qDepReq}
                    onChange={(e) => setQDepReq(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="all_completed">Completar Todas (all_completed)</option>
                    <option value="one_completed">Completar al menos Una (one_completed)</option>
                    <option value="one_started">Comenzar al menos Una (one_started)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Desactivar Toast / Notificación:
                  </label>
                  <select
                    className="table-select"
                    style={{ width: '100%', height: '32px' }}
                    value={qDisableToast}
                    onChange={(e) => setQDisableToast(e.target.value)}
                  >
                    <option value="__keep__">— Mantener sin cambios —</option>
                    <option value="true">Sí (Silenciosa)</option>
                    <option value="false">No (Mostrar anuncio)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Añadir Etiqueta / Tag (opcional):
                  </label>
                  <input
                    type="text"
                    className="table-input"
                    placeholder="Ej: endgame, boss_tier, chapter1"
                    value={qAddTag}
                    onChange={(e) => setQAddTag(e.target.value)}
                    style={{ width: '100%', height: '32px' }}
                  />
                </div>
              </div>
            )}

            {/* Campos de Tareas */}
            {subTab === 'tasks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Consumir Ítems al entregar:
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={tConsume}
                      onChange={(e) => setTConsume(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Consumir ítems)</option>
                      <option value="false">No (Solo detectar en inventario)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Ignorar Daño / Durabilidad:
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={tIgnoreDamage}
                      onChange={(e) => setTIgnoreDamage(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Ignorar daño)</option>
                      <option value="false">No (Requiere nuevo)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Coincidencia NBT estricta:
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={tMatchNbt}
                      onChange={(e) => setTMatchNbt(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Verificar NBT)</option>
                      <option value="false">No (Cualquier NBT)</option>
                    </select>
                  </div>
                </div>

                {/* Modificador de Cantidad */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    🔢 Modificación de Cantidad Requerida (count):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={tCountMode}
                      onChange={(e) => setTCountMode(e.target.value as any)}
                    >
                      <option value="none">— Sin cambios en cantidad —</option>
                      <option value="set">Fijar cantidad exacta a:</option>
                      <option value="multiply">Multiplicar cantidad actual por:</option>
                      <option value="add">Sumar cantidad actual (+):</option>
                    </select>

                    {tCountMode !== 'none' && (
                      <input
                        type="number"
                        className="table-input"
                        step={tCountMode === 'multiply' ? '0.1' : '1'}
                        min={tCountMode === 'multiply' ? '0.1' : '1'}
                        value={tCountVal}
                        onChange={(e) => setTCountVal(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', height: '32px' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Campos de Recompensas */}
            {subTab === 'rewards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Recompensa de Equipo (team_reward):
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={rTeam}
                      onChange={(e) => setRTeam(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Otorgar a todo el equipo)</option>
                      <option value="false">No (Individual)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Auto-Reclamar (auto):
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={rAuto}
                      onChange={(e) => setRAuto(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="default">Por Defecto (Normal)</option>
                      <option value="no_toast">Sin Toast (no_toast)</option>
                      <option value="invisible">Invisible (invisible)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Excluir de "Reclamar Todo":
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={rClaimAll}
                      onChange={(e) => setRClaimAll(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Excluir)</option>
                      <option value="false">No (Permitir claim all)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '4px' }}>
                      Solo Uno por Equipo (only_one):
                    </label>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={rOnlyOne}
                      onChange={(e) => setROnlyOne(e.target.value)}
                    >
                      <option value="__keep__">— Mantener sin cambios —</option>
                      <option value="true">Sí (Solo uno)</option>
                      <option value="false">No (Todos)</option>
                    </select>
                  </div>
                </div>

                {/* Modificador de Cantidad o XP */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
                    🎁 Modificación de Cantidad / Experiencia:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <select
                      className="table-select"
                      style={{ width: '100%', height: '32px' }}
                      value={rCountMode}
                      onChange={(e) => setRCountMode(e.target.value as any)}
                    >
                      <option value="none">— Sin cambios en cantidad —</option>
                      <option value="set">Fijar cantidad / XP exacta a:</option>
                      <option value="multiply">Multiplicar cantidad actual por:</option>
                      <option value="add">Sumar cantidad / XP (+):</option>
                    </select>

                    {rCountMode !== 'none' && (
                      <input
                        type="number"
                        className="table-input"
                        step={rCountMode === 'multiply' ? '0.1' : '1'}
                        min={rCountMode === 'multiply' ? '0.1' : '1'}
                        value={rCountVal}
                        onChange={(e) => setRCountVal(parseFloat(e.target.value) || 1)}
                        style={{ width: '100%', height: '32px' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pie del modal */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#13151a',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Se modificarán <strong style={{ color: '#60a5fa' }}>{targetCount}</strong> {getSubTabLabel().toLowerCase()}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ padding: '7px 16px', fontSize: '0.8rem' }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={targetCount === 0}
                style={{
                  padding: '7px 18px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  gap: '6px'
                }}
              >
                <Sparkles size={14} />
                <span>Aplicar a {targetCount} {getSubTabLabel()}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
