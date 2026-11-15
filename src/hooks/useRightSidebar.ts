import type React from 'react';
import { useEffect, useState } from 'react';

/** Ancho, plegado y redimensionado con el ratón de la barra lateral derecha (el ancho se recuerda). */
export function useRightSidebar() {
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('ftb_right_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 320;
    return isNaN(parsed) || parsed < 260 ? 320 : parsed;
  });
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(false);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState<boolean>(false);

  const startResizingRightSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRightSidebar(true);
  };

  useEffect(() => {
    if (!isResizingRightSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const calculatedWidth = window.innerWidth - e.clientX;
      const minW = 280;
      const maxW = Math.min(850, Math.floor(window.innerWidth * 0.65));
      const clampedWidth = Math.max(minW, Math.min(maxW, calculatedWidth));
      setRightSidebarWidth(clampedWidth);
      localStorage.setItem('ftb_right_sidebar_width', String(Math.round(clampedWidth)));
    };

    const handleMouseUp = () => {
      setIsResizingRightSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingRightSidebar]);

  return {
    rightSidebarWidth, setRightSidebarWidth,
    isRightSidebarCollapsed, setIsRightSidebarCollapsed,
    isResizingRightSidebar, startResizingRightSidebar,
  };
}
