import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, List } from 'lucide-react';

export interface SearchMatch {
  quest: any;
  matchField: 'title' | 'id' | 'subtitle' | 'description' | 'task' | 'reward';
  matchDetail?: string;
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
}

export const QuestSearchBar: React.FC<QuestSearchBarProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  matches,
  activeIndex,
  onNavigateMatch,
  onSelectQuest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Auto-enfocar el input cuando se abre el buscador
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    } else {
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Si no está abierto, no renderizar
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
        // Coincidencia anterior
        const prevIdx = activeIndex <= 0 ? matches.length - 1 : activeIndex - 1;
        onNavigateMatch(prevIdx);
      } else {
        // Coincidencia siguiente
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
      <div className="quest-search-bar glass-panel">
        <div className="quest-search-icon">
          <Search size={16} />
        </div>

        <input
          ref={inputRef}
          type="text"
          className="quest-search-input"
          placeholder="Buscar misión (nombre, ID, tarea, item)..."
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
              '0 resultados'
            ) : (
              `${activeIndex + 1} de ${matches.length}`
            )}
          </div>
        )}

        {/* Separador vertical sutil */}
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
          title="Cerrar buscador (Esc)"
        >
          <X size={16} />
        </button>
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
