/**
 * ModpackDoctorModal.tsx
 *
 * Diálogo modal para el Doctor del Modpack & Auditoría de Integridad.
 * Presenta el diagnóstico completo de salud del modpack con:
 * - Puntuación de Salud (0 - 100%) con indicador visual dinámico.
 * - Filtros por severidad (Críticos, Advertencias, Sugerencias, Reparables).
 * - Botón de Auto-reparación en lote con un solo clic.
 * - Acceso directo para saltar a la misión en el lienzo y reparar individualmente.
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ShieldAlert, CheckCircle2, AlertTriangle, Info, Wrench, 
  ChevronRight, Filter
} from 'lucide-react';
import type { ModpackIssue, DoctorDiagnosisReport } from '../utils/modpackDoctor';
import { runModpackDiagnosis, applyDoctorBatchAutoFix } from '../utils/modpackDoctor';
import type { RewardTable } from '../types/rewardTable';

interface ModpackDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: any[];
  rewardTables: RewardTable[];
  activeChapterTitle?: string;
  onUpdateQuests: (newQuests: any[]) => void;
  onSelectQuest: (questId: string) => void;
}

export const ModpackDoctorModal: React.FC<ModpackDoctorModalProps> = ({
  isOpen,
  onClose,
  quests,
  rewardTables,
  activeChapterTitle,
  onUpdateQuests,
  onSelectQuest,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'fixable'>('all');
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  // Ejecutar diagnóstico reactivamente
  const report: DoctorDiagnosisReport = useMemo(() => {
    return runModpackDiagnosis(quests, rewardTables, activeChapterTitle);
  }, [quests, rewardTables, activeChapterTitle]);

  if (!isOpen) return null;

  const filteredIssues = report.issues.filter((issue) => {
    if (severityFilter === 'all') return true;
    if (severityFilter === 'fixable') return issue.fixable;
    return issue.severity === severityFilter;
  });

  const handleAutoFixAll = () => {
    const { updatedQuests, fixedCount } = applyDoctorBatchAutoFix(report.issues, quests);
    if (fixedCount > 0) {
      onUpdateQuests(updatedQuests);
      setFixSuccessMsg(`¡Se han auto-reparado con éxito ${fixedCount} inconsistencias en lote!`);
      setTimeout(() => setFixSuccessMsg(null), 4000);
    }
  };

  const handleFixSingleIssue = (issue: ModpackIssue) => {
    const { updatedQuests, fixedCount } = applyDoctorBatchAutoFix([issue], quests);
    if (fixedCount > 0) {
      onUpdateQuests(updatedQuests);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#a6e3a1';
    if (score >= 60) return '#f9e2af';
    return '#f38ba8';
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
          width: '960px',
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
                background: 'rgba(243, 139, 168, 0.15)',
                border: '1px solid rgba(243, 139, 168, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f38ba8',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#cdd6f4', fontWeight: 600 }}>
                Doctor del Modpack & Auditoría de Integridad
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a6adc8)' }}>
                Detección automática de errores tipográficos, dependencias rotas y recompensas defectuosas
              </span>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            title="Cerrar ventana del doctor"
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

        {/* Panel de Puntuación de Salud y KPIs */}
        <div
          style={{
            padding: '16px 22px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          {/* Circular Score Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `4px solid ${getScoreColor(report.healthScore)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: getScoreColor(report.healthScore) }}>
                {report.healthScore}%
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#cdd6f4' }}>
                {report.healthScore >= 85
                  ? 'Salud Excelente del Modpack'
                  : report.healthScore >= 60
                  ? 'Salud Moderada con Advertencias'
                  : 'Requiere Atención Inmediata'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a6adc8' }}>
                {report.totalQuestsScanned} misiones auditadas • {report.issues.length} inconsistencias encontradas
              </div>
            </div>
          </div>

          {/* Botón de Auto-reparación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {report.counts.fixable > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleAutoFixAll}
                style={{
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#a6e3a1',
                  color: '#11111b',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(166, 227, 161, 0.25)',
                }}
              >
                <Wrench size={16} /> Auto-Reparar ({report.counts.fixable} reparables)
              </button>
            )}
          </div>
        </div>

        {/* Mensaje de éxito de reparación */}
        {fixSuccessMsg && (
          <div
            style={{
              padding: '10px 22px',
              background: 'rgba(166, 227, 161, 0.15)',
              borderBottom: '1px solid rgba(166, 227, 161, 0.3)',
              color: '#a6e3a1',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} /> {fixSuccessMsg}
          </div>
        )}

        {/* Barra de Filtros */}
        <div
          style={{
            display: 'flex',
            padding: '10px 22px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#a6adc8', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={13} /> Filtrar:
          </span>

          <button
            className={`btn ${severityFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSeverityFilter('all')}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Todos ({report.issues.length})
          </button>

          <button
            className={`btn ${severityFilter === 'error' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSeverityFilter('error')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: severityFilter === 'error' ? undefined : '#f38ba8' }}
          >
            Críticos ({report.counts.critical})
          </button>

          <button
            className={`btn ${severityFilter === 'warning' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSeverityFilter('warning')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: severityFilter === 'warning' ? undefined : '#f9e2af' }}
          >
            Advertencias ({report.counts.warnings})
          </button>

          <button
            className={`btn ${severityFilter === 'info' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSeverityFilter('info')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: severityFilter === 'info' ? undefined : '#89b4fa' }}
          >
            Sugerencias ({report.counts.suggestions})
          </button>

          <button
            className={`btn ${severityFilter === 'fixable' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSeverityFilter('fixable')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: severityFilter === 'fixable' ? undefined : '#a6e3a1' }}
          >
            Auto-reparables ({report.counts.fixable})
          </button>
        </div>

        {/* Lista de Inconsistencias */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredIssues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a6adc8' }}>
              <CheckCircle2 size={48} style={{ color: '#a6e3a1', marginBottom: '14px', opacity: 0.8 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#cdd6f4', fontSize: '1.1rem' }}>
                ¡Excelente! No se encontraron problemas en esta categoría
              </h3>
              <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.7 }}>
                Todas las tareas, recompensas y dependencias cumplen con los estándares de integridad.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const severityBadge =
                issue.severity === 'error'
                  ? { label: 'CRÍTICO', bg: 'rgba(243, 139, 168, 0.15)', color: '#f38ba8', border: 'rgba(243, 139, 168, 0.3)' }
                  : issue.severity === 'warning'
                  ? { label: 'ADVERTENCIA', bg: 'rgba(249, 226, 175, 0.15)', color: '#f9e2af', border: 'rgba(249, 226, 175, 0.3)' }
                  : { label: 'SUGERENCIA', bg: 'rgba(137, 180, 250, 0.15)', color: '#89b4fa', border: 'rgba(137, 180, 250, 0.3)' };

              return (
                <div
                  key={issue.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    <div style={{ marginTop: '2px' }}>
                      {issue.severity === 'error' ? (
                        <ShieldAlert size={18} style={{ color: '#f38ba8' }} />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle size={18} style={{ color: '#f9e2af' }} />
                      ) : (
                        <Info size={18} style={{ color: '#89b4fa' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: severityBadge.bg,
                            color: severityBadge.color,
                            border: `1px solid ${severityBadge.border}`,
                          }}
                        >
                          {severityBadge.label}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cdd6f4' }}>
                          {issue.title}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#a6adc8', marginBottom: '4px', lineHeight: '1.4' }}>
                        {issue.description}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #6c7086)' }}>
                        Misión: <strong style={{ color: '#bac2de' }}>{issue.questTitle}</strong> (ID: {issue.questId})
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la Inconsistencia */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {issue.fixable && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleFixSingleIssue(issue)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#a6e3a1',
                        }}
                        title="Reparar esta inconsistencia automáticamente"
                      >
                        <Wrench size={13} /> Reparar
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        onSelectQuest(issue.questId);
                        onClose();
                      }}
                      style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Seleccionar y centrar misión en el lienzo"
                    >
                      Ir a Misión <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
