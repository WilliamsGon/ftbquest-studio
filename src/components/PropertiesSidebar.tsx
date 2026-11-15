import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalDistributeCenter, AlignStartHorizontal, AlignStartVertical, AlignVerticalDistributeCenter, ChevronRight, Copy, ExternalLink, Globe, Lock, Maximize2, RotateCcw, Search, Settings, Share2, Sparkles, Terminal, Trash2, Unlock } from 'lucide-react';
import type React from 'react';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';
import { decimalToHexColor, getDValue, getItemX, getItemY, hexColorToDecimal } from '../utils/appHelpers';
import { parseMinecraftText } from '../utils/minecraftText';
import { QuestItemThumbnail } from '../utils/textureHelper';
import { MinecraftFormattedPreview } from './MinecraftFormattedPreview';
import { MinecraftTextToolbar } from './MinecraftTextToolbar';
import { QuestTaskRewardManager } from './QuestTaskRewardManager';

export interface PropertiesSidebarProps {
  Array: ArrayConstructor;
  JSON: JSON;
  Math: Math;
  Number: NumberConstructor;
  String: StringConstructor;
  alignSelectedItems: (alignType: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  allChaptersQuestsMap: Map<string, { quest: any; chapterId: string; chapterTitle: string; tabId: string; }>;
  chapterGroups: ChapterGroup[];
  clearSelectedDependencies: () => void;
  connectionLineStyle: "bezier" | "straight" | "orthogonal";
  deleteQuest: (id: string) => void;
  deleteSelectedDependency: () => void;
  deleteSelectedImages: () => void;
  deleteSelectedQuests: () => void;
  descriptionTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  distributeSelectedItems: (axis: "horizontal" | "vertical") => void;
  duplicateSelection: () => void;
  handleAutoLayout: (direction?: "LR" | "TB", onlySelected?: boolean) => void;
  handleConnectionLineStyleChange: (style: "bezier" | "straight" | "orthogonal") => void;
  handleSelectTab: (targetId: string) => void;
  images: any[];
  invertSelectedDependency: () => void;
  isResizingRightSidebar: boolean;
  isRightSidebarCollapsed: boolean;
  lockedKeys: string[];
  pinSelectionToClipboard: () => void;
  quests: any[];
  rewardTables: RewardTable[];
  rightSidebarWidth: number;
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setImages: React.Dispatch<React.SetStateAction<any[]>>;
  setIsChapterGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCommandModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCrossChapterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRewardTableModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRightSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setNbtEditor: React.Dispatch<React.SetStateAction<{ title: string; value: string; onSave: (val: any) => void; } | null>>;
  setRightSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  setTextEditorConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean; fieldTitle: string; initialValue: string | string[]; isMultiline: boolean; onSave: (val: any) => void; }>>;
  setTexturePicker: React.Dispatch<React.SetStateAction<{ isOpen: boolean; targetType: "image" | "icon"; onSelect: (val: string) => void; title: string; } | null>>;
  snbtData: any;
  startResizingRightSidebar: (e: React.MouseEvent) => void;
  subtitleInputRef: React.RefObject<HTMLInputElement | null>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  toggleLock: (key: string) => void;
  toggleLockSelected: () => void;
  updateImage: (indexOrUpdatesList: number | { index: number; updates: any; }[], updates?: any) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
  updateSelectedCoordinates: (axis: "x" | "y", val: number) => void;
  updateState: (newQuests: any[], newImages: any[], bypassHistory?: boolean, newSnbtData?: any) => void;
  viewMode: "map" | "table";
}

