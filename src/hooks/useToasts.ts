import { useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: string;
}

/** Notificaciones temporales (3 s) de la esquina de la pantalla. */
export function useToasts() {
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  
  const showToast = (message: string, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return { toasts, showToast };
}
