/**
 * Congelado del lienzo durante el zoom y el paneo en escenas pesadas.
 *
 * Redibujar miles de nodos de Konva en cada paso de la rueda o del arrastre cuesta decenas de
 * milisegundos por fotograma. Mientras la cámara se mueve se "congelan" las capas: no se
 * redibujan y, en su lugar, se aplica una transformación CSS a sus <canvas> ya pintados. Cuando
 * el movimiento se detiene (o pasa un tiempo máximo) se descongela y se dibuja una sola vez
 * con la cámara final y el culling actualizado.
 */

/** Escena a partir de la cual compensa congelar (las misiones pesan ~3 veces más que una imagen). */
export const HEAVY_SCENE_COST = 1500;

export function sceneCost(questCount: number, imageCount: number): number {
  return questCount * 3 + imageCount;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface StageFreezer {
  readonly isFrozen: boolean;
  /** Cámara virtual mientras está congelado (el stage no se toca hasta descongelar). */
  readonly camera: Camera;
  /** Congela las capas (idempotente) tomando la cámara del stage como referencia. */
  freeze(stage: any): void;
  /** Mueve la cámara virtual y la refleja como transformación CSS sobre los canvas congelados. */
  setCamera(camera: Camera, stage: any): void;
  /** Quita la transformación, restaura el dibujado y pinta una vez. */
  thaw(stage: any): void;
}

export function createStageFreezer(): StageFreezer {
  let frozen = false;
  let base: Camera = { x: 0, y: 0, scale: 1 };
  let camera: Camera = { x: 0, y: 0, scale: 1 };
  const originalBatchDraw = new Map<any, any>();

  const canvasOf = (layer: any): HTMLCanvasElement | null => {
    try {
      return layer.getNativeCanvasElement?.() ?? layer.getCanvas?.()._canvas ?? null;
    } catch {
      return null;
    }
  };

  return {
    get isFrozen() {
      return frozen;
    },

    get camera() {
      return camera;
    },

    freeze(stage) {
      if (frozen) return;
      frozen = true;
      base = { x: stage.x(), y: stage.y(), scale: stage.scaleX() || 1 };
      camera = { ...base };
      stage.getLayers().forEach((layer: any) => {
        originalBatchDraw.set(layer, layer.batchDraw);
        layer.batchDraw = function () {
          return this;
        };
        const el = canvasOf(layer);
        if (el) el.style.transformOrigin = '0 0';
      });
    },

    setCamera(next, stage) {
      if (!frozen) return;
      camera = { ...next };
      // Tocar la transformación del stage obliga a Konva a invalidar la de todos sus nodos
      // (decenas de ms con miles de ellos), así que la cámara se mantiene aparte hasta descongelar.
      const k = camera.scale / base.scale;
      const tx = camera.x - base.x * k;
      const ty = camera.y - base.y * k;
      const css = `translate(${tx}px, ${ty}px) scale(${k})`;
      stage.getLayers().forEach((layer: any) => {
        const el = canvasOf(layer);
        if (el) el.style.transform = css;
      });
    },

    thaw(stage) {
      if (!frozen) return;
      frozen = false;
      try {
        stage.getLayers().forEach((layer: any) => {
          const original = originalBatchDraw.get(layer);
          if (original) layer.batchDraw = original;
          else delete layer.batchDraw;
          const el = canvasOf(layer);
          if (el) {
            el.style.transform = '';
            el.style.transformOrigin = '';
          }
        });
        stage.batchDraw();
      } finally {
        originalBatchDraw.clear();
      }
    },
  };
}
