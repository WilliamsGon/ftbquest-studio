import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage, Arrow } from 'react-konva';
import useImage from 'use-image';
import { MousePointer, Hand, Magnet, Sparkles, ChevronDown, Search } from 'lucide-react';
import Konva from 'konva';
import { QuestShape } from './QuestShape';
import { Minimap } from './Minimap';
import { QuestSearchBar, type SearchMatch } from './QuestSearchBar';

interface CanvasProps {
  quests: any[];
  images: any[];
  layersVisible: { quests: boolean; images: boolean; dependencies: boolean };
  selection: { 
    type: 'quest' | 'image' | 'mixed' | null; 
    ids: (string | number)[]; 
    items: { type: 'quest' | 'image'; id: string | number }[];
  };
  setSelection: (sel: { 
    type: 'quest' | 'image' | 'mixed' | null; 
    ids: (string | number)[]; 
    id?: string | number | null;
    items?: { type: 'quest' | 'image'; id: string | number }[];
  }) => void;
  updateQuest: (idOrUpdatesList: any, updates?: any) => void;
  updateImage: (indexOrUpdatesList: any, updates?: any) => void;
  updateQuestsAndImages?: (questUpdatesList: any[], imageUpdatesList: any[]) => void;
  onPointerPosChange?: (pos: { x: number; y: number } | null) => void;
  onQuestContextMenu?: (questId: string, clientX: number, clientY: number) => void;
  visibleZLevels: number[];
  isPinnedDrawerOpen: boolean;
  setIsPinnedDrawerOpen: (open: boolean) => void;
  pinnedCount: number;
  snapToGrid?: boolean;
  setSnapToGrid?: (snap: boolean) => void;
  snapMode?: 'relative' | 'absolute';
  setSnapMode?: (mode: 'relative' | 'absolute') => void;
  lockedKeys?: string[];
  onConnectQuests?: (sourceQuestId: string, targetQuestId: string) => void;
  cycleNodeIds?: Set<string>;
  brokenDepQuestIds?: Set<string>;
  onAutoLayout?: (direction: 'LR' | 'TB', onlySelected: boolean) => void;
  initialStagePos?: { x: number; y: number };
  initialStageScale?: number;
  onCameraChange?: (pos: { x: number; y: number }, scale: number) => void;
}

const SCALE_FACTOR = 40; // 1.0d = 40 pixels

const getDValue = (obj: any): number => {
  if (obj && obj.__type === 'number') return obj.value;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'object' && obj !== null && typeof obj.value === 'number') return obj.value;
  const parsed = parseFloat(String(obj));
  return isNaN(parsed) ? 0 : parsed;
};

// Helper para obtener las URLs candidatas a ser la textura
const getCandidateUrls = (icon: any): string[] => {
  if (!icon) return [];

  let iconStr = '';
  if (typeof icon === 'string') {
    iconStr = icon;
  } else if (icon && typeof icon === 'object' && icon.id) {
    iconStr = icon.id;
  }

  if (!iconStr) return [];

  let namespace = 'minecraft';
  let path = 'stone';

  const parts = iconStr.split(':');
  if (parts.length === 2) {
    namespace = parts[0];
    path = parts[1];
  } else if (parts.length === 1) {
    path = parts[0];
  }

  const urls: string[] = [];
  const pathClean = path.endsWith('.png') ? path.slice(0, -4) : path;

  // Resolver prefijo base de Vite de forma robusta
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const cleanBase = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;

  if (path.includes('textures/')) {
    const stripped = pathClean.replace(/^textures\//, '');
    urls.push(`${cleanBase}textures/${namespace}/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${path}`);
    urls.push(`${cleanBase}textures/${namespace}/${stripped}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${stripped}`);
  } else {
    // Intentar bajo textures/
    urls.push(`${cleanBase}textures/${namespace}/textures/${pathClean}.png`);
    // Fallbacks tradicionales
    urls.push(`${cleanBase}textures/${namespace}/item/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/block/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${pathClean}.png`);
  }

  return Array.from(new Set(urls));
};

// Componente para cargar texturas de FTB extraídas
const FtbTexture: React.FC<{ icon: any, width: number, height: number, color?: number, opacity?: number }> = ({ icon, width, height, color, opacity = 1.0 }) => {
  const candidates = React.useMemo(() => getCandidateUrls(icon), [icon]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    setCandidateIdx(0);
  }, [candidates]);

  const currentUrl = candidates[candidateIdx] || '';
  const [image, status] = useImage(currentUrl);

  useEffect(() => {
    if (status === 'failed' && candidateIdx < candidates.length - 1) {
      setCandidateIdx(prev => prev + 1);
    }
  }, [status, candidateIdx, candidates]);

  // Cachear para que los filtros tengan efecto
  useEffect(() => {
    if (status === 'loaded' && imageRef.current && color !== undefined && color !== 16777215) {
      imageRef.current.cache();
    }
  }, [image, status, color, width, height]);

  if (status === 'loaded' && image) {
    const hasColorFilter = color !== undefined && color !== 16777215;
    let r = 255;
    let g = 255;
    let b = 255;
    
    if (hasColorFilter) {
      r = (color >> 16) & 255;
      g = (color >> 8) & 255;
      b = color & 255;
    }

    return (
      <KonvaImage
        ref={imageRef}
        image={image}
        width={width}
        height={height}
        offsetX={width / 2}
        offsetY={height / 2}
        opacity={opacity}
        filters={hasColorFilter ? [Konva.Filters.RGB] : undefined}
        red={r}
        green={g}
        blue={b}
      />
    );
  }

  // Fallback si no hay textura disponible
  return (
    <Circle
      radius={Math.min(width, height) / 2}
      fill="#1a1d24"
      stroke="#4a4d5c"
      strokeWidth={2}
    />
  );
};

