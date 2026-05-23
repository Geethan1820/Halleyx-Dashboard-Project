import React from 'react';
import type { WidgetType } from '../types/dashboard';
import { WIDGET_CATALOG } from '../types/dashboard';

interface SidebarProps {
  onAddWidget: (type: WidgetType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddWidget }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-20">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Widgets</h2>
        <p className="text-xs text-gray-500 mt-1">Drag and drop to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {WIDGET_CATALOG.map((item) => (
          <div
            key={item.type}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('widgetType', item.type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onAddWidget(item.type)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white cursor-grab active:cursor-grabbing hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-2xl group-hover:bg-white shadow-sm">
              {item.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">{item.defaultW} × {item.defaultH} units</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-indigo-50/30">
        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Canvas Tip</p>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Move the cursor to a widget edge or corner to resize (arrows appear on hover).
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
