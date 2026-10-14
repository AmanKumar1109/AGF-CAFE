import React, { useState } from 'react';
import { Calendar, ChevronDown, PlusCircle, Download, Check } from 'lucide-react';
import { Button } from '../common/Button';

export const DashboardHeader = ({ onAddWidget, onExport, onOpenDatePicker }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const periods = ['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Year to date'];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Date Range Picker Pill */}
        <button
          onClick={onOpenDatePicker}
          className="inline-flex items-center gap-2 bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Jan 1, 2025 - Feb 1, 2025</span>
        </button>

        {/* Timeframe Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setIsPeriodOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    selectedPeriod === period ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-600'
                  }`}
                >
                  <span>{period}</span>
                  {selectedPeriod === period && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Widget Button */}
        <button
          onClick={onAddWidget}
          className="inline-flex items-center gap-2 bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-[0.98]"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Add widget</span>
        </button>

        {/* Export Button */}
        <Button
          onClick={onExport}
          variant="primary"
          size="sm"
          className="!py-2 !px-4 text-xs font-semibold rounded-xl"
        >
          <Download className="w-3.5 h-3.5 text-white mr-1.5" />
          <span>Export</span>
        </Button>
      </div>
    </div>
  );
};
