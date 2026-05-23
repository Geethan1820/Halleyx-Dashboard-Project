import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download, Loader2 } from 'lucide-react';

export interface ExportMenuItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

interface ExportDropdownProps {
  items: ExportMenuItem[];
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary';
}

/**
 * Reusable export menu (PDF / PNG / CSV / JSON) with loading and disabled states.
 */
const ExportDropdown: React.FC<ExportDropdownProps> = ({
  items,
  loading = false,
  disabled = false,
  label = 'Export',
  variant = 'secondary',
}) => {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleItem = async (item: ExportMenuItem) => {
    if (item.disabled || loading || busyId) return;
    setBusyId(item.id);
    try {
      await item.onClick();
      setOpen(false);
    } finally {
      setBusyId(null);
    }
  };

  const btnClass =
    variant === 'primary'
      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 border-transparent'
      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {loading ? 'Exporting...' : label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !loading && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Download</p>
          </div>
          {items.map((item) => {
            const isBusy = busyId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled || !!busyId}
                onClick={() => void handleItem(item)}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="mt-0.5 text-indigo-500 shrink-0">
                  {isBusy ? <Loader2 size={16} className="animate-spin" /> : item.icon ?? <Download size={16} />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-800">{item.label}</span>
                  {item.description && (
                    <span className="block text-[10px] text-gray-500 mt-0.5">{item.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;
