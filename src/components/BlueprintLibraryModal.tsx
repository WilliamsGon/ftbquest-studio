import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Boxes, Plus, Trash2, X, Search, Bookmark } from 'lucide-react';
import type { Blueprint, BlueprintCategory } from '../types/blueprints';
import { OFFICIAL_BLUEPRINTS, getCustomBlueprints, deleteCustomBlueprint } from '../utils/blueprintEngine';
import { QuestItemThumbnail } from '../utils/textureHelper';

interface BlueprintLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlueprint: (blueprint: Blueprint) => void;
  selectedQuestsCount?: number;
  onSaveSelectionAsBlueprint?: (title: string, category: BlueprintCategory) => void;
}

export const BlueprintLibraryModal: React.FC<BlueprintLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertBlueprint,
  selectedQuestsCount = 0,
  onSaveSelectionAsBlueprint
}) => {
  const [activeTab, setActiveTab] = useState<'all' | BlueprintCategory | 'custom'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customBlueprints, setCustomBlueprints] = useState<Blueprint[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<BlueprintCategory>('progression');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setCustomBlueprints(getCustomBlueprints());
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allBlueprints = [...OFFICIAL_BLUEPRINTS, ...customBlueprints];

  const filteredBlueprints = allBlueprints.filter((bp) => {
    const matchesTab = activeTab === 'all' 
      ? true 
      : activeTab === 'custom' 
        ? bp.isCustom 
        : bp.category === activeTab;
    if (!matchesTab) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return bp.title.toLowerCase().includes(q) || bp.description.toLowerCase().includes(q);
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onSaveSelectionAsBlueprint?.(newTitle.trim(), newCategory);
    setNewTitle('');
    setShowSaveForm(false);
    setCustomBlueprints(getCustomBlueprints());
    setActiveTab('custom');
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta plantilla personalizada?')) {
      deleteCustomBlueprint(id);
      setCustomBlueprints(getCustomBlueprints());
    }
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
          maxWidth: '960px',
          height: '84vh',
          maxHeight: '820px',
          backgroundColor: '#1b1e24',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
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
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <Boxes size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f3f4f6' }}>
                Biblioteca de Plantillas y Diseños (Blueprints)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                Inserta estructuras prehechas de misiones con 1-clic o guarda tus propias selecciones
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

        {/* Barra de Filtros y Búsqueda */}
        <div style={{ padding: '12px 20px', backgroundColor: '#181a20', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text"
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar plantilla (ej. tiers, boss rush, inicio)..."
                style={{ paddingLeft: '34px', width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            {selectedQuestsCount > 0 && onSaveSelectionAsBlueprint && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSaveForm(!showSaveForm)}
                style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <Bookmark size={14} /> Guardar Selección ({selectedQuestsCount})
              </button>
            )}
          </div>

          {/* Formulario desplegable para guardar selección */}
          {showSaveForm && (
            <form 
              onSubmit={handleSaveCustom}
              style={{
                backgroundColor: '#22252c',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                marginTop: '4px'
              }}
            >
              <input
                type="text"
                className="input-field"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nombre para la nueva plantilla..."
                style={{ flex: 1, fontSize: '0.8rem' }}
                autoFocus
                required
              />
              <select
                className="input-field"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as BlueprintCategory)}
                style={{ width: '150px', fontSize: '0.8rem' }}
              >
                <option value="progression">Progresión</option>
                <option value="combat">Combate / Boss</option>
                <option value="starter">Inicio / Starter</option>
                <option value="technology">Tecnología / Magia</option>
              </select>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                Guardar Blueprint
              </button>
            </form>
          )}

          {/* Tabs de Categorías */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'all' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'all' ? '#ffffff' : '#9ca3af'
              }}
            >
              Todas ({allBlueprints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('progression')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'progression' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'progression' ? '#ffffff' : '#9ca3af'
              }}
            >
              Progresión
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('combat')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'combat' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'combat' ? '#ffffff' : '#9ca3af'
              }}
            >
              Combate / Bosses
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('starter')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'starter' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'starter' ? '#ffffff' : '#9ca3af'
              }}
            >
              Inicio / Starters
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('technology')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'technology' ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'technology' ? '#ffffff' : '#9ca3af'
              }}
            >
              Tecnología / Magia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'custom' ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'custom' ? '#ffffff' : '#9ca3af'
              }}
            >
              Mis Plantillas ({customBlueprints.length})
            </button>
          </div>
        </div>

        {/* Grid de Plantillas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', alignContent: 'start' }}>
          {filteredBlueprints.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <Boxes size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#f3f4f6' }}>No hay plantillas que coincidan con la búsqueda</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>Selecciona misiones en el mapa para guardar tu propio blueprint.</p>
            </div>
          ) : (
            filteredBlueprints.map((bp) => (
              <div
                key={bp.id}
                style={{
                  backgroundColor: '#22252c',
                  border: bp.isCustom ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <QuestItemThumbnail icon={bp.icon} size={24} altText={bp.title} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#f3f4f6' }}>
                          {bp.title}
                        </h4>
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                          {bp.isCustom ? 'Personalizada' : bp.category}
                        </span>
                      </div>
                    </div>

                    {bp.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(bp.id, e)}
                        className="btn-icon"
                        style={{ padding: '4px', color: '#f87171' }}
                        title="Eliminar plantilla"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.4 }}>
                    {bp.description}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#6b7280' }}>
                    <span>📦 {bp.quests.length} misiones</span>
                    <span>•</span>
                    <span>🔗 Dependencias conectadas</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onInsertBlueprint(bp)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} /> Insertar en Capítulo Activo
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pie */}
        <div 
          style={{
            padding: '12px 20px',
            backgroundColor: '#16181d',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: '#9ca3af'
          }}
        >
          <span>Tip: Al insertar, los IDs se regeneran automáticamente evitando cualquier conflicto de misiones.</span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '5px 14px', fontSize: '0.78rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
