import type React from 'react';
import type { ChapterGroup } from '../types/chapterGroup';
import { getDValue } from '../utils/appHelpers';

export interface ChapterPropertiesProps {
  chapterGroups: ChapterGroup[];
  images: any[];
  quests: any[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setIsChapterGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  snbtData: any;
  updateState: (newQuests: any[], newImages: any[], bypassHistory?: boolean | undefined, newSnbtData?: any) => void;
}

export function ChapterProperties({ chapterGroups, images, quests, selection, setIsChapterGroupModalOpen, snbtData, updateState }: ChapterPropertiesProps) {
  return (
    <>
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
    </>
  );
}
