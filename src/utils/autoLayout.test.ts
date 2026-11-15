import { describe, expect, it } from 'vitest';
import { computeAutoLayout } from './autoLayout';

const d = (value: number) => ({ __type: 'number', value, suffix: 'd' });
const quest = (id: string, deps: string[] = [], x = 0, y = 0) => ({ id, dependencies: deps, x: d(x), y: d(y) });

describe('computeAutoLayout', () => {
  it('coloca cada misión en una capa posterior a sus prerrequisitos (izquierda → derecha)', () => {
    const quests = [quest('A'), quest('B', ['A']), quest('C', ['B'])];
    const { positions, totalLayers, organizedCount } = computeAutoLayout(quests, { direction: 'LR' });

    expect(totalLayers).toBe(3);
    expect(organizedCount).toBe(3);
    expect(positions.get('A')!.x).toBeLessThan(positions.get('B')!.x);
    expect(positions.get('B')!.x).toBeLessThan(positions.get('C')!.x);
  });

  it('en vertical el avance es en Y', () => {
    const quests = [quest('A'), quest('B', ['A'])];
    const { positions } = computeAutoLayout(quests, { direction: 'TB' });
    expect(positions.get('A')!.y).toBeLessThan(positions.get('B')!.y);
  });

  it('usa el camino más largo: una misión con dos prerrequisitos va tras el más profundo', () => {
    const quests = [quest('A'), quest('B', ['A']), quest('C', ['A', 'B'])];
    const { positions, totalLayers } = computeAutoLayout(quests);
    expect(totalLayers).toBe(3);
    expect(positions.get('C')!.x).toBeGreaterThan(positions.get('B')!.x);
  });

  it('las posiciones son múltiplos de 0.5 (cuadrícula de FTB Quests)', () => {
    const quests = [quest('A'), quest('B', ['A']), quest('C', ['A']), quest('D', ['B', 'C'])];
    const { positions } = computeAutoLayout(quests);
    positions.forEach(({ x, y }) => {
      expect(Math.abs((x * 2) % 1)).toBe(0);
      expect(Math.abs((y * 2) % 1)).toBe(0);
    });
  });

  it('conserva el centro original del conjunto para que no salte lejos', () => {
    const quests = [quest('A', [], 100, 50), quest('B', ['A'], 102, 50), quest('C', ['B'], 104, 50)];
    const { positions } = computeAutoLayout(quests);
    const meanX = [...positions.values()].reduce((s, p) => s + p.x, 0) / positions.size;
    const meanY = [...positions.values()].reduce((s, p) => s + p.y, 0) / positions.size;
    expect(Math.abs(meanX - 102)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(meanY - 50)).toBeLessThanOrEqual(0.5);
  });

  it('no se cuelga con ciclos y sigue colocando todas las misiones', () => {
    const quests = [quest('A', ['B']), quest('B', ['A']), quest('C', ['B'])];
    const result = computeAutoLayout(quests);
    expect(result.organizedCount).toBe(3);
    expect(result.positions.size).toBe(3);
  });

  it('con targetQuestIds solo reubica ese subconjunto', () => {
    const quests = [quest('A', [], 0, 0), quest('B', ['A'], 5, 5), quest('C', ['B'], 9, 9)];
    const { positions, organizedCount } = computeAutoLayout(quests, { targetQuestIds: ['B', 'C'] });
    expect(organizedCount).toBe(2);
    expect(positions.has('A')).toBe(false);
    expect(positions.has('B')).toBe(true);
  });

  it('una lista vacía no produce posiciones', () => {
    expect(computeAutoLayout([])).toEqual({ positions: new Map(), totalLayers: 0, organizedCount: 0 });
  });
});
