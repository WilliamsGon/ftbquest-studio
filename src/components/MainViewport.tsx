import { Map as MapIcon, Plus, Upload } from 'lucide-react';
import type React from 'react';
import type { ChapterTab } from '../types/chapter';
import type { GraphValidationResult } from '../utils/graphValidation';
import { ChapterTabBar } from './ChapterTabBar';
import { EditorCanvas } from './EditorCanvas';
import { TableView } from './TableView';

export interface MainViewportProps {
  JSON: JSON;
  activeTabId: string;
  connectionLineStyle: "bezier" | "straight" | "orthogonal";
  currentCameraRef: React.RefObject<{ pos?: { x: number; y: number; } | undefined; scale: number; }>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  graphValidation: GraphValidationResult;
  handleAutoLayout: (direction?: "LR" | "TB", onlySelected?: boolean) => void;
  handleBatchReplace: (searchQuery: string, replaceWith: string, scope: "current" | "all", fields: { titles: boolean; descriptions: boolean; tasks: boolean; rewards: boolean; icons: boolean; }) => void;
  handleCloseTab: (tabId: string) => void;
  handleCompleteAllPlayerQuests: () => void;
  handleConnectQuests: (sourceId: string, targetId: string) => void;
  handleConnectionLineStyleChange: (style: "bezier" | "straight" | "orthogonal") => void;
  handleExport: () => void;
  handleExportAll: () => void;
  handleExportZip: () => Promise<void>;
  handleNewBlankTab: () => void;
  handleQuestContextMenu: (questId: string, clientX: number, clientY: number) => void;
  handleReplaceSingle: (match: any, replaceWith: string) => void;
  handleResetPlayerProgress: () => void;
  handleSelectTab: (targetId: string) => void;
  handleTogglePlayerQuestCompletion: (questId: string) => void;
  images: any[];
  isPinnedDrawerOpen: boolean;
  isPlayerMode: boolean;
  layers: { quests: boolean; images: boolean; dependencies: boolean; };
  lockedKeys: string[];
  mouseCanvasPosRef: React.RefObject<{ x: number; y: number; } | null>;
  pinnedAssets: any[];
  playerCompletedQuestIds: Set<string>;
  quests: any[];
  selection: { type: "quest" | "image" | "mixed" | "dependency" | null; ids: (string | number)[]; items: { type: "quest" | "image"; id: string | number; }[]; id: string | number; dependency: { sourceId: string; targetId: string; } | null; };
  setIsPinnedDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlayerMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSimulatorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNbtEditor: React.Dispatch<React.SetStateAction<{ title: string; value: string; onSave: (val: any) => void; } | null>>;
  setSelection: (newSel: { type: "quest" | "image" | "mixed" | "dependency" | null; id?: string | number | null | undefined; ids?: (string | number)[] | undefined; items?: { type: "quest" | "image"; id: string | number; }[] | undefined; dependency?: { sourceId: string; targetId: string; } | null | undefined; }) => void;
  setSnapMode: React.Dispatch<React.SetStateAction<"relative" | "absolute">>;
  setSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>;
  snapMode: "relative" | "absolute";
  snapToGrid: boolean;
  snbtData: any;
  tabs: ChapterTab[];
  updateImage: (indexOrUpdatesList: number | { index: number; updates: any; }[], updates?: any) => void;
  updateQuest: (idOrUpdatesList: string | { id: string; updates: any; }[], updates?: any) => void;
  updateQuestsAndImages: (questUpdatesList: { id: string; updates: any; }[], imageUpdatesList: { index: number; updates: any; }[]) => void;
  viewMode: "map" | "table";
  visibleZLevels: number[];
}

