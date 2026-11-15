import { RotateCcw, Share2, Trash2 } from 'lucide-react';
import { getDValue } from '../utils/appHelpers';

export interface DependencyInspectorProps {
  connectionLineStyle: "bezier" | "straight" | "orthogonal";
  deleteSelectedDependency: () => void;
  handleConnectionLineStyleChange: (style: "bezier" | "straight" | "orthogonal") => void;
  invertSelectedDependency: () => void;
  quests: any[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
}

export function DependencyInspector({ connectionLineStyle, deleteSelectedDependency, handleConnectionLineStyleChange, invertSelectedDependency, quests, selection, setSelection, updateQuest }: DependencyInspectorProps) {
  return (
    <>
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
    </>
  );
}
