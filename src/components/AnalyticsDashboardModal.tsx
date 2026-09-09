import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart2, Award, Zap, AlertTriangle, GitBranch, FolderGit2, X, 
  Search, Sparkles, Box, Swords, Layers, ExternalLink, CheckCircle2, 
  PieChart, Coins
} from 'lucide-react';
import type { ChapterTab } from '../types/chapter';
import type { RewardTable } from '../types/rewardTable';
import type { ChapterGroup } from '../types/chapterGroup';
import { calculateModpackAnalytics } from '../utils/questAnalytics';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterTab[];
  rewardTables?: RewardTable[];
  chapterGroups?: ChapterGroup[];
  onNavigateToQuest?: (chapterId: string, questId: string) => void;
}

type TabType = 'overview' | 'distribution' | 'economy' | 'bottlenecks' | 'orphans';

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
  chapters,
  rewardTables = [],
  chapterGroups = [],
  onNavigateToQuest
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const report = useMemo(() => {
    return calculateModpackAnalytics(chapters, rewardTables, chapterGroups);
  }, [chapters, rewardTables, chapterGroups]);

  if (!isOpen) return null;

  const filteredBottlenecks = report.bottlenecks.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrphans = report.orphans.filter(o => 
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '1050px',
          height: '85vh',
          maxHeight: '850px',
          backgroundColor: '#1b1e24',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e0e0e0',
          fontFamily: 'inherit'
        }}
      >
        {/* Cabecera */}
        <div 
          style={{
            padding: '16px 24px',
            backgroundColor: '#16181d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <BarChart2 size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6' }}>
                Tablero de Balance y Analíticas
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                Métricas del modpack, economía, cuellos de botella y detección de misiones aisladas
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas */}
        <div 
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: '#181a20',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'overview' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'overview' ? '#ffffff' : '#9ca3af'
            }}
          >
            <PieChart size={15} /> Resumen General
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'distribution' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'distribution' ? '#ffffff' : '#9ca3af'
            }}
          >
            <FolderGit2 size={15} /> Distribución ({report.chapterDistribution.length})
          </button>
          <button
            onClick={() => setActiveTab('economy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'economy' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'economy' ? '#ffffff' : '#9ca3af'
            }}
          >
            <Coins size={15} /> Economía & Recompensas
          </button>
          <button
            onClick={() => setActiveTab('bottlenecks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'bottlenecks' ? '#eab308' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'bottlenecks' ? '#000000' : '#eab308'
            }}
          >
            <GitBranch size={15} /> Cuellos de Botella ({report.bottlenecks.length})
          </button>
          <button
            onClick={() => setActiveTab('orphans')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'orphans' ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'orphans' ? '#ffffff' : (report.orphans.length > 0 ? '#f87171' : '#9ca3af')
            }}
          >
            <AlertTriangle size={15} /> Misiones Huérfanas ({report.orphans.length})
          </button>
        </div>

        {/* Contenedor del contenido */}
        <div 
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px'
                }}
              >
                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>TOTAL MISIONES</span>
                    <Box size={16} color="#60a5fa" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f3f4f6', margin: '4px 0' }}>{report.totalQuests}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>en {report.totalChapters} capítulos ({report.emptyChaptersCount} vacíos)</div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>ECONOMÍA XP TOTAL</span>
                    <Zap size={16} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                    {report.economy.totalDirectXp.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>XP</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>+ {report.economy.totalXpLevels} niveles de experiencia</div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>CAJAS DE BOTÍN</span>
                    <Sparkles size={16} color="#a855f7" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c084fc', margin: '4px 0' }}>{report.economy.totalLootCratesRewards}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{report.economy.totalRewardTables} tablas ({report.economy.rewardTablesWithCrates} crates)</div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>RATIO ÍTEMS / CAZA</span>
                    <Swords size={16} color="#f97316" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fb923c', margin: '4px 0' }}>
                    {report.economy.killTasksCount === 0 ? `${report.economy.itemTasksCount}:0` : `${report.economy.itemToKillRatio}:1`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{report.economy.itemTasksCount} ítems vs {report.economy.killTasksCount} cacerías</div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>CUELLOS DE BOTELLA</span>
                    <GitBranch size={16} color="#eab308" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#facc15', margin: '4px 0' }}>{report.bottlenecks.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>misiones con múltiples dependientes</div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: report.orphans.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '0.8rem' }}>
                    <span>MISIONES HUÉRFANAS</span>
                    <AlertTriangle size={16} color={report.orphans.length > 0 ? '#ef4444' : '#10b981'} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: report.orphans.length > 0 ? '#f87171' : '#10b981', margin: '4px 0' }}>{report.orphans.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{report.orphans.length > 0 ? 'aisladas sin dependencias' : '¡Todo conectado!'}</div>
                </div>
              </div>

              {/* Panel de diagnóstico */}
              <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#3b82f6" /> Diagnóstico Rápido de Balance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: '#1b1d22', padding: '12px 14px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e5e7eb', marginBottom: '4px' }}>Conectividad de Misiones</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      {report.orphans.length > 0
                        ? `Se detectaron ${report.orphans.length} misiones huérfanas flotando sin conexiones. Revisa la pestaña "Misiones Huérfanas" para unirlas al árbol.`
                        : 'Excelente: no hay misiones huérfanas flotando; todas forman parte de la red de progresión.'}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#1b1d22', padding: '12px 14px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e5e7eb', marginBottom: '4px' }}>Economía de Progreso</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      {report.totalQuests > 0
                        ? `Promedio de XP directa por misión: ${Math.round(report.economy.totalDirectXp / report.totalQuests)} XP. Tablas de recompensas activas: ${report.economy.totalRewardTables}.`
                        : 'No hay misiones cargadas actualmente en el proyecto.'}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#1b1d22', padding: '12px 14px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e5e7eb', marginBottom: '4px' }}>Nodos Críticos</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
                      {report.bottlenecks.length > 0
                        ? `Hay ${report.bottlenecks.length} cuellos de botella. Asegúrate de que sus tareas no sean excesivamente frustrantes para evitar bloqueos.`
                        : 'Las dependencias están bien distribuidas sin congestión de progreso.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DISTRIBUTION */}
          {activeTab === 'distribution' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderGit2 size={18} color="#60a5fa" /> Distribución de Misiones por Capítulo
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{report.totalChapters} Capítulos</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {report.chapterDistribution.map((ch) => (
                    <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{ch.title}</span>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', backgroundColor: '#181a20', padding: '2px 6px', borderRadius: '4px' }}>{ch.groupTitle}</span>
                          {ch.questCount === 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '1px 5px', borderRadius: '4px' }}>Capítulo Vacío</span>
                          )}
                        </div>
                        <div style={{ color: '#9ca3af' }}>
                          <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{ch.questCount}</span> misiones ({ch.percentage}%)
                        </div>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#16181d', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(ch.percentage, ch.questCount > 0 ? 2 : 0)}%`, backgroundColor: ch.questCount === 0 ? '#ef4444' : '#3b82f6', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#a855f7" /> Distribución por Grupos de Capítulos
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {report.groupDistribution.map((grp) => (
                    <div key={grp.groupId} style={{ backgroundColor: '#1b1d22', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f3f4f6' }}>{grp.groupTitle}</span>
                        <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>{grp.percentage}%</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                        {grp.chapterCount} {grp.chapterCount === 1 ? 'capítulo' : 'capítulos'} • {grp.questCount} misiones
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#16181d', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${grp.percentage}%`, backgroundColor: '#a855f7', height: '100%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ECONOMY */}
          {activeTab === 'economy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#10b981" /> Recompensas de Experiencia (XP)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>XP Directa Acumulada</span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>{report.economy.totalDirectXp.toLocaleString()} XP</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Niveles de XP Acumulados</span>
                      <span style={{ fontWeight: 600, color: '#34d399' }}>{report.economy.totalXpLevels} niveles</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Total Recompensas de XP</span>
                      <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
                        {(report.economy.rewardsBreakdown['xp'] || 0) + (report.economy.rewardsBreakdown['xp_levels'] || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#c084fc" /> Cajas de Botín y Tablas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Recompensas Random / Loot</span>
                      <span style={{ fontWeight: 600, color: '#c084fc' }}>{report.economy.totalLootCratesRewards}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Tablas de Recompensa Totales</span>
                      <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{report.economy.totalRewardTables} tablas</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#1b1d22', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Tablas con Loot Crate configurado</span>
                      <span style={{ fontWeight: 600, color: '#eab308' }}>{report.economy.rewardTablesWithCrates}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Swords size={18} color="#f97316" /> Desglose de Tareas: Ítems vs Caza vs Especiales
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fb923c' }}>
                    Ratio: {report.economy.killTasksCount === 0 ? `${report.economy.itemTasksCount}:0` : `${report.economy.itemToKillRatio}:1`} (Ítems por Cacería)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {Object.entries(report.economy.tasksBreakdown).map(([type, count]) => {
                    const percent = report.economy.totalTasks > 0 ? ((count / report.economy.totalTasks) * 100).toFixed(1) : '0';
                    return (
                      <div key={type} style={{ backgroundColor: '#1b1d22', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>{type}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6', margin: '4px 0' }}>{count}</div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{percent}% de tareas</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOTTLENECKS */}
          {activeTab === 'bottlenecks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', maxWidth: '600px' }}>
                  Un <strong style={{ color: '#facc15' }}>cuello de botella</strong> es una misión de la cual dependen múltiples ramas. Conviene equilibrar sus requisitos para no frustrar la progresión.
                </div>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por misión o capítulo..."
                    style={{ width: '100%', padding: '7px 10px 7px 32px', backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#f3f4f6', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
              </div>

              {filteredBottlenecks.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#22252c', borderRadius: '8px', color: '#9ca3af' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#f3f4f6', fontWeight: 600 }}>No se detectaron cuellos de botella críticos</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>La progresión de misiones está bien distribuida sin nodos sobrecargados.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredBottlenecks.map((b) => (
                    <div key={b.id} style={{ backgroundColor: '#22252c', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
                          <GitBranch size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.92rem' }}>{b.title}</span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', backgroundColor: '#181a20', padding: '2px 6px', borderRadius: '4px' }}>{b.chapterTitle}</span>
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>ID: {b.id}</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#9ca3af', marginTop: '4px' }}>
                            Posición mapa: ({b.x}, {b.y})
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#facc15' }}>
                            {b.directDependentsCount} directas / {b.transitiveDependentsCount} en cadena
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>misiones dependen de esta</div>
                        </div>
                        {onNavigateToQuest && (
                          <button
                            onClick={() => onNavigateToQuest(b.chapterId, b.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}
                            title="Abrir este capítulo y seleccionar la misión"
                          >
                            <ExternalLink size={14} /> Inspeccionar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ORPHANS */}
          {activeTab === 'orphans' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', maxWidth: '600px' }}>
                  Una <strong style={{ color: '#f87171' }}>misión huérfana</strong> está aislada en el mapa: no tiene dependencias entrantes ni ninguna otra misión depende de ella. Puede ser una misión olvidada.
                </div>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por misión o capítulo..."
                    style={{ width: '100%', padding: '7px 10px 7px 32px', backgroundColor: '#22252c', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#f3f4f6', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>
              </div>

              {filteredOrphans.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#22252c', borderRadius: '8px', color: '#9ca3af' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#f3f4f6', fontWeight: 600 }}>¡No se encontraron misiones huérfanas!</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Todas las misiones del modpack están conectadas a la progresión.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredOrphans.map((o) => (
                    <div key={o.id} style={{ backgroundColor: '#22252c', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.92rem' }}>{o.title}</span>
                            <span style={{ fontSize: '0.72rem', color: '#9ca3af', backgroundColor: '#181a20', padding: '2px 6px', borderRadius: '4px' }}>{o.chapterTitle}</span>
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>ID: {o.id}</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#f87171', marginTop: '4px' }}>
                            Aislada sin dependencias entrantes ni salientes • Mapa en ({o.x}, {o.y})
                          </div>
                        </div>
                      </div>
                      {onNavigateToQuest && (
                        <button
                          onClick={() => onNavigateToQuest(o.chapterId, o.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}
                          title="Abrir este capítulo y seleccionar la misión"
                        >
                          <ExternalLink size={14} /> Localizar en Mapa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '12px 24px',
            backgroundColor: '#16181d',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: '#9ca3af'
          }}
        >
          <span>FTB Quest Studio — Analytics Engine</span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 16px', fontSize: '0.8rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
