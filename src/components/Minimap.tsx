import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Map as MapIcon, Minimize2 } from 'lucide-react';

interface MinimapProps {
  quests: any[];
  images: any[];
  selection: {
    type: 'quest' | 'image' | 'mixed' | 'dependency' | null;
    ids: (string | number)[];
    items: { type: 'quest' | 'image'; id: string | number }[];
    dependency?: { sourceId: string; targetId: string } | null;
  };
  stageScale: number;
  stagePos: { x: number; y: number };
  dimensions: { width: number; height: number };
  onNavigate: (newStagePos: { x: number; y: number }) => void;
  searchMatchedIds?: Set<string>;
  activeMatchId?: string | null;
  isPlayerMode?: boolean;
  playerCompletedQuestIds?: Set<string>;
  hiddenQuestIds?: Set<string>;
}

const SCALE_FACTOR = 40; // 1.0d = 40 world pixels
const MINIMAP_WIDTH = 220;
const MINIMAP_HEIGHT = 150;

function getDValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof val.value === 'number') return val.value;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
}

function extractDependencies(q: any): string[] {
  if (!q || !q.dependencies) return [];
  if (Array.isArray(q.dependencies)) {
    return q.dependencies.map((d: any) => typeof d === 'object' && d !== null ? d.id : String(d));
  }
  if (typeof q.dependencies === 'string') return [q.dependencies];
  if (typeof q.dependencies === 'object' && q.dependencies.id) return [q.dependencies.id];
  return [];
}

