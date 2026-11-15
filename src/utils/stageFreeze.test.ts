import { describe, expect, it, vi } from 'vitest';
import { createStageFreezer, HEAVY_SCENE_COST, sceneCost } from './stageFreeze';

function fakeStage(x = 10, y = 20, scale = 2) {
  const mkLayer = () => {
    const el: any = { style: {} as Record<string, string> };
    const layer: any = { batchDraw: vi.fn(function (this: any) { return this; }), getNativeCanvasElement: () => el, el };
    return layer;
  };
  const layers = [mkLayer(), mkLayer()];
  const stage: any = { x: () => x, y: () => y, scaleX: () => scale, getLayers: () => layers, batchDraw: vi.fn(), layers };
  return stage;
}

describe('sceneCost', () => {
  it('pesa las misiones más que las imágenes', () => {
    expect(sceneCost(10, 5)).toBe(35);
  });
  it('un capítulo normal no se considera pesado y uno masivo sí', () => {
    expect(sceneCost(125, 4)).toBeLessThan(HEAVY_SCENE_COST);
    expect(sceneCost(465, 2682)).toBeGreaterThanOrEqual(HEAVY_SCENE_COST);
  });
});

describe('createStageFreezer', () => {
  it('congelado, las capas no se redibujan', () => {
    const stage = fakeStage();
    const original = stage.layers[0].batchDraw;
    const f = createStageFreezer();
    f.freeze(stage);
    stage.layers[0].batchDraw();
    expect(f.isFrozen).toBe(true);
    expect(original).not.toHaveBeenCalled();
  });

  it('la transformación CSS lleva los píxeles de la cámara base a la nueva', () => {
    const stage = fakeStage(10, 20, 2);
    const f = createStageFreezer();
    f.freeze(stage);
    f.setCamera({ x: 50, y: 60, scale: 4 }, stage); // k = 2
    // un punto del mundo en (w): pantalla base = w*2+10 ; nueva = w*4+50 ; CSS: p*k + (x - base.x*k)
    const base = (w: number) => w * 2 + 10;
    const nuevo = (w: number) => w * 4 + 50;
    const tx = 50 - 10 * 2;
    expect(stage.layers[0].el.style.transform).toBe(`translate(${tx}px, ${60 - 20 * 2}px) scale(2)`);
    expect(base(7) * 2 + tx).toBe(nuevo(7));
  });

  it('descongelar restaura el dibujado, limpia el CSS y pinta una vez', () => {
    const stage = fakeStage();
    const original = stage.layers[0].batchDraw;
    const f = createStageFreezer();
    f.freeze(stage);
    f.setCamera({ x: 0, y: 0, scale: 1 }, stage);
    f.thaw(stage);
    expect(f.isFrozen).toBe(false);
    expect(stage.layers[0].batchDraw).toBe(original);
    expect(stage.layers[0].el.style.transform).toBe('');
    expect(stage.batchDraw).toHaveBeenCalledTimes(1);
  });

  it('freeze es idempotente y conserva la cámara de referencia', () => {
    const stage = fakeStage(10, 20, 2);
    const f = createStageFreezer();
    f.freeze(stage);
    f.setCamera({ x: 99, y: 99, scale: 3 }, stage);
    f.freeze(stage);
    expect(f.camera).toEqual({ x: 99, y: 99, scale: 3 });
  });

  it('setCamera sin congelar no hace nada', () => {
    const stage = fakeStage();
    createStageFreezer().setCamera({ x: 1, y: 1, scale: 1 }, stage);
    expect(stage.layers[0].el.style.transform).toBeUndefined();
  });
});
