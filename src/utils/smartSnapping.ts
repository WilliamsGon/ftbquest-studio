export interface RectBounds {
  id?: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export interface AlignmentGuide {
  id: string;
  orientation: 'vertical' | 'horizontal';
  position: number; // Coordenada fija (x para vertical, y para horizontal)
  start: number;    // Inicio del segmento (y para vertical, x para horizontal)
  end: number;      // Fin del segmento (y para vertical, x para horizontal)
  type: 'center' | 'edge';
  label?: string;
}

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
}

/**
 * Calcula guías inteligentes y ajuste magnético (Smart Snapping)
 * comparando el elemento arrastrado contra elementos estáticos en el lienzo.
 */
export function computeSmartSnapping(
  draggingCenter: { x: number; y: number },
  draggingSize: { width: number; height: number },
  staticItems: RectBounds[],
  threshold: number = 6
): SnapResult {
  let snappedX = draggingCenter.x;
  let snappedY = draggingCenter.y;
  const guides: AlignmentGuide[] = [];

  const dragHalfW = draggingSize.width / 2;
  const dragHalfH = draggingSize.height / 2;

  // Puntos clave X del elemento arrastrado
  const dragXCandidates = [
    { type: 'center' as const, val: draggingCenter.x, offset: 0, label: 'Centro X' },
    { type: 'edge' as const, val: draggingCenter.x - dragHalfW, offset: -dragHalfW, label: 'Borde Izq' },
    { type: 'edge' as const, val: draggingCenter.x + dragHalfW, offset: dragHalfW, label: 'Borde Der' },
  ];

  // Puntos clave Y del elemento arrastrado
  const dragYCandidates = [
    { type: 'center' as const, val: draggingCenter.y, offset: 0, label: 'Centro Y' },
    { type: 'edge' as const, val: draggingCenter.y - dragHalfH, offset: -dragHalfH, label: 'Borde Sup' },
    { type: 'edge' as const, val: draggingCenter.y + dragHalfH, offset: dragHalfH, label: 'Borde Inf' },
  ];

  let minDiffX = Infinity;
  let bestSnapX: number | null = null;
  let matchedStaticXList: { item: RectBounds; targetVal: number; type: 'center' | 'edge'; label: string }[] = [];

  // Buscar mejor alineación en X
  for (const dragX of dragXCandidates) {
    for (const item of staticItems) {
      const targetCandidates = [
        { type: 'center' as const, val: item.centerX, label: 'Centro X' },
        { type: 'edge' as const, val: item.left, label: 'Borde Izq' },
        { type: 'edge' as const, val: item.right, label: 'Borde Der' },
      ];

      for (const target of targetCandidates) {
        const diff = Math.abs(dragX.val - target.val);
        if (diff <= threshold) {
          if (diff < minDiffX - 0.001) {
            minDiffX = diff;
            bestSnapX = target.val - dragX.offset;
            matchedStaticXList = [{ item, targetVal: target.val, type: target.type, label: target.label }];
          } else if (Math.abs(diff - minDiffX) < 0.001) {
            matchedStaticXList.push({ item, targetVal: target.val, type: target.type, label: target.label });
          }
        }
      }
    }
  }

  // Buscar mejor alineación en Y
  let minDiffY = Infinity;
  let bestSnapY: number | null = null;
  let matchedStaticYList: { item: RectBounds; targetVal: number; type: 'center' | 'edge'; label: string }[] = [];

  for (const dragY of dragYCandidates) {
    for (const item of staticItems) {
      const targetCandidates = [
        { type: 'center' as const, val: item.centerY, label: 'Centro Y' },
        { type: 'edge' as const, val: item.top, label: 'Borde Sup' },
        { type: 'edge' as const, val: item.bottom, label: 'Borde Inf' },
      ];

      for (const target of targetCandidates) {
        const diff = Math.abs(dragY.val - target.val);
        if (diff <= threshold) {
          if (diff < minDiffY - 0.001) {
            minDiffY = diff;
            bestSnapY = target.val - dragY.offset;
            matchedStaticYList = [{ item, targetVal: target.val, type: target.type, label: target.label }];
          } else if (Math.abs(diff - minDiffY) < 0.001) {
            matchedStaticYList.push({ item, targetVal: target.val, type: target.type, label: target.label });
          }
        }
      }
    }
  }

  // Aplicar imán en X si hubo coincidencia
  if (bestSnapX !== null) {
    snappedX = bestSnapX;
    
    // Crear guía vertical
    const targetX = matchedStaticXList[0].targetVal;
    let minY = snappedY - dragHalfH;
    let maxY = snappedY + dragHalfH;

    matchedStaticXList.forEach(({ item }) => {
      minY = Math.min(minY, item.top);
      maxY = Math.max(maxY, item.bottom);
    });

    const padding = 20;
    guides.push({
      id: `guide-v-${targetX}`,
      orientation: 'vertical',
      position: targetX,
      start: minY - padding,
      end: maxY + padding,
      type: matchedStaticXList[0].type,
      label: matchedStaticXList[0].label
    });
  }

  // Aplicar imán en Y si hubo coincidencia
  if (bestSnapY !== null) {
    snappedY = bestSnapY;

    // Crear guía horizontal
    const targetY = matchedStaticYList[0].targetVal;
    let minX = snappedX - dragHalfW;
    let maxX = snappedX + dragHalfW;

    matchedStaticYList.forEach(({ item }) => {
      minX = Math.min(minX, item.left);
      maxX = Math.max(maxX, item.right);
    });

    const padding = 20;
    guides.push({
      id: `guide-h-${targetY}`,
      orientation: 'horizontal',
      position: targetY,
      start: minX - padding,
      end: maxX + padding,
      type: matchedStaticYList[0].type,
      label: matchedStaticYList[0].label
    });
  }

  return {
    snappedX,
    snappedY,
    guides
  };
}
