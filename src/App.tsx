import { PanelRightOpen } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal';
import { BlueprintLibraryModal } from './components/BlueprintLibraryModal';
import { ChapterGroupModal } from './components/ChapterGroupModal';
import { CommandGeneratorModal } from './components/CommandGeneratorModal';
import { CrossChapterDependencyModal } from './components/CrossChapterDependencyModal';
import { DropZoneOverlay } from './components/DropZoneOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LeftSidebar } from './components/LeftSidebar';
import { MainViewport } from './components/MainViewport';
import { MinecraftTextEditorModal } from './components/MinecraftTextEditorModal';
import { ModpackDoctorModal } from './components/ModpackDoctorModal';
import { NbtEditorModal } from './components/NbtEditorModal';
import { PinnedPrefabsModal } from './components/PinnedPrefabsModal';
import { PropertiesSidebar } from './components/PropertiesSidebar';
import { QuestBookSettingsModal } from './components/QuestBookSettingsModal';
import { QuestContextMenu } from './components/QuestContextMenu';
import { QuestSimulatorModal } from './components/QuestSimulatorModal';
import { RewardTableModal } from './components/RewardTableModal';
import { TexturePickerModal } from './components/TexturePickerModal';
import { ToastContainer } from './components/ToastContainer';
import { TranslationManagerModal } from './components/TranslationManagerModal';
import type { Blueprint, BlueprintCategory } from './types/blueprints';
import type { ChapterTab } from './types/chapter';
import type { ChapterGroup } from './types/chapterGroup';
import type { TranslationEntry } from './types/i18n';
import type { RewardTable } from './types/rewardTable';
import { generateHexId, getDValue } from './utils/appHelpers';
import { computeAutoLayout } from './utils/autoLayout';
import { instantiateBlueprint, saveCustomBlueprint } from './utils/blueprintEngine';
import { isFolderAccessSupported, pickQuestFolder, readQuestFolder, resolveQuestsDir, writeQuestFiles } from './utils/folderAccess';
import { validateQuestGraph } from './utils/graphValidation';
import { applyI18nKeysToChapters } from './utils/i18nManager';
import type { ClassifiedFile } from './utils/questBook';
import { classifyQuestFiles, readQuestExtras } from './utils/questBook';
import {
type SimulatorState,
completeQuestInSimulator,
computeUnlockedQuests,
createInitialSimulatorState
} from './utils/questSimulatorEngine';
import { parseSNBT, stringifySNBT } from './utils/snbt';
import { buildModpackFiles, exportModpackToZip } from './utils/zipExporter';

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
  const currentCameraRef = useRef<{ pos?: { x: number; y: number }; scale: number }>({ pos: undefined, scale: 1 });

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

  // Ajustes globales del libro de misiones (data.snbt)
  const [questBookData, setQuestBookData] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('ftb_quest_book_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading quest book data from localStorage:', e);
    }
    return null;
  });
  const [isQuestBookModalOpen, setIsQuestBookModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState<boolean>(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState<boolean>(false);

  // Referencias para manipulación de cursor/selección en barras de formato de texto Minecraft
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modo Vista Jugador / Simulador de Progresión
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(false);
  const [playerCompletedQuestIds, setPlayerCompletedQuestIds] = useState<Set<string>>(new Set());
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [simulatorState, setSimulatorState] = useState<SimulatorState>(() => createInitialSimulatorState([]));

  // Estados de Modales Adicionales: Doctor, Comandos y Editor de Texto Enriquecido
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState<boolean>(false);
  const [textEditorConfig, setTextEditorConfig] = useState<{
    isOpen: boolean;
    fieldTitle: string;
    initialValue: string | string[];
    isMultiline: boolean;
    onSave: (val: any) => void;
  }>({
    isOpen: false,
    fieldTitle: '',
    initialValue: '',
    isMultiline: false,
    onSave: () => {}
  });

  // Sincronizar misiones desbloqueadas en el simulador cuando cambia el set de misiones
  useEffect(() => {
    setSimulatorState(prev => ({
      ...prev,
      unlockedQuestIds: computeUnlockedQuests(quests, prev.completedQuestIds)
    }));
  }, [quests]);

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

  const handleInsertBlueprint = (bp: Blueprint) => {
    if (!snbtData) {
      showToast('Abre o crea un capítulo primero para insertar la plantilla', 'warning');
      return;
    }

    // Coordenadas aproximadas centradas en la vista actual del canvas
    const cam = currentCameraRef.current;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const scale = cam.scale || 1;
    const posX = cam.pos?.x ?? (viewportW / 2);
    const posY = cam.pos?.y ?? (viewportH / 2);
    const worldCenterX = (viewportW / 2 - posX) / (scale * 40);
    const worldCenterY = (viewportH / 2 - posY) / (scale * 40);
    const centerPos = {
      x: Math.round(worldCenterX * 2) / 2 || 0,
      y: Math.round(worldCenterY * 2) / 2 || 0
    };

    const { newQuests } = instantiateBlueprint(bp, centerPos);
    if (newQuests.length === 0) return;

    const nextQuests = [...quests, ...newQuests];
    updateState(nextQuests, images);

    const newIds = newQuests.map(q => q.id);
    setSelection({
      type: 'quest',
      ids: newIds,
      items: newQuests.map(q => ({ type: 'quest', id: q.id }))
    });

    setIsBlueprintModalOpen(false);
    showToast(`Plantilla "${bp.title}" insertada (${newQuests.length} misiones)`, 'success');
  };

  const handleSaveSelectionAsBlueprint = (title: string, category: BlueprintCategory) => {
    const selectedQuests = quests.filter(q => q && selection.ids.includes(q.id));
    if (selectedQuests.length === 0) {
      showToast('Selecciona al menos una misión para guardar como plantilla', 'warning');
      return;
    }

    const newBlueprint: Blueprint = {
      id: `custom_${Date.now()}`,
      title,
      description: `Plantilla personalizada con ${selectedQuests.length} misiones`,
      category,
      icon: selectedQuests[0]?.icon || 'minecraft:anvil',
      isCustom: true,
      quests: JSON.parse(JSON.stringify(selectedQuests))
    };

    saveCustomBlueprint(newBlueprint);
    showToast(`Plantilla "${title}" guardada con éxito`, 'success');
  };

  const handleApplyTranslationsToModpack = (entries: TranslationEntry[]) => {
    const updatedTabs = applyI18nKeysToChapters(tabs, entries);
    setTabs(updatedTabs);

    const currentActive = updatedTabs.find(t => t.id === activeTabIdRef.current);
    if (currentActive) {
      updateState(currentActive.quests, currentActive.images, false, currentActive.snbtData);
    }

    showToast('Textos convertidos a claves I18n {clave} y sincronizados en el modpack', 'success');
  };

  const handleUpdateQuestBook = (newData: any) => {
    setQuestBookData(newData);
    try {
      localStorage.setItem('ftb_quest_book_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Error saving quest book data:', e);
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
    setSimulatorState(prev => {
      const next = completeQuestInSimulator(questId, prev, quests, rewardTables);
      setPlayerCompletedQuestIds(next.completedQuestIds);
      if (next.completedQuestIds.has(questId.toUpperCase())) {
        showToast('¡Misión completada! Desbloqueando ramas y recibiendo recompensas...', 'success');
      } else {
        showToast('Misión marcada como pendiente (reversión)', 'info');
      }
      return next;
    });
  };

  const handleResetPlayerProgress = () => {
    const next = createInitialSimulatorState(quests);
    setSimulatorState(next);
    setPlayerCompletedQuestIds(next.completedQuestIds);
    showToast('Progreso del simulador reiniciado a cero', 'info');
  };

  const handleCompleteAllPlayerQuests = () => {
    let current = simulatorState;
    for (const q of quests) {
      if (current.unlockedQuestIds.has(String(q.id).toUpperCase())) {
        current = completeQuestInSimulator(String(q.id), current, quests, rewardTables);
      }
    }
    setSimulatorState(current);
    setPlayerCompletedQuestIds(current.completedQuestIds);
    showToast('Misiones desbloqueadas completadas en lote', 'success');
  };

  // Sincronizar niveles Z visibles cuando cambian los disponibles
  useEffect(() => {
    if (availableZLevels.length === 0) {
      setVisibleZLevels([]);
      prevAvailableZLevelsRef.current = [];
      return;
    }
    // Se captura ANTES del updater: React puede ejecutarlo más tarde (ya con el ref actualizado abajo),
    // y entonces los niveles nuevos no se detectaban y todas las imágenes quedaban ocultas.
    const prevAvailable = prevAvailableZLevelsRef.current;
    setVisibleZLevels(prev => {
      // Si el estado visible anterior estaba vacío y no había niveles previos, activamos todos por defecto
      if (prev.length === 0 && prevAvailable.length === 0) {
        return [...availableZLevels];
      }
      
      // Filtrar los niveles visibles que sigan existiendo en los niveles disponibles actuales
      const currentVisible = prev.filter(l => availableZLevels.includes(l));
      
      // Los niveles verdaderamente nuevos son aquellos que están en availableZLevels
      // pero que NO estaban en el conjunto de niveles disponibles del renderizado anterior (independientemente de si estaban activos o no)
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
  const folderInputRef = useRef<HTMLInputElement>(null);

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
      pos: tab.stagePos,
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

  // data.snbt, chapter_groups.snbt y reward_tables/ de una carpeta de quests
  const importQuestExtras = async (classified: ClassifiedFile[]) => {
    const extras = await readQuestExtras(classified);
    const parts: string[] = [];

    if (extras.data) {
      handleUpdateQuestBook(extras.data);
      parts.push('data.snbt');
    }
    if (extras.chapterGroups) {
      handleUpdateChapterGroups(extras.chapterGroups);
      parts.push(`${extras.chapterGroups.length} grupos`);
    }
    if (extras.rewardTables.length > 0) {
      const byId = new Map(rewardTables.map(t => [t.id, t]));
      extras.rewardTables.forEach(t => byId.set(t.id, t));
      handleUpdateRewardTables(Array.from(byId.values()));
      parts.push(`${extras.rewardTables.length} tablas de recompensas`);
    }

    if (parts.length > 0) showToast(`Importado: ${parts.join(', ')}`, 'success');
    extras.errors.forEach(err => showToast(`Error al leer ${err}`, 'warning'));
  };

  const processFiles = (allFiles: File[]) => {
    const classified = classifyQuestFiles(allFiles);
    const hasExtras = classified.some(c => c.kind !== 'chapter');
    if (hasExtras) {
      importQuestExtras(classified);
    }

    const snbtFiles = classified.filter(c => c.kind === 'chapter').map(c => c.file);
    if (snbtFiles.length === 0) {
      if (!hasExtras) {
        showToast('Por favor, selecciona o arrastra archivos con extensión .snbt', 'warning');
      }
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

    // 2. Búsqueda de centro de destino centrado en la vista de la cámara actual
    const cam = currentCameraRef.current;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const scale = cam.scale || 1;
    const posX = cam.pos?.x ?? (viewportW / 2);
    const posY = cam.pos?.y ?? (viewportH / 2);
    const targetX = (viewportW / 2 - posX) / (scale * 40);
    const targetY = (viewportH / 2 - posY) / (scale * 40);

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

  const collectExportOptions = () => {
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
      return null;
    }
    return {
      chapters: allChapters,
      rewardTables,
      chapterGroups,
      questData: questBookData || undefined,
    };
  };

  const handleExportZip = async () => {
    const opts = collectExportOptions();
    if (!opts) return;

    try {
      showToast('Generando archivo .ZIP del Modpack...', 'info');
      await exportModpackToZip({ ...opts, zipFilename: 'ftbquests-modpack.zip' });
      showToast('¡Modpack .ZIP exportado exitosamente!', 'success');
    } catch (err: any) {
      console.error('Error exportando .ZIP:', err);
      showToast(`Error al exportar .ZIP: ${err.message || err}`, 'warning');
    }
  };

  // Carpeta de quests enlazada (File System Access API): permite guardar sin descargar ZIP
  const [linkedFolder, setLinkedFolder] = useState<any>(null);

  const handleOpenFolder = async () => {
    if (!isFolderAccessSupported()) {
      folderInputRef.current?.click();
      return;
    }
    try {
      const picked = await pickQuestFolder();
      if (!picked) return;
      const dir = await resolveQuestsDir(picked);
      const files = await readQuestFolder(dir);
      if (files.length === 0) {
        showToast('La carpeta no contiene archivos .snbt', 'warning');
        return;
      }
      setLinkedFolder(dir);
      processFiles(files);
      showToast(`Carpeta "${dir.name}" enlazada: ya puedes guardar directamente en ella`, 'success');
    } catch (err: any) {
      console.error('Error abriendo carpeta:', err);
      showToast(`No se pudo abrir la carpeta: ${err.message || err}`, 'warning');
    }
  };

  const handleSaveToFolder = async () => {
    const opts = collectExportOptions();
    if (!opts) return;
    try {
      let dir = linkedFolder;
      if (!dir) {
        const picked = await pickQuestFolder();
        if (!picked) return;
        dir = await resolveQuestsDir(picked);
      }
      const files = buildModpackFiles(opts);
      if (!window.confirm(`Se escribirán ${files.length} archivos en la carpeta "${dir.name}", sobrescribiendo los que ya existan.
(No se borra nada: los capítulos eliminados en el editor seguirán en la carpeta.)

¿Continuar?`)) return;
      const n = await writeQuestFiles(dir, files);
      setLinkedFolder(dir);
      showToast(`Guardados ${n} archivos en "${dir.name}"`, 'success');
    } catch (err: any) {
      console.error('Error guardando en carpeta:', err);
      showToast(`Error al guardar en la carpeta: ${err.message || err}`, 'warning');
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
      <LeftSidebar addImage={addImage} addQuest={addQuest} availableZLevels={availableZLevels} chapterGroups={chapterGroups} fileInputRef={fileInputRef} filename={filename} folderInputRef={folderInputRef} graphValidation={graphValidation} handleAutoLayout={handleAutoLayout} handleExport={handleExport} handleExportZip={handleExportZip} handleFileUpload={handleFileUpload} handleOpenFolder={handleOpenFolder} handleSaveToFolder={handleSaveToFolder} history={history} historyIndex={historyIndex} images={images} isPlayerMode={isPlayerMode} layers={layers} linkedFolder={linkedFolder} questBookData={questBookData} quests={quests} redo={redo} rewardTables={rewardTables} selection={selection} setIsAnalyticsModalOpen={setIsAnalyticsModalOpen} setIsBlueprintModalOpen={setIsBlueprintModalOpen} setIsChapterGroupModalOpen={setIsChapterGroupModalOpen} setIsCommandModalOpen={setIsCommandModalOpen} setIsDoctorModalOpen={setIsDoctorModalOpen} setIsPlayerMode={setIsPlayerMode} setIsQuestBookModalOpen={setIsQuestBookModalOpen} setIsRewardTableModalOpen={setIsRewardTableModalOpen} setIsSimulatorModalOpen={setIsSimulatorModalOpen} setIsTranslationModalOpen={setIsTranslationModalOpen} setLayers={setLayers} setViewMode={setViewMode} setVisibleZLevels={setVisibleZLevels} snbtData={snbtData} tabs={tabs} undo={undo} viewMode={viewMode} visibleZLevels={visibleZLevels} />

      {/* Columna Central: Pestañas de Capítulos + Canvas / Vista de Tabla */}
      <MainViewport JSON={JSON} activeTabId={activeTabId} connectionLineStyle={connectionLineStyle} currentCameraRef={currentCameraRef} fileInputRef={fileInputRef} graphValidation={graphValidation} handleAutoLayout={handleAutoLayout} handleBatchReplace={handleBatchReplace} handleCloseTab={handleCloseTab} handleCompleteAllPlayerQuests={handleCompleteAllPlayerQuests} handleConnectQuests={handleConnectQuests} handleConnectionLineStyleChange={handleConnectionLineStyleChange} handleExport={handleExport} handleExportAll={handleExportAll} handleExportZip={handleExportZip} handleNewBlankTab={handleNewBlankTab} handleQuestContextMenu={handleQuestContextMenu} handleReplaceSingle={handleReplaceSingle} handleResetPlayerProgress={handleResetPlayerProgress} handleSelectTab={handleSelectTab} handleTogglePlayerQuestCompletion={handleTogglePlayerQuestCompletion} images={images} isPinnedDrawerOpen={isPinnedDrawerOpen} isPlayerMode={isPlayerMode} layers={layers} lockedKeys={lockedKeys} mouseCanvasPosRef={mouseCanvasPosRef} pinnedAssets={pinnedAssets} playerCompletedQuestIds={playerCompletedQuestIds} quests={quests} selection={selection} setIsPinnedDrawerOpen={setIsPinnedDrawerOpen} setIsPlayerMode={setIsPlayerMode} setIsSimulatorModalOpen={setIsSimulatorModalOpen} setNbtEditor={setNbtEditor} setSelection={setSelection} setSnapMode={setSnapMode} setSnapToGrid={setSnapToGrid} snapMode={snapMode} snapToGrid={snapToGrid} snbtData={snbtData} tabs={tabs} updateImage={updateImage} updateQuest={updateQuest} updateQuestsAndImages={updateQuestsAndImages} viewMode={viewMode} visibleZLevels={visibleZLevels} />

      {/* Sidebar Derecha - Propiedades */}
      <PropertiesSidebar Array={Array} JSON={JSON} Math={Math} Number={Number} String={String} alignSelectedItems={alignSelectedItems} allChaptersQuestsMap={allChaptersQuestsMap} chapterGroups={chapterGroups} clearSelectedDependencies={clearSelectedDependencies} connectionLineStyle={connectionLineStyle} deleteQuest={deleteQuest} deleteSelectedDependency={deleteSelectedDependency} deleteSelectedImages={deleteSelectedImages} deleteSelectedQuests={deleteSelectedQuests} descriptionTextareaRef={descriptionTextareaRef} distributeSelectedItems={distributeSelectedItems} duplicateSelection={duplicateSelection} handleAutoLayout={handleAutoLayout} handleConnectionLineStyleChange={handleConnectionLineStyleChange} handleSelectTab={handleSelectTab} images={images} invertSelectedDependency={invertSelectedDependency} isResizingRightSidebar={isResizingRightSidebar} isRightSidebarCollapsed={isRightSidebarCollapsed} lockedKeys={lockedKeys} pinSelectionToClipboard={pinSelectionToClipboard} quests={quests} rewardTables={rewardTables} rightSidebarWidth={rightSidebarWidth} selection={selection} setImages={setImages} setIsChapterGroupModalOpen={setIsChapterGroupModalOpen} setIsCommandModalOpen={setIsCommandModalOpen} setIsCrossChapterModalOpen={setIsCrossChapterModalOpen} setIsRewardTableModalOpen={setIsRewardTableModalOpen} setIsRightSidebarCollapsed={setIsRightSidebarCollapsed} setNbtEditor={setNbtEditor} setRightSidebarWidth={setRightSidebarWidth} setSelection={setSelection} setTextEditorConfig={setTextEditorConfig} setTexturePicker={setTexturePicker} snbtData={snbtData} startResizingRightSidebar={startResizingRightSidebar} subtitleInputRef={subtitleInputRef} titleInputRef={titleInputRef} toggleLock={toggleLock} toggleLockSelected={toggleLockSelected} updateImage={updateImage} updateQuest={updateQuest} updateSelectedCoordinates={updateSelectedCoordinates} updateState={updateState} viewMode={viewMode} />

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
    <NbtEditorModal JSON={JSON} nbtEditor={nbtEditor} setNbtEditor={setNbtEditor} showToast={showToast} />

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

    {isBlueprintModalOpen && (
      <BlueprintLibraryModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        onInsertBlueprint={handleInsertBlueprint}
        selectedQuestsCount={selection.items.filter(i => i.type === 'quest').length}
        onSaveSelectionAsBlueprint={handleSaveSelectionAsBlueprint}
      />
    )}

    {isPinnedDrawerOpen && (
      <PinnedPrefabsModal
        isOpen={isPinnedDrawerOpen}
        onClose={() => setIsPinnedDrawerOpen(false)}
        pinnedAssets={pinnedAssets}
        onPasteAsset={(asset) => {
          pastePinnedAsset(asset);
          setIsPinnedDrawerOpen(false);
        }}
        onDeleteAsset={(assetId) => {
          const nextAssets = pinnedAssets.filter(a => a.id !== assetId);
          savePinnedAssets(nextAssets);
        }}
        onClearAll={() => {
          savePinnedAssets([]);
        }}
      />
    )}

    {isTranslationModalOpen && (
      <TranslationManagerModal
        isOpen={isTranslationModalOpen}
        onClose={() => setIsTranslationModalOpen(false)}
        chapters={tabs}
        onApplyTranslationsToModpack={handleApplyTranslationsToModpack}
      />
    )}

    {isQuestBookModalOpen && (
      <QuestBookSettingsModal
        isOpen={isQuestBookModalOpen}
        onClose={() => setIsQuestBookModalOpen(false)}
        data={questBookData}
        onUpdate={handleUpdateQuestBook}
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

    {texturePicker && texturePicker.isOpen && (
      <TexturePickerModal
        isOpen={texturePicker.isOpen}
        onClose={() => setTexturePicker(null)}
        title={texturePicker.title}
        targetType={texturePicker.targetType}
        onSelect={texturePicker.onSelect}
      />
    )}

    {/* Modal de Edición Enriquecida de Texto con Preview */}
    <MinecraftTextEditorModal
      isOpen={textEditorConfig.isOpen}
      fieldTitle={textEditorConfig.fieldTitle}
      initialValue={textEditorConfig.initialValue}
      isMultiline={textEditorConfig.isMultiline}
      onSave={textEditorConfig.onSave}
      onClose={() => setTextEditorConfig(prev => ({ ...prev, isOpen: false }))}
    />

    {/* Modal del Simulador de Progresión */}
    <QuestSimulatorModal
      isOpen={isSimulatorModalOpen}
      onClose={() => setIsSimulatorModalOpen(false)}
      simulatorState={simulatorState}
      allQuests={quests}
      rewardTables={rewardTables}
      onReset={handleResetPlayerProgress}
      onCompleteAllAvailable={handleCompleteAllPlayerQuests}
      onSelectQuest={(questId) => {
        setSelection({ type: 'quest', id: questId, ids: [questId] });
      }}
    />

    {/* Modal del Doctor del Modpack */}
    <ModpackDoctorModal
      isOpen={isDoctorModalOpen}
      onClose={() => setIsDoctorModalOpen(false)}
      quests={quests}
      rewardTables={rewardTables}
      activeChapterTitle={String(snbtData?.title ? getDValue(snbtData.title) : filename.replace(/\.snbt$/, ''))}
      onUpdateQuests={(newQuests) => {
        updateQuestsAndImages(newQuests, images);
      }}
      onSelectQuest={(questId) => {
        setSelection({ type: 'quest', id: questId, ids: [questId] });
      }}
    />

    {/* Modal Generador de Comandos y KubeJS Tester */}
    <CommandGeneratorModal
      isOpen={isCommandModalOpen}
      onClose={() => setIsCommandModalOpen(false)}
      selectedQuest={selection.type === 'quest' && selection.id ? quests.find(q => q.id === selection.id) : null}
      chapterTitle={String(snbtData?.title ? getDValue(snbtData.title) : filename.replace(/\.snbt$/, ''))}
      quests={quests}
    />

    <QuestContextMenu contextMenu={contextMenu} makeSelectedDependOnTarget={makeSelectedDependOnTarget} makeTargetDependOnSelected={makeTargetDependOnSelected} pinSelectionToClipboard={pinSelectionToClipboard} removeSelectedDependencyOnTarget={removeSelectedDependencyOnTarget} removeTargetDependencyOnSelected={removeTargetDependencyOnSelected} setContextMenu={setContextMenu} />

    <DropZoneOverlay isDraggingFile={isDraggingFile} />

    {/* Contenedor de Notificaciones Toast/Growl */}
    <ToastContainer toasts={toasts} />
    </>
    </ErrorBoundary>
  );
}

export default App;
