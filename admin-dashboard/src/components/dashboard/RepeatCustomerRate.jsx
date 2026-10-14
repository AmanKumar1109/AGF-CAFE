import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export const RepeatCustomerRate = ({ data }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const percentage = data.percentage || 68;
  const target = data.target || 80;

  // Number of radial ticks in semi-circle arch
  const totalTicks = 32;
  const activeTicksCount = Math.round((percentage / 100) * totalTicks);

  // SVG dimensions for gauge
  const cx = 110;
  const cy = 95;
  const innerRadius = 64;
  const outerRadius = 82;

  // Generate tick marks for 180 degree semi-circle arc (from 180° on left to 0° on right)
  const ticks = Array.from({ length: totalTicks }, (_, index) => {
    // Angle in degrees from 180 to 0
    const angleDeg = 180 - (index / (totalTicks - 1)) * 180;
    const angleRad = (angleDeg * Math.PI) / 180;

    const x1 = cx + innerRadius * Math.cos(angleRad);
    const y1 = cy - innerRadius * Math.sin(angleRad);
    const x2 = cx + outerRadius * Math.cos(angleRad);
    const y2 = cy - outerRadius * Math.sin(angleRad);

    const isActive = index < activeTicksCount;

    return { index, x1, y1, x2, y2, isActive };
  });

  return (
    <div className="gsap-card bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] transition-all duration-200 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Repeat Customer Rate
        </h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Radial Semi-circle Gauge */}
      <div className="flex flex-col items-center justify-center my-1 select-none">
        <div className="relative w-[220px] h-[115px] flex items-center justify-center">
          <svg viewBox="0 0 220 115" className="w-full h-full overflow-visible">
            {ticks.map((tick) => (
              <line
                key={tick.index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tick.isActive ? '#10b981' : '#e2e8f0'}
                strokeWidth="3.2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            ))}
          </svg>

          {/* Center Text inside the Semi-circle */}
          <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {percentage}%
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              {data.label || `On track for ${target}% target`}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Show Details Button */}
      <div className="flex justify-center mt-3">
        <button
          onClick={() => setShowDetailsModal(!showDetailsModal)}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
        >
          Show details
        </button>
      </div>

      {/* Details dropdown preview */}
      {showDetailsModal && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
          <div className="flex justify-between">
            <span>New returning this month:</span>
            <span className="font-semibold text-slate-800">1,940 customers</span>
          </div>
          <div className="flex justify-between">
            <span>Customer Retention Index:</span>
            <span className="font-semibold text-emerald-600">+12% vs avg</span>
          </div>
        </div>
      )}
    </div>
  );
};
