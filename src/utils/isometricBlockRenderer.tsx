/**
 * isometricBlockRenderer.tsx
 *
 * Motor de renderizado isométrico en tiempo real para texturas de bloques de Minecraft.
 * Transforma texturas cuadradas 2D de bloques en cubos 3D idénticos al inventario/GUI de Minecraft:
 * - Cara superior (Top): Brillo 100% (luz directa cenital).
 * - Cara izquierda (Left): Sombreado ~82% (luz ambiental suroeste).
 * - Cara derecha (Right): Sombreado ~60% (sombra difusa sureste).
 * - Detección y composición automática de caras (_top, _front, _side).
 * - Renderizado pixelado puro (imageSmoothingEnabled = false) para nitidez Minecraft.
 * - Doble capa de caché en memoria (HTMLCanvasElement y DataURL) para máximo rendimiento.
 */

import React, { useEffect, useState } from 'react';

// Caché en memoria para Canvas, DataURLs y Promesas de imágenes
const dataUrlCache = new Map<string, string>();
const canvasCache = new Map<string, HTMLCanvasElement>();
const imgPromiseCache = new Map<string, Promise<HTMLImageElement | null>>();

/**
 * Carga una imagen de forma segura retornando null si falla (p. ej. si no existe _top)
 */
export function loadCachedImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  if (imgPromiseCache.has(url)) {
    return imgPromiseCache.get(url)!;
  }

  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

  imgPromiseCache.set(url, p);
  return p;
}

/**
 * Detecta si una ruta o URL corresponde a un bloque de Minecraft.
 */
export function isBlockTexture(urlOrPath: string): boolean {
  if (!urlOrPath) return false;
  const lower = urlOrPath.toLowerCase();
  return (
    lower.includes('/block/') ||
    lower.includes('textures/block') ||
    lower.includes('textures\\block') ||
    lower.includes('/blocks/') ||
    lower.endsWith('_block.png') ||
    lower.endsWith('_block')
  );
}

/**
 * Genera URLs candidatas para caras especializadas (_top, _front, _side) si existen
 */
export function deriveFaceUrls(baseBlockUrl: string): {
  topUrl: string | null;
  sideUrl: string;
  frontUrl: string | null;
} {
  const sideUrl = baseBlockUrl;
  let topUrl: string | null = null;
  let frontUrl: string | null = null;

  if (baseBlockUrl.endsWith('.png')) {
    const withoutExt = baseBlockUrl.slice(0, -4);
    if (withoutExt.endsWith('_side')) {
      const base = withoutExt.slice(0, -5);
      topUrl = `${base}_top.png`;
      frontUrl = `${base}_front.png`;
    } else if (withoutExt.endsWith('_top')) {
      topUrl = baseBlockUrl;
      const base = withoutExt.slice(0, -4);
      return { topUrl, sideUrl: `${base}.png`, frontUrl: `${base}_front.png` };
    } else {
      topUrl = `${withoutExt}_top.png`;
      frontUrl = `${withoutExt}_front.png`;
    }
  }

  return { topUrl, sideUrl, frontUrl };
}

/**
 * Renderiza un cubo isométrico con sombreado de Minecraft sobre un contexto 2D.
 */
