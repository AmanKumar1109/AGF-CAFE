import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, PlusCircle, Download, Check, RefreshCw, Radio } from 'lucide-react';

export const DashboardHeader = ({ 
  onAddWidget, 
  onExport, 
  timeframe = '30days', 
  onTimeframeChange 
}) => {
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    setCurrentDateStr(formatted);
  }, []);

  const timeframeLabels = {
    '7days': 'Last 7 Days',
    '14days': 'Last 14 Days',
    '30days': 'Last 30 Days',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Title & Live Date */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-amber-700 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Cafe Operations
          </span>
          <span className="text-xs text-slate-400 font-medium">{currentDateStr}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
          Executive Dashboard
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Timeframe Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{timeframeLabels[timeframe] || 'Last 30 Days'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-1 overflow-hidden animate-in fade-in">
              {[
                { id: '7days', label: 'Last 7 Days' },
                { id: '14days', label: 'Last 14 Days' },
                { id: '30days', label: 'Last 30 Days' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (onTimeframeChange) onTimeframeChange(opt.id);
                    setIsPeriodOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    timeframe === opt.id ? 'text-amber-600 bg-amber-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {timeframe === opt.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Widget Button */}
        {onAddWidget && (
          <button
            type="button"
            onClick={onAddWidget}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Widgets</span>
          </button>
        )}

        {/* Real Export Button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-950" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
};
