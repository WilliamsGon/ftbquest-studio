import React, { useState, useRef, useEffect, useMemo, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Upload, Download, Image as ImageIcon, Map as MapIcon, Plus, Settings, Trash2, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Table as TableIcon, Share2, Lock, Unlock, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Copy, AlertTriangle, Search, Sparkles, ChevronRight, PanelRightOpen, RotateCcw, Pin, Globe, ExternalLink } from 'lucide-react';
import { parseSNBT, stringifySNBT } from './utils/snbt';
import { validateQuestGraph } from './utils/graphValidation';
import { computeAutoLayout } from './utils/autoLayout';
import { v4 as uuidv4 } from 'uuid';
import { EditorCanvas } from './components/EditorCanvas';
import { TableView } from './components/TableView';
import { TexturePickerModal } from './components/TexturePickerModal';
import { QuestTaskRewardManager } from './components/QuestTaskRewardManager';
import { ChapterTabBar } from './components/ChapterTabBar';
import type { ChapterTab } from './types/chapter';
import { RewardTableModal } from './components/RewardTableModal';
import type { RewardTable } from './types/rewardTable';
import { ChapterGroupModal } from './components/ChapterGroupModal';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal';
import type { ChapterGroup } from './types/chapterGroup';
import { exportModpackToZip } from './utils/zipExporter';
import { MinecraftTextToolbar } from './components/MinecraftTextToolbar';
import { MinecraftFormattedPreview } from './components/MinecraftFormattedPreview';
import { CrossChapterDependencyModal } from './components/CrossChapterDependencyModal';
import { QuestItemThumbnail } from './utils/textureHelper';
import { parseMinecraftText } from './utils/minecraftText';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#1e1e2e', color: '#f38ba8', border: '2px solid #f38ba8', borderRadius: '12px', margin: '40px', fontFamily: 'monospace', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <h2 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#f38ba8' }}>⚠️ Error en el Editor</h2>
          <p style={{ fontWeight: 'bold', color: '#cdd6f4', fontSize: '1rem', marginBottom: '15px' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#11111b', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: '#a6adc8', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '20px', background: '#f38ba8', color: '#11111b', fontWeight: 'bold', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }} 
            onClick={() => window.location.reload()}
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const generateHexId = () => uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

const getDValue = (val: any): any => {
  if (val === undefined || val === null) return val;
  if (typeof val === 'object' && val !== null) {
    if ('value' in val) {
      return val.value;
    }
  }
  return val;
};

const decimalToHexColor = (val: any): string => {
  if (val === undefined || val === null) return '#ffffff';
  const num = typeof val === 'object' && val.__type === 'number' ? val.value : Number(val);
  if (isNaN(num)) return '#ffffff';
  return '#' + num.toString(16).padStart(6, '0');
};

const hexColorToDecimal = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  return parseInt(cleanHex, 16);
};

const getItemX = (item: { type: 'quest' | 'image'; id: string | number }, quests: any[], images: any[]): number => {
  if (item.type === 'quest') {
    const q = quests.find(qi => qi.id === item.id);
    return q ? (q.x?.value ?? q.x ?? 0) : 0;
  } else {
    const img = images[item.id as number];
    return img ? (img.x?.value ?? img.x ?? 0) : 0;
  }
};

const getItemY = (item: { type: 'quest' | 'image'; id: string | number }, quests: any[], images: any[]): number => {
  if (item.type === 'quest') {
    const q = quests.find(qi => qi.id === item.id);
    return q ? (q.y?.value ?? q.y ?? 0) : 0;
  } else {
    const img = images[item.id as number];
    return img ? (img.y?.value ?? img.y ?? 0) : 0;
  }
};

function App() {
  const [snbtData, setSnbtData] = useState<any>(null);
  const [filename, setFilename] = useState<string>('Sin cargar');
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  
  const [quests, setQuests] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  // Entorno Multicapítulo (Pestañas de Trabajo Simultáneo)
  const [tabs, setTabs] = useState<ChapterTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const currentCameraRef = useRef<{ pos: { x: number; y: number }; scale: number }>({ pos: { x: 0, y: 0 }, scale: 1 });

  // Gestor de Tablas de Recompensas (reward_tables / Loot Crates)
  const [rewardTables, setRewardTables] = useState<RewardTable[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_reward_tables');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading reward tables from localStorage:', e);
    }
    return [
      {
        id: '2B1C94A7E0182C3D',
        title: 'Recompensas Básicas',
        icon: 'minecraft:chest',
        empty_weight: 0,
        loot_size: 1,
        order_index: 0,
        rewards: [
          { item: 'minecraft:iron_ingot', count: 4, weight: 10.0 },
          { item: 'minecraft:gold_ingot', count: 2, weight: 5.0 },
          { item: 'minecraft:diamond', count: 1, weight: 1.0 },
          { item: 'minecraft:bread', count: 8, weight: 15.0 },
        ],
        loot_crate: {
          string_id: 'basic_crate',
          color: 0x55ff55,
          glow: true,
        },
      }
    ];
  });
  const [isRewardTableModalOpen, setIsRewardTableModalOpen] = useState<boolean>(false);
  const [isCrossChapterModalOpen, setIsCrossChapterModalOpen] = useState<boolean>(false);

  // Gestor de Grupos de Capítulos (chapter_groups.snbt)
  const [chapterGroups, setChapterGroups] = useState<ChapterGroup[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_chapter_groups');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading chapter groups from localStorage:', e);
    }
    return [
      { id: '7E48F1A2D091B3C4', title: 'Tutorial / Inicio' },
      { id: '3A92F5C8E104D6B7', title: 'Tecnología' },
      { id: '1B83D4E7F209A5C6', title: 'Magia y Dimensiones' },
    ];
  });
  const [isChapterGroupModalOpen, setIsChapterGroupModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);

  // Referencias para manipulación de cursor/selección en barras de formato de texto Minecraft
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modo Vista Jugador (Simulación de desbloqueo en tiempo real)
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(false);
  const [playerCompletedQuestIds, setPlayerCompletedQuestIds] = useState<Set<string>>(new Set());

  // Niveles Z (order) únicos presentes en las imágenes de fondo
  const availableZLevels = useMemo(() => {
    const levels = new Set<number>();
    images.forEach(img => {
      const orderVal = img.order?.value ?? img.order ?? 1;
      levels.add(Number(orderVal));
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [images]);

  const [visibleZLevels, setVisibleZLevels] = useState<number[]>([]);
  const prevAvailableZLevelsRef = useRef<number[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [lockedKeys, setLockedKeys] = useState<string[]>([]);

  // Índice global de misiones de todos los capítulos cargados para dependencias inter-capítulo
  const allChaptersQuestsMap = useMemo(() => {
    const map = new Map<string, { quest: any; chapterId: string; chapterTitle: string; tabId: string }>();

    // 1. Misiones de todas las pestañas abiertas
    tabs.forEach(tab => {
      const chTitle = tab.title || (tab.snbtData?.title ? getDValue(tab.snbtData.title) : tab.filename.replace(/\.snbt$/, ''));
      if (Array.isArray(tab.quests)) {
        tab.quests.forEach(q => {
          if (q && q.id) {
            map.set(String(q.id), {
              quest: q,
              chapterId: tab.id,
              chapterTitle: String(chTitle),
              tabId: tab.id
            });
          }
        });
      }
    });

    // 2. Misiones actuales de la pestaña activa en edición
    if (activeTabId) {
      const currentTitle = snbtData?.title ? getDValue(snbtData.title) : filename.replace(/\.snbt$/, '');
      quests.forEach(q => {
        if (q && q.id) {
          map.set(String(q.id), {
            quest: q,
            chapterId: activeTabId,
            chapterTitle: String(currentTitle),
            tabId: activeTabId
          });
        }
      });
    }

    return map;
  }, [tabs, quests, activeTabId, snbtData, filename]);

  const allKnownQuestIds = useMemo(() => {
    return new Set(allChaptersQuestsMap.keys());
  }, [allChaptersQuestsMap]);

  // Validación de grafos de dependencias en tiempo real (reconociendo dependencias inter-capítulo)
  const graphValidation = useMemo(() => validateQuestGraph(quests, allKnownQuestIds), [quests, allKnownQuestIds]);

  const [pinnedAssets, setPinnedAssets] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ftb_quest_pinned_assets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isPinnedDrawerOpen, setIsPinnedDrawerOpen] = useState<boolean>(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('ftb_right_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 320;
    return isNaN(parsed) || parsed < 260 ? 320 : parsed;
  });
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(false);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState<boolean>(false);

  const startResizingRightSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRightSidebar(true);
  };

  useEffect(() => {
    if (!isResizingRightSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const calculatedWidth = window.innerWidth - e.clientX;
      const minW = 280;
      const maxW = Math.min(850, Math.floor(window.innerWidth * 0.65));
      const clampedWidth = Math.max(minW, Math.min(maxW, calculatedWidth));
      setRightSidebarWidth(clampedWidth);
      localStorage.setItem('ftb_right_sidebar_width', String(Math.round(clampedWidth)));
    };

    const handleMouseUp = () => {
      setIsResizingRightSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingRightSidebar]);

  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  
  const showToast = (message: string, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const savePinnedAssets = (assets: any[]) => {
    setPinnedAssets(assets);
    try {
      localStorage.setItem('ftb_quest_pinned_assets', JSON.stringify(assets));
    } catch (e) {
      console.error('Error saving pinned assets:', e);
    }
  };

  const handleUpdateRewardTables = (newTables: RewardTable[]) => {
    setRewardTables(newTables);
    try {
      localStorage.setItem('ftb_reward_tables', JSON.stringify(newTables));
    } catch (e) {
      console.error('Error saving reward tables:', e);
    }
  };

  const handleUpdateChapterGroups = (newGroups: ChapterGroup[]) => {
    setChapterGroups(newGroups);
    try {
      localStorage.setItem('ftb_chapter_groups', JSON.stringify(newGroups));
    } catch (e) {
      console.error('Error saving chapter groups:', e);
    }
  };

  const handleTogglePlayerQuestCompletion = (questId: string) => {
    setPlayerCompletedQuestIds(prev => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
        showToast('Misión marcada como pendiente', 'info');
      } else {
        next.add(questId);
        showToast('¡Misión completada! Desbloqueando ramas dependientes...', 'success');
      }
      return next;
    });
  };

  const handleResetPlayerProgress = () => {
    setPlayerCompletedQuestIds(new Set());
    showToast('Progreso de simulación reiniciado a cero', 'info');
  };

  const handleCompleteAllPlayerQuests = () => {
    const allIds = new Set(quests.map(q => String(q.id)));
    setPlayerCompletedQuestIds(allIds);
    showToast('Todas las misiones marcadas como completadas', 'success');
  };

  // Sincronizar niveles Z visibles cuando cambian los disponibles
  useEffect(() => {
    if (availableZLevels.length === 0) {
      setVisibleZLevels([]);
      prevAvailableZLevelsRef.current = [];
      return;
    }
    setVisibleZLevels(prev => {
      // Si el estado visible anterior estaba vacío y no había niveles previos, activamos todos por defecto
      if (prev.length === 0 && prevAvailableZLevelsRef.current.length === 0) {
        return [...availableZLevels];
      }
      
      // Filtrar los niveles visibles que sigan existiendo en los niveles disponibles actuales
      const currentVisible = prev.filter(l => availableZLevels.includes(l));
      
      // Los niveles verdaderamente nuevos son aquellos que están en availableZLevels
      // pero que NO estaban en el conjunto de niveles disponibles del renderizado anterior (independientemente de si estaban activos o no)
      const prevAvailable = prevAvailableZLevelsRef.current;
      const trulyNewLevels = availableZLevels.filter(l => !prevAvailable.includes(l));
      
      return [...currentVisible, ...trulyNewLevels].sort((a, b) => a - b);
    });
    
    prevAvailableZLevelsRef.current = [...availableZLevels];
  }, [availableZLevels]);
  
  const [layers, setLayers] = useState({ quests: true, images: true, dependencies: true });
  const [rawSelection, setRawSelection] = useState<{
    type: 'quest' | 'image' | 'mixed' | 'dependency' | null;
    ids: (string | number)[];
    items: { type: 'quest' | 'image'; id: string | number }[];
    dependency?: { sourceId: string; targetId: string } | null;
  }>({ type: null, ids: [], items: [] });

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetQuestId: string | null;
  }>({ visible: false, x: 0, y: 0, targetQuestId: null });

  useEffect(() => {
    const handleGlobalPointerDown = (e: PointerEvent) => {
      if (contextMenu.visible) {
        const target = e.target as HTMLElement;
        if (target.closest('.context-menu')) {
          return; // Ignorar el cierre si el click es dentro del propio menú
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [contextMenu.visible]);
  
  // Historial de cambios
  const [history, setHistory] = useState<{ quests: any[]; images: any[]; snbtData: any }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
    tabsRef.current = tabs;
    activeTabIdRef.current = activeTabId;
    isDirtyRef.current = isDirty;
  }, [history, historyIndex, tabs, activeTabId, isDirty]);

  // Portapapeles para copiar/pegar
  const [clipboard, setClipboard] = useState<{ type: 'quest' | 'image'; data: any }[]>([]);
  const clipboardRef = useRef(clipboard);

  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  // Estados para Imán (Snap) del EditorCanvas
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapMode, setSnapMode] = useState<'relative' | 'absolute'>('relative');

  // Estilo de cables de conexión
  const [connectionLineStyle, setConnectionLineStyle] = useState<'bezier' | 'straight' | 'orthogonal'>(() => {
    const saved = localStorage.getItem('ftb_connection_line_style');
    return (saved === 'straight' || saved === 'orthogonal') ? saved : 'bezier';
  });

  const handleConnectionLineStyleChange = (style: 'bezier' | 'straight' | 'orthogonal') => {
    setConnectionLineStyle(style);
    localStorage.setItem('ftb_connection_line_style', style);
  };

  const selection = {
    type: rawSelection.type,
    ids: rawSelection.ids,
    items: rawSelection.items,
    id: rawSelection.ids[0] ?? null,
    dependency: rawSelection.dependency ?? null
  };

  const setSelection = (newSel: { 
    type: 'quest' | 'image' | 'mixed' | 'dependency' | null; 
    id?: string | number | null; 
    ids?: (string | number)[];
    items?: { type: 'quest' | 'image'; id: string | number }[];
    dependency?: { sourceId: string; targetId: string } | null;
  }) => {
    let finalItems = newSel.items || [];
    if (!newSel.items && newSel.ids && newSel.type) {
      if (newSel.type !== 'mixed' && newSel.type !== 'dependency' && newSel.type !== null) {
        finalItems = newSel.ids.map(id => ({ type: newSel.type as 'quest' | 'image', id }));
      }
    } else if (!newSel.items && newSel.id !== undefined && newSel.id !== null && newSel.type && newSel.type !== 'mixed' && newSel.type !== 'dependency') {
      finalItems = [{ type: newSel.type, id: newSel.id }];
    }

    setRawSelection({
      type: newSel.type,
      ids: newSel.ids ? newSel.ids : (newSel.id !== undefined && newSel.id !== null ? [newSel.id] : []),
      items: finalItems,
      dependency: newSel.dependency ?? null
    });
  };

  const questsRef = useRef(quests);
  const imagesRef = useRef(images);
  const selectionRef = useRef(selection);
  const mouseCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    questsRef.current = quests;
    imagesRef.current = images;
    selectionRef.current = selection;
  }, [quests, images, selection]);

  const [nbtEditor, setNbtEditor] = useState<{ title: string; value: string; onSave: (val: any) => void } | null>(null);
  const [texturePicker, setTexturePicker] = useState<{ isOpen: boolean; targetType: 'icon' | 'image'; onSelect: (val: string) => void; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función unificada para actualizar estado y guardar en el historial
  const updateState = (newQuests: any[], newImages: any[], bypassHistory = false, newSnbtData?: any) => {
    setQuests(newQuests);
    setImages(newImages);
    setIsDirty(true);
    
    const finalSnbtData = newSnbtData !== undefined ? newSnbtData : snbtData;
    if (newSnbtData !== undefined) {
      setSnbtData(newSnbtData);
    }

    if (activeTabIdRef.current) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabIdRef.current) {
          return {
            ...t,
            quests: newQuests,
            images: newImages,
            snbtData: finalSnbtData,
            title: finalSnbtData?.title || t.title,
            isDirty: true
          };
        }
        return t;
      }));
    }
    
    if (!bypassHistory) {
      const idx = historyIndexRef.current;
      const hist = historyRef.current;
      const cleanHistory = hist.slice(0, idx + 1);
      
      const clonedQuests = JSON.parse(JSON.stringify(newQuests));
      const clonedImages = JSON.parse(JSON.stringify(newImages));
      const clonedSnbt = finalSnbtData ? JSON.parse(JSON.stringify(finalSnbtData)) : null;
      
      const nextHistory = [...cleanHistory, { quests: clonedQuests, images: clonedImages, snbtData: clonedSnbt }];
      setHistory(nextHistory);
      setHistoryIndex(cleanHistory.length);

      if (activeTabIdRef.current) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabIdRef.current) {
            return {
              ...t,
              history: nextHistory,
              historyIndex: cleanHistory.length
            };
          }
          return t;
        }));
      }
    }
  };

  const undo = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0) {
      const prevIndex = idx - 1;
      const prevRecord = hist[prevIndex];
      const newQuests = JSON.parse(JSON.stringify(prevRecord.quests));
      const newImages = JSON.parse(JSON.stringify(prevRecord.images));
      const newSnbt = prevRecord.snbtData ? JSON.parse(JSON.stringify(prevRecord.snbtData)) : snbtData;
      setQuests(newQuests);
      setImages(newImages);
      if (prevRecord.snbtData) {
        setSnbtData(newSnbt);
      }
      setHistoryIndex(prevIndex);
      setSelection({ type: null, ids: [] });
      setIsDirty(true);

      if (activeTabIdRef.current) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabIdRef.current) {
            return {
              ...t,
              quests: newQuests,
              images: newImages,
              snbtData: newSnbt,
              historyIndex: prevIndex,
              isDirty: true
            };
          }
          return t;
        }));
      }
    }
  };

  const redo = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx < hist.length - 1) {
      const nextIndex = idx + 1;
      const nextRecord = hist[nextIndex];
      const newQuests = JSON.parse(JSON.stringify(nextRecord.quests));
      const newImages = JSON.parse(JSON.stringify(nextRecord.images));
      const newSnbt = nextRecord.snbtData ? JSON.parse(JSON.stringify(nextRecord.snbtData)) : snbtData;
      setQuests(newQuests);
      setImages(newImages);
      if (nextRecord.snbtData) {
        setSnbtData(newSnbt);
      }
      setHistoryIndex(nextIndex);
      setSelection({ type: null, ids: [] });
      setIsDirty(true);

      if (activeTabIdRef.current) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabIdRef.current) {
            return {
              ...t,
              quests: newQuests,
              images: newImages,
              snbtData: newSnbt,
              historyIndex: nextIndex,
              isDirty: true
            };
          }
          return t;
        }));
      }
    }
  };

  const copyToClipboard = () => {
    const currentSelection = selectionRef.current;
    const currentQuests = questsRef.current;
    const currentImages = imagesRef.current;

    const items = currentSelection.items;
    if (items.length === 0) return;

    const itemsToCopy = items.map(item => {
      if (item.type === 'quest') {
        const q = currentQuests.find(qi => qi.id === item.id);
        return { type: 'quest' as const, data: JSON.parse(JSON.stringify(q)) };
      } else {
        const img = currentImages[item.id as number];
        return { type: 'image' as const, data: JSON.parse(JSON.stringify(img)) };
      }
    }).filter(item => item.data !== null && item.data !== undefined);

    if (itemsToCopy.length > 0) {
      setClipboard(itemsToCopy);
    }
  };

  const pasteFromClipboard = () => {
    const clip = clipboardRef.current;
    if (clip.length === 0) return;

    let nextQuests = [...questsRef.current];
    let nextImages = [...imagesRef.current];

    const newlyPastedItems: { type: 'quest' | 'image'; id: string | number }[] = [];

    // Calcular el centro geométrico del grupo en el portapapeles
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    clip.forEach(item => {
      const x = item.data.x?.value ?? item.data.x ?? 0;
      const y = item.data.y?.value ?? item.data.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const groupCenterX = (minX + maxX) / 2;
    const groupCenterY = (minY + maxY) / 2;

    const mousePos = mouseCanvasPosRef.current;

    let rawDx = 0.5;
    let rawDy = 0.5;
    if (mousePos !== null) {
      rawDx = mousePos.x - groupCenterX;
      rawDy = mousePos.y - groupCenterY;
    }

    let dx = rawDx;
    let dy = rawDy;

    if (snapToGrid) {
      const anchorItem = clip.find(item => item.type === 'quest') || clip[0];
      let snapStep = 0.5;
      if (anchorItem && anchorItem.type === 'quest') {
        const sizeVal = anchorItem.data.size?.value ?? anchorItem.data.size ?? 1.0;
        snapStep = sizeVal / 2;
      }
      if (anchorItem) {
        const anchorOrigX = anchorItem.data.x?.value ?? anchorItem.data.x ?? 0;
        const anchorOrigY = anchorItem.data.y?.value ?? anchorItem.data.y ?? 0;
        const anchorTentX = anchorOrigX + rawDx;
        const anchorTentY = anchorOrigY + rawDy;
        const anchorSnappedX = Math.round(anchorTentX / snapStep) * snapStep;
        const anchorSnappedY = Math.round(anchorTentY / snapStep) * snapStep;
        dx = anchorSnappedX - anchorOrigX;
        dy = anchorSnappedY - anchorOrigY;
      } else {
        dx = Math.round(rawDx / 0.5) * 0.5;
        dy = Math.round(rawDy / 0.5) * 0.5;
      }
    }

    clip.forEach(item => {
      const origX = item.data.x?.value ?? item.data.x ?? 0;
      const origY = item.data.y?.value ?? item.data.y ?? 0;

      let targetX = origX + dx;
      let targetY = origY + dy;

      if (snapToGrid) {
        targetX = Math.round(targetX * 10000) / 10000;
        targetY = Math.round(targetY * 10000) / 10000;
      }

      if (item.type === 'image') {
        const img = item.data;
        const newImg = {
          ...img,
          x: { __type: 'number', value: targetX, suffix: 'd' },
          y: { __type: 'number', value: targetY, suffix: 'd' }
        };

        const newIndex = nextImages.length;
        nextImages.push(newImg);
        newlyPastedItems.push({ type: 'image', id: newIndex });
      } else if (item.type === 'quest') {
        const q = item.data;
        
        let newId = generateHexId();
        while (nextQuests.some(qi => qi.id === newId)) {
          newId = generateHexId();
        }

        const newQuest = {
          ...q,
          id: newId,
          x: { __type: 'number', value: targetX, suffix: 'd' },
          y: { __type: 'number', value: targetY, suffix: 'd' }
        };

        nextQuests.push(newQuest);
        newlyPastedItems.push({ type: 'quest', id: newId });
      }
    });

    updateState(nextQuests, nextImages);

    // Seleccionar automáticamente los nuevos elementos pegados
    if (newlyPastedItems.length > 0) {
      const hasQuests = newlyPastedItems.some(i => i.type === 'quest');
      const hasImages = newlyPastedItems.some(i => i.type === 'image');
      let type: 'quest' | 'image' | 'mixed' = 'mixed';
      if (hasQuests && !hasImages) type = 'quest';
      if (!hasQuests && hasImages) type = 'image';

      setSelection({
        type,
        ids: newlyPastedItems.map(i => i.id),
        items: newlyPastedItems
      });
    }
  };

  const toggleLock = (key: string) => {
    setLockedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleLockSelected = () => {
    if (selection.items.length === 0) return;
    const keysToToggle = selection.items.map(item => 
      item.type === 'quest' ? `quest-${item.id}` : `img-${item.id}`
    );
    
    const allLocked = keysToToggle.every(k => lockedKeys.includes(k));
    if (allLocked) {
      setLockedKeys(prev => prev.filter(k => !keysToToggle.includes(k)));
      showToast('Elementos desbloqueados', 'info');
    } else {
      setLockedKeys(prev => Array.from(new Set([...prev, ...keysToToggle])));
      showToast('Elementos bloqueados', 'info');
    }
  };

  const duplicateSelection = () => {
    const currentSelection = selectionRef.current;
    const currentQuests = questsRef.current;
    const currentImages = imagesRef.current;

    if (currentSelection.items.length === 0) return;

    const newlyCreatedItems: { type: 'quest' | 'image'; id: string | number }[] = [];
    const nextQuests = [...currentQuests];
    const nextImages = [...currentImages];

    const offset = 0.5;

    // Mapa de ID viejo -> ID nuevo para remapear dependencias internas
    const questIdMap = new Map<string, string>();
    const selectedQuests = currentSelection.items
      .filter(item => item.type === 'quest')
      .map(item => currentQuests.find(q => q.id === item.id))
      .filter(Boolean);

    selectedQuests.forEach(q => {
      let newId = generateHexId();
      while (nextQuests.some(qi => qi.id === newId) || Array.from(questIdMap.values()).includes(newId)) {
        newId = generateHexId();
      }
      questIdMap.set(q.id, newId);
    });

    // Duplicar misiones seleccionadas
    selectedQuests.forEach(q => {
      const newId = questIdMap.get(q.id)!;
      const cloned = JSON.parse(JSON.stringify(q));
      const origX = getDValue(cloned.x) ?? 0;
      const origY = getDValue(cloned.y) ?? 0;

      cloned.id = newId;
      cloned.x = { __type: 'number', value: Math.round((origX + offset) * 1000) / 1000, suffix: 'd' };
      cloned.y = { __type: 'number', value: Math.round((origY + offset) * 1000) / 1000, suffix: 'd' };

      // Remapear dependencias internas si ambas misiones fueron duplicadas
      if (cloned.dependencies) {
        if (Array.isArray(cloned.dependencies)) {
          cloned.dependencies = cloned.dependencies.map((dep: any) => {
            const depId = typeof dep === 'object' && dep !== null ? dep.id : String(dep);
            if (questIdMap.has(depId)) {
              const mappedId = questIdMap.get(depId)!;
              return typeof dep === 'object' && dep !== null ? { ...dep, id: mappedId } : mappedId;
            }
            return dep;
          });
        } else if (typeof cloned.dependencies === 'string' && questIdMap.has(cloned.dependencies)) {
          cloned.dependencies = questIdMap.get(cloned.dependencies)!;
        } else if (typeof cloned.dependencies === 'object' && cloned.dependencies !== null && questIdMap.has(cloned.dependencies.id)) {
          cloned.dependencies = { ...cloned.dependencies, id: questIdMap.get(cloned.dependencies.id)! };
        }
      }

      nextQuests.push(cloned);
      newlyCreatedItems.push({ type: 'quest', id: newId });
    });

    // Duplicar imágenes seleccionadas
    const selectedImages = currentSelection.items
      .filter(item => item.type === 'image')
      .map(item => currentImages[item.id as number])
      .filter(Boolean);

    selectedImages.forEach(img => {
      const cloned = JSON.parse(JSON.stringify(img));
      const origX = getDValue(cloned.x) ?? 0;
      const origY = getDValue(cloned.y) ?? 0;

      cloned.x = { __type: 'number', value: Math.round((origX + offset) * 1000) / 1000, suffix: 'd' };
      cloned.y = { __type: 'number', value: Math.round((origY + offset) * 1000) / 1000, suffix: 'd' };

      const newIndex = nextImages.length;
      nextImages.push(cloned);
      newlyCreatedItems.push({ type: 'image', id: newIndex });
    });

    updateState(nextQuests, nextImages);

    if (newlyCreatedItems.length > 0) {
      const hasQuests = newlyCreatedItems.some(i => i.type === 'quest');
      const hasImages = newlyCreatedItems.some(i => i.type === 'image');
      let type: 'quest' | 'image' | 'mixed' = 'mixed';
      if (hasQuests && !hasImages) type = 'quest';
      if (!hasQuests && hasImages) type = 'image';

      setSelection({
        type,
        ids: newlyCreatedItems.map(i => i.id),
        items: newlyCreatedItems
      });
      showToast(`${newlyCreatedItems.length} elemento(s) duplicado(s)`, 'success');
    }
  };

  // Event listener para atajos de teclado globales (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+C, Ctrl+V, Ctrl+D, Ctrl+W, Ctrl+Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          copyToClipboard();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          pasteFromClipboard();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          duplicateSelection();
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          if (activeTabIdRef.current) {
            handleCloseTab(activeTabIdRef.current);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (tabsRef.current.length > 1) {
            const currentIdx = tabsRef.current.findIndex(t => t.id === activeTabIdRef.current);
            const nextIdx = e.shiftKey
              ? (currentIdx <= 0 ? tabsRef.current.length - 1 : currentIdx - 1)
              : (currentIdx >= tabsRef.current.length - 1 ? 0 : currentIdx + 1);
            handleSelectTab(tabsRef.current[nextIdx].id);
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectionRef.current.type === 'dependency') {
          e.preventDefault();
          deleteSelectedDependency();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTab = (tab: ChapterTab) => {
    setActiveTabId(tab.id);
    setSnbtData(tab.snbtData);
    setFilename(tab.filename);
    setQuests(tab.quests);
    setImages(tab.images);
    setHistory(tab.history);
    setHistoryIndex(tab.historyIndex);
    setSelection(tab.selection);
    setLockedKeys(tab.lockedKeys || []);
    setViewMode(tab.viewMode || 'map');
    setIsDirty(!!tab.isDirty);
    currentCameraRef.current = {
      pos: tab.stagePos || { x: 0, y: 0 },
      scale: tab.stageScale || 1
    };
  };

  const handleSelectTab = (targetId: string) => {
    if (targetId === activeTabIdRef.current) return;
    const targetTab = tabsRef.current.find(t => t.id === targetId);
    if (!targetTab) return;

    // Guardar el estado de la pestaña actual antes de conmutar
    if (activeTabIdRef.current) {
      setTabs(prev => {
        return prev.map(t => {
          if (t.id === activeTabIdRef.current) {
            return {
              ...t,
              filename: filename,
              title: snbtData?.title || filename.replace(/\.snbt$/, ''),
              snbtData: snbtData,
              quests: quests,
              images: images,
              history: history,
              historyIndex: historyIndex,
              selection: selection,
              lockedKeys: lockedKeys,
              viewMode: viewMode,
              stagePos: currentCameraRef.current.pos,
              stageScale: currentCameraRef.current.scale,
              isDirty: isDirty
            };
          }
          return t;
        });
      });
    }

    loadTab(targetTab);
  };

  const handleCloseTab = (tabId: string) => {
    const tabToClose = tabsRef.current.find(t => t.id === tabId);
    if (!tabToClose) return;

    const tabTitle = tabToClose.snbtData?.title || tabToClose.title || tabToClose.filename;
    const isCurrent = tabId === activeTabIdRef.current;
    const tabIsDirty = isCurrent ? isDirtyRef.current : tabToClose.isDirty;

    if (tabIsDirty) {
      const confirmClose = window.confirm(`El capítulo "${tabTitle}" tiene cambios sin guardar.\n¿Deseas cerrarlo de todos modos?`);
      if (!confirmClose) return;
    }

    const newTabs = tabsRef.current.filter(t => t.id !== tabId);
    setTabs(newTabs);

    if (isCurrent) {
      if (newTabs.length > 0) {
        const closedIdx = tabsRef.current.findIndex(t => t.id === tabId);
        const nextTab = newTabs[Math.max(0, closedIdx - 1)];
        loadTab(nextTab);
      } else {
        setActiveTabId('');
        setSnbtData(null);
        setFilename('Sin cargar');
        setQuests([]);
        setImages([]);
        setHistory([]);
        setHistoryIndex(-1);
        setSelection({ type: null, ids: [], items: [] });
        setIsDirty(false);
      }
    }
  };

  const handleNewBlankTab = () => {
    const newId = generateHexId();
    const newIndex = tabsRef.current.length + 1;
    const defaultSnbt = {
      id: newId,
      group: "",
      order_index: tabsRef.current.length,
      filename: `capitulo_${newIndex}`,
      title: `Nuevo Capítulo ${newIndex}`,
      icon: "minecraft:book",
      default_quest_shape: "",
      quests: [],
      images: []
    };

    const newTab: ChapterTab = {
      id: uuidv4(),
      filename: `capitulo_${newIndex}.snbt`,
      title: `Nuevo Capítulo ${newIndex}`,
      snbtData: defaultSnbt,
      quests: [],
      images: [],
      history: [{
        quests: [],
        images: [],
        snbtData: JSON.parse(JSON.stringify(defaultSnbt))
      }],
      historyIndex: 0,
      selection: { type: null, ids: [], items: [] },
      lockedKeys: [],
      viewMode: 'map',
      isDirty: true
    };

    if (activeTabIdRef.current) {
      setTabs(prev => {
        const updated = prev.map(t => {
          if (t.id === activeTabIdRef.current) {
            return {
              ...t,
              filename: filename,
              title: snbtData?.title || filename.replace(/\.snbt$/, ''),
              snbtData: snbtData,
              quests: quests,
              images: images,
              history: history,
              historyIndex: historyIndex,
              selection: selection,
              lockedKeys: lockedKeys,
              viewMode: viewMode,
              stagePos: currentCameraRef.current.pos,
              stageScale: currentCameraRef.current.scale,
              isDirty: isDirty
            };
          }
          return t;
        });
        return [...updated, newTab];
      });
    } else {
      setTabs(prev => [...prev, newTab]);
    }

    loadTab(newTab);
    showToast(`Nuevo capítulo "Nuevo Capítulo ${newIndex}" creado`, 'success');
  };

  const processFiles = (files: File[]) => {
    const snbtFiles = files.filter(f => f.name.endsWith('.snbt'));
    if (snbtFiles.length === 0) {
      showToast('Por favor, selecciona o arrastra archivos con extensión .snbt', 'warning');
      return;
    }

    // Guardar pestaña activa antes de cargar nuevos archivos
    if (activeTabIdRef.current) {
      setTabs(prev => prev.map(t => {
        if (t.id === activeTabIdRef.current) {
          return {
            ...t,
            filename: filename,
            title: snbtData?.title || filename.replace(/\.snbt$/, ''),
            snbtData: snbtData,
            quests: quests,
            images: images,
            history: history,
            historyIndex: historyIndex,
            selection: selection,
            lockedKeys: lockedKeys,
            viewMode: viewMode,
            stagePos: currentCameraRef.current.pos,
            stageScale: currentCameraRef.current.scale,
            isDirty: isDirty
          };
        }
        return t;
      }));
    }

    const loadedTabs: ChapterTab[] = [];
    let processedCount = 0;

    snbtFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = parseSNBT(text);
          const initialQuests = parsed.quests && Array.isArray(parsed.quests) ? parsed.quests : [];
          const initialImages = parsed.images && Array.isArray(parsed.images) ? parsed.images : [];
          const chapterTitle = parsed.title || file.name.replace(/\.snbt$/, '');

          const tabId = uuidv4();
          const tab: ChapterTab = {
            id: tabId,
            filename: file.name,
            title: chapterTitle,
            snbtData: parsed,
            quests: initialQuests,
            images: initialImages,
            history: [{
              quests: JSON.parse(JSON.stringify(initialQuests)),
              images: JSON.parse(JSON.stringify(initialImages)),
              snbtData: JSON.parse(JSON.stringify(parsed))
            }],
            historyIndex: 0,
            selection: { type: null, ids: [], items: [] },
            lockedKeys: [],
            viewMode: 'map',
            isDirty: false
          };

          loadedTabs.push(tab);
        } catch (err) {
          console.error("Error parsing SNBT for file:", file.name, err);
          showToast(`Error al parsear "${file.name}"`, "warning");
        } finally {
          processedCount++;
          if (processedCount === snbtFiles.length && loadedTabs.length > 0) {
            setTabs(prev => {
              // Si ya había pestañas abiertas con el mismo filename, reemplazarlas
              const filteredPrev = prev.filter(p => !loadedTabs.some(n => n.filename === p.filename));
              return [...filteredPrev, ...loadedTabs];
            });

            // Activar la última pestaña cargada
            const lastTab = loadedTabs[loadedTabs.length - 1];
            loadTab(lastTab);
            showToast(
              loadedTabs.length === 1 
                ? `Capítulo "${lastTab.title}" abierto` 
                : `${loadedTabs.length} capítulos abiertos`, 
              'success'
            );
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const pinSelectionToClipboard = () => {
    if (selection.items.length === 0) return;

    const selectedQuests = selection.items
      .filter(item => item.type === 'quest')
      .map(item => quests.find(q => q && q.id === item.id))
      .filter(Boolean);

    const selectedImages = selection.items
      .filter(item => item.type === 'image')
      .map(item => images[item.id as number])
      .filter(Boolean);

    if (selectedQuests.length === 0 && selectedImages.length === 0) return;

    // Determinar el título descriptivo
    let title = 'Grupo de Activos';
    if (selectedQuests.length === 1 && selectedImages.length === 0) {
      title = getDValue(selectedQuests[0].title) || `Misión ${selectedQuests[0].id}`;
    } else if (selectedQuests.length === 0 && selectedImages.length === 1) {
      title = selectedImages[0].image || 'Imagen de fondo';
      const lastSlashIdx = title.lastIndexOf('/');
      if (lastSlashIdx !== -1) {
        title = title.substring(lastSlashIdx + 1);
      }
    } else {
      const parts = [];
      if (selectedQuests.length > 0) parts.push(`${selectedQuests.length} ${selectedQuests.length === 1 ? 'misión' : 'misiones'}`);
      if (selectedImages.length > 0) parts.push(`${selectedImages.length} ${selectedImages.length === 1 ? 'imagen' : 'imágenes'}`);
      title = `Conjunto (${parts.join(', ')})`;
    }

    const newAsset = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      title,
      quests: JSON.parse(JSON.stringify(selectedQuests)),
      images: JSON.parse(JSON.stringify(selectedImages)),
      timestamp: Date.now()
    };

    savePinnedAssets([newAsset, ...pinnedAssets]);
    showToast('¡Selección anclada al portapapeles con éxito!', 'success');
  };

  const pastePinnedAsset = (asset: any) => {
    if (!snbtData) return;

    const generateHexId = () => {
      let id = '';
      const chars = '0123456789ABCDEF';
      for (let i = 0; i < 16; i++) {
        id += chars[Math.floor(Math.random() * 16)];
      }
      return id;
    };

    // 1. Obtener Bounding Box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let hasCoords = false;

    asset.quests.forEach((q: any) => {
      const qx = getDValue(q.x) ?? 0;
      const qy = getDValue(q.y) ?? 0;
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qy < minY) minY = qy;
      if (qy > maxY) maxY = qy;
      hasCoords = true;
    });

    asset.images.forEach((img: any) => {
      const imgx = getDValue(img.x) ?? 0;
      const imgy = getDValue(img.y) ?? 0;
      if (imgx < minX) minX = imgx;
      if (imgx > maxX) maxX = imgx;
      if (imgy < minY) minY = imgy;
      if (imgy > maxY) maxY = imgy;
      hasCoords = true;
    });

    const groupCenterX = hasCoords ? (minX + maxX) / 2 : 0;
    const groupCenterY = hasCoords ? (minY + maxY) / 2 : 0;

    // 2. Búsqueda de centro de destino
    let targetX = 0;
    let targetY = 0;
    if (quests.length > 0) {
      const sumX = quests.reduce((acc, q) => acc + (getDValue(q.x) ?? 0), 0);
      const sumY = quests.reduce((acc, q) => acc + (getDValue(q.y) ?? 0), 0);
      targetX = sumX / quests.length;
      targetY = sumY / quests.length;
    }

    const dx = targetX - groupCenterX;
    const dy = targetY - groupCenterY;

    let finalDx = dx;
    let finalDy = dy;

    if (snapToGrid) {
      const anchorQuest = asset.quests && asset.quests.length > 0 ? asset.quests[0] : null;
      const anchorImage = !anchorQuest && asset.images && asset.images.length > 0 ? asset.images[0] : null;
      const anchorItem = anchorQuest || anchorImage;
      let snapStep = 0.5;
      if (anchorQuest) {
        const sizeVal = anchorQuest.size?.value ?? anchorQuest.size ?? 1.0;
        snapStep = sizeVal / 2;
      }
      if (anchorItem) {
        const anchorOrigX = getDValue(anchorItem.x) ?? 0;
        const anchorOrigY = getDValue(anchorItem.y) ?? 0;
        const anchorTentX = anchorOrigX + dx;
        const anchorTentY = anchorOrigY + dy;
        const anchorSnappedX = Math.round(anchorTentX / snapStep) * snapStep;
        const anchorSnappedY = Math.round(anchorTentY / snapStep) * snapStep;
        finalDx = anchorSnappedX - anchorOrigX;
        finalDy = anchorSnappedY - anchorOrigY;
      } else {
        finalDx = Math.round(dx / 0.5) * 0.5;
        finalDy = Math.round(dy / 0.5) * 0.5;
      }
    }

    // 3. Crear mapa de IDs de misiones
    const idMap: { [key: string]: string } = {};
    asset.quests.forEach((q: any) => {
      const oldId = getDValue(q.id);
      if (oldId) {
        idMap[oldId] = generateHexId();
      }
    });

    // 4. Copiar y desplazar misiones
    const pastedQuests = asset.quests.map((q: any) => {
      const qCopy = JSON.parse(JSON.stringify(q));
      
      // Actualizar ID de misión
      const oldId = getDValue(q.id);
      if (oldId && idMap[oldId]) {
        qCopy.id = idMap[oldId];
      }

      // Aplicar desplazamiento a X
      const curX = getDValue(qCopy.x) ?? 0;
      let newX = curX + finalDx;
      // Aplicar desplazamiento a Y
      const curY = getDValue(qCopy.y) ?? 0;
      let newY = curY + finalDy;
      if (snapToGrid) {
        newX = Math.round(newX * 10000) / 10000;
        newY = Math.round(newY * 10000) / 10000;
      }
      qCopy.x = { __type: 'number', value: newX, suffix: 'd' };
      qCopy.y = { __type: 'number', value: newY, suffix: 'd' };

      // Reindexar dependencias internas
      if (qCopy.dependencies) {
        if (Array.isArray(qCopy.dependencies)) {
          qCopy.dependencies = qCopy.dependencies.map((dep: any) => {
            const depId = typeof dep === 'object' ? dep.value : dep;
            return idMap[depId] ? idMap[depId] : dep;
          });
        } else {
          const depId = typeof qCopy.dependencies === 'object' ? qCopy.dependencies.value : qCopy.dependencies;
          if (idMap[depId]) {
            qCopy.dependencies = idMap[depId];
          }
        }
      }

      return qCopy;
    });

    // 5. Copiar y desplazar imágenes
    const pastedImages = asset.images.map((img: any) => {
      const imgCopy = JSON.parse(JSON.stringify(img));

      // Aplicar desplazamiento a X
      const curX = getDValue(imgCopy.x) ?? 0;
      let newX = curX + finalDx;
      // Aplicar desplazamiento a Y
      const curY = getDValue(imgCopy.y) ?? 0;
      let newY = curY + finalDy;
      if (snapToGrid) {
        newX = Math.round(newX * 10000) / 10000;
        newY = Math.round(newY * 10000) / 10000;
      }
      imgCopy.x = { __type: 'number', value: newX, suffix: 'd' };
      imgCopy.y = { __type: 'number', value: newY, suffix: 'd' };

      return imgCopy;
    });

    // 6. Actualizar el estado global con las nuevas misiones e imágenes
    updateState([...quests, ...pastedQuests], [...images, ...pastedImages]);
    
    // Seleccionar automáticamente los nuevos elementos pegados para comodidad
    const newSelectionItems: { type: 'quest' | 'image'; id: string | number }[] = [];
    pastedQuests.forEach((q: any) => {
      newSelectionItems.push({ type: 'quest', id: q.id });
    });
    const startImgIdx = images.length;
    pastedImages.forEach((_: any, idx: number) => {
      newSelectionItems.push({ type: 'image', id: startImgIdx + idx });
    });

    setSelection({
      type: newSelectionItems.length === 1 ? newSelectionItems[0].type : 'mixed',
      ids: newSelectionItems.map(item => item.id),
      items: newSelectionItems
    });

    showToast(`¡Se ha pegado con éxito el activo "${asset.title}"!`, 'success');
  };

  const clearSelectedDependencies = () => {
    const selectedQuestIds = selection.items
      .filter(item => item.type === 'quest')
      .map(item => item.id as string);

    if (selectedQuestIds.length === 0) return;

    const newQuests = quests.map(q => {
      let isModified = false;
      const qCopy = { ...q };

      // Eliminar dependencias salientes si es una misión seleccionada
      if (selectedQuestIds.includes(q.id)) {
        if (qCopy.dependencies !== undefined) {
          delete qCopy.dependencies;
          isModified = true;
        }
        if (qCopy.dependency !== undefined) {
          delete qCopy.dependency;
          isModified = true;
        }
      }

      // Eliminar dependencias entrantes que coincidan con las misiones seleccionadas
      if (qCopy.dependencies) {
        if (Array.isArray(qCopy.dependencies)) {
          const filtered = qCopy.dependencies.filter((dep: any) => {
            const depId = typeof dep === 'object' ? dep.value : dep;
            return !selectedQuestIds.includes(depId);
          });
          if (filtered.length !== qCopy.dependencies.length) {
            qCopy.dependencies = filtered.length > 0 ? filtered : undefined;
            isModified = true;
          }
        } else {
          const depId = typeof qCopy.dependencies === 'object' ? qCopy.dependencies.value : qCopy.dependencies;
          if (selectedQuestIds.includes(depId)) {
            qCopy.dependencies = undefined;
            isModified = true;
          }
        }
      }

      // Limpieza final de campos vacíos
      if (qCopy.dependencies === undefined) {
        delete qCopy.dependencies;
      }

      return isModified ? qCopy : q;
    });

    updateState(newQuests, images);
    showToast(`Dependencias eliminadas para ${selectedQuestIds.length} misión(es).`, 'success');
  };

  const handleExport = () => {
    if (!snbtData) return;
    const newData = { ...snbtData };
    newData.quests = quests;
    
    // Normalizar las barras invertidas "\\" a "/" en los paths de las imágenes
    newData.images = images.map(img => {
      if (img && typeof img.image === 'string') {
        return {
          ...img,
          image: img.image.replace(/\\/g, '/')
        };
      }
      return img;
    });
    
    const outputSNBT = stringifySNBT(newData);
    const blob = new Blob([outputSNBT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.snbt') ? filename : `${filename}.snbt`;
    a.click();
    URL.revokeObjectURL(url);

    setIsDirty(false);
    if (activeTabIdRef.current) {
      setTabs(prev => prev.map(t => t.id === activeTabIdRef.current ? { ...t, isDirty: false } : t));
    }
    showToast(`Capítulo "${snbtData.title || filename}" exportado`, 'success');
  };

  const handleExportAll = () => {
    if (tabsRef.current.length === 0) return;
    tabsRef.current.forEach((tab, index) => {
      setTimeout(() => {
        const isCurrent = tab.id === activeTabIdRef.current;
        const currentData = isCurrent ? { ...snbtData, quests, images } : { ...tab.snbtData, quests: tab.quests, images: tab.images };

        currentData.images = (currentData.images || []).map((img: any) => {
          if (img && typeof img.image === 'string') {
            return { ...img, image: img.image.replace(/\\/g, '/') };
          }
          return img;
        });

        const outputSNBT = stringifySNBT(currentData);
        const blob = new Blob([outputSNBT], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = tab.filename.endsWith('.snbt') ? tab.filename : `${tab.filename}.snbt`;
        a.click();
        URL.revokeObjectURL(url);
      }, index * 250);
    });

    setIsDirty(false);
    setTabs(prev => prev.map(t => ({ ...t, isDirty: false })));
    showToast(`Exportando ${tabsRef.current.length} capítulos...`, 'success');
  };

  const handleExportZip = async () => {
    const allChapters: { filename: string; snbtData: any }[] = [];

    if (tabsRef.current.length > 0) {
      tabsRef.current.forEach(tab => {
        const isCurrent = tab.id === activeTabIdRef.current;
        const currentData = isCurrent ? { ...snbtData, quests, images } : { ...tab.snbtData, quests: tab.quests, images: tab.images };
        const normalizedImages = (currentData.images || []).map((img: any) => {
          if (img && typeof img.image === 'string') {
            return { ...img, image: img.image.replace(/\\/g, '/') };
          }
          return img;
        });
        allChapters.push({
          filename: tab.filename.endsWith('.snbt') ? tab.filename : `${tab.filename}.snbt`,
          snbtData: { ...currentData, images: normalizedImages }
        });
      });
    } else if (snbtData) {
      allChapters.push({
        filename: filename.endsWith('.snbt') ? filename : `${filename}.snbt`,
        snbtData: {
          ...snbtData,
          quests,
          images: images.map(img => (img?.image ? { ...img, image: img.image.replace(/\\/g, '/') } : img))
        }
      });
    }

    if (allChapters.length === 0 && rewardTables.length === 0 && chapterGroups.length === 0) {
      showToast('No hay capítulos, tablas ni grupos para exportar', 'warning');
      return;
    }

    try {
      showToast('Generando archivo .ZIP del Modpack...', 'info');
      await exportModpackToZip({
        chapters: allChapters,
        rewardTables,
        chapterGroups,
        zipFilename: 'ftbquests-modpack.zip'
      });
      showToast('¡Modpack .ZIP exportado exitosamente!', 'success');
    } catch (err: any) {
      console.error('Error exportando .ZIP:', err);
      showToast(`Error al exportar .ZIP: ${err.message || err}`, 'warning');
    }
  };

  const addQuest = () => {
    const newQuest = {
      id: generateHexId(),
      x: { __type: 'number', value: 0.0, suffix: 'd' },
      y: { __type: 'number', value: 0.0, suffix: 'd' },
      title: "Nueva Misión",
      tasks: [],
      rewards: []
    };
    const nextQuests = [...quests, newQuest];
    updateState(nextQuests, images);
    setSelection({ type: 'quest', id: newQuest.id });
  };

  const addImage = () => {
    const newImage = {
      image: "minecraft:textures/block/stone.png",
      x: { __type: 'number', value: 0.0, suffix: 'd' },
      y: { __type: 'number', value: 0.0, suffix: 'd' },
      width: { __type: 'number', value: 2.0, suffix: 'd' },
      height: { __type: 'number', value: 2.0, suffix: 'd' },
      rotation: { __type: 'number', value: 0.0, suffix: 'd' },
      order: 1
    };
    const nextImages = [...images, newImage];
    updateState(quests, nextImages);
    setSelection({ type: 'image', id: images.length });
  };

  const updateQuest = (idOrUpdatesList: string | { id: string, updates: any }[], updates?: any) => {
    if (Array.isArray(idOrUpdatesList)) {
      const nextQuests = quests.map(q => {
        const found = idOrUpdatesList.find(u => u.id === q.id);
        if (found) {
          const u = found.updates;
          const updatedObj: any = {
            ...q,
            ...u,
            x: u.x !== undefined ? (typeof u.x === 'object' && u.x !== null ? u.x : { __type: 'number', value: u.x, suffix: 'd' }) : q.x,
            y: u.y !== undefined ? (typeof u.y === 'object' && u.y !== null ? u.y : { __type: 'number', value: u.y, suffix: 'd' }) : q.y,
          };
          // Limpiar propiedades con valor undefined para eliminarlas físicamente
          Object.keys(updatedObj).forEach(key => {
            if (updatedObj[key] === undefined) {
              delete updatedObj[key];
            }
          });
          return updatedObj;
        }
        return q;
      });
      updateState(nextQuests, images);
    } else {
      const id = idOrUpdatesList;
      const nextQuests = quests.map(q => {
        if (q.id === id) {
          const updatedObj: any = {
            ...q,
            ...updates,
            x: updates.x !== undefined ? (typeof updates.x === 'object' && updates.x !== null ? updates.x : { __type: 'number', value: updates.x, suffix: 'd' }) : q.x,
            y: updates.y !== undefined ? (typeof updates.y === 'object' && updates.y !== null ? updates.y : { __type: 'number', value: updates.y, suffix: 'd' }) : q.y,
          };
          // Limpiar propiedades con valor undefined para eliminarlas físicamente
          Object.keys(updatedObj).forEach(key => {
            if (updatedObj[key] === undefined) {
              delete updatedObj[key];
            }
          });
          return updatedObj;
        }
        return q;
      });
      updateState(nextQuests, images);
    }
  };

  const handleQuestContextMenu = (questId: string, clientX: number, clientY: number) => {
    setContextMenu({
      visible: true,
      x: clientX,
      y: clientY,
      targetQuestId: questId
    });
  };

  const handleConnectQuests = (sourceId: string, targetId: string) => {
    const targetQ = quests.find(q => q.id === targetId);
    if (!targetQ) return;

    const currentDeps = Array.isArray(targetQ.dependencies)
      ? [...targetQ.dependencies]
      : (targetQ.dependencies ? [targetQ.dependencies] : []);

    const normalizedDeps = currentDeps.map(d => typeof d === 'object' && d !== null ? d.id : String(d));

    let newDeps: any[];
    if (normalizedDeps.includes(sourceId)) {
      newDeps = currentDeps.filter(d => (typeof d === 'object' && d !== null ? d.id : String(d)) !== sourceId);
      showToast(`Dependencia eliminada: ${sourceId} ➔ ${targetId}`, 'info');
    } else {
      newDeps = [...currentDeps, sourceId];
      showToast(`Dependencia creada: ${sourceId} ➔ ${targetId}`, 'success');
    }

    updateQuest(targetId, { dependencies: newDeps.length > 0 ? newDeps : undefined });
  };

  const invertSelectedDependency = () => {
    if (selection.type !== 'dependency' || !selection.dependency) return;
    const { sourceId, targetId } = selection.dependency;

    const nextQuests = quests.map(q => {
      if (q.id === targetId) {
        const curDeps = Array.isArray(q.dependencies) ? q.dependencies : (q.dependencies ? [q.dependencies] : []);
        const filtered = curDeps.filter((d: any) => (typeof d === 'object' && d !== null ? d.id : String(d)) !== sourceId);
        return {
          ...q,
          dependencies: filtered.length > 0 ? filtered : undefined
        };
      }
      if (q.id === sourceId) {
        const curDeps = Array.isArray(q.dependencies) ? [...q.dependencies] : (q.dependencies ? [q.dependencies] : []);
        const strDeps = curDeps.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
        if (!strDeps.includes(targetId)) {
          curDeps.push(targetId);
        }
        return {
          ...q,
          dependencies: curDeps
        };
      }
      return q;
    });

    updateState(nextQuests, images);
    setSelection({
      type: 'dependency',
      ids: [`${targetId}->${sourceId}`],
      items: [],
      dependency: { sourceId: targetId, targetId: sourceId }
    });
    showToast(`Dirección invertida: ${targetId} ➔ ${sourceId}`, 'info');
  };

  const deleteSelectedDependency = () => {
    if (selection.type !== 'dependency' || !selection.dependency) return;
    const { sourceId, targetId } = selection.dependency;

    const nextQuests = quests.map(q => {
      if (q.id === targetId) {
        const curDeps = Array.isArray(q.dependencies) ? q.dependencies : (q.dependencies ? [q.dependencies] : []);
        const filtered = curDeps.filter((d: any) => (typeof d === 'object' && d !== null ? d.id : String(d)) !== sourceId);
        return {
          ...q,
          dependencies: filtered.length > 0 ? filtered : undefined
        };
      }
      return q;
    });

    updateState(nextQuests, images);
    setSelection({ type: null, ids: [], items: [] });
    showToast(`Dependencia eliminada: ${sourceId} ➔ ${targetId}`, 'info');
  };

  const handleBatchReplace = (
    searchQuery: string,
    replaceWith: string,
    scope: 'current' | 'all',
    fields: {
      titles: boolean;
      descriptions: boolean;
      tasks: boolean;
      rewards: boolean;
      icons: boolean;
    }
  ) => {
    if (!searchQuery) return;

    let totalReplacements = 0;
    let modifiedQuestsCount = 0;

    const replaceInQuest = (q: any) => {
      let isModified = false;
      const qCopy = JSON.parse(JSON.stringify(q));

      // 1. Títulos y Subtítulos
      if (fields.titles) {
        if (typeof qCopy.title === 'string' && qCopy.title.includes(searchQuery)) {
          const count = qCopy.title.split(searchQuery).length - 1;
          qCopy.title = qCopy.title.replaceAll(searchQuery, replaceWith);
          totalReplacements += count;
          isModified = true;
        }
        if (typeof qCopy.subtitle === 'string' && qCopy.subtitle.includes(searchQuery)) {
          const count = qCopy.subtitle.split(searchQuery).length - 1;
          qCopy.subtitle = qCopy.subtitle.replaceAll(searchQuery, replaceWith);
          totalReplacements += count;
          isModified = true;
        }
      }

      // 2. Descripciones
      if (fields.descriptions && Array.isArray(qCopy.description)) {
        qCopy.description = qCopy.description.map((line: any) => {
          if (typeof line === 'string' && line.includes(searchQuery)) {
            const count = line.split(searchQuery).length - 1;
            totalReplacements += count;
            isModified = true;
            return line.replaceAll(searchQuery, replaceWith);
          }
          return line;
        });
      }

      // 3. Tareas
      if (fields.tasks && qCopy.tasks) {
        const taskList = Array.isArray(qCopy.tasks) ? qCopy.tasks : [qCopy.tasks];
        taskList.forEach((t: any) => {
          if (!t) return;
          if (typeof t.item === 'string' && t.item.includes(searchQuery)) {
            const count = t.item.split(searchQuery).length - 1;
            t.item = t.item.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
          if (t.item && typeof t.item === 'object' && typeof t.item.id === 'string' && t.item.id.includes(searchQuery)) {
            const count = t.item.id.split(searchQuery).length - 1;
            t.item.id = t.item.id.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
          if (typeof t.title === 'string' && t.title.includes(searchQuery)) {
            const count = t.title.split(searchQuery).length - 1;
            t.title = t.title.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
        });
      }

      // 4. Recompensas
      if (fields.rewards && qCopy.rewards) {
        const rewardList = Array.isArray(qCopy.rewards) ? qCopy.rewards : [qCopy.rewards];
        rewardList.forEach((r: any) => {
          if (!r) return;
          if (typeof r.item === 'string' && r.item.includes(searchQuery)) {
            const count = r.item.split(searchQuery).length - 1;
            r.item = r.item.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
          if (r.item && typeof r.item === 'object' && typeof r.item.id === 'string' && r.item.id.includes(searchQuery)) {
            const count = r.item.id.split(searchQuery).length - 1;
            r.item.id = r.item.id.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
          if (typeof r.title === 'string' && r.title.includes(searchQuery)) {
            const count = r.title.split(searchQuery).length - 1;
            r.title = r.title.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
          if (typeof r.command === 'string' && r.command.includes(searchQuery)) {
            const count = r.command.split(searchQuery).length - 1;
            r.command = r.command.replaceAll(searchQuery, replaceWith);
            totalReplacements += count;
            isModified = true;
          }
        });
      }

      // 5. Iconos
      if (fields.icons) {
        if (typeof qCopy.icon === 'string' && qCopy.icon.includes(searchQuery)) {
          const count = qCopy.icon.split(searchQuery).length - 1;
          qCopy.icon = qCopy.icon.replaceAll(searchQuery, replaceWith);
          totalReplacements += count;
          isModified = true;
        }
      }

      if (isModified) modifiedQuestsCount++;
      return isModified ? qCopy : q;
    };

    const replaceInImages = (imgList: any[]) => {
      if (!fields.icons) return imgList;
      return imgList.map(img => {
        if (img && typeof img.image === 'string' && img.image.includes(searchQuery)) {
          const count = img.image.split(searchQuery).length - 1;
          totalReplacements += count;
          return { ...img, image: img.image.replaceAll(searchQuery, replaceWith) };
        }
        return img;
      });
    };

    if (scope === 'current') {
      const nextQuests = quests.map(replaceInQuest);
      const nextImages = replaceInImages(images);
      updateState(nextQuests, nextImages);
      showToast(`Reemplazo completado: ${totalReplacements} ocurrencia(s) en ${modifiedQuestsCount} misión(es)`, 'success');
    } else {
      const nextCurrentQuests = quests.map(replaceInQuest);
      const nextCurrentImages = replaceInImages(images);
      updateState(nextCurrentQuests, nextCurrentImages);

      setTabs(prev => prev.map(t => {
        if (t.id === activeTabIdRef.current) return t;
        const tabQuests = t.quests.map(replaceInQuest);
        const tabImages = replaceInImages(t.images);
        return {
          ...t,
          quests: tabQuests,
          images: tabImages,
          isDirty: true
        };
      }));

      showToast(`Reemplazo masivo: ${totalReplacements} ocurrencia(s) en todas las pestañas`, 'success');
    }
  };

  const handleReplaceSingle = (match: any, replaceWith: string) => {
    if (!match || !match.quest) return;
    const targetQId = match.quest.id;
    const qObj = quests.find(q => q.id === targetQId);
    if (!qObj) return;

    const qCloned = JSON.parse(JSON.stringify(qObj));
    const rawDetail = match.matchDetail || '';
    const colonIdx = rawDetail.indexOf(': ');
    const term = colonIdx !== -1 ? rawDetail.substring(colonIdx + 2) : '';

    if (match.matchField === 'title' && typeof qCloned.title === 'string') {
      qCloned.title = qCloned.title.replace(term || qCloned.title, replaceWith);
    } else if (match.matchField === 'subtitle' && typeof qCloned.subtitle === 'string') {
      qCloned.subtitle = qCloned.subtitle.replace(term || qCloned.subtitle, replaceWith);
    } else if (match.matchField === 'description' && Array.isArray(qCloned.description)) {
      qCloned.description = qCloned.description.map((l: string) => typeof l === 'string' ? l.replace(term, replaceWith) : l);
    } else if (match.matchField === 'task' && qCloned.tasks) {
      const taskList = Array.isArray(qCloned.tasks) ? qCloned.tasks : [qCloned.tasks];
      taskList.forEach((t: any) => {
        if (!t) return;
        if (typeof t.item === 'string') t.item = t.item.replace(term, replaceWith);
        if (t.item && typeof t.item === 'object' && typeof t.item.id === 'string') t.item.id = t.item.id.replace(term, replaceWith);
        if (typeof t.title === 'string') t.title = t.title.replace(term, replaceWith);
      });
    } else if (match.matchField === 'reward' && qCloned.rewards) {
      const rewardList = Array.isArray(qCloned.rewards) ? qCloned.rewards : [qCloned.rewards];
      rewardList.forEach((r: any) => {
        if (!r) return;
        if (typeof r.item === 'string') r.item = r.item.replace(term, replaceWith);
        if (r.item && typeof r.item === 'object' && typeof r.item.id === 'string') r.item.id = r.item.id.replace(term, replaceWith);
        if (typeof r.title === 'string') r.title = r.title.replace(term, replaceWith);
        if (typeof r.command === 'string') r.command = r.command.replace(term, replaceWith);
      });
    }

    updateQuest(targetQId, qCloned);
    showToast(`Coincidencia reemplazada en "${getDValue(qCloned.title) || targetQId}"`, 'success');
  };

  const makeSelectedDependOnTarget = () => {
    if (!contextMenu.targetQuestId) return;
    const targetId = contextMenu.targetQuestId;
    const selectedIds = rawSelection.items.filter(i => i.type === 'quest').map(i => i.id as string);
    if (selectedIds.length === 0) return;

    const nextQuests = quests.map(q => {
      if (selectedIds.includes(q.id) && q.id !== targetId) {
        const currentDeps = Array.isArray(q.dependencies) 
          ? [...q.dependencies] 
          : (q.dependencies ? [q.dependencies] : []);
        
        const stringDeps = currentDeps.map(d => typeof d === 'object' && d !== null ? d.id : String(d));
        if (!stringDeps.includes(targetId)) {
          return {
            ...q,
            dependencies: [...currentDeps, targetId]
          };
        }
      }
      return q;
    });
    updateState(nextQuests, images);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const removeSelectedDependencyOnTarget = () => {
    if (!contextMenu.targetQuestId) return;
    const targetId = contextMenu.targetQuestId;
    const selectedIds = rawSelection.items.filter(i => i.type === 'quest').map(i => i.id as string);
    if (selectedIds.length === 0) return;

    const nextQuests = quests.map(q => {
      if (selectedIds.includes(q.id)) {
        const currentDeps = Array.isArray(q.dependencies) 
          ? [...q.dependencies] 
          : (q.dependencies ? [q.dependencies] : []);
        
        const filteredDeps = currentDeps.filter(d => {
          const dId = typeof d === 'object' && d !== null ? d.id : String(d);
          return dId !== targetId;
        });

        const updatedQuest = {
          ...q,
          dependencies: filteredDeps.length > 0 ? filteredDeps : undefined
        };
        if (updatedQuest.dependencies === undefined) {
          delete updatedQuest.dependencies;
        }
        return updatedQuest;
      }
      return q;
    });
    updateState(nextQuests, images);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const makeTargetDependOnSelected = () => {
    if (!contextMenu.targetQuestId) return;
    const targetId = contextMenu.targetQuestId;
    const selectedIds = rawSelection.items.filter(i => i.type === 'quest').map(i => i.id as string);
    if (selectedIds.length === 0) return;

    const nextQuests = quests.map(q => {
      if (q.id === targetId) {
        const currentDeps = Array.isArray(q.dependencies) 
          ? [...q.dependencies] 
          : (q.dependencies ? [q.dependencies] : []);
        
        const stringDeps = currentDeps.map(d => typeof d === 'object' && d !== null ? d.id : String(d));
        const newDeps = [...currentDeps];
        selectedIds.forEach(id => {
          if (id !== targetId && !stringDeps.includes(id)) {
            newDeps.push(id);
          }
        });

        return {
          ...q,
          dependencies: newDeps
        };
      }
      return q;
    });
    updateState(nextQuests, images);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const removeTargetDependencyOnSelected = () => {
    if (!contextMenu.targetQuestId) return;
    const targetId = contextMenu.targetQuestId;
    const selectedIds = rawSelection.items.filter(i => i.type === 'quest').map(i => i.id as string);
    if (selectedIds.length === 0) return;

    const nextQuests = quests.map(q => {
      if (q.id === targetId) {
        const currentDeps = Array.isArray(q.dependencies) 
          ? [...q.dependencies] 
          : (q.dependencies ? [q.dependencies] : []);
        
        const filteredDeps = currentDeps.filter(d => {
          const dId = typeof d === 'object' && d !== null ? d.id : String(d);
          return !selectedIds.includes(dId);
        });

        const updatedQuest = {
          ...q,
          dependencies: filteredDeps.length > 0 ? filteredDeps : undefined
        };
        if (updatedQuest.dependencies === undefined) {
          delete updatedQuest.dependencies;
        }
        return updatedQuest;
      }
      return q;
    });
    updateState(nextQuests, images);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const deleteQuest = (id: string) => {
    const nextQuests = quests.filter(q => q.id !== id);
    updateState(nextQuests, images);
    setSelection({ type: null, ids: [], items: [] });
  };

  const deleteSelectedQuests = () => {
    const selectedIds = selection.items
      .filter(item => item.type === 'quest')
      .map(item => item.id as string);
      
    if (selectedIds.length === 0) return;

    const nextQuests = quests.filter(q => !selectedIds.includes(q.id));
    updateState(nextQuests, images);
    setSelection({ type: null, ids: [], items: [] });
  };

  const deleteSelectedImages = () => {
    const selectedIndices = selection.items
      .filter(item => item.type === 'image')
      .map(item => item.id as number);
    
    if (selectedIndices.length === 0) return;

    const nextImages = images.filter((_, idx) => !selectedIndices.includes(idx));
    updateState(quests, nextImages);
    setSelection({ type: null, ids: [], items: [] });
  };

  const updateImage = (indexOrUpdatesList: number | { index: number, updates: any }[], updates?: any) => {
    const newImages = JSON.parse(JSON.stringify(images));
    if (Array.isArray(indexOrUpdatesList)) {
      indexOrUpdatesList.forEach(({ index, updates: u }) => {
        if (newImages[index]) {
          if (u.x !== undefined) newImages[index].x = { __type: 'number', value: u.x, suffix: 'd' };
          if (u.y !== undefined) newImages[index].y = { __type: 'number', value: u.y, suffix: 'd' };
          if (u.width !== undefined) newImages[index].width = { __type: 'number', value: u.width, suffix: 'd' };
          if (u.height !== undefined) newImages[index].height = { __type: 'number', value: u.height, suffix: 'd' };
          if (u.rotation !== undefined) newImages[index].rotation = { __type: 'number', value: u.rotation, suffix: 'd' };
          if (u.alpha !== undefined) newImages[index].alpha = { __type: 'number', value: u.alpha, suffix: '' };
          if (u.order !== undefined) newImages[index].order = { __type: 'number', value: u.order, suffix: '' };
          if (u.image !== undefined) newImages[index].image = u.image;
          if (u.color !== undefined) newImages[index].color = u.color;
        }
      });
    } else {
      const index = indexOrUpdatesList;
      if (newImages[index]) {
        if (updates.x !== undefined) newImages[index].x = { __type: 'number', value: updates.x, suffix: 'd' };
        if (updates.y !== undefined) newImages[index].y = { __type: 'number', value: updates.y, suffix: 'd' };
        if (updates.width !== undefined) newImages[index].width = { __type: 'number', value: updates.width, suffix: 'd' };
        if (updates.height !== undefined) newImages[index].height = { __type: 'number', value: updates.height, suffix: 'd' };
        if (updates.rotation !== undefined) newImages[index].rotation = { __type: 'number', value: updates.rotation, suffix: 'd' };
        if (updates.alpha !== undefined) newImages[index].alpha = { __type: 'number', value: updates.alpha, suffix: '' };
        if (updates.order !== undefined) newImages[index].order = { __type: 'number', value: updates.order, suffix: '' };
        if (updates.image !== undefined) newImages[index].image = updates.image;
        if (updates.color !== undefined) newImages[index].color = updates.color;
      }
    }
    updateState(quests, newImages);
  };

  const updateQuestsAndImages = (
    questUpdatesList: { id: string; updates: any }[],
    imageUpdatesList: { index: number; updates: any }[]
  ) => {
    let nextQuests = quests;
    if (questUpdatesList && questUpdatesList.length > 0) {
      nextQuests = quests.map(q => {
        const found = questUpdatesList.find(u => u.id === q.id);
        if (found) {
          const u = found.updates;
          const updatedObj: any = {
            ...q,
            ...u,
            x: u.x !== undefined ? (typeof u.x === 'object' && u.x !== null ? u.x : { __type: 'number', value: u.x, suffix: 'd' }) : q.x,
            y: u.y !== undefined ? (typeof u.y === 'object' && u.y !== null ? u.y : { __type: 'number', value: u.y, suffix: 'd' }) : q.y,
          };
          Object.keys(updatedObj).forEach(key => {
            if (updatedObj[key] === undefined) delete updatedObj[key];
          });
          return updatedObj;
        }
        return q;
      });
    }

    let nextImages = JSON.parse(JSON.stringify(images));
    if (imageUpdatesList && imageUpdatesList.length > 0) {
      imageUpdatesList.forEach(({ index, updates: u }) => {
        if (nextImages[index]) {
          if (u.x !== undefined) nextImages[index].x = { __type: 'number', value: u.x, suffix: 'd' };
          if (u.y !== undefined) nextImages[index].y = { __type: 'number', value: u.y, suffix: 'd' };
          if (u.width !== undefined) nextImages[index].width = { __type: 'number', value: u.width, suffix: 'd' };
          if (u.height !== undefined) nextImages[index].height = { __type: 'number', value: u.height, suffix: 'd' };
          if (u.rotation !== undefined) nextImages[index].rotation = { __type: 'number', value: u.rotation, suffix: 'd' };
          if (u.alpha !== undefined) nextImages[index].alpha = { __type: 'number', value: u.alpha, suffix: '' };
          if (u.order !== undefined) nextImages[index].order = { __type: 'number', value: u.order, suffix: '' };
          if (u.image !== undefined) nextImages[index].image = u.image;
          if (u.color !== undefined) nextImages[index].color = u.color;
        }
      });
    }

    updateState(nextQuests, nextImages);
  };

  const alignSelectedItems = (alignType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selection.items.length <= 1) return;

    // 1. Calcular cajas delimitadoras de cada elemento
    const boundsList = selection.items.map(item => {
      let x = 0;
      let y = 0;
      let w = 0;
      let h = 0;

      if (item.type === 'quest') {
        const q = quests.find(qi => qi.id === item.id);
        if (q) {
          x = q.x?.value ?? q.x ?? 0;
          y = q.y?.value ?? q.y ?? 0;
          const sizeVal = q.size?.value ?? q.size ?? 1.0;
          w = sizeVal;
          h = sizeVal;
        }
      } else {
        const img = images[item.id as number];
        if (img) {
          x = img.x?.value ?? img.x ?? 0;
          y = img.y?.value ?? img.y ?? 0;
          w = img.width?.value ?? img.width ?? 2.0;
          h = img.height?.value ?? img.height ?? 2.0;
        }
      }

      return {
        type: item.type,
        id: item.id,
        w,
        h,
        left: x - w / 2,
        right: x + w / 2,
        top: y - h / 2,
        bottom: y + h / 2,
        x,
        y
      };
    });

    // 2. Bounding box común de toda la selección
    const minLeft = Math.min(...boundsList.map(b => b.left));
    const maxRight = Math.max(...boundsList.map(b => b.right));
    const minTop = Math.min(...boundsList.map(b => b.top));
    const maxBottom = Math.max(...boundsList.map(b => b.bottom));

    const centerX = (minLeft + maxRight) / 2;
    const centerY = (minTop + maxBottom) / 2;

    // 3. Generar actualizaciones
    const questUpdates: { id: string; updates: any }[] = [];
    const imageUpdates: { index: number; updates: any }[] = [];

    boundsList.forEach(b => {
      let newX = b.x;
      let newY = b.y;

      switch (alignType) {
        case 'left':
          newX = minLeft + b.w / 2;
          break;
        case 'center':
          newX = centerX;
          break;
        case 'right':
          newX = maxRight - b.w / 2;
          break;
        case 'top':
          newY = minTop + b.h / 2;
          break;
        case 'middle':
          newY = centerY;
          break;
        case 'bottom':
          newY = maxBottom - b.h / 2;
          break;
      }

      const updates = { x: newX, y: newY };
      if (b.type === 'quest') {
        questUpdates.push({ id: b.id as string, updates });
      } else {
        imageUpdates.push({ index: b.id as number, updates });
      }
    });

    // 4. Aplicar cambios a través de updateState de forma atómica para registrar una sola entrada en el historial
    const newQuests = quests.map(q => {
      const found = questUpdates.find(u => u.id === q.id);
      if (found) {
        return {
          ...q,
          x: { __type: 'number', value: found.updates.x, suffix: 'd' },
          y: { __type: 'number', value: found.updates.y, suffix: 'd' }
        };
      }
      return q;
    });

    const newImages = JSON.parse(JSON.stringify(images));
    imageUpdates.forEach(u => {
      if (newImages[u.index]) {
        newImages[u.index].x = { __type: 'number', value: u.updates.x, suffix: 'd' };
        newImages[u.index].y = { __type: 'number', value: u.updates.y, suffix: 'd' };
      }
    });

    updateState(newQuests, newImages);
  };

  const distributeSelectedItems = (axis: 'horizontal' | 'vertical') => {
    if (selection.items.length < 3) return;

    const boundsList = selection.items.map(item => {
      let x = 0;
      let y = 0;
      let w = 1.0;
      let h = 1.0;

      if (item.type === 'quest') {
        const q = quests.find(qi => qi.id === item.id);
        if (q) {
          x = getDValue(q.x) ?? 0;
          y = getDValue(q.y) ?? 0;
          const sizeVal = getDValue(q.size) ?? 1.0;
          w = sizeVal;
          h = sizeVal;
        }
      } else {
        const img = images[item.id as number];
        if (img) {
          x = getDValue(img.x) ?? 0;
          y = getDValue(img.y) ?? 0;
          w = getDValue(img.width) ?? 2.0;
          h = getDValue(img.height) ?? 2.0;
        }
      }

      return {
        type: item.type,
        id: item.id,
        x,
        y,
        w,
        h
      };
    });

    if (axis === 'horizontal') {
      boundsList.sort((a, b) => a.x - b.x);
      const firstX = boundsList[0].x;
      const lastX = boundsList[boundsList.length - 1].x;
      const span = lastX - firstX;
      if (Math.abs(span) < 0.001) return;
      const step = span / (boundsList.length - 1);

      const questUpdates: { id: string; updates: any }[] = [];
      const imageUpdates: { index: number; updates: any }[] = [];

      boundsList.forEach((b, index) => {
        const targetX = Math.round((firstX + index * step) * 1000) / 1000;
        const updates = { x: targetX };
        if (b.type === 'quest') {
          questUpdates.push({ id: b.id as string, updates });
        } else {
          imageUpdates.push({ index: b.id as number, updates });
        }
      });

      const newQuests = quests.map(q => {
        const found = questUpdates.find(u => u.id === q.id);
        if (found) {
          return {
            ...q,
            x: { __type: 'number', value: found.updates.x, suffix: 'd' }
          };
        }
        return q;
      });

      const newImages = JSON.parse(JSON.stringify(images));
      imageUpdates.forEach(u => {
        if (newImages[u.index]) {
          newImages[u.index].x = { __type: 'number', value: u.updates.x, suffix: 'd' };
        }
      });

      updateState(newQuests, newImages);
      showToast('Elementos distribuidos horizontalmente', 'success');
    } else {
      boundsList.sort((a, b) => a.y - b.y);
      const firstY = boundsList[0].y;
      const lastY = boundsList[boundsList.length - 1].y;
      const span = lastY - firstY;
      if (Math.abs(span) < 0.001) return;
      const step = span / (boundsList.length - 1);

      const questUpdates: { id: string; updates: any }[] = [];
      const imageUpdates: { index: number; updates: any }[] = [];

      boundsList.forEach((b, index) => {
        const targetY = Math.round((firstY + index * step) * 1000) / 1000;
        const updates = { y: targetY };
        if (b.type === 'quest') {
          questUpdates.push({ id: b.id as string, updates });
        } else {
          imageUpdates.push({ index: b.id as number, updates });
        }
      });

      const newQuests = quests.map(q => {
        const found = questUpdates.find(u => u.id === q.id);
        if (found) {
          return {
            ...q,
            y: { __type: 'number', value: found.updates.y, suffix: 'd' }
          };
        }
        return q;
      });

      const newImages = JSON.parse(JSON.stringify(images));
      imageUpdates.forEach(u => {
        if (newImages[u.index]) {
          newImages[u.index].y = { __type: 'number', value: u.updates.y, suffix: 'd' };
        }
      });

      updateState(newQuests, newImages);
      showToast('Elementos distribuidos verticalmente', 'success');
    }
  };

  const handleAutoLayout = (direction: 'LR' | 'TB' = 'LR', onlySelected: boolean = false) => {
    if (!quests || quests.length === 0) return;

    const selectedQuestIds = selection.items
      .filter(item => item.type === 'quest')
      .map(item => String(item.id));

    const targetQuestIds = (onlySelected && selectedQuestIds.length > 1)
      ? selectedQuestIds
      : undefined;

    const result = computeAutoLayout(quests, {
      direction,
      nodeSpacing: 2.0,
      layerSpacing: 2.5,
      targetQuestIds
    });

    if (result.organizedCount === 0) {
      showToast('No hay misiones disponibles para organizar', 'warning');
      return;
    }

    const newQuests = quests.map(q => {
      const newPos = result.positions.get(String(q.id)) || result.positions.get(q.id as any);
      if (newPos) {
        return {
          ...q,
          x: typeof q.x === 'object' && q.x !== null 
            ? { ...q.x, value: newPos.x } 
            : { __type: 'number', value: newPos.x, suffix: 'd' },
          y: typeof q.y === 'object' && q.y !== null 
            ? { ...q.y, value: newPos.y } 
            : { __type: 'number', value: newPos.y, suffix: 'd' }
        };
      }
      return q;
    });

    updateState(newQuests, images);

    const scopeMsg = targetQuestIds ? `${result.organizedCount} misiones seleccionadas` : 'todo el capítulo';
    const dirMsg = direction === 'LR' ? 'Horizontal (Izq ➔ Der)' : 'Vertical (Arriba ➔ Abajo)';
    showToast(`⚡ Auto-organizado ${scopeMsg} en ${result.totalLayers} niveles (${dirMsg})`, 'success');
  };

  const updateSelectedCoordinates = (axis: 'x' | 'y', val: number) => {
    if (isNaN(val)) return;
    
    const questUpdates: { id: string; updates: any }[] = [];
    const imageUpdates: { index: number; updates: any }[] = [];
    
    selection.items.forEach(item => {
      const updates = { [axis]: val };
      if (item.type === 'quest') {
        questUpdates.push({ id: item.id as string, updates });
      } else {
        imageUpdates.push({ index: item.id as number, updates });
      }
    });

    const newQuests = quests.map(q => {
      const found = questUpdates.find(u => u.id === q.id);
      if (found) {
        return {
          ...q,
          x: found.updates.x !== undefined ? { __type: 'number', value: found.updates.x, suffix: 'd' } : q.x,
          y: found.updates.y !== undefined ? { __type: 'number', value: found.updates.y, suffix: 'd' } : q.y
        };
      }
      return q;
    });

    const newImages = JSON.parse(JSON.stringify(images));
    imageUpdates.forEach(u => {
      if (newImages[u.index]) {
        if (u.updates.x !== undefined) newImages[u.index].x = { __type: 'number', value: u.updates.x, suffix: 'd' };
        if (u.updates.y !== undefined) newImages[u.index].y = { __type: 'number', value: u.updates.y, suffix: 'd' };
      }
    });

    updateState(newQuests, newImages);
  };

  return (
    <ErrorBoundary>
      <>
    <div 
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Sidebar Izquierda */}
      <div className="sidebar-left glass-panel">
        <div className="header">
          <h1><MapIcon size={20} className="text-accent" /> FTB Quest Editor</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filename}</p>
          <div className="row">
            <button className="btn btn-secondary btn-full" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Abrir
            </button>
            <input type="file" accept=".snbt" multiple ref={fileInputRef} className="file-input-hidden" onChange={handleFileUpload} />
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsRewardTableModalOpen(true)}
              title="Gestor visual de Tablas de Recompensas (reward_tables / Loot Crates)"
            >
              <span>🎁</span> Tablas ({rewardTables.length})
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsChapterGroupModalOpen(true)}
              title="Gestor visual de Grupos de Capítulos (chapter_groups.snbt)"
            >
              <span>📁</span> Grupos ({chapterGroups.length})
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 6px', fontSize: '0.72rem', gap: '4px', justifyContent: 'center' }}
              onClick={() => setIsAnalyticsModalOpen(true)}
              title="Tablero de Balance y Estadísticas del Modpack (Analytics Dashboard)"
            >
              <span>📊</span> Balance
            </button>
          </div>
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
                <span>👁️</span> Jugador
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

      {/* Columna Central: Pestañas de Capítulos + Canvas / Vista de Tabla */}
      <div className="main-viewport-column">
        {tabs.length > 0 && (
          <ChapterTabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewBlankTab={handleNewBlankTab}
            onOpenFiles={() => fileInputRef.current?.click()}
            onExportActive={handleExport}
            onExportAll={handleExportAll}
            onExportZip={handleExportZip}
          />
        )}

        {!snbtData ? (
          <div className="canvas-container">
            <div className="empty-state">
              <MapIcon size={48} opacity={0.5} />
              <h2>Carga uno o varios archivos .snbt para empezar</h2>
              <p>Arrastra archivos .snbt aquí o haz clic en "Abrir" para comenzar.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Abrir Archivo(s)
                </button>
                <button className="btn btn-primary" onClick={handleNewBlankTab}>
                  <Plus size={16} /> Nuevo Capítulo
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="canvas-container" style={{ position: 'relative', flex: 1 }}>
            <EditorCanvas 
              key={activeTabId}
              quests={quests}
              images={images}
              layersVisible={layers}
              selection={selection}
              setSelection={setSelection}
              updateQuest={updateQuest}
              updateImage={updateImage}
              updateQuestsAndImages={updateQuestsAndImages}
              onPointerPosChange={(pos) => mouseCanvasPosRef.current = pos}
              onQuestContextMenu={handleQuestContextMenu}
              visibleZLevels={visibleZLevels}
              isPinnedDrawerOpen={isPinnedDrawerOpen}
              setIsPinnedDrawerOpen={setIsPinnedDrawerOpen}
              pinnedCount={pinnedAssets.length}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              snapMode={snapMode}
              setSnapMode={setSnapMode}
              lockedKeys={lockedKeys}
              onConnectQuests={handleConnectQuests}
              cycleNodeIds={graphValidation.cycleNodeIds}
              brokenDepQuestIds={graphValidation.brokenDepQuestIds}
              onAutoLayout={handleAutoLayout}
              initialStagePos={currentCameraRef.current.pos}
              initialStageScale={currentCameraRef.current.scale}
              onCameraChange={(pos, scale) => {
                currentCameraRef.current = { pos, scale };
              }}
              connectionLineStyle={connectionLineStyle}
              setConnectionLineStyle={handleConnectionLineStyleChange}
              totalOpenTabsCount={tabs.length}
              onBatchReplace={handleBatchReplace}
              onReplaceSingle={handleReplaceSingle}
              isPlayerMode={isPlayerMode}
              setIsPlayerMode={setIsPlayerMode}
              playerCompletedQuestIds={playerCompletedQuestIds}
              onTogglePlayerQuestCompletion={handleTogglePlayerQuestCompletion}
              onResetPlayerProgress={handleResetPlayerProgress}
              onCompleteAllPlayerQuests={handleCompleteAllPlayerQuests}
            />

            {/* Cajón deslizable (Drawer) del Portapapeles */}
            {isPinnedDrawerOpen && (
              <div className="pinned-assets-drawer">
                <div className="pinned-assets-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pin size={18} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Prefabs Anclados</h3>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', height: 'auto' }}
                    onClick={() => setIsPinnedDrawerOpen(false)}
                    title="Cerrar cajón"
                  >
                    ✕
                  </button>
                </div>

                <div className="pinned-assets-list">
                  {pinnedAssets.length === 0 ? (
                    <div className="pinned-empty">
                      <p>No tienes elementos anclados todavía.</p>
                      <small>Selecciona misiones o decoraciones y presiona "📌 Anclar al Portapapeles" en el menú contextual o en el inspector.</small>
                    </div>
                  ) : (
                    pinnedAssets.map((asset) => {
                      let typeLabel = 'Mixto';
                      let typeClass = 'mixed';
                      if (asset.quests.length === 1 && asset.images.length === 0) {
                        typeLabel = 'Misión';
                        typeClass = 'quest';
                      } else if (asset.quests.length === 0 && asset.images.length === 1) {
                        typeLabel = 'Imagen';
                        typeClass = 'image';
                      }

                      return (
                        <div key={asset.id} className="pinned-asset-card">
                          <div className="pinned-asset-meta">
                            <span className={`pinned-asset-type-badge ${typeClass}`}>
                              {typeLabel}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              {new Date(asset.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="pinned-asset-name">{asset.title}</h4>
                          {asset.quests.length > 0 && asset.quests.map((q: any) => (
                            <p key={q.id} className="pinned-asset-detail">
                              🔹 Misión: {getDValue(q.title) || q.id}
                            </p>
                          ))}
                          {asset.images.length > 0 && asset.images.map((img: any, idx: number) => (
                            <p key={idx} className="pinned-asset-detail">
                              🖼️ Imagen: {img.image ? img.image.substring(img.image.lastIndexOf('/') + 1) : 'Decoración'}
                            </p>
                          ))}
                          
                          <div className="pinned-asset-actions">
                            <button 
                              className="pinned-asset-btn-paste"
                              onClick={() => pastePinnedAsset(asset)}
                              title="Pegar este activo en el centro del mapa"
                            >
                              📋 Pegar
                            </button>
                            <button 
                              className="pinned-asset-btn-delete"
                              onClick={() => {
                                const nextAssets = pinnedAssets.filter((a) => a.id !== asset.id);
                                savePinnedAssets(nextAssets);
                              }}
                              title="Desanclar elemento"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <TableView 
            quests={quests}
            images={images}
            updateQuest={updateQuest}
            updateImage={updateImage}
            onOpenNbtEditor={(title, value, onSave) => setNbtEditor({ title, value: JSON.stringify(value, null, 2), onSave })}
          />
        )}
      </div>

      {/* Sidebar Derecha - Propiedades */}
      {viewMode === 'map' && !isRightSidebarCollapsed && (
        <div 
          className="sidebar-right glass-panel"
          style={{
            width: `${rightSidebarWidth}px`,
            minWidth: `${rightSidebarWidth}px`,
            maxWidth: `${rightSidebarWidth}px`,
            position: 'relative',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            transition: isResizingRightSidebar ? 'none' : 'width 0.15s ease'
          }}
        >
          {/* Asa de redimensionamiento izquierda */}
          <div
            className={`sidebar-resize-handle ${isResizingRightSidebar ? 'active' : ''}`}
            onMouseDown={startResizingRightSidebar}
            title="Arrastra para ajustar el ancho del panel lateral"
          />

          <div className="sidebar-right-header">
            <h1>
              <Settings size={17} className="text-accent" />
              <span>Propiedades</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {rightSidebarWidth !== 320 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRightSidebarWidth(320);
                    localStorage.setItem('ftb_right_sidebar_width', '320');
                  }}
                  title="Restablecer al ancho vanilla original (320px)"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>320px</span>
                </button>
              )}
              <button
                className="btn-icon"
                onClick={() => setIsRightSidebarCollapsed(true)}
                title="Colapsar panel lateral de propiedades"
                style={{ padding: '4px', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        <div className="content-section">
          {selection.items.length > 1 && (
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="section-title">Alinear Selección ({selection.items.length} elementos)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('left')} title="Alinear bordes izquierdos (Izquierda)">
                  <AlignStartVertical size={18} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('center')} title="Alinear centros horizontales (Centro)">
                  <AlignCenterVertical size={18} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('right')} title="Alinear bordes derechos (Derecha)">
                  <AlignEndVertical size={18} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('top')} title="Alinear bordes superiores (Arriba)">
                  <AlignStartHorizontal size={18} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('middle')} title="Alinear centros verticales (Al medio)">
                  <AlignCenterHorizontal size={18} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => alignSelectedItems('bottom')} title="Alinear bordes inferiores (Abajo)">
                  <AlignEndHorizontal size={18} />
                </button>
              </div>

              {/* Botones de Distribución Equidistante */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }} 
                  onClick={() => distributeSelectedItems('horizontal')} 
                  disabled={selection.items.length < 3}
                  title={selection.items.length < 3 ? "Selecciona al menos 3 elementos para distribuir" : "Distribuir horizontalmente con espaciado uniforme"}
                >
                  <AlignHorizontalDistributeCenter size={16} /> Distribuir X
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }} 
                  onClick={() => distributeSelectedItems('vertical')} 
                  disabled={selection.items.length < 3}
                  title={selection.items.length < 3 ? "Selecciona al menos 3 elementos para distribuir" : "Distribuir verticalmente con espaciado uniforme"}
                >
                  <AlignVerticalDistributeCenter size={16} /> Distribuir Y
                </button>
              </div>

              {/* Botones de acción rápida en lote: Duplicar y Bloquear */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  onClick={duplicateSelection}
                  title="Duplicar selección (Ctrl+D)"
                >
                  <Copy size={15} /> Duplicar
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  onClick={toggleLockSelected}
                  title="Bloquear / Desbloquear selección para evitar movimientos accidentales"
                >
                  {selection.items.every(item => lockedKeys.includes(item.type === 'quest' ? `quest-${item.id}` : `img-${item.id}`)) ? (
                    <><Unlock size={15} /> Desbloquear</>
                  ) : (
                    <><Lock size={15} /> Bloquear</>
                  )}
                </button>
              </div>

              {/* Botones de Auto-Organizar Selección */}
              {selection.items.filter(i => i.type === 'quest').length > 1 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Árbol de Dependencias
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                      onClick={() => handleAutoLayout('LR', true)}
                      title="Auto-organizar las misiones seleccionadas horizontalmente por dependencias"
                    >
                      <Sparkles size={14} className="text-accent" /> Árbol H
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                      onClick={() => handleAutoLayout('TB', true)}
                      title="Auto-organizar las misiones seleccionadas verticalmente por dependencias"
                    >
                      <Sparkles size={14} className="text-accent" /> Árbol V
                    </button>
                  </div>
                </div>
              )}

              {/* Coordenadas comunes masivas */}
              {(() => {
                const firstItemX = getItemX(selection.items[0], quests, images);
                const shareSameX = selection.items.every(item => getItemX(item, quests, images) === firstItemX);
                
                const firstItemY = getItemY(selection.items[0], quests, images);
                const shareSameY = selection.items.every(item => getItemY(item, quests, images) === firstItemY);

                return (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Coordenadas del Grupo</h3>
                    <div className="row">
                      <div className="input-group">
                        <label>X Común</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameX ? "" : "Mixto"}
                          value={shareSameX ? firstItemX : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateSelectedCoordinates('x', val);
                            }
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label>Y Común</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameY ? "" : "Mixto"}
                          value={shareSameY ? firstItemY : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateSelectedCoordinates('y', val);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Propiedades comunes de Misiones masivas */}
              {(() => {
                const selectedQuests = selection.items.filter(item => item.type === 'quest');
                if (selectedQuests.length === 0) return null;

                const firstQuestObj = quests.find(q => q && q.id === selectedQuests[0].id);

                // Icono / Imagen común
                const firstIcon = firstQuestObj?.icon || '';
                const shareSameIcon = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (q?.icon || '') === firstIcon;
                });

                // Forma (Shape) común
                const firstShapeVal = firstQuestObj?.shape || 'default';
                const shareSameShape = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (q?.shape || 'default') === firstShapeVal;
                });

                // Tamaño común
                const firstSize = getDValue(firstQuestObj?.size) ?? 1.0;
                const shareSameSize = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (getDValue(q?.size) ?? 1.0) === firstSize;
                });

                // Ocultar hasta completar dependencias común
                const firstHideDeps = firstQuestObj?.hide_until_deps_complete;
                const shareSameHideDeps = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return q?.hide_until_deps_complete === firstHideDeps;
                });

                return (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                      Propiedades de las Misiones ({selectedQuests.length})
                    </h3>

                    {/* Icono / Imagen común */}
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Icono / Imagen común</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder={shareSameIcon ? "ej. minecraft:apple" : "Mixto"}
                          value={shareSameIcon ? (firstIcon || '') : ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatesList = selectedQuests.map(item => ({
                              id: item.id as string,
                              updates: { icon: val.trim() ? val : undefined }
                            }));
                            updateQuest(updatesList);
                          }}
                        />
                        <button 
                          className="btn-icon" 
                          style={{ padding: '6px', color: 'var(--text-secondary)' }}
                          onClick={() => setTexturePicker({
                            isOpen: true,
                            targetType: 'icon',
                            title: 'Asignar Icono a Misiones Seleccionadas',
                            onSelect: (val) => {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { icon: val.trim() ? val : undefined }
                              }));
                              updateQuest(updatesList);
                            }
                          })}
                          title="Explorar texturas en catálogo"
                        >
                          <Search size={16} />
                        </button>
                        {shareSameIcon && firstIcon && (
                          <button 
                            className="btn-icon" 
                            style={{ padding: '6px', color: 'var(--text-secondary)' }}
                            onClick={() => {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { icon: undefined }
                              }));
                              updateQuest(updatesList);
                            }}
                            title="Quitar icono de todas las misiones seleccionadas"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      {/* Forma (Shape) Común */}
                      <div className="input-group">
                        <label>Forma (Shape)</label>
                        <select 
                          className="input-field" 
                          value={shareSameShape ? firstShapeVal : 'mixed'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'mixed') return;
                            const nextShape = val === 'default' ? undefined : val;
                            const updatesList = selectedQuests.map(item => ({
                              id: item.id as string,
                              updates: { shape: nextShape }
                            }));
                            updateQuest(updatesList);
                          }}
                        >
                          {!shareSameShape && <option value="mixed">-- Mixto --</option>}
                          <option value="default">Por Defecto (Heredar)</option>
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                          <option value="rsquare">Rounded Square</option>
                          <option value="gear">Gear</option>
                          <option value="octagon">Octagon</option>
                          <option value="diamond">Diamond</option>
                          <option value="hexagon">Hexagon</option>
                          <option value="pentagon">Pentagon</option>
                          <option value="heart">Heart</option>
                        </select>
                      </div>

                      {/* Tamaño Común */}
                      <div className="input-group">
                        <label>Tamaño (Size)</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameSize ? "" : "Mixto"}
                          value={shareSameSize ? firstSize : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { size: { __type: 'number', value: val, suffix: 'd' } }
                              }));
                              updateQuest(updatesList);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Ocultar hasta completar dependencias Común */}
                    <div className="input-group" style={{ marginTop: '10px' }}>
                      <label>Ocultar hasta completar dependencias</label>
                      <select 
                        className="input-field"
                        value={!shareSameHideDeps ? 'mixed' : (firstHideDeps === undefined ? 'default' : (firstHideDeps ? 'true' : 'false'))}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'mixed') return;
                          const nextVal = val === 'default' ? undefined : (val === 'true');
                          const updatesList = selectedQuests.map(item => ({
                            id: item.id as string,
                            updates: { hide_until_deps_complete: nextVal }
                          }));
                          updateQuest(updatesList);
                        }}
                      >
                        {!shareSameHideDeps && <option value="mixed">-- Mixto --</option>}
                        <option value="default">Por Defecto (Heredar)</option>
                        <option value="true">Sí (Ocultar)</option>
                        <option value="false">No (Mostrar)</option>
                      </select>
                    </div>
                  </div>
                );
              })()}


              {(() => {
                const selectedImages = selection.items.filter(item => item.type === 'image');
                if (selectedImages.length === 0) return null;
                
                const firstImgColor = images[selectedImages[0].id as number]?.color;
                const shareSameColor = selectedImages.every(
                  img => images[img.id as number]?.color === firstImgColor
                );
                const displayColor = shareSameColor ? decimalToHexColor(firstImgColor) : '#ffffff';

                const firstImgPath = images[selectedImages[0].id as number]?.image;
                const shareSamePath = selectedImages.every(img => images[img.id as number]?.image === firstImgPath);

                const firstImgWidth = getDValue(images[selectedImages[0].id as number]?.width);
                const shareSameWidth = selectedImages.every(img => getDValue(images[img.id as number]?.width) === firstImgWidth);

                const firstImgHeight = getDValue(images[selectedImages[0].id as number]?.height);
                const shareSameHeight = selectedImages.every(img => getDValue(images[img.id as number]?.height) === firstImgHeight);

                const firstImgRot = getDValue(images[selectedImages[0].id as number]?.rotation) ?? 0;
                const shareSameRot = selectedImages.every(img => (getDValue(images[img.id as number]?.rotation) ?? 0) === firstImgRot);

                const firstImgAlpha = getDValue(images[selectedImages[0].id as number]?.alpha) ?? 255;
                const shareSameAlpha = selectedImages.every(img => (getDValue(images[img.id as number]?.alpha) ?? 255) === firstImgAlpha);

                const firstImgOrder = getDValue(images[selectedImages[0].id as number]?.order) ?? 1;
                const shareSameOrder = selectedImages.every(img => (getDValue(images[img.id as number]?.order) ?? 1) === firstImgOrder);

                return (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Propiedades de las Imágenes ({selectedImages.length})</h3>
                    
                    <div className="input-group">
                      <label>Textura común</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder={shareSamePath ? "" : "Mixto"}
                        value={shareSamePath ? (firstImgPath || '') : ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const updatesList = selectedImages.map(img => ({
                            index: img.id as number,
                            updates: { image: val }
                          }));
                          updateImage(updatesList);
                        }}
                      />
                    </div>

                    <div className="row" style={{ marginTop: '10px' }}>
                      <div className="input-group">
                        <label>Ancho común (Width)</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameWidth ? "" : "Mixto"}
                          value={shareSameWidth ? (firstImgWidth ?? 2) : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const updatesList = selectedImages.map(img => ({
                                index: img.id as number,
                                updates: { width: val }
                              }));
                              updateImage(updatesList);
                            }
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label>Alto común (Height)</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameHeight ? "" : "Mixto"}
                          value={shareSameHeight ? (firstImgHeight ?? 2) : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const updatesList = selectedImages.map(img => ({
                                index: img.id as number,
                                updates: { height: val }
                              }));
                              updateImage(updatesList);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="row" style={{ marginTop: '10px' }}>
                      <div className="input-group">
                        <label>Rotación común</label>
                        <input 
                          type="number" 
                          step="5" 
                          className="input-field" 
                          placeholder={shareSameRot ? "" : "Mixto"}
                          value={shareSameRot ? firstImgRot : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const updatesList = selectedImages.map(img => ({
                                index: img.id as number,
                                updates: { rotation: val }
                              }));
                              updateImage(updatesList);
                            }
                          }}
                        />
                      </div>
                      <div className="input-group">
                        <label>Opacidad común</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="255" 
                          className="input-field" 
                          placeholder={shareSameAlpha ? "" : "Mixto"}
                          value={shareSameAlpha ? firstImgAlpha : ''} 
                          onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                              val = Math.max(0, Math.min(255, val));
                              const updatesList = selectedImages.map(img => ({
                                index: img.id as number,
                                updates: { alpha: val }
                              }));
                              updateImage(updatesList);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="input-group" style={{ marginTop: '10px', marginBottom: '15px' }}>
                      <label>Order común (Z-Index)</label>
                      <input 
                        type="number" 
                        step="1" 
                        className="input-field" 
                        placeholder={shareSameOrder ? "" : "Mixto"}
                        value={shareSameOrder ? firstImgOrder : ''} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            const updatesList = selectedImages.map(img => ({
                              index: img.id as number,
                              updates: { order: val }
                            }));
                            updateImage(updatesList);
                          }
                        }}
                      />
                    </div>

                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Color común
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        className="color-picker-input" 
                        value={displayColor}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const dec = hexColorToDecimal(hex);
                          const updatesList = selectedImages.map(img => ({
                            index: img.id as number,
                            updates: { color: dec }
                          }));
                          updateImage(updatesList);
                        }}
                      />
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                        placeholder={shareSameColor ? "" : "Mixto"}
                        value={shareSameColor ? displayColor : ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith('#')) val = '#' + val;
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            const dec = hexColorToDecimal(val);
                            const updatesList = selectedImages.map(img => ({
                              index: img.id as number,
                              updates: { color: dec }
                            }));
                            updateImage(updatesList);
                          }
                        }}
                      />
                      <button 
                        className="btn-icon" 
                        title="Quitar color a todas" 
                        onClick={() => {
                          const newImages = JSON.parse(JSON.stringify(images));
                          selectedImages.forEach(img => {
                            const imgIndex = img.id as number;
                            if (newImages[imgIndex]) {
                              delete newImages[imgIndex].color;
                            }
                          });
                          updateState(quests, newImages);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginBottom: '8px' }} 
                  onClick={pinSelectionToClipboard}
                >
                  📌 Anclar Selección al Portapapeles
                </button>
                {selection.items.some(item => item.type === 'quest') && (
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 179, 71, 0.15)', color: '#ffb347', border: '1px solid rgba(255, 179, 71, 0.25)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginBottom: '8px' }} 
                    onClick={clearSelectedDependencies}
                    title="Borra todas las dependencias de ida y vuelta para las misiones seleccionadas"
                  >
                    <span>🔓</span> Quitar todas las dependencias
                  </button>
                )}
                {selection.items.some(item => item.type === 'image') && (
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={deleteSelectedImages}
                  >
                    <Trash2 size={14} /> Eliminar Imágenes Seleccionadas
                  </button>
                )}
                {selection.items.some(item => item.type === 'quest') && (
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={deleteSelectedQuests}
                  >
                    <Trash2 size={14} /> Eliminar Misiones Seleccionadas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inspector de Conexión de Dependencia */}
          {selection.type === 'dependency' && selection.dependency && (() => {
            const { sourceId, targetId } = selection.dependency!;
            const sourceQ = quests.find(q => q.id === sourceId);
            const targetQ = quests.find(q => q.id === targetId);

            const sourceTitle = String(getDValue(sourceQ?.title) || sourceQ?.id || sourceId);
            const targetTitle = String(getDValue(targetQ?.title) || targetQ?.id || targetId);

            const isHiddenInGame = targetQ?.hide_dependency_lines === true;
            const minReq = targetQ?.min_required_dependencies !== undefined ? Number(getDValue(targetQ.min_required_dependencies)) : 0;
            const depReq = String(targetQ?.dependency_requirement || 'all_completed');
            const totalDepsCount = Array.isArray(targetQ?.dependencies) ? targetQ.dependencies.length : (targetQ?.dependencies ? 1 : 0);

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={18} className="text-accent" /> Conexión de Dependencia
                  </h2>
                  <button
                    className="btn-icon"
                    onClick={deleteSelectedDependency}
                    title="Eliminar esta dependencia (Delete / Supr)"
                    style={{ padding: '6px', color: '#f38ba8' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Tarjeta de flujo origen -> destino */}
                <div className="dependency-inspector-card">
                  <div className="dependency-flow-row">
                    <div 
                      className="dependency-node-box"
                      style={{ cursor: 'pointer' }}
                      title="Clic para seleccionar la misión origen"
                      onClick={() => {
                        if (sourceQ) {
                          setSelection({
                            type: 'quest',
                            id: sourceQ.id,
                            ids: [sourceQ.id],
                            items: [{ type: 'quest', id: sourceQ.id }]
                          });
                        }
                      }}
                    >
                      <span className="dependency-node-role source">Origen (Requisito)</span>
                      <span className="dependency-node-title">{sourceTitle}</span>
                      <span className="dependency-node-id">#{sourceId}</span>
                    </div>

                    <div className="dependency-flow-arrow" title="Flujo de dependencia">
                      ➔
                    </div>

                    <div 
                      className="dependency-node-box"
                      style={{ cursor: 'pointer' }}
                      title="Clic para seleccionar la misión destino"
                      onClick={() => {
                        if (targetQ) {
                          setSelection({
                            type: 'quest',
                            id: targetQ.id,
                            ids: [targetQ.id],
                            items: [{ type: 'quest', id: targetQ.id }]
                          });
                        }
                      }}
                    >
                      <span className="dependency-node-role target">Destino (Desbloqueada)</span>
                      <span className="dependency-node-title">{targetTitle}</span>
                      <span className="dependency-node-id">#{targetId}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                    onClick={invertSelectedDependency}
                    title="Invertir la dirección de la dependencia entre ambas misiones"
                  >
                    <RotateCcw size={14} /> Invertir Dirección de Flecha
                  </button>
                </div>

                {/* Opciones de Cable y Comportamiento en FTB Quests */}
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Propiedades de Desbloqueo (Misión Destino)
                </h3>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isHiddenInGame}
                      onChange={(e) => {
                        if (targetQ) {
                          updateQuest(targetId, {
                            hide_dependency_lines: e.target.checked ? true : undefined
                          });
                        }
                      }}
                      style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }}
                    />
                    <span>Ocultar cable en el juego (<code>hide_dependency_lines</code>)</span>
                  </label>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginLeft: '24px' }}>
                    Si se marca, el cable se verá atenuado y punteado en el lienzo y no se dibujará en la interfaz de FTB Quests dentro de Minecraft.
                  </small>
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label>Criterio de Desbloqueo (<code>dependency_requirement</code>)</label>
                  <select
                    className="input-field"
                    value={depReq}
                    onChange={(e) => {
                      if (targetQ) {
                        updateQuest(targetId, {
                          dependency_requirement: e.target.value === 'all_completed' ? undefined : e.target.value
                        });
                      }
                    }}
                  >
                    <option value="all_completed">Todas las dependencias completadas (default)</option>
                    <option value="one_completed">Al menos una dependencia completada</option>
                    <option value="all_started">Todas las dependencias iniciadas</option>
                    <option value="one_started">Al menos una dependencia iniciada</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Mínimo de Dependencias Requeridas (<code>min_required_dependencies</code>)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(1, totalDepsCount)}
                      className="input-field"
                      value={minReq}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (targetQ) {
                          updateQuest(targetId, {
                            min_required_dependencies: isNaN(val) || val <= 0 ? undefined : val
                          });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      de {totalDepsCount} total{totalDepsCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    0 = se requieren todas. Si pones ej. 1, con cumplir cualquiera de sus {totalDepsCount} dependencias se desbloqueará.
                  </small>
                </div>

                {/* Selector de Estilo Visual de Cables */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Estilo de Conexión en el Lienzo
                  </label>
                  <div className="connection-style-group">
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'bezier' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('bezier')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>〰️</span>
                      <span>Curva Bezier</span>
                    </button>
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'straight' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('straight')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>➔</span>
                      <span>Recta Directa</span>
                    </button>
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'orthogonal' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('orthogonal')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>⤷</span>
                      <span>Ortogonal</span>
                    </button>
                  </div>
                </div>

                {/* Botón para eliminar conexión */}
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={deleteSelectedDependency}
                  >
                    <Trash2 size={14} /> Eliminar Esta Dependencia
                  </button>
                </div>
              </div>
            );
          })()}

          {selection.type !== 'dependency' && selection.items.length === 0 && (
            snbtData ? (
              <div>
                <h2 className="section-title">Propiedades del Capítulo</h2>
                
                <div className="input-group">
                  <label>Título</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={getDValue(snbtData.title) || ''}
                    onChange={(e) => {
                      const updated = { ...snbtData, title: e.target.value };
                      updateState(quests, images, false, updated);
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>ID del Capítulo</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={getDValue(snbtData.id) || ''}
                    onChange={(e) => {
                      const updated = { ...snbtData, id: e.target.value };
                      updateState(quests, images, false, updated);
                    }}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Grupo de Capítulos</label>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ fontSize: '0.72rem', padding: '2px 6px', gap: '3px', display: 'flex', alignItems: 'center', color: 'var(--accent-color)' }}
                      onClick={() => setIsChapterGroupModalOpen(true)}
                      title="Abrir gestor visual de grupos"
                    >
                      <span>📁</span> Gestionar
                    </button>
                  </div>
                  <select 
                    className="input-field"
                    value={getDValue(snbtData.group) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...snbtData };
                      if (val === '') {
                        delete updated.group;
                      } else {
                        updated.group = val;
                      }
                      updateState(quests, images, false, updated);
                    }}
                  >
                    <option value="">(Sin Grupo / Raíz)</option>
                    {chapterGroups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        📁 {grp.title} ({grp.id.slice(0, 8)}...)
                      </option>
                    ))}
                    {snbtData.group && !chapterGroups.some(g => g.id === getDValue(snbtData.group)) && (
                      <option value={getDValue(snbtData.group)}>
                        ❓ Personalizado: {getDValue(snbtData.group)}
                      </option>
                    )}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', width: '100%', minWidth: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Hex ID:</span>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ fontSize: '0.75rem', padding: '2px 6px', fontFamily: 'monospace', height: '24px', flex: 1, minWidth: 0 }}
                      placeholder="Vacío o Hex (ej. 7E48F1A2D091B3C4)"
                      value={getDValue(snbtData.group) || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const updated = { ...snbtData };
                        if (val === '') {
                          delete updated.group;
                        } else {
                          updated.group = val;
                        }
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="input-group">
                    <label>Order Index</label>
                    <input 
                      type="number" 
                      className="input-field"
                      value={getDValue(snbtData.order_index) ?? 0}
                      onChange={(e) => {
                        const updated = { ...snbtData, order_index: parseInt(e.target.value) || 0 };
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label>Autofocus ID</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={getDValue(snbtData.autofocus_id) || ''}
                      onChange={(e) => {
                        const updated = { ...snbtData, autofocus_id: e.target.value };
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Forma de Misión por Defecto</label>
                  <select 
                    className="input-field"
                    value={getDValue(snbtData.default_quest_shape) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...snbtData };
                      if (val === '') {
                        delete updated.default_quest_shape;
                      } else {
                        updated.default_quest_shape = val;
                      }
                      updateState(quests, images, false, updated);
                    }}
                  >
                    <option value="">Por defecto (Círculo)</option>
                    <option value="circle">Círculo</option>
                    <option value="square">Cuadrado</option>
                    <option value="diamond">Diamante</option>
                    <option value="hexagon">Hexágono</option>
                    <option value="octagon">Octágono</option>
                    <option value="gear">Engranaje</option>
                    <option value="heart">Corazón</option>
                  </select>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.default_hide_dependency_lines === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, default_hide_dependency_lines: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Ocultar líneas de dependencia por defecto
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.hide_quest_until_deps_complete === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, hide_quest_until_deps_complete: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Ocultar misiones hasta completar dependencias
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.always_invisible === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, always_invisible: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Siempre invisible
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.disable_toast === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, disable_toast: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Desactivar Toasts
                  </label>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Carga un archivo .snbt para ver sus propiedades.</p>
              </div>
            )
          )}
          
          {selection.type === 'image' && selection.items.length === 1 && selection.id !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Imagen Seleccionada</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn-icon ${lockedKeys.includes(`img-${selection.id}`) ? 'active' : ''}`}
                    onClick={() => toggleLock(`img-${selection.id}`)}
                    title={lockedKeys.includes(`img-${selection.id}`) ? "Desbloquear imagen" : "Bloquear imagen"}
                    style={{ padding: '6px', color: lockedKeys.includes(`img-${selection.id}`) ? '#f38ba8' : 'var(--text-secondary)' }}
                  >
                    {lockedKeys.includes(`img-${selection.id}`) ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={duplicateSelection}
                    title="Duplicar imagen (Ctrl+D)"
                    style={{ padding: '6px', color: 'var(--text-secondary)' }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Textura (URL/Path)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="input-field" 
                    value={images[selection.id as number]?.image || ''} 
                    onChange={(e) => updateImage(selection.id as number, { image: e.target.value })}
                  />
                  <button 
                    className="btn-icon" 
                    title="Explorar texturas en catálogo" 
                    onClick={() => setTexturePicker({
                      isOpen: true,
                      targetType: 'image',
                      title: 'Seleccionar Imagen de Fondo',
                      onSelect: (val) => updateImage(selection.id as number, { image: val })
                    })}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
              <div className="row">
                <div className="input-group">
                  <label>X</label>
                  <input type="number" step="0.5" className="input-field" 
                    value={images[selection.id as number]?.x?.value ?? 0} 
                    onChange={(e) => updateImage(selection.id as number, { x: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Y</label>
                  <input type="number" step="0.5" className="input-field" 
                    value={images[selection.id as number]?.y?.value ?? 0} 
                    onChange={(e) => updateImage(selection.id as number, { y: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="row">
                <div className="input-group">
                  <label>Width</label>
                  <input type="number" step="0.5" className="input-field" 
                    value={images[selection.id as number]?.width?.value ?? 2} 
                    onChange={(e) => updateImage(selection.id as number, { width: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Height</label>
                  <input type="number" step="0.5" className="input-field" 
                    value={images[selection.id as number]?.height?.value ?? 2} 
                    onChange={(e) => updateImage(selection.id as number, { height: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="row">
                <div className="input-group">
                  <label>Rotación (Grados)</label>
                  <input type="number" step="5" className="input-field" 
                    value={images[selection.id as number]?.rotation?.value ?? images[selection.id as number]?.rotation ?? 0} 
                    onChange={(e) => updateImage(selection.id as number, { rotation: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Opacidad (Alpha 0-255)</label>
                  <input type="number" min="0" max="255" className="input-field" 
                    value={images[selection.id as number]?.alpha?.value ?? images[selection.id as number]?.alpha ?? 255} 
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 255;
                      val = Math.max(0, Math.min(255, val));
                      updateImage(selection.id as number, { alpha: val });
                    }}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Order (Capa/Z-Index)</label>
                <input type="number" step="1" className="input-field" 
                  value={images[selection.id as number]?.order?.value ?? images[selection.id as number]?.order ?? 1} 
                  onChange={(e) => updateImage(selection.id as number, { order: parseInt(e.target.value) })}
                />
              </div>
              <div className="input-group">
                <label>Color de Recolorización</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" className="color-picker-input" 
                    value={decimalToHexColor(images[selection.id as number]?.color)} 
                    onChange={(e) => updateImage(selection.id as number, { color: hexColorToDecimal(e.target.value) })}
                  />
                  <input type="text" className="input-field" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                    value={decimalToHexColor(images[selection.id as number]?.color)} 
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        updateImage(selection.id as number, { color: hexColorToDecimal(val) });
                      }
                    }}
                  />
                  {images[selection.id as number]?.color !== undefined && (
                    <button className="btn-icon" title="Quitar Color" onClick={() => {
                      const imgIndex = selection.id as number;
                      const newImages = [...images];
                      delete newImages[imgIndex].color;
                      setImages(newImages);
                    }}><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
              
              {/* Delete Image Section */}
              <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                  onClick={pinSelectionToClipboard}
                >
                  📌 Anclar al Portapapeles
                </button>
                <button 
                  className="btn-icon" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px' }} 
                  onClick={deleteSelectedImages}
                >
                  <Trash2 size={16} /> Eliminar Imagen
                </button>
              </div>
            </div>
          )}

          {selection.type === 'quest' && selection.items.length === 1 && selection.id !== null && (() => {
            const selectedQuest = quests.find(q => q && q.id === selection.id);
            if (!selectedQuest) return <div className="empty-state"><p>Misión no encontrada.</p></div>;

            // Asegurar que tasks y rewards sean arrays (el parser SNBT podría devolver un objeto si solo hay un elemento sin corchetes)
            const tasksArray = Array.isArray(selectedQuest.tasks) ? selectedQuest.tasks : (selectedQuest.tasks ? [selectedQuest.tasks] : []);
            const rewardsArray = Array.isArray(selectedQuest.rewards) ? selectedQuest.rewards : (selectedQuest.rewards ? [selectedQuest.rewards] : []);

            // Normalizar dependencias de la misión actual
            const deps = Array.isArray(selectedQuest.dependencies) ? selectedQuest.dependencies : (selectedQuest.dependencies ? [selectedQuest.dependencies] : []);
            const normalizedDeps = deps.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
            const availableQuestsToAdd = quests.filter(q => 
              q && q.id && q.id !== selectedQuest.id && 
              !normalizedDeps.includes(q.id)
            ).sort((a, b) => {
              const titleA = String(getDValue(a.title) || a.id || '');
              const titleB = String(getDValue(b.title) || b.id || '');
              return titleA.localeCompare(titleB);
            });

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Misión Seleccionada</h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`btn-icon ${lockedKeys.includes(`quest-${selection.id}`) ? 'active' : ''}`}
                      onClick={() => toggleLock(`quest-${selection.id}`)}
                      title={lockedKeys.includes(`quest-${selection.id}`) ? "Desbloquear misión" : "Bloquear misión"}
                      style={{ padding: '6px', color: lockedKeys.includes(`quest-${selection.id}`) ? '#f38ba8' : 'var(--text-secondary)' }}
                    >
                      {lockedKeys.includes(`quest-${selection.id}`) ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={duplicateSelection}
                      title="Duplicar misión (Ctrl+D)"
                      style={{ padding: '6px', color: 'var(--text-secondary)' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>ID</label>
                  <input type="text" className="input-field" readOnly value={selection.id as string} />
                </div>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Título</label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Minecraft (&6, &a, &l...)</span>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={titleInputRef}
                    value={String(getDValue(selectedQuest.title) ?? '')}
                    onChange={(val) => {
                      if (typeof selectedQuest.title === 'object' && selectedQuest.title !== null) {
                        updateQuest(selection.id as string, { title: { ...selectedQuest.title, value: val } });
                      } else {
                        updateQuest(selection.id as string, { title: val });
                      }
                    }}
                  />
                  <input
                    ref={titleInputRef}
                    type="text"
                    className="input-field" 
                    value={getDValue(selectedQuest.title) ?? ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (typeof selectedQuest.title === 'object' && selectedQuest.title !== null) {
                        updateQuest(selection.id as string, { title: { ...selectedQuest.title, value: val } });
                      } else {
                        updateQuest(selection.id as string, { title: val });
                      }
                    }}
                  />
                  <MinecraftFormattedPreview
                    text={String(getDValue(selectedQuest.title) ?? '')}
                    label="Vista Previa Título"
                    defaultColor="#FFFFFF"
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Subtítulo</label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Opcional</span>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={subtitleInputRef}
                    value={String(selectedQuest.subtitle ?? '')}
                    onChange={(val) => {
                      updateQuest(selection.id as string, { subtitle: val ? val : undefined });
                    }}
                  />
                  <input
                    ref={subtitleInputRef}
                    type="text"
                    className="input-field"
                    placeholder="Texto secundario o pista de la misión..."
                    value={String(selectedQuest.subtitle ?? '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateQuest(selection.id as string, { subtitle: val ? val : undefined });
                    }}
                  />
                  {selectedQuest.subtitle && (
                    <MinecraftFormattedPreview
                      text={String(selectedQuest.subtitle)}
                      label="Vista Previa Subtítulo"
                      defaultColor="#AAAAAA"
                    />
                  )}
                </div>

                <div className="input-group">
                  <label>Ícono (Item/Ruta)</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="text" className="input-field" 
                      value={typeof selectedQuest.icon === 'string' ? selectedQuest.icon : (selectedQuest.icon?.id || '')} 
                      onChange={(e) => {
                        let newIcon: any = e.target.value;
                        if (typeof selectedQuest.icon === 'object' && selectedQuest.icon !== null) {
                           newIcon = { ...selectedQuest.icon, id: e.target.value };
                        }
                        updateQuest(selection.id as string, { icon: newIcon });
                      }}
                    />
                    <button 
                      className="btn-icon" 
                      title="Explorar texturas en catálogo" 
                      onClick={() => setTexturePicker({
                        isOpen: true,
                        targetType: 'icon',
                        title: 'Seleccionar Icono de Misión',
                        onSelect: (val) => updateQuest(selection.id as string, { icon: val })
                      })}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Search size={16} />
                    </button>
                    <button className="btn-icon" title="Editar NBT Avanzado" onClick={() => {
                      setNbtEditor({
                        title: 'Editar Ícono NBT',
                        value: JSON.stringify(selectedQuest.icon || "minecraft:stone", null, 2),
                        onSave: (newVal) => {
                          updateQuest(selection.id as string, { icon: newVal });
                        }
                      });
                    }}><Settings size={16} /></button>
                  </div>
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Descripción</label>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Multilínea (Lore)</span>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={descriptionTextareaRef}
                    value={(selectedQuest.description || []).join('\n')}
                    onChange={(val) => {
                      updateQuest(selection.id as string, { description: val.split('\n') });
                    }}
                  />
                  <textarea
                    ref={descriptionTextareaRef}
                    className="input-field"
                    rows={3}
                    value={(selectedQuest.description || []).join('\n')}
                    onChange={(e) => updateQuest(selection.id as string, { description: e.target.value.split('\n') })}
                  />
                  <MinecraftFormattedPreview
                    text={selectedQuest.description || []}
                    label="Vista Previa Descripción"
                    defaultColor="#FFFFFF"
                  />
                </div>
                <div className="row">
                  <div className="input-group">
                    <label>Forma (Shape)</label>
                    <select className="input-field" 
                      value={selectedQuest.shape || 'default'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextShape = val === 'default' ? undefined : val;
                        updateQuest(selection.id as string, { shape: nextShape });
                      }}
                    >
                      <option value="default">Por Defecto (Heredar)</option>
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="rsquare">Rounded Square</option>
                      <option value="gear">Gear</option>
                      <option value="octagon">Octagon</option>
                      <option value="diamond">Diamond</option>
                      <option value="hexagon">Hexagon</option>
                      <option value="pentagon">Pentagon</option>
                      <option value="heart">Heart</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Tamaño</label>
                    <input type="number" step="0.5" className="input-field" 
                      value={selectedQuest.size?.value ?? 1.0} 
                      onChange={(e) => updateQuest(selection.id as string, { size: { __type: 'number', value: parseFloat(e.target.value), suffix: 'd' } })}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="input-group">
                    <label>X</label>
                    <input type="number" step="0.5" className="input-field" 
                      value={selectedQuest.x?.value ?? 0} 
                      onChange={(e) => updateQuest(selection.id as string, { x: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Y</label>
                    <input type="number" step="0.5" className="input-field" 
                      value={selectedQuest.y?.value ?? 0} 
                      onChange={(e) => updateQuest(selection.id as string, { y: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '10px' }}>
                  <label htmlFor="hide_deps">Ocultar hasta completar dependencias</label>
                  <select 
                    id="hide_deps"
                    className="input-field"
                    value={selectedQuest.hide_until_deps_complete === undefined ? 'default' : (selectedQuest.hide_until_deps_complete ? 'true' : 'false')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextVal = val === 'default' ? undefined : (val === 'true');
                      updateQuest(selection.id as string, { hide_until_deps_complete: nextVal });
                    }}
                  >
                    <option value="default">Por Defecto (Heredar)</option>
                    <option value="true">Sí (Ocultar)</option>
                    <option value="false">No (Mostrar)</option>
                  </select>
                </div>

                {/* Dependencies Section */}
                <div style={{ marginTop: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Dependencias (Requisitos)</h3>
                  
                  {normalizedDeps.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                      Esta misión no tiene dependencias.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      {normalizedDeps.map((depId: string) => {
                        const depQuest = quests.find(q => q && q.id === depId);
                        const externalInfo = allChaptersQuestsMap.get(depId);
                        const isCrossChapter = !depQuest && !!externalInfo;
                        const isUnknown = !depQuest && !externalInfo;

                        const depTitle = depQuest 
                          ? String(getDValue(depQuest.title) || depQuest.id)
                          : (externalInfo ? String(getDValue(externalInfo.quest.title) || depId) : depId);
                        const depIcon = depQuest ? depQuest.icon : (externalInfo ? externalInfo.quest.icon : undefined);

                        return (
                          <div 
                            key={depId} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              background: isCrossChapter ? 'rgba(123, 97, 255, 0.08)' : (isUnknown ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)'), 
                              padding: '6px 10px', 
                              borderRadius: '6px',
                              border: isCrossChapter ? '1px solid rgba(123, 97, 255, 0.28)' : (isUnknown ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.05)'),
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              <QuestItemThumbnail icon={depIcon} size={22} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div 
                                  style={{ fontSize: '0.8rem', color: isCrossChapter ? '#c4b5fd' : (isUnknown ? '#fbbf24' : 'var(--text-primary)'), textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                  title={`${depTitle} (${depId})`}
                                >
                                  {isCrossChapter && <span style={{ marginRight: '4px' }}>🌐</span>}
                                  {isUnknown && <span style={{ marginRight: '4px' }}>⚠️</span>}
                                  {!isCrossChapter && !isUnknown && <span style={{ marginRight: '4px' }}>🔗</span>}
                                  {parseMinecraftText(depTitle)}
                                </div>
                                {isCrossChapter && (
                                  <div style={{ fontSize: '0.67rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>Capítulo: {externalInfo.chapterTitle}</span>
                                  </div>
                                )}
                                {isUnknown && (
                                  <div style={{ fontSize: '0.67rem', color: '#f59e0b' }}>
                                    ID externo: {depId}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isCrossChapter && (
                                <button
                                  className="btn-icon"
                                  style={{ color: '#a78bfa', padding: '3px' }}
                                  onClick={() => {
                                    handleSelectTab(externalInfo.tabId);
                                    setSelection({ type: 'quest', ids: [depId], items: [{ type: 'quest', id: depId }] });
                                  }}
                                  title={`Ir al capítulo "${externalInfo.chapterTitle}" y seleccionar esta misión`}
                                >
                                  <ExternalLink size={13} />
                                </button>
                              )}
                              <button 
                                className="btn-icon" 
                                style={{ color: 'var(--danger-color)', padding: '3px' }}
                                onClick={() => {
                                  const nextDeps = normalizedDeps.filter((id: string) => id !== depId);
                                  const updatedQuest = {
                                    ...selectedQuest,
                                    dependencies: nextDeps.length > 0 ? nextDeps : undefined
                                  };
                                  if (updatedQuest.dependencies === undefined) {
                                    delete updatedQuest.dependencies;
                                  }
                                  updateQuest(selectedQuest.id, updatedQuest);
                                }}
                                title="Eliminar dependencia"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {availableQuestsToAdd.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select 
                        id="add-dependency-select"
                        className="input-field"
                        style={{ fontSize: '0.8rem', height: '32px', flexGrow: 1 }}
                        defaultValue=""
                      >
                        <option value="" disabled>Añadir requisito local...</option>
                        {availableQuestsToAdd.map(q => (
                          <option key={q.id} value={q.id}>
                            {String(getDValue(q.title) || q.id)}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
                        onClick={() => {
                          const selectEl = document.getElementById('add-dependency-select') as HTMLSelectElement;
                          const selectedId = selectEl.value;
                          if (selectedId) {
                            const nextDeps = [...normalizedDeps, selectedId];
                            updateQuest(selectedQuest.id, { dependencies: nextDeps });
                            selectEl.value = "";
                          }
                        }}
                      >
                        Añadir
                      </button>
                    </div>
                  )}

                  {/* Botón para vincular dependencia de otro capítulo */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.76rem',
                      marginTop: '6px',
                      padding: '6px 10px',
                      background: 'rgba(123, 97, 255, 0.12)',
                      border: '1px solid rgba(123, 97, 255, 0.28)',
                      color: '#c4b5fd',
                    }}
                    onClick={() => setIsCrossChapterModalOpen(true)}
                  >
                    <Globe size={13} />
                    <span>Vincular Prerrequisito de Otro Capítulo...</span>
                  </button>

                  {/* Configuración avanzada de dependencias de la misión */}
                  {normalizedDeps.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="quest-hide-deps"
                          checked={selectedQuest.hide_dependency_lines === true}
                          onChange={(e) => {
                            updateQuest(selectedQuest.id, {
                              hide_dependency_lines: e.target.checked ? true : undefined
                            });
                          }}
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        <label htmlFor="quest-hide-deps" style={{ fontSize: '0.78rem', cursor: 'pointer', margin: 0 }}>
                          Ocultar cables entrantes en el juego (<code>hide_dependency_lines</code>)
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Criterio de Desbloqueo</label>
                          <select
                            className="input-field"
                            style={{ fontSize: '0.78rem', height: '30px' }}
                            value={String(selectedQuest.dependency_requirement || 'all_completed')}
                            onChange={(e) => {
                              updateQuest(selectedQuest.id, {
                                dependency_requirement: e.target.value === 'all_completed' ? undefined : e.target.value
                              });
                            }}
                          >
                            <option value="all_completed">Todas completadas (default)</option>
                            <option value="one_completed">Al menos una completada</option>
                            <option value="all_started">Todas iniciadas</option>
                            <option value="one_started">Al menos una iniciada</option>
                          </select>
                        </div>

                        {normalizedDeps.length > 1 && (
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mínimo requeridas</label>
                            <input
                              type="number"
                              min={0}
                              max={normalizedDeps.length}
                              className="input-field"
                              style={{ fontSize: '0.78rem', height: '30px' }}
                              placeholder={`0 = todas (${normalizedDeps.length})`}
                              value={selectedQuest.min_required_dependencies !== undefined ? Number(getDValue(selectedQuest.min_required_dependencies)) : ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateQuest(selectedQuest.id, {
                                  min_required_dependencies: isNaN(val) || val <= 0 ? undefined : val
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks & Rewards Section */}
                <QuestTaskRewardManager
                  tasks={tasksArray}
                  rewards={rewardsArray}
                  rewardTables={rewardTables}
                  onOpenRewardTableModal={() => setIsRewardTableModalOpen(true)}
                  onUpdateTasks={(newTasks) => updateQuest(selection.id as string, { tasks: newTasks })}
                  onUpdateRewards={(newRewards) => updateQuest(selection.id as string, { rewards: newRewards })}
                  onOpenTexturePicker={(targetType, onSelect) => setTexturePicker({
                    isOpen: true,
                    targetType: targetType as any,
                    title: 'Seleccionar Ítem del Catálogo',
                    onSelect
                  })}
                  onOpenNbtEditor={(title, value, onSave) => setNbtEditor({
                    title,
                    value: JSON.stringify(value, null, 2),
                    onSave
                  })}
                />

                {/* Delete Quest Section */}
                <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={pinSelectionToClipboard}
                  >
                    📌 Anclar al Portapapeles
                  </button>
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 179, 71, 0.15)', color: '#ffb347', border: '1px solid rgba(255, 179, 71, 0.25)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={clearSelectedDependencies}
                    title="Borra todas las dependencias de ida y vuelta para esta misión"
                  >
                    <span>🔓</span> Quitar todas las dependencias
                  </button>
                  <button className="btn-icon" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px' }} onClick={() => deleteQuest(selection.id as string)}>
                    <Trash2 size={16} /> Eliminar Misión
                  </button>
                </div>

              </div>
            );
          })()}
        </div>
      </div>
      )}

      {/* Botón flotante para expandir la barra lateral derecha cuando está colapsada */}
      {viewMode === 'map' && isRightSidebarCollapsed && (
        <button
          className="sidebar-expand-pill"
          onClick={() => setIsRightSidebarCollapsed(false)}
          title="Abrir panel de propiedades (Expandir)"
        >
          <PanelRightOpen size={16} className="text-accent" />
          <span>Propiedades</span>
        </button>
      )}
    </div>
    {nbtEditor && (
      <div className="modal-overlay" onClick={() => setNbtEditor(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{nbtEditor.title}</h2>
            <button className="btn-icon" onClick={() => setNbtEditor(null)}>×</button>
          </div>
          <div className="modal-body" style={{ height: '300px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Edita el objeto en formato JSON. Al guardar, se convertirá y escribirá como objeto SNBT.
            </p>
            <textarea 
              className="input-field" 
              style={{ flexGrow: 1, fontFamily: 'monospace', resize: 'vertical' }}
              value={nbtEditor.value}
              onChange={e => setNbtEditor({...nbtEditor, value: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setNbtEditor(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => {
              try {
                const parsed = JSON.parse(nbtEditor.value);
                nbtEditor.onSave(parsed);
                setNbtEditor(null);
              } catch (e: any) {
                showToast('Error al parsear JSON: ' + e.message, 'warning');
              }
            }}>Guardar NBT</button>
          </div>
        </div>
      </div>
    )}

    {texturePicker && texturePicker.isOpen && (
      <TexturePickerModal
        isOpen={texturePicker.isOpen}
        onClose={() => setTexturePicker(null)}
        title={texturePicker.title}
        targetType={texturePicker.targetType}
        onSelect={texturePicker.onSelect}
      />
    )}

    {isRewardTableModalOpen && (
      <RewardTableModal
        isOpen={isRewardTableModalOpen}
        onClose={() => setIsRewardTableModalOpen(false)}
        rewardTables={rewardTables}
        onUpdateRewardTables={handleUpdateRewardTables}
        onOpenTexturePicker={(targetType, onSelect) => setTexturePicker({
          isOpen: true,
          targetType: targetType as any,
          title: 'Seleccionar Ítem para Recompensa',
          onSelect
        })}
      />
    )}

    {isAnalyticsModalOpen && (
      <AnalyticsDashboardModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        chapters={tabs}
        rewardTables={rewardTables}
        chapterGroups={chapterGroups}
        onNavigateToQuest={(chapterId, questId) => {
          handleSelectTab(chapterId);
          setSelection({ type: 'quest', ids: [questId], items: [{ type: 'quest', id: questId }] });
          if (viewMode !== 'map') setViewMode('map');
          setIsAnalyticsModalOpen(false);
        }}
      />
    )}

    {isChapterGroupModalOpen && (
      <ChapterGroupModal
        isOpen={isChapterGroupModalOpen}
        onClose={() => setIsChapterGroupModalOpen(false)}
        chapterGroups={chapterGroups}
        onUpdateChapterGroups={handleUpdateChapterGroups}
        chapters={tabs}
        currentChapterId={activeTabId}
        currentChapterGroup={snbtData ? getDValue(snbtData.group) || '' : ''}
        onAssignCurrentChapterGroup={(groupId: string) => {
          if (snbtData) {
            const updated = { ...snbtData };
            if (groupId) {
              updated.group = groupId;
            } else {
              delete updated.group;
            }
            updateState(quests, images, false, updated);
            showToast(groupId ? 'Grupo asignado al capítulo actual' : 'Grupo desasignado del capítulo', 'success');
          }
        }}
      />
    )}

    {isCrossChapterModalOpen && selection.type === 'quest' && selection.id && (() => {
      const curQuest = quests.find(q => q && q.id === selection.id);
      if (!curQuest) return null;
      const deps = Array.isArray(curQuest.dependencies)
        ? curQuest.dependencies
        : (curQuest.dependencies ? [curQuest.dependencies] : []);
      const normalizedCurrentDeps = deps.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));

      return (
        <CrossChapterDependencyModal
          isOpen={isCrossChapterModalOpen}
          onClose={() => setIsCrossChapterModalOpen(false)}
          currentChapterId={activeTabId}
          currentQuestId={String(curQuest.id)}
          existingDependencyIds={normalizedCurrentDeps}
          tabs={tabs}
          onAddDependency={(questId, chapterTitle, questTitle) => {
            if (!normalizedCurrentDeps.includes(questId)) {
              const nextDeps = [...normalizedCurrentDeps, questId];
              updateQuest(curQuest.id, { dependencies: nextDeps });
              showToast(`Conectado con "${questTitle}" (${chapterTitle})`, 'success');
            }
          }}
        />
      );
    })()}

    {contextMenu.visible && (
      <div 
        className="context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="context-menu-item"
          onClick={makeSelectedDependOnTarget}
        >
          <span>🔗</span> Hacer que las seleccionadas dependan de esta
        </div>
        <div 
          className="context-menu-item"
          onClick={removeSelectedDependencyOnTarget}
        >
          <span>🔓</span> Quitar dependencia de esta en las seleccionadas
        </div>
        <div className="context-menu-divider" />
        <div 
          className="context-menu-item"
          onClick={makeTargetDependOnSelected}
        >
          <span>🔗</span> Hacer que esta dependa de las seleccionadas
        </div>
        <div 
          className="context-menu-item"
          onClick={removeTargetDependencyOnSelected}
        >
          <span>🔓</span> Quitar dependencias seleccionadas de esta
        </div>
        <div className="context-menu-divider" />
        <div 
          className="context-menu-item"
          onClick={() => {
            pinSelectionToClipboard();
            setContextMenu({ ...contextMenu, visible: false });
          }}
        >
          <span>📌</span> Anclar Selección al Portapapeles
        </div>
      </div>
    )}

    {isDraggingFile && (
      <div className="drop-zone-overlay">
        <div className="drop-zone-container">
          <div className="drop-zone-icon-wrapper">
            <Upload size={48} />
          </div>
          <h2 className="drop-zone-title">Suelta el archivo aquí para importar</h2>
          <p className="drop-zone-subtitle">Soporta archivos con extensión .snbt</p>
        </div>
      </div>
    )}

    {/* Contenedor de Notificaciones Toast/Growl */}
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <p className="toast-message">{t.message}</p>
        </div>
      ))}
    </div>
    </>
    </ErrorBoundary>
  );
}

export default App;
