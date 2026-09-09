import React, { useState } from 'react';
import type { ChapterGroup } from '../types/chapterGroup';
import { parseMinecraftText, stripMinecraftFormatting } from '../utils/minecraftText';
import { stringifySNBT } from '../utils/snbt';
import { Folder, Plus, Trash2, ArrowUp, ArrowDown, Download, X, Edit2, Check } from 'lucide-react';

interface ChapterGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterGroups: ChapterGroup[];
  onUpdateChapterGroups: (groups: ChapterGroup[]) => void;
  chapters?: Array<{ id: string; filename: string; title?: string; snbtData?: any }>;
  currentChapterId?: string;
  currentChapterGroup?: string;
  onAssignCurrentChapterGroup?: (groupId: string) => void;
}

function generateHexId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
}

export const ChapterGroupModal: React.FC<ChapterGroupModalProps> = ({
  isOpen,
  onClose,
  chapterGroups,
  onUpdateChapterGroups,
  chapters = [],
  currentChapterId,
  currentChapterGroup = '',
  onAssignCurrentChapterGroup,
}) => {
  const [newGroupTitle, setNewGroupTitle] = useState<string>('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newGroupTitle.trim();
    if (!title) return;

    const newGroup: ChapterGroup = {
      id: generateHexId(),
      title,
    };

    onUpdateChapterGroups([...chapterGroups, newGroup]);
    setNewGroupTitle('');
  };

  const handleDeleteGroup = (groupId: string) => {
    // Verificar si hay capítulos asignados
    const count = getChaptersInGroup(groupId).length;
    if (count > 0) {
      const confirmed = window.confirm(
        `Hay ${count} capítulo(s) asignado(s) a este grupo. Si lo eliminas, dichos capítulos quedarán sin grupo asignado en el libro de misiones. ¿Deseas continuar?`
      );
      if (!confirmed) return;
    }

    const next = chapterGroups.filter((g) => g.id !== groupId);
    onUpdateChapterGroups(next);

    if (currentChapterGroup === groupId && onAssignCurrentChapterGroup) {
      onAssignCurrentChapterGroup('');
    }
  };

  const handleMoveGroup = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= chapterGroups.length) return;
    const next = [...chapterGroups];
    const item = next.splice(index, 1)[0];
    next.splice(target, 0, item);
    onUpdateChapterGroups(next);
  };

  const handleStartEditing = (group: ChapterGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupTitle(group.title);
  };

  const handleSaveEditing = () => {
    if (!editingGroupId) return;
    const title = editingGroupTitle.trim();
    if (title) {
      const next = chapterGroups.map((g) => (g.id === editingGroupId ? { ...g, title } : g));
      onUpdateChapterGroups(next);
    }
    setEditingGroupId(null);
  };

  const getChaptersInGroup = (groupId: string) => {
    return chapters.filter((c) => {
      const g = c.snbtData?.group?.value || c.snbtData?.group;
      return g === groupId;
    });
  };

  const handleDownloadSNBT = () => {
    const snbtObj = {
      chapter_groups: chapterGroups.map((g) => ({
        id: g.id,
        title: g.title,
      })),
    };
    const content = stringifySNBT(snbtObj);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chapter_groups.snbt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(18, 20, 29, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Cabecera */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Folder size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
                Gestor de Grupos de Capítulos
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Organiza los capítulos en carpetas y categorías para el libro de misiones (<code>chapter_groups.snbt</code>)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Formulario de creación de nuevo grupo */}
          <form
            onSubmit={handleCreateGroup}
            style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              alignItems: 'center',
            }}
          >
            <Folder size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <input
              type="text"
              className="input-field"
              placeholder="Nombre del nuevo grupo (ej. Introducción, Magia, Tecnología)..."
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              style={{ flex: 1, fontSize: '0.82rem', height: '34px' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '34px', padding: '0 14px', fontSize: '0.78rem', gap: '6px', whiteSpace: 'nowrap' }}
              disabled={!newGroupTitle.trim()}
            >
              <Plus size={14} /> Crear Grupo
            </button>
          </form>

          {/* Lista de Grupos Existentes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Grupos Definidos ({chapterGroups.length})
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                El orden de arriba hacia abajo define el orden en la barra del libro de misiones.
              </span>
            </div>

            {chapterGroups.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  padding: '36px 0',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '8px',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                }}
              >
                <Folder size={28} style={{ color: '#64748b', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  No hay grupos de capítulos definidos en este modpack.
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Crea uno arriba para comenzar a organizar tus capítulos por carpetas.
                </p>
              </div>
            ) : (
              chapterGroups.map((group, idx) => {
                const assignedChapters = getChaptersInGroup(group.id);
                const isCurrentAssigned = currentChapterGroup === group.id;
                const isEditing = editingGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isCurrentAssigned ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrentAssigned ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Botones de Reordenar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        className="btn-icon"
                        disabled={idx === 0}
                        onClick={() => handleMoveGroup(idx, -1)}
                        title="Subir grupo"
                        style={{ padding: '2px', opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        className="btn-icon"
                        disabled={idx === chapterGroups.length - 1}
                        onClick={() => handleMoveGroup(idx, 1)}
                        title="Bajar grupo"
                        style={{ padding: '2px', opacity: idx === chapterGroups.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Icono de Carpeta */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f59e0b',
                        flexShrink: 0,
                      }}
                    >
                      <Folder size={16} />
                    </div>

                    {/* Información y Edición del Título */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={editingGroupTitle}
                            onChange={(e) => setEditingGroupTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditing();
                              if (e.key === 'Escape') setEditingGroupId(null);
                            }}
                            autoFocus
                            style={{ height: '28px', fontSize: '0.8rem' }}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            onClick={handleSaveEditing}
                          >
                            <Check size={12} /> Guardar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {parseMinecraftText(group.title)}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                            ID: {group.id}
                          </span>
                        </div>
                      )}

                      {/* Contador de capítulos asociados */}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {assignedChapters.length > 0 ? (
                          <span>
                            📁 {assignedChapters.length} capítulo(s):{' '}
                            {assignedChapters.map((c) => stripMinecraftFormatting(c.title || c.filename)).join(', ')}
                          </span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#64748b' }}>Sin capítulos asignados</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones del Grupo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Botón rápido para asignar al capítulo actual */}
                      {onAssignCurrentChapterGroup && currentChapterId && (
                        <button
                          className={`btn ${isCurrentAssigned ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            background: isCurrentAssigned ? '#f59e0b' : undefined,
                            borderColor: isCurrentAssigned ? '#d97706' : undefined,
                            color: isCurrentAssigned ? '#000000' : undefined,
                            fontWeight: isCurrentAssigned ? 700 : 500,
                          }}
                          onClick={() => onAssignCurrentChapterGroup(isCurrentAssigned ? '' : group.id)}
                          title={isCurrentAssigned ? 'Desvincular del capítulo actual' : 'Asignar al capítulo actual'}
                        >
                          {isCurrentAssigned ? '✓ Asignado' : 'Asignar a este'}
                        </button>
                      )}

                      <button
                        className="btn-icon"
                        onClick={() => (isEditing ? handleSaveEditing() : handleStartEditing(group))}
                        title="Editar nombre del grupo"
                        style={{ padding: '5px' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteGroup(group.id)}
                        title="Eliminar grupo"
                        style={{ padding: '5px', color: 'var(--danger-color)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie del modal */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={handleDownloadSNBT}
            disabled={chapterGroups.length === 0}
            style={{ fontSize: '0.78rem', gap: '6px' }}
            title="Descargar archivo individual chapter_groups.snbt"
          >
            <Download size={14} /> Descargar chapter_groups.snbt
          </button>

          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.78rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
