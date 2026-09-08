import React, { useState } from 'react';
import { Package } from 'lucide-react';

export function getItemTextureCandidateUrls(icon: any): string[] {
  if (!icon) return [];
  let iconStr = '';
  if (typeof icon === 'string') {
    iconStr = icon;
  } else if (icon && typeof icon === 'object' && icon.id) {
    iconStr = icon.id;
  }
  if (!iconStr) return [];

  let namespace = 'minecraft';
  let path = 'stone';
  const parts = iconStr.split(':');
  if (parts.length === 2) {
    namespace = parts[0];
    path = parts[1];
  } else if (parts.length === 1) {
    path = parts[0];
  }

  const pathClean = path.endsWith('.png') ? path.slice(0, -4) : path;
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const cleanBase = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;

  const urls: string[] = [];
  if (path.includes('textures/')) {
    const stripped = pathClean.replace(/^textures\//, '');
    urls.push(`${cleanBase}textures/${namespace}/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${path}`);
    urls.push(`${cleanBase}textures/${namespace}/${stripped}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${stripped}`);
  } else {
    urls.push(`${cleanBase}textures/${namespace}/textures/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/item/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/block/${pathClean}.png`);
    urls.push(`${cleanBase}textures/${namespace}/${pathClean}.png`);
  }
  return urls;
}

export const QuestItemThumbnail: React.FC<{
  icon: any;
  size?: number;
  altText?: string;
}> = ({ icon, size = 32, altText = 'item' }) => {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const urls = getItemTextureCandidateUrls(icon);

  if (urls.length === 0 || candidateIdx >= urls.length) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        title={typeof icon === 'string' ? icon : (icon?.id || 'Icono')}
      >
        <Package size={Math.round(size * 0.55)} style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <img
      src={urls[candidateIdx]}
      alt={altText}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
        objectFit: 'contain',
        flexShrink: 0,
        borderRadius: '3px',
      }}
      onError={() => setCandidateIdx((prev) => prev + 1)}
    />
  );
};
