import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalDistributeCenter, AlignStartHorizontal, AlignStartVertical, AlignVerticalDistributeCenter, Copy, Lock, Search, Sparkles, Trash2, Unlock } from 'lucide-react';
import type React from 'react';
import { decimalToHexColor, getDValue, getItemX, getItemY, hexColorToDecimal } from '../utils/appHelpers';

export interface MultiSelectionPanelProps {
  alignSelectedItems: (alignType: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  clearSelectedDependencies: () => void;
  deleteSelectedImages: () => void;
  deleteSelectedQuests: () => void;
  distributeSelectedItems: (axis: "horizontal" | "vertical") => void;
  duplicateSelection: () => void;
  handleAutoLayout: (direction?: "LR" | "TB" | undefined, onlySelected?: boolean | undefined) => void;
  images: any[];
  lockedKeys: string[];
  pinSelectionToClipboard: () => void;
  quests: any[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setTexturePicker: React.Dispatch<React.SetStateAction<{ isOpen: boolean; targetType: "image" | "icon"; onSelect: (val: string) => void; title: string; } | null>>;
  toggleLockSelected: () => void;
  updateImage: (indexOrUpdatesList: number | { index: number; updates: any; }[], updates?: any) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
  updateSelectedCoordinates: (axis: "x" | "y", val: number) => void;
  updateState: (newQuests: any[], newImages: any[], bypassHistory?: boolean | undefined, newSnbtData?: any) => void;
}

export function MultiSelectionPanel({ alignSelectedItems, clearSelectedDependencies, deleteSelectedImages, deleteSelectedQuests, distributeSelectedItems, duplicateSelection, handleAutoLayout, images, lockedKeys, pinSelectionToClipboard, quests, selection, setTexturePicker, toggleLockSelected, updateImage, updateQuest, updateSelectedCoordinates, updateState }: MultiSelectionPanelProps) {
  return (
    <>
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
    </>
  );
}
