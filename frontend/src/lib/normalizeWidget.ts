import type { WidgetConfig } from '../types/dashboard';

type LegacyWidget = WidgetConfig & {
  field?: string;
  decimals?: number;
};

/** Fix saved widgets that use old keys (e.g. field instead of xAxis). */
export function normalizeWidget(widget: WidgetConfig): WidgetConfig {
  const raw = { ...widget } as LegacyWidget;
  const normalized: WidgetConfig = { ...raw };

  if (raw.field && !normalized.xAxis) {
    normalized.xAxis = raw.field;
  }

  if (raw.decimals !== undefined && normalized.precision === undefined) {
    normalized.precision = raw.decimals;
  }

  if (
    normalized.type === 'pie-chart' ||
    normalized.type === 'bar-chart' ||
    normalized.type === 'line-chart' ||
    normalized.type === 'area-chart'
  ) {
    if (!normalized.xAxis) normalized.xAxis = 'product';
    if (!normalized.yAxis) normalized.yAxis = 'totalAmount';
    if (!normalized.aggregation) {
      normalized.aggregation = normalized.type === 'pie-chart' ? 'count' : 'sum';
    }
  }

  if (normalized.type === 'scatter-chart') {
    if (!normalized.xAxis) normalized.xAxis = 'quantity';
    if (!normalized.yAxis) normalized.yAxis = 'unitPrice';
  }

  if (normalized.type === 'kpi') {
    if (!normalized.metric) normalized.metric = 'totalAmount';
    if (!normalized.aggregation) normalized.aggregation = 'sum';
    if (!normalized.format) normalized.format = 'currency';
  }

  return normalized;
}

export function normalizeWidgets(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets.map(normalizeWidget);
}
