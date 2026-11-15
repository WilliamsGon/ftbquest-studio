import { Copy, ExternalLink, Globe, Lock, Maximize2, Search, Settings, Terminal, Trash2, Unlock } from 'lucide-react';
import type React from 'react';
import type { RewardTable } from '../types/rewardTable';
import { getDValue } from '../utils/appHelpers';
import { parseMinecraftText } from '../utils/minecraftText';
import { QuestItemThumbnail } from '../utils/textureHelper';
import { MinecraftFormattedPreview } from './MinecraftFormattedPreview';
import { MinecraftTextToolbar } from './MinecraftTextToolbar';
import { QuestTaskRewardManager } from './QuestTaskRewardManager';

export interface QuestPropertiesProps {
  allChaptersQuestsMap: Map<string, { quest: any; chapterId: string; chapterTitle: string; tabId: string; }>;
  clearSelectedDependencies: () => void;
  deleteQuest: (id: string) => void;
  descriptionTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  duplicateSelection: () => void;
  handleSelectTab: (targetId: string) => void;
  lockedKeys: string[];
  pinSelectionToClipboard: () => void;
  quests: any[];
  rewardTables: RewardTable[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setIsCommandModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCrossChapterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRewardTableModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNbtEditor: React.Dispatch<React.SetStateAction<{ title: string; value: string; onSave: (val: any) => void; } | null>>;
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  setTextEditorConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean; fieldTitle: string; initialValue: string | string[]; isMultiline: boolean; onSave: (val: any) => void; }>>;
  setTexturePicker: React.Dispatch<React.SetStateAction<{ isOpen: boolean; targetType: "image" | "icon"; onSelect: (val: string) => void; title: string; } | null>>;
  subtitleInputRef: React.RefObject<HTMLInputElement | null>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  toggleLock: (key: string) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
}

export function QuestProperties({ allChaptersQuestsMap, clearSelectedDependencies, deleteQuest, descriptionTextareaRef, duplicateSelection, handleSelectTab, lockedKeys, pinSelectionToClipboard, quests, rewardTables, selection, setIsCommandModalOpen, setIsCrossChapterModalOpen, setIsRewardTableModalOpen, setNbtEditor, setSelection, setTextEditorConfig, setTexturePicker, subtitleInputRef, titleInputRef, toggleLock, updateQuest }: QuestPropertiesProps) {
  return (
    <>
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
    </>
  );
}
