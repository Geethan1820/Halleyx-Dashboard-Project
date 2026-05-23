export type WidgetType = 'kpi' | 'bar-chart' | 'line-chart' | 'area-chart' | 'scatter-chart' | 'pie-chart' | 'table';

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
export type FormatType = 'number' | 'currency';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  color?: string;
  // Data binding
  metric?: string;      // The field to aggregate (e.g. 'totalAmount')
  aggregation?: AggregationType;
  xAxis?: string;       // For charts (e.g. 'product' or 'status')
  yAxis?: string;       // For charts (e.g. 'totalAmount')
  // Visual config
  format?: FormatType;
  precision?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  // Table specific
  columns?: string[];
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GridLayoutItem {
  i: string;   // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardState {
  layout: GridLayoutItem[];
  widgets: WidgetConfig[];
}

export const WIDGET_CATALOG: { 
  type: WidgetType; 
  label: string; 
  icon: string; 
  defaultW: number; 
  defaultH: number;
  defaultConfig: Partial<WidgetConfig>;
}[] = [
  { 
    type: 'kpi', label: 'KPI Card', icon: '📊', defaultW: 3, defaultH: 2,
    defaultConfig: { metric: 'totalAmount', aggregation: 'sum', format: 'currency', precision: 0 }
  },
  { 
    type: 'bar-chart', label: 'Bar Chart', icon: '📈', defaultW: 5, defaultH: 4,
    defaultConfig: { xAxis: 'product', yAxis: 'totalAmount', aggregation: 'sum', showLabels: true }
  },
  { 
    type: 'line-chart', label: 'Line Chart', icon: '📉', defaultW: 5, defaultH: 4,
    defaultConfig: { xAxis: 'createdAt', yAxis: 'totalAmount', aggregation: 'sum' }
  },
  { 
    type: 'area-chart', label: 'Area Chart', icon: '🌊', defaultW: 5, defaultH: 4,
    defaultConfig: { xAxis: 'createdAt', yAxis: 'totalAmount', aggregation: 'sum' }
  },
  { 
    type: 'scatter-chart', label: 'Scatter Chart', icon: '✦', defaultW: 5, defaultH: 4,
    defaultConfig: { xAxis: 'quantity', yAxis: 'unitPrice' }
  },
  { 
    type: 'pie-chart', label: 'Pie Chart', icon: '🥧', defaultW: 4, defaultH: 4,
    defaultConfig: { xAxis: 'status', yAxis: 'totalAmount', aggregation: 'count', showLegend: true }
  },
  { 
    type: 'table', label: 'Table', icon: '🗂️', defaultW: 8, defaultH: 5,
    defaultConfig: { 
      columns: ['id', 'firstName', 'lastName', 'product', 'totalAmount', 'status'],
      pageSize: 10,
      sortField: 'createdAt',
      sortOrder: 'desc'
    }
  },
];
