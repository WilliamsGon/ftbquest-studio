import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChapterTab } from '../types/chapter';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';
import { isFolderAccessSupported, pickQuestFolder, readQuestFolder, resolveQuestsDir, writeQuestFiles } from '../utils/folderAccess';
import type { ClassifiedFile } from '../utils/questBook';
import { classifyQuestFiles, readQuestExtras } from '../utils/questBook';
import { parseSNBT, stringifySNBT } from '../utils/snbt';
import { buildModpackFiles, exportModpackToZip } from '../utils/zipExporter';

export interface QuestFilesContext {
  saveActiveTab: (list: ChapterTab[]) => ChapterTab[];
  activeTabIdRef: React.RefObject<string>;
  chapterGroups: ChapterGroup[];
  filename: string;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  handleUpdateChapterGroups: (newGroups: ChapterGroup[]) => void;
  handleUpdateQuestBook: (newData: any) => void;
  handleUpdateRewardTables: (newTables: RewardTable[]) => void;
  images: any[];
  loadTab: (tab: ChapterTab) => void;
  questBookData: any;
  quests: any[];
  rewardTables: RewardTable[];
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDraggingFile: React.Dispatch<React.SetStateAction<boolean>>;
  setTabs: React.Dispatch<React.SetStateAction<ChapterTab[]>>;
  showToast: (message: string, type?: string) => void;
  snbtData: any;
  tabsRef: React.RefObject<ChapterTab[]>;
}

export function useQuestFiles({ saveActiveTab, activeTabIdRef, chapterGroups, filename, folderInputRef, handleUpdateChapterGroups, handleUpdateQuestBook, handleUpdateRewardTables, images, loadTab, questBookData, quests, rewardTables, setIsDirty, setIsDraggingFile, setTabs, showToast, snbtData, tabsRef }: QuestFilesContext) {
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
    if (activeTabIdRef.current) setTabs(prev => saveActiveTab(prev));

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

  return { importQuestExtras, processFiles, handleFileUpload, handleDragOver, handleDragLeave, handleDrop, handleExport, handleExportAll, collectExportOptions, handleExportZip, linkedFolder, setLinkedFolder, handleOpenFolder, handleSaveToFolder };
}
