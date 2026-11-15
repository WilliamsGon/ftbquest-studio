import type React from 'react';


export interface QuestContextMenuProps {
  contextMenu: { visible: boolean; x: number; y: number; targetQuestId: string | null; };
  makeSelectedDependOnTarget: () => void;
  makeTargetDependOnSelected: () => void;
  pinSelectionToClipboard: () => void;
  removeSelectedDependencyOnTarget: () => void;
  removeTargetDependencyOnSelected: () => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; targetQuestId: string | null; }>>;
}

export function QuestContextMenu({ contextMenu, makeSelectedDependOnTarget, makeTargetDependOnSelected, pinSelectionToClipboard, removeSelectedDependencyOnTarget, removeTargetDependencyOnSelected, setContextMenu }: QuestContextMenuProps) {
  return (
    <>
      {contextMenu.visible && (
      <div 
        className="context-menu"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="context-menu-item"
          onClick={makeSelectedDependOnTarget}
        >
          <span>🔗</span> Hacer que las seleccionadas dependan de esta
        </div>
        <div 
          className="context-menu-item"
          onClick={removeSelectedDependencyOnTarget}
        >
          <span>🔓</span> Quitar dependencia de esta en las seleccionadas
        </div>
        <div className="context-menu-divider" />
        <div 
          className="context-menu-item"
          onClick={makeTargetDependOnSelected}
        >
          <span>🔗</span> Hacer que esta dependa de las seleccionadas
        </div>
        <div 
          className="context-menu-item"
          onClick={removeTargetDependencyOnSelected}
        >
          <span>🔓</span> Quitar dependencias seleccionadas de esta
        </div>
        <div className="context-menu-divider" />
        <div 
          className="context-menu-item"
          onClick={() => {
            pinSelectionToClipboard();
            setContextMenu({ ...contextMenu, visible: false });
          }}
        >
          <span>📌</span> Anclar Selección al Portapapeles
        </div>
      </div>
    )}
    </>
  );
}
