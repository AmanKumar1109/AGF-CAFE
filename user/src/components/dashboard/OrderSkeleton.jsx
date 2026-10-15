import React from 'react';

export const OrderSkeleton = () => {
  return (
    <div className="bg-stone-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-lg animate-pulse mb-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-800"></div>
          <div>
            <div className="w-24 h-4 bg-stone-800 rounded mb-2"></div>
            <div className="w-16 h-3 bg-stone-800/80 rounded"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="w-16 h-5 bg-stone-800 rounded mb-2 ml-auto"></div>
          <div className="w-20 h-4 bg-stone-800 rounded-full ml-auto"></div>
        </div>
      </div>

      {/* Item Image and Title */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-stone-800 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="w-3/4 h-5 bg-stone-800 rounded mb-2.5"></div>
          <div className="w-1/2 h-3 bg-stone-800/80 rounded"></div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
        <div className="flex-1 min-w-[130px] h-11 bg-stone-800 rounded-2xl"></div>
        <div className="flex-1 min-w-[130px] h-11 bg-stone-800 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default OrderSkeleton;
