import React from 'react';
import { generateHexId, getDValue } from '../utils/appHelpers';

export interface useSelectionOpsContext {
  clipboardRef: React.RefObject<{ type: "quest" | "image"; data: any; }[]>;
  currentCameraRef: React.RefObject<{ pos?: { x: number; y: number; } | undefined; scale: number; }>;
  images: any[];
  imagesRef: React.RefObject<any[]>;
  lockedKeys: string[];
  mouseCanvasPosRef: React.RefObject<{ x: number; y: number; } | null>;
  pinnedAssets: any[];
  quests: any[];
  questsRef: React.RefObject<any[]>;
  savePinnedAssets: (assets: any[]) => void;
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  selectionRef: React.RefObject<{ type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; }>;
  setClipboard: React.Dispatch<React.SetStateAction<{ type: "quest" | "image"; data: any; }[]>>;
  setLockedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  showToast: (message: string, type?: string) => void;
  snapToGrid: boolean;
  snbtData: any;
  updateState: (newQuests: any[], newImages: any[], bypassHistory?: boolean, newSnbtData?: any) => void;
}

export function useSelectionOps({ clipboardRef, currentCameraRef, images, imagesRef, lockedKeys, mouseCanvasPosRef, pinnedAssets, quests, questsRef, savePinnedAssets, selection, selectionRef, setClipboard, setLockedKeys, setSelection, showToast, snapToGrid, snbtData, updateState }: useSelectionOpsContext) {
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

  return { copyToClipboard, pasteFromClipboard, toggleLock, toggleLockSelected, duplicateSelection, pinSelectionToClipboard, pastePinnedAsset };
}
