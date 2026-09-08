import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, List, Replace, Check, Layers, FileText } from 'lucide-react';

export interface SearchMatch {
  quest: any;
  matchField: 'title' | 'id' | 'subtitle' | 'description' | 'task' | 'reward';
  matchDetail?: string;
}

export interface ReplaceFieldsConfig {
  titles: boolean;
  descriptions: boolean;
  tasks: boolean;
  rewards: boolean;
  icons: boolean;
}

interface QuestSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (newQuery: string) => void;
  matches: SearchMatch[];
  activeIndex: number;
  onNavigateMatch: (index: number) => void;
  onSelectQuest?: (quest: any) => void;
  initialMode?: 'search' | 'replace';
  totalOpenTabsCount?: number;
  onBatchReplace?: (
    searchQuery: string,
    replaceWith: string,
    scope: 'current' | 'all',
    fields: ReplaceFieldsConfig
  ) => void;
  onReplaceSingle?: (match: SearchMatch, replaceWith: string) => void;
}

export const QuestSearchBar: React.FC<QuestSearchBarProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  matches,
  activeIndex,
  onNavigateMatch,
  onSelectQuest,
  initialMode = 'search',
  totalOpenTabsCount = 1,
  onBatchReplace,
  onReplaceSingle
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'replace'>(initialMode);
  const [replaceText, setReplaceText] = useState('');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [replaceFields, setReplaceFields] = useState<ReplaceFieldsConfig>({
    titles: true,
    descriptions: true,
    tasks: true,
    rewards: true,
    icons: false
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sincronizar modo inicial cuando se abre con Ctrl+F o Ctrl+H
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    } else {
      setShowDropdown(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length === 0) return;
      if (e.shiftKey) {
        const prevIdx = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
        onNavigateMatch(prevIdx);
      } else {
        const nextIdx = activeIndex >= matches.length - 1 ? 0 : activeIndex + 1;
        onNavigateMatch(nextIdx);
      }
    } else if (e.key === 'ArrowDown' && showDropdown) {
      e.preventDefault();
      if (matches.length > 0) {
        const nextIdx = activeIndex >= matches.length - 1 ? 0 : activeIndex + 1;
        onNavigateMatch(nextIdx);
      }
    } else if (e.key === 'ArrowUp' && showDropdown) {
      e.preventDefault();
      if (matches.length > 0) {
        const prevIdx = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
        onNavigateMatch(prevIdx);
      }
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matches.length === 0) return;
    const prevIdx = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
    onNavigateMatch(prevIdx);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matches.length === 0) return;
    const nextIdx = activeIndex >= matches.length - 1 ? 0 : activeIndex + 1;
    onNavigateMatch(nextIdx);
  };

  const handleExecuteReplaceSingle = () => {
    if (!matches[activeIndex] || !query) return;
    onReplaceSingle?.(matches[activeIndex], replaceText);
  };

  const handleExecuteReplaceAll = () => {
    if (!query) return;
    onBatchReplace?.(query, replaceText, scope, replaceFields);
  };

  const toggleField = (key: keyof ReplaceFieldsConfig) => {
    setReplaceFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getFieldBadgeLabel = (field: SearchMatch['matchField']) => {
    switch (field) {
      case 'title': return 'Título';
      case 'id': return 'ID';
      case 'subtitle': return 'Subtítulo';
      case 'description': return 'Desc.';
      case 'task': return 'Tarea';
      case 'reward': return 'Recompensa';
      default: return 'Coincidencia';
    }
  };

  return (
    <div className="quest-search-container" onClick={(e) => e.stopPropagation()}>
      <div className={`quest-search-bar glass-panel ${activeTab === 'replace' ? 'replace-mode' : ''}`}>
        {/* Cabecera de pestañas (Buscar / Reemplazar) */}
        <div className="quest-search-tabs">
          <button
            type="button"
            className={`quest-search-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={13} />
            <span>Buscar</span>
            <kbd className="kbd-shortcut">Ctrl+F</kbd>
          </button>
          <button
            type="button"
            className={`quest-search-tab ${activeTab === 'replace' ? 'active' : ''}`}
            onClick={() => setActiveTab('replace')}
          >
            <Replace size={13} />
            <span>Reemplazar</span>
            <kbd className="kbd-shortcut">Ctrl+H</kbd>
          </button>
        </div>

        {/* Fila 1: Input de Búsqueda */}
        <div className="quest-search-row">
          <div className="quest-search-icon">
            <Search size={15} />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="quest-search-input"
            placeholder="Buscar texto, ítem, comando, ID..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {query.length > 0 && (
            <button
              type="button"
              className="quest-search-btn-icon text-muted hover-light"
              onClick={() => {
                onQueryChange('');
                inputRef.current?.focus();
              }}
              title="Borrar texto"
            >
              <X size={14} />
            </button>
          )}

          {/* Contador de resultados */}
          {query.trim().length > 0 && (
            <div className={`quest-search-counter ${matches.length === 0 ? 'no-matches' : ''}`}>
              {matches.length === 0 ? (
                '0'
              ) : (
                `${activeIndex + 1}/${matches.length}`
              )}
            </div>
          )}

          <div className="quest-search-divider" />

          {/* Botones de navegación Anterior / Siguiente */}
          <button
            type="button"
            className="quest-search-btn-icon"
            onClick={handlePrev}
            disabled={matches.length === 0}
            title="Misión anterior (Shift + Enter)"
          >
            <ChevronUp size={16} />
          </button>

          <button
            type="button"
            className="quest-search-btn-icon"
            onClick={handleNext}
            disabled={matches.length === 0}
            title="Misión siguiente (Enter)"
          >
            <ChevronDown size={16} />
          </button>

          {/* Toggle para lista de coincidencias */}
          <button
            type="button"
            className={`quest-search-btn-icon ${showDropdown ? 'active' : ''}`}
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={matches.length === 0}
            title="Ver lista de coincidencias"
          >
            <List size={16} />
          </button>

          {/* Botón cerrar */}
          <button
            type="button"
            className="quest-search-btn-icon close-btn"
            onClick={onClose}
            title="Cerrar (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Fila 2 (Solo Modo Reemplazo): Input de Reemplazo y Opciones */}
        {activeTab === 'replace' && (
          <div className="quest-replace-section">
            <div className="quest-search-row">
              <div className="quest-search-icon" style={{ color: '#cba6f7' }}>
                <Replace size={15} />
              </div>

              <input
                ref={replaceInputRef}
                type="text"
                className="quest-search-input"
                placeholder="Reemplazar por..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.ctrlKey || e.metaKey) {
                      handleExecuteReplaceAll();
                    } else {
                      handleExecuteReplaceSingle();
                    }
                  }
                }}
              />

              <div className="quest-replace-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExecuteReplaceSingle}
                  disabled={matches.length === 0 || !query}
                  title="Reemplazar la coincidencia activa (Enter)"
                  style={{ padding: '3px 8px', fontSize: '0.75rem', height: '26px' }}
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleExecuteReplaceAll}
                  disabled={matches.length === 0 || !query}
                  title="Reemplazar todas las ocurrencias (Ctrl + Enter)"
                  style={{ padding: '3px 10px', fontSize: '0.75rem', height: '26px' }}
                >
                  Reemplazar Todo
                </button>
              </div>
            </div>

            {/* Opciones de Alcance y Filtro de Campos */}
            <div className="quest-replace-options">
              <div className="quest-replace-scope-group">
                <span className="quest-replace-label">Alcance:</span>
                <button
                  type="button"
                  className={`scope-pill ${scope === 'current' ? 'active' : ''}`}
                  onClick={() => setScope('current')}
                  title="Aplicar reemplazo solo al capítulo actual"
                >
                  <FileText size={11} /> Capítulo actual
                </button>
                {totalOpenTabsCount > 1 && (
                  <button
                    type="button"
                    className={`scope-pill ${scope === 'all' ? 'active' : ''}`}
                    onClick={() => setScope('all')}
                    title={`Aplicar reemplazo a todos los ${totalOpenTabsCount} capítulos abiertos`}
                  >
                    <Layers size={11} /> Todas las pestañas ({totalOpenTabsCount})
                  </button>
                )}
              </div>

              <div className="quest-replace-fields-group">
                <span className="quest-replace-label">En:</span>
                <button
                  type="button"
                  className={`field-pill ${replaceFields.titles ? 'active' : ''}`}
                  onClick={() => toggleField('titles')}
                  title="Títulos y subtítulos"
                >
                  {replaceFields.titles && <Check size={10} />} Títulos
                </button>
                <button
                  type="button"
                  className={`field-pill ${replaceFields.descriptions ? 'active' : ''}`}
                  onClick={() => toggleField('descriptions')}
                  title="Líneas de descripción"
                >
                  {replaceFields.descriptions && <Check size={10} />} Descripciones
                </button>
                <button
                  type="button"
                  className={`field-pill ${replaceFields.tasks ? 'active' : ''}`}
                  onClick={() => toggleField('tasks')}
                  title="Ítems y nombres de tareas"
                >
                  {replaceFields.tasks && <Check size={10} />} Tareas
                </button>
                <button
                  type="button"
                  className={`field-pill ${replaceFields.rewards ? 'active' : ''}`}
                  onClick={() => toggleField('rewards')}
                  title="Ítems y comandos de recompensas"
                >
                  {replaceFields.rewards && <Check size={10} />} Recompensas
                </button>
                <button
                  type="button"
                  className={`field-pill ${replaceFields.icons ? 'active' : ''}`}
                  onClick={() => toggleField('icons')}
                  title="Iconos de misiones e imágenes de fondo"
                >
                  {replaceFields.icons && <Check size={10} />} Iconos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista desplegable de coincidencias */}
      {showDropdown && matches.length > 0 && (
        <div className="quest-search-dropdown glass-panel" ref={dropdownRef}>
          <div className="quest-search-dropdown-header">
            <span>Resultados de búsqueda ({matches.length})</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Haz clic para enfocar</span>
          </div>

          <div className="quest-search-dropdown-list">
            {matches.map((match, idx) => {
              const q = match.quest;
              const isSelected = idx === activeIndex;
              const title = q.title || 'Misión sin título';
              const questId = String(q.id || '');

              return (
                <div
                  key={questId + '-' + idx}
                  className={`quest-search-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onNavigateMatch(idx);
                    onSelectQuest?.(q);
                  }}
                >
                  <div className="quest-search-item-info">
                    <div className="quest-search-item-title-row">
                      <span className="quest-search-item-title">{title}</span>
                      <span className={`quest-search-item-badge badge-${match.matchField}`}>
                        {getFieldBadgeLabel(match.matchField)}
                      </span>
                    </div>

                    <div className="quest-search-item-sub-row">
                      <span className="quest-search-item-id">ID: {questId}</span>
                      {match.matchDetail && (
                        <span className="quest-search-item-detail" title={match.matchDetail}>
                          • {match.matchDetail}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
