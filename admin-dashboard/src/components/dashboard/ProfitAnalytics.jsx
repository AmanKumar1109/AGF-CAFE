import React, { useState } from 'react';
import { MoreHorizontal, Users } from 'lucide-react';
import { TrendBadge } from '../common/Badge';

export const ProfitAnalytics = ({ data }) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState(5); // Default to Jan 18 highlighted

  // Chart data points
  const points = data.currentMonthPoints;
  const currentPoint = points[hoveredPointIndex] || points[5];

  // SVG dimensions
  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  // Convert points to SVG coordinates
  const getCoordinates = (index, value, maxVal = 15000) => {
    const x = paddingX + (index / (points.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (value / maxVal) * (height - 2 * paddingY);
    return { x, y };
  };

  // Generate SVG path strings
  const getCurvedPath = (valKey) => {
    const coords = points.map((p, i) => getCoordinates(i, p[valKey]));
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

  // Area path for gradient fill
  const firstCoord = getCoordinates(0, points[0].thisMonth);
  const lastCoord = getCoordinates(points.length - 1, points[points.length - 1].thisMonth);
  const areaPath = `${thisMonthPath} L ${lastCoord.x} ${height - paddingY} L ${firstCoord.x} ${height - paddingY} Z`;

  // Active point coordinate
  const activeCoord = getCoordinates(hoveredPointIndex, currentPoint.thisMonth);

  return (
    <div className="gsap-card bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] transition-all duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
          Total Profit
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
          {/* Y Axis Guides are on right in the image */}
        </div>
      </div>

      {/* Main Metric & Trend */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {data.total}
        </span>
        <div className="flex items-center gap-1.5">
          <TrendBadge isPositive={data.isPositive} value={data.change} />
          <span className="text-xs text-slate-400 font-normal">
            {data.comparison}
          </span>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative w-full h-[210px] mt-2 mb-6 select-none">
        {/* Y Axis Legend on the Right */}
        <div className="absolute right-0 top-1 bottom-8 flex flex-col justify-between text-[11px] font-medium text-slate-400 pointer-events-none select-none text-right">
          <span>15K</span>
          <span>10K</span>
          <span>5K</span>
          <span>0</span>
        </div>

        {/* SVG Graph */}
        <div className="w-[calc(100%-35px)] h-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[170px] overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0.15, 0.45, 0.75, 0.95].map((ratio, i) => (
              <line
                key={i}
                x1={paddingX}
                y1={height * ratio}
                x2={width - paddingX}
                y2={height * ratio}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#profitGradient)" />

            {/* Last Month Comparison Line (Dashed) */}
            <path
              d={lastMonthPath}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />

            {/* This Month Line (Solid Blue) */}
            <path
              d={thisMonthPath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-xs"
            />

            {/* Vertical Marker Line at Active Point */}
            <line
              x1={activeCoord.x}
              y1={paddingY}
              x2={activeCoord.x}
              y2={height - paddingY}
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />

            {/* Outer Ring & Center Dot */}
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r="6.5"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="2.5"
              className="drop-shadow-md cursor-pointer"
            />

            {/* Invisible Hover Rectangles along X-axis */}
            {points.map((_, idx) => {
              const xPos = paddingX + (idx / (points.length - 1)) * (width - 2 * paddingX);
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
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                />
              );
            })}
          </svg>

          {/* Floating Tooltip matching image */}
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `clamp(10px, ${(activeCoord.x / width) * 100}%, calc(100% - 170px))`,
              top: `${Math.max(10, (activeCoord.y / height) * 150 - 65)}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-lg px-3 py-2 text-left min-w-[150px]">
              <div className="text-[11px] font-semibold text-slate-800 mb-1.5 border-b border-slate-100 pb-1">
                {currentPoint.date}, 2025
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-[2px] bg-blue-600 rounded-full" />
                  <span className="font-semibold text-slate-800">
                    ${currentPoint.thisMonth.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">this month</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-[2px] bg-slate-400 rounded-full border-t border-dashed" />
                  <span className="font-semibold text-slate-600">
                    ${currentPoint.lastMonth.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* X Axis Date Labels */}
          <div className="flex justify-between px-2 pt-2 text-[11px] font-medium text-slate-400">
            <span>1 Jan</span>
            <span>8 Jan</span>
            <span>15 Jan</span>
            <span>22 Jan</span>
            <span>29 Jan</span>
          </div>
        </div>
      </div>

      {/* Customers Section Divider & Sub-cards */}
      <div className="pt-4 border-t border-slate-100/90">
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="text-sm font-semibold text-slate-800 tracking-tight">
            Customers
          </h4>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Customer Segmentation Pillars */}
        <div className="grid grid-cols-3 gap-3">
          {data.customerSegments.map((segment) => (
            <div
              key={segment.id}
              className="relative p-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors border-l-3"
              style={{ borderLeftColor: segment.color }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  {segment.count}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
                {segment.label}
              </span>
              
              {/* Bottom colored mini progress bar */}
              <div className="w-full bg-slate-200/70 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: segment.progressWidth,
                    backgroundColor: segment.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