export function renderIsometricBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  topImg: CanvasImageSource,
  leftImg: CanvasImageSource,
  rightImg: CanvasImageSource
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;

  // Proyección isométrica estándar Minecraft (30 grados)
  // Dejamos 1.5px de margen para evitar cortes por antialiasing
  const padding = 1.5;
  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  // En proyección isométrica de 30°:
  // ancho = 2 * s * cos(30°) = s * sqrt(3)
  // alto = 2 * s
  const s = Math.min(maxW / Math.sqrt(3), maxH / 2);
  const cos30 = Math.sqrt(3) / 2;
  const sin30 = 0.5;
  const w = s * cos30;
  const h = s * sin30;
  const cx = width / 2;
  const cy = height / 2;

  // --- CARA SUPERIOR (Top Face) ---
  // Vértices: Posterior (cx, cy - s), Derecha (cx + w, cy - h), Frontal (cx, cy), Izquierda (cx - w, cy - h)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + w, cy - h);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx - w, cy - h);
  ctx.closePath();
  ctx.clip();

  const topW = (topImg as HTMLImageElement).naturalWidth || (topImg as any).width || 16;
  const topH = (topImg as HTMLImageElement).naturalHeight || (topImg as any).height || 16;
  ctx.transform(w / topW, h / topW, -w / topH, h / topH, cx, cy - s);
  ctx.drawImage(topImg, 0, 0, topW, topH);
  ctx.restore();

  // --- CARA IZQUIERDA (Left Face) ---
  // Vértices: Superior-Izq (cx - w, cy - h), Frontal (cx, cy), Inferior (cx, cy + s), Inferior-Izq (cx - w, cy + h)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - w, cy + h);
  ctx.closePath();
  ctx.clip();

  const leftW = (leftImg as HTMLImageElement).naturalWidth || (leftImg as any).width || 16;
  const leftH = (leftImg as HTMLImageElement).naturalHeight || (leftImg as any).height || 16;
  ctx.transform(w / leftW, h / leftW, 0, s / leftH, cx - w, cy - h);
  ctx.drawImage(leftImg, 0, 0, leftW, leftH);
  // Sombreado de cara izquierda (~82% de brillo en Minecraft)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fill();
  ctx.restore();

  // --- CARA DERECHA (Right Face) ---
  // Vértices: Frontal (cx, cy), Superior-Der (cx + w, cy - h), Inferior-Der (cx + w, cy + h), Inferior (cx, cy + s)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + w, cy - h);
  ctx.lineTo(cx + w, cy + h);
  ctx.lineTo(cx, cy + s);
  ctx.closePath();
  ctx.clip();

  const rightW = (rightImg as HTMLImageElement).naturalWidth || (rightImg as any).width || 16;
  const rightH = (rightImg as HTMLImageElement).naturalHeight || (rightImg as any).height || 16;
  ctx.transform(w / rightW, -h / rightW, 0, s / rightH, cx, cy);
  ctx.drawImage(rightImg, 0, 0, rightW, rightH);
  // Sombreado de cara derecha (~60% de brillo en Minecraft)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
  ctx.fill();
  ctx.restore();
}

/**
 * Obtiene o renderiza un HTMLCanvasElement con el bloque isométrico.
 */
export async function getIsometricBlockCanvas(
  srcUrl: string,
  size: number = 48
): Promise<HTMLCanvasElement | null> {
  const cacheKey = `${srcUrl}__sz${size}`;
  if (canvasCache.has(cacheKey)) {
    return canvasCache.get(cacheKey)!;
  }

  const { topUrl, sideUrl, frontUrl } = deriveFaceUrls(srcUrl);

  const [baseImg, topCandidate, frontCandidate] = await Promise.all([
    loadCachedImage(sideUrl),
    topUrl && topUrl !== sideUrl ? loadCachedImage(topUrl) : Promise.resolve(null),
    frontUrl && frontUrl !== sideUrl ? loadCachedImage(frontUrl) : Promise.resolve(null),
  ]);

  if (!baseImg) return null;

  const topImg = topCandidate || baseImg;
  const leftImg = frontCandidate || baseImg;
  const rightImg = baseImg;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  renderIsometricBlock(ctx, size, size, topImg, leftImg, rightImg);

  canvasCache.set(cacheKey, canvas);
  dataUrlCache.set(cacheKey, canvas.toDataURL());

  return canvas;
}

/**
 * Obtiene el DataURL en formato PNG del bloque renderizado en 3D.
 */
export async function getIsometricBlockDataUrl(
  srcUrl: string,
  size: number = 48
): Promise<string | null> {
  const cacheKey = `${srcUrl}__sz${size}`;
  if (dataUrlCache.has(cacheKey)) {
    return dataUrlCache.get(cacheKey)!;
  }

  const canvas = await getIsometricBlockCanvas(srcUrl, size);
  if (!canvas) return null;
  return canvas.toDataURL();
}

/**
 * Componente React para renderizar un bloque isométrico en un elemento img con caché instantáneo.
 */
export const IsometricBlockThumbnail: React.FC<{
  src: string;
  size?: number;
  altText?: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}> = ({ src, size = 32, altText = 'block', className, style, onError }) => {
  const [renderedUrl, setRenderedUrl] = useState<string | null>(() => {
    const key = `${src}__sz${size}`;
    return dataUrlCache.get(key) || null;
  });
  const [loading, setLoading] = useState<boolean>(!renderedUrl);

  useEffect(() => {
    let isMounted = true;
    const key = `${src}__sz${size}`;
    const cached = dataUrlCache.get(key);
    if (cached) {
      setRenderedUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    getIsometricBlockDataUrl(src, size).then((dataUrl) => {
      if (!isMounted) return;
      if (dataUrl) {
        setRenderedUrl(dataUrl);
      } else {
        onError?.();
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [src, size, onError]);

  if (loading && !renderedUrl) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.03)',
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={renderedUrl || src}
      alt={altText}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      onError={onError}
    />
  );
};
