import React from 'react';
import { Users, Heart, Sparkles, TrendingUp } from 'lucide-react';

export const RepeatCustomerRate = ({ 
  repeatRate = 68, 
  aov = 340,
  totalCustomers = 0 
}) => {
  const percentage = Math.min(100, Math.max(5, repeatRate));
  const target = 80;

  // Number of radial ticks in semi-circle arch
  const totalTicks = 30;
  const activeTicksCount = Math.round((percentage / 100) * totalTicks);

  // SVG dimensions for gauge
  const cx = 110;
  const cy = 90;
  const innerRadius = 60;
  const outerRadius = 78;

  const ticks = Array.from({ length: totalTicks }, (_, index) => {
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
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight font-serif">
            Customer Retention & Loyalty
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">Patrons ordering more than once</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
          <Heart className="w-4 h-4 fill-purple-500/20" />
        </div>
      </div>

      {/* Radial Semi-circle Gauge */}
      <div className="flex flex-col items-center justify-center my-1 select-none">
        <div className="relative w-[210px] h-[105px] flex items-center justify-center">
          <svg viewBox="0 0 220 105" className="w-full h-full overflow-visible">
            {ticks.map((tick) => (
              <line
                key={tick.index}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={tick.isActive ? '#f59e0b' : '#e2e8f0'}
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Central Percentage */}
          <div className="absolute bottom-1 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 font-serif leading-none">
              {percentage}%
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-1">
              Loyal Patrons
            </span>
          </div>
        </div>

        {/* Target Progress Bar */}
        <p className="text-xs font-bold text-slate-600 mt-2 text-center">
          Target: <strong className="text-slate-900">{target}%</strong> retention benchmark
        </p>
      </div>

      {/* Average Order Value (AOV) Sub-card */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">Avg. Basket Size (AOV)</p>
          <p className="text-sm font-black text-slate-900 font-serif mt-0.5">
            ₹{Number(aov || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          Healthy Cafe Ratio
        </span>
      </div>
    </div>
  );
};
