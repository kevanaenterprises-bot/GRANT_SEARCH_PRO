import { useToastState } from '@/hooks/useToast';
import { X } from 'lucide-react';

export function Toaster() {
  const toasts = useToastState();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg bg-white max-w-sm ${t.variant === 'destructive' ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
