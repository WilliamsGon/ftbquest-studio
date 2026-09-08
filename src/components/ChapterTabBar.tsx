import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, Download, BookOpen, FileText, ChevronDown } from 'lucide-react';
import type { ChapterTab } from '../types/chapter';

interface ChapterTabBarProps {
  tabs: ChapterTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewBlankTab: () => void;
  onOpenFiles: () => void;
  onExportActive: () => void;
  onExportAll: () => void;
}

export const ChapterTabBar: React.FC<ChapterTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewBlankTab,
  onOpenFiles,
  onExportActive,
  onExportAll
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chapter-tab-menu-wrapper')) {
        setIsAddMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Permitir desplazamiento horizontal con rueda del ratón en la barra de pestañas
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="chapter-tab-bar">
      {/* Contenedor desplazable de pestañas */}
      <div 
        className="chapter-tabs-scroll" 
        ref={tabsScrollRef}
        onWheel={handleWheel}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const displayTitle = tab.snbtData?.title || tab.title || tab.filename.replace(/\.snbt$/, '') || 'Capítulo';
          const questCount = tab.quests ? tab.quests.length : 0;

          return (
            <div
              key={tab.id}
              className={`chapter-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              title={`${displayTitle} (${tab.filename})`}
            >
              <div className="chapter-tab-icon">
                <BookOpen size={14} />
              </div>

              <span className="chapter-tab-title">{displayTitle}</span>

              {/* Contador de misiones */}
              <span className="chapter-tab-badge" title={`${questCount} misiones en este capítulo`}>
                {questCount}
              </span>

              {/* Indicador de cambios sin exportar */}
              {tab.isDirty && (
                <span className="chapter-tab-dirty" title="Cambios sin guardar/exportar">
                  ●
                </span>
              )}

              {/* Botón de cerrar pestaña */}
              <button
                type="button"
                className="chapter-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Cerrar capítulo (Ctrl+W)"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Acciones de la barra de pestañas: Botón Añadir / Menú Exportar */}
      <div className="chapter-tab-actions">
        {/* Menú Añadir Capítulo */}
        <div className="chapter-tab-menu-wrapper" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`chapter-tab-action-btn ${isAddMenuOpen ? 'active' : ''}`}
            onClick={() => {
              setIsAddMenuOpen(!isAddMenuOpen);
              setIsExportMenuOpen(false);
            }}
            title="Añadir o abrir nuevo capítulo"
          >
            <Plus size={16} />
          </button>

          {isAddMenuOpen && (
            <div className="chapter-tab-dropdown glass-panel">
              <button
                type="button"
                className="chapter-tab-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onNewBlankTab();
                }}
              >
                <FileText size={15} className="text-accent" />
                <span>Nuevo Capítulo en Blanco</span>
              </button>
              <button
                type="button"
                className="chapter-tab-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onOpenFiles();
                }}
              >
                <Upload size={15} />
                <span>Abrir Archivo(s) .snbt...</span>
              </button>
            </div>
          )}
        </div>

        {/* Menú Exportar */}
        {tabs.length > 0 && (
          <div className="chapter-tab-menu-wrapper" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`chapter-tab-action-btn ${isExportMenuOpen ? 'active' : ''}`}
              onClick={() => {
                setIsExportMenuOpen(!isExportMenuOpen);
                setIsAddMenuOpen(false);
              }}
              title="Opciones de exportación"
            >
              <Download size={15} />
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {isExportMenuOpen && (
              <div className="chapter-tab-dropdown glass-panel right-aligned">
                <button
                  type="button"
                  className="chapter-tab-dropdown-item"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportActive();
                  }}
                >
                  <Download size={14} className="text-accent" />
                  <span>Exportar Capítulo Actual</span>
                </button>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="chapter-tab-dropdown-item"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onExportAll();
                    }}
                  >
                    <Download size={14} style={{ color: '#a6e3a1' }} />
                    <span>Exportar Todos ({tabs.length} capítulos)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
