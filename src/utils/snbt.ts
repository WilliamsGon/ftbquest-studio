export function parseSNBT(snbt: string): any {
  let pos = 0;
  
  function skipWhitespace() {
    while (pos < snbt.length && /\s/.test(snbt[pos])) {
      pos++;
    }
  }

  function parseValue(): any {
    skipWhitespace();
    if (pos >= snbt.length) return undefined;

    const char = snbt[pos];

    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === '"') return parseString();
    
    // Modificado para soportar guiones al principio de un número
    const match = snbt.slice(pos).match(/^(-?[a-zA-Z0-9_\-\.]+)/);
    if (match) {
      const valStr = match[1];
      pos += valStr.length;
      if (valStr === 'true') return true;
      if (valStr === 'false') return false;
      
      const numMatch = valStr.match(/^(-?\d+(\.\d+)?)[dDLlBbFfSs]?$/);
      if (numMatch) {
        // `raw` conserva el texto original (ej. "2.0", enteros largos) para reexportarlo sin cambios
        return { __type: 'number', value: parseFloat(numMatch[1]), suffix: valStr.slice(numMatch[1].length), raw: numMatch[1] };
      }
      return valStr;
    }

    throw new Error(`Unexpected character at ${pos}: ${char} (context: ${snbt.slice(Math.max(0, pos-10), pos+10)})`);
  }

  function parseString(): string {
    pos++; // skip "
    let str = "";
    while (pos < snbt.length) {
      const char = snbt[pos++];
      if (char === '"') break;
      if (char === '\\') {
        str += snbt[pos++]; // escape
      } else {
        str += char;
      }
    }
    return str;
  }

  function parseArray(): any {
    pos++; // skip [
    // Arrays tipados de NBT: [I; 1, 2], [L; 1L], [B; 1b]
    let kind: string | null = null;
    const typed = snbt.slice(pos).match(/^\s*([BILbil])\s*;/);
    if (typed) {
      kind = typed[1].toUpperCase();
      pos += typed[0].length;
    }
    const arr: any[] = [];
    while (pos < snbt.length) {
      skipWhitespace();
      if (snbt[pos] === ']') {
        pos++;
        break;
      }
      if (snbt[pos] === ',') {
        pos++;
        continue;
      }
      arr.push(parseValue());
    }
    return kind ? { __type: 'typedArray', kind, items: arr } : arr;
  }

  function parseObject(): Record<string, any> {
    pos++; // skip {
    const obj: Record<string, any> = {};
    while (pos < snbt.length) {
      skipWhitespace();
      if (snbt[pos] === '}') {
        pos++;
        break;
      }
      if (snbt[pos] === ',') {
        pos++;
        continue;
      }
      
      let key = "";
      if (snbt[pos] === '"') {
        key = parseString();
      } else {
        // Claves sin comillas: Minecraft admite también '.', '+' y '-' (ej. GT.Tool)
        const match = snbt.slice(pos).match(/^([a-zA-Z0-9_.+-]+)/);
        if (match) {
          key = match[1];
          pos += key.length;
        } else {
          throw new Error(`Expected key at ${pos}`);
        }
      }
      
      skipWhitespace();
      if (snbt[pos] !== ':') {
        throw new Error(`Expected ':' at ${pos}`);
      }
      pos++; // skip :
      
      obj[key] = parseValue();
    }
    return obj;
  }

  return parseValue();
}

export function stringifySNBT(obj: any, indentLevel = 0): string {
  const indent = '\t'.repeat(indentLevel);
  const innerIndent = '\t'.repeat(indentLevel + 1);

  if (obj === null || obj === undefined) return "";
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'string') {
    return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  
  if (typeof obj === 'object') {
    if (obj.__type === 'number') {
      // Si el valor no cambió respecto al texto original, se reescribe tal cual (2.0f, enteros largos...)
      const text = obj.raw !== undefined && parseFloat(obj.raw) === obj.value ? obj.raw : String(obj.value);
      return `${text}${obj.suffix ?? ''}`;
    }

    if (obj.__type === 'typedArray') {
      return `[${obj.kind}; ${(obj.items as any[]).map((v) => stringifySNBT(v, indentLevel + 1)).join(', ')}]`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      let str = '[\n';
      for (let i = 0; i < obj.length; i++) {
        str += innerIndent + stringifySNBT(obj[i], indentLevel + 1) + '\n';
      }
      str += indent + ']';
      return str;
    }
    
    let str = '{\n';
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.startsWith('_')) continue;
      const val = obj[key];
      if (val === undefined) continue;
      
      const keyStr = /^[a-zA-Z0-9_.+-]+$/.test(key) ? key : `"${key}"`;
      str += innerIndent + `${keyStr}: ` + stringifySNBT(val, indentLevel + 1) + '\n';
    }
    str += indent + '}';
    return str;
  }
  
  return String(obj);
}

/** Valor numérico de un campo del SNBT, sea número plano o `{ __type: 'number', value }`. */
export function numVal(v: any, fallback = NaN): number {
  if (v && typeof v === 'object' && v.__type === 'number') return Number(v.value);
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  return fallback;
}
