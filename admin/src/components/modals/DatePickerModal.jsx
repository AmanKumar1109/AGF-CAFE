import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';

export const DatePickerModal = ({ isOpen, onClose, onApply }) => {
  if (!isOpen) return null;

  const presets = [
    'Today',
    'Yesterday',
    'Last 7 days',
    'Last 30 days',
    'This Month (Jan 2025)',
    'Last Month (Dec 2024)',
    'Custom Range',
  ];

  const [selectedPreset, setSelectedPreset] = useState('This Month (Jan 2025)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Select Date Range</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 space-y-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                selectedPreset === preset
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{preset}</span>
              {selectedPreset === preset && <Check className="w-3.5 h-3.5 text-blue-600" />}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">Jan 1 - Feb 1, 2025</span>
          <button
            onClick={() => {
              if (onApply) onApply(selectedPreset);
              onClose();
            }}
            className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
