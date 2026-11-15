import { describe, expect, it } from 'vitest';
import { hexToTableIdNumber, tableIdFromInput, tableIdToHex } from './tableId';
import { stringifySNBT } from './snbt';

// Pareja real de ATM9: reward table con id "51D81405A1552C58" referenciada como table_id: 5897485726455770200L
const HEX = '51D81405A1552C58';
const DEC = '5897485726455770200';

describe('tableId', () => {
  it('convierte el hex de una tabla en el long que espera FTB Quests', () => {
    const n = hexToTableIdNumber(HEX);
    expect(n.suffix).toBe('L');
    expect(n.raw).toBe(DEC);
    expect(stringifySNBT(n)).toBe(`${DEC}L`);
  });

  it('vuelve del número al hex, con ceros a la izquierda', () => {
    expect(tableIdToHex({ __type: 'number', value: Number(DEC), suffix: 'L', raw: DEC })).toBe(HEX);
    expect(tableIdToHex({ __type: 'number', value: 5, suffix: 'L', raw: '5' })).toBe('0000000000000005');
  });

  it('los ids con el bit alto activo son longs negativos y vuelven al mismo hex', () => {
    const n = hexToTableIdNumber('F000000000000001');
    expect(n.raw).toBe('-1152921504606846975');
    expect(tableIdToHex(n)).toBe('F000000000000001');
  });

  it('ida y vuelta para ids aleatorios', () => {
    for (let i = 0; i < 200; i++) {
      const hex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
      expect(tableIdToHex(hexToTableIdNumber(hex))).toBe(hex);
    }
  });

  it('acepta el hex tal cual (texto) y lo normaliza a mayúsculas', () => {
    expect(tableIdToHex('51d81405a1552c58')).toBe(HEX);
  });

  it('devuelve vacío para undefined y no pierde lo que se está escribiendo', () => {
    expect(tableIdToHex(undefined)).toBe('');
    expect(tableIdToHex('51D8')).toBe('51D8');
  });

  it('tableIdFromInput solo convierte ids completos de 16 hex', () => {
    expect(tableIdFromInput(HEX)).toMatchObject({ __type: 'number', suffix: 'L', raw: DEC });
    expect(tableIdFromInput('51D8')).toBe('51D8');
  });
});
