import React, { useState, useRef, useEffect, useMemo, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Upload, Download, Image as ImageIcon, Map as MapIcon, Plus, Settings, Trash2, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical, Table as TableIcon, Share2 } from 'lucide-react';
import { parseSNBT, stringifySNBT } from './utils/snbt';
import { v4 as uuidv4 } from 'uuid';
import { EditorCanvas } from './components/EditorCanvas';
import { TableView } from './components/TableView';

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
    type: 'quest' | 'image' | 'mixed' | null;
    ids: (string | number)[];
    items: { type: 'quest' | 'image'; id: string | number }[];
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
  const [history, setHistory] = useState<{ quests: any[]; images: any[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Portapapeles para copiar/pegar
  const [clipboard, setClipboard] = useState<{ type: 'quest' | 'image'; data: any }[]>([]);
  const clipboardRef = useRef(clipboard);

  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  const selection = {
    type: rawSelection.type,
    ids: rawSelection.ids,
    items: rawSelection.items,
    id: rawSelection.ids[0] ?? null
  };

  const setSelection = (newSel: { 
    type: 'quest' | 'image' | 'mixed' | null; 
    id?: string | number | null; 
    ids?: (string | number)[];
    items?: { type: 'quest' | 'image'; id: string | number }[];
  }) => {
    let finalItems = newSel.items || [];
    if (!newSel.items && newSel.ids && newSel.type) {
      if (newSel.type !== 'mixed' && newSel.type !== null) {
        finalItems = newSel.ids.map(id => ({ type: newSel.type as 'quest' | 'image', id }));
      }
    } else if (!newSel.items && newSel.id !== undefined && newSel.id !== null && newSel.type && newSel.type !== 'mixed') {
      finalItems = [{ type: newSel.type, id: newSel.id }];
    }

    setRawSelection({
      type: newSel.type,
      ids: newSel.ids ? newSel.ids : (newSel.id !== undefined && newSel.id !== null ? [newSel.id] : []),
      items: finalItems
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función unificada para actualizar estado y guardar en el historial
  const updateState = (newQuests: any[], newImages: any[], bypassHistory = false) => {
    setQuests(newQuests);
    setImages(newImages);
    
    if (!bypassHistory) {
      const idx = historyIndexRef.current;
      const hist = historyRef.current;
      const cleanHistory = hist.slice(0, idx + 1);
      
      const clonedQuests = JSON.parse(JSON.stringify(newQuests));
      const clonedImages = JSON.parse(JSON.stringify(newImages));
      
      const nextHistory = [...cleanHistory, { quests: clonedQuests, images: clonedImages }];
      setHistory(nextHistory);
      setHistoryIndex(cleanHistory.length);
    }
  };

  const undo = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0) {
      const prevIndex = idx - 1;
      const prevRecord = hist[prevIndex];
      setQuests(JSON.parse(JSON.stringify(prevRecord.quests)));
      setImages(JSON.parse(JSON.stringify(prevRecord.images)));
      setHistoryIndex(prevIndex);
      setSelection({ type: null, ids: [] });
    }
  };

  const redo = () => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx < hist.length - 1) {
      const nextIndex = idx + 1;
      const nextRecord = hist[nextIndex];
      setQuests(JSON.parse(JSON.stringify(nextRecord.quests)));
      setImages(JSON.parse(JSON.stringify(nextRecord.images)));
      setHistoryIndex(nextIndex);
      setSelection({ type: null, ids: [] });
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

    clip.forEach(item => {
      const origX = item.data.x?.value ?? item.data.x ?? 0;
      const origY = item.data.y?.value ?? item.data.y ?? 0;

      let targetX = origX + 0.5;
      let targetY = origY + 0.5;

      if (mousePos !== null) {
        // Calcular offset respecto al centro del grupo y colocarlo en el puntero del mouse
        const offsetX = origX - groupCenterX;
        const offsetY = origY - groupCenterY;
        targetX = mousePos.x + offsetX;
        targetY = mousePos.y + offsetY;
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

  // Event listener para atajos de teclado globales (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+C, Ctrl+V)
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const processFile = (file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseSNBT(text);
        setSnbtData(parsed);
        
        const initialQuests = parsed.quests && Array.isArray(parsed.quests) ? parsed.quests : [];
        const initialImages = parsed.images && Array.isArray(parsed.images) ? parsed.images : [];
        
        setQuests(initialQuests);
        setImages(initialImages);
        
        // Inicializar historial con estado limpio
        setHistory([{ 
          quests: JSON.parse(JSON.stringify(initialQuests)), 
          images: JSON.parse(JSON.stringify(initialImages)) 
        }]);
        setHistoryIndex(0);
      } catch (err) {
        console.error("Error parsing SNBT:", err);
        alert("Error al parsear el archivo SNBT. Revisa la consola.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.snbt')) {
        processFile(file);
      } else {
        alert('Por favor, arrastra únicamente archivos con extensión .snbt');
      }
    }
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
            <input type="file" accept=".snbt" ref={fileInputRef} className="file-input-hidden" onChange={handleFileUpload} />
            <button className="btn btn-primary btn-full" onClick={handleExport} disabled={!snbtData}>
              <Download size={16} /> Exportar
            </button>
          </div>
          {snbtData && (
            <div className="layout-toggle-container" style={{ marginTop: '10px', marginBottom: '4px' }}>
              <button 
                className={`layout-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Vista de Mapa (Canvas)"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <MapIcon size={14} /> Mapa
              </button>
              <button 
                className={`layout-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vista de Tabla"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <TableIcon size={14} /> Tabla
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

      {/* Canvas Central o Vista de Tabla */}
      {!snbtData ? (
        <div className="canvas-container">
          <div className="empty-state">
            <MapIcon size={48} opacity={0.5} />
            <h2>Carga un archivo .snbt para empezar</h2>
            <p>El canvas interactivo se mostrará aquí.</p>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="canvas-container">
          <EditorCanvas 
            quests={quests}
            images={images}
            layersVisible={layers}
            selection={selection}
            setSelection={setSelection}
            updateQuest={updateQuest}
            updateImage={updateImage}
            onPointerPosChange={(pos) => mouseCanvasPosRef.current = pos}
            onQuestContextMenu={handleQuestContextMenu}
            visibleZLevels={visibleZLevels}
          />
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

      {/* Sidebar Derecha - Propiedades */}
      {viewMode === 'map' && (
        <div className="sidebar-right glass-panel">
        <div className="header">
          <h1><Settings size={20} /> Propiedades</h1>
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

          {selection.items.length === 0 && (
            <div className="empty-state">
              <p>Selecciona una misión o imagen para ver sus propiedades.</p>
            </div>
          )}
          
          {selection.type === 'image' && selection.id !== null && (
            <div>
              <h2 className="section-title">Imagen Seleccionada</h2>
              <div className="input-group">
                <label>Textura (URL/Path)</label>
                <input type="text" className="input-field" 
                  value={images[selection.id as number]?.image || ''} 
                  onChange={(e) => updateImage(selection.id as number, { image: e.target.value })}
                />
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
              <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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

          {selection.type === 'quest' && selection.id !== null && (() => {
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
                <h2 className="section-title">Misión Seleccionada</h2>
                <div className="input-group">
                  <label>ID</label>
                  <input type="text" className="input-field" readOnly value={selection.id as string} />
                </div>
                <div className="input-group">
                  <label>Título</label>
                  <input type="text" className="input-field" 
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
                  <label>Descripción</label>
                  <textarea className="input-field" rows={3}
                    value={(selectedQuest.description || []).join('\n')}
                    onChange={(e) => updateQuest(selection.id as string, { description: e.target.value.split('\n') })}
                  />
                </div>
                <div className="row">
                  <div className="input-group">
                    <label>Forma (Shape)</label>
                    <select className="input-field" 
                      value={selectedQuest.shape || 'circle'}
                      onChange={(e) => updateQuest(selection.id as string, { shape: e.target.value })}
                    >
                      <option value="circle">Circle</option>
                      <option value="gear">Gear</option>
                      <option value="octagon">Octagon</option>
                      <option value="rsquare">Rounded Square</option>
                      <option value="diamond">Diamond</option>
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
                        const depTitle = depQuest ? String(getDValue(depQuest.title) || depQuest.id) : depId;
                        return (
                          <div 
                            key={depId} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              background: 'rgba(255,255,255,0.02)', 
                              padding: '6px 10px', 
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            <span 
                              style={{ fontSize: '0.8rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}
                              title={depQuest ? `${depTitle} (${depId})` : depId}
                            >
                              🔗 {depTitle}
                            </span>
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--danger-color)', padding: '2px' }}
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
                              <Trash2 size={14} />
                            </button>
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
                        <option value="" disabled>Añadir requisito...</option>
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
                </div>

                {/* Tasks Section */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem' }}>Tareas (Tasks)</h3>
                    <button className="btn-icon" onClick={() => {
                      const newTasks = [...tasksArray, { id: generateHexId(), type: 'item', item: 'minecraft:stone', count: { __type: 'number', value: 1, suffix: 'L' } }];
                      updateQuest(selection.id as string, { tasks: newTasks });
                    }}><Plus size={16} /></button>
                  </div>
                  {tasksArray.map((task: any, tIdx: number) => {
                    if (!task) return null;
                    return (
                      <div key={task.id || tIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <select className="input-field" style={{ width: 'auto', padding: '2px 8px', height: 'auto', fontSize: '0.8rem' }}
                            value={task.type || 'item'}
                            onChange={(e) => {
                              const newTasks = [...tasksArray];
                              const newType = e.target.value;
                              newTasks[tIdx] = { ...newTasks[tIdx], type: newType };
                              if (newType === 'checkmark' && !newTasks[tIdx].title) newTasks[tIdx].title = "Checkmark";
                              if (newType === 'item' && !newTasks[tIdx].item) {
                                newTasks[tIdx].item = "minecraft:stone";
                                newTasks[tIdx].count = { __type: 'number', value: 1, suffix: 'L' };
                              }
                              updateQuest(selection.id as string, { tasks: newTasks });
                            }}
                          >
                            <option value="item">Item</option>
                            <option value="checkmark">Checkmark</option>
                          </select>
                          <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--danger-color)' }} onClick={() => {
                            const newTasks = [...tasksArray];
                            newTasks.splice(tIdx, 1);
                            updateQuest(selection.id as string, { tasks: newTasks });
                          }} />
                        </div>
                        {task.type === 'item' && (
                          <div className="row" style={{ flexDirection: 'column', gap: '8px' }}>
                            <div className="row">
                              <div className="input-group" style={{ flex: 2 }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input type="text" className="input-field" value={typeof task.item === 'string' ? task.item : (task.item?.id || '')} placeholder="Item (ej. minecraft:dirt)" 
                                    onChange={(e) => {
                                      const newTasks = [...tasksArray];
                                      if (typeof newTasks[tIdx].item === 'object' && newTasks[tIdx].item !== null) {
                                        newTasks[tIdx].item = { ...newTasks[tIdx].item, id: e.target.value };
                                      } else {
                                        newTasks[tIdx].item = e.target.value;
                                      }
                                      updateQuest(selection.id as string, { tasks: newTasks });
                                    }}
                                  />
                                  <button className="btn-icon" title="Editar NBT Avanzado" onClick={() => {
                                    setNbtEditor({
                                      title: 'Editar Item NBT (Task)',
                                      value: JSON.stringify(tasksArray[tIdx].item, null, 2),
                                      onSave: (newVal) => {
                                        const newTasks = [...tasksArray];
                                        newTasks[tIdx].item = newVal;
                                        updateQuest(selection.id as string, { tasks: newTasks });
                                      }
                                    });
                                  }}><Settings size={16} /></button>
                                </div>
                              </div>
                              <div className="input-group" style={{ flex: 1 }}>
                                <input type="number" className="input-field" value={task.count?.value || task.count || 1} placeholder="Cantidad"
                                  onChange={(e) => {
                                    const newTasks = [...tasksArray];
                                    newTasks[tIdx].count = { __type: 'number', value: parseInt(e.target.value), suffix: 'L' };
                                    updateQuest(selection.id as string, { tasks: newTasks });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <input type="checkbox" id={`consume_items_${tIdx}`}
                                checked={task.consume_items || false}
                                onChange={(e) => {
                                  const newTasks = [...tasksArray];
                                  newTasks[tIdx].consume_items = e.target.checked;
                                  updateQuest(selection.id as string, { tasks: newTasks });
                                }}
                              />
                              <label htmlFor={`consume_items_${tIdx}`} style={{ marginLeft: '8px', marginBottom: 0, fontSize: '0.8rem', cursor: 'pointer' }}>Consumir ítems al entregarlos</label>
                            </div>
                          </div>
                        )}
                        {task.type === 'checkmark' && (
                          <div className="input-group">
                            <input type="text" className="input-field" value={task.title || ''} placeholder="Título de la tarea"
                              onChange={(e) => {
                                const newTasks = [...tasksArray];
                                newTasks[tIdx].title = e.target.value;
                                updateQuest(selection.id as string, { tasks: newTasks });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rewards Section */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem' }}>Recompensas (Rewards)</h3>
                    <button className="btn-icon" onClick={() => {
                      const newRewards = [...rewardsArray, { id: generateHexId(), type: 'xp', xp: 10 }];
                      updateQuest(selection.id as string, { rewards: newRewards });
                    }}><Plus size={16} /></button>
                  </div>
                  {rewardsArray.map((reward: any, rIdx: number) => {
                    if (!reward) return null;
                    return (
                      <div key={reward.id || rIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <select className="input-field" style={{ width: 'auto', padding: '2px 8px', height: 'auto', fontSize: '0.8rem' }}
                            value={reward.type || 'xp'}
                            onChange={(e) => {
                              const newRewards = [...rewardsArray];
                              const newType = e.target.value;
                              newRewards[rIdx] = { ...newRewards[rIdx], type: newType };
                              if (newType === 'xp' && newRewards[rIdx].xp === undefined) newRewards[rIdx].xp = 10;
                              if (newType === 'xp_levels' && newRewards[rIdx].xp_levels === undefined) newRewards[rIdx].xp_levels = 5;
                              if (newType === 'command' && newRewards[rIdx].command === undefined) newRewards[rIdx].command = "";
                              if (newType === 'item' && !newRewards[rIdx].item) {
                                newRewards[rIdx].item = "minecraft:stone";
                                newRewards[rIdx].count = 1;
                              }
                              updateQuest(selection.id as string, { rewards: newRewards });
                            }}
                          >
                            <option value="xp">XP</option>
                            <option value="xp_levels">XP Levels</option>
                            <option value="command">Command</option>
                            <option value="item">Item</option>
                          </select>
                          <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--danger-color)' }} onClick={() => {
                            const newRewards = [...rewardsArray];
                            newRewards.splice(rIdx, 1);
                            updateQuest(selection.id as string, { rewards: newRewards });
                          }} />
                        </div>
                        {reward.type === 'xp' && (
                          <div className="input-group">
                            <input type="number" className="input-field" value={getDValue(reward.xp) ?? 0} placeholder="Cantidad de XP"
                              onChange={(e: any) => {
                                const newRewards = [...rewardsArray];
                                const val = parseInt(e.target.value);
                                if (typeof newRewards[rIdx].xp === 'object' && newRewards[rIdx].xp !== null) {
                                  newRewards[rIdx].xp = { ...newRewards[rIdx].xp, value: val };
                                } else {
                                  newRewards[rIdx].xp = val;
                                }
                                updateQuest(selection.id as string, { rewards: newRewards });
                              }}
                            />
                          </div>
                        )}
                        {reward.type === 'xp_levels' && (
                          <div className="input-group">
                            <input type="number" className="input-field" value={getDValue(reward.xp_levels) ?? 0} placeholder="Niveles de XP"
                              onChange={(e: any) => {
                                const newRewards = [...rewardsArray];
                                const val = parseInt(e.target.value);
                                if (typeof newRewards[rIdx].xp_levels === 'object' && newRewards[rIdx].xp_levels !== null) {
                                  newRewards[rIdx].xp_levels = { ...newRewards[rIdx].xp_levels, value: val };
                                } else {
                                  newRewards[rIdx].xp_levels = val;
                                }
                                updateQuest(selection.id as string, { rewards: newRewards });
                              }}
                            />
                          </div>
                        )}
                        {reward.type === 'command' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="input-group">
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Comando</label>
                              <input type="text" className="input-field" value={reward.command || ''} placeholder="Comando (ej. /give @p diamond 1)"
                                onChange={(e: any) => {
                                  const newRewards = [...rewardsArray];
                                  newRewards[rIdx].command = e.target.value;
                                  updateQuest(selection.id as string, { rewards: newRewards });
                                }}
                              />
                            </div>
                            <div className="row" style={{ gap: '10px' }}>
                              <div className="input-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Otorga Auto (auto)</label>
                                <select className="input-field" style={{ fontSize: '0.8rem', height: '32px' }}
                                  value={reward.auto || 'default'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const newRewards = [...rewardsArray];
                                    if (val === 'default') {
                                      delete newRewards[rIdx].auto;
                                    } else {
                                      newRewards[rIdx].auto = val;
                                    }
                                    updateQuest(selection.id as string, { rewards: newRewards });
                                  }}
                                >
                                  <option value="default">Por Defecto</option>
                                  <option value="enabled">Enabled (Auto)</option>
                                  <option value="disabled">Disabled (Manual)</option>
                                  <option value="invisible">Invisible</option>
                                  <option value="no_toast">No Toast</option>
                                </select>
                              </div>
                              <div className="input-group" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginTop: '14px' }}>
                                <input type="checkbox" id={`elevate_perms_${rIdx}`}
                                  checked={reward.elevate_perms || false}
                                  onChange={(e) => {
                                    const newRewards = [...rewardsArray];
                                    if (e.target.checked) {
                                      newRewards[rIdx].elevate_perms = true;
                                    } else {
                                      delete newRewards[rIdx].elevate_perms;
                                    }
                                    updateQuest(selection.id as string, { rewards: newRewards });
                                  }}
                                />
                                <label htmlFor={`elevate_perms_${rIdx}`} style={{ fontSize: '0.8rem', marginBottom: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>Elevar Permisos</label>
                              </div>
                            </div>
                          </div>
                        )}
                        {reward.type === 'item' && (() => {
                          const rewardCountVal = reward.count !== undefined 
                            ? getDValue(reward.count) 
                            : (typeof reward.item === 'object' && reward.item !== null
                                ? (getDValue(reward.item.Count) ?? getDValue(reward.item.count) ?? 1)
                                : 1);

                          return (
                            <div className="row">
                              <div className="input-group" style={{ flex: 2 }}>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="text" className="input-field" value={typeof reward.item === 'string' ? reward.item : (reward.item?.id || '')} placeholder="Item (ej. minecraft:dirt)" 
                                      onChange={(e) => {
                                        const newRewards = [...rewardsArray];
                                        if (typeof newRewards[rIdx].item === 'object' && newRewards[rIdx].item !== null) {
                                          newRewards[rIdx].item = { ...newRewards[rIdx].item, id: e.target.value };
                                        } else {
                                          newRewards[rIdx].item = e.target.value;
                                        }
                                        updateQuest(selection.id as string, { rewards: newRewards });
                                      }}
                                    />
                                    <button className="btn-icon" title="Editar NBT Avanzado" onClick={() => {
                                      setNbtEditor({
                                        title: 'Editar Item NBT (Reward)',
                                        value: JSON.stringify(rewardsArray[rIdx].item, null, 2),
                                        onSave: (newVal) => {
                                          const newRewards = [...rewardsArray];
                                          newRewards[rIdx].item = newVal;
                                          updateQuest(selection.id as string, { rewards: newRewards });
                                        }
                                      });
                                    }}><Settings size={16} /></button>
                                  </div>
                                </div>
                              <div className="input-group" style={{ flex: 1 }}>
                                <input type="number" className="input-field" value={rewardCountVal} placeholder="Cantidad"
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const newRewards = [...rewardsArray];
                                    
                                    if (typeof reward.item === 'object' && reward.item !== null && (reward.item.Count !== undefined || reward.item.count !== undefined)) {
                                      const isCapitalCount = reward.item.Count !== undefined;
                                      const countKey = isCapitalCount ? 'Count' : 'count';
                                      const currentCountObj = reward.item[countKey];
                                      
                                      newRewards[rIdx].item = {
                                        ...reward.item,
                                        [countKey]: typeof currentCountObj === 'object' && currentCountObj !== null
                                          ? { ...currentCountObj, value: val }
                                          : val
                                      };
                                    } else {
                                      if (typeof reward.count === 'object' && reward.count !== null) {
                                        newRewards[rIdx].count = { ...reward.count, value: val };
                                      } else {
                                        newRewards[rIdx].count = val;
                                      }
                                    }
                                    updateQuest(selection.id as string, { rewards: newRewards });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Delete Quest Section */}
                <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                alert('Error al parsear JSON: ' + e.message);
              }
            }}>Guardar NBT</button>
          </div>
        </div>
      </div>
    )}

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
    </>
    </ErrorBoundary>
  );
}

export default App;
