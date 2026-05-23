import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Settings, BarChart3, BrainCircuit, Share2, ArrowLeft, Check, FileText, Image,
  Sparkles, MessageSquare, RefreshCw, Filter, TrendingUp, Activity, X
} from 'lucide-react';
import GridCanvas from '../components/GridCanvas';
import ExportDropdown from '../components/ExportDropdown';
import { exportDashboardPdf, exportElementPng } from '../lib/exportUtils';
import { useToast } from '../hooks/useToast';
import GlobalFilters from '../components/GlobalFilters';
import api, { socket, connectSocket } from '../lib/api';
import type { Order } from '../lib/dataEngine';
import type { WidgetConfig, GridLayoutItem } from '../types/dashboard';
import { normalizeWidgets } from '../lib/normalizeWidget';

const DashboardViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: sharedId } = useParams();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layout, setLayout] = useState<GridLayoutItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [isAiFiltered, setIsAiFiltered] = useState(false);
  const [aiTab, setAiTab] = useState<'insights' | 'chat' | 'metrics'>('insights');
  const [chatMessages, setChatMessages] = useState<{
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
    isTyping?: boolean;
    stats?: {
      count: number;
      revenue: number;
      avgValue: number;
    };
  }[]>([
    {
      sender: 'ai',
      text: 'Hi there! I am your Halleyx AI Assistant. Ask me to find specific orders, filter by status, price, country, or show top analytics!',
      timestamp: new Date()
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [drillDown, setDrillDown] = useState<{ filter: any, title: string } | null>(null);
  
  const [filters, setFilters] = useState({
    dateRange: 'all',
    country: '',
    minPrice: 0,
    maxPrice: 0,
  });

  const loadData = async () => {
    try {
      const endpoint = sharedId ? `/shared-dashboard/${sharedId}` : '/dashboard';
      const [dashRes, ordersRes, insightsRes] = await Promise.all([
        api.get(endpoint),
        api.get('/orders'),
        api.get('/ai-insights')
      ]);
      setLayout(dashRes.data.layout || []);
      setWidgets(normalizeWidgets(dashRes.data.widgets || []));
      setOrders(ordersRes.data || []);
      setRawOrders(ordersRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    connectSocket();

    socket.on('order_created', (newOrder: Order) => {
      setOrders(prev => [newOrder, ...prev]);
      setRawOrders(prev => [newOrder, ...prev]);
    });

    socket.on('order_updated', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setRawOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    socket.on('order_deleted', ({ id }) => {
      setOrders(prev => prev.filter(o => o.id !== id));
      setRawOrders(prev => prev.filter(o => o.id !== id));
    });

    socket.on('dashboard_updated', (data) => {
      if (!sharedId) {
        setLayout(data.layout);
        setWidgets(normalizeWidgets(data.widgets || []));
      }
    });

    return () => {
      socket.off('order_created');
      socket.off('order_updated');
      socket.off('order_deleted');
      socket.off('dashboard_updated');
    };
  }, [sharedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    // Date Filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (filters.dateRange === 'today') return orderDate >= startOfToday;
        if (filters.dateRange === '7d') {
          const d = new Date(now); d.setDate(d.getDate() - 7);
          return orderDate >= d;
        }
        if (filters.dateRange === '30d') {
          const d = new Date(now); d.setDate(d.getDate() - 30);
          return orderDate >= d;
        }
        return true;
      });
    }

    // Country Filter
    if (filters.country) {
      result = result.filter(o => o.country === filters.country);
    }

    // Price Filter
    if (filters.minPrice > 0) result = result.filter(o => o.totalAmount >= filters.minPrice);
    if (filters.maxPrice > 0) result = result.filter(o => o.totalAmount <= filters.maxPrice);

    return result;
  }, [orders, filters]);

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    // Add user message
    const userMsg = {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Add virtual typing placeholder
    setChatMessages(prev => [...prev, {
      sender: 'ai' as const,
      text: 'Analyzing recent order activity and trends...',
      timestamp: new Date(),
      isTyping: true
    }]);

    try {
      const res = await api.post('/orders/query', { query: queryText });
      const filteredResult: Order[] = res.data || [];
      
      setOrders(filteredResult);
      setIsAiFiltered(true);

      // Compute stats of filtered orders
      const count = filteredResult.length;
      const revenue = filteredResult.reduce((sum, o) => sum + o.totalAmount, 0);
      const avgValue = count > 0 ? revenue / count : 0;

      // Generate a rich textual response
      let responseText = `I have filtered the dashboard. Found ${count} order${count === 1 ? '' : 's'} matching your request.`;
      const lowerQ = queryText.toLowerCase();

      if (lowerQ.includes('top countries') || lowerQ.includes('top 5 countries')) {
        responseText = `I analyzed the sales distribution and isolated the top performing countries. Showing ${count} orders across these key markets.`;
      } else if (lowerQ.includes('usa') || lowerQ.includes('america')) {
        responseText = `Isolated USA order activities. Showing ${count} orders totaling $${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.`;
      } else if (lowerQ.includes('last 7 days')) {
        responseText = `Filtered to show all orders from the past week. A total of ${count} orders were placed during this period.`;
      } else if (lowerQ.includes('pending')) {
        responseText = `Identified all orders currently in 'Pending' status. There are ${count} orders that require attention and fulfillment.`;
      } else if (lowerQ.includes('processing')) {
        responseText = `Showing ${count} orders that are currently being processed.`;
      } else if (lowerQ.includes('delivered')) {
        responseText = `Retrieved all ${count} completed/delivered orders.`;
      } else if (lowerQ.includes('high value') || lowerQ.includes('above 500') || lowerQ.includes('expensive')) {
        responseText = `Filtered the view to display high-value transactions above $500. Found ${count} premium orders.`;
      } else if (lowerQ.includes('low value') || lowerQ.includes('below 100') || lowerQ.includes('cheap')) {
        responseText = `Filtered to show micro-transactions below $100. There are ${count} such orders.`;
      } else if (lowerQ.includes('bulk') || lowerQ.includes('quantity')) {
        responseText = `Filtered to display bulk orders (quantity of 5 or more). Found ${count} wholesale-level orders.`;
      } else if (lowerQ.includes('clear') || lowerQ.includes('reset') || lowerQ.includes('all')) {
        responseText = `Reset dashboard to display the complete set of ${count} orders.`;
        setIsAiFiltered(false);
      }

      // Add delay for premium micro-experience feel
      setTimeout(() => {
        setChatMessages(prev => {
          // Remove typing message and add AI response
          const filtered = prev.filter(m => !m.isTyping);
          return [...filtered, {
            sender: 'ai' as const,
            text: responseText,
            timestamp: new Date(),
            stats: {
              count,
              revenue,
              avgValue
            }
          }];
        });
        setChatLoading(false);
      }, 750);

    } catch (err) {
      console.error('AI Query failed:', err);
      setTimeout(() => {
        setChatMessages(prev => {
          const filtered = prev.filter(m => !m.isTyping);
          return [...filtered, {
            sender: 'ai' as const,
            text: 'I encountered an error trying to search your orders. Please verify the query and try again.',
            timestamp: new Date()
          }];
        });
        setChatLoading(false);
      }, 750);
    }
  };

  const handleAIQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    handleExecuteQuery(aiQuery);
    setAiQuery('');
  };

  const handleResetAiFilter = () => {
    setOrders(rawOrders);
    setIsAiFiltered(false);
    setChatMessages(prev => [...prev, {
      sender: 'ai' as const,
      text: `Cleared active search filters. Restored dashboard to display the full dataset of ${rawOrders.length} orders.`,
      timestamp: new Date()
    }]);
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    if (widgets.length === 0) {
      toast.error('Add widgets to the dashboard before exporting.');
      return;
    }
    setExporting(true);
    try {
      await exportDashboardPdf(dashboardRef.current);
      toast.success('Dashboard PDF downloaded successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF export failed.';
      toast.error(msg);
      console.error('PDF Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportDashboardPng = async () => {
    if (!dashboardRef.current) return;
    if (widgets.length === 0) {
      toast.error('Add widgets to the dashboard before exporting.');
      return;
    }
    setExporting(true);
    try {
      const ts = Date.now();
      await exportElementPng(
        dashboardRef.current,
        `dashboard-screenshot-${ts}.png`,
        '#f9fafb'
      );
      toast.success('Dashboard PNG downloaded successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PNG export failed.';
      toast.error(msg);
      console.error('PNG Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/shared/demo-uuid-123`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDrillDown = (filter: any) => {
    const key = Object.keys(filter)[0];
    const value = filter[key];
    setDrillDown({ filter, title: `Details for ${key}: ${value}` });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Live Dashboard {sharedId && '(Shared)'}</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Real-time Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown
            loading={exporting}
            disabled={widgets.length === 0}
            label="Export"
            items={[
              {
                id: 'pdf',
                label: 'Export PDF',
                description: 'Landscape A4 report with all widgets',
                icon: <FileText size={16} />,
                onClick: handleExportPDF,
              },
              {
                id: 'png',
                label: 'Export PNG',
                description: 'High-resolution dashboard image',
                icon: <Image size={16} />,
                onClick: handleExportDashboardPng,
              },
            ]}
          />
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${
              showAI ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BrainCircuit size={16} />
            AI Insights
          </button>
          {!sharedId && (
            <>
              <div className="h-6 w-px bg-gray-200 mx-1" />
              <button 
                onClick={() => navigate('/configure')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
              >
                <Settings size={16} />
                Configure Dashboard
              </button>
            </>
          )}
        </div>
      </header>

      {/* Filters Bar */}
      <GlobalFilters filters={filters} onFilterChange={setFilters} />

      <main className="flex-1 flex overflow-hidden">
        {/* Grid Area */}
        <div className="flex-1 min-w-0 w-full overflow-auto p-4 flex flex-col gap-3 bg-gray-50" ref={dashboardRef}>
          {isAiFiltered && (
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100/30 border border-indigo-150 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-800">AI search filter active</h4>
                  <p className="text-[10px] text-indigo-600 font-medium">Dashboard widgets are filtered by natural language query.</p>
                </div>
              </div>
              <button
                onClick={handleResetAiFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 active:scale-95 text-[10px] font-bold rounded-xl shadow-sm transition-all"
              >
                <X size={12} />
                Clear AI Filter
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <GridCanvas
              layout={layout}
              widgets={widgets}
              orders={filteredOrders}
              isEditable={false}
              onLayoutChange={() => {}}
              onDeleteWidget={() => {}}
              onSettingsWidget={() => {}}
              onDrop={() => {}}
              onDrillDown={handleDrillDown}
            />
          </div>
        </div>

        {/* AI Insights Sidebar */}
        {showAI && (
          <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20 animate-in slide-in-from-right duration-300">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <BrainCircuit size={18} className="text-indigo-600" />
                  Halleyx Intelligence
                </h3>
                <button onClick={() => setShowAI(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50">
                  <X size={16} />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed font-medium">AI analysis and interactive conversational control of dashboard data.</p>
            </div>

            {/* Premium Tab Selector */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex gap-1.5">
              <button
                onClick={() => setAiTab('insights')}
                className={`flex-1 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                  aiTab === 'insights' 
                    ? 'bg-white text-indigo-600 shadow-sm border-indigo-100' 
                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50'
                }`}
              >
                <Sparkles size={11} />
                Insights
              </button>
              <button
                onClick={() => setAiTab('chat')}
                className={`flex-1 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                  aiTab === 'chat' 
                    ? 'bg-white text-indigo-600 shadow-sm border-indigo-100' 
                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50'
                }`}
              >
                <MessageSquare size={11} />
                Assistant
              </button>
              <button
                onClick={() => setAiTab('metrics')}
                className={`flex-1 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                  aiTab === 'metrics' 
                    ? 'bg-white text-indigo-600 shadow-sm border-indigo-100' 
                    : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50'
                }`}
              >
                <Activity size={11} />
                Metrics
              </button>
            </div>

            {/* Scrollable Container based on Tab */}
            <div className="flex-1 overflow-auto p-5 space-y-4">
              
              {/* Tab 1: Active Insights */}
              {aiTab === 'insights' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Findings</span>
                    <span className="text-[9px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Realtime
                    </span>
                  </div>

                  {insights.map((insight, idx) => {
                    // Extract custom interactive action details
                    let actionText = '';
                    let actionIcon = null;
                    let onAction = null;

                    if (insight.title === 'Sales Performance') {
                      actionText = 'Show All Sales';
                      actionIcon = <RefreshCw size={11} />;
                      onAction = () => {
                        handleResetAiFilter();
                        toast.success('Restored all orders to dashboard');
                      };
                    } else if (insight.title === 'Top Market') {
                      const countryMatch = insight.description.split(' ')[0];
                      if (countryMatch && countryMatch !== 'N/A') {
                        actionText = `Filter to ${countryMatch}`;
                        actionIcon = <Filter size={11} />;
                        onAction = () => {
                          setFilters(prev => ({ ...prev, country: countryMatch }));
                          toast.success(`Dashboard filtered to ${countryMatch}`);
                        };
                      }
                    } else if (insight.title === 'Efficiency') {
                      const match = insight.description.match(/\$(\d+\.?\d*)/);
                      const avgVal = match ? parseFloat(match[1]) : 0;
                      if (avgVal > 0) {
                        actionText = `Filter Price > $${Math.floor(avgVal)}`;
                        actionIcon = <TrendingUp size={11} />;
                        onAction = () => {
                          setFilters(prev => ({ ...prev, minPrice: Math.floor(avgVal) }));
                          toast.success(`Showing orders above average ($${Math.floor(avgVal)})`);
                        };
                      }
                    }

                    return (
                      <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/30 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              insight.type === 'trend' ? 'bg-emerald-500' :
                              insight.type === 'anomaly' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} />
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">{insight.title}</h4>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 capitalize font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            {insight.type}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 leading-relaxed mb-3 group-hover:text-gray-600">{insight.description}</p>
                        
                        {onAction && (
                          <button 
                            onClick={onAction}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 active:scale-95 rounded-lg shadow-sm transition-all"
                          >
                            {actionIcon}
                            {actionText}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Conversational Chat Assistant */}
              {aiTab === 'chat' && (
                <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chat History</span>
                    {isAiFiltered && (
                      <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full animate-pulse">
                        Filter Active
                      </span>
                    )}
                  </div>
                  
                  {/* Messages Bubble List */}
                  <div className="flex-1 space-y-3 min-h-[220px]">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed transition-all shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-indigo-600 text-white self-end rounded-tr-sm ml-auto shadow-md' 
                            : msg.isTyping 
                              ? 'bg-gray-50 border border-gray-100 text-gray-400 italic self-start rounded-tl-sm mr-auto animate-pulse'
                              : 'bg-gray-50 border border-gray-100 text-gray-700 self-start rounded-tl-sm mr-auto hover:border-indigo-100 transition-colors'
                        }`}
                      >
                        <div className="font-bold text-[8px] uppercase tracking-widest opacity-60 mb-1">
                          {msg.sender === 'user' ? 'You' : 'Halleyx AI'}
                        </div>
                        <div>{msg.text}</div>
                        
                        {/* Display real-time KPI table inside AI chat replies */}
                        {msg.stats && msg.stats.count > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-gray-100 pt-2 text-[9px] font-medium text-gray-500">
                            <div className="bg-white p-1 rounded border border-gray-100/50 text-center shadow-xs">
                              <span className="block text-[7px] text-gray-400 font-bold uppercase">Volume</span>
                              <span className="font-black text-gray-800">{msg.stats.count}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-gray-100/50 text-center shadow-xs">
                              <span className="block text-[7px] text-gray-400 font-bold uppercase">Revenue</span>
                              <span className="font-black text-gray-800">${msg.stats.revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-gray-100/50 text-center shadow-xs">
                              <span className="block text-[7px] text-gray-400 font-bold uppercase">Avg Val</span>
                              <span className="font-black text-gray-800">${msg.stats.avgValue.toFixed(0)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}

              {/* Tab 3: Executive Metrics Dashboard */}
              {aiTab === 'metrics' && (
                <MetricsTabContent data={filteredOrders} />
              )}

            </div>

            {/* Bottom Actions Area */}
            {aiTab === 'chat' ? (
              <div className="p-4 border-t border-gray-100 bg-white">
                {/* Custom quick prompt suggestion chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    'Show pending orders',
                    'High value orders',
                    'Bulk orders',
                    'Last 7 days'
                  ].map((chipText, i) => (
                    <button
                      key={i}
                      onClick={() => handleExecuteQuery(chipText)}
                      disabled={chatLoading}
                      className="px-2.5 py-1 text-[9px] font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/80 active:scale-95 disabled:pointer-events-none rounded-lg border border-indigo-100/30 transition-all uppercase tracking-wider"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>

                {/* Input Text Form */}
                <form onSubmit={handleAIQuerySubmit} className="relative flex items-center">
                  <input 
                    type="text" 
                    placeholder={chatLoading ? "AI is typing..." : "Ask AI to filter or search..."}
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    disabled={chatLoading}
                    className="w-full pl-3 pr-10 py-2.5 text-xs text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-150 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <button 
                    type="submit" 
                    disabled={chatLoading || !aiQuery.trim()}
                    className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100"
                  >
                    <ArrowLeft size={12} className="rotate-180" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                  >
                    {copied ? <Check size={14} /> : <Share2 size={14} />} 
                    {copied ? 'Link Copied!' : 'Share Analytics'}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      {/* Drill-Down Modal */}
      {drillDown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{drillDown.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-widest">Drill-Down View</span>
                  <span className="text-[10px] text-gray-400 font-medium italic">Respecting all active global filters</span>
                </div>
              </div>
              <button 
                onClick={() => setDrillDown(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                <ArrowLeft size={14} />
                Back to Dashboard
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TableWidget 
                config={{
                  id: 'drill-down-table',
                  type: 'table',
                  title: drillDown.title,
                  columns: ['id', 'firstName', 'lastName', 'product', 'quantity', 'unitPrice', 'totalAmount', 'status', 'city', 'country'],
                  pageSize: 10
                }}
                data={filteredOrders.filter(o => {
                  const key = Object.keys(drillDown.filter)[0];
                  return String(o[key as keyof Order]) === String(drillDown.filter[key]);
                })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Import for Drill-Down Modal
import { TableWidget } from '../components/widgets/WidgetContent';

// Helper Component for AI Metrics Panel
const MetricsTabContent: React.FC<{ data: Order[] }> = ({ data }) => {
  const totalRevenue = useMemo(() => data.reduce((sum, o) => sum + o.totalAmount, 0), [data]);
  const avgOrderValue = useMemo(() => data.length > 0 ? totalRevenue / data.length : 0, [data, totalRevenue]);
  const totalVolume = data.length;
  
  // Status breakdown
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, processing: 0, delivered: 0 };
    data.forEach(o => {
      const s = o.status.toLowerCase();
      if (s === 'pending') counts.pending++;
      else if (s === 'processing') counts.processing++;
      else if (s === 'delivered') counts.delivered++;
    });
    return counts;
  }, [data]);

  const statusPercentages = useMemo(() => {
    if (totalVolume === 0) return { pending: 0, processing: 0, delivered: 0 };
    return {
      pending: (statusCounts.pending / totalVolume) * 100,
      processing: (statusCounts.processing / totalVolume) * 100,
      delivered: (statusCounts.delivered / totalVolume) * 100,
    };
  }, [statusCounts, totalVolume]);

  const revenueTarget = 15000;
  const targetPercent = Math.min((totalRevenue / revenueTarget) * 100, 100);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Revenue Card with target progress */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-750 text-white shadow-lg shadow-indigo-100">
        <span className="text-[10px] font-bold text-indigo-150 uppercase tracking-widest opacity-80">Total Revenue</span>
        <h4 className="text-2xl font-black tracking-tight mt-1">
          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h4>
        
        {/* Progress toward target */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold mb-1 opacity-90">
            <span>TARGET PROGRESS</span>
            <span>{targetPercent.toFixed(0)}% of $15k</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-500 ease-out" style={{ width: `${targetPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">AVG ORDER VALUE</span>
          <span className="text-sm font-black text-gray-805 text-gray-800">${avgOrderValue.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded block w-max mt-2">
            {avgOrderValue > 150 ? 'Premium Tier' : 'Standard Tier'}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">TOTAL ORDERS</span>
          <span className="text-sm font-black text-gray-805 text-gray-800">{totalVolume}</span>
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded block w-max mt-2">
            Live Stream
          </span>
        </div>
      </div>

      {/* Status Breakdown Slider */}
      <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Order Status Distribution</span>
        
        {/* Segmented Bar */}
        {totalVolume > 0 ? (
          <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden mb-3">
            <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${statusPercentages.pending}%` }} title={`Pending: ${statusCounts.pending}`} />
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${statusPercentages.processing}%` }} title={`Processing: ${statusCounts.processing}`} />
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${statusPercentages.delivered}%` }} title={`Delivered: ${statusCounts.delivered}`} />
          </div>
        ) : (
          <div className="w-full h-3 bg-gray-100 rounded-full mb-3 flex items-center justify-center text-[8px] text-gray-400">
            No Data
          </div>
        )}

        {/* Legend with precise details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" />
              <span className="text-gray-500">Pending</span>
            </div>
            <span className="font-bold text-gray-700">{statusCounts.pending} ({statusPercentages.pending.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span className="text-gray-500">Processing</span>
            </div>
            <span className="font-bold text-gray-700">{statusCounts.processing} ({statusPercentages.processing.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-gray-500">Delivered</span>
            </div>
            <span className="font-bold text-gray-700">{statusCounts.delivered} ({statusPercentages.delivered.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardViewPage;
