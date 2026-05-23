import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Order } from '../types/order';
import type { WidgetConfig, GridLayoutItem } from '../types/dashboard';

/** ISO date for filenames: YYYY-MM-DD */
export function dateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

/** Trigger browser download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export interface CaptureOptions {
  scale?: number;
  backgroundColor?: string;
  isSingleWidget?: boolean;
}

/**
 * Capture a DOM node as a high-resolution canvas (charts stay sharp at scale 2).
 */
export async function captureElementToCanvas(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<HTMLCanvasElement> {
  const { scale = 2, backgroundColor = '#ffffff', isSingleWidget = false } = options;

  const widgetType = element.getAttribute('data-widget-type') || 'unknown';
  const isChart = widgetType.includes('chart');
  const shouldInjectStyles = isSingleWidget && !isChart;

  // 1. Temporarily store computed dimensions directly on the live SVGs before cloning.
  // This avoids index mapping mismatches when html2canvas ignores/deletes action toolbars & buttons!
  const realSvgs = element.querySelectorAll('svg');
  realSvgs.forEach((svg) => {
    const rect = svg.getBoundingClientRect();
    svg.setAttribute('data-computed-width', String(rect.width));
    svg.setAttribute('data-computed-height', String(rect.height));
  });

  let styleEl: HTMLStyleElement | null = null;
  if (shouldInjectStyles) {
    element.setAttribute('data-exporting-widget', 'true');
    styleEl = document.createElement('style');
    styleEl.id = 'html2canvas-export-styles';
    styleEl.innerHTML = `
      [data-exporting-widget="true"] [data-html2canvas-ignore="true"],
      [data-exporting-widget="true"] .widget-drag-handle {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      [data-exporting-widget="true"] {
        overflow: visible !important;
      }
      [data-exporting-widget="true"] * {
        letter-spacing: 0.1px !important;
      }
      [data-widget-type="table"][data-exporting-widget="true"] {
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
      [data-widget-type="table"][data-exporting-widget="true"] .h-full,
      [data-widget-type="table"][data-exporting-widget="true"] .flex-1,
      [data-widget-type="table"][data-exporting-widget="true"] [style*="height: 100%"] {
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
      [data-widget-type="table"][data-exporting-widget="true"] .overflow-auto,
      [data-widget-type="table"][data-exporting-widget="true"] .overflow-y-auto,
      [data-widget-type="table"][data-exporting-widget="true"] .custom-scrollbar,
      [data-widget-type="table"][data-exporting-widget="true"] [style*="overflow: auto"],
      [data-widget-type="table"][data-exporting-widget="true"] [style*="overflow: scroll"] {
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }
      [data-widget-type="kpi"][data-exporting-widget="true"] {
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
      }
      [data-widget-type="kpi"][data-exporting-widget="true"] .h-full,
      [data-widget-type="kpi"][data-exporting-widget="true"] .flex-col {
        height: auto !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Calculate element bounds AFTER applying styles in the live DOM (if styles were applied)
  const rect = element.getBoundingClientRect();

  const html2canvasOptions: any = {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    allowTaint: false,
    scrollX: 0,
    scrollY: 0,
    width: rect.width,
    height: rect.height,
    onclone: (clonedDoc: Document, clonedEl?: any) => {
      const target = clonedEl || clonedDoc.body;
      if (target) {
        // Ensure root of the cloned element does not clip and can grow
        target.style.setProperty('overflow', 'visible', 'important');
        if (isSingleWidget && !isChart) {
          target.style.setProperty('height', 'auto', 'important');
          target.style.setProperty('min-height', 'auto', 'important');
          target.style.setProperty('max-height', 'none', 'important');
        }

        // Copy exact dimensions from active SVGs to cloned SVGs using self-contained attributes
        const clonedSvgs = target.querySelectorAll('svg');
        clonedSvgs.forEach((clonedSvg: any) => {
          const w = clonedSvg.getAttribute('data-computed-width');
          const h = clonedSvg.getAttribute('data-computed-height');
          if (w && h) {
            clonedSvg.setAttribute('width', w);
            clonedSvg.setAttribute('height', h);
            clonedSvg.style.setProperty('width', `${w}px`, 'important');
            clonedSvg.style.setProperty('height', `${h}px`, 'important');
          }
        });
        
        // Query all elements inside the cloned tree
        const allClonedElements = target.querySelectorAll('*');
        allClonedElements.forEach((el: any) => {
          const htmlEl = el as HTMLElement;

          // Safely extract the class name as a string (handles HTML elements and SVGAnimatedString in SVG/Recharts elements)
          const className = typeof htmlEl.className === 'string'
            ? htmlEl.className
            : (htmlEl.className && typeof (htmlEl.className as any).baseVal === 'string'
               ? (htmlEl.className as any).baseVal
               : '');

          // 1. Relax tight letter-spacing/tracking (resolves character overlap and missing punctuation)
          if (
            className.includes('tracking-') ||
            htmlEl.style.letterSpacing
          ) {
            htmlEl.style.setProperty('letter-spacing', '0.1px', 'important');
          }

          // 2. Remove truncate / overflow-hidden text clipping
          if (
            className.includes('truncate') ||
            className.includes('overflow-hidden') ||
            htmlEl.style.overflow === 'hidden'
          ) {
            htmlEl.style.setProperty('overflow', 'visible', 'important');
            htmlEl.style.setProperty('white-space', 'normal', 'important');
            htmlEl.style.setProperty('text-overflow', 'clip', 'important');
            htmlEl.style.setProperty('height', 'auto', 'important');
          }

          // Relax single widget size constraints to let them grow naturally to their nested content heights
          if (isSingleWidget && !isChart) {
            // Relax h-full and flex height constraints
            if (
              className.includes('h-full') ||
              htmlEl.style.height === '100%' ||
              className.includes('flex-1')
            ) {
              htmlEl.style.setProperty('height', 'auto', 'important');
              htmlEl.style.setProperty('min-height', 'auto', 'important');
              htmlEl.style.setProperty('max-height', 'none', 'important');
            }

            // Relax scroll containers (like Table bodies) so they expand to display all items/rows
            if (
              className.includes('overflow-auto') ||
              className.includes('overflow-y-auto') ||
              className.includes('custom-scrollbar') ||
              htmlEl.style.overflow === 'auto' ||
              htmlEl.style.overflow === 'scroll'
            ) {
              htmlEl.style.setProperty('overflow', 'visible', 'important');
              htmlEl.style.setProperty('max-height', 'none', 'important');
              htmlEl.style.setProperty('height', 'auto', 'important');
            }
          }
        });
      }
    }
  };

  try {
    const canvas = await html2canvas(element, html2canvasOptions);
    return canvas;
  } finally {
    // Clean up temporary attributes from live SVGs
    realSvgs.forEach((svg) => {
      svg.removeAttribute('data-computed-width');
      svg.removeAttribute('data-computed-height');
    });

    if (shouldInjectStyles) {
      element.removeAttribute('data-exporting-widget');
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    }
  }
}

/**
 * Dashboard PDF: screenshot → landscape A4 → auto-download.
 * Supports multi-page when content is taller than one page.
 */
export async function exportDashboardPdf(element: HTMLElement): Promise<void> {
  if (!element || element.offsetHeight === 0) {
    throw new Error('Dashboard is empty. Add widgets before exporting.');
  }

  const canvas = await captureElementToCanvas(element, {
    scale: 2,
    backgroundColor: '#f9fafb',
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;
  const ratio = printableWidth / imgWidthPx;
  const imgHeightMm = imgHeightPx * ratio;

  let heightLeft = imgHeightMm;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, printableWidth, imgHeightMm);
  heightLeft -= printableHeight;

  while (heightLeft > 0) {
    position = margin - (imgHeightMm - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, printableWidth, imgHeightMm);
    heightLeft -= printableHeight;
  }

  pdf.save(`dashboard-report-${dateStamp()}.pdf`);
}

/** Full dashboard / single widget PNG export. */
export async function exportElementPng(
  element: HTMLElement,
  filename: string,
  backgroundColor = '#ffffff',
  isSingleWidget = false
): Promise<void> {
  if (!element || element.offsetHeight === 0) {
    throw new Error('Nothing to export. The element is empty.');
  }

  const canvas = await captureElementToCanvas(element, { scale: 2, backgroundColor, isSingleWidget });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/** Per-widget PNG: widget-{type}-{timestamp}.png */
export async function exportWidgetPng(
  element: HTMLElement,
  widgetType: string
): Promise<void> {
  const ts = Date.now();
  const safeType = widgetType.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  await exportElementPng(element, `widget-${safeType}-${ts}.png`, '#ffffff', true);
}

const ORDER_CSV_COLUMNS: { key: keyof Order; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'street', header: 'Street' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'postalCode', header: 'Postal Code' },
  { key: 'country', header: 'Country' },
  { key: 'product', header: 'Product' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'unitPrice', header: 'Unit Price' },
  { key: 'totalAmount', header: 'Total Amount' },
  { key: 'status', header: 'Status' },
  { key: 'createdBy', header: 'Created By' },
  { key: 'createdAt', header: 'Created At' },
];

function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Orders CSV from filtered in-memory data (Excel-compatible UTF-8 BOM). */
export function exportOrdersCsv(orders: Order[]): void {
  if (!orders.length) {
    throw new Error('No orders to export. Adjust filters or add orders first.');
  }

  const headerRow = ORDER_CSV_COLUMNS.map((c) => escapeCsvCell(c.header)).join(',');
  const dataRows = orders.map((order) =>
    ORDER_CSV_COLUMNS.map((c) => escapeCsvCell(order[c.key])).join(',')
  );

  const csv = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `orders-export-${dateStamp()}.csv`);
}

export interface DashboardExportConfig {
  layout: GridLayoutItem[];
  widgets: WidgetConfig[];
  exportedAt: string;
  version: number;
}

/** Dashboard builder config as pretty JSON. */
export function exportDashboardConfigJson(
  layout: GridLayoutItem[],
  widgets: WidgetConfig[]
): void {
  if (!widgets.length && !layout.length) {
    throw new Error('Dashboard configuration is empty.');
  }

  const payload: DashboardExportConfig = {
    version: 1,
    exportedAt: new Date().toISOString(),
    layout,
    widgets,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, 'dashboard-config.json');
}
