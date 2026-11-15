import { Copy, Lock, Search, Trash2, Unlock } from 'lucide-react';
import type React from 'react';
import { decimalToHexColor, hexColorToDecimal } from '../utils/appHelpers';

export interface ImagePropertiesProps {
  deleteSelectedImages: () => void;
  duplicateSelection: () => void;
  images: any[];
  lockedKeys: string[];
  pinSelectionToClipboard: () => void;
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setImages: React.Dispatch<React.SetStateAction<any[]>>;
  setTexturePicker: React.Dispatch<React.SetStateAction<{ isOpen: boolean; targetType: "image" | "icon"; onSelect: (val: string) => void; title: string; } | null>>;
  toggleLock: (key: string) => void;
  updateImage: (indexOrUpdatesList: number | { index: number; updates: any; }[], updates?: any) => void;
}

export function ImageProperties({ deleteSelectedImages, duplicateSelection, images, lockedKeys, pinSelectionToClipboard, selection, setImages, setTexturePicker, toggleLock, updateImage }: ImagePropertiesProps) {
  return (
    <>
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
    </>
  );
}
