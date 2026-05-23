import React from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from 'recharts';
import { 
  X, Filter, ChevronLeft, ChevronRight, ArrowUpDown, 
  ArrowUp, ArrowDown 
} from 'lucide-react';
import type { WidgetConfig } from '../../types/dashboard';
import { aggregateData, groupData, getChartDataIssue, type Order } from '../../lib/dataEngine';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#14b8a6'];

interface WidgetProps {
  config: WidgetConfig;
  data: Order[];
  onDrillDown?: (filter: any) => void;
}

export function KpiWidget({ config, data }: WidgetProps) {
  const value = aggregateData(data, config);
  const isCurrency = config.format === 'currency';
  
  const formattedValue = isCurrency 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: config.precision ?? 0 }).format(value)
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: config.precision ?? 0 }).format(value);

  return (
    <div className="h-full flex flex-col justify-between p-5 group transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{config.title}</p>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.color || '#6366f1' }} />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-black text-gray-900 truncate tracking-tight" title={formattedValue}>{formattedValue}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
            {config.aggregation || 'sum'}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            of {config.metric?.replace(/([A-Z])/g, ' $1') || 'Total Amount'}
          </span>
        </div>
      </div>
      <div className="h-1 w-full bg-gray-50 rounded-full mt-4 overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: '65%', backgroundColor: config.color || '#6366f1' }} />
      </div>
    </div>
  );
}

