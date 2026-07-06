import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { MousePointer, Hand, Magnet } from 'lucide-react';
import Konva from 'konva';

interface CanvasProps {
  quests: any[];
  images: any[];
  layersVisible: { quests: boolean; images: boolean };
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
  onPointerPosChange?: (pos: { x: number; y: number } | null) => void;
  visibleZLevels: number[];
}

const SCALE_FACTOR = 40; // 1.0d = 40 pixels

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

  if (path.includes('textures/')) {
    urls.push(`/textures/${namespace}/${pathClean}.png`);
    urls.push(`/textures/${namespace}/${path}`);
  } else {
    // Intentar bajo textures/
    urls.push(`/textures/${namespace}/textures/${pathClean}.png`);
    // Fallbacks tradicionales
    urls.push(`/textures/${namespace}/item/${pathClean}.png`);
    urls.push(`/textures/${namespace}/block/${pathClean}.png`);
    urls.push(`/textures/${namespace}/${pathClean}.png`);
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

export const EditorCanvas: React.FC<CanvasProps> = ({ quests, images, layersVisible, selection, setSelection, updateQuest, updateImage, onPointerPosChange, visibleZLevels }) => {
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
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

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
      // Centrar el plano (0,0) en el medio de la pantalla
      setStagePos({
        x: containerRef.current.offsetWidth / 2,
        y: containerRef.current.offsetHeight / 2
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const getDValue = (obj: any) => {
    if (obj && obj.__type === 'number') return obj.value;
    if (typeof obj === 'number') return obj;
    return 0;
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
      </div>

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
                  const intersects = isZVisible && imgX1 < rectX2 && imgX2 > rectX1 && imgY1 < rectY2 && imgY2 > rectY1;
                  if (intersects) {
                    selectedImageIndices.push(idx);
                  }
                });
              }

              if (layersVisible.quests) {
                quests.forEach((q) => {
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
          if (e.target === e.target.getStage() && !startPointerPos) {
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
                  draggable
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
                          
                          let qFinalX = qOrigX + deltaX;
                          let qFinalY = qOrigY + deltaY;
                          
                          if (snapToGrid) {
                            const sizeVal = anchorQuest.size?.value ?? anchorQuest.size ?? 1.0;
                            const snapStep = sizeVal / 2;
                            qFinalX = Math.round(qFinalX / snapStep) * snapStep;
                            qFinalY = Math.round(qFinalY / snapStep) * snapStep;
                          }
                          
                          // Actualizar quests seleccionadas relativamente
                          const questUpdates = selection.items
                            .filter(item => item.type === 'quest')
                            .map(item => {
                              const qObj = quests.find(q => q.id === item.id);
                              const newQx = item.id === anchorQuest.id ? qFinalX : getDValue(qObj.x) + (qFinalX - qOrigX);
                              const newQy = item.id === anchorQuest.id ? qFinalY : getDValue(qObj.y) + (qFinalY - qOrigY);
                              return {
                                id: item.id as string,
                                updates: { x: newQx, y: newQy }
                              };
                            });
                          
                          // A todas las imágenes seleccionadas les asignamos exactamente la misma posición final de la misión ancla si snapToGrid está activo. Si no, las movemos relativamente.
                          const imageUpdates = selection.items
                            .filter(item => item.type === 'image')
                            .map(item => {
                              const imgObj = images[item.id as number];
                              return {
                                index: item.id as number,
                                updates: {
                                  x: snapToGrid ? qFinalX : getDValue(imgObj.x) + deltaX,
                                  y: snapToGrid ? qFinalY : getDValue(imgObj.y) + deltaY
                                }
                              };
                            });
                            
                          if (imageUpdates.length > 0) updateImage(imageUpdates);
                          if (questUpdates.length > 0) updateQuest(questUpdates);
                        } else {
                          // Comportamiento para imágenes múltiples sin misiones en la selección
                          const selectedImages = selection.items.filter(item => item.type === 'image');
                          
                          if (snapToGrid && selectedImages.length > 0) {
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

                            // Si encontramos un líder de orden máximo
                            if (maxOrderImgObj) {
                              const leaderOrigX = getDValue(maxOrderImgObj.x);
                              const leaderOrigY = getDValue(maxOrderImgObj.y);
                              const leaderFinalX = Math.round((leaderOrigX + deltaX) / 0.5) * 0.5;
                              const leaderFinalY = Math.round((leaderOrigY + deltaY) / 0.5) * 0.5;

                              // Todas las imágenes toman exactamente la coordenada final de este líder
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
                            } else {
                              // Fallback de seguridad si no hay orden
                              const snappedDeltaX = Math.round(deltaX / 0.5) * 0.5;
                              const snappedDeltaY = Math.round(deltaY / 0.5) * 0.5;
                              const imageUpdates = selectedImages.map(item => {
                                const imgObj = images[item.id as number];
                                return {
                                  index: item.id as number,
                                  updates: {
                                    x: getDValue(imgObj.x) + snappedDeltaX,
                                    y: getDValue(imgObj.y) + snappedDeltaY
                                  }
                                };
                              });
                              if (imageUpdates.length > 0) updateImage(imageUpdates);
                            }
                          } else {
                            // Si snapToGrid está inactivo o no hay imágenes seleccionadas
                            const imageUpdates = selectedImages.map(item => {
                              const imgObj = images[item.id as number];
                              return {
                                index: item.id as number,
                                updates: {
                                  x: getDValue(imgObj.x) + deltaX,
                                  y: getDValue(imgObj.y) + deltaY
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
                </Group>
              );
            })}
          </Layer>
        )}

        {layersVisible.quests && (
          <Layer>
            {/* Líneas de dependencia aquí (se calcularían basándose en q.dependencies) */}
            
            {quests.map((q) => {
              const x = getDValue(q.x) * SCALE_FACTOR;
              const y = getDValue(q.y) * SCALE_FACTOR;
              const sizeVal = getDValue(q.size) || 1.0;
              const nodeSize = 40 * sizeVal; // 40px es el tamaño base para size: 1.0d
              const isSelected = selection.items.some(item => item.type === 'quest' && item.id === q.id);
              
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
                  draggable
                  onClick={(e) => {
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
                        
                        // A todas las imágenes seleccionadas les asignamos exactamente la misma posición final de la misión arrastrada si snapToGrid está activo. Si no, las movemos relativamente.
                        const imageUpdates = selection.items
                          .filter(item => item.type === 'image')
                          .map(item => {
                            const imgObj = images[item.id as number];
                            return {
                              index: item.id as number,
                              updates: {
                                x: snapToGrid ? qFinalX : getDValue(imgObj.x) + deltaX,
                                y: snapToGrid ? qFinalY : getDValue(imgObj.y) + deltaY
                              }
                            };
                          });

                        if (questUpdates.length > 0) updateQuest(questUpdates);
                        if (imageUpdates.length > 0) updateImage(imageUpdates);
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
                  <FtbTexture icon={iconObj} width={nodeSize} height={nodeSize} />

                  {/* Highlight de selección */}
                  {isSelected && (
                    <Circle
                      radius={nodeSize / 2 + 4}
                      stroke="#ffffff"
                      strokeWidth={2 / stageScale}
                      dash={[5, 5]}
                    />
                  )}
                  
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
      </Stage>
    </div>
  );
};
