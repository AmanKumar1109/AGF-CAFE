import React from 'react';
import { Eye, Users, MousePointer, ShoppingBag } from 'lucide-react';
import { TrendBadge } from '../common/Badge';

export const MetricCards = ({ metrics }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'eye':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'users':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'pointer':
        return <MousePointer className="w-4 h-4 text-blue-600" />;
      case 'bag':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      default:
        return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="gsap-card bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] hover:border-slate-200/70 transition-all duration-200 group"
        >
          {/* Card Top: Label & Blue Icon Box */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13.5px] font-semibold text-slate-500 tracking-tight">
              {metric.title}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/70 flex items-center justify-center group-hover:scale-110 transition-transform">
              {getIcon(metric.iconType)}
            </div>
          </div>

          {/* Metric Value & Trend Badge */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {metric.value}
            </h2>
            <TrendBadge
              isPositive={metric.isPositive}
              value={metric.change}
            />
          </div>

          {/* Comparison Text */}
          <p className="text-[11.5px] text-slate-400 mt-1 font-normal">
            {metric.comparison}
          </p>
        </div>
      ))}
    </div>
  );
};
