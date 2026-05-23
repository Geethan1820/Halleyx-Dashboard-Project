import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, LayoutDashboard as LayoutIcon, CheckCircle, Calendar, Eye, Sparkles, FileJson } from 'lucide-react';
import ExportDropdown from '../components/ExportDropdown';
import { exportDashboardConfigJson } from '../lib/exportUtils';
import { useToast } from '../hooks/useToast';
import { nanoid } from 'nanoid';
import type { WidgetConfig, GridLayoutItem, WidgetType } from '../types/dashboard';
import { WIDGET_CATALOG } from '../types/dashboard';
import { normalizeWidgets } from '../lib/normalizeWidget';
import WidgetSidebar from '../components/WidgetSidebar';
import GridCanvas from '../components/GridCanvas';
import { ErrorBoundary } from '../components/ErrorBoundary';
import WidgetSettingsPanel from '../components/WidgetSettingsPanel';
import api, { socket, connectSocket } from '../lib/api';
import type { Order } from '../types/order';
import { useConfirm } from '../hooks/useConfirm';

const DashboardConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const toast = useToast();
  const [exportingJson, setExportingJson] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layout, setLayout] = useState<GridLayoutItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settingsWidget, setSettingsWidget] = useState<WidgetConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Load dashboard on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/orders')
        ]);
        setLayout(dashRes.data.layout || []);
        setWidgets(normalizeWidgets(dashRes.data.widgets || []));
        setOrders(ordersRes.data || []);
      } catch {
        /* no saved dashboard yet */
      } finally {
        setLoading(false);
      }
    };
    load();
    connectSocket();

    // Real-time updates
    socket.on('order_created', (newOrder: Order) => {
      setOrders(prev => [newOrder, ...prev]);
    });
    socket.on('order_updated', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });
    socket.on('order_deleted', ({ id }) => {
      setOrders(prev => prev.filter(o => o.id !== id));
    });

    return () => {
      socket.off('order_created');
      socket.off('order_updated');
      socket.off('order_deleted');
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (dateFilter === 'today') return orderDate >= startOfToday;
      if (dateFilter === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return orderDate >= d;
      }
      if (dateFilter === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return orderDate >= d;
      }
      return true;
    });
  }, [orders, dateFilter]);

  const handleAddWidget = useCallback((type: WidgetType) => {
    const catalog = WIDGET_CATALOG.find(c => c.type === type)!;
    const id = nanoid(8);
    const newWidget: WidgetConfig = {
      id,
      type,
      title: catalog.label,
      color: '#6366f1',
      ...catalog.defaultConfig,
    };
    const newLayoutItem: GridLayoutItem = {
      i: id,
      x: (layout.length * 3) % 12,
      y: Infinity,
      w: catalog.defaultW,
      h: catalog.defaultH,
      minW: 2,
      minH: 2,
    };
    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [...prev, newLayoutItem]);
  }, [layout]);

  const handleDeleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setLayout(prev => prev.filter(l => l.i !== id));
    if (settingsWidget?.id === id) setSettingsWidget(null);
  }, [settingsWidget]);

  const handleUpdateSettings = useCallback((updated: WidgetConfig) => {
    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
  }, []);

  const handleExportJSON = async () => {
    setExportingJson(true);
    try {
      exportDashboardConfigJson(layout, widgets);
      toast.success('Dashboard configuration exported as JSON.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'JSON export failed.';
      toast.error(msg);
      console.error('JSON export failed:', err);
    } finally {
      setExportingJson(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/dashboard', { layout, widgets });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleSmartLayout = async () => {
    const ok = await confirm({
      title: 'Apply smart layout',
      message: 'This will replace your current layout with a recommended data-driven view. Continue?',
      confirmText: 'Continue',
      variant: 'default',
    });
    if (!ok) return;

    const smartWidgets: WidgetConfig[] = [
      { id: 'smart-kpi-1', type: 'kpi', title: 'Total Revenue', metric: 'totalAmount', aggregation: 'sum', format: 'currency', precision: 0, color: '#6366f1' },
      { id: 'smart-kpi-2', type: 'kpi', title: 'Avg Order Value', metric: 'totalAmount', aggregation: 'avg', format: 'currency', precision: 2, color: '#8b5cf6' },
      { id: 'smart-kpi-3', type: 'kpi', title: 'Order Count', metric: 'totalAmount', aggregation: 'count', format: 'number', precision: 0, color: '#ec4899' },
      { id: 'smart-chart-1', type: 'bar-chart', title: 'Revenue by Product', xAxis: 'product', yAxis: 'totalAmount', aggregation: 'sum', color: '#6366f1', showLabels: true },
      { id: 'smart-chart-2', type: 'pie-chart', title: 'Order Status Dist.', xAxis: 'status', yAxis: 'totalAmount', aggregation: 'count', showLegend: true },
      { id: 'smart-table-1', type: 'table', title: 'Recent high-value orders', columns: ['id', 'firstName', 'product', 'totalAmount', 'status'], pageSize: 5, sortField: 'totalAmount', sortOrder: 'desc' }
    ];

    const smartLayout: GridLayoutItem[] = [
      { i: 'smart-kpi-1', x: 0, y: 0, w: 4, h: 2 },
      { i: 'smart-kpi-2', x: 4, y: 0, w: 4, h: 2 },
      { i: 'smart-kpi-3', x: 8, y: 0, w: 4, h: 2 },
      { i: 'smart-chart-1', x: 0, y: 2, w: 8, h: 4 },
      { i: 'smart-chart-2', x: 8, y: 2, w: 4, h: 4 },
      { i: 'smart-table-1', x: 0, y: 6, w: 12, h: 4 },
    ];

    setWidgets(smartWidgets);
    setLayout(smartLayout);
  };

  const handleLayoutChange = useCallback((next: GridLayoutItem[]) => {
    setLayout(next);
  }, []);

  const handleDrop = useCallback((_layout: GridLayoutItem[], item: GridLayoutItem, e: Event) => {
    const type = (e as any).dataTransfer?.getData('widgetType') as WidgetType || 'kpi';
    const catalog = WIDGET_CATALOG.find(c => c.type === type)!;

    const id = nanoid(8);
    const newWidget: WidgetConfig = {
      id,
      type,
      title: catalog.label,
      color: '#6366f1',
      ...catalog.defaultConfig,
    };

    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => {
      const filtered = prev.filter(l => l.i !== 'dropping');
      return [...filtered, {
        ...item,
        i: id,
        w: catalog.defaultW,
        h: catalog.defaultH,
        minW: 2,
        minH: 2,
      }];
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
      {/* Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <LayoutIcon size={18} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Configure Dashboard</h1>
          </div>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Calendar size={14} className="text-gray-400" />
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="text-xs font-semibold text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer outline-none uppercase tracking-wider"
              >
                <option value="all">All Time Data</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">
              {widgets.length} Widget{widgets.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleSmartLayout()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all active:scale-95"
          >
            <Sparkles size={14} />
            Smart Layout
          </button>
          <ExportDropdown
            loading={exportingJson}
            disabled={widgets.length === 0}
            label="Export"
            items={[
              {
                id: 'json',
                label: 'Export JSON',
                description: 'Layout, widgets & chart settings',
                icon: <FileJson size={16} />,
                onClick: handleExportJSON,
              },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-all border border-gray-200"
          >
            <Eye size={16} />
            View Mode
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all shadow-md active:scale-95 ${
              saved 
                ? 'bg-green-500 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            } disabled:opacity-50`}
          >
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Layout Saved!' : 'Save Layout'}
          </button>
        </div>
      </header>

      {/* Main Builder Area */}
      <div className="flex flex-1 min-h-0 w-full">
        <WidgetSidebar onAddWidget={handleAddWidget} />
        <div className="flex-1 min-w-0 w-full bg-gray-50 overflow-hidden">
          <ErrorBoundary title="Dashboard builder error">
            <GridCanvas
              layout={layout}
              widgets={widgets}
              orders={filteredOrders}
              onLayoutChange={handleLayoutChange}
              onDeleteWidget={handleDeleteWidget}
              onSettingsWidget={setSettingsWidget}
              onDrop={handleDrop}
              isEditable={true}
            />
          </ErrorBoundary>
        </div>
      </div>

      {settingsWidget && (
        <WidgetSettingsPanel
          widget={settingsWidget}
          onClose={() => setSettingsWidget(null)}
          onSave={handleUpdateSettings}
        />
      )}
      {confirmDialog}
    </div>
  );
};

export default DashboardConfigPage;
