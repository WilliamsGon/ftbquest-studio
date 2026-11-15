import { describe, expect, it } from 'vitest';
import { validateQuestGraph } from './graphValidation';

const quest = (id: string, deps?: any) => ({ id, ...(deps !== undefined ? { dependencies: deps } : {}) });

describe('validateQuestGraph', () => {
  it('un grafo sin problemas es válido', () => {
    const result = validateQuestGraph([quest('A'), quest('B', ['A']), quest('C', ['A', 'B'])]);
    expect(result.isValid).toBe(true);
    expect(result.cycles).toEqual([]);
    expect(result.brokenDeps).toEqual([]);
  });

  it('detecta un ciclo simple y marca sus nodos', () => {
    const result = validateQuestGraph([quest('A', ['B']), quest('B', ['A'])]);
    expect(result.isValid).toBe(false);
    expect(result.cycles).toHaveLength(1);
    expect([...result.cycleNodeIds].sort()).toEqual(['A', 'B']);
  });

  it('detecta ciclos largos y autodependencias', () => {
    const long = validateQuestGraph([quest('A', ['C']), quest('B', ['A']), quest('C', ['B']), quest('D', ['A'])]);
    expect([...long.cycleNodeIds].sort()).toEqual(['A', 'B', 'C']);

    const self = validateQuestGraph([quest('X', ['X'])]);
    expect(self.isValid).toBe(false);
    expect(self.cycleNodeIds.has('X')).toBe(true);
  });

  it('un grafo en diamante no es un ciclo', () => {
    const result = validateQuestGraph([quest('A'), quest('B', ['A']), quest('C', ['A']), quest('D', ['B', 'C'])]);
    expect(result.cycles).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('detecta dependencias que apuntan a IDs inexistentes', () => {
    const result = validateQuestGraph([quest('A', ['FANTASMA'])]);
    expect(result.isValid).toBe(false);
    expect(result.brokenDeps).toEqual([{ questId: 'A', missingDepId: 'FANTASMA' }]);
    expect(result.brokenDepQuestIds.has('A')).toBe(true);
  });

  it('las dependencias a otro capítulo abierto no cuentan como rotas', () => {
    const result = validateQuestGraph([quest('A', ['OTRO'])], new Set(['OTRO']));
    expect(result.isValid).toBe(true);
    expect(result.crossChapterDeps).toEqual([{ questId: 'A', depId: 'OTRO' }]);
  });

  it('acepta los distintos formatos de dependencias', () => {
    const result = validateQuestGraph([quest('A'), quest('B', 'A'), quest('C', { id: 'A' }), quest('D', [{ id: 'B' }]), quest('E')]);
    expect(result.isValid).toBe(true);
    expect(result.brokenDeps).toEqual([]);
  });
});
