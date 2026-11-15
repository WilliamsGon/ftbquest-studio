import React from 'react';
import { X, Download, BookOpen, RotateCcw } from 'lucide-react';
import { stringifySNBT } from '../utils/snbt';
import {
  AUTOCLAIM_MODES,
  PROGRESSION_MODES,
  QUEST_SHAPES,
  createDefaultQuestBookData,
  snbtNumber,
  withNumber,
} from '../utils/questBook';

interface QuestBookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Contenido de data.snbt (null = aún no hay uno) */
  data: any | null;
  onUpdate: (data: any) => void;
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '8px',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};
const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px', alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--text-primary)' };
const hintStyle: React.CSSProperties = { fontSize: '0.68rem', color: 'var(--text-secondary)' };

export const QuestBookSettingsModal: React.FC<QuestBookSettingsModalProps> = ({ isOpen, onClose, data, onUpdate }) => {
  if (!isOpen) return null;

  const book = data ?? createDefaultQuestBookData();
  const set = (key: string, value: any) => onUpdate({ ...book, [key]: value });
  const setCrate = (key: string, value: number) =>
    onUpdate({
      ...book,
      loot_crate_no_drop: { ...(book.loot_crate_no_drop || {}), [key]: withNumber(book.loot_crate_no_drop?.[key], value) },
    });

  const handleDownload = () => {
    const blob = new Blob([stringifySNBT(book)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.snbt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const bool = (key: string, label: string, hint?: string) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0 }}>
      <input type="checkbox" checked={!!book[key]} onChange={(e) => set(key, e.target.checked)} style={{ marginTop: '2px' }} />
      <span>
        <span style={labelStyle}>{label}</span>
        {hint && <span style={{ ...hintStyle, display: 'block' }}>{hint}</span>}
      </span>
    </label>
  );

  const select = (key: string, label: string, options: string[], fallback: string) => (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <select
        className="input-field"
        style={{ fontSize: '0.8rem', height: '30px' }}
        value={typeof book[key] === 'string' ? book[key] : fallback}
        onChange={(e) => set(key, e.target.value)}
      >
        {/* Conserva valores que el editor no conoce para no perderlos */}
        {typeof book[key] === 'string' && !options.includes(book[key]) && <option value={book[key]}>{book[key]}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  const number = (key: string, label: string, hint: string, suffix = '', step = 1) => (
    <div style={rowStyle}>
      <span>
        <span style={labelStyle}>{label}</span>
        <span style={{ ...hintStyle, display: 'block' }}>{hint}</span>
      </span>
      <input
        type="number"
        className="input-field"
        style={{ fontSize: '0.8rem', height: '30px' }}
        step={step}
        min={0}
        value={snbtNumber(book[key])}
        onChange={(e) => set(key, withNumber(book[key], parseFloat(e.target.value) || 0, suffix))}
      />
    </div>
  );

  const iconValue = typeof book.icon === 'string' ? book.icon : book.icon?.id || '';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(18, 20, 29, 0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} style={{ color: '#89b4fa' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>Ajustes del Libro de Misiones</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Opciones globales (<code>data.snbt</code>). {data ? '' : 'Aún no hay data.snbt cargado: se parte de los valores por defecto.'}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar"><X size={18} /></button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={sectionStyle}>
            <div style={rowStyle}>
              <span style={labelStyle}>Título del libro</span>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', height: '30px' }}
                value={book.title ?? ''}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div style={rowStyle}>
              <span>
                <span style={labelStyle}>Icono (ID de ítem)</span>
                {typeof book.icon === 'object' && book.icon && (
                  <span style={{ ...hintStyle, display: 'block' }}>Tiene NBT; se conserva al cambiar solo el ID.</span>
                )}
              </span>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', height: '30px', fontFamily: 'monospace' }}
                value={iconValue}
                placeholder="minecraft:book"
                onChange={(e) => set('icon', typeof book.icon === 'object' && book.icon ? { ...book.icon, id: e.target.value } : e.target.value)}
              />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Mensaje de bloqueo</span>
              <input
                type="text"
                className="input-field"
                style={{ fontSize: '0.8rem', height: '30px' }}
                value={book.lock_message ?? ''}
                onChange={(e) => set('lock_message', e.target.value)}
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ ...labelStyle, fontWeight: 600 }}>Valores por defecto</div>
            {select('default_quest_shape', 'Forma de misión', QUEST_SHAPES, 'circle')}
            {select('progression_mode', 'Modo de progresión', PROGRESSION_MODES, 'flexible')}
            {select('default_autoclaim_rewards', 'Reclamo automático de recompensas', AUTOCLAIM_MODES, 'disabled')}
            {bool('default_consume_items', 'Consumir ítems al entregar')}
            {bool('default_quest_disable_jei', 'Desactivar integración con JEI')}
            {bool('default_reward_team', 'Recompensas de equipo por defecto')}
          </div>

          <div style={sectionStyle}>
            <div style={{ ...labelStyle, fontWeight: 600 }}>Comportamiento</div>
            {number('detection_delay', 'Retardo de detección', 'Ticks entre comprobaciones de tareas')}
            {number('emergency_items_cooldown', 'Enfriamiento de ítems de emergencia', 'Segundos')}
            {number('grid_scale', 'Escala de la cuadrícula', 'Tamaño de una unidad del mapa', 'd', 0.1)}
            {bool('pause_game', 'Pausar el juego al abrir el libro')}
            {bool('disable_gui', 'Desactivar la interfaz del libro')}
            {bool('drop_book_on_death', 'Soltar el libro al morir')}
            {bool('hide_excluded_quests', 'Ocultar misiones excluidas')}
            {bool('show_lock_icons', 'Mostrar iconos de candado')}
          </div>

          <div style={sectionStyle}>
            <div style={{ ...labelStyle, fontWeight: 600 }}>Loot crates</div>
            {bool('drop_loot_crates', 'Los mobs sueltan loot crates')}
            <div style={hintStyle}>Peso de "no soltar caja" por tipo de mob (valores tal cual de data.snbt):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {(['boss', 'monster', 'passive'] as const).map((k) => (
                <label key={k} style={{ ...labelStyle, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {k === 'boss' ? 'Jefes' : k === 'monster' ? 'Monstruos' : 'Pasivos'}
                  <input
                    type="number"
                    min={0}
                    className="input-field"
                    style={{ fontSize: '0.8rem', height: '30px' }}
                    value={snbtNumber(book.loot_crate_no_drop?.[k])}
                    onChange={(e) => setCrate(k, parseInt(e.target.value) || 0)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ ...hintStyle }}>
            Versión del formato: {snbtNumber(book.version, 13)}. Los campos que este editor no conoce se conservan tal cual al exportar.
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleDownload} style={{ fontSize: '0.78rem', gap: '6px' }} title="Descargar data.snbt">
              <Download size={14} /> Descargar data.snbt
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onUpdate(createDefaultQuestBookData())}
              style={{ fontSize: '0.78rem', gap: '6px' }}
              title="Volver a los valores por defecto de FTB Quests"
            >
              <RotateCcw size={14} /> Restablecer
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.78rem' }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
