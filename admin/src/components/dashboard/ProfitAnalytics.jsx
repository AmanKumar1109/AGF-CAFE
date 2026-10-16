import React, { useState } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  CreditCard, 
  Banknote,
  Bike,
  Sparkles
} from 'lucide-react';

export const ProfitAnalytics = ({ 
  dailyPoints = [], 
  totalPeriodRevenue = 0,
  codRevenue = 0,
  onlineRevenue = 0,
  timeframe = '30days',
  onTimeframeChange 
}) => {
  const points = dailyPoints.length > 0 ? dailyPoints : [
    { x: 0, date: '1 Oct', thisMonth: 1200, lastMonth: 1000, orders: 4 },
    { x: 50, date: '15 Oct', thisMonth: 2800, lastMonth: 2200, orders: 9 },
    { x: 100, date: '30 Oct', thisMonth: 3400, lastMonth: 2900, orders: 12 },
  ];

  const [hoveredIndex, setHoveredIndex] = useState(points.length - 1);
  const currentPoint = points[hoveredIndex] || points[points.length - 1];

  // SVG canvas dimensions
  const width = 640;
  const height = 190;
  const paddingX = 25;
  const paddingY = 25;

  // Maximum value for SVG scaling
  const maxVal = Math.max(...points.map((p) => Math.max(p.thisMonth || 0, p.lastMonth || 0)), 1500) * 1.15;

  const getCoordinates = (index, value) => {
    const x = paddingX + (index / Math.max(1, points.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (Math.min(value, maxVal) / maxVal) * (height - 2 * paddingY);
    return { x, y };
  };

  // Spline curved path generator
  const getCurvedPath = (valKey) => {
    const coords = points.map((p, i) => getCoordinates(i, p[valKey] || 0));
    if (coords.length === 0) return '';

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const thisMonthPath = getCurvedPath('thisMonth');
  const lastMonthPath = getCurvedPath('lastMonth');

  // Fill area for gradient
  const firstCoord = getCoordinates(0, points[0]?.thisMonth || 0);
  const lastCoord = getCoordinates(points.length - 1, points[points.length - 1]?.thisMonth || 0);
  const areaPath = `${thisMonthPath} L ${lastCoord.x} ${height - paddingY} L ${firstCoord.x} ${height - paddingY} Z`;

  const activeCoord = getCoordinates(hoveredIndex, currentPoint?.thisMonth || 0);

  // Payment percentages
  const totalPayment = (codRevenue + onlineRevenue) || 1;
  const codPct = Math.round((codRevenue / totalPayment) * 100);
  const onlinePct = Math.round((onlineRevenue / totalPayment) * 100);

  return (
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-6">
      {/* Top Header & Range Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Financial Performance
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight font-serif mt-0.5">
            Cafe Sales & Revenue Analytics (₹)
          </h3>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: '7days', label: '7 Days' },
            { id: '14days', label: '14 Days' },
            { id: '30days', label: '30 Days' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onTimeframeChange && onTimeframeChange(btn.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === btn.id
                  ? 'bg-white text-stone-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Display & Current Point HUD */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase">Total Period Revenue</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 font-serif">
              ₹{Number(totalPeriodRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Firestore Sync
            </span>
          </div>
        </div>

        {currentPoint && (
          <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl text-right">
            <p className="text-[10px] text-amber-800 font-bold uppercase">
              {currentPoint.date} (Hovered Day)
            </p>
            <p className="text-sm font-black text-amber-900">
              ₹{(currentPoint.thisMonth || 0).toLocaleString('en-IN')} &bull; {currentPoint.orders || 0} orders
            </p>
          </div>
        )}
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full h-[200px] select-none">
        {/* Y Axis Grid Values */}
        <div className="absolute right-0 top-1 bottom-6 flex flex-col justify-between text-[10px] font-bold text-slate-400 pointer-events-none text-right">
          <span>₹{Math.round(maxVal).toLocaleString('en-IN')}</span>
          <span>₹{Math.round(maxVal / 2).toLocaleString('en-IN')}</span>
          <span>₹0</span>
        </div>

        <div className="w-[calc(100%-48px)] h-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[160px] overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cafeRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Dashed Lines */}
            {[0.2, 0.5, 0.85].map((ratio, i) => (
              <line
                key={i}
                x1={paddingX}
                y1={height * ratio}
                x2={width - paddingX}
                y2={height * ratio}
                stroke="#f1f5f9"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#cafeRevenueGrad)" />

            {/* Comparison Line (Dashed) */}
            <path
              d={lastMonthPath}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />

            {/* Main Revenue Curve (Amber) */}
            <path
              d={thisMonthPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertical Marker Line */}
            <line
              x1={activeCoord.x}
              y1={paddingY}
              x2={activeCoord.x}
              y2={height - paddingY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Active Dot */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r="6"
              fill="#ffffff"
              stroke="#f59e0b"
              strokeWidth="3"
              className="drop-shadow-md"
            />

            {/* Hover Trigger Rectangles */}
            {points.map((_, idx) => {
              const xPos = paddingX + (idx / Math.max(1, points.length - 1)) * (width - 2 * paddingX);
              const colWidth = (width - 2 * paddingX) / points.length;
              return (
                <rect
                  key={idx}
                  x={xPos - colWidth / 2}
                  y={0}
                  width={colWidth}
                  height={height}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {currentPoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-100 ease-out"
              style={{
                left: `clamp(10px, ${(activeCoord.x / width) * 100}%, calc(100% - 150px))`,
                top: `${Math.max(5, (activeCoord.y / height) * 140 - 55)}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-slate-900/95 backdrop-blur-md rounded-xl text-white px-3 py-1.5 shadow-xl border border-white/10 text-center min-w-[120px]">
                <p className="text-[10px] text-amber-400 font-bold">{currentPoint.date}</p>
                <p className="text-xs font-black text-white">
                  ₹{(currentPoint.thisMonth || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[9px] text-slate-400">{currentPoint.orders || 0} orders placed</p>
              </div>
            </div>
          )}

          {/* X Axis Date Labels */}
          <div className="flex justify-between px-2 pt-1 text-[11px] font-bold text-slate-400">
            <span>{points[0]?.date || 'Start'}</span>
            <span>{points[Math.floor(points.length / 2)]?.date || 'Mid'}</span>
            <span>{points[points.length - 1]?.date || 'Today'}</span>
          </div>
        </div>
      </div>

      {/* Revenue Channels & Payment Method Split */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Payment & Channel Breakdown
          </h4>
          <span className="text-[11px] text-slate-400 font-semibold">Total Revenue Distribution</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cash on Delivery Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Cash on Delivery (COD)</p>
                <p className="text-[11px] text-slate-500">{codPct}% of total orders</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-900">
              ₹{Number(codRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Prepaid Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Online & Prepaid</p>
                <p className="text-[11px] text-slate-500">{onlinePct}% of total orders</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-900">
              ₹{Number(onlineRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