export const Minimap: React.FC<MinimapProps> = ({
  quests,
  images,
  selection,
  stageScale,
  stagePos,
  dimensions,
  onNavigate,
  searchMatchedIds,
  activeMatchId,
  isPlayerMode = false,
  playerCompletedQuestIds,
  hiddenQuestIds
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('ftb_minimap_visible');
    return saved === 'false';
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('ftb_minimap_visible', nextState ? 'false' : 'true');
  };

  // Convertir coordenadas de minimapa a posición del stage
  const navigateToMinimapCoord = useCallback((canvasX: number, canvasY: number) => {
    if (!quests || (quests.length === 0 && images.length === 0)) return;

    // Viewport en coordenadas del mundo
    const vpLeft = -stagePos.x / stageScale;
    const vpTop = -stagePos.y / stageScale;
    const vpWidth = dimensions.width / stageScale;
    const vpHeight = dimensions.height / stageScale;
    const vpRight = vpLeft + vpWidth;
    const vpBottom = vpTop + vpHeight;

    // Bounding Box del contenido
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    quests.forEach(q => {
      const qx = getDValue(q.x) * SCALE_FACTOR;
      const qy = getDValue(q.y) * SCALE_FACTOR;
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qy < minY) minY = qy;
      if (qy > maxY) maxY = qy;
    });

    images.forEach(img => {
      const ix = getDValue(img.x) * SCALE_FACTOR;
      const iy = getDValue(img.y) * SCALE_FACTOR;
      const iw = (getDValue(img.width) || 1) * SCALE_FACTOR;
      const ih = (getDValue(img.height) || 1) * SCALE_FACTOR;
      if (ix - iw / 2 < minX) minX = ix - iw / 2;
      if (ix + iw / 2 > maxX) maxX = ix + iw / 2;
      if (iy - ih / 2 < minY) minY = iy - ih / 2;
      if (iy + ih / 2 > maxY) maxY = iy + ih / 2;
    });

    if (minX === Infinity) {
      minX = -400; maxX = 400; minY = -300; maxY = 300;
    }

    const worldMinX = Math.min(minX - 120, vpLeft - 40);
    const worldMaxX = Math.max(maxX + 120, vpRight + 40);
    const worldMinY = Math.min(minY - 120, vpTop - 40);
    const worldMaxY = Math.max(maxY + 120, vpBottom + 40);

    const wWidth = Math.max(100, worldMaxX - worldMinX);
    const wHeight = Math.max(100, worldMaxY - worldMinY);

    const scale = Math.min(MINIMAP_WIDTH / wWidth, MINIMAP_HEIGHT / wHeight);
    const offsetX = (MINIMAP_WIDTH - wWidth * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - wHeight * scale) / 2;

    const targetWorldX = worldMinX + (canvasX - offsetX) / scale;
    const targetWorldY = worldMinY + (canvasY - offsetY) / scale;

    onNavigate({
      x: dimensions.width / 2 - targetWorldX * stageScale,
      y: dimensions.height / 2 - targetWorldY * stageScale
    });
  }, [quests, images, stagePos, stageScale, dimensions, onNavigate]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    navigateToMinimapCoord(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    navigateToMinimapCoord(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si no fue capturado
    }
  };

  // Renderizado del Minimapa en HTML5 Canvas
  useEffect(() => {
    if (isCollapsed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar escala HiDPI (Retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_WIDTH * dpr;
    canvas.height = MINIMAP_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    // Limpiar fondo
    ctx.fillStyle = '#12141a';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Dibujar rejilla sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < MINIMAP_WIDTH; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MINIMAP_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < MINIMAP_HEIGHT; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MINIMAP_WIDTH, y);
      ctx.stroke();
    }

    // Viewport actual
    const vpLeft = -stagePos.x / stageScale;
    const vpTop = -stagePos.y / stageScale;
    const vpWidth = dimensions.width / stageScale;
    const vpHeight = dimensions.height / stageScale;
    const vpRight = vpLeft + vpWidth;
    const vpBottom = vpTop + vpHeight;

    // Bounding Box
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    quests.forEach(q => {
      const qx = getDValue(q.x) * SCALE_FACTOR;
      const qy = getDValue(q.y) * SCALE_FACTOR;
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qy < minY) minY = qy;
      if (qy > maxY) maxY = qy;
    });

    images.forEach(img => {
      const ix = getDValue(img.x) * SCALE_FACTOR;
      const iy = getDValue(img.y) * SCALE_FACTOR;
      const iw = (getDValue(img.width) || 1) * SCALE_FACTOR;
      const ih = (getDValue(img.height) || 1) * SCALE_FACTOR;
      if (ix - iw / 2 < minX) minX = ix - iw / 2;
      if (ix + iw / 2 > maxX) maxX = ix + iw / 2;
      if (iy - ih / 2 < minY) minY = iy - ih / 2;
      if (iy + ih / 2 > maxY) maxY = iy + ih / 2;
    });

    if (minX === Infinity) {
      minX = -400; maxX = 400; minY = -300; maxY = 300;
    }

    const worldMinX = Math.min(minX - 120, vpLeft - 40);
    const worldMaxX = Math.max(maxX + 120, vpRight + 40);
    const worldMinY = Math.min(minY - 120, vpTop - 40);
    const worldMaxY = Math.max(maxY + 120, vpBottom + 40);

    const wWidth = Math.max(100, worldMaxX - worldMinX);
    const wHeight = Math.max(100, worldMaxY - worldMinY);

    const scale = Math.min(MINIMAP_WIDTH / wWidth, MINIMAP_HEIGHT / wHeight);
    const offsetX = (MINIMAP_WIDTH - wWidth * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - wHeight * scale) / 2;

    const toCanvasX = (wx: number) => offsetX + (wx - worldMinX) * scale;
    const toCanvasY = (wy: number) => offsetY + (wy - worldMinY) * scale;

    // 1. Dibujar Imágenes de Fondo (rectángulos tenues)
    images.forEach(img => {
      const ix = getDValue(img.x) * SCALE_FACTOR;
      const iy = getDValue(img.y) * SCALE_FACTOR;
      const iw = (getDValue(img.width) || 1) * SCALE_FACTOR;
      const ih = (getDValue(img.height) || 1) * SCALE_FACTOR;

      const cx = toCanvasX(ix - iw / 2);
      const cy = toCanvasY(iy - ih / 2);
      const cw = Math.max(2, iw * scale);
      const ch = Math.max(2, ih * scale);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeRect(cx, cy, cw, ch);
    });

    // 2. Dibujar Cables de Dependencias
    const questMap = new Map<string, any>();
    quests.forEach(q => questMap.set(String(q.id), q));

    quests.forEach(q => {
      const qStrId = String(q.id);
      if (isPlayerMode && hiddenQuestIds?.has(qStrId)) return;
      if (isPlayerMode && q.hide_dependency_lines === true) return;

      const dstX = toCanvasX(getDValue(q.x) * SCALE_FACTOR);
      const dstY = toCanvasY(getDValue(q.y) * SCALE_FACTOR);
      const deps = extractDependencies(q);

      deps.forEach(depId => {
        const depStrId = String(depId);
        if (isPlayerMode && hiddenQuestIds?.has(depStrId)) return;

        const srcQ = questMap.get(depStrId);
        if (srcQ) {
          const srcX = toCanvasX(getDValue(srcQ.x) * SCALE_FACTOR);
          const srcY = toCanvasY(getDValue(srcQ.y) * SCALE_FACTOR);

          ctx.beginPath();
          ctx.moveTo(srcX, srcY);
          ctx.lineTo(dstX, dstY);

          if (isPlayerMode) {
            const isSrcCompleted = playerCompletedQuestIds?.has(depStrId);
            ctx.strokeStyle = isSrcCompleted ? 'rgba(16, 185, 129, 0.7)' : 'rgba(100, 116, 139, 0.3)';
            ctx.lineWidth = isSrcCompleted ? 1.5 : 1;
          } else {
            ctx.strokeStyle = 'rgba(137, 180, 250, 0.35)';
            ctx.lineWidth = 1;
          }
          ctx.stroke();
        }
      });
    });

    // 3. Dibujar Nodos de Misiones
    const selectedIds = new Set(selection.items.filter(i => i.type === 'quest').map(i => String(i.id)));
    const hasSearchFilter = searchMatchedIds && searchMatchedIds.size > 0;

    quests.forEach(q => {
      const qStrId = String(q.id);
      if (isPlayerMode && hiddenQuestIds?.has(qStrId)) return;

      const qx = toCanvasX(getDValue(q.x) * SCALE_FACTOR);
      const qy = toCanvasY(getDValue(q.y) * SCALE_FACTOR);
      const isSelected = selectedIds.has(qStrId);
      const isSearchMatch = hasSearchFilter && searchMatchedIds.has(qStrId);
      const isActiveMatch = activeMatchId === qStrId;
      const sizeVal = (getDValue(q.size) || 1.0) * 40 * scale;
      const nodeRadius = Math.max(2.5, Math.min(6, sizeVal / 2));

      // Si es la coincidencia activa de búsqueda, dibujar anillo exterior llamativo
      if (isActiveMatch) {
        ctx.beginPath();
        ctx.arc(qx, qy, nodeRadius + 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else if (isSearchMatch) {
        ctx.beginPath();
        ctx.arc(qx, qy, nodeRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#89dceb';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(qx, qy, nodeRadius, 0, Math.PI * 2);

      if (isActiveMatch) {
        ctx.fillStyle = '#00f0ff'; // Cyan brillante
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
      } else if (isSearchMatch) {
        ctx.fillStyle = '#89dceb'; // Cyan pastel
        ctx.shadowColor = '#89dceb';
        ctx.shadowBlur = 4;
      } else if (isPlayerMode) {
        const isCompleted = playerCompletedQuestIds?.has(qStrId);
        if (isCompleted) {
          ctx.fillStyle = '#10b981'; // Verde completada
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = '#38bdf8'; // Cyan desbloqueada
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      } else if (isSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.shadowBlur = 5;
      } else if (hasSearchFilter) {
        // Atenuado si hay búsqueda activa y no coincide
        ctx.fillStyle = 'rgba(137, 180, 250, 0.25)';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#89b4fa'; // Azul FTB
        ctx.shadowBlur = 0;
      }
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = (isSelected || isActiveMatch || isSearchMatch) ? '#ffffff' : 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 4. Dibujar Recuadro de Viewport (Área visible de la cámara)
    const vpCanvasX = toCanvasX(vpLeft);
    const vpCanvasY = toCanvasY(vpTop);
    const vpCanvasW = vpWidth * scale;
    const vpCanvasH = vpHeight * scale;

    ctx.fillStyle = 'rgba(203, 166, 247, 0.12)';
    ctx.strokeStyle = '#cba6f7';
    ctx.lineWidth = 1.5;
    ctx.fillRect(vpCanvasX, vpCanvasY, vpCanvasW, vpCanvasH);
    ctx.strokeRect(vpCanvasX, vpCanvasY, vpCanvasW, vpCanvasH);

  }, [isCollapsed, quests, images, selection, stageScale, stagePos, dimensions, searchMatchedIds, activeMatchId]);

  // Si está colapsado, mostrar píldora compacta
  if (isCollapsed) {
    return (
      <button
        className="minimap-toggle-pill"
        onClick={toggleCollapse}
        title="Mostrar Mini-mapa (Radar)"
      >
        <MapIcon size={14} className="text-accent" />
        <span>Radar</span>
      </button>
    );
  }

  return (
    <div className="minimap-container glass-panel">
      {/* Encabezado del Minimapa */}
      <div className="minimap-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapIcon size={13} className="text-accent" />
          <span>Radar ({quests.length})</span>
        </div>
        <button
          className="btn-icon"
          onClick={toggleCollapse}
          title="Ocultar / Colapsar Mini-mapa"
          style={{ padding: '2px', width: '20px', height: '20px' }}
        >
          <Minimize2 size={12} />
        </button>
      </div>

      {/* Lienzo del Minimapa */}
      <canvas
        ref={canvasRef}
        className="minimap-canvas"
        style={{
          width: `${MINIMAP_WIDTH}px`,
          height: `${MINIMAP_HEIGHT}px`,
          cursor: 'crosshair',
          display: 'block'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};
