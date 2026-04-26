import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function dispatch(toast: Toast) {
  toasts = [...toasts, toast];
  listeners.forEach(l => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== toast.id);
    listeners.forEach(l => l(toasts));
  }, 4000);
}

export function useToast() {
  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    dispatch({ ...opts, id: Math.random().toString(36).slice(2) });
  }, []);
  return { toast };
}

export function useToastState() {
  const [state, setState] = useState<Toast[]>(toasts);
  useState(() => {
    listeners.push(setState);
    return () => { listeners = listeners.filter(l => l !== setState); };
  });
  return state;
}
