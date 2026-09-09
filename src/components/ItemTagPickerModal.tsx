import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Search, X, Check, HelpCircle } from 'lucide-react';
import { 
  FORGE_TAG_CATEGORIES, 
   
  searchItemTags, 
  normalizeItemTag,
  type ForgeTagCategory 
} from '../utils/itemTagCatalogs';

interface ItemTagPickerModalProps {
  isOpen: boolean;
  currentTag?: string;
  onSelectTag: (tag: string) => void;
  onClose: () => void;
}

export const ItemTagPickerModal: React.FC<ItemTagPickerModalProps> = ({
  isOpen,
  currentTag = '',
  onSelectTag,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForgeTagCategory>('Todos');
  const [customTagInput, setCustomTagInput] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (currentTag) {
      setCustomTagInput(currentTag);
    }
  }, [currentTag]);

  if (!isOpen) return null;

  const filteredTags = searchItemTags(searchTerm, selectedCategory);

  const handleApplyCustomTag = () => {
    if (!customTagInput.trim()) return;
    const normalized = normalizeItemTag(customTagInput);
    onSelectTag(normalized);
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
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
          maxWidth: '850px',
          height: '80vh',
          maxHeight: '750px',
          backgroundColor: '#1b1e24',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e0e0e0'
        }}
      >
        {/* Cabecera */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: '#16181d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f3f4f6' }}>
                Catálogo de Etiquetas de Ítems (Forge 1.20.1 / Common)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                Usa Item Tags (#forge:...) para unificar lingotes, menas y herramientas de múltiples mods
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div style={{ padding: '12px 20px', backgroundColor: '#181a20', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text"
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tag o nombre (ej. iron, copper, #forge:ingots, gemas)..."
              style={{ paddingLeft: '36px', width: '100%', fontSize: '0.85rem' }}
              autoFocus
            />
          </div>

          {/* Chips de Categorías */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {FORGE_TAG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.74rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: selectedCategory === cat ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                  color: selectedCategory === cat ? '#ffffff' : '#9ca3af',
                  fontWeight: selectedCategory === cat ? 600 : 400
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Etiquetas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <HelpCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#e0e0e0' }}>No se encontraron etiquetas predefinidas</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Puedes escribir y aplicar una etiqueta personalizada abajo.</p>
            </div>
          ) : (
            filteredTags.map((tag) => {
              const isSelected = currentTag === tag.id;
              return (
                <div
                  key={tag.id}
                  onClick={() => onSelectTag(tag.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#22252c',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#60a5fa' : '#9ca3af'
                      }}
                    >
                      <Tag size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#60a5fa', fontSize: '0.85rem' }}>
                          {tag.id}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af', backgroundColor: '#181a20', padding: '1px 6px', borderRadius: '4px' }}>
                          {tag.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#d1d5db', marginTop: '2px' }}>
                        {tag.name}
                      </div>
                      {tag.description && (
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1px' }}>
                          {tag.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#ffffff' : '#d1d5db',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isSelected ? <Check size={13} /> : null}
                    {isSelected ? 'Seleccionado' : 'Usar Tag'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sección de Etiqueta Personalizada y Pie */}
        <div 
          style={{
            padding: '12px 20px',
            backgroundColor: '#16181d',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Tag manual:</span>
            <input 
              type="text"
              className="input-field"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              placeholder="Escribe cualquier tag (ej. #c:iron_ingots o #botania:mystical_flowers)"
              style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyCustomTag();
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyCustomTag}
              disabled={!customTagInput.trim()}
              style={{ padding: '6px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              Aplicar Tag
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#6b7280' }}>
            <span>Tip: En FTB Quests 1.20.1 los tags deben iniciar con el símbolo #.</span>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