export function BarChartWidget({ config, data, onDrillDown }: WidgetProps) {
  const chartData = groupData(data, config);
  const color = config.color || '#6366f1';
  
  return (
    <div className="h-full flex flex-col p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{config.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(data: any) => {
              if (data && data.activePayload && onDrillDown) {
                onDrillDown({ [config.xAxis!]: data.activePayload[0].payload.name });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} 
            />
            {config.showLegend && <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px' }} />}
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} barSize={32}>
              {config.showLabels && <LabelList dataKey="value" position="top" style={{ fontSize: '9px', fontWeight: 800, fill: color }} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LineChartWidget({ config, data, onDrillDown }: WidgetProps) {
  const chartData = groupData(data, config);
  const color = config.color || '#8b5cf6';

  return (
    <div className="h-full flex flex-col p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{config.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(data: any) => {
              if (data && data.activePayload && onDrillDown) {
                onDrillDown({ [config.xAxis!]: data.activePayload[0].payload.name });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
            {config.showLegend && <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px' }} />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3} 
              dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
            >
              {config.showLabels && <LabelList dataKey="value" position="top" style={{ fontSize: '9px', fontWeight: 800, fill: color }} offset={10} />}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AreaChartWidget({ config, data, onDrillDown }: WidgetProps) {
  const chartData = groupData(data, config);
  const gradId = `areaGrad-${config.id}`;
  const color = config.color || '#6366f1';

  return (
    <div className="h-full flex flex-col p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{config.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={(data: any) => {
              if (data && data.activePayload && onDrillDown) {
                onDrillDown({ [config.xAxis!]: data.activePayload[0].payload.name });
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradId})`} strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScatterChartWidget({ config, data }: WidgetProps) {
  const xAxis = config.xAxis as keyof Order || 'quantity';
  const yAxis = config.yAxis as keyof Order || 'unitPrice';
  const chartData = data.map(item => ({
    x: Number(item[xAxis]),
    y: Number(item[yAxis]),
    name: `${item.firstName} ${item.lastName}`
  }));

  return (
    <div className="h-full flex flex-col p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{config.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="x" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} name={xAxis} />
            <YAxis type="number" dataKey="y" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} name={yAxis} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
            <Scatter data={chartData} fill={config.color || '#ec4899'} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6">
      <p className="text-xs font-semibold text-gray-500">{message}</p>
      <p className="text-[10px] text-indigo-500 mt-2 font-medium">Open widget settings → Group By → Country</p>
    </div>
  );
}

export function PieChartWidget({ config, data, onDrillDown }: WidgetProps) {
  const chartData = groupData(data, config);
  const issue = getChartDataIssue(data, config);

  return (
    <div className="h-full flex flex-col p-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{config.title}</p>
      <div className="flex-1 min-h-0">
        {issue ? (
          <ChartEmptyState message={issue} />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={chartData} 
              cx="50%" 
              cy="50%" 
              innerRadius="50%"
              outerRadius="80%" 
              dataKey="value" 
              stroke="none"
              paddingAngle={5}
              label={config.showLabels ? ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%` : undefined}
              onClick={(segment: any) => {
                if (onDrillDown) onDrillDown({ [config.xAxis!]: segment.name });
              }}
            >
              {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }} />
            {config.showLegend && <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }} />}
          </PieChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function TableWidget({ config, data, onDrillDown }: WidgetProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(config.pageSize || 5);
  const [sortField, setSortField] = React.useState<string>(config.sortField || 'id');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>(config.sortOrder || 'desc');
  const [localFilters, setLocalFilters] = React.useState<{ field: string, value: string }[]>([]);
  const [showFilterUI, setShowFilterUI] = React.useState(false);

  const columns = config.columns || ['id', 'product', 'totalAmount', 'status'];
  
  const filteredData = React.useMemo(() => {
    let result = [...data];
    
    // Apply Multi-filters
    localFilters.forEach(f => {
      if (!f.value) return;
      result = result.filter(item => 
        String(item[f.field as keyof Order]).toLowerCase().includes(f.value.toLowerCase())
      );
    });

    // Sorting
    result.sort((a, b) => {
      const field = sortField as keyof Order;
      const valA = a[field];
      const valB = b[field];
      const order = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order;
      }
      return String(valA).localeCompare(String(valB)) * order;
    });

    return result;
  }, [data, sortField, sortOrder, localFilters]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const addFilter = () => {
    setLocalFilters([...localFilters, { field: columns[0], value: '' }]);
  };

  const updateFilter = (index: number, f: { field: string, value: string }) => {
    const next = [...localFilters];
    next[index] = f;
    setLocalFilters(next);
  };

  const removeFilter = (index: number) => {
    setLocalFilters(localFilters.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col p-5 overflow-hidden bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{config.title}</p>
          <p className="text-[9px] text-indigo-500 font-bold mt-0.5">{filteredData.length} Records Found</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilterUI(!showFilterUI)}
            className={`p-2 rounded-lg border transition-all ${showFilterUI ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200 hover:text-indigo-500'}`}
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {showFilterUI && (
        <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Filters</h4>
            <button onClick={addFilter} className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-tighter">
              + Add Filter
            </button>
          </div>
          {localFilters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <select 
                value={f.field}
                onChange={(e) => updateFilter(i, { ...f, field: e.target.value })}
                className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-white border border-gray-200 rounded-lg outline-none"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input 
                type="text"
                placeholder="Value..."
                value={f.value}
                onChange={(e) => updateFilter(i, { ...f, value: e.target.value })}
                className="flex-1 px-3 py-1.5 text-[10px] font-bold bg-white border border-gray-200 rounded-lg outline-none"
              />
              <button onClick={() => removeFilter(i)} className="text-gray-400 hover:text-red-500 p-1">
                <X size={14} />
              </button>
            </div>
          ))}
          {localFilters.length === 0 && <p className="text-[9px] text-gray-400 italic">No filters applied. Click + Add Filter to refine data.</p>}
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar border border-gray-100 rounded-2xl bg-white shadow-sm mb-4">
        <table className="min-w-full text-[10px] sm:text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/80 backdrop-blur-md text-gray-400 border-b border-gray-100">
              {columns.map(col => (
                <th 
                  key={col} 
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left font-black uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {col.replace(/([A-Z])/g, ' $1')}
                    {sortField === col ? (
                      sortOrder === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                    ) : <ArrowUpDown size={10} className="opacity-30" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((row: any) => (
              <tr 
                key={row.id} 
                onClick={() => onDrillDown?.({ id: row.id })}
                className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
              >
                {columns.map(col => (
                  <td key={col} className="px-4 py-3 text-gray-600 font-medium group-hover:text-indigo-900 transition-colors">
                    {col === 'totalAmount' || col === 'unitPrice' 
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row[col])
                      : col === 'createdAt'
                        ? new Date(row[col]).toLocaleDateString()
                        : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Rows per page:</span>
            <select 
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-[10px] font-black text-indigo-600 bg-transparent outline-none cursor-pointer"
            >
              {[5, 10, 15].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <p className="text-[10px] font-bold text-gray-400">
            Page {currentPage} of {Math.max(1, totalPages)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
