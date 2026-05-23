import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  };
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-md animate-in slide-in-from-top-2 duration-200 ${styles[toast.type]}`}
      role="alert"
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-0.5 rounded hover:bg-black/5 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const value: ToastContextValue = {
    showToast,
    success: (m) => showToast(m, 'success'),
    error: (m) => showToast(m, 'error'),
    info: (m) => showToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
