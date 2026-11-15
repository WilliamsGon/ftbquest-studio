import { AlertTriangle, Download, Image as ImageIcon, Map as MapIcon, Plus, Share2, Sparkles, Table as TableIcon, Upload } from 'lucide-react';
import type React from 'react';
import type { ChapterTab } from '../types/chapter';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';
import { isFolderAccessSupported } from '../utils/folderAccess';
import type { GraphValidationResult } from '../utils/graphValidation';

export interface LeftSidebarProps {
  addImage: () => void;
  addQuest: () => void;
  availableZLevels: number[];
  chapterGroups: ChapterGroup[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  filename: string;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  graphValidation: GraphValidationResult;
  handleAutoLayout: (direction?: "LR" | "TB", onlySelected?: boolean) => void;
  handleExport: () => void;
  handleExportZip: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
  handleOpenFolder: () => Promise<void>;
  handleSaveToFolder: () => Promise<void>;
  history: { quests: any[]; images: any[]; snbtData: any; }[];
  historyIndex: number;
  images: any[];
  isPlayerMode: boolean;
  layers: { quests: boolean; images: boolean; dependencies: boolean; };
  linkedFolder: any;
  questBookData: any;
  quests: any[];
  redo: () => void;
  rewardTables: RewardTable[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setIsAnalyticsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBlueprintModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsChapterGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCommandModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDoctorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlayerMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsQuestBookModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRewardTableModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSimulatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTranslationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLayers: React.Dispatch<React.SetStateAction<{ quests: boolean; images: boolean; dependencies: boolean; }>>;
  setViewMode: React.Dispatch<React.SetStateAction<"map" | "table">>;
  setVisibleZLevels: React.Dispatch<React.SetStateAction<number[]>>;
  snbtData: any;
  tabs: ChapterTab[];
  undo: () => void;
  viewMode: "map" | "table";
  visibleZLevels: number[];
}

export function LeftSidebar({ addImage, addQuest, availableZLevels, chapterGroups, fileInputRef, filename, folderInputRef, graphValidation, handleAutoLayout, handleExport, handleExportZip, handleFileUpload, handleOpenFolder, handleSaveToFolder, history, historyIndex, images, isPlayerMode, layers, linkedFolder, questBookData, quests, redo, rewardTables, selection, setIsAnalyticsModalOpen, setIsBlueprintModalOpen, setIsChapterGroupModalOpen, setIsCommandModalOpen, setIsDoctorModalOpen, setIsPlayerMode, setIsQuestBookModalOpen, setIsRewardTableModalOpen, setIsSimulatorModalOpen, setIsTranslationModalOpen, setLayers, setViewMode, setVisibleZLevels, snbtData, tabs, undo, viewMode, visibleZLevels }: LeftSidebarProps) {
  return (
    <>
      <div className="sidebar-left glass-panel">
        <div className="header">
          <h1><MapIcon size={20} className="text-accent" /> FTB Quest Editor</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filename}</p>
          <div className="row">
            <button className="btn btn-secondary btn-full" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Abrir
            </button>
            <input type="file" accept=".snbt" multiple ref={fileInputRef} className="file-input-hidden" onChange={handleFileUpload} />
            <input
              type="file"
              ref={folderInputRef}
              className="file-input-hidden"
              onChange={handleFileUpload}
              {...({ webkitdirectory: '', directory: '' } as any)}
            />
            <button className="btn btn-primary btn-full" onClick={handleExport} disabled={!snbtData}>
              <Download size={16} /> Exportar
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 8px', fontSize: '0.74rem', gap: '5px', justifyContent: 'center' }}
              onClick={handleExportZip}
              disabled={!snbtData && tabs.length === 0}
              title="Empaquetar y exportar modpack en archivo .ZIP con estructura config/ftbquests/..."
            >
              <span>📦</span> Modpack (.zip)
            </button>
            {isFolderAccessSupported() && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 8px', fontSize: '0.74rem', gap: '5px', justifyContent: 'center' }}
                onClick={handleSaveToFolder}
                disabled={!snbtData && tabs.length === 0}
                title="Guardar todos los capítulos, tablas y ajustes directamente en la carpeta de quests (sin ZIP)"
              >
                <span>💾</span> {linkedFolder ? `Guardar en "${linkedFolder.name}"` : 'Guardar en carpeta…'}
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 4px', fontSize: '0.71rem', gap: '3px', justifyContent: 'center' }}
              onClick={handleOpenFolder}
              title="Abrir una carpeta de quests completa (data.snbt, chapter_groups.snbt, chapters/ y reward_tables/)"
            >
              <span>📂</span> Abrir carpeta
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 4px', fontSize: '0.71rem', gap: '3px', justifyContent: 'center' }}
              onClick={() => setIsQuestBookModalOpen(true)}
              title="Ajustes globales del libro de misiones (data.snbt)"
            >
              <span>📘</span> Libro{questBookData ? '' : ' (sin data)'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 4px', fontSize: '0.71rem', gap: '3px', justifyContent: 'center' }}
              onClick={() => setIsRewardTableModalOpen(true)}
              title="Gestor visual de Tablas de Recompensas (reward_tables / Loot Crates)"
            >
              <span>🎁</span> Tablas ({rewardTables.length})
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 4px', fontSize: '0.71rem', gap: '3px', justifyContent: 'center' }}
              onClick={() => setIsChapterGroupModalOpen(true)}
              title="Gestor visual de Grupos de Capítulos (chapter_groups.snbt)"
            >
              <span>📁</span> Grupos ({chapterGroups.length})
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 4px', fontSize: '0.71rem', gap: '3px', justifyContent: 'center' }}
              onClick={() => setIsAnalyticsModalOpen(true)}
              title="Tablero de Balance y Estadísticas del Modpack (Analytics Dashboard)"
            >
              <span>📊</span> Balance
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsBlueprintModalOpen(true)}
              title="Biblioteca de Plantillas y Diseños Prehechos (Tiers, Boss Rush, Checklist inicial)"
            >
              <span>🧩</span> Plantillas
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsTranslationModalOpen(true)}
              title="Gestor de Traducciones e Internacionalización (en_us.json / es_es.json para CurseForge)"
            >
              <span>🌐</span> Traducción
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsDoctorModalOpen(true)}
              title="Doctor del Modpack: Auditoría de integridad y auto-reparación"
            >
              <span>🩺</span> Doctor
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsCommandModalOpen(true)}
              title="Generador de Comandos de Prueba y Scripts KubeJS"
            >
              <span>🧪</span> KubeJS
            </button>
          </div>
          <button
            className="btn btn-secondary"
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '7px 8px',
              fontSize: '0.78rem',
              gap: '6px',
              justifyContent: 'center',
              background: isPlayerMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: '#10b981',
              color: '#a6e3a1',
              fontWeight: 700
            }}
            onClick={() => {
              if (viewMode !== 'map') setViewMode('map');
              setIsPlayerMode(true);
              setIsSimulatorModalOpen(true);
            }}
            title="Abrir Simulador de Progresión (Playtesting de inventario, XP y tablas de loot)"
          >
            <span>🎮</span> Simulador de Progresión
          </button>
          {snbtData && (
            <div className="layout-toggle-container" style={{ marginTop: '10px', marginBottom: '4px' }}>
              <button 
                className={`layout-toggle-btn ${viewMode === 'map' && !isPlayerMode ? 'active' : ''}`}
                onClick={() => { setViewMode('map'); setIsPlayerMode(false); }}
                title="Vista de Mapa (Canvas)"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <MapIcon size={14} /> Mapa
              </button>
              <button 
                className={`layout-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => { setViewMode('table'); setIsPlayerMode(false); }}
                title="Vista de Tabla"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <TableIcon size={14} /> Tabla
              </button>
              <button 
                className={`layout-toggle-btn ${isPlayerMode ? 'active' : ''}`}
                onClick={() => {
                  if (viewMode !== 'map') setViewMode('map');
                  setIsPlayerMode(!isPlayerMode);
                }}
                title="Modo Vista Jugador (Simulación interactiva de desbloqueo)"
                style={{ flex: 1, justifyContent: 'center', color: isPlayerMode ? '#10b981' : undefined }}
              >
                <span>🎮</span> Simulador
              </button>
            </div>
          )}
          {snbtData && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Deshacer (Ctrl+Z)"
              >
                Deshacer
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Rehacer (Ctrl+Y)"
              >
                Rehacer
              </button>
            </div>
          )}

          {snbtData && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} className="text-accent" />
                <span>Auto-Organizar Árbol</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
                  onClick={() => handleAutoLayout('LR', selection.items.filter(i => i.type === 'quest').length > 1)}
                  title="Organizar horizontalmente (Izquierda a Derecha)"
                >
                  ➡️ Horizontal
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
                  onClick={() => handleAutoLayout('TB', selection.items.filter(i => i.type === 'quest').length > 1)}
                  title="Organizar verticalmente (Arriba a Abajo)"
                >
                  ⬇️ Vertical
                </button>
              </div>
            </div>
          )}

          {snbtData && !graphValidation.isValid && (
            <div style={{
              background: 'rgba(243, 139, 168, 0.15)',
              border: '1px solid #f38ba8',
              borderRadius: '8px',
              padding: '10px',
              marginTop: '10px',
              fontSize: '0.78rem',
              color: '#f38ba8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', marginBottom: '4px' }}>
                <AlertTriangle size={15} /> Problemas en el Grafo
              </div>
              {graphValidation.cycles.length > 0 && (
                <div>⚠️ {graphValidation.cycles.length} ciclo(s) de dependencia detectado(s).</div>
              )}
              {graphValidation.brokenDeps.length > 0 && (
                <div>❓ {graphValidation.brokenDeps.length} dependencia(s) rotas/inexistentes.</div>
              )}
            </div>
          )}
        </div>

        <div className="content-section">
          <div>
            <h2 className="section-title">Capas (Layers)</h2>
            <div 
              className={`toggle-item ${layers.quests ? 'active' : ''}`}
              onClick={() => setLayers(l => ({ ...l, quests: !l.quests }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapIcon size={16} /> Misiones
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {quests.length}
              </span>
            </div>
            
            <div 
              className={`toggle-item ${layers.images ? 'active' : ''}`}
              onClick={() => setLayers(l => ({ ...l, images: !l.images }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} /> Imágenes Fondo
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {images.length}
              </span>
            </div>

            <div 
              className={`toggle-item ${layers.dependencies ? 'active' : ''}`}
              onClick={() => setLayers(l => ({ ...l, dependencies: !l.dependencies }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} /> Líneas Dependencia
              </div>
            </div>

            {layers.images && availableZLevels.length > 0 && (
              <div className="z-filter-container">
                <div className="z-filter-title">
                  <span>Filtrar por Capa Z</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="z-link-btn"
                      onClick={() => setVisibleZLevels([...availableZLevels])}
                    >
                      Todos
                    </button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <button 
                      className="z-link-btn"
                      onClick={() => setVisibleZLevels([])}
                    >
                      Ninguno
                    </button>
                  </div>
                </div>
                <div className="z-chips-grid">
                  {availableZLevels.map(lvl => {
                    const isActive = visibleZLevels.includes(lvl);
                    return (
                      <button 
                        key={`z-chip-${lvl}`}
                        className={`z-chip-btn ${isActive ? 'active' : ''}`}
                        onClick={() => {
                          setVisibleZLevels(prev => 
                            prev.includes(lvl) 
                              ? prev.filter(l => l !== lvl)
                              : [...prev, lvl].sort((a, b) => a - b)
                          );
                        }}
                        title={`Alternar visualización de capa Z: ${lvl}`}
                      >
                        Z: {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="section-title">Crear</h2>
            <button className="btn btn-secondary btn-full" style={{ marginBottom: '8px' }} onClick={addQuest} disabled={!snbtData}>
              <Plus size={16} /> Nueva Misión
            </button>
            <button className="btn btn-secondary btn-full" onClick={addImage} disabled={!snbtData}>
              <Plus size={16} /> Nueva Imagen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
