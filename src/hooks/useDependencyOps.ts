import React from 'react';

export interface DependencyOpsContext {
  contextMenu: { visible: boolean; x: number; y: number; targetQuestId: string | null; };
  images: any[];
  quests: any[];
  rawSelection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; dependency?: { sourceId: string; targetId: string; } | null | undefined; };
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setContextMenu: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; targetQuestId: string | null; }>>;
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  showToast: (message: string, type?: string) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
  updateState: (newQuests: any[], newImages: any[], bypassHistory?: boolean, newSnbtData?: any) => void;
}

export function useDependencyOps({ contextMenu, images, quests, rawSelection, selection, setContextMenu, setSelection, showToast, updateQuest, updateState }: DependencyOpsContext) {
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

  return { clearSelectedDependencies, handleConnectQuests, invertSelectedDependency, deleteSelectedDependency, makeSelectedDependOnTarget, removeSelectedDependencyOnTarget, makeTargetDependOnSelected, removeTargetDependencyOnSelected };
}
