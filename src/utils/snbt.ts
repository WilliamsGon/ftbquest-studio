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
      
      const numMatch = valStr.match(/^(-?\d+(\.\d+)?)[dDLlBbFf]?$/);
      if (numMatch) {
        return { __type: 'number', value: parseFloat(numMatch[1]), suffix: valStr.replace(numMatch[1], '') };
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

  function parseArray(): any[] {
    pos++; // skip [
    const arr = [];
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
    return arr;
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
        const match = snbt.slice(pos).match(/^([a-zA-Z0-9_]+)/);
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
      return `${obj.value}${obj.suffix}`;
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
      const val = obj[key];
      if (val === undefined) continue;
      
      const keyStr = /^[a-zA-Z0-9_]+$/.test(key) ? key : `"${key}"`;
      str += innerIndent + `${keyStr}: ` + stringifySNBT(val, indentLevel + 1) + '\n';
    }
    str += indent + '}';
    return str;
  }
  
  return String(obj);
}
