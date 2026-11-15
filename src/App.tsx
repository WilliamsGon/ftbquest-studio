import { PanelRightOpen } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useChapterDocument } from './hooks/useChapterDocument';
import { useDependencyOps } from './hooks/useDependencyOps';
import { usePlayerSimulator } from './hooks/usePlayerSimulator';
import { useQuestFiles } from './hooks/useQuestFiles';
import { useQuestLibrary } from './hooks/useQuestLibrary';
import { useRightSidebar } from './hooks/useRightSidebar';
import { useSelectionOps } from './hooks/useSelectionOps';
import { useToasts } from './hooks/useToasts';
import type { Blueprint, BlueprintCategory } from './types/blueprints';
import type { TranslationEntry } from './types/i18n';
import { generateHexId, getDValue } from './utils/appHelpers';
import { computeAutoLayout } from './utils/autoLayout';
import type { ReplaceFields } from './utils/batchReplace';
import { createReplacer } from './utils/batchReplace';
import { instantiateBlueprint, saveCustomBlueprint } from './utils/blueprintEngine';
import { validateQuestGraph } from './utils/graphValidation';
import { applyI18nKeysToChapters } from './utils/i18nManager';
import type { AlignType } from './utils/selectionOps';
import { alignItems, distributeItems } from './utils/selectionOps';

