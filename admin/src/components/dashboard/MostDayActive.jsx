import React, { useState, useRef } from 'react';
import { Clock, Calendar, Sparkles } from 'lucide-react';
import { useBarChartGrow } from '../../hooks/useGSAPAnimation';

export const MostDayActive = ({ activityData = [] }) => {
  const chartContainerRef = useRef(null);

  // Default peak day
  const defaultActive = activityData.find((d) => d.active)?.day || 'Sat';
  const [activeDay, setActiveDay] = useState(defaultActive);

  useBarChartGrow(chartContainerRef);

  const currentItem = activityData.find((d) => d.day === activeDay) || activityData[0];

  return (
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight font-serif">
            Weekly Peak Days & Rush
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">Busiest customer order volume</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* Active Day Highlight Info */}
      {currentItem && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="font-extrabold text-amber-900">{currentItem.day} Orders Peak:</span>
            <span className="text-amber-800 ml-1 font-medium">{currentItem.orders || 0} orders</span>
          </div>
          <span className="font-black text-amber-900 font-serif">
            ₹{Number(currentItem.value || 0).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* Bar Chart Area */}
      <div ref={chartContainerRef} className="h-40 flex items-end justify-between gap-1.5 pt-4 px-1">
        {activityData.map((item) => {
          const isCurrentActive = activeDay === item.day;

          return (
            <div
              key={item.day}
              onMouseEnter={() => setActiveDay(item.day)}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
            >
              {/* Badge above active bar */}
              <div className="h-5 flex items-center justify-center mb-1">
                {isCurrentActive ? (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs whitespace-nowrap">
                    ₹{item.value > 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.orders}
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="w-full flex justify-center h-[95px] items-end">
                <div
                  className={`gsap-bar w-5 sm:w-6 rounded-t-xl transition-all duration-300 origin-bottom ${
                    isCurrentActive
                      ? 'bg-amber-500 shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                  style={{ height: item.height || '25%' }}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[10px] font-black mt-2 transition-colors ${
                  isCurrentActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
