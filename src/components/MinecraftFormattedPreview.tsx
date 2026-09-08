import React, { useState } from 'react';
import { parseMinecraftText } from '../utils/minecraftText';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface MinecraftFormattedPreviewProps {
  text: string | string[];
  label?: string;
  defaultColor?: string;
  collapsible?: boolean;
}

export const MinecraftFormattedPreview: React.FC<MinecraftFormattedPreviewProps> = ({
  text,
  label = 'Vista Previa en Juego',
  defaultColor = '#FFFFFF',
  collapsible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const fullText = Array.isArray(text) ? text.join('\n') : (text || '');
  const hasContent = fullText.trim().length > 0;

  return (
    <div
      className="mc-preview-container"
      style={{
        marginTop: '6px',
        marginBottom: '6px',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid rgba(123, 97, 255, 0.25)',
        background: 'rgba(16, 0, 16, 0.92)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Encabezado conmutador */}
      <div
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: 'rgba(40, 0, 112, 0.35)',
          borderBottom: isExpanded ? '1px solid rgba(123, 97, 255, 0.2)' : 'none',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Eye size={12} />
          <span>{label}</span>
        </div>
        {collapsible && (
          <div style={{ color: '#a78bfa' }}>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        )}
      </div>

      {/* Caja de renderizado con estilo Minecraft */}
      {isExpanded && (
        <div
          style={{
            padding: '8px 10px',
            fontSize: '0.83rem',
            lineHeight: 1.45,
            fontFamily: "'Minecraft', Consolas, 'Courier New', monospace",
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            minHeight: '26px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {hasContent ? (
            parseMinecraftText(fullText, defaultColor)
          ) : (
            <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.75rem' }}>
              (Escribe texto para ver cómo se renderizará con colores y estilos en FTB Quests)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