function App() {
  

  // Entorno Multicapítulo (Pestañas de Trabajo Simultáneo)

  // Gestor de Tablas de Recompensas (reward_tables / Loot Crates)
  const {
    rewardTables, handleUpdateRewardTables,
    chapterGroups, handleUpdateChapterGroups,
    questBookData, handleUpdateQuestBook,
    pinnedAssets, savePinnedAssets,
  } = useQuestLibrary();
  const {
    rightSidebarWidth, setRightSidebarWidth,
    isRightSidebarCollapsed, setIsRightSidebarCollapsed,
    isResizingRightSidebar, startResizingRightSidebar,
  } = useRightSidebar();
  const { toasts, showToast } = useToasts();
  const {
    snbtData, filename, viewMode, setViewMode,
    quests, images, setImages,
    tabs, setTabs, activeTabId, isDirty, setIsDirty, currentCameraRef,
    rawSelection, lockedKeys, setLockedKeys, selection, setSelection,
    history, historyIndex, tabsRef, activeTabIdRef,
    questsRef, imagesRef, selectionRef,
    updateState, undo, redo, loadTab, handleSelectTab, handleCloseTab, handleNewBlankTab,
  } = useChapterDocument(showToast);
  const [isRewardTableModalOpen, setIsRewardTableModalOpen] = useState<boolean>(false);
  const [isCrossChapterModalOpen, setIsCrossChapterModalOpen] = useState<boolean>(false);

  // Gestor de Grupos de Capítulos (chapter_groups.snbt)
  const [isChapterGroupModalOpen, setIsChapterGroupModalOpen] = useState<boolean>(false);

  // Ajustes globales del libro de misiones (data.snbt)
  const [isQuestBookModalOpen, setIsQuestBookModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState<boolean>(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState<boolean>(false);

  // Referencias para manipulación de cursor/selección en barras de formato de texto Minecraft
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modo Vista Jugador / Simulador de Progresión

  const {
    isPlayerMode, setIsPlayerMode,
    playerCompletedQuestIds,
    isSimulatorModalOpen, setIsSimulatorModalOpen,
    simulatorState,
    handleTogglePlayerQuestCompletion, handleResetPlayerProgress, handleCompleteAllPlayerQuests,
  } = usePlayerSimulator(quests, rewardTables, showToast);

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

  const [isPinnedDrawerOpen, setIsPinnedDrawerOpen] = useState<boolean>(false);


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



  const mouseCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

  const [nbtEditor, setNbtEditor] = useState<{ title: string; value: string; onSave: (val: any) => void } | null>(null);
  const [texturePicker, setTexturePicker] = useState<{ isOpen: boolean; targetType: 'icon' | 'image'; onSelect: (val: string) => void; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);


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


  // data.snbt, chapter_groups.snbt y reward_tables/ de una carpeta de quests
  const { copyToClipboard, pasteFromClipboard, toggleLock, toggleLockSelected, duplicateSelection, pinSelectionToClipboard, pastePinnedAsset } = useSelectionOps({ clipboardRef, currentCameraRef, images, imagesRef, lockedKeys, mouseCanvasPosRef, pinnedAssets, quests, questsRef, savePinnedAssets, selection, selectionRef, setClipboard, setLockedKeys, setSelection, showToast, snapToGrid, snbtData, updateState });
  const { handleFileUpload, handleDragOver, handleDragLeave, handleDrop, handleExport, handleExportAll, handleExportZip, linkedFolder, handleOpenFolder, handleSaveToFolder } = useQuestFiles({ activeTabIdRef, chapterGroups, currentCameraRef, filename, folderInputRef, handleUpdateChapterGroups, handleUpdateQuestBook, handleUpdateRewardTables, history, historyIndex, images, isDirty, loadTab, lockedKeys, questBookData, quests, rewardTables, selection, setIsDirty, setIsDraggingFile, setTabs, showToast, snbtData, tabsRef, viewMode });
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


  const handleBatchReplace = (
    searchQuery: string,
    replaceWith: string,
    scope: 'current' | 'all',
    fields: ReplaceFields
  ) => {
    if (!searchQuery) return;

    const { replaceInQuest, replaceInImages, stats } = createReplacer(searchQuery, replaceWith, fields);

    if (scope === 'current') {
      const nextQuests = quests.map(replaceInQuest);
      const nextImages = replaceInImages(images);
      updateState(nextQuests, nextImages);
      showToast(`Reemplazo completado: ${stats.totalReplacements} ocurrencia(s) en ${stats.modifiedQuestsCount} misión(es)`, 'success');
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

      showToast(`Reemplazo masivo: ${stats.totalReplacements} ocurrencia(s) en todas las pestañas`, 'success');
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


  const { clearSelectedDependencies, handleConnectQuests, invertSelectedDependency, deleteSelectedDependency, makeSelectedDependOnTarget, removeSelectedDependencyOnTarget, makeTargetDependOnSelected, removeTargetDependencyOnSelected } = useDependencyOps({ contextMenu, images, quests, rawSelection, selection, setContextMenu, setSelection, showToast, updateQuest, updateState });

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

  const alignSelectedItems = (alignType: AlignType) => {
    const result = alignItems(selection.items, quests, images, alignType);
    if (result) updateState(result.quests, result.images);
  };

  const distributeSelectedItems = (axis: 'horizontal' | 'vertical') => {
    const result = distributeItems(selection.items, quests, images, axis);
    if (!result) return;
    updateState(result.quests, result.images);
    if (result.message) showToast(result.message, 'success');
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
      <MainViewport activeTabId={activeTabId} connectionLineStyle={connectionLineStyle} currentCameraRef={currentCameraRef} fileInputRef={fileInputRef} graphValidation={graphValidation} handleAutoLayout={handleAutoLayout} handleBatchReplace={handleBatchReplace} handleCloseTab={handleCloseTab} handleCompleteAllPlayerQuests={handleCompleteAllPlayerQuests} handleConnectQuests={handleConnectQuests} handleConnectionLineStyleChange={handleConnectionLineStyleChange} handleExport={handleExport} handleExportAll={handleExportAll} handleExportZip={handleExportZip} handleNewBlankTab={handleNewBlankTab} handleQuestContextMenu={handleQuestContextMenu} handleReplaceSingle={handleReplaceSingle} handleResetPlayerProgress={handleResetPlayerProgress} handleSelectTab={handleSelectTab} handleTogglePlayerQuestCompletion={handleTogglePlayerQuestCompletion} images={images} isPinnedDrawerOpen={isPinnedDrawerOpen} isPlayerMode={isPlayerMode} layers={layers} lockedKeys={lockedKeys} mouseCanvasPosRef={mouseCanvasPosRef} pinnedAssets={pinnedAssets} playerCompletedQuestIds={playerCompletedQuestIds} quests={quests} selection={selection} setIsPinnedDrawerOpen={setIsPinnedDrawerOpen} setIsPlayerMode={setIsPlayerMode} setIsSimulatorModalOpen={setIsSimulatorModalOpen} setNbtEditor={setNbtEditor} setSelection={setSelection} setSnapMode={setSnapMode} setSnapToGrid={setSnapToGrid} snapMode={snapMode} snapToGrid={snapToGrid} snbtData={snbtData} tabs={tabs} updateImage={updateImage} updateQuest={updateQuest} updateQuestsAndImages={updateQuestsAndImages} viewMode={viewMode} visibleZLevels={visibleZLevels} />

      {/* Sidebar Derecha - Propiedades */}
      <PropertiesSidebar alignSelectedItems={alignSelectedItems} allChaptersQuestsMap={allChaptersQuestsMap} chapterGroups={chapterGroups} clearSelectedDependencies={clearSelectedDependencies} connectionLineStyle={connectionLineStyle} deleteQuest={deleteQuest} deleteSelectedDependency={deleteSelectedDependency} deleteSelectedImages={deleteSelectedImages} deleteSelectedQuests={deleteSelectedQuests} descriptionTextareaRef={descriptionTextareaRef} distributeSelectedItems={distributeSelectedItems} duplicateSelection={duplicateSelection} handleAutoLayout={handleAutoLayout} handleConnectionLineStyleChange={handleConnectionLineStyleChange} handleSelectTab={handleSelectTab} images={images} invertSelectedDependency={invertSelectedDependency} isResizingRightSidebar={isResizingRightSidebar} isRightSidebarCollapsed={isRightSidebarCollapsed} lockedKeys={lockedKeys} pinSelectionToClipboard={pinSelectionToClipboard} quests={quests} rewardTables={rewardTables} rightSidebarWidth={rightSidebarWidth} selection={selection} setImages={setImages} setIsChapterGroupModalOpen={setIsChapterGroupModalOpen} setIsCommandModalOpen={setIsCommandModalOpen} setIsCrossChapterModalOpen={setIsCrossChapterModalOpen} setIsRewardTableModalOpen={setIsRewardTableModalOpen} setIsRightSidebarCollapsed={setIsRightSidebarCollapsed} setNbtEditor={setNbtEditor} setRightSidebarWidth={setRightSidebarWidth} setSelection={setSelection} setTextEditorConfig={setTextEditorConfig} setTexturePicker={setTexturePicker} snbtData={snbtData} startResizingRightSidebar={startResizingRightSidebar} subtitleInputRef={subtitleInputRef} titleInputRef={titleInputRef} toggleLock={toggleLock} toggleLockSelected={toggleLockSelected} updateImage={updateImage} updateQuest={updateQuest} updateSelectedCoordinates={updateSelectedCoordinates} updateState={updateState} viewMode={viewMode} />

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
    <NbtEditorModal nbtEditor={nbtEditor} setNbtEditor={setNbtEditor} showToast={showToast} />

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
