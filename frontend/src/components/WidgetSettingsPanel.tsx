import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Hash, Info, Type, Palette, BarChart2 } from 'lucide-react';
import type { WidgetConfig, AggregationType, FormatType } from '../types/dashboard';

interface WidgetSettingsPanelProps {
  widget: WidgetConfig | null;
  onClose: () => void;
  onSave: (updated: WidgetConfig) => void;
}

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const METRIC_OPTIONS = [
  { value: 'totalAmount', label: 'Total Amount' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'unitPrice', label: 'Unit Price' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum',   label: 'Sum' },
  { value: 'avg',   label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min',   label: 'Minimum' },
  { value: 'max',   label: 'Maximum' },
];

const X_AXIS_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Date' },
  { value: 'country', label: 'Country' },
  { value: 'state', label: 'State' },
];

const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({ widget, onClose, onSave }) => {
  const [localWidget, setLocalWidget] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    if (widget) {
      setLocalWidget({ ...widget });
    }
  }, [widget]);

  if (!widget || !localWidget) return null;

  const updateField = (field: keyof WidgetConfig, value: any) => {
    setLocalWidget(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (localWidget) {
      onSave(localWidget);
      onClose();
    }
  };

  /* Overlay drawer — does not shrink the grid canvas (prevents layout reflow) */
  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-gray-900/30 backdrop-blur-[2px] cursor-default"
        aria-label="Close widget settings"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white border-l border-gray-200 flex flex-col shadow-2xl z-[70] overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BarChart2 size={16} />
          </div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Widget Designer</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Style Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={14} className="text-indigo-500" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Appearance & Style</h3>
          </div>
          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={localWidget.title}
                  onChange={e => updateField('title', e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all pl-9"
                />
                <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Color Theme</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateField('color', c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all shadow-sm ${localWidget.color === c ? 'border-gray-900 scale-125 ring-4 ring-indigo-50' : 'border-white hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={localWidget.color}
                  placeholder="#HEX CODE"
                  onChange={e => updateField('color', e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-900 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all pl-9 uppercase tracking-widest"
                />
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} className="text-indigo-500" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data Configuration</h3>
          </div>
          
          <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            {(localWidget.type === 'kpi' || localWidget.type.includes('chart')) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">
                    {localWidget.type === 'kpi' ? 'Metric' : 'Value (Y-Axis)'}
                  </label>
                  <select 
                    value={localWidget.type === 'kpi' ? localWidget.metric : localWidget.yAxis}
                    onChange={e => updateField(localWidget.type === 'kpi' ? 'metric' : 'yAxis', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none cursor-pointer appearance-none shadow-sm"
                  >
                    {METRIC_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Aggregation</label>
                  <select 
                    value={localWidget.aggregation}
                    onChange={e => updateField('aggregation', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none appearance-none shadow-sm"
                  >
                    {AGGREGATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                {localWidget.type.includes('chart') && localWidget.type !== 'scatter-chart' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Dimensions (X-Axis)</label>
                    <select 
                      value={localWidget.xAxis}
                      onChange={e => updateField('xAxis', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none appearance-none shadow-sm"
                    >
                      {X_AXIS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {localWidget.type === 'kpi' && (
              <div className="space-y-4 border-t border-gray-200/50 pt-4 mt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Format Type</label>
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                    {(['number', 'currency'] as FormatType[]).map(f => (
                      <button
                        key={f}
                        onClick={() => updateField('format', f)}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${localWidget.format === f ? 'bg-indigo-600 shadow-md text-white' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Decimal Precision</label>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{localWidget.precision || 0}</span>
                  </div>
                  <input 
                    type="range" min="0" max="4" step="1"
                    value={localWidget.precision || 0}
                    onChange={e => updateField('precision', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            )}

            {(localWidget.type === 'pie-chart' || localWidget.type === 'bar-chart' || localWidget.type === 'line-chart') && (
              <div className="space-y-3 border-t border-gray-200/50 pt-4 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-8 h-4 rounded-full transition-all relative ${localWidget.showLabels ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                    <input 
                      type="checkbox"
                      checked={localWidget.showLabels}
                      onChange={e => updateField('showLabels', e.target.checked)}
                      className="hidden"
                    />
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${localWidget.showLabels ? 'left-5' : 'left-1'}`} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-900 uppercase tracking-wider">Show Data Labels</span>
                </label>
                {(localWidget.type === 'pie-chart' || localWidget.type === 'bar-chart') && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-8 h-4 rounded-full transition-all relative ${localWidget.showLegend ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox"
                        checked={localWidget.showLegend}
                        onChange={e => updateField('showLegend', e.target.checked)}
                        className="hidden"
                      />
                      <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${localWidget.showLegend ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-900 uppercase tracking-wider">Show Legend</span>
                  </label>
                )}
              </div>
            )}

            {localWidget.type === 'table' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3 ml-1">Active Columns</label>
                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto p-3 bg-white rounded-2xl border border-gray-200 custom-scrollbar">
                    {['id', 'firstName', 'lastName', 'email', 'product', 'quantity', 'unitPrice', 'totalAmount', 'status', 'createdAt'].map(col => (
                      <label key={col} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-gray-100 group">
                        <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-900 uppercase tracking-tight">{col.replace(/([A-Z])/g, ' $1')}</span>
                        <input 
                          type="checkbox"
                          checked={(localWidget.columns || []).includes(col)}
                          onChange={e => {
                            const current = localWidget.columns || [];
                            const updated = e.target.checked 
                              ? [...current, col]
                              : current.filter(c => c !== col);
                            updateField('columns', updated);
                          }}
                          className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-gray-300 transition-all"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Row Limit</label>
                    <input 
                      type="number" min="1" max="100"
                      value={localWidget.pageSize || 10}
                      onChange={e => updateField('pageSize', parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Sort Direction</label>
                    <select 
                      value={localWidget.sortOrder || 'desc'}
                      onChange={e => updateField('sortOrder', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none"
                    >
                      <option value="asc">ASC</option>
                      <option value="desc">DESC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Sort Key</label>
                  <select 
                    value={localWidget.sortField || 'createdAt'}
                    onChange={e => updateField('sortField', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none appearance-none"
                  >
                    {['id', 'firstName', 'lastName', 'email', 'product', 'quantity', 'unitPrice', 'totalAmount', 'status', 'createdAt'].map(col => (
                      <option key={col} value={col}>{col.replace(/([A-Z])/g, ' $1')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-gray-100 bg-white">
        <button
          onClick={handleSave}
          className="w-full py-3 px-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Push Configuration
        </button>
      </div>
    </aside>
    </>,
    document.body
  );
};

export default WidgetSettingsPanel;
