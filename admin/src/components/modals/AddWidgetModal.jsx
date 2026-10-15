import React from 'react';
import { X, Check } from 'lucide-react';

export const AddWidgetModal = ({ isOpen, onClose, widgetVisibility, onToggleWidget }) => {
  if (!isOpen) return null;

  const availableWidgets = [
    { id: 'profit', name: 'Total Profit & Customers', desc: 'Line chart with customer segmentation breakdown' },
    { id: 'activity', name: 'Most Day Active', desc: 'Weekly active visitor volume bar chart' },
    { id: 'retention', name: 'Repeat Customer Rate', desc: 'Semi-circular gauge of customer retention target' },
    { id: 'products', name: 'Best Selling Products', desc: 'Top revenue products with ratings and order volume' },
    { id: 'assistant', name: 'AI Assistant', desc: 'Interactive LLM store intelligence co-pilot' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">Customize Widgets</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 my-4">
          Toggle widgets on your dashboard workspace to organize your workflow:
        </p>

        <div className="space-y-3">
          {availableWidgets.map((w) => {
            const isVisible = widgetVisibility[w.id] !== false;
            return (
              <div
                key={w.id}
                onClick={() => onToggleWidget(w.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                  isVisible
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">{w.name}</div>
                  <div className="text-[11px] text-slate-400">{w.desc}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    isVisible ? 'bg-blue-600 text-white' : 'border border-slate-300'
                  }`}
                >
                  {isVisible && <Check className="w-3.5 h-3.5 stroke-3" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
