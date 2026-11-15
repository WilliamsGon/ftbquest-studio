import type React from 'react';


export interface NbtEditorModalProps {
  nbtEditor: { title: string; value: string; onSave: (val: any) => void; } | null;
  setNbtEditor: React.Dispatch<React.SetStateAction<{ title: string; value: string; onSave: (val: any) => void; } | null>>;
  showToast: (message: string, type?: string) => void;
}

export function NbtEditorModal({ nbtEditor, setNbtEditor, showToast }: NbtEditorModalProps) {
  return (
    <>
      {nbtEditor && (
      <div className="modal-overlay" onClick={() => setNbtEditor(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{nbtEditor.title}</h2>
            <button className="btn-icon" onClick={() => setNbtEditor(null)}>×</button>
          </div>
          <div className="modal-body" style={{ height: '300px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Edita el objeto en formato JSON. Al guardar, se convertirá y escribirá como objeto SNBT.
            </p>
            <textarea 
              className="input-field" 
              style={{ flexGrow: 1, fontFamily: 'monospace', resize: 'vertical' }}
              value={nbtEditor.value}
              onChange={e => setNbtEditor({...nbtEditor, value: e.target.value})}
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setNbtEditor(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => {
              try {
                const parsed = JSON.parse(nbtEditor.value);
                nbtEditor.onSave(parsed);
                setNbtEditor(null);
              } catch (e: any) {
                showToast('Error al parsear JSON: ' + e.message, 'warning');
              }
            }}>Guardar NBT</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
