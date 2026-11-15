import { describe, expect, it } from 'vitest';
import { parseSNBT, stringifySNBT } from './snbt';

const num = (value: number, suffix = '') => expect.objectContaining({ __type: 'number', value, suffix });

describe('parseSNBT', () => {
  it('lee objetos, cadenas, booleanos y listas', () => {
    const parsed = parseSNBT(`{
      title: "Hola \\"mundo\\""
      optional: true
      hidden: false
      deps: ["A1", "B2"]
      nested: { a: "x" }
    }`);
    expect(parsed.title).toBe('Hola "mundo"');
    expect(parsed.optional).toBe(true);
    expect(parsed.hidden).toBe(false);
    expect(parsed.deps).toEqual(['A1', 'B2']);
    expect(parsed.nested).toEqual({ a: 'x' });
  });

  it('conserva el sufijo de los números', () => {
    const parsed = parseSNBT('{ x: 1.5d, n: 4L, f: 2.0f, b: 1b, i: 20, neg: -3.25d, s: 7s }');
    expect(parsed.x).toEqual(num(1.5, 'd'));
    expect(parsed.n).toEqual(num(4, 'L'));
    expect(parsed.f).toEqual(num(2, 'f'));
    expect(parsed.b).toEqual(num(1, 'b'));
    expect(parsed.i).toEqual(num(20, ''));
    expect(parsed.neg).toEqual(num(-3.25, 'd'));
    expect(parsed.s).toEqual(num(7, 's'));
  });

  it('acepta claves con comillas y claves con punto, + o guion', () => {
    const parsed = parseSNBT('{ "quoted key": 1, GT.Tool: { Damage: 0 }, a-b: 2, c+d: 3 }');
    expect(Object.keys(parsed)).toEqual(['quoted key', 'GT.Tool', 'a-b', 'c+d']);
    expect(parsed['GT.Tool'].Damage).toEqual(num(0));
  });

  it('lee arrays tipados de NBT', () => {
    const parsed = parseSNBT('{ uuid: [I; 1, -2, 3, 4], big: [L;4000000L], bytes: [B; 1b, 2b], list: [[I; 1, 2]] }');
    expect(parsed.uuid).toEqual({ __type: 'typedArray', kind: 'I', items: [num(1), num(-2), num(3), num(4)] });
    expect(parsed.big.kind).toBe('L');
    expect(parsed.big.items).toEqual([num(4000000, 'L')]);
    expect(parsed.bytes.kind).toBe('B');
    expect(Array.isArray(parsed.list)).toBe(true);
    expect(parsed.list[0].kind).toBe('I');
  });

  it('un array normal que empieza por un identificador no se confunde con uno tipado', () => {
    const parsed = parseSNBT('{ a: [I1, B2] }');
    expect(Array.isArray(parsed.a)).toBe(true);
    expect(parsed.a).toEqual(['I1', 'B2']);
  });

  it('tolera saltos de línea CRLF y comas', () => {
    const parsed = parseSNBT('{\r\n\ta: 1,\r\n\tb: [ 1, 2 ]\r\n}');
    expect(parsed.a).toEqual(num(1));
    expect(parsed.b).toHaveLength(2);
  });

  it('lanza error si falta los dos puntos', () => {
    expect(() => parseSNBT('{ a 1 }')).toThrow(/Expected ':'/);
  });
});

describe('stringifySNBT', () => {
  it('reescribe arrays tipados en una línea', () => {
    expect(stringifySNBT({ __type: 'typedArray', kind: 'I', items: [{ __type: 'number', value: 1, suffix: '' }, { __type: 'number', value: -2, suffix: '' }] })).toBe(
      '[I; 1, -2]'
    );
  });

  it('conserva el texto original del número mientras el valor no cambie', () => {
    const parsed = parseSNBT('{ w: 2.0f, id: 5897485726455770200L, grid: 0.5d }');
    const out = stringifySNBT(parsed);
    expect(out).toContain('w: 2.0f');
    // un long de 19 dígitos no cabe en un double: no se puede reconstruir desde `value`
    expect(out).toContain('id: 5897485726455770200L');
    expect(out).toContain('grid: 0.5d');
  });

  it('escribe el valor nuevo cuando se edita un número leído', () => {
    const parsed = parseSNBT('{ w: 2.0f }');
    parsed.w.value = 3;
    expect(stringifySNBT(parsed)).toContain('w: 3f');
  });

  it('crea números a mano sin texto original', () => {
    expect(stringifySNBT({ n: { __type: 'number', value: 12, suffix: 'L' } })).toContain('n: 12L');
  });

  it('escapa comillas y barras, y entrecomilla claves no válidas', () => {
    const out = stringifySNBT({ 'with space': 'a "b" \\ c' });
    expect(out).toContain('"with space": "a \\"b\\" \\\\ c"');
  });

  it('no escribe claves internas (_) ni valores undefined', () => {
    const out = stringifySNBT({ _internal: 1, keep: 'x', skip: undefined });
    expect(out).toContain('keep: "x"');
    expect(out).not.toContain('_internal');
    expect(out).not.toContain('skip');
  });

  it('usa tabuladores y listas vacías como []', () => {
    const out = stringifySNBT({ list: [], obj: { a: 'b' } });
    expect(out).toContain('list: []');
    expect(out).toContain('\n\tobj: {\n\t\ta: "b"\n\t}');
  });
});

describe('ida y vuelta', () => {
  const sample = `{
	filename: "demo"
	quests: [
		{
			dependencies: ["0000000000000001"]
			id: "0000000000000002"
			tasks: [{
				id: "0000000000000003"
				item: {
					Count: 1
					id: "gtceu:iron_hammer"
					tag: {
						GT.Tool: { Damage: 0 }
						uuids: [[I; 1, 2, 3, 4]]
						ids: [L; 4000000L]
					}
				}
				type: "item"
			}]
			x: 6.0d
			y: -1.5d
		}
	]
}`;

  it('parse → stringify → parse da el mismo árbol', () => {
    const first = parseSNBT(sample);
    const second = parseSNBT(stringifySNBT(first));
    expect(second).toEqual(first);
  });

  it('stringify es estable: aplicarlo dos veces no cambia nada', () => {
    const once = stringifySNBT(parseSNBT(sample));
    const twice = stringifySNBT(parseSNBT(once));
    expect(twice).toBe(once);
  });
});
