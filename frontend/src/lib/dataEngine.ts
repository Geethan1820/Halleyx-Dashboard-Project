import type { WidgetConfig } from '../types/dashboard';
import type { Order } from '../types/order';
import { normalizeWidget } from './normalizeWidget';

export type { Order };

const CHART_TYPES = new Set([
  'bar-chart',
  'line-chart',
  'area-chart',
  'pie-chart',
  'scatter-chart',
]);

function resolveXAxis(config: WidgetConfig): keyof Order | null {
  const w = normalizeWidget(config);
  const axis = w.xAxis as keyof Order | undefined;
  if (!axis || axis === ('undefined' as keyof Order)) return null;
  return axis;
}

function resolveYAxis(config: WidgetConfig): keyof Order {
  const w = normalizeWidget(config);
  return (w.yAxis as keyof Order) || 'totalAmount';
}

function formatGroupKey(axis: keyof Order, raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (axis === 'createdAt') {
    const d = new Date(String(raw));
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
  }
  const key = String(raw).trim();
  if (!key || key.toLowerCase() === 'undefined') return null;
  return key;
}

export const aggregateData = (data: Order[], config: WidgetConfig) => {
  if (!data || data.length === 0) return 0;

  const w = normalizeWidget(config);
  const metric = (w.metric || 'totalAmount') as keyof Order;
  const values = data.map((item) => Number(item[metric]) || 0);

  switch (w.aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'count':
      return data.length;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return 0;
  }
};

export const groupData = (data: Order[], config: WidgetConfig) => {
  if (!data || data.length === 0) return [];

  const w = normalizeWidget(config);
  const xAxis = resolveXAxis(w);
  if (!xAxis) return [];

  const yAxis = resolveYAxis(w);
  const aggregation = w.aggregation || 'sum';
  const groups: Record<string, number[]> = {};

  data.forEach((item) => {
    const key = formatGroupKey(xAxis, item[xAxis]);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(Number(item[yAxis]) || 0);
  });

  return Object.entries(groups)
    .map(([name, values]) => {
      let value = 0;
      switch (aggregation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          value = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          value = values.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
      }
      return { name, value };
    })
    .filter((row) => row.value > 0 || aggregation === 'count')
    .sort((a, b) => a.name.localeCompare(b.name));
};

export function getChartDataIssue(data: Order[], config: WidgetConfig): string | null {
  if (!data.length) return 'No orders match the current filters.';
  if (!CHART_TYPES.has(config.type)) return null;

  const w = normalizeWidget(config);
  if (!resolveXAxis(w)) {
    return 'Set a Group By field in widget settings (e.g. Country).';
  }

  if (groupData(data, config).length === 0) {
    return 'No valid values for the selected Group By field. Check order data or change settings.';
  }

  return null;
}
