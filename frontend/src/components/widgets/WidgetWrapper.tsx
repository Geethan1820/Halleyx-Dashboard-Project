import React, { memo, useState } from 'react';
import { Settings, Trash2, Download, Loader2 } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { exportWidgetPng } from '../../lib/exportUtils';
import type { WidgetConfig } from '../../types/dashboard';
import type { Order } from '../../lib/dataEngine';
import {
  KpiWidget, BarChartWidget, LineChartWidget, AreaChartWidget,
  ScatterChartWidget, PieChartWidget, TableWidget,
} from './WidgetContent';

interface WidgetWrapperProps {
  widget: WidgetConfig;
  orders: Order[];
  /** Show settings/export/delete toolbar (configure page only) */
  editable?: boolean;
  onDelete: (id: string) => void;
  onSettings: (widget: WidgetConfig) => void;
  onDrillDown?: (filter: any) => void;
}

const WidgetWrapperInner: React.FC<WidgetWrapperProps> = ({
  widget,
  orders,
  editable = false,
  onDelete,
  onSettings,
  onDrillDown,
}) => {
  const [hovered, setHovered] = useState(false);
  const [exporting, setExporting] = useState(false);
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();
  const toast = useToast();

  const handleDelete = async () => {
    const ok = await confirm({
      message: 'Are you sure you want to delete this item?',
    });
    if (ok) onDelete(widget.id);
  };

  /** Widget DOM → html2canvas → PNG download */
  const handleExportWidget = async () => {
    if (!widgetRef.current || exporting) return;
    setExporting(true);
    try {
      await exportWidgetPng(widgetRef.current, widget.type);
      toast.success(`${widget.title} exported as PNG.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Widget export failed.';
      toast.error(msg);
      console.error('Widget export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'kpi':           return <KpiWidget config={widget} data={orders} />;
      case 'bar-chart':     return <BarChartWidget config={widget} data={orders} onDrillDown={onDrillDown} />;
      case 'line-chart':    return <LineChartWidget config={widget} data={orders} onDrillDown={onDrillDown} />;
      case 'area-chart':    return <AreaChartWidget config={widget} data={orders} onDrillDown={onDrillDown} />;
      case 'scatter-chart': return <ScatterChartWidget config={widget} data={orders} />;
      case 'pie-chart':     return <PieChartWidget config={widget} data={orders} onDrillDown={onDrillDown} />;
      case 'table':         return <TableWidget config={widget} data={orders} onDrillDown={onDrillDown} />;
      default:              return null;
    }
  };

  return (
    <div
      ref={widgetRef}
      data-widget-type={widget.type}
      className="h-full w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editable && (hovered || exporting) && (
        <div data-html2canvas-ignore="true" className="absolute top-2 right-2 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-1 border border-gray-100">
          <button
            type="button"
            className="widget-action-btn p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            title="Settings"
            disabled={exporting}
            onClick={(e) => { e.stopPropagation(); onSettings(widget); }}
          >
            <Settings size={14} />
          </button>
          <button
            type="button"
            className="widget-action-btn p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            title="Export as PNG"
            disabled={exporting}
            onClick={(e) => { e.stopPropagation(); void handleExportWidget(); }}
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          </button>
          <button
            type="button"
            className="widget-action-btn p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete"
            disabled={exporting}
            onClick={(e) => {
              e.stopPropagation();
              void handleDelete();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {renderContent()}
      {confirmDialog}
    </div>
  );
};

const WidgetWrapper = memo(
  WidgetWrapperInner,
  (prev, next) =>
    prev.widget.id === next.widget.id &&
    prev.widget === next.widget &&
    prev.orders === next.orders &&
    prev.editable === next.editable
);

export default WidgetWrapper;
