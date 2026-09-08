import React, { useRef } from 'react';
import { MINECRAFT_COLORS, MINECRAFT_FORMATS } from '../utils/minecraftText';
import { Palette } from 'lucide-react';

interface MinecraftTextToolbarProps {
  targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  compact?: boolean;
}

export const MinecraftTextToolbar: React.FC<MinecraftTextToolbarProps> = ({
  targetRef,
  value,
  onChange,
  compact = false,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const applyCode = (code: string) => {
    const el = targetRef.current;
    if (!el) {
      onChange(value + code);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;

    if (start !== end) {
      // Hay texto seleccionado: envolver con el código y cerrar con reset (&r)
      const before = value.substring(0, start);
      const selected = value.substring(start, end);
      const after = value.substring(end);

      const replacement = code === '&r' ? selected : `${code}${selected}&r`;
      const nextVal = `${before}${replacement}${after}`;
      onChange(nextVal);

      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + code.length, start + code.length + selected.length);
      }, 0);
    } else {
      // Sin selección: insertar en la posición actual del cursor
      const before = value.substring(0, start);
      const after = value.substring(end);
      const nextVal = `${before}${code}${after}`;
      onChange(nextVal);

      setTimeout(() => {
        el.focus();
        const newPos = start + code.length;
        el.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.toLowerCase();
    if (hex) {
      applyCode(`&${hex}`);
    }
  };

  return (
    <div
      className="mc-text-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap',
        padding: '3px 6px',
        background: 'rgba(15, 17, 23, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        marginBottom: '4px',
        userSelect: 'none',
      }}
    >
      {/* Paleta de 16 Colores Estándar de Minecraft */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
        {Object.entries(MINECRAFT_COLORS).map(([key, def]) => (
          <button
            key={key}
            type="button"
            className="mc-color-swatch-btn"
            title={`${def.name} (${def.code})`}
            onClick={(e) => {
              e.preventDefault();
              applyCode(def.code);
            }}
            style={{
              width: compact ? '13px' : '15px',
              height: compact ? '13px' : '15px',
              borderRadius: '3px',
              backgroundColor: def.hex,
              border: key === '0' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.5)',
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              transition: 'transform 0.1s ease, border-color 0.1s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.25)';
              e.currentTarget.style.borderColor = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1.0)';
              e.currentTarget.style.borderColor = key === '0' ? 'rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.5)';
            }}
          />
        ))}
      </div>

      <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

      {/* Botones de Formato */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {Object.entries(MINECRAFT_FORMATS).map(([key, def]) => (
          <button
            key={key}
            type="button"
            className="mc-format-btn"
            title={`${def.name} (${def.code})`}
            onClick={(e) => {
              e.preventDefault();
              applyCode(def.code);
            }}
            style={{
              background: key === 'r' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: key === 'r' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: key === 'r' ? '#f87171' : 'var(--text-primary)',
              borderRadius: '3px',
              padding: '1px 5px',
              fontSize: '0.72rem',
              fontWeight: key === 'l' ? 700 : 500,
              fontStyle: key === 'o' ? 'italic' : 'normal',
              textDecoration: key === 'n' ? 'underline' : (key === 'm' ? 'line-through' : 'none'),
              cursor: 'pointer',
              lineHeight: 1.2,
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {def.symbol}
          </button>
        ))}

        {/* Selector de color HEX personalizado */}
        <button
          type="button"
          title="Color HEX RGB personalizado (&#RRGGBB)"
          onClick={(e) => {
            e.preventDefault();
            colorInputRef.current?.click();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-secondary)',
            borderRadius: '3px',
            padding: '1px 4px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Palette size={11} />
        </button>
        <input
          ref={colorInputRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          onChange={handleCustomColorChange}
        />
      </div>
    </div>
  );
};
