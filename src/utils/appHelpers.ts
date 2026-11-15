import { v4 as uuidv4 } from 'uuid';

/** Helpers puros que usa el editor principal (ids, números SNBT, colores y posiciones). */
export const generateHexId = () => uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

export const getDValue = (val: any): any => {
  if (val === undefined || val === null) return val;
  if (typeof val === 'object' && val !== null) {
    if ('value' in val) {
      return val.value;
    }
  }
  return val;
};

export const decimalToHexColor = (val: any): string => {
  if (val === undefined || val === null) return '#ffffff';
  const num = typeof val === 'object' && val.__type === 'number' ? val.value : Number(val);
  if (isNaN(num)) return '#ffffff';
  return '#' + num.toString(16).padStart(6, '0');
};

export const hexColorToDecimal = (hex: string): number => {
  const cleanHex = hex.replace('#', '');
  return parseInt(cleanHex, 16);
};

export const getItemX = (item: { type: 'quest' | 'image'; id: string | number }, quests: any[], images: any[]): number => {
  if (item.type === 'quest') {
    const q = quests.find(qi => qi.id === item.id);
    return q ? (q.x?.value ?? q.x ?? 0) : 0;
  } else {
    const img = images[item.id as number];
    return img ? (img.x?.value ?? img.x ?? 0) : 0;
  }
};

export const getItemY = (item: { type: 'quest' | 'image'; id: string | number }, quests: any[], images: any[]): number => {
  if (item.type === 'quest') {
    const q = quests.find(qi => qi.id === item.id);
    return q ? (q.y?.value ?? q.y ?? 0) : 0;
  } else {
    const img = images[item.id as number];
    return img ? (img.y?.value ?? img.y ?? 0) : 0;
  }
};
