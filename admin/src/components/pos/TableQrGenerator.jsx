import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Download,
  UtensilsCrossed,
  Wifi,
  Sparkles,
  Check,
  Eye,
  Layers,
  ChevronRight
} from 'lucide-react';

export const TableQrGenerator = ({ tables = [] }) => {
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id || 'table-1');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [allQrCodes, setAllQrCodes] = useState({});
  const [baseUrl, setBaseUrl] = useState(() => {
    // Default to current origin or fallback production domain
    if (typeof window !== 'undefined' && window.location.origin) {
      // In dev admin running on port 5174 or 5173, user app is on 5173 or deployed domain
      return window.location.origin.includes('localhost')
        ? 'http://localhost:5173'
        : window.location.origin.replace('admin', 'user');
    }
    return 'https://agf-cafe.web.app';
  });

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0] || {
    id: 'table-1',
    tableNumber: '1',
    name: 'Table 1',
  };

  // Generate QR code for the selected table
  useEffect(() => {
    const tableUrl = `${baseUrl}/table/${selectedTable.tableNumber}`;
    QRCode.toDataURL(tableUrl, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [selectedTable, baseUrl]);

  // Pre-generate all QR codes for bulk printing
  useEffect(() => {
    async function generateAll() {
      const map = {};
      for (const t of tables) {
        const tableUrl = `${baseUrl}/table/${t.tableNumber}`;
        try {
          const dataUrl = await QRCode.toDataURL(tableUrl, {
            width: 350,
            margin: 1.5,
            color: { dark: '#1c1917', light: '#ffffff' },
          });
          map[t.id] = dataUrl;
        } catch (e) {
          console.warn('Failed QR for', t.id, e);
        }
      }
      setAllQrCodes(map);
    }
    if (tables.length > 0) {
      generateAll();
    }
  }, [tables, baseUrl]);

  const handlePrintCurrent = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `AGF_Cafe_Table_${selectedTable.tableNumber}_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Configuration Bar (Hidden during print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Contactless Table Ordering
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Table QR Standee & Sticker Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Print luxury table cards for acrylic standees. Customers scan the QR to order directly from their table with ₹0 delivery fee.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQr}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handlePrintCurrent}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Table Card (A6 / Standee)</span>
            </button>
          </div>
        </div>

        {/* Table Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Select Table to Preview & Print:
          </label>
          <div className="flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedTableId === t.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/25 scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Table {t.tableNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Base Domain Config Input */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold">QR Target URL:</span>
            <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-800 border border-slate-200">
              {baseUrl}/table/{selectedTable.tableNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Change host:</span>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono w-48 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Standee Physical Card Preview (Styled for Print & Display) */}
      <div className="flex justify-center p-4 sm:p-8 bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden">
        
        {/* Printable Card (Dimensions tailored for standard 4x6" / A6 acrylic standee) */}
        <div
          id="printable-standee-card"
          className="w-full max-w-sm bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400/50 shadow-2xl flex flex-col items-center text-center relative overflow-hidden print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none"
        >
          {/* Subtle gold decorative accents */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

          {/* Cafe Header Brand */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-amber-300">
              AGF CAFE & BISTRO
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight text-white">
            Table Contactless Menu
          </h2>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Scan with camera • Order food • Served hot & fresh
          </p>

          {/* Prominent Table Badge */}
          <div className="mt-4 mb-4 px-6 py-2 rounded-2xl bg-amber-400 text-stone-950 font-black shadow-lg shadow-amber-500/30">
            <span className="text-xl tracking-wider uppercase">
              TABLE #{selectedTable.tableNumber}
            </span>
          </div>

          {/* QR Code Container with High-Contrast White Background */}
          <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-amber-400/40 relative mb-4">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`QR for Table ${selectedTable.tableNumber}`}
                className="w-56 h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-stone-400 font-bold text-xs">
                Generating QR...
              </div>
            )}
            <div className="absolute -bottom-3 inset-x-0 flex justify-center">
              <span className="bg-stone-900 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                ₹0 Delivery Fee
              </span>
            </div>
          </div>

          {/* Instructions Steps */}
          <div className="w-full bg-stone-850/80 rounded-2xl border border-stone-800 p-3.5 space-y-1.5 text-left text-xs text-stone-300 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-[10px] shrink-0">
                1
              </span>
              <span>Open Phone Camera & Scan QR Code</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-[10px] shrink-0">
                2
              </span>
              <span>Select Your Favorite Dishes & Drinks</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-[10px] shrink-0">
                3
              </span>
              <span>Pay Online via UPI or Cash at Counter</span>
            </div>
          </div>

          {/* Cafe Wi-Fi Pill */}
          <div className="mt-4 pt-3 border-t border-stone-800 w-full flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-bold">Complimentary Wi-Fi:</span>
            </div>
            <div className="font-mono text-stone-200">
              AGF-CAFE-GUEST <span className="text-stone-500">|</span> 832101
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TableQrGenerator;
