/**
 * Conversión entre el ID de una reward table y la referencia `table_id` de FTB Quests.
 *
 * - El archivo de la tabla guarda su ID como hexadecimal de 16 caracteres: id: "0C83C7A93ED80A36"
 * - Las recompensas (random / loot / choice / all_table) lo referencian como un long con signo
 *   en decimal: table_id: 899283412392345678L  (BigInt.asIntN(64, 0x0C83C7A93ED80A36))
 *
 * Escribir el hexadecimal como cadena rompe la referencia en el juego, por eso se convierte.
 */

const HEX16 = /^[0-9a-fA-F]{16}$/;

/** Convierte el ID hexadecimal de una tabla en el número `L` que espera FTB Quests. */
export function hexToTableIdNumber(hex: string): { __type: 'number'; value: number; suffix: string; raw: string } {
  const dec = BigInt.asIntN(64, BigInt('0x' + hex)).toString();
  return { __type: 'number', value: parseFloat(dec), suffix: 'L', raw: dec };
}

/**
 * Devuelve el ID hexadecimal (16 caracteres, mayúsculas) de cualquier forma de `table_id`.
 * Si el valor no se puede interpretar, se devuelve tal cual (como texto) para no perder lo escrito.
 */
export function tableIdToHex(ref: any): string {
  if (ref === undefined || ref === null) return '';
  if (typeof ref === 'string') return HEX16.test(ref) ? ref.toUpperCase() : ref;

  let dec: string | null = null;
  if (typeof ref === 'object' && ref.__type === 'number') {
    dec = ref.raw !== undefined && parseFloat(ref.raw) === ref.value ? String(ref.raw) : String(Math.trunc(ref.value));
  } else if (typeof ref === 'number') {
    dec = String(Math.trunc(ref));
  }

  if (dec !== null && /^-?\d+$/.test(dec)) {
    return BigInt.asUintN(64, BigInt(dec)).toString(16).toUpperCase().padStart(16, '0');
  }
  return String(ref);
}

/** Valor para guardar en `table_id` a partir de lo que escribe el usuario. */
export function tableIdFromInput(text: string): any {
  return HEX16.test(text) ? hexToTableIdNumber(text) : text;
}
