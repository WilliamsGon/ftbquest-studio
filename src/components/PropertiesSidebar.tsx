import { ChevronRight, RotateCcw, Settings } from 'lucide-react';
import type React from 'react';
import type { ChapterGroup } from '../types/chapterGroup';
import type { RewardTable } from '../types/rewardTable';
import { ChapterProperties } from './ChapterProperties';
import { DependencyInspector } from './DependencyInspector';
import { ImageProperties } from './ImageProperties';
import { MultiSelectionPanel } from './MultiSelectionPanel';
import { QuestProperties } from './QuestProperties';

export interface PropertiesSidebarProps {
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

export function PropertiesSidebar({ alignSelectedItems, allChaptersQuestsMap, chapterGroups, clearSelectedDependencies, connectionLineStyle, deleteQuest, deleteSelectedDependency, deleteSelectedImages, deleteSelectedQuests, descriptionTextareaRef, distributeSelectedItems, duplicateSelection, handleAutoLayout, handleConnectionLineStyleChange, handleSelectTab, images, invertSelectedDependency, isResizingRightSidebar, isRightSidebarCollapsed, lockedKeys, pinSelectionToClipboard, quests, rewardTables, rightSidebarWidth, selection, setImages, setIsChapterGroupModalOpen, setIsCommandModalOpen, setIsCrossChapterModalOpen, setIsRewardTableModalOpen, setIsRightSidebarCollapsed, setNbtEditor, setRightSidebarWidth, setSelection, setTextEditorConfig, setTexturePicker, snbtData, startResizingRightSidebar, subtitleInputRef, titleInputRef, toggleLock, toggleLockSelected, updateImage, updateQuest, updateSelectedCoordinates, updateState, viewMode }: PropertiesSidebarProps) {
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
          <MultiSelectionPanel alignSelectedItems={alignSelectedItems} clearSelectedDependencies={clearSelectedDependencies} deleteSelectedImages={deleteSelectedImages} deleteSelectedQuests={deleteSelectedQuests} distributeSelectedItems={distributeSelectedItems} duplicateSelection={duplicateSelection} handleAutoLayout={handleAutoLayout} images={images} lockedKeys={lockedKeys} pinSelectionToClipboard={pinSelectionToClipboard} quests={quests} selection={selection} setTexturePicker={setTexturePicker} toggleLockSelected={toggleLockSelected} updateImage={updateImage} updateQuest={updateQuest} updateSelectedCoordinates={updateSelectedCoordinates} updateState={updateState} />

          {/* Inspector de Conexión de Dependencia */}
          <DependencyInspector connectionLineStyle={connectionLineStyle} deleteSelectedDependency={deleteSelectedDependency} handleConnectionLineStyleChange={handleConnectionLineStyleChange} invertSelectedDependency={invertSelectedDependency} quests={quests} selection={selection} setSelection={setSelection} updateQuest={updateQuest} />

          <ChapterProperties chapterGroups={chapterGroups} images={images} quests={quests} selection={selection} setIsChapterGroupModalOpen={setIsChapterGroupModalOpen} snbtData={snbtData} updateState={updateState} />
          
          <ImageProperties deleteSelectedImages={deleteSelectedImages} duplicateSelection={duplicateSelection} images={images} lockedKeys={lockedKeys} pinSelectionToClipboard={pinSelectionToClipboard} selection={selection} setImages={setImages} setTexturePicker={setTexturePicker} toggleLock={toggleLock} updateImage={updateImage} />

          <QuestProperties allChaptersQuestsMap={allChaptersQuestsMap} clearSelectedDependencies={clearSelectedDependencies} deleteQuest={deleteQuest} descriptionTextareaRef={descriptionTextareaRef} duplicateSelection={duplicateSelection} handleSelectTab={handleSelectTab} lockedKeys={lockedKeys} pinSelectionToClipboard={pinSelectionToClipboard} quests={quests} rewardTables={rewardTables} selection={selection} setIsCommandModalOpen={setIsCommandModalOpen} setIsCrossChapterModalOpen={setIsCrossChapterModalOpen} setIsRewardTableModalOpen={setIsRewardTableModalOpen} setNbtEditor={setNbtEditor} setSelection={setSelection} setTextEditorConfig={setTextEditorConfig} setTexturePicker={setTexturePicker} subtitleInputRef={subtitleInputRef} titleInputRef={titleInputRef} toggleLock={toggleLock} updateQuest={updateQuest} />
        </div>
      </div>
      )}
    </>
  );
}
