/**
 * MinecraftTextEditorModal.tsx
 *
 * Diálogo modal avanzado para edición de Títulos, Subtítulos y Descripciones de FTB Quests.
 * Ofrece:
 * - Paleta completa de colores de Minecraft (&0-&f) y selector Hexadecimal (&#RRGGBB).
 * - Botones de formato rápido (&l Negrita, &o Cursiva, &n Subrayado, &m Tachado, &k Ofuscado, &r Reset).
 * - Inserción inteligente envolviendo la selección de texto activa.
 * - Vista previa en vivo idéntica a Minecraft: soporte de temas "Pergamino de Misiones" y "GUI Oscura FTB".
 * - Soporte para strings simples o arrays de líneas de descripción (formato nativo FTB Quests).
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, Type, Sparkles, BookOpen, Monitor, Eraser, 
  Palette, Bold, Italic, Underline, Strikethrough, RotateCcw
} from 'lucide-react';
import { 
  MINECRAFT_COLORS,  
  parseMinecraftText, 
  stripMinecraftFormatting 
} from '../utils/minecraftText';

interface MinecraftTextEditorModalProps {
  isOpen: boolean;
  fieldTitle: string;
  initialValue: string | string[];
  isMultiline?: boolean;
  onSave: (value: string | string[]) => void;
  onClose: () => void;
}

export const MinecraftTextEditorModal: React.FC<MinecraftTextEditorModalProps> = ({
  isOpen,
  fieldTitle,
  initialValue,
  isMultiline = false,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState<string>('');
  const [previewTheme, setPreviewTheme] = useState<'book' | 'dark'>('book');
  const [customHex, setCustomHex] = useState<string>('#FFAA00');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializar texto
  useEffect(() => {
    if (Array.isArray(initialValue)) {
      setText(initialValue.join('\n'));
    } else {
      setText(initialValue || '');
    }
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  // Insertar código de formato envolviendo la selección o en la posición del cursor
  const insertFormatting = (prefix: string, suffix: string = '&r') => {
    const el = isMultiline ? textareaRef.current : inputRef.current;
    if (!el) {
      setText((prev) => prev + prefix);
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const selectedText = text.substring(start, end);

    let newText = '';
    let newCursorPos = start + prefix.length;

    if (selectedText.length > 0) {
      newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      newText = text.substring(0, start) + prefix + text.substring(end);
      newCursorPos = start + prefix.length;
    }

    setText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleApplyHex = () => {
    if (/^#[0-9a-fA-F]{6}$/.test(customHex)) {
      insertFormatting(`&${customHex}`);
    }
  };

  const handleClearFormatting = () => {
    const el = isMultiline ? textareaRef.current : inputRef.current;
    if (!el) {
      setText(stripMinecraftFormatting(text));
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? text.length;
    if (start !== end) {
      const selectedText = text.substring(start, end);
      const cleaned = stripMinecraftFormatting(selectedText);
      setText(text.substring(0, start) + cleaned + text.substring(end));
    } else {
      setText(stripMinecraftFormatting(text));
    }
  };

  const handleSave = () => {
    if (isMultiline && Array.isArray(initialValue)) {
      const lines = text.split('\n');
      onSave(lines);
    } else {
      onSave(text);
    }
    onClose();
  };

  // Preview de cada línea con parseMinecraftText
  const lines = text.split('\n');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100200,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: 'var(--surface-color, #181825)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
      >
        {/* Encabezado del Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Type size={20} className="text-accent" style={{ color: '#89b4fa' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#cdd6f4', fontWeight: 600 }}>
                {fieldTitle}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a6adc8)' }}>
                Editor enriquecido con códigos de formato de Minecraft (&) y previsualización en vivo
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-icon"
              onClick={onClose}
              title="Cerrar (Esc)"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '6px',
                color: '#cdd6f4',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Herramientas de Formato de Minecraft */}
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Paleta de Colores de Minecraft */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#a6adc8', marginRight: '4px' }}>Colores:</span>
            {Object.entries(MINECRAFT_COLORS).map(([code, def]) => (
              <button
                key={code}
                onClick={() => insertFormatting(def.code)}
                title={`${def.name} (${def.code})`}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  background: def.hex,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}

            {/* Selector Hex */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                title="Elegir color hexadecimal personalizado"
                style={{
                  width: '24px',
                  height: '22px',
                  padding: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={handleApplyHex}
                style={{ padding: '3px 8px', fontSize: '0.72rem', height: '22px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Insertar color hexadecimal (&#RRGGBB)"
              >
                <Palette size={12} /> Hex
              </button>
            </div>
          </div>

          {/* Formatos (Negrita, Cursiva, etc.) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&l')}
              title="Negrita (&l)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Bold size={13} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&o')}
              title="Cursiva (&o)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Italic size={13} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&n')}
              title="Subrayado (&n)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Underline size={13} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&m')}
              title="Tachado (&m)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Strikethrough size={13} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&k')}
              title="Ofuscado Mágico (&k)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Sparkles size={13} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => insertFormatting('&r', '')}
              title="Restablecer formato (&r)"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fab387' }}
            >
              <RotateCcw size={13} /> &r
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleClearFormatting}
              title="Eliminar todos los códigos de formato del texto"
              style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Eraser size={13} /> Limpiar
            </button>
          </div>
        </div>

        {/* Cuerpo del Editor: Split Editor Izquierda / Preview Derecha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: '380px', overflow: 'hidden' }}>
          {/* Panel Izquierdo: Campo de Entrada */}
          <div
            style={{
              padding: '16px 20px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#cdd6f4', fontWeight: 600 }}>Texto con Formato FTB:</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #a6adc8)' }}>
                {text.length} caracteres • {lines.length} {lines.length === 1 ? 'línea' : 'líneas'}
              </span>
            </div>

            {isMultiline ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe aquí la descripción de la misión... Puedes usar códigos &a, &b, &l..."
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f5e0dc',
                  fontSize: '0.9rem',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none',
                }}
                autoFocus
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ejemplo: &6&lCapítulo 1: &aEl Comienzo..."
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#f5e0dc',
                  fontSize: '0.95rem',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  outline: 'none',
                }}
                autoFocus
              />
            )}

            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #a6adc8)', lineHeight: '1.4' }}>
              💡 <strong>Tip:</strong> Selecciona cualquier fragmento de texto con el cursor y haz clic en un color o formato para aplicarlo directamente.
            </div>
          </div>

          {/* Panel Derecho: Vista Previa en Vivo */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(0,0,0,0.25)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#cdd6f4', fontWeight: 600 }}>Vista Previa en Vivo (Minecraft):</span>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn ${previewTheme === 'book' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreviewTheme('book')}
                  style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Estilo pergamino de libro de misiones"
                >
                  <BookOpen size={12} /> Libro
                </button>
                <button
                  className={`btn ${previewTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreviewTheme('dark')}
                  style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Estilo GUI oscura de FTB Quests"
                >
                  <Monitor size={12} /> Oscuro
                </button>
              </div>
            </div>

            {/* Contenedor de la Vista Previa */}
            <div
              style={{
                flex: 1,
                minHeight: '260px',
                borderRadius: '8px',
                padding: '18px',
                border: previewTheme === 'book' ? '2px solid #8b7355' : '1px solid rgba(255,255,255,0.1)',
                background: previewTheme === 'book' 
                  ? 'linear-gradient(135deg, #f4e8c1 0%, #e6d3a3 100%)' 
                  : '#11111b',
                color: previewTheme === 'book' ? '#2c2214' : '#cdd6f4',
                boxShadow: previewTheme === 'book' 
                  ? 'inset 0 0 20px rgba(100, 70, 30, 0.25)' 
                  : 'inset 0 0 15px rgba(0, 0, 0, 0.5)',
                fontFamily: '"Minecraft", Consolas, monospace',
                fontSize: '1rem',
                lineHeight: '1.6',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {lines.length === 0 || (lines.length === 1 && lines[0] === '') ? (
                <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
                  (Escribe en el panel izquierdo para previsualizar aquí en tiempo real...)
                </span>
              ) : (
                lines.map((line, idx) => (
                  <div key={idx} style={{ minHeight: '1.4em' }}>
                    {parseMinecraftText(line, previewTheme === 'book' ? '#2c2214' : '#cdd6f4')}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pie del Modal con Acciones */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '7px 18px', fontSize: '0.85rem' }}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            style={{ padding: '7px 22px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
