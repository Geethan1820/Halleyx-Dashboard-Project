import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useContainerWidth } from 'react-grid-layout';
import GridLayout from 'react-grid-layout/legacy';
import type { Layout, LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './grid-canvas.css';
import { GripVertical } from 'lucide-react';
import type { WidgetConfig, GridLayoutItem } from '../types/dashboard';
import { WIDGET_CATALOG } from '../types/dashboard';
import WidgetWrapper from './widgets/WidgetWrapper';
import type { Order } from '../lib/dataEngine';

const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const DROPPING_PLACEHOLDER: LayoutItem = { i: 'dropping', x: 0, y: 0, w: 4, h: 4 };
const RESIZE_HANDLES: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'se' | 'nw' | 'ne'> = [
  's', 'w', 'e', 'n', 'sw', 'se', 'nw', 'ne',
];

function stripDropping(layout: Layout): GridLayoutItem[] {
  return layout.filter((l) => l.i !== 'dropping') as GridLayoutItem[];
}

function catalogSizeForType(type: string | undefined) {
  const catalog = WIDGET_CATALOG.find((c) => c.type === type);
  return catalog ? { w: catalog.defaultW, h: catalog.defaultH } : { w: 3, h: 2 };
}

function layoutSignature(items: GridLayoutItem[]) {
  return items.map((l) => `${l.i}:${l.x},${l.y},${l.w},${l.h}`).join('|');
}

function defaultGridItem(widget: WidgetConfig): GridLayoutItem {
  const catalog = WIDGET_CATALOG.find((c) => c.type === widget.type);
  return {
    i: widget.id,
    x: 0,
    y: 0,
    w: catalog?.defaultW ?? 3,
    h: catalog?.defaultH ?? 2,
    minW: 2,
    minH: 2,
  };
}

interface GridCanvasProps {
  layout: GridLayoutItem[];
  widgets: WidgetConfig[];
  orders: Order[];
  onLayoutChange: (layout: GridLayoutItem[]) => void;
  onDeleteWidget: (id: string) => void;
  onSettingsWidget: (widget: WidgetConfig) => void;
  onDrop: (layout: GridLayoutItem[], item: GridLayoutItem, e: Event) => void;
  onDrillDown?: (filter: any) => void;
  isEditable?: boolean;
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  layout,
  widgets,
  orders,
  onLayoutChange,
  onDeleteWidget,
  onSettingsWidget,
  onDrop,
  onDrillDown,
  isEditable = true,
}) => {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });
  const lastWidthRef = useRef(1200);
  const interactingRef = useRef(false);
  const layoutSigRef = useRef('');
  const [localLayout, setLocalLayout] = useState<GridLayoutItem[]>(layout);

  if (width > 0) lastWidthRef.current = width;
  const gridWidth = width > 0 ? width : lastWidthRef.current;

  /* Sync parent layout only when idle (avoids fighting RGL during drag/drop) */
  useEffect(() => {
    if (interactingRef.current) return;
    const sig = layoutSignature(layout);
    if (sig !== layoutSigRef.current) {
      layoutSigRef.current = sig;
      setLocalLayout(layout);
    }
  }, [layout]);

  const commitLayout = useCallback(
    (next: GridLayoutItem[]) => {
      const sig = layoutSignature(next);
      layoutSigRef.current = sig;
      setLocalLayout(next);
      if (isEditable) onLayoutChange(next);
    },
    [isEditable, onLayoutChange]
  );

  const beginInteraction = () => {
    interactingRef.current = true;
  };

  const endInteraction = (currentLayout: Layout) => {
    interactingRef.current = false;
    commitLayout(stripDropping(currentLayout));
  };

  /* Do NOT setState here — re-rendering charts on every pointer move causes blink */
  const handleLayoutChange = () => {};

  const handleDropDragOver = (e: React.DragEvent) => {
    beginInteraction();
    const type = e.dataTransfer?.getData('widgetType');
    return catalogSizeForType(type || undefined);
  };

  const handleDrop = (currentLayout: Layout, item: LayoutItem | undefined, e: Event) => {
    interactingRef.current = false;
    if (item && e) {
      onDrop(stripDropping(currentLayout) as GridLayoutItem[], item as GridLayoutItem, e);
    }
  };

  const showGrid = mounted && gridWidth > 0;

  return (
    <div
      ref={containerRef}
      className="halleyx-grid-canvas w-full min-h-[600px] flex-1 overflow-hidden bg-gray-50 p-4 relative"
    >
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 pointer-events-none z-0">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <span className="text-4xl">📐</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your dashboard is empty</h3>
          <p className="text-gray-400 text-sm max-w-xs">
            {isEditable
              ? 'Drag a widget from the sidebar to start configuring your custom view.'
              : 'No widgets have been configured for this dashboard yet.'}
          </p>
        </div>
      )}

      {!showGrid && (
        <div className="min-h-[500px] w-full rounded-xl bg-gray-100/60 animate-pulse" aria-hidden />
      )}

      {showGrid && (
        <GridLayout
          className="layout min-h-[500px] w-full"
          width={gridWidth}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          layout={localLayout}
          onLayoutChange={handleLayoutChange}
          onDragStart={beginInteraction}
          onResizeStart={beginInteraction}
          onDragStop={endInteraction}
          onResizeStop={endInteraction}
          onDropDragOver={handleDropDragOver}
          onDrop={handleDrop}
          isDroppable={isEditable}
          isDraggable={isEditable}
          isResizable={isEditable}
          droppingItem={DROPPING_PLACEHOLDER}
          draggableHandle=".widget-drag-handle"
          draggableCancel=".widget-action-btn"
          resizeHandles={isEditable ? RESIZE_HANDLES : []}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms
        >
          {widgets.map((widget) => {
            const gridItem = localLayout.find((l) => l.i === widget.id) ?? defaultGridItem(widget);
            return (
              <div key={widget.id} data-grid={gridItem} className="group cursor-default h-full">
                {isEditable && (
                  <div data-html2canvas-ignore="true" className="widget-drag-handle absolute top-2 left-2 p-1.5 rounded-md bg-white/90 shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 cursor-grab z-20">
                    <GripVertical size={14} className="text-gray-400" />
                  </div>
                )}

                <WidgetWrapper
                  widget={widget}
                  orders={orders}
                  editable={isEditable}
                  onDelete={onDeleteWidget}
                  onSettings={onSettingsWidget}
                  onDrillDown={onDrillDown}
                />
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
};

export default GridCanvas;
