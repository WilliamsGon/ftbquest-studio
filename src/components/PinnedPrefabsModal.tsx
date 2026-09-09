import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pin, X, Search, Trash2, Copy, Check, Calendar, Sparkles } from 'lucide-react';
import { QuestItemThumbnail } from '../utils/textureHelper';

export interface PinnedAsset {
  id: string;
  title: string;
  quests: any[];
  images: any[];
  timestamp: number;
}

interface PinnedPrefabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedAssets: PinnedAsset[];
  onPasteAsset: (asset: PinnedAsset) => void;
  onDeleteAsset: (assetId: string) => void;
  onClearAll: () => void;
}

export const PinnedPrefabsModal: React.FC<PinnedPrefabsModalProps> = ({
  isOpen,
  onClose,
  pinnedAssets,
  onPasteAsset,
  onDeleteAsset,
  onClearAll
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quest' | 'image' | 'mixed'>('all');
  const [pastedId, setPastedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const counts = useMemo(() => {
    let questCount = 0;
    let imageCount = 0;
    let mixedCount = 0;

    for (const asset of pinnedAssets) {
      const qLen = asset.quests?.length || 0;
      const iLen = asset.images?.length || 0;
      if (qLen > 0 && iLen === 0) questCount++;
      else if (qLen === 0 && iLen > 0) imageCount++;
      else mixedCount++;
    }

    return { all: pinnedAssets.length, quest: questCount, image: imageCount, mixed: mixedCount };
  }, [pinnedAssets]);

  const filteredAssets = useMemo(() => {
    return pinnedAssets.filter(asset => {
      const qLen = asset.quests?.length || 0;
      const iLen = asset.images?.length || 0;
      let type: 'quest' | 'image' | 'mixed' = 'mixed';
      if (qLen > 0 && iLen === 0) type = 'quest';
      else if (qLen === 0 && iLen > 0) type = 'image';

      if (filterType !== 'all' && type !== filterType) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();

      const titleMatch = asset.title?.toLowerCase().includes(query);
      const questMatch = asset.quests?.some((q: any) => 
        String(q.title || '').toLowerCase().includes(query) ||
        String(q.id || '').toLowerCase().includes(query)
      );
      const imageMatch = asset.images?.some((img: any) =>
        String(img.image || '').toLowerCase().includes(query)
      );

      return titleMatch || questMatch || imageMatch;
    });
  }, [pinnedAssets, filterType, searchTerm]);

  const handlePaste = (asset: PinnedAsset) => {
    setPastedId(asset.id);
    onPasteAsset(asset);
    setTimeout(() => {
      setPastedId(null);
    }, 1200);
  };

  const handleClearAllWithConfirm = () => {
    if (window.confirm('¿Seguro que deseas vaciar todos los prefabs anclados en el portapapeles?')) {
      onClearAll();
    }
  };

  if (!isOpen) return null;

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
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '920px',
          height: '82vh',
          maxHeight: '780px',
          backgroundColor: '#181b22',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0'
        }}
      >
        {/* Cabecera */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#13151a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.2)'
              }}
            >
              <Pin size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#ffffff' }}>
                  Prefabs Anclados en el Portapapeles
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8'
                  }}
                >
                  {pinnedAssets.length}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Selecciones y estructuras reutilizables para pegar en cualquier capítulo
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pinnedAssets.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearAllWithConfirm}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  gap: '6px'
                }}
                title="Vaciar todos los prefabs anclados"
              >
                <Trash2 size={13} />
                <span>Vaciar Todo</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}
              title="Cerrar (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          {/* Input de Búsqueda */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              maxWidth: '360px'
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              className="input-search"
              placeholder="Buscar por título o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '0.78rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filtros por Categoría */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterType === 'all' ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: filterType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === 'all' ? '#60a5fa' : '#94a3b8',
                fontWeight: filterType === 'all' ? 600 : 400
              }}
            >
              Todos ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('quest')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterType === 'quest' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: filterType === 'quest' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === 'quest' ? '#34d399' : '#94a3b8',
                fontWeight: filterType === 'quest' ? 600 : 400
              }}
            >
              🎯 Misiones ({counts.quest})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterType === 'image' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: filterType === 'image' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === 'image' ? '#a78bfa' : '#94a3b8',
                fontWeight: filterType === 'image' ? 600 : 400
              }}
            >
              🖼️ Decoraciones ({counts.image})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('mixed')}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filterType === 'mixed' ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: filterType === 'mixed' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === 'mixed' ? '#fbbf24' : '#94a3b8',
                fontWeight: filterType === 'mixed' ? 600 : 400
              }}
            >
              📦 Mixtos ({counts.mixed})
            </button>
          </div>
        </div>

        {/* Lista de Tarjetas */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            alignContent: 'start'
          }}
        >
          {filteredAssets.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#475569'
                }}
              >
                <Pin size={32} />
              </div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#cbd5e1' }}>
                {pinnedAssets.length === 0 
                  ? 'Tu portapapeles de prefabs está vacío' 
                  : 'No hay elementos que coincidan con el filtro'}
              </p>
              <p
                style={{
                  margin: '8px auto 0',
                  maxWidth: '460px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  color: '#94a3b8'
                }}
              >
                {pinnedAssets.length === 0 ? (
                  <>
                    Selecciona misiones o imágenes en el mapa y haz clic en{' '}
                    <strong style={{ color: '#fbbf24' }}>"📌 Anclar al Portapapeles"</strong> en el menú contextual
                    o en el inspector lateral para guardar estructuras reutilizables.
                  </>
                ) : (
                  'Intenta cambiar el término de búsqueda o selecciona la pestaña "Todos".'
                )}
              </p>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const qCount = asset.quests?.length || 0;
              const iCount = asset.images?.length || 0;

              let typeBadgeText = 'Mixto';
              let badgeBg = 'rgba(245, 158, 11, 0.15)';
              let badgeBorder = 'rgba(245, 158, 11, 0.35)';
              let badgeColor = '#fbbf24';

              if (qCount > 0 && iCount === 0) {
                typeBadgeText = qCount === 1 ? '1 Misión' : `${qCount} Misiones`;
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeBorder = 'rgba(16, 185, 129, 0.35)';
                badgeColor = '#34d399';
              } else if (qCount === 0 && iCount > 0) {
                typeBadgeText = iCount === 1 ? '1 Imagen' : `${iCount} Imágenes`;
                badgeBg = 'rgba(139, 92, 246, 0.15)';
                badgeBorder = 'rgba(139, 92, 246, 0.35)';
                badgeColor = '#a78bfa';
              } else {
                typeBadgeText = `${qCount} M + ${iCount} I`;
              }

              const isJustPasted = pastedId === asset.id;

              return (
                <div
                  key={asset.id}
                  style={{
                    backgroundColor: '#1e222b',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Top Bar */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: badgeBg,
                          border: `1px solid ${badgeBorder}`,
                          color: badgeColor
                        }}
                      >
                        {typeBadgeText}
                      </span>

                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Calendar size={11} />
                        {new Date(asset.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Título */}
                    <h4
                      style={{
                        margin: '0 0 8px',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={asset.title}
                    >
                      {asset.title}
                    </h4>

                    {/* Tira de Miniaturas */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        overflowX: 'auto',
                        minHeight: '36px'
                      }}
                    >
                      {asset.quests && asset.quests.slice(0, 5).map((q: any, idx: number) => {
                        const iconVal = q.icon || (q.tasks && q.tasks[0]?.item) || 'minecraft:book';
                        return (
                          <div
                            key={idx}
                            title={q.title || q.id}
                            style={{ flexShrink: 0 }}
                          >
                            <QuestItemThumbnail icon={iconVal} size={26} />
                          </div>
                        );
                      })}

                      {asset.images && asset.images.slice(0, 4).map((img: any, idx: number) => {
                        return (
                          <div
                            key={`img-${idx}`}
                            title={img.image || 'Decoración'}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              flexShrink: 0
                            }}
                          >
                            🖼️
                          </div>
                        );
                      })}

                      {(qCount + iCount) > 7 && (
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, padding: '0 4px' }}>
                          +{(qCount + iCount) - 7}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handlePaste(asset)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: isJustPasted ? '#10b981' : 'var(--accent-color, #3b82f6)',
                        borderColor: isJustPasted ? '#059669' : '#2563eb',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s ease'
                      }}
                      title="Pegar este prefab en el centro de tu pantalla actual"
                    >
                      {isJustPasted ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isJustPasted ? '¡Pegado!' : 'Pegar en el Mapa'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onDeleteAsset(asset.id)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                      title="Desanclar este prefab del portapapeles"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#f87171';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del modal con tips */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#13151a',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#64748b',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} style={{ color: '#fbbf24' }} />
            <span>Al pegar, se reasignan nuevos IDs hexadecimales automáticamente para evitar colisiones.</span>
          </div>
          <div>
            <span>Presiona <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>Esc</kbd> para cerrar</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
