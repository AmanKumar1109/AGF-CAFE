import React, { useState, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useBarChartGrow } from '../../hooks/useGSAPAnimation';

export const MostDayActive = ({ activityData }) => {
  const [activeDay, setActiveDay] = useState('Tue');
  const chartContainerRef = useRef(null);

  useBarChartGrow(chartContainerRef);

  return (
    <div className="gsap-card bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] transition-all duration-200 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Most Day Active
        </h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bar Chart Area */}
      <div ref={chartContainerRef} className="h-44 flex items-end justify-between gap-2 pt-6 px-1">
        {activityData.map((item) => {
          const isCurrentActive = activeDay === item.day;

          return (
            <div
              key={item.day}
              onMouseEnter={() => setActiveDay(item.day)}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
            >
              {/* Badge above active bar */}
              <div className="h-6 flex items-center justify-center mb-1.5">
                {isCurrentActive ? (
                  <span className="text-[11.5px] font-bold text-slate-900 tracking-tight transition-all">
                    {item.badge || item.value.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="w-full flex justify-center h-[110px] items-end">
                <div
                  className={`gsap-bar w-5 sm:w-6.5 rounded-full transition-all duration-300 origin-bottom ${
                    isCurrentActive
                      ? 'bg-[#2563eb] shadow-md shadow-blue-500/25'
                      : 'bg-[#edf2f7] hover:bg-slate-200'
                  }`}
                  style={{ height: item.height }}
                />
              </div>

              {/* Day Label */}
              <span
                className={`text-[11px] mt-2.5 transition-colors font-medium ${
                  isCurrentActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-400 group-hover:text-slate-600'
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
