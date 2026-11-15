import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChapterTab } from '../types/chapter';
import { generateHexId } from '../utils/appHelpers';

type ShowToast = (message: string, type?: string) => void;

/**
 * Documento abierto en el editor: capítulo activo (misiones, imágenes, datos SNBT), pestañas,
 * historial de deshacer/rehacer, selección y bloqueos. Concentra todo el estado que cambia
 * al conmutar de pestaña para que se guarde y restaure de una vez.
 */
export function useChapterDocument(showToast: ShowToast) {
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

  const [lockedKeys, setLockedKeys] = useState<string[]>([]);

  const [rawSelection, setRawSelection] = useState<{
    type: 'quest' | 'image' | 'mixed' | 'dependency' | null;
    ids: (string | number)[];
    items: { type: 'quest' | 'image'; id: string | number }[];
    dependency?: { sourceId: string; targetId: string } | null;
  }>({ type: null, ids: [], items: [] });

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

  useEffect(() => {
    questsRef.current = quests;
    imagesRef.current = images;
    selectionRef.current = selection;
  }, [quests, images, selection]);

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

  /** Vuelca el estado en edición (capítulo, historial, selección, cámara…) sobre la pestaña activa. */
  const saveActiveTab = (list: ChapterTab[]): ChapterTab[] =>
    list.map(t => t.id !== activeTabIdRef.current ? t : {
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
    });

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
    // Guardar el estado de la pestaña actual antes de conmutar
    if (activeTabIdRef.current) setTabs(prev => saveActiveTab(prev));

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

    setTabs(prev => [...(activeTabIdRef.current ? saveActiveTab(prev) : prev), newTab]);

    loadTab(newTab);
    showToast(`Nuevo capítulo "Nuevo Capítulo ${newIndex}" creado`, 'success');
  };

  return {
    snbtData, setSnbtData, filename, setFilename, viewMode, setViewMode,
    quests, setQuests, images, setImages,
    tabs, setTabs, activeTabId, setActiveTabId, isDirty, setIsDirty, currentCameraRef,
    rawSelection, lockedKeys, setLockedKeys, selection, setSelection,
    history, historyIndex, historyRef, historyIndexRef, tabsRef, activeTabIdRef, isDirtyRef,
    questsRef, imagesRef, selectionRef,
    updateState, undo, redo, saveActiveTab, loadTab, handleSelectTab, handleCloseTab, handleNewBlankTab,
  };
}
