import { Upload } from 'lucide-react';

export interface DropZoneOverlayProps {
  isDraggingFile: boolean;
}

export function DropZoneOverlay({ isDraggingFile }: DropZoneOverlayProps) {
  return (
    <>
      {isDraggingFile && (
      <div className="drop-zone-overlay">
        <div className="drop-zone-container">
          <div className="drop-zone-icon-wrapper">
            <Upload size={48} />
          </div>
          <h2 className="drop-zone-title">Suelta el archivo aquí para importar</h2>
          <p className="drop-zone-subtitle">Soporta archivos con extensión .snbt</p>
        </div>
      </div>
    )}
    </>
  );
}
