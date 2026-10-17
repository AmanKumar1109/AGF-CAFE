import React from 'react';
import { useDineIn } from '../../context/DineInContext';
import {
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
  Clock,
  X,
  PlusCircle,
  Receipt,
  Sparkles,
  PhoneCall,
  AlertCircle
} from 'lucide-react';

export const DineInOrderTrackerModal = () => {
  const {
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    activeOrder,
    tableNumber,
    customerInfo,
  } = useDineIn();

  if (!isOrderTrackerOpen || !activeOrder) return null;

  const status = activeOrder.status || 'Order Received';

  const steps = [
    {
      title: 'Order Received',
      desc: 'Sent to Kitchen Display',
      active: true,
      completed: ['Cooking', 'Served', 'Completed'].includes(status),
      current: status === 'Order Received' || status === 'Pending',
    },
    {
      title: 'Cooking in Progress',
      desc: 'Chef is preparing your fresh meal',
      active: ['Cooking', 'Served', 'Completed'].includes(status),
      completed: ['Served', 'Completed'].includes(status),
      current: status === 'Cooking',
    },
    {
      title: 'Served to Table',
      desc: `Delivered hot to Table #${tableNumber}`,
      active: ['Served', 'Completed'].includes(status),
      completed: status === 'Completed',
      current: status === 'Served',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-b from-amber-500/20 to-transparent border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Table #{tableNumber}
                </span>
                <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full border border-stone-700">
                  #{activeOrder.id?.slice(-6).toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Live Kitchen Tracking</h3>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Tracker */}
          <div className="bg-stone-850 border border-stone-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Current Status
              </span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                status === 'Cooking'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse'
                  : status === 'Served'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {status}
              </span>
            </div>

            {/* Stepper */}
            <div className="space-y-3 pt-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step.completed
                          ? 'bg-emerald-500 text-white'
                          : step.current
                          ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/20'
                          : 'bg-stone-800 text-stone-500 border border-stone-700'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-6 my-1 ${
                          step.completed ? 'bg-emerald-500' : 'bg-stone-800'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-xs font-bold ${step.active ? 'text-white' : 'text-stone-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-stone-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="bg-stone-850 border border-stone-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
              Ordered Items
            </span>
            <div className="divide-y divide-stone-800">
              {(activeOrder.items || []).map((item, idx) => {
                const addons = [];
                if (item.selectedCrust && typeof item.selectedCrust === 'string' && item.selectedCrust.toLowerCase() !== 'standard') {
                  addons.push({ name: item.selectedCrust, type: 'Crust/Size' });
                } else if (item.selectedCrust?.name && item.selectedCrust.name.toLowerCase() !== 'standard') {
                  addons.push({ name: item.selectedCrust.name, price: item.selectedCrust.price, type: 'Crust/Size' });
                }
                const rawAddons = item.selectedAddOns || item.selectedAddons || item.addons || item.addOns || [];
                if (Array.isArray(rawAddons)) {
                  rawAddons.forEach(a => {
                    if (typeof a === 'string' && a.trim()) addons.push({ name: a.trim() });
                    else if (a && typeof a === 'object') {
                      const name = a.name || a.title || a.label || '';
                      if (name) addons.push({ name, price: a.price, type: a.type });
                    }
                  });
                }

                return (
                  <div key={idx} className="py-2.5 flex items-start justify-between text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400 shrink-0">{item.quantity}x</span>
                        <span className="text-stone-100 font-semibold">{item.name}</span>
                      </div>

                      {addons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-5">
                          {addons.map((ad, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md"
                            >
                              + {ad.name} {ad.price > 0 && `(+₹${ad.price})`}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <p className="text-[10px] text-stone-400 italic mt-1 pl-5">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>

                    <span className="font-mono font-bold text-stone-300 shrink-0 pt-0.5">
                      ₹{(item.price || item.basePrice || 0) * (item.quantity || 1)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-sm">
              <span className="font-bold text-stone-200">Grand Total</span>
              <span className="font-black text-amber-400 font-mono text-base">
                ₹{activeOrder.grandTotal || activeOrder.totalAmount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
              <span>Payment:</span>
              <span className={`font-bold ${
                activeOrder.paymentMethod === 'counter_cash' && activeOrder.paymentStatus !== 'paid'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {activeOrder.paymentMethod === 'counter_cash'
                  ? 'Cash / UPI at Counter (After Eating)'
                  : 'Paid Online (UPI)'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setIsOrderTrackerOpen(false)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Order More Items / Drinks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DineInOrderTrackerModal;