export function MainViewport({ JSON, activeTabId, connectionLineStyle, currentCameraRef, fileInputRef, graphValidation, handleAutoLayout, handleBatchReplace, handleCloseTab, handleCompleteAllPlayerQuests, handleConnectQuests, handleConnectionLineStyleChange, handleExport, handleExportAll, handleExportZip, handleNewBlankTab, handleQuestContextMenu, handleReplaceSingle, handleResetPlayerProgress, handleSelectTab, handleTogglePlayerQuestCompletion, images, isPinnedDrawerOpen, isPlayerMode, layers, lockedKeys, mouseCanvasPosRef, pinnedAssets, playerCompletedQuestIds, quests, selection, setIsPinnedDrawerOpen, setIsPlayerMode, setIsSimulatorModalOpen, setNbtEditor, setSelection, setSnapMode, setSnapToGrid, snapMode, snapToGrid, snbtData, tabs, updateImage, updateQuest, updateQuestsAndImages, viewMode, visibleZLevels }: MainViewportProps) {
  return (
    <>
      <div className="main-viewport-column">
        {tabs.length > 0 && (
          <ChapterTabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewBlankTab={handleNewBlankTab}
            onOpenFiles={() => fileInputRef.current?.click()}
            onExportActive={handleExport}
            onExportAll={handleExportAll}
            onExportZip={handleExportZip}
          />
        )}

        {!snbtData ? (
          <div className="canvas-container">
            <div className="empty-state">
              <MapIcon size={48} opacity={0.5} />
              <h2>Carga uno o varios archivos .snbt para empezar</h2>
              <p>Arrastra archivos .snbt aquí o haz clic en "Abrir" para comenzar.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Abrir Archivo(s)
                </button>
                <button className="btn btn-primary" onClick={handleNewBlankTab}>
                  <Plus size={16} /> Nuevo Capítulo
                </button>
              </div>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="canvas-container" style={{ position: 'relative', flex: 1 }}>
            <EditorCanvas 
              key={activeTabId}
              quests={quests}
              images={images}
              layersVisible={layers}
              selection={selection}
              setSelection={setSelection}
              updateQuest={updateQuest}
              updateImage={updateImage}
              updateQuestsAndImages={updateQuestsAndImages}
              onPointerPosChange={(pos) => mouseCanvasPosRef.current = pos}
              onQuestContextMenu={handleQuestContextMenu}
              visibleZLevels={visibleZLevels}
              isPinnedDrawerOpen={isPinnedDrawerOpen}
              setIsPinnedDrawerOpen={setIsPinnedDrawerOpen}
              pinnedCount={pinnedAssets.length}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              snapMode={snapMode}
              setSnapMode={setSnapMode}
              lockedKeys={lockedKeys}
              onConnectQuests={handleConnectQuests}
              cycleNodeIds={graphValidation.cycleNodeIds}
              brokenDepQuestIds={graphValidation.brokenDepQuestIds}
              onAutoLayout={handleAutoLayout}
              initialStagePos={currentCameraRef.current.pos}
              initialStageScale={currentCameraRef.current.scale}
              onCameraChange={(pos, scale) => {
                currentCameraRef.current = { pos, scale };
              }}
              connectionLineStyle={connectionLineStyle}
              setConnectionLineStyle={handleConnectionLineStyleChange}
              totalOpenTabsCount={tabs.length}
              onBatchReplace={handleBatchReplace}
              onReplaceSingle={handleReplaceSingle}
              isPlayerMode={isPlayerMode}
              setIsPlayerMode={setIsPlayerMode}
              playerCompletedQuestIds={playerCompletedQuestIds}
              onTogglePlayerQuestCompletion={handleTogglePlayerQuestCompletion}
              onResetPlayerProgress={handleResetPlayerProgress}
              onCompleteAllPlayerQuests={handleCompleteAllPlayerQuests}
              onOpenSimulatorDashboard={() => setIsSimulatorModalOpen(true)}
            />

          </div>
        ) : (
          <TableView 
            quests={quests}
            images={images}
            updateQuest={updateQuest}
            updateImage={updateImage}
            onOpenNbtEditor={(title, value, onSave) => setNbtEditor({ title, value: JSON.stringify(value, null, 2), onSave })}
          />
        )}
      </div>
    </>
  );
}