export function PropertiesSidebar({ Array, JSON, Math, Number, String, alignSelectedItems, allChaptersQuestsMap, chapterGroups, clearSelectedDependencies, connectionLineStyle, deleteQuest, deleteSelectedDependency, deleteSelectedImages, deleteSelectedQuests, descriptionTextareaRef, distributeSelectedItems, duplicateSelection, handleAutoLayout, handleConnectionLineStyleChange, handleSelectTab, images, invertSelectedDependency, isResizingRightSidebar, isRightSidebarCollapsed, lockedKeys, pinSelectionToClipboard, quests, rewardTables, rightSidebarWidth, selection, setImages, setIsChapterGroupModalOpen, setIsCommandModalOpen, setIsCrossChapterModalOpen, setIsRewardTableModalOpen, setIsRightSidebarCollapsed, setNbtEditor, setRightSidebarWidth, setSelection, setTextEditorConfig, setTexturePicker, snbtData, startResizingRightSidebar, subtitleInputRef, titleInputRef, toggleLock, toggleLockSelected, updateImage, updateQuest, updateSelectedCoordinates, updateState, viewMode }: PropertiesSidebarProps) {
  return (
    <>
      {viewMode === 'map' && !isRightSidebarCollapsed && (
        <div 
          className="sidebar-right glass-panel"
          style={{
            width: `${rightSidebarWidth}px`,
            minWidth: `${rightSidebarWidth}px`,
            maxWidth: `${rightSidebarWidth}px`,
            position: 'relative',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            transition: isResizingRightSidebar ? 'none' : 'width 0.15s ease'
          }}
        >
          {/* Asa de redimensionamiento izquierda */}
          <div
            className={`sidebar-resize-handle ${isResizingRightSidebar ? 'active' : ''}`}
            onMouseDown={startResizingRightSidebar}
            title="Arrastra para ajustar el ancho del panel lateral"
          />

          <div className="sidebar-right-header">
            <h1>
              <Settings size={17} className="text-accent" />
              <span>Propiedades</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {rightSidebarWidth !== 320 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRightSidebarWidth(320);
                    localStorage.setItem('ftb_right_sidebar_width', '320');
                  }}
                  title="Restablecer al ancho vanilla original (320px)"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>320px</span>
                </button>
              )}
              <button
                className="btn-icon"
                onClick={() => setIsRightSidebarCollapsed(true)}
                title="Colapsar panel lateral de propiedades"
                style={{ padding: '4px', width: '26px', height: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={17} />
              </button>
            </div>
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

              {/* Botones de Distribución Equidistante */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }} 
                  onClick={() => distributeSelectedItems('horizontal')} 
                  disabled={selection.items.length < 3}
                  title={selection.items.length < 3 ? "Selecciona al menos 3 elementos para distribuir" : "Distribuir horizontalmente con espaciado uniforme"}
                >
                  <AlignHorizontalDistributeCenter size={16} /> Distribuir X
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }} 
                  onClick={() => distributeSelectedItems('vertical')} 
                  disabled={selection.items.length < 3}
                  title={selection.items.length < 3 ? "Selecciona al menos 3 elementos para distribuir" : "Distribuir verticalmente con espaciado uniforme"}
                >
                  <AlignVerticalDistributeCenter size={16} /> Distribuir Y
                </button>
              </div>

              {/* Botones de acción rápida en lote: Duplicar y Bloquear */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  onClick={duplicateSelection}
                  title="Duplicar selección (Ctrl+D)"
                >
                  <Copy size={15} /> Duplicar
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                  onClick={toggleLockSelected}
                  title="Bloquear / Desbloquear selección para evitar movimientos accidentales"
                >
                  {selection.items.every(item => lockedKeys.includes(item.type === 'quest' ? `quest-${item.id}` : `img-${item.id}`)) ? (
                    <><Unlock size={15} /> Desbloquear</>
                  ) : (
                    <><Lock size={15} /> Bloquear</>
                  )}
                </button>
              </div>

              {/* Botones de Auto-Organizar Selección */}
              {selection.items.filter(i => i.type === 'quest').length > 1 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Árbol de Dependencias
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                      onClick={() => handleAutoLayout('LR', true)}
                      title="Auto-organizar las misiones seleccionadas horizontalmente por dependencias"
                    >
                      <Sparkles size={14} className="text-accent" /> Árbol H
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                      onClick={() => handleAutoLayout('TB', true)}
                      title="Auto-organizar las misiones seleccionadas verticalmente por dependencias"
                    >
                      <Sparkles size={14} className="text-accent" /> Árbol V
                    </button>
                  </div>
                </div>
              )}

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

              {/* Propiedades comunes de Misiones masivas */}
              {(() => {
                const selectedQuests = selection.items.filter(item => item.type === 'quest');
                if (selectedQuests.length === 0) return null;

                const firstQuestObj = quests.find(q => q && q.id === selectedQuests[0].id);

                // Icono / Imagen común
                const firstIcon = firstQuestObj?.icon || '';
                const shareSameIcon = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (q?.icon || '') === firstIcon;
                });

                // Forma (Shape) común
                const firstShapeVal = firstQuestObj?.shape || 'default';
                const shareSameShape = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (q?.shape || 'default') === firstShapeVal;
                });

                // Tamaño común
                const firstSize = getDValue(firstQuestObj?.size) ?? 1.0;
                const shareSameSize = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return (getDValue(q?.size) ?? 1.0) === firstSize;
                });

                // Ocultar hasta completar dependencias común
                const firstHideDeps = firstQuestObj?.hide_until_deps_complete;
                const shareSameHideDeps = selectedQuests.every(item => {
                  const q = quests.find(qObj => qObj && qObj.id === item.id);
                  return q?.hide_until_deps_complete === firstHideDeps;
                });

                return (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                      Propiedades de las Misiones ({selectedQuests.length})
                    </h3>

                    {/* Icono / Imagen común */}
                    <div className="input-group" style={{ marginBottom: '10px' }}>
                      <label>Icono / Imagen común</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder={shareSameIcon ? "ej. minecraft:apple" : "Mixto"}
                          value={shareSameIcon ? (firstIcon || '') : ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatesList = selectedQuests.map(item => ({
                              id: item.id as string,
                              updates: { icon: val.trim() ? val : undefined }
                            }));
                            updateQuest(updatesList);
                          }}
                        />
                        <button 
                          className="btn-icon" 
                          style={{ padding: '6px', color: 'var(--text-secondary)' }}
                          onClick={() => setTexturePicker({
                            isOpen: true,
                            targetType: 'icon',
                            title: 'Asignar Icono a Misiones Seleccionadas',
                            onSelect: (val) => {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { icon: val.trim() ? val : undefined }
                              }));
                              updateQuest(updatesList);
                            }
                          })}
                          title="Explorar texturas en catálogo"
                        >
                          <Search size={16} />
                        </button>
                        {shareSameIcon && firstIcon && (
                          <button 
                            className="btn-icon" 
                            style={{ padding: '6px', color: 'var(--text-secondary)' }}
                            onClick={() => {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { icon: undefined }
                              }));
                              updateQuest(updatesList);
                            }}
                            title="Quitar icono de todas las misiones seleccionadas"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="row">
                      {/* Forma (Shape) Común */}
                      <div className="input-group">
                        <label>Forma (Shape)</label>
                        <select 
                          className="input-field" 
                          value={shareSameShape ? firstShapeVal : 'mixed'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'mixed') return;
                            const nextShape = val === 'default' ? undefined : val;
                            const updatesList = selectedQuests.map(item => ({
                              id: item.id as string,
                              updates: { shape: nextShape }
                            }));
                            updateQuest(updatesList);
                          }}
                        >
                          {!shareSameShape && <option value="mixed">-- Mixto --</option>}
                          <option value="default">Por Defecto (Heredar)</option>
                          <option value="circle">Circle</option>
                          <option value="square">Square</option>
                          <option value="rsquare">Rounded Square</option>
                          <option value="gear">Gear</option>
                          <option value="octagon">Octagon</option>
                          <option value="diamond">Diamond</option>
                          <option value="hexagon">Hexagon</option>
                          <option value="pentagon">Pentagon</option>
                          <option value="heart">Heart</option>
                        </select>
                      </div>

                      {/* Tamaño Común */}
                      <div className="input-group">
                        <label>Tamaño (Size)</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          className="input-field" 
                          placeholder={shareSameSize ? "" : "Mixto"}
                          value={shareSameSize ? firstSize : ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              const updatesList = selectedQuests.map(item => ({
                                id: item.id as string,
                                updates: { size: { __type: 'number', value: val, suffix: 'd' } }
                              }));
                              updateQuest(updatesList);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Ocultar hasta completar dependencias Común */}
                    <div className="input-group" style={{ marginTop: '10px' }}>
                      <label>Ocultar hasta completar dependencias</label>
                      <select 
                        className="input-field"
                        value={!shareSameHideDeps ? 'mixed' : (firstHideDeps === undefined ? 'default' : (firstHideDeps ? 'true' : 'false'))}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'mixed') return;
                          const nextVal = val === 'default' ? undefined : (val === 'true');
                          const updatesList = selectedQuests.map(item => ({
                            id: item.id as string,
                            updates: { hide_until_deps_complete: nextVal }
                          }));
                          updateQuest(updatesList);
                        }}
                      >
                        {!shareSameHideDeps && <option value="mixed">-- Mixto --</option>}
                        <option value="default">Por Defecto (Heredar)</option>
                        <option value="true">Sí (Ocultar)</option>
                        <option value="false">No (Mostrar)</option>
                      </select>
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
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginBottom: '8px' }} 
                  onClick={pinSelectionToClipboard}
                >
                  📌 Anclar Selección al Portapapeles
                </button>
                {selection.items.some(item => item.type === 'quest') && (
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 179, 71, 0.15)', color: '#ffb347', border: '1px solid rgba(255, 179, 71, 0.25)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem', marginBottom: '8px' }} 
                    onClick={clearSelectedDependencies}
                    title="Borra todas las dependencias de ida y vuelta para las misiones seleccionadas"
                  >
                    <span>🔓</span> Quitar todas las dependencias
                  </button>
                )}
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

          {/* Inspector de Conexión de Dependencia */}
          {selection.type === 'dependency' && selection.dependency && (() => {
            const { sourceId, targetId } = selection.dependency!;
            const sourceQ = quests.find(q => q.id === sourceId);
            const targetQ = quests.find(q => q.id === targetId);

            const sourceTitle = String(getDValue(sourceQ?.title) || sourceQ?.id || sourceId);
            const targetTitle = String(getDValue(targetQ?.title) || targetQ?.id || targetId);

            const isHiddenInGame = targetQ?.hide_dependency_lines === true;
            const minReq = targetQ?.min_required_dependencies !== undefined ? Number(getDValue(targetQ.min_required_dependencies)) : 0;
            const depReq = String(targetQ?.dependency_requirement || 'all_completed');
            const totalDepsCount = Array.isArray(targetQ?.dependencies) ? targetQ.dependencies.length : (targetQ?.dependencies ? 1 : 0);

            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={18} className="text-accent" /> Conexión de Dependencia
                  </h2>
                  <button
                    className="btn-icon"
                    onClick={deleteSelectedDependency}
                    title="Eliminar esta dependencia (Delete / Supr)"
                    style={{ padding: '6px', color: '#f38ba8' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Tarjeta de flujo origen -> destino */}
                <div className="dependency-inspector-card">
                  <div className="dependency-flow-row">
                    <div 
                      className="dependency-node-box"
                      style={{ cursor: 'pointer' }}
                      title="Clic para seleccionar la misión origen"
                      onClick={() => {
                        if (sourceQ) {
                          setSelection({
                            type: 'quest',
                            id: sourceQ.id,
                            ids: [sourceQ.id],
                            items: [{ type: 'quest', id: sourceQ.id }]
                          });
                        }
                      }}
                    >
                      <span className="dependency-node-role source">Origen (Requisito)</span>
                      <span className="dependency-node-title">{sourceTitle}</span>
                      <span className="dependency-node-id">#{sourceId}</span>
                    </div>

                    <div className="dependency-flow-arrow" title="Flujo de dependencia">
                      ➔
                    </div>

                    <div 
                      className="dependency-node-box"
                      style={{ cursor: 'pointer' }}
                      title="Clic para seleccionar la misión destino"
                      onClick={() => {
                        if (targetQ) {
                          setSelection({
                            type: 'quest',
                            id: targetQ.id,
                            ids: [targetQ.id],
                            items: [{ type: 'quest', id: targetQ.id }]
                          });
                        }
                      }}
                    >
                      <span className="dependency-node-role target">Destino (Desbloqueada)</span>
                      <span className="dependency-node-title">{targetTitle}</span>
                      <span className="dependency-node-id">#{targetId}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                    onClick={invertSelectedDependency}
                    title="Invertir la dirección de la dependencia entre ambas misiones"
                  >
                    <RotateCcw size={14} /> Invertir Dirección de Flecha
                  </button>
                </div>

                {/* Opciones de Cable y Comportamiento en FTB Quests */}
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Propiedades de Desbloqueo (Misión Destino)
                </h3>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isHiddenInGame}
                      onChange={(e) => {
                        if (targetQ) {
                          updateQuest(targetId, {
                            hide_dependency_lines: e.target.checked ? true : undefined
                          });
                        }
                      }}
                      style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }}
                    />
                    <span>Ocultar cable en el juego (<code>hide_dependency_lines</code>)</span>
                  </label>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginLeft: '24px' }}>
                    Si se marca, el cable se verá atenuado y punteado en el lienzo y no se dibujará en la interfaz de FTB Quests dentro de Minecraft.
                  </small>
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label>Criterio de Desbloqueo (<code>dependency_requirement</code>)</label>
                  <select
                    className="input-field"
                    value={depReq}
                    onChange={(e) => {
                      if (targetQ) {
                        updateQuest(targetId, {
                          dependency_requirement: e.target.value === 'all_completed' ? undefined : e.target.value
                        });
                      }
                    }}
                  >
                    <option value="all_completed">Todas las dependencias completadas (default)</option>
                    <option value="one_completed">Al menos una dependencia completada</option>
                    <option value="all_started">Todas las dependencias iniciadas</option>
                    <option value="one_started">Al menos una dependencia iniciada</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Mínimo de Dependencias Requeridas (<code>min_required_dependencies</code>)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(1, totalDepsCount)}
                      className="input-field"
                      value={minReq}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (targetQ) {
                          updateQuest(targetId, {
                            min_required_dependencies: isNaN(val) || val <= 0 ? undefined : val
                          });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      de {totalDepsCount} total{totalDepsCount !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    0 = se requieren todas. Si pones ej. 1, con cumplir cualquiera de sus {totalDepsCount} dependencias se desbloqueará.
                  </small>
                </div>

                {/* Selector de Estilo Visual de Cables */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Estilo de Conexión en el Lienzo
                  </label>
                  <div className="connection-style-group">
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'bezier' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('bezier')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>〰️</span>
                      <span>Curva Bezier</span>
                    </button>
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'straight' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('straight')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>➔</span>
                      <span>Recta Directa</span>
                    </button>
                    <button
                      className={`connection-style-btn ${connectionLineStyle === 'orthogonal' ? 'active' : ''}`}
                      onClick={() => handleConnectionLineStyleChange('orthogonal')}
                      type="button"
                    >
                      <span style={{ fontSize: '1.1rem' }}>⤷</span>
                      <span>Ortogonal</span>
                    </button>
                  </div>
                </div>

                {/* Botón para eliminar conexión */}
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 60, 60, 0.2)', color: '#ff8888', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={deleteSelectedDependency}
                  >
                    <Trash2 size={14} /> Eliminar Esta Dependencia
                  </button>
                </div>
              </div>
            );
          })()}

          {selection.type !== 'dependency' && selection.items.length === 0 && (
            snbtData ? (
              <div>
                <h2 className="section-title">Propiedades del Capítulo</h2>
                
                <div className="input-group">
                  <label>Título</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={getDValue(snbtData.title) || ''}
                    onChange={(e) => {
                      const updated = { ...snbtData, title: e.target.value };
                      updateState(quests, images, false, updated);
                    }}
                  />
                </div>

                <div className="input-group">
                  <label>ID del Capítulo</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={getDValue(snbtData.id) || ''}
                    onChange={(e) => {
                      const updated = { ...snbtData, id: e.target.value };
                      updateState(quests, images, false, updated);
                    }}
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0 }}>Grupo de Capítulos</label>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ fontSize: '0.72rem', padding: '2px 6px', gap: '3px', display: 'flex', alignItems: 'center', color: 'var(--accent-color)' }}
                      onClick={() => setIsChapterGroupModalOpen(true)}
                      title="Abrir gestor visual de grupos"
                    >
                      <span>📁</span> Gestionar
                    </button>
                  </div>
                  <select 
                    className="input-field"
                    value={getDValue(snbtData.group) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...snbtData };
                      if (val === '') {
                        delete updated.group;
                      } else {
                        updated.group = val;
                      }
                      updateState(quests, images, false, updated);
                    }}
                  >
                    <option value="">(Sin Grupo / Raíz)</option>
                    {chapterGroups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        📁 {grp.title} ({grp.id.slice(0, 8)}...)
                      </option>
                    ))}
                    {snbtData.group && !chapterGroups.some(g => g.id === getDValue(snbtData.group)) && (
                      <option value={getDValue(snbtData.group)}>
                        ❓ Personalizado: {getDValue(snbtData.group)}
                      </option>
                    )}
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', width: '100%', minWidth: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Hex ID:</span>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ fontSize: '0.75rem', padding: '2px 6px', fontFamily: 'monospace', height: '24px', flex: 1, minWidth: 0 }}
                      placeholder="Vacío o Hex (ej. 7E48F1A2D091B3C4)"
                      value={getDValue(snbtData.group) || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        const updated = { ...snbtData };
                        if (val === '') {
                          delete updated.group;
                        } else {
                          updated.group = val;
                        }
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="input-group">
                    <label>Order Index</label>
                    <input 
                      type="number" 
                      className="input-field"
                      value={getDValue(snbtData.order_index) ?? 0}
                      onChange={(e) => {
                        const updated = { ...snbtData, order_index: parseInt(e.target.value) || 0 };
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label>Autofocus ID</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={getDValue(snbtData.autofocus_id) || ''}
                      onChange={(e) => {
                        const updated = { ...snbtData, autofocus_id: e.target.value };
                        updateState(quests, images, false, updated);
                      }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Forma de Misión por Defecto</label>
                  <select 
                    className="input-field"
                    value={getDValue(snbtData.default_quest_shape) || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...snbtData };
                      if (val === '') {
                        delete updated.default_quest_shape;
                      } else {
                        updated.default_quest_shape = val;
                      }
                      updateState(quests, images, false, updated);
                    }}
                  >
                    <option value="">Por defecto (Círculo)</option>
                    <option value="circle">Círculo</option>
                    <option value="square">Cuadrado</option>
                    <option value="diamond">Diamante</option>
                    <option value="hexagon">Hexágono</option>
                    <option value="octagon">Octágono</option>
                    <option value="gear">Engranaje</option>
                    <option value="heart">Corazón</option>
                  </select>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.default_hide_dependency_lines === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, default_hide_dependency_lines: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Ocultar líneas de dependencia por defecto
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.hide_quest_until_deps_complete === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, hide_quest_until_deps_complete: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Ocultar misiones hasta completar dependencias
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.always_invisible === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, always_invisible: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Siempre invisible
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox"
                      checked={snbtData.disable_toast === true}
                      onChange={(e) => {
                        const updated = { ...snbtData, disable_toast: e.target.checked };
                        updateState(quests, images, false, updated);
                      }}
                    />
                    Desactivar Toasts
                  </label>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Carga un archivo .snbt para ver sus propiedades.</p>
              </div>
            )
          )}
          
          {selection.type === 'image' && selection.items.length === 1 && selection.id !== null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Imagen Seleccionada</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className={`btn-icon ${lockedKeys.includes(`img-${selection.id}`) ? 'active' : ''}`}
                    onClick={() => toggleLock(`img-${selection.id}`)}
                    title={lockedKeys.includes(`img-${selection.id}`) ? "Desbloquear imagen" : "Bloquear imagen"}
                    style={{ padding: '6px', color: lockedKeys.includes(`img-${selection.id}`) ? '#f38ba8' : 'var(--text-secondary)' }}
                  >
                    {lockedKeys.includes(`img-${selection.id}`) ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={duplicateSelection}
                    title="Duplicar imagen (Ctrl+D)"
                    style={{ padding: '6px', color: 'var(--text-secondary)' }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label>Textura (URL/Path)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input type="text" className="input-field" 
                    value={images[selection.id as number]?.image || ''} 
                    onChange={(e) => updateImage(selection.id as number, { image: e.target.value })}
                  />
                  <button 
                    className="btn-icon" 
                    title="Explorar texturas en catálogo" 
                    onClick={() => setTexturePicker({
                      isOpen: true,
                      targetType: 'image',
                      title: 'Seleccionar Imagen de Fondo',
                      onSelect: (val) => updateImage(selection.id as number, { image: val })
                    })}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Search size={16} />
                  </button>
                </div>
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
              <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                  onClick={pinSelectionToClipboard}
                >
                  📌 Anclar al Portapapeles
                </button>
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

          {selection.type === 'quest' && selection.items.length === 1 && selection.id !== null && (() => {
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>Misión Seleccionada</h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`btn-icon ${lockedKeys.includes(`quest-${selection.id}`) ? 'active' : ''}`}
                      onClick={() => toggleLock(`quest-${selection.id}`)}
                      title={lockedKeys.includes(`quest-${selection.id}`) ? "Desbloquear misión" : "Bloquear misión"}
                      style={{ padding: '6px', color: lockedKeys.includes(`quest-${selection.id}`) ? '#f38ba8' : 'var(--text-secondary)' }}
                    >
                      {lockedKeys.includes(`quest-${selection.id}`) ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={duplicateSelection}
                      title="Duplicar misión (Ctrl+D)"
                      style={{ padding: '6px', color: 'var(--text-secondary)' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>ID</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" className="input-field" readOnly value={selection.id as string} style={{ flex: 1 }} />
                    <button
                      className="btn btn-secondary"
                      onClick={() => setIsCommandModalOpen(true)}
                      title="Generar comandos de prueba para esta misión"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Terminal size={14} /> KubeJS
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Título</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Minecraft (&6, &a...)</span>
                      <button
                        className="btn-icon"
                        onClick={() => setTextEditorConfig({
                          isOpen: true,
                          fieldTitle: 'Editor de Título de Misión',
                          initialValue: String(getDValue(selectedQuest.title) ?? ''),
                          isMultiline: false,
                          onSave: (val) => {
                            if (typeof selectedQuest.title === 'object' && selectedQuest.title !== null) {
                              updateQuest(selection.id as string, { title: { ...selectedQuest.title, value: val } });
                            } else {
                              updateQuest(selection.id as string, { title: val });
                            }
                          }
                        })}
                        title="Expandir Editor con Vista Previa en Vivo"
                        style={{ padding: '2px 6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', color: '#89b4fa' }}
                      >
                        <Maximize2 size={12} /> Expandir
                      </button>
                    </div>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={titleInputRef}
                    value={String(getDValue(selectedQuest.title) ?? '')}
                    onChange={(val) => {
                      if (typeof selectedQuest.title === 'object' && selectedQuest.title !== null) {
                        updateQuest(selection.id as string, { title: { ...selectedQuest.title, value: val } });
                      } else {
                        updateQuest(selection.id as string, { title: val });
                      }
                    }}
                  />
                  <input
                    ref={titleInputRef}
                    type="text"
                    className="input-field" 
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
                  <MinecraftFormattedPreview
                    text={String(getDValue(selectedQuest.title) ?? '')}
                    label="Vista Previa Título"
                    defaultColor="#FFFFFF"
                  />
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Subtítulo</label>
                    <button
                      className="btn-icon"
                      onClick={() => setTextEditorConfig({
                        isOpen: true,
                        fieldTitle: 'Editor de Subtítulo de Misión',
                        initialValue: String(selectedQuest.subtitle ?? ''),
                        isMultiline: false,
                        onSave: (val) => {
                          updateQuest(selection.id as string, { subtitle: val ? val : undefined });
                        }
                      })}
                      title="Expandir Editor con Vista Previa en Vivo"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', color: '#89b4fa' }}
                    >
                      <Maximize2 size={12} /> Expandir
                    </button>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={subtitleInputRef}
                    value={String(selectedQuest.subtitle ?? '')}
                    onChange={(val) => {
                      updateQuest(selection.id as string, { subtitle: val ? val : undefined });
                    }}
                  />
                  <input
                    ref={subtitleInputRef}
                    type="text"
                    className="input-field"
                    placeholder="Texto secundario o pista de la misión..."
                    value={String(selectedQuest.subtitle ?? '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateQuest(selection.id as string, { subtitle: val ? val : undefined });
                    }}
                  />
                  {selectedQuest.subtitle && (
                    <MinecraftFormattedPreview
                      text={String(selectedQuest.subtitle)}
                      label="Vista Previa Subtítulo"
                      defaultColor="#AAAAAA"
                    />
                  )}
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
                    <button 
                      className="btn-icon" 
                      title="Explorar texturas en catálogo" 
                      onClick={() => setTexturePicker({
                        isOpen: true,
                        targetType: 'icon',
                        title: 'Seleccionar Icono de Misión',
                        onSelect: (val) => updateQuest(selection.id as string, { icon: val })
                      })}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Search size={16} />
                    </button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <label style={{ margin: 0 }}>Descripción</label>
                    <button
                      className="btn-icon"
                      onClick={() => setTextEditorConfig({
                        isOpen: true,
                        fieldTitle: 'Editor de Lore / Descripción de Misión',
                        initialValue: selectedQuest.description || [],
                        isMultiline: true,
                        onSave: (val) => {
                          const descArray = Array.isArray(val) ? val : String(val).split("\n");
                          updateQuest(selection.id as string, { description: descArray });
                        }
                      })}
                      title="Expandir Editor con Vista Previa en Vivo"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', color: '#89b4fa' }}
                    >
                      <Maximize2 size={12} /> Expandir
                    </button>
                  </div>
                  <MinecraftTextToolbar
                    targetRef={descriptionTextareaRef}
                    value={(selectedQuest.description || []).join('\n')}
                    onChange={(val) => {
                      updateQuest(selection.id as string, { description: val.split('\n') });
                    }}
                  />
                  <textarea
                    ref={descriptionTextareaRef}
                    className="input-field"
                    rows={3}
                    value={(selectedQuest.description || []).join('\n')}
                    onChange={(e) => updateQuest(selection.id as string, { description: e.target.value.split('\n') })}
                  />
                  <MinecraftFormattedPreview
                    text={selectedQuest.description || []}
                    label="Vista Previa Descripción"
                    defaultColor="#FFFFFF"
                  />
                </div>
                <div className="row">
                  <div className="input-group">
                    <label>Forma (Shape)</label>
                    <select className="input-field" 
                      value={selectedQuest.shape || 'default'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextShape = val === 'default' ? undefined : val;
                        updateQuest(selection.id as string, { shape: nextShape });
                      }}
                    >
                      <option value="default">Por Defecto (Heredar)</option>
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="rsquare">Rounded Square</option>
                      <option value="gear">Gear</option>
                      <option value="octagon">Octagon</option>
                      <option value="diamond">Diamond</option>
                      <option value="hexagon">Hexagon</option>
                      <option value="pentagon">Pentagon</option>
                      <option value="heart">Heart</option>
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
                        const externalInfo = allChaptersQuestsMap.get(depId);
                        const isCrossChapter = !depQuest && !!externalInfo;
                        const isUnknown = !depQuest && !externalInfo;

                        const depTitle = depQuest 
                          ? String(getDValue(depQuest.title) || depQuest.id)
                          : (externalInfo ? String(getDValue(externalInfo.quest.title) || depId) : depId);
                        const depIcon = depQuest ? depQuest.icon : (externalInfo ? externalInfo.quest.icon : undefined);

                        return (
                          <div 
                            key={depId} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              background: isCrossChapter ? 'rgba(123, 97, 255, 0.08)' : (isUnknown ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.02)'), 
                              padding: '6px 10px', 
                              borderRadius: '6px',
                              border: isCrossChapter ? '1px solid rgba(123, 97, 255, 0.28)' : (isUnknown ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.05)'),
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              <QuestItemThumbnail icon={depIcon} size={22} />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div 
                                  style={{ fontSize: '0.8rem', color: isCrossChapter ? '#c4b5fd' : (isUnknown ? '#fbbf24' : 'var(--text-primary)'), textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                  title={`${depTitle} (${depId})`}
                                >
                                  {isCrossChapter && <span style={{ marginRight: '4px' }}>🌐</span>}
                                  {isUnknown && <span style={{ marginRight: '4px' }}>⚠️</span>}
                                  {!isCrossChapter && !isUnknown && <span style={{ marginRight: '4px' }}>🔗</span>}
                                  {parseMinecraftText(depTitle)}
                                </div>
                                {isCrossChapter && (
                                  <div style={{ fontSize: '0.67rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>Capítulo: {externalInfo.chapterTitle}</span>
                                  </div>
                                )}
                                {isUnknown && (
                                  <div style={{ fontSize: '0.67rem', color: '#f59e0b' }}>
                                    ID externo: {depId}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isCrossChapter && (
                                <button
                                  className="btn-icon"
                                  style={{ color: '#a78bfa', padding: '3px' }}
                                  onClick={() => {
                                    handleSelectTab(externalInfo.tabId);
                                    setSelection({ type: 'quest', ids: [depId], items: [{ type: 'quest', id: depId }] });
                                  }}
                                  title={`Ir al capítulo "${externalInfo.chapterTitle}" y seleccionar esta misión`}
                                >
                                  <ExternalLink size={13} />
                                </button>
                              )}
                              <button 
                                className="btn-icon" 
                                style={{ color: 'var(--danger-color)', padding: '3px' }}
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
                                <Trash2 size={13} />
                              </button>
                            </div>
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
                        <option value="" disabled>Añadir requisito local...</option>
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

                  {/* Botón para vincular dependencia de otro capítulo */}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.76rem',
                      marginTop: '6px',
                      padding: '6px 10px',
                      background: 'rgba(123, 97, 255, 0.12)',
                      border: '1px solid rgba(123, 97, 255, 0.28)',
                      color: '#c4b5fd',
                    }}
                    onClick={() => setIsCrossChapterModalOpen(true)}
                  >
                    <Globe size={13} />
                    <span>Vincular Prerrequisito de Otro Capítulo...</span>
                  </button>

                  {/* Configuración avanzada de dependencias de la misión */}
                  {normalizedDeps.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id="quest-hide-deps"
                          checked={selectedQuest.hide_dependency_lines === true}
                          onChange={(e) => {
                            updateQuest(selectedQuest.id, {
                              hide_dependency_lines: e.target.checked ? true : undefined
                            });
                          }}
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        <label htmlFor="quest-hide-deps" style={{ fontSize: '0.78rem', cursor: 'pointer', margin: 0 }}>
                          Ocultar cables entrantes en el juego (<code>hide_dependency_lines</code>)
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Criterio de Desbloqueo</label>
                          <select
                            className="input-field"
                            style={{ fontSize: '0.78rem', height: '30px' }}
                            value={String(selectedQuest.dependency_requirement || 'all_completed')}
                            onChange={(e) => {
                              updateQuest(selectedQuest.id, {
                                dependency_requirement: e.target.value === 'all_completed' ? undefined : e.target.value
                              });
                            }}
                          >
                            <option value="all_completed">Todas completadas (default)</option>
                            <option value="one_completed">Al menos una completada</option>
                            <option value="all_started">Todas iniciadas</option>
                            <option value="one_started">Al menos una iniciada</option>
                          </select>
                        </div>

                        {normalizedDeps.length > 1 && (
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mínimo requeridas</label>
                            <input
                              type="number"
                              min={0}
                              max={normalizedDeps.length}
                              className="input-field"
                              style={{ fontSize: '0.78rem', height: '30px' }}
                              placeholder={`0 = todas (${normalizedDeps.length})`}
                              value={selectedQuest.min_required_dependencies !== undefined ? Number(getDValue(selectedQuest.min_required_dependencies)) : ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateQuest(selectedQuest.id, {
                                  min_required_dependencies: isNaN(val) || val <= 0 ? undefined : val
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks & Rewards Section */}
                <QuestTaskRewardManager
                  tasks={tasksArray}
                  rewards={rewardsArray}
                  rewardTables={rewardTables}
                  onOpenRewardTableModal={() => setIsRewardTableModalOpen(true)}
                  onUpdateTasks={(newTasks) => updateQuest(selection.id as string, { tasks: newTasks })}
                  onUpdateRewards={(newRewards) => updateQuest(selection.id as string, { rewards: newRewards })}
                  onOpenTexturePicker={(targetType, onSelect) => setTexturePicker({
                    isOpen: true,
                    targetType: targetType as any,
                    title: 'Seleccionar Ítem del Catálogo',
                    onSelect
                  })}
                  onOpenNbtEditor={(title, value, onSave) => setNbtEditor({
                    title,
                    value: JSON.stringify(value, null, 2),
                    onSave
                  })}
                />

                {/* Delete Quest Section */}
                <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={pinSelectionToClipboard}
                  >
                    📌 Anclar al Portapapeles
                  </button>
                  <button 
                    className="btn-icon" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'rgba(255, 179, 71, 0.15)', color: '#ffb347', border: '1px solid rgba(255, 179, 71, 0.25)', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }} 
                    onClick={clearSelectedDependencies}
                    title="Borra todas las dependencias de ida y vuelta para esta misión"
                  >
                    <span>🔓</span> Quitar todas las dependencias
                  </button>
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
    </>
  );
}