export const EditorCanvas: React.FC<CanvasProps> = ({ 
  quests, 
  images, 
  layersVisible, 
  selection, 
  setSelection, 
  updateQuest, 
  updateImage, 
  updateQuestsAndImages,
  onPointerPosChange, 
  onQuestContextMenu, 
  visibleZLevels,
  isPinnedDrawerOpen,
  setIsPinnedDrawerOpen,
  pinnedCount,
  snapToGrid: propSnapToGrid,
  setSnapToGrid: propSetSnapToGrid,
  snapMode: propSnapMode,
  setSnapMode: propSetSnapMode,
  lockedKeys = [],
  onConnectQuests,
  cycleNodeIds = new Set(),
  brokenDepQuestIds = new Set(),
  onAutoLayout,
  initialStagePos,
  initialStageScale,
  onCameraChange
}) => {
  const [isAutoLayoutMenuOpen, setIsAutoLayoutMenuOpen] = useState(false);
  const [stageScale, setStageScale] = useState(initialStageScale ?? 1);
  const [stagePos, setStagePos] = useState(initialStagePos ?? { x: 0, y: 0 });
  const [localSnapToGrid, setLocalSnapToGrid] = useState(true);
  const [localSnapMode, setLocalSnapMode] = useState<'relative' | 'absolute'>('relative');
  const snapToGrid = propSnapToGrid !== undefined ? propSnapToGrid : localSnapToGrid;
  const setSnapToGrid = propSetSnapToGrid || setLocalSnapToGrid;
  const snapMode = propSnapMode !== undefined ? propSnapMode : localSnapMode;
  const setSnapMode = propSetSnapMode || setLocalSnapMode;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Herramientas y estados del cursor
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
  const [isPanning, setIsPanning] = useState(false);

  // Selección de área (Selection Rectangle)
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [startPointerPos, setStartPointerPos] = useState<{ x: number, y: number } | null>(null);

  // Arrastre múltiple (dragOffset en tiempo real)
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  // Conexión interactiva de dependencias (Wire Dragging)
  const [wireDrag, setWireDrag] = useState<{
    sourceQuestId: string;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [hoveredQuestId, setHoveredQuestId] = useState<string | null>(null);

  // Buscador Rápido de Misiones (Ctrl + F)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Atajo de teclado: Ctrl+F para abrir el buscador rápido
  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const searchMatches = useMemo<SearchMatch[]>(() => {
    const qTrim = searchQuery.trim().toLowerCase();
    if (!qTrim) return [];

    const results: SearchMatch[] = [];

    quests.forEach(q => {
      const qId = String(q.id || '').toLowerCase();
      const title = (typeof q.title === 'string' ? q.title : '').toLowerCase();
      const subtitle = (typeof q.subtitle === 'string' ? q.subtitle : '').toLowerCase();

      // 1. Título
      if (title.includes(qTrim)) {
        results.push({ quest: q, matchField: 'title', matchDetail: q.title });
        return;
      }

      // 2. ID
      if (qId.includes(qTrim)) {
        results.push({ quest: q, matchField: 'id', matchDetail: String(q.id) });
        return;
      }

      // 3. Subtítulo
      if (subtitle.includes(qTrim)) {
        results.push({ quest: q, matchField: 'subtitle', matchDetail: q.subtitle });
        return;
      }

      // 4. Descripción
      if (q.description) {
        const descArr = Array.isArray(q.description) ? q.description : [q.description];
        const matchedLine = descArr.find((line: any) => typeof line === 'string' && line.toLowerCase().includes(qTrim));
        if (matchedLine) {
          results.push({ quest: q, matchField: 'description', matchDetail: String(matchedLine) });
          return;
        }
      }

      // 5. Tareas
      if (q.tasks) {
        const taskList = Array.isArray(q.tasks) ? q.tasks : [q.tasks];
        for (const t of taskList) {
          if (!t) continue;
          const tTitle = (typeof t.title === 'string' ? t.title : '').toLowerCase();
          const tType = (typeof t.type === 'string' ? t.type : '').toLowerCase();
          const itemStr = typeof t.item === 'string' ? t.item : (t.item && typeof t.item.id === 'string' ? t.item.id : '');
          const tItem = itemStr.toLowerCase();
          if (tTitle.includes(qTrim)) {
            results.push({ quest: q, matchField: 'task', matchDetail: `Tarea: ${t.title}` });
            return;
          }
          if (tItem.includes(qTrim)) {
            results.push({ quest: q, matchField: 'task', matchDetail: `Item: ${itemStr}` });
            return;
          }
          if (tType.includes(qTrim)) {
            results.push({ quest: q, matchField: 'task', matchDetail: `Tipo: ${t.type}` });
            return;
          }
        }
      }

      // 6. Recompensas
      if (q.rewards) {
        const rewardList = Array.isArray(q.rewards) ? q.rewards : [q.rewards];
        for (const r of rewardList) {
          if (!r) continue;
          const rTitle = (typeof r.title === 'string' ? r.title : '').toLowerCase();
          const rType = (typeof r.type === 'string' ? r.type : '').toLowerCase();
          const itemStr = typeof r.item === 'string' ? r.item : (r.item && typeof r.item.id === 'string' ? r.item.id : '');
          const rItem = itemStr.toLowerCase();
          if (rTitle.includes(qTrim)) {
            results.push({ quest: q, matchField: 'reward', matchDetail: `Recompensa: ${r.title}` });
            return;
          }
          if (rItem.includes(qTrim)) {
            results.push({ quest: q, matchField: 'reward', matchDetail: `Item: ${itemStr}` });
            return;
          }
          if (rType.includes(qTrim)) {
            results.push({ quest: q, matchField: 'reward', matchDetail: `Tipo: ${r.type}` });
            return;
          }
        }
      }
    });

    return results;
  }, [quests, searchQuery]);

  const matchedQuestIds = useMemo(() => {
    return new Set(searchMatches.map(m => String(m.quest.id)));
  }, [searchMatches]);

  const activeMatch = searchMatches[activeMatchIndex] || null;
  const activeMatchQuestId = activeMatch ? String(activeMatch.quest.id) : null;

  useEffect(() => {
    if (activeMatchIndex >= searchMatches.length) {
      setActiveMatchIndex(0);
    }
  }, [searchMatches.length, activeMatchIndex]);

  const centerOnQuest = useCallback((quest: any) => {
    if (!quest) return;
    const qx = getDValue(quest.x) * SCALE_FACTOR;
    const qy = getDValue(quest.y) * SCALE_FACTOR;
    setStagePos({
      x: dimensions.width / 2 - qx * stageScale,
      y: dimensions.height / 2 - qy * stageScale,
    });
    setSelection({
      type: 'quest',
      ids: [quest.id],
      id: quest.id,
      items: [{ type: 'quest', id: quest.id }]
    });
  }, [dimensions, stageScale, setSelection]);

  const handleNavigateMatch = useCallback((index: number) => {
    if (index < 0 || index >= searchMatches.length) return;
    setActiveMatchIndex(index);
    centerOnQuest(searchMatches[index].quest);
  }, [searchMatches, centerOnQuest]);

  useEffect(() => {
    onCameraChange?.(stagePos, stageScale);
  }, [stagePos, stageScale, onCameraChange]);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
      // Centrar el plano (0,0) en el medio de la pantalla si no hay initialStagePos
      if (!initialStagePos) {
        setStagePos({
          x: containerRef.current.offsetWidth / 2,
          y: containerRef.current.offsetHeight / 2
        });
      }
    }

    onCameraChange?.(stagePos, stageScale);
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Atajo de teclado: Barra espaciadora para mover plano
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setActiveTool('pan');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Cerrar menú de Auto-Organizar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isAutoLayoutMenuOpen) return;
    const handleDown = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') {
        setIsAutoLayoutMenuOpen(false);
        return;
      }
      if (e instanceof MouseEvent) {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('.auto-layout-menu-wrapper')) {
          return; // No cerrar si el clic es dentro del menú o sus botones
        }
        setIsAutoLayoutMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleDown);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleDown);
    };
  }, [isAutoLayoutMenuOpen]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);
    setStagePos({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };


  // Helper para deducir el ícono de una misión
  const getQuestIcon = (q: any) => {
    if (q.icon) return q.icon;
    if (q.tasks && Array.isArray(q.tasks) && q.tasks.length > 0) {
      const task = q.tasks[0];
      if (task.type === 'item') return task.item;
    }
    if (q.tasks && !Array.isArray(q.tasks) && q.tasks.type === 'item') {
      return q.tasks.item;
    }
    return 'minecraft:stone'; // Fallback total
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0,
        cursor: activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default'
      }}
    >
      {/* Barra de Herramientas Flotante */}
      <div className="canvas-toolbar">
        <button 
          className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => setActiveTool('select')}
          title="Herramienta de Selección (Arrastrar área)"
        >
          <MousePointer size={16} />
          Seleccionar
        </button>
        <button 
          className={`toolbar-btn ${activeTool === 'pan' ? 'active' : ''}`}
          onClick={() => setActiveTool('pan')}
          title="Mover Plano (Mantén presionada la Barra Espaciadora)"
        >
          <Hand size={16} />
          Mover Plano <kbd>Space</kbd>
        </button>
        <button 
          className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
          onClick={() => setSnapToGrid(!snapToGrid)}
          title="Ajustar a Rejilla (Snap to Grid)"
        >
          <Magnet size={16} />
          Imán (Snap)
        </button>
        {snapToGrid && (
          <button 
            className={`toolbar-btn ${snapMode === 'relative' ? 'active' : ''}`}
            onClick={() => setSnapMode(snapMode === 'relative' ? 'absolute' : 'relative')}
            title={snapMode === 'relative' 
              ? 'Modo Relativo: Mantiene distancias e intervalos entre elementos del grupo al mover' 
              : 'Modo Absoluto: Colapsa / centra las imágenes al punto de ancla'}
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          >
            {snapMode === 'relative' ? '🧲 Relativo' : '🎯 Absoluto'}
          </button>
        )}
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
        <button 
          className={`toolbar-btn ${isPinnedDrawerOpen ? 'active' : ''}`}
          onClick={() => setIsPinnedDrawerOpen(!isPinnedDrawerOpen)}
          title="Ver elementos anclados en el portapapeles (Prefabs)"
        >
          <span>📌</span> Anclados
          {pinnedCount > 0 && (
            <span style={{
              background: isPinnedDrawerOpen ? 'rgba(17, 17, 27, 0.2)' : 'rgba(255,255,255,0.2)',
              color: isPinnedDrawerOpen ? '#11111b' : 'inherit',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '8px',
              marginLeft: '4px'
            }}>{pinnedCount}</span>
          )}
        </button>

        {onAutoLayout && (
          <>
            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <div className="auto-layout-menu-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <button
                className={`toolbar-btn ${isAutoLayoutMenuOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoLayoutMenuOpen(!isAutoLayoutMenuOpen);
                }}
                style={{ gap: '6px' }}
                title="Organizar árbol de misiones automáticamente según sus dependencias"
              >
                <Sparkles size={15} style={{ color: isAutoLayoutMenuOpen ? '#ffffff' : 'var(--accent-color)' }} />
                <span>Auto-Organizar</span>
                <ChevronDown size={13} style={{ opacity: 0.7, transform: isAutoLayoutMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {isAutoLayoutMenuOpen && (() => {
                const selectedQuestsCount = selection.items.filter(i => i.type === 'quest').length;
                const hasMultiQuests = selectedQuestsCount > 1;

                return (
                  <div 
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      borderRadius: '10px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 1000,
                      minWidth: '230px',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                      background: 'rgba(24, 27, 34, 0.96)',
                      border: '1px solid var(--panel-border)',
                      backdropFilter: 'blur(16px)'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '2px 6px', fontWeight: 600 }}>
                      {hasMultiQuests ? `SELECCIÓN (${selectedQuestsCount} misiones)` : 'TODO EL CAPÍTULO'}
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '7px 12px', fontSize: '0.78rem', gap: '8px' }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAutoLayout('LR', hasMultiQuests);
                        setIsAutoLayoutMenuOpen(false);
                      }}
                    >
                      <span>➡️</span> Horizontal (Izq ➔ Der)
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '7px 12px', fontSize: '0.78rem', gap: '8px' }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAutoLayout('TB', hasMultiQuests);
                        setIsAutoLayoutMenuOpen(false);
                      }}
                    >
                      <span>⬇️</span> Vertical (Arriba ➔ Abajo)
                    </button>

                    {hasMultiQuests && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '2px 6px', fontWeight: 600 }}>
                          TODO EL CAPÍTULO
                        </div>
                        <button
                          className="btn btn-secondary"
                          style={{ justifyContent: 'flex-start', padding: '7px 12px', fontSize: '0.78rem', gap: '8px' }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAutoLayout('LR', false);
                            setIsAutoLayoutMenuOpen(false);
                          }}
                        >
                          <span>🌐</span> Todo (Horizontal)
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ justifyContent: 'flex-start', padding: '7px 12px', fontSize: '0.78rem', gap: '8px' }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAutoLayout('TB', false);
                            setIsAutoLayoutMenuOpen(false);
                          }}
                        >
                          <span>🌐</span> Todo (Vertical)
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}
        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
        <button
          className={`toolbar-btn ${isSearchOpen ? 'active' : ''}`}
          onClick={() => setIsSearchOpen(prev => !prev)}
          title="Buscar misiones en el lienzo (Ctrl + F)"
          style={{ gap: '6px' }}
        >
          <Search size={15} style={{ color: isSearchOpen ? '#ffffff' : 'var(--accent-color)' }} />
          <span>Buscar</span>
          <kbd style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px' }}>Ctrl+F</kbd>
        </button>
      </div>

      {/* Buscador Rápido en el Lienzo (Ctrl + F) */}
      <QuestSearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        query={searchQuery}
        onQueryChange={(q) => {
          setSearchQuery(q);
          setActiveMatchIndex(0);
        }}
        matches={searchMatches}
        activeIndex={activeMatchIndex}
        onNavigateMatch={handleNavigateMatch}
        onSelectQuest={(q) => centerOnQuest(q)}
      />

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={activeTool === 'pan'}
        onDragStart={(e) => {
          if (e.target === e.target.getStage()) {
            setIsPanning(true);
          }
        }}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
            setIsPanning(false);
          }
        }}
        onMouseDown={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          
          // Clic en el fondo del Stage para empezar la selección por área (solo en modo seleccionar)
          if (activeTool === 'select' && e.target === stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const localX = (pointer.x - stage.x()) / stage.scaleX();
              const localY = (pointer.y - stage.y()) / stage.scaleY();
              setStartPointerPos({ x: localX, y: localY });
              setSelectionRect({ x: localX, y: localY, w: 0, h: 0 });
              setSelection({ type: null, ids: [], items: [] });
            }
          }
        }}
        onMouseMove={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const localX = (pointer.x - stage.x()) / stage.scaleX() / SCALE_FACTOR;
              const localY = (pointer.y - stage.y()) / stage.scaleY() / SCALE_FACTOR;
              onPointerPosChange?.({ x: localX, y: localY });
            }
          }

          if (wireDrag) {
            if (stage) {
              const pointer = stage.getPointerPosition();
              if (pointer) {
                const localX = (pointer.x - stage.x()) / stage.scaleX();
                const localY = (pointer.y - stage.y()) / stage.scaleY();
                setWireDrag(prev => prev ? ({ ...prev, currentX: localX, currentY: localY }) : null);
              }
            }
          }

          if (!startPointerPos || !selectionRect) return;
          if (!stage) return;
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const localX = (pointer.x - stage.x()) / stage.scaleX();
            const localY = (pointer.y - stage.y()) / stage.scaleY();
            setSelectionRect({
              x: Math.min(startPointerPos.x, localX),
              y: Math.min(startPointerPos.y, localY),
              w: Math.abs(localX - startPointerPos.x),
              h: Math.abs(localY - startPointerPos.y),
            });
          }
        }}
        onMouseLeave={() => {
          onPointerPosChange?.(null);
        }}
        onMouseUp={() => {
          if (wireDrag) {
            setWireDrag(null);
          }
          if (startPointerPos && selectionRect) {
            // Evaluar intersecciones al soltar el mouse
            const selectedImageIndices: number[] = [];
            const selectedQuestIds: string[] = [];

            // Solo evaluar si la caja de selección tiene algún tamaño mínimo para evitar falsos clicks
            if (selectionRect.w > 3 || selectionRect.h > 3) {
              if (layersVisible.images) {
                images.forEach((img, idx) => {
                  const imageX = getDValue(img.x) * SCALE_FACTOR;
                  const imageY = getDValue(img.y) * SCALE_FACTOR;
                  const w = getDValue(img.width) * SCALE_FACTOR;
                  const h = getDValue(img.height) * SCALE_FACTOR;

                  const imgX1 = imageX - w / 2;
                  const imgX2 = imageX + w / 2;
                  const imgY1 = imageY - h / 2;
                  const imgY2 = imageY + h / 2;

                  const rectX1 = selectionRect.x;
                  const rectX2 = selectionRect.x + selectionRect.w;
                  const rectY1 = selectionRect.y;
                  const rectY2 = selectionRect.y + selectionRect.h;

                  const isZVisible = visibleZLevels.includes(Number(img.order?.value ?? img.order ?? 1));
                  const isImgLocked = lockedKeys.includes(`img-${idx}`);
                  const intersects = !isImgLocked && isZVisible && imgX1 < rectX2 && imgX2 > rectX1 && imgY1 < rectY2 && imgY2 > rectY1;
                  if (intersects) {
                    selectedImageIndices.push(idx);
                  }
                });
              }

              if (layersVisible.quests) {
                quests.forEach((q) => {
                  const isQLocked = lockedKeys.includes(`quest-${q.id}`);
                  if (isQLocked) return;
                  const x = getDValue(q.x) * SCALE_FACTOR;
                  const y = getDValue(q.y) * SCALE_FACTOR;
                  const sizeVal = getDValue(q.size) || 1.0;
                  const nodeSize = 40 * sizeVal;

                  const qX1 = x - nodeSize / 2;
                  const qX2 = x + nodeSize / 2;
                  const qY1 = y - nodeSize / 2;
                  const qY2 = y + nodeSize / 2;

                  const rectX1 = selectionRect.x;
                  const rectX2 = selectionRect.x + selectionRect.w;
                  const rectY1 = selectionRect.y;
                  const rectY2 = selectionRect.y + selectionRect.h;

                  const intersects = qX1 < rectX2 && qX2 > rectX1 && qY1 < rectY2 && qY2 > rectY1;
                  if (intersects) {
                    selectedQuestIds.push(q.id);
                  }
                });
              }
            }

            const selectedItems: { type: 'quest' | 'image'; id: string | number }[] = [];
            selectedImageIndices.forEach(idx => selectedItems.push({ type: 'image', id: idx }));
            selectedQuestIds.forEach(id => selectedItems.push({ type: 'quest', id }));

            if (selectedItems.length > 0) {
              const hasQuests = selectedItems.some(i => i.type === 'quest');
              const hasImages = selectedItems.some(i => i.type === 'image');
              let type: 'quest' | 'image' | 'mixed' = 'mixed';
              if (hasQuests && !hasImages) type = 'quest';
              if (!hasQuests && hasImages) type = 'image';
              
              setSelection({ 
                type, 
                ids: selectedItems.map(i => i.id), 
                items: selectedItems 
              });
            } else {
              setSelection({ type: null, ids: [], items: [] });
            }
          }
          
          setSelectionRect(null);
          setStartPointerPos(null);
        }}
        onClick={(e) => {
          // Deseleccionar si se hace clic en el fondo
          if (e.evt.button === 0 && e.target === e.target.getStage() && !startPointerPos) {
            setSelection({ type: null, ids: [], items: [] });
          }
        }}
      >
        <Layer>
          {/* Ejes centrales */}
          <Line points={[-10000, 0, 10000, 0]} stroke="rgba(255,255,255,0.1)" strokeWidth={1 / stageScale} />
          <Line points={[0, -10000, 0, 10000]} stroke="rgba(255,255,255,0.1)" strokeWidth={1 / stageScale} />
        </Layer>

        {layersVisible.images && (
          <Layer>
            {/* Ordenar imágenes por "order" antes de renderizar para simular z-index */}
            {[...images].map((img, idx) => ({ ...img, originalIndex: idx }))
              .sort((a, b) => getDValue(a.order) - getDValue(b.order))
              .map((img) => {
              const idx = img.originalIndex;
              const isZVisible = visibleZLevels.includes(Number(img.order?.value ?? img.order ?? 1));
              if (!isZVisible) return null;

              const x = getDValue(img.x) * SCALE_FACTOR;
              const y = getDValue(img.y) * SCALE_FACTOR;
              const w = getDValue(img.width) * SCALE_FACTOR;
              const h = getDValue(img.height) * SCALE_FACTOR;
              const rot = getDValue(img.rotation);
              const isSelected = selection.items.some(item => item.type === 'image' && item.id === idx);
              const isLocked = lockedKeys.includes(`img-${idx}`);

              // Si este elemento está seleccionado y estamos arrastrando otro del grupo seleccionado
              const isOffsetApplied = isSelected && draggingId !== null && draggingId !== idx;
              const currentX = x + (isOffsetApplied ? dragOffset.x : 0);
              const currentY = y + (isOffsetApplied ? dragOffset.y : 0);

              return (
                <Group
                  key={`img-${idx}`}
                  x={currentX}
                  y={currentY}
                  rotation={rot}
                  draggable={!isLocked}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    // Selección individual o múltiple con Shift
                    if (e.evt.shiftKey) {
                      const isAlreadySelected = selection.items.some(item => item.type === 'image' && item.id === idx);
                      let newItems = [];
                      if (isAlreadySelected) {
                        newItems = selection.items.filter(item => !(item.type === 'image' && item.id === idx));
                      } else {
                        newItems = [...selection.items, { type: 'image' as const, id: idx }];
                      }
                      
                      const hasQuests = newItems.some(i => i.type === 'quest');
                      const hasImages = newItems.some(i => i.type === 'image');
                      const type = (hasQuests && hasImages) ? 'mixed' : (hasQuests ? 'quest' : (hasImages ? 'image' : null));
                      setSelection({ type, ids: newItems.map(i => i.id), items: newItems });
                    } else {
                      // Clic normal: Selecciona solo este
                      setSelection({ type: 'image', ids: [idx], items: [{ type: 'image', id: idx }] });
                    }
                  }}
                  onDragStart={(e) => {
                    if (isLocked) {
                      e.target.stopDrag();
                      return;
                    }
                    const isImgSelected = selection.items.some(item => item.type === 'image' && item.id === idx);
                    if (!isImgSelected) {
                      setSelection({ type: 'image', ids: [idx], items: [{ type: 'image', id: idx }] });
                    }
                    setDraggingId(idx);
                    setDragStartPos({ x: e.target.x(), y: e.target.y() });
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  onDragMove={(e) => {
                    const isImgSelected = selection.items.some(item => item.type === 'image' && item.id === idx);
                    if (isImgSelected && selection.items.length > 1) {
                      // Buscar si hay misiones seleccionadas
                      const anchorQuest = quests.find(q => selection.items.some(item => item.type === 'quest' && item.id === q.id));
                      if (anchorQuest && snapToGrid) {
                        const sizeVal = anchorQuest.size?.value ?? anchorQuest.size ?? 1.0;
                        const snapPixels = (sizeVal / 2) * SCALE_FACTOR;
                        
                        const qOrigX = getDValue(anchorQuest.x) * SCALE_FACTOR;
                        const qOrigY = getDValue(anchorQuest.y) * SCALE_FACTOR;
                        
                        // Desplazamiento bruto
                        const rawDeltaX = e.target.x() - dragStartPos!.x;
                        const rawDeltaY = e.target.y() - dragStartPos!.y;
                        
                        // Posición tentativa de la misión
                        const qTentX = qOrigX + rawDeltaX;
                        const qTentY = qOrigY + rawDeltaY;
                        
                        const qSnappedX = Math.round(qTentX / snapPixels) * snapPixels;
                        const qSnappedY = Math.round(qTentY / snapPixels) * snapPixels;
                        
                        const realDeltaX = qSnappedX - qOrigX;
                        const realDeltaY = qSnappedY - qOrigY;
                        
                        e.target.x(dragStartPos!.x + realDeltaX);
                        e.target.y(dragStartPos!.y + realDeltaY);
                        setDragOffset({ x: realDeltaX, y: realDeltaY });
                      } else {
                        // Comportamiento normal con o sin snap
                        if (snapToGrid) {
                          const snapPixels = 0.5 * SCALE_FACTOR;
                          const x = e.target.x();
                          const y = e.target.y();
                          const snappedX = Math.round(x / snapPixels) * snapPixels;
                          const snappedY = Math.round(y / snapPixels) * snapPixels;
                          e.target.x(snappedX);
                          e.target.y(snappedY);
                          setDragOffset({ x: snappedX - dragStartPos!.x, y: snappedY - dragStartPos!.y });
                        } else {
                          setDragOffset({ x: e.target.x() - dragStartPos!.x, y: e.target.y() - dragStartPos!.y });
                        }
                      }
                    } else {
                      // Arrastre individual sin selección múltiple
                      if (snapToGrid) {
                        const snapPixels = 0.5 * SCALE_FACTOR;
                        const x = e.target.x();
                        const y = e.target.y();
                        const snappedX = Math.round(x / snapPixels) * snapPixels;
                        const snappedY = Math.round(y / snapPixels) * snapPixels;
                        e.target.x(snappedX);
                        e.target.y(snappedY);
                      }
                      if (dragStartPos) {
                        const deltaX = e.target.x() - dragStartPos.x;
                        const deltaY = e.target.y() - dragStartPos.y;
                        setDragOffset({ x: deltaX, y: deltaY });
                      }
                    }
                  }}
                  onDragEnd={(e) => {
                    if (dragStartPos) {
                      const isImgSelected = selection.items.some(item => item.type === 'image' && item.id === idx);
                      if (isImgSelected && selection.items.length > 1) {
                        // Buscar si hay misiones seleccionadas
                        const anchorQuest = quests.find(q => selection.items.some(item => item.type === 'quest' && item.id === q.id));
                        
                        let deltaX = (e.target.x() - dragStartPos.x) / SCALE_FACTOR;
                        let deltaY = (e.target.y() - dragStartPos.y) / SCALE_FACTOR;

                        if (anchorQuest) {
                          // Si hay misión ancla, ella manda
                          const qOrigX = getDValue(anchorQuest.x);
                          const qOrigY = getDValue(anchorQuest.y);
                          const sizeVal = anchorQuest.size?.value ?? anchorQuest.size ?? 1.0;
                          const snapStep = sizeVal / 2;

                          if (snapToGrid) {
                            deltaX = Math.round(deltaX / snapStep) * snapStep;
                            deltaY = Math.round(deltaY / snapStep) * snapStep;
                          }

                          const qFinalX = qOrigX + deltaX;
                          const qFinalY = qOrigY + deltaY;
                          
                          // Actualizar quests seleccionadas relativamente
                          const questUpdates = selection.items
                            .filter(item => item.type === 'quest')
                            .map(item => {
                              const qObj = quests.find(q => q.id === item.id);
                              return {
                                id: item.id as string,
                                updates: {
                                  x: getDValue(qObj.x) + deltaX,
                                  y: getDValue(qObj.y) + deltaY
                                }
                              };
                            });
                          
                          const isAbsoluteSnap = snapToGrid && snapMode === 'absolute';
                          const imageUpdates = selection.items
                            .filter(item => item.type === 'image')
                            .map(item => {
                              const imgObj = images[item.id as number];
                              return {
                                index: item.id as number,
                                updates: {
                                  x: isAbsoluteSnap ? qFinalX : getDValue(imgObj.x) + deltaX,
                                  y: isAbsoluteSnap ? qFinalY : getDValue(imgObj.y) + deltaY
                                }
                              };
                            });
                            
                          if (updateQuestsAndImages) {
                            updateQuestsAndImages(questUpdates, imageUpdates);
                          } else {
                            if (imageUpdates.length > 0) updateImage(imageUpdates);
                            if (questUpdates.length > 0) updateQuest(questUpdates);
                          }
                        } else {
                          // Comportamiento para imágenes múltiples sin misiones en la selección
                          const selectedImages = selection.items.filter(item => item.type === 'image');
                          const isAbsoluteSnap = snapToGrid && snapMode === 'absolute';
                          
                          if (isAbsoluteSnap && selectedImages.length > 0) {
                            // Buscar la imagen seleccionada con el mayor número de orden (order o z-index)
                            let maxOrder = -Infinity;
                            let maxOrderImgObj: any = null;

                            selectedImages.forEach(item => {
                              const imgObj = images[item.id as number];
                              if (imgObj) {
                                const orderVal = imgObj.order?.value ?? imgObj.order ?? 1;
                                if (orderVal > maxOrder) {
                                  maxOrder = orderVal;
                                  maxOrderImgObj = imgObj;
                                }
                              }
                            });

                            if (maxOrderImgObj) {
                              const leaderOrigX = getDValue(maxOrderImgObj.x);
                              const leaderOrigY = getDValue(maxOrderImgObj.y);
                              const leaderFinalX = Math.round((leaderOrigX + deltaX) / 0.5) * 0.5;
                              const leaderFinalY = Math.round((leaderOrigY + deltaY) / 0.5) * 0.5;

                              const imageUpdates = selectedImages.map(item => {
                                return {
                                  index: item.id as number,
                                  updates: {
                                    x: leaderFinalX,
                                    y: leaderFinalY
                                  }
                                };
                              });

                              if (imageUpdates.length > 0) updateImage(imageUpdates);
                            }
                          } else {
                            // Modo Relativo o Snap desactivado: mover todas las imágenes conservando sus distancias e intervalos
                            let finalDeltaX = deltaX;
                            let finalDeltaY = deltaY;
                            if (snapToGrid) {
                              finalDeltaX = Math.round(deltaX / 0.5) * 0.5;
                              finalDeltaY = Math.round(deltaY / 0.5) * 0.5;
                            }
                            const imageUpdates = selectedImages.map(item => {
                              const imgObj = images[item.id as number];
                              return {
                                index: item.id as number,
                                updates: {
                                  x: getDValue(imgObj.x) + finalDeltaX,
                                  y: getDValue(imgObj.y) + finalDeltaY
                                }
                              };
                            });
                            if (imageUpdates.length > 0) updateImage(imageUpdates);
                          }
                        }
                      } else {
                        // Arrastre individual de imagen
                        let newX = e.target.x() / SCALE_FACTOR;
                        let newY = e.target.y() / SCALE_FACTOR;
                        if (snapToGrid) {
                          newX = Math.round(newX / 0.5) * 0.5;
                          newY = Math.round(newY / 0.5) * 0.5;
                        }
                        updateImage(idx, { x: newX, y: newY });
                      }
                    }
                    setDraggingId(null);
                    setDragStartPos(null);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                >
                  {/* Intentar renderizar la textura */}
                  <FtbTexture 
                    icon={img.image} 
                    width={w} 
                    height={h} 
                    color={img.color?.value ?? img.color} 
                    opacity={img.alpha !== undefined ? getDValue(img.alpha?.value ?? img.alpha) / 255 : 1.0}
                  />
                  
                  {/* Borde de selección */}
                  {isSelected && (
                    <Rect
                      width={w}
                      height={h}
                      offsetX={w/2}
                      offsetY={h/2}
                      stroke="#7b61ff"
                      strokeWidth={3 / stageScale}
                    />
                  )}

                  {isLocked && (
                    <Text
                      text="🔒"
                      fontSize={14 / stageScale}
                      x={-w / 2 + 4}
                      y={-h / 2 + 4}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        )}

        {layersVisible.quests && (
          <Layer>
            {/* Líneas de dependencia */}
            {layersVisible.dependencies && quests.map((q) => {
              if (!q.dependencies) return null;
              
              let depsArray: string[] = [];
              if (Array.isArray(q.dependencies)) {
                depsArray = q.dependencies.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
              } else if (typeof q.dependencies === 'string') {
                depsArray = [q.dependencies];
              } else if (typeof q.dependencies === 'object' && q.dependencies !== null) {
                const depObj = q.dependencies as any;
                if (depObj.id) depsArray = [depObj.id];
              }

              const isDstSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
              const dstX = getDValue(q.x) * SCALE_FACTOR + (isDstSelected && draggingId !== null ? dragOffset.x : 0);
              const dstY = getDValue(q.y) * SCALE_FACTOR + (isDstSelected && draggingId !== null ? dragOffset.y : 0);
              const dstSize = getDValue(q.size) || 1.0;
              const dstRadius = (40 * dstSize) / 2;

              return depsArray.map((depId) => {
                const depQuest = quests.find(dq => dq.id === depId);
                if (!depQuest) return null;

                const isSrcSelected = selection.items.some(item => item.type === 'quest' && item.id === depQuest.id);
                const srcX = getDValue(depQuest.x) * SCALE_FACTOR + (isSrcSelected && draggingId !== null ? dragOffset.x : 0);
                const srcY = getDValue(depQuest.y) * SCALE_FACTOR + (isSrcSelected && draggingId !== null ? dragOffset.y : 0);
                const srcSize = getDValue(depQuest.size) || 1.0;
                const srcRadius = (40 * srcSize) / 2;

                const dx = dstX - srcX;
                const dy = dstY - srcY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > srcRadius + dstRadius) {
                  const startX = srcX + (dx / dist) * srcRadius;
                  const startY = srcY + (dy / dist) * srcRadius;
                  const endX = dstX - (dx / dist) * (dstRadius + 5);
                  const endY = dstY - (dy / dist) * (dstRadius + 5);

                  const isCycleEdge = cycleNodeIds.has(q.id) && cycleNodeIds.has(depId);
                  const arrowColor = isCycleEdge ? '#f38ba8' : '#57606f';
                  const arrowWidth = isCycleEdge ? 3.5 : 2.5;

                  return (
                    <Arrow
                      key={`${q.id}-dep-${depId}`}
                      points={[startX, startY, endX, endY]}
                      stroke={arrowColor}
                      strokeWidth={arrowWidth}
                      fill={arrowColor}
                      pointerLength={9}
                      pointerWidth={8}
                      opacity={isCycleEdge ? 0.95 : 0.65}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                }
                return null;
              });
            })}
            
            {quests.map((q) => {
              const x = getDValue(q.x) * SCALE_FACTOR;
              const y = getDValue(q.y) * SCALE_FACTOR;
              const sizeVal = getDValue(q.size) || 1.0;
              const nodeSize = 40 * sizeVal; // 40px es el tamaño base para size: 1.0d
              const isSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
              const isLocked = lockedKeys.includes(`quest-${q.id}`);
              
              const hasSearchFilter = searchQuery.trim().length > 0;
              const isSearchMatch = hasSearchFilter && matchedQuestIds.has(String(q.id));
              const isActiveMatch = activeMatchQuestId === String(q.id);

              // Si este elemento está seleccionado y estamos arrastrando otro del grupo seleccionado
              const isOffsetApplied = isSelected && draggingId !== null && draggingId !== q.id;
              const currentX = x + (isOffsetApplied ? dragOffset.x : 0);
              const currentY = y + (isOffsetApplied ? dragOffset.y : 0);
              
              const iconObj = getQuestIcon(q);

              return (
                <Group
                  key={q.id}
                  x={currentX}
                  y={currentY}
                  opacity={hasSearchFilter && !isSearchMatch ? 0.28 : 1.0}
                  draggable={!isLocked}
                  onMouseEnter={() => setHoveredQuestId(q.id)}
                  onMouseLeave={() => setHoveredQuestId(prev => prev === q.id ? null : prev)}
                  onMouseUp={(e) => {
                    if (wireDrag && wireDrag.sourceQuestId !== q.id) {
                      e.cancelBubble = true;
                      onConnectQuests?.(wireDrag.sourceQuestId, q.id);
                      setWireDrag(null);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    if (onQuestContextMenu) {
                      onQuestContextMenu(q.id, e.evt.clientX, e.evt.clientY);
                    }
                  }}
                  onClick={(e) => {
                    if (e.evt.button !== 0) return; // Solo clic izquierdo
                    e.cancelBubble = true;
                    if (e.evt.shiftKey) {
                      const isAlreadySelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
                      let newItems = [];
                      if (isAlreadySelected) {
                        newItems = selection.items.filter(item => !(item.type === 'quest' && item.id === q.id));
                      } else {
                        newItems = [...selection.items, { type: 'quest' as const, id: q.id }];
                      }
                      
                      const hasQuests = newItems.some(i => i.type === 'quest');
                      const hasImages = newItems.some(i => i.type === 'image');
                      const type = (hasQuests && hasImages) ? 'mixed' : (hasQuests ? 'quest' : (hasImages ? 'image' : null));
                      setSelection({ type, ids: newItems.map(i => i.id), items: newItems });
                    } else {
                      setSelection({ type: 'quest', ids: [q.id], items: [{ type: 'quest', id: q.id }] });
                    }
                  }}
                  onDragStart={(e) => {
                    if (isLocked) {
                      e.target.stopDrag();
                      return;
                    }
                    const isQSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
                    if (!isQSelected) {
                      setSelection({ type: 'quest', ids: [q.id], items: [{ type: 'quest', id: q.id }] });
                    }
                    setDraggingId(q.id);
                    setDragStartPos({ x: e.target.x(), y: e.target.y() });
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  onDragMove={(e) => {
                    const isQSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
                    if (isQSelected && selection.items.length > 1) {
                      // Esta misión es la que se arrastra, por lo tanto actúa como la ancla del snap
                      if (snapToGrid) {
                        const snapPixels = (sizeVal / 2) * SCALE_FACTOR;
                        const x = e.target.x();
                        const y = e.target.y();
                        const snappedX = Math.round(x / snapPixels) * snapPixels;
                        const snappedY = Math.round(y / snapPixels) * snapPixels;
                        e.target.x(snappedX);
                        e.target.y(snappedY);
                        setDragOffset({ x: snappedX - dragStartPos!.x, y: snappedY - dragStartPos!.y });
                      } else {
                        setDragOffset({ x: e.target.x() - dragStartPos!.x, y: e.target.y() - dragStartPos!.y });
                      }
                    } else {
                      // Comportamiento individual normal
                      if (snapToGrid) {
                        const snapPixels = (sizeVal / 2) * SCALE_FACTOR;
                        const x = e.target.x();
                        const y = e.target.y();
                        const snappedX = Math.round(x / snapPixels) * snapPixels;
                        const snappedY = Math.round(y / snapPixels) * snapPixels;
                        e.target.x(snappedX);
                        e.target.y(snappedY);
                      }
                      if (dragStartPos) {
                        const deltaX = e.target.x() - dragStartPos.x;
                        const deltaY = e.target.y() - dragStartPos.y;
                        setDragOffset({ x: deltaX, y: deltaY });
                      }
                    }
                  }}
                  onDragEnd={(e) => {
                    if (dragStartPos) {
                      const isQSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
                      if (isQSelected && selection.items.length > 1) {
                        // Esta misión es la ancla del arrastre
                        let deltaX = (e.target.x() - dragStartPos.x) / SCALE_FACTOR;
                        let deltaY = (e.target.y() - dragStartPos.y) / SCALE_FACTOR;

                        if (snapToGrid) {
                          const snapStep = sizeVal / 2;
                          deltaX = Math.round(deltaX / snapStep) * snapStep;
                          deltaY = Math.round(deltaY / snapStep) * snapStep;
                        }

                        const qFinalX = getDValue(q.x) + deltaX;
                        const qFinalY = getDValue(q.y) + deltaY;

                        // Actualizar todas las misiones seleccionadas de forma relativa
                        const questUpdates = selection.items
                          .filter(item => item.type === 'quest')
                          .map(item => {
                            const qObj = quests.find(qi => qi.id === item.id);
                            return {
                              id: item.id as string,
                              updates: {
                                x: getDValue(qObj.x) + (item.id === q.id ? deltaX : (qFinalX - getDValue(q.x))),
                                y: getDValue(qObj.y) + (item.id === q.id ? deltaY : (qFinalY - getDValue(q.y)))
                              }
                            };
                          });
                        
                        const isAbsoluteSnap = snapToGrid && snapMode === 'absolute';
                        const imageUpdates = selection.items
                          .filter(item => item.type === 'image')
                          .map(item => {
                            const imgObj = images[item.id as number];
                            return {
                              index: item.id as number,
                              updates: {
                                x: isAbsoluteSnap ? qFinalX : getDValue(imgObj.x) + deltaX,
                                y: isAbsoluteSnap ? qFinalY : getDValue(imgObj.y) + deltaY
                              }
                            };
                          });

                        if (updateQuestsAndImages) {
                          updateQuestsAndImages(questUpdates, imageUpdates);
                        } else {
                          if (questUpdates.length > 0) updateQuest(questUpdates);
                          if (imageUpdates.length > 0) updateImage(imageUpdates);
                        }
                      } else {
                        // Arrastre individual de misión
                        let newX = e.target.x() / SCALE_FACTOR;
                        let newY = e.target.y() / SCALE_FACTOR;
                        if (snapToGrid) {
                          const snapStep = sizeVal / 2;
                          newX = Math.round(newX / snapStep) * snapStep;
                          newY = Math.round(newY / snapStep) * snapStep;
                        }
                        updateQuest(q.id, { x: newX, y: newY });
                      }
                    }
                    setDraggingId(null);
                    setDragStartPos(null);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                >
                  {/* Halo resplandeciente para misiones coincidentes en la búsqueda */}
                  {isSearchMatch && (
                    <Circle
                      radius={nodeSize * 0.72}
                      stroke={isActiveMatch ? "#00f0ff" : "#89dceb"}
                      strokeWidth={(isActiveMatch ? 3.5 : 2) / stageScale}
                      dash={isActiveMatch ? undefined : [4 / stageScale, 2 / stageScale]}
                      shadowColor={isActiveMatch ? "#00f0ff" : "#89dceb"}
                      shadowBlur={isActiveMatch ? 18 : 8}
                      shadowOpacity={1}
                      listening={false}
                    />
                  )}

                  {/* Baliza flotante sobre la coincidencia activa */}
                  {isActiveMatch && (
                    <>
                      <Circle
                        radius={nodeSize * 0.9}
                        stroke="#00f0ff"
                        strokeWidth={1.5 / stageScale}
                        dash={[6 / stageScale, 3 / stageScale]}
                        opacity={0.85}
                        listening={false}
                      />
                      <Group y={-nodeSize / 2 - 14 / stageScale} listening={false}>
                        <Circle radius={9 / stageScale} fill="#00f0ff" shadowColor="#00f0ff" shadowBlur={10} />
                        <Text
                          text="🔍"
                          fontSize={10 / stageScale}
                          offsetX={5 / stageScale}
                          offsetY={5 / stageScale}
                        />
                      </Group>
                    </>
                  )}

                  {/* Marco de forma (Shape) y contorno de selección de FTB Quests */}
                  <QuestShape 
                    shape={q.shape} 
                    size={nodeSize} 
                    isSelected={isSelected} 
                    stageScale={stageScale} 
                  />
                  <FtbTexture icon={iconObj} width={nodeSize * 0.72} height={nodeSize * 0.72} />
                  
                  <Text
                    text={q.title || "Misión"}
                    fill="white"
                    fontSize={12 / stageScale}
                    align="center"
                    width={150}
                    offsetX={75}
                    y={nodeSize / 2 + 8}
                    shadowColor="black"
                    shadowBlur={2}
                    shadowOffset={{x: 1, y: 1}}
                    shadowOpacity={1}
                  />

                  {isLocked && (
                    <Text
                      text="🔒"
                      fontSize={14 / stageScale}
                      x={-nodeSize / 2}
                      y={-nodeSize / 2}
                    />
                  )}

                  {/* Puerto / Ancla interactiva para conectar dependencias (Wire Dragging) */}
                  {(isSelected || hoveredQuestId === q.id) && !isLocked && (
                    <Group
                      x={nodeSize / 2 + 10}
                      y={0}
                      onMouseDown={(e) => {
                        e.cancelBubble = true;
                        setWireDrag({
                          sourceQuestId: q.id,
                          currentX,
                          currentY
                        });
                      }}
                    >
                      <Circle
                        radius={7 / stageScale}
                        fill="#89b4fa"
                        stroke="#ffffff"
                        strokeWidth={1.5 / stageScale}
                      />
                      <Text
                        text="➔"
                        fontSize={9 / stageScale}
                        fill="#11111b"
                        offsetX={4 / stageScale}
                        offsetY={5 / stageScale}
                      />
                    </Group>
                  )}

                  {/* Indicador de Ciclo en la Misión */}
                  {cycleNodeIds.has(q.id) && (
                    <Group x={nodeSize / 2} y={-nodeSize / 2}>
                      <Circle radius={8 / stageScale} fill="#f38ba8" stroke="#ffffff" strokeWidth={1.2 / stageScale} />
                      <Text text="⚠️" fontSize={9 / stageScale} offsetX={5 / stageScale} offsetY={5 / stageScale} />
                    </Group>
                  )}

                  {/* Indicador de Dependencia Rota en la Misión */}
                  {brokenDepQuestIds.has(q.id) && (
                    <Group x={-nodeSize / 2} y={-nodeSize / 2}>
                      <Circle radius={8 / stageScale} fill="#fab387" stroke="#ffffff" strokeWidth={1.2 / stageScale} />
                      <Text text="❓" fontSize={9 / stageScale} offsetX={4 / stageScale} offsetY={5 / stageScale} />
                    </Group>
                  )}
                </Group>
              );
            })}
          </Layer>
        )}

        {/* Rectángulo de selección visual dibujado sobre todo */}
        {selectionRect && (
          <Layer>
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.w}
              height={selectionRect.h}
              fill="rgba(123, 97, 255, 0.12)"
              stroke="#7b61ff"
              strokeWidth={1.5 / stageScale}
              dash={[6, 3]}
            />
          </Layer>
        )}

        {/* Flecha elástica activa durante el arrastre de cable (Wire Dragging) */}
        {wireDrag && (() => {
          const srcQ = quests.find(qi => qi.id === wireDrag.sourceQuestId);
          if (!srcQ) return null;
          const srcX = getDValue(srcQ.x) * SCALE_FACTOR;
          const srcY = getDValue(srcQ.y) * SCALE_FACTOR;
          return (
            <Layer listening={false}>
              <Arrow
                points={[srcX, srcY, wireDrag.currentX, wireDrag.currentY]}
                stroke="#89b4fa"
                strokeWidth={3 / stageScale}
                fill="#89b4fa"
                pointerLength={10 / stageScale}
                pointerWidth={8 / stageScale}
                dash={[8, 4]}
              />
            </Layer>
          );
        })()}
      </Stage>

      {/* Mini-mapa Interactivo (Radar / Navigator) */}
      <Minimap
        quests={quests}
        images={images}
        selection={selection}
        stageScale={stageScale}
        stagePos={stagePos}
        dimensions={dimensions}
        onNavigate={(newPos) => setStagePos(newPos)}
        searchMatchedIds={matchedQuestIds}
        activeMatchId={activeMatchQuestId}
      />
    </div>
  );
};
