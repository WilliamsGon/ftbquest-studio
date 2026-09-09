/**
 * QuestSimulatorModal.tsx
 *
 * Interfaz gráfica del Simulador de Progresión y Playtesting de Jugador.
 * Permite monitorear el progreso del jugador virtual:
 * - KPIs de misiones completadas / desbloqueadas / bloqueadas.
 * - Inventario virtual acumulado con renderizado 3D de bloques y 2D de ítems.
 * - Registro de experiencia (Puntos y Niveles).
 * - Probador en vivo de Tiradas de Tablas de Recompensas (Loot Roller).
 * - Historial paso a paso de progresión y recompensas otorgadas.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Play, RotateCcw, Backpack, Sparkles, CheckCircle2, 
  Dices, History, ChevronRight, FastForward
} from 'lucide-react';
import type { SimulatorState } from '../utils/questSimulatorEngine';
import { rollRewardTableItem } from '../utils/questSimulatorEngine';
import { QuestItemThumbnail } from '../utils/textureHelper';
import type { RewardTable } from '../types/rewardTable';

interface QuestSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulatorState: SimulatorState;
  allQuests: any[];
  rewardTables: RewardTable[];
  onReset: () => void;
  onCompleteAllAvailable: () => void;
  onSelectQuest: (questId: string) => void;
  onManualLootRoll?: (tableName: string, rolledItem: any, count: number) => void;
}

export const QuestSimulatorModal: React.FC<QuestSimulatorModalProps> = ({
  isOpen,
  onClose,
  simulatorState,
  allQuests,
  rewardTables,
  onReset,
  onCompleteAllAvailable,
  onSelectQuest,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'loot_tester'>('inventory');
  const [selectedTableId, setSelectedTableId] = useState<string>(rewardTables[0]?.id || '');
  const [lastRollResult, setLastRollResult] = useState<{ item: any; count: number; title: string } | null>(null);

  if (!isOpen) return null;

  const totalQuests = allQuests.length;
  const completedCount = simulatorState.completedQuestIds.size;
  const progressPercent = totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0;

  const inventoryItems = Object.entries(simulatorState.virtualInventory);

  const handleTestLootRoll = () => {
    const table = rewardTables.find((t) => t.id === selectedTableId);
    if (!table) return;
    const res = rollRewardTableItem(table);
    setLastRollResult(res);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100200,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '980px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: 'var(--surface-color, #181825)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(166, 227, 161, 0.15)',
                border: '1px solid rgba(166, 227, 161, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a6e3a1',
              }}
            >
              <Play size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#cdd6f4', fontWeight: 600 }}>
                  Simulador de Progresión & Playtesting
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(166, 227, 161, 0.15)',
                    color: '#a6e3a1',
                    border: '1px solid rgba(166, 227, 161, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  MODO JUGADOR ACTIVO
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a6adc8)' }}>
                Verifica el flujo de desbloqueos, economía de recompensas e inventario virtual del modpack
              </span>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            title="Cerrar ventana del simulador"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px',
              color: '#cdd6f4',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dashboard de KPIs del Jugador */}
        <div
          style={{
            padding: '14px 22px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr auto',
            gap: '14px',
            alignItems: 'center',
          }}
        >
          {/* Barra de Progreso General */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
              <span style={{ color: '#cdd6f4', fontWeight: 600 }}>Progreso del Capítulo:</span>
              <span style={{ color: '#a6e3a1', fontWeight: 700 }}>
                {completedCount} / {totalQuests} ({progressPercent}%)
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #89b4fa, #a6e3a1)',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Experiencia y Niveles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Sparkles size={20} style={{ color: '#55ff55' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#55ff55' }}>
                Nivel {simulatorState.virtualXpLevels} ({simulatorState.virtualXp} XP)
              </div>
              <div style={{ fontSize: '0.68rem', color: '#a6adc8' }}>Experiencia acumulada</div>
            </div>
          </div>

          {/* Total Ítems Recolectados */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Backpack size={20} style={{ color: '#f9e2af' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f9e2af' }}>
                {inventoryItems.length} tipos de ítems
              </div>
              <div style={{ fontSize: '0.68rem', color: '#a6adc8' }}>
                {inventoryItems.reduce((acc, [, v]) => acc + v.count, 0)} unidades en total
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={onCompleteAllAvailable}
              title="Completa todas las misiones que ya están desbloqueadas"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FastForward size={14} /> Desbloquear Listas
            </button>
            <button
              className="btn btn-secondary"
              onClick={onReset}
              title="Reinicia la partida simulada a cero"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#f38ba8' }}
            >
              <RotateCcw size={14} /> Reiniciar
            </button>
          </div>
        </div>

        {/* Pestañas del Simulador */}
        <div
          style={{
            display: 'flex',
            padding: '0 22px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'inventory' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'inventory' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Backpack size={15} /> Inventario Virtual ({inventoryItems.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'history' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={15} /> Historial de Progresión ({simulatorState.history.length})
          </button>

          <button
            onClick={() => setActiveTab('loot_tester')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'loot_tester' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'loot_tester' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Dices size={15} /> Tiradas de Tablas de Recompensas ({rewardTables.length})
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {/* PESTAÑA: INVENTARIO VIRTUAL */}
          {activeTab === 'inventory' && (
            <div>
              {inventoryItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#a6adc8' }}>
                  <Backpack size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>
                    Tu inventario virtual de playtesting está vacío.
                  </p>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    Haz clic sobre cualquier misión desbloqueada en el lienzo para completarla y recibir sus recompensas.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {inventoryItems.map(([itemId, itemData]) => (
                    <div
                      key={itemId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      <QuestItemThumbnail icon={itemData.icon || itemId} size={32} />
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#cdd6f4',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={itemData.title || itemId}
                        >
                          {itemData.title || itemId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a6e3a1', fontWeight: 700 }}>
                          x{itemData.count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: HISTORIAL */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {simulatorState.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#a6adc8' }}>
                  <History size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.95rem', margin: '0 0 6px 0' }}>
                    Aún no se ha completado ninguna misión en esta sesión.
                  </p>
                </div>
              ) : (
                simulatorState.history.map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={18} style={{ color: '#a6e3a1' }} />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cdd6f4' }}>
                          {entry.questTitle}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#a6adc8' }}>
                          ID: {entry.questId} • Recompensas:{' '}
                          {entry.rewards.length === 0 ? 'Sin recompensas' : `${entry.rewards.length} entregadas`}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        onSelectQuest(entry.questId);
                        onClose();
                      }}
                      style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Ver en Lienzo <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PESTAÑA: TESTER DE LOOT TABLES */}
          {activeTab === 'loot_tester' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#a6adc8', marginBottom: '6px' }}>
                    Seleccionar Tabla de Recompensas a probar:
                  </label>
                  <select
                    className="input-field"
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {rewardTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title || t.id} ({t.rewards?.length || 0} recompensas configuradas)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleTestLootRoll}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '20px',
                  }}
                >
                  <Dices size={18} /> Probar Tirada Ponderada
                </button>
              </div>

              {lastRollResult && (
                <div
                  style={{
                    background: 'rgba(166, 227, 161, 0.08)',
                    border: '1px solid rgba(166, 227, 161, 0.3)',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <QuestItemThumbnail icon={lastRollResult.item} size={48} />
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#a6e3a1', fontWeight: 600, textTransform: 'uppercase' }}>
                      Resultado obtenido de la tirada
                    </div>
                    <div style={{ fontSize: '1.15rem', color: '#cdd6f4', fontWeight: 700 }}>
                      {lastRollResult.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a6adc8' }}>
                      Cantidad otorgada: x{lastRollResult.count}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a6adc8)' }}>
            💡 En el lienzo de misiones, haz clic en cualquier nodo para simular su cumplimiento o reversión.
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
