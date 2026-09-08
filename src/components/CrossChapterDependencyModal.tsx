import React, { useState, useMemo } from 'react';
import type { ChapterTab } from '../types/chapter';
import { parseMinecraftText, stripMinecraftFormatting } from '../utils/minecraftText';
import { QuestItemThumbnail } from '../utils/textureHelper';
import { Search, X, Globe, Plus, Check, Layers } from 'lucide-react';

interface CrossChapterDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChapterId: string;
  currentQuestId: string;
  existingDependencyIds: string[];
  tabs: ChapterTab[];
  onAddDependency: (questId: string, chapterTitle: string, questTitle: string) => void;
}

export const CrossChapterDependencyModal: React.FC<CrossChapterDependencyModalProps> = ({
  isOpen,
  onClose,
  currentChapterId,
  currentQuestId,
  existingDependencyIds,
  tabs,
  onAddDependency,
}) => {
  // Capítulos disponibles (excluyendo el capítulo actual)
  const availableChapters = useMemo(() => {
    return tabs.filter((t) => t.id !== currentChapterId);
  }, [tabs, currentChapterId]);

  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    return availableChapters[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manualHexInput, setManualHexInput] = useState<string>('');

  // Si cambia el capítulo seleccionado y no existe, seleccionar el primero disponible
  const activeTargetChapter = useMemo(() => {
    if (!selectedChapterId && availableChapters.length > 0) {
      return availableChapters[0];
    }
    return availableChapters.find((t) => t.id === selectedChapterId) || availableChapters[0];
  }, [availableChapters, selectedChapterId]);

  // Quests del capítulo objetivo filtradas
  const filteredQuests = useMemo(() => {
    if (!activeTargetChapter || !Array.isArray(activeTargetChapter.quests)) return [];
    const q = searchQuery.trim().toLowerCase();

    return activeTargetChapter.quests.filter((quest) => {
      if (!quest || !quest.id) return false;
      if (quest.id === currentQuestId && activeTargetChapter.id === currentChapterId) return false;

      if (!q) return true;

      const titleClean = stripMinecraftFormatting(String(quest.title || '')).toLowerCase();
      const subtitleClean = stripMinecraftFormatting(String(quest.subtitle || '')).toLowerCase();
      const idStr = String(quest.id).toLowerCase();

      return titleClean.includes(q) || subtitleClean.includes(q) || idStr.includes(q);
    });
  }, [activeTargetChapter, searchQuery, currentQuestId, currentChapterId]);

  if (!isOpen) return null;

  const handleAddManualId = () => {
    const trimmed = manualHexInput.trim().toUpperCase();
    if (!trimmed) return;
    onAddDependency(trimmed, 'Capítulo Externo', `Misión (${trimmed})`);
    setManualHexInput('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px',
          maxWidth: '94vw',
          height: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(18, 20, 29, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(123, 97, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(123, 97, 255, 0.15)',
        }}
      >
        {/* Cabecera */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(123, 97, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <Globe size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                Conectar Dependencia Inter-Capítulo
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Vincula un prerrequisito que pertenece a otro capítulo del modpack
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Columna Izquierda: Selector de Capítulos */}
          <div
            style={{
              width: '230px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 8px',
              gap: '6px',
              overflowY: 'auto',
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 8px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Capítulos Abiertos ({availableChapters.length})
            </span>

            {availableChapters.length === 0 ? (
              <div style={{ padding: '16px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
                <p style={{ marginBottom: '8px' }}>No hay otras pestañas de capítulos abiertas.</p>
                <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Abre otro capítulo con el botón <code>[+]</code> en las pestañas superiores para vincularlo aquí.
                </p>
              </div>
            ) : (
              availableChapters.map((ch) => {
                const isSelected = activeTargetChapter?.id === ch.id;
                const questCount = Array.isArray(ch.quests) ? ch.quests.length : 0;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChapterId(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(123, 97, 255, 0.25)' : 'transparent',
                      border: isSelected ? '1px solid #7b61ff' : '1px solid transparent',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <Layers size={14} style={{ color: isSelected ? '#a78bfa' : 'inherit', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ch.title || ch.filename}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: isSelected ? '#cbd5e1' : '#64748b' }}>
                        {questCount} misiones
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Columna Derecha: Buscador y Lista de Misiones del Capítulo Seleccionado */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 18px', minWidth: 0 }}>
            {activeTargetChapter ? (
              <>
                {/* Buscador interno */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`Buscar misión en "${activeTargetChapter.title || activeTargetChapter.filename}"...`}
                    style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem', width: '100%' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn-icon"
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '2px' }}
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Lista de misiones */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {filteredQuests.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                      <p style={{ fontSize: '0.85rem' }}>No se encontraron misiones en este capítulo.</p>
                    </div>
                  ) : (
                    filteredQuests.map((quest) => {
                      const isAlreadyDep = existingDependencyIds.includes(String(quest.id));
                      const questTitle = String(quest.title || 'Misión sin título');
                      const questSub = quest.subtitle ? String(quest.subtitle) : '';

                      return (
                        <div
                          key={quest.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isAlreadyDep ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                            border: isAlreadyDep ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            gap: '12px',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            <QuestItemThumbnail icon={quest.icon} size={30} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.83rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {parseMinecraftText(questTitle)}
                              </div>
                              {questSub && (
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {parseMinecraftText(questSub)}
                                </div>
                              )}
                              <div style={{ fontSize: '0.67rem', color: '#64748b', fontFamily: 'monospace' }}>
                                ID: {quest.id}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isAlreadyDep ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  color: '#10b981',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                }}
                              >
                                <Check size={12} /> Conectada
                              </span>
                            ) : (
                              <button
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.73rem',
                                  padding: '4px 10px',
                                  gap: '5px',
                                  borderRadius: '6px',
                                  background: '#7b61ff',
                                  borderColor: '#6b4fe0',
                                }}
                                onClick={() => {
                                  onAddDependency(
                                    String(quest.id),
                                    activeTargetChapter.title || activeTargetChapter.filename,
                                    questTitle
                                  );
                                }}
                              >
                                <Plus size={13} /> Conectar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                <p>Selecciona un capítulo de la columna izquierda para explorar sus misiones.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie del modal: Entrada manual de ID directo */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              ¿O ingresar ID hexadecimal directo?:
            </span>
            <input
              type="text"
              className="input-field"
              placeholder="Ej: 1A2B3C4D5E6F7890"
              style={{ height: '30px', fontSize: '0.76rem', fontFamily: 'monospace', maxWidth: '220px' }}
              value={manualHexInput}
              onChange={(e) => setManualHexInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddManualId();
              }}
            />
            <button
              className="btn btn-secondary"
              style={{ height: '30px', padding: '0 10px', fontSize: '0.73rem' }}
              onClick={handleAddManualId}
              disabled={!manualHexInput.trim()}
            >
              Añadir ID
            </button>
          </div>

          <button className="btn btn-secondary" onClick={onClose} style={{ height: '30px', fontSize: '0.78rem' }}>
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
