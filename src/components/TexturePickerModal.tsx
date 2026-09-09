import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Image as ImageIcon, Layers, Box, Sparkles } from 'lucide-react';
import { isBlockTexture, IsometricBlockThumbnail } from '../utils/isometricBlockRenderer';

interface TexturePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (textureValue: string) => void;
  title?: string;
  targetType?: 'icon' | 'image';
}

type CategoryType = 'all' | 'item' | 'block' | 'other';

export const TexturePickerModal: React.FC<TexturePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Explorador de Texturas',
  targetType = 'icon'
}) => {
  const [textures, setTextures] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 120;

  // Cargar índice de texturas cuando se abre el modal por primera vez
  useEffect(() => {
    if (!isOpen) return;

    if (textures.length === 0) {
      setLoading(true);
      const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
      const cleanBase = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
      
      fetch(`${cleanBase}textures/textures-index.json`)
        .then(res => {
          if (!res.ok) throw new Error('No se pudo cargar el índice de texturas');
          return res.json();
        })
        .then((data: string[]) => {
          // Normalizar siempre backslashes de Windows (\) a forward slashes (/)
          const normalized = data.map((t: string) => t.replace(/\\/g, '/'));
          setTextures(normalized);
          setLoading(false);
        })
        .catch(err => {
          console.warn('Error cargando textures-index.json:', err);
          setLoading(false);
        });
    }
  }, [isOpen, textures.length]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Contar y listar namespaces disponibles con orden prioritario (minecraft primero)
  const { namespaces, namespaceCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    textures.forEach(t => {
      const slashIdx = t.indexOf('/');
      if (slashIdx !== -1) {
        const ns = t.substring(0, slashIdx);
        counts.set(ns, (counts.get(ns) || 0) + 1);
      }
    });

    const sorted = Array.from(counts.keys()).sort((a, b) => {
      if (a === 'minecraft') return -1;
      if (b === 'minecraft') return 1;
      return a.localeCompare(b);
    });

    return { namespaces: sorted, namespaceCounts: counts };
  }, [textures]);

  // Filtrado reactivo por namespace, categoría y consulta de búsqueda
  const filteredTextures = useMemo(() => {
    let list = textures;

    // 1. Filtrar por mod / namespace
    if (selectedNamespace !== 'all') {
      list = list.filter(t => t.startsWith(`${selectedNamespace}/`));
    }

    // 2. Filtrar por tipo / categoría (items, blocks, decor/other)
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'item') {
        list = list.filter(t => t.includes('/item/') || t.includes('/items/'));
      } else if (selectedCategory === 'block') {
        list = list.filter(t => t.includes('/block/') || t.includes('/blocks/'));
      } else if (selectedCategory === 'other') {
        list = list.filter(t => !t.includes('/item/') && !t.includes('/items/') && !t.includes('/block/') && !t.includes('/blocks/'));
      }
    }

    // 3. Filtrar por texto de búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(t => t.toLowerCase().includes(q));
    }

    return list;
  }, [textures, selectedNamespace, selectedCategory, searchQuery]);

  // Paginación para rendimiento fluido
  const paginatedTextures = useMemo(() => {
    return filteredTextures.slice(0, page * PAGE_SIZE);
  }, [filteredTextures, page]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedNamespace, selectedCategory]);

  if (!isOpen) return null;

  const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const cleanBase = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;

  const handleChoose = (texturePath: string) => {
    // texturePath: e.g. "atilas_sources/textures/magic/magic-circle-00.png" o "minecraft/item/diamond.png"
    const clean = texturePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const slashIdx = clean.indexOf('/');
    if (slashIdx === -1) {
      onSelect(clean);
      onClose();
      return;
    }

    const namespace = clean.substring(0, slashIdx);
    const subpath = clean.substring(slashIdx + 1);

    if (targetType === 'image') {
      // Para imágenes decorativas de FTB Quests:
      // Formato obligatorio: "<namespace>:textures/<ruta>"
      // Si subpath ya comienza con "textures/", no duplicamos el prefijo:
      const textureRelative = subpath.startsWith('textures/') 
        ? subpath 
        : `textures/${subpath}`;
      onSelect(`${namespace}:${textureRelative}`);
    } else {
      // Para misiones, tareas y recompensas (icon / item):
      // Si proviene de item o block estándar, usamos el ID del item: "<namespace>:<item_name>"
      if (subpath.startsWith('item/') || subpath.startsWith('block/')) {
        const filename = subpath.split('/').pop() || '';
        const itemName = filename.endsWith('.png') ? filename.slice(0, -4) : filename;
        onSelect(`${namespace}:${itemName}`);
      } else {
        // Texturas arbitrarias para misiones o iconos personalizados
        const textureRelative = subpath.startsWith('textures/') 
          ? subpath 
          : `textures/${subpath}`;
        onSelect(`${namespace}:${textureRelative}`);
      }
    }
    onClose();
  };

  return createPortal(
    <div 
      className="modal-backdrop modal-overlay-picker" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(10, 12, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100200
      }}
    >
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '920px', 
          maxWidth: '95vw', 
          height: '86vh', 
          maxHeight: '860px', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '22px',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
          zIndex: 100000
        }}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ImageIcon size={22} className="text-accent" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#cdd6f4' }}>{title}</h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {targetType === 'image' 
                  ? 'Seleccionando textura para Imagen decorativa (formato: namespace:textures/...)' 
                  : 'Seleccionando recurso para Icono o Ítem (formato: namespace:item o namespace:textures/...)'}
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '10px', marginLeft: '6px' }}>
              {filteredTextures.length} texturas
            </span>
          </div>
          <button 
            className="btn-icon" 
            onClick={onClose}
            title="Cerrar (Esc)"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filtros: Búsqueda y Dropdown de Mods */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre o ruta (ej. diamond, sword, magic, stone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
              autoFocus
            />
          </div>

          <select
            className="input-field"
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            style={{ width: '260px' }}
          >
            <option value="all">Todos los Mods ({namespaces.length} mods / {textures.length} tex)</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>
                {ns} ({namespaceCounts.get(ns)} texturas)
              </option>
            ))}
          </select>
        </div>

        {/* Pestañas de Agrupamiento / Categorías */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginRight: '4px' }}>Categoría:</span>
          
          <button
            className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setSelectedCategory('all')}
          >
            <Layers size={14} /> Todas
          </button>

          <button
            className={`btn ${selectedCategory === 'item' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setSelectedCategory('item')}
          >
            <Box size={14} /> Ítems
          </button>

          <button
            className={`btn ${selectedCategory === 'block' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setSelectedCategory('block')}
          >
            <Box size={14} /> Bloques (3D)
          </button>

          <button
            className={`btn ${selectedCategory === 'other' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setSelectedCategory('other')}
          >
            <Sparkles size={14} /> Decoración / Efectos
          </button>
        </div>

        {/* Cuadrícula de Texturas con Scroll */}
        <div style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px' }}>
          {loading ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <p>Cargando catálogo de texturas...</p>
            </div>
          ) : paginatedTextures.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <p>No se encontraron texturas que coincidan con los filtros.</p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '10px'
              }}>
                {paginatedTextures.map((texPath) => {
                  const parts = texPath.split('/');
                  const ns = parts[0];
                  const fn = parts[parts.length - 1];
                  const nameClean = fn.endsWith('.png') ? fn.slice(0, -4) : fn;
                  const imgUrl = `${cleanBase}textures/${texPath}`;

                  return (
                    <div
                      key={texPath}
                      onClick={() => handleChoose(texPath)}
                      title={`${texPath} (Clic para seleccionar)`}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(137, 180, 250, 0.15)';
                        e.currentTarget.style.borderColor = '#89b4fa';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px'
                      }}>
                        {isBlockTexture(texPath) ? (
                          <IsometricBlockThumbnail
                            src={imgUrl}
                            size={36}
                            altText={nameClean}
                          />
                        ) : (
                          <img
                            src={imgUrl}
                            alt={nameClean}
                            style={{
                              maxWidth: '36px',
                              maxHeight: '36px',
                              objectFit: 'contain',
                              imageRendering: 'pixelated'
                            }}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div style={{ textAlign: 'center', width: '100%', overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#cdd6f4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {nameClean}
                        </div>
                        <div style={{
                          fontSize: '0.62rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}>
                          <span>{ns}</span>
                          {isBlockTexture(texPath) && (
                            <span 
                              style={{ 
                                fontSize: '0.55rem', 
                                padding: '0 3px', 
                                borderRadius: '3px', 
                                background: 'rgba(166, 227, 161, 0.15)', 
                                color: '#a6e3a1',
                                border: '1px solid rgba(166, 227, 161, 0.3)',
                                fontWeight: 700
                              }}
                              title="Renderizado en cubo 3D isométrico"
                            >
                              3D
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {paginatedTextures.length < filteredTextures.length && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '8px 24px', fontSize: '0.82rem' }}
                  >
                    Cargar más texturas ({filteredTextures.length - paginatedTextures.length} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
