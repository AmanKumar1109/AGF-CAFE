import React from 'react';
import { useDineIn } from '../../context/DineInContext';
import { UtensilsCrossed, Sparkles, ChefHat, Edit2, LogOut, Clock, ArrowRight } from 'lucide-react';

export const DineInStickyBanner = () => {
  const {
    isDineIn,
    tableNumber,
    customerInfo,
    activeOrder,
    setIsTableEntryModalOpen,
    setIsOrderTrackerOpen,
    exitDineIn,
  } = useDineIn();

  if (!isDineIn) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 border-b border-amber-500/30 shadow-lg px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Table details */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Table #{tableNumber || '1'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                ₹0 Delivery Fee
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
                5% GST
              </span>
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span>Guest: {customerInfo.name || 'Dine-In Customer'}</span>
              {customerInfo.phone && <span>({customerInfo.phone})</span>}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Active Order / Live KOT Button */}
          {activeOrder ? (
            <button
              onClick={() => setIsOrderTrackerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-black hover:bg-amber-300 transition-all shadow-sm animate-pulse cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>
                {activeOrder.status === 'Cooking'
                  ? 'Cooking 🍳'
                  : activeOrder.status === 'Served'
                  ? 'Served 🍽️'
                  : 'Order Placed 🔔'}
              </span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : null}

          {/* Edit Table or Details */}
          <button
            onClick={() => setIsTableEntryModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-xs font-medium border border-stone-700 transition-all cursor-pointer"
            title="Change Table or Details"
          >
            <Edit2 className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Change Table</span>
          </button>

          {/* Exit Dine-In mode */}
          <button
            onClick={() => {
              if (window.confirm('Switch back to normal home delivery?')) {
                exitDineIn();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800/80 text-stone-400 hover:text-red-300 hover:bg-red-950/40 text-xs font-medium border border-stone-700/60 transition-all cursor-pointer"
            title="Exit Dine-In"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default DineInStickyBanner;
