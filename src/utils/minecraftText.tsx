import React from 'react';

export interface MinecraftColorDef {
  code: string;
  name: string;
  hex: string;
}

export interface MinecraftFormatDef {
  code: string;
  name: string;
  styleKey: string;
  symbol: string;
}

export const MINECRAFT_COLORS: Record<string, MinecraftColorDef> = {
  '0': { code: '&0', name: 'Negro', hex: '#000000' },
  '1': { code: '&1', name: 'Azul Oscuro', hex: '#0000AA' },
  '2': { code: '&2', name: 'Verde Oscuro', hex: '#00AA00' },
  '3': { code: '&3', name: 'Aqua Oscuro', hex: '#00AAAA' },
  '4': { code: '&4', name: 'Rojo Oscuro', hex: '#AA0000' },
  '5': { code: '&5', name: 'Púrpura Oscuro', hex: '#AA00AA' },
  '6': { code: '&6', name: 'Dorado', hex: '#FFAA00' },
  '7': { code: '&7', name: 'Gris', hex: '#AAAAAA' },
  '8': { code: '&8', name: 'Gris Oscuro', hex: '#555555' },
  '9': { code: '&9', name: 'Azul', hex: '#5555FF' },
  'a': { code: '&a', name: 'Verde Lima', hex: '#55FF55' },
  'b': { code: '&b', name: 'Aqua', hex: '#55FFFF' },
  'c': { code: '&c', name: 'Rojo Claro', hex: '#FF5555' },
  'd': { code: '&d', name: 'Rosa / Magenta', hex: '#FF55FF' },
  'e': { code: '&e', name: 'Amarillo', hex: '#FFFF55' },
  'f': { code: '&f', name: 'Blanco', hex: '#FFFFFF' },
};

export const MINECRAFT_FORMATS: Record<string, MinecraftFormatDef> = {
  'l': { code: '&l', name: 'Negrita', styleKey: 'bold', symbol: 'B' },
  'o': { code: '&o', name: 'Cursiva', styleKey: 'italic', symbol: 'I' },
  'n': { code: '&n', name: 'Subrayado', styleKey: 'underline', symbol: 'U' },
  'm': { code: '&m', name: 'Tachado', styleKey: 'strikethrough', symbol: 'S' },
  'k': { code: '&k', name: 'Ofuscado (Mágico)', styleKey: 'obfuscated', symbol: '?' },
  'r': { code: '&r', name: 'Restablecer', styleKey: 'reset', symbol: '↺' },
};

/**
 * Elimina todos los códigos de formato de Minecraft (&a, §b, &#RRGGBB) para obtener texto limpio.
 */
export function stripMinecraftFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:&|§)#[0-9a-fA-F]{6}/g, '')
    .replace(/(?:&|§)[0-9a-fk-orA-FK-OR]/g, '');
}

/**
 * Obtiene el primer color encontrado en el texto (HEX) para entintar elementos.
 */
export function getFirstMinecraftColor(text: string): string | undefined {
  if (!text) return undefined;
  
  // Buscar hex primero: &#RRGGBB o §#RRGGBB
  const hexMatch = text.match(/(?:&|§)#([0-9a-fA-F]{6})/);
  if (hexMatch) {
    return `#${hexMatch[1]}`;
  }

  // Buscar color estándar de 1 dígito
  const match = text.match(/(?:&|§)([0-9a-fA-F])/);
  if (match) {
    const key = match[1].toLowerCase();
    if (MINECRAFT_COLORS[key]) {
      return MINECRAFT_COLORS[key].hex;
    }
  }

  return undefined;
}

interface FormatState {
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
}

const DEFAULT_FORMAT_STATE: FormatState = {
  color: '#FFFFFF',
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  obfuscated: false,
};

/**
 * Analiza sintácticamente un string con códigos Minecraft (& o § y &#RRGGBB)
 * y devuelve nodos React con estilos inline y sombras pixel-art auténticas.
 */
export function parseMinecraftText(text: string, defaultColor: string = '#FFFFFF'): React.ReactNode {
  if (!text) return null;

  // Regex para detectar:
  // 1. Hex: (?:&|§)#[0-9a-fA-F]{6}
  // 2. Estándar: (?:&|§)[0-9a-fk-orA-FK-OR]
  // 3. Saltos de línea: \n
  const tokenRegex = /((?:&|§)#[0-9a-fA-F]{6}|(?:&|§)[0-9a-fk-orA-FK-OR]|\n)/g;
  const parts = text.split(tokenRegex);

  let state: FormatState = { ...DEFAULT_FORMAT_STATE, color: defaultColor };
  const nodes: React.ReactNode[] = [];
  let keyIndex = 0;

  for (const part of parts) {
    if (!part) continue;

    if (part === '\n') {
      nodes.push(<br key={`br-${keyIndex++}`} />);
      continue;
    }

    // Verificar si es un código de color hex: &#RRGGBB o §#RRGGBB
    const hexMatch = part.match(/^(?:&|§)#([0-9a-fA-F]{6})$/);
    if (hexMatch) {
      state = {
        ...state,
        color: `#${hexMatch[1]}`
      };
      continue;
    }

    // Verificar si es un código estándar: &X o §X
    const codeMatch = part.match(/^(?:&|§)([0-9a-fk-orA-FK-OR])$/);
    if (codeMatch) {
      const code = codeMatch[1].toLowerCase();

      if (MINECRAFT_COLORS[code]) {
        // En Minecraft, un nuevo color restablece los estilos de formato
        state = {
          color: MINECRAFT_COLORS[code].hex,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          obfuscated: false,
        };
      } else if (code === 'r') {
        state = { ...DEFAULT_FORMAT_STATE, color: defaultColor };
      } else if (code === 'l') {
        state = { ...state, bold: true };
      } else if (code === 'o') {
        state = { ...state, italic: true };
      } else if (code === 'n') {
        state = { ...state, underline: true };
      } else if (code === 'm') {
        state = { ...state, strikethrough: true };
      } else if (code === 'k') {
        state = { ...state, obfuscated: true };
      }
      continue;
    }

    // Es texto imprimible
    const style: React.CSSProperties = {
      color: state.color,
      fontWeight: state.bold ? 700 : 400,
      fontStyle: state.italic ? 'italic' : 'normal',
      textShadow: '1px 1px 0px rgba(0, 0, 0, 0.85)',
      letterSpacing: '0.2px',
    };

    const decorations: string[] = [];
    if (state.underline) decorations.push('underline');
    if (state.strikethrough) decorations.push('line-through');
    if (decorations.length > 0) {
      style.textDecoration = decorations.join(' ');
    }

    nodes.push(
      <span
        key={`mc-${keyIndex++}`}
        style={style}
        className={state.obfuscated ? 'mc-obfuscated' : undefined}
      >
        {part}
      </span>
    );
  }

  return <>{nodes}</>;
}
