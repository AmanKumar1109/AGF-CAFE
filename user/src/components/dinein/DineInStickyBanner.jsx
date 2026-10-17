import React from 'react';
import { useDineIn } from '../../context/DineInContext';
import { useCart } from '../../context/useCart';
import { UtensilsCrossed, Sparkles, ChefHat, Edit2, LogOut, Clock, ArrowRight, Home } from 'lucide-react';

export const DineInStickyBanner = () => {
  const {
    isDineIn,
    tableNumber,
    customerInfo,
    activeOrder,
    activeOrders = [],
    setIsTableEntryModalOpen,
    setIsOrderTrackerOpen,
    exitDineIn,
  } = useDineIn();

  const { showToast } = useCart();

  if (!isDineIn) return null;

  const handleExitTable = () => {
    if (window.confirm(`Leave Table #${tableNumber || '1'} and switch back to Online Home Delivery?`)) {
      exitDineIn();
      if (showToast) {
        showToast('🏠 Switched back to Online Home Delivery!');
      }
    }
  };

  const roundsCount = activeOrders.length;

  return (
    <div className="pt-[58px] sm:pt-[66px] w-full">
      <div className="sticky top-[58px] sm:top-[66px] z-40 w-full bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 border-b border-amber-500/30 shadow-xl px-4 py-2 sm:py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Table details */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-serif">
                  Table #{tableNumber || '1'}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full">
                  ₹0 Delivery Fee
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
                  5% Dine-In GST
                </span>
                {roundsCount > 1 && (
                  <span className="text-[10px] bg-purple-600/40 text-purple-200 border border-purple-500/40 font-bold px-2 py-0.5 rounded-full">
                    {roundsCount} Orders Active
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-none">
                <span className="truncate">Guest: {customerInfo.name || 'Dine-In Customer'}</span>
                {customerInfo.phone && <span className="hidden sm:inline">({customerInfo.phone})</span>}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Order / Live KOT Button */}
            {activeOrder ? (
              <button
                onClick={() => setIsOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-black hover:bg-amber-300 transition-all shadow-sm animate-pulse cursor-pointer"
                title="View Live Kitchen Tracker"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>
                  {activeOrder.status === 'Cooking'
                    ? 'Cooking 🍳'
                    : activeOrder.status === 'Served'
                    ? 'Served 🍽️'
                    : 'Kitchen Queue 🔔'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : null}

            {/* Change Table */}
            <button
              onClick={() => setIsTableEntryModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-xs font-medium border border-stone-700 transition-all cursor-pointer"
              title="Change Table or Details"
            >
              <Edit2 className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">Change Table</span>
            </button>

            {/* Prominent Leave Table / Switch to Online Delivery */}
            <button
              onClick={handleExitTable}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white border border-red-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Leave Table and switch back to normal online delivery"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] sm:text-xs">Leave Table (Go Online)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DineInStickyBanner;
