import React from 'react';
import { X, FileSpreadsheet, FileText, Download, Check } from 'lucide-react';

export const ExportModal = ({ isOpen, onClose, onExportCSV }) => {
  if (!isOpen) return null;

  const handleDownload = (format) => {
    if (format === 'csv' && onExportCSV) {
      onExportCSV();
      onClose();
    } else {
      window.print();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 text-base font-serif">Export Financial Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Download live order telemetry, items sold breakdown, customer details, and total revenue records:
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => handleDownload('csv')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  CSV Sales Spreadsheet
                </div>
                <div className="text-[11px] text-slate-400">Excel, Google Sheets compatible (.csv)</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </button>

          <button
            onClick={() => handleDownload('print')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                  Print-Ready PDF Summary
                </div>
                <div className="text-[11px] text-slate-400">Browser print / Save as PDF</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
