import { getDValue } from './appHelpers';
/**
 * Alineación y distribución de la selección en el lienzo (funciones puras).
 * Devuelven las misiones e imágenes actualizadas, o null si no hay nada que hacer.
 */
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export interface SelectionItem { type: 'quest' | 'image'; id: string | number }
export interface SelectionOpResult { quests: any[]; images: any[]; message?: string }

export function alignItems(selectionItems: SelectionItem[], quests: any[], images: any[], alignType: AlignType) {
  if (selectionItems.length <= 1) return null;

  // 1. Calcular cajas delimitadoras de cada elemento
  const boundsList = selectionItems.map(item => {
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

  return { quests: newQuests, images: newImages };
};

export function distributeItems(selectionItems: SelectionItem[], quests: any[], images: any[], axis: 'horizontal' | 'vertical') {
  if (selectionItems.length < 3) return null;

  const boundsList = selectionItems.map(item => {
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
    if (Math.abs(span) < 0.001) return null;
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

    return { quests: newQuests, images: newImages, message: 'Elementos distribuidos horizontalmente' };
  } else {
    boundsList.sort((a, b) => a.y - b.y);
    const firstY = boundsList[0].y;
    const lastY = boundsList[boundsList.length - 1].y;
    const span = lastY - firstY;
    if (Math.abs(span) < 0.001) return null;
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

    return { quests: newQuests, images: newImages, message: 'Elementos distribuidos verticalmente' };
  }
};
