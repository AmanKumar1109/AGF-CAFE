import React from 'react';
import { useDineIn } from '../../context/DineInContext';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Flame,
  Check,
  LogOut,
} from 'lucide-react';

export const DineInOrderTrackerModal = () => {
  const navigate = useNavigate();
  const {
    isOrderTrackerOpen,
    setIsOrderTrackerOpen,
    activeOrder,
    activeOrders = [],
    tableNumber,
    customerInfo,
    exitDineIn,
  } = useDineIn();

  if (!isOrderTrackerOpen) return null;

  const ordersList = activeOrders.length > 0 ? activeOrders : (activeOrder ? [activeOrder] : []);
  if (ordersList.length === 0) return null;

  const latestOrder = ordersList[ordersList.length - 1];
  const combinedRunningTotal = ordersList.reduce(
    (sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0),
    0
  );
  const isAllPaid = ordersList.every((o) => o.paymentStatus === 'paid');

  const getSteps = (orderStatus) => [
    {
      title: 'Order Received',
      desc: 'Sent to Kitchen Display',
      active: true,
      completed: ['Cooking', 'Served', 'Completed'].includes(orderStatus),
      current: orderStatus === 'Order Received' || orderStatus === 'Pending',
    },
    {
      title: 'Cooking in Progress',
      desc: 'Chef is preparing your fresh meal',
      active: ['Cooking', 'Served', 'Completed'].includes(orderStatus),
      completed: ['Served', 'Completed'].includes(orderStatus),
      current: orderStatus === 'Cooking',
    },
    {
      title: 'Served to Table',
      desc: `Delivered hot to Table #${tableNumber}`,
      active: ['Served', 'Completed'].includes(orderStatus),
      completed: orderStatus === 'Completed',
      current: orderStatus === 'Served',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[92vh]">
        
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
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  {ordersList.length > 1 ? `${ordersList.length} Orders Active` : 'Active Order'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Live Kitchen & Table Tracking</h3>
            </div>
          </div>
          <button
            onClick={() => setIsOrderTrackerOpen(false)}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Multi-Round Orders List */}
          <div className="space-y-4">
            {ordersList.map((ord, oIdx) => {
              const roundNum = ord.roundNumber || oIdx + 1;
              const ordStatus = ord.status || 'Order Received';
              const steps = getSteps(ordStatus);

              return (
                <div
                  key={ord.id}
                  className="bg-stone-850/90 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  {/* Round Header */}
                  <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-stone-950 font-black text-xs font-serif">
                        {roundNum === 1 ? '1st Order' : `Extra Order #${roundNum - 1}`}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-stone-400">
                        #{ord.orderId || ord.id?.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        ordStatus === 'Cooking'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 animate-pulse'
                          : ordStatus === 'Served'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {ordStatus === 'Order Received' ? '🔔 In Queue' : ordStatus === 'Cooking' ? '🍳 Cooking' : '🍽️ Served'}
                    </span>
                  </div>

                  {/* Micro Stepper */}
                  <div className="flex items-center justify-between text-[11px] py-1 px-1">
                    {steps.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            st.completed
                              ? 'bg-emerald-500 text-white'
                              : st.current
                              ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-400/30'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {st.completed ? <Check className="w-3 h-3 stroke-[3]" /> : sIdx + 1}
                        </div>
                        <span className={`text-[10px] font-bold ${st.active ? 'text-stone-200' : 'text-stone-500'}`}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Items in this round */}
                  <div className="divide-y divide-stone-800/60 pt-1">
                    {(ord.items || []).map((item, idx) => {
                      const addons = [];
                      if (item.selectedCrust && typeof item.selectedCrust === 'string' && item.selectedCrust.toLowerCase() !== 'standard') {
                        addons.push({ name: item.selectedCrust, type: 'Crust/Size' });
                      } else if (item.selectedCrust?.name && item.selectedCrust.name.toLowerCase() !== 'standard') {
                        addons.push({ name: item.selectedCrust.name, price: item.selectedCrust.price, type: 'Crust/Size' });
                      }
                      const rawAddons = item.selectedAddOns || item.selectedAddons || item.addons || item.addOns || [];
                      if (Array.isArray(rawAddons)) {
                        rawAddons.forEach((a) => {
                          if (typeof a === 'string' && a.trim()) addons.push({ name: a.trim() });
                          else if (a && typeof a === 'object') {
                            const name = a.name || a.title || a.label || '';
                            if (name) addons.push({ name, price: a.price, type: a.type });
                          }
                        });
                      }

                      return (
                        <div key={idx} className="py-2 flex items-start justify-between text-xs gap-3">
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
                              <p className="text-[10px] text-stone-400 italic mt-0.5 pl-5">
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

                  {/* Order Subtotal */}
                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold text-stone-300">
                    <span className="text-stone-400">{roundNum === 1 ? '1st Order' : 'Extra Order'} Total:</span>
                    <span className="font-mono font-bold text-stone-200">
                      ₹{ord.grandTotal || ord.totalAmount || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Running Bill Summary */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                Total Table Bill ({ordersList.length} Order{ordersList.length === 1 ? '' : 's'})
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">
                ₹{combinedRunningTotal.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-xl block ${
                  isAllPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isAllPaid ? '✓ Paid Online (UPI)' : '⚠️ Pay at Counter'}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                {isAllPaid ? 'Settled via online UPI' : 'Pay after meal at cashier'}
              </span>
            </div>
          </div>

          {/* Action: Add Next Round */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsOrderTrackerOpen(false);
                navigate('/menu');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Order Extra Dishes / Drinks (Re-Order)</span>
            </button>
          </div>

          {/* Leave Table / Switch to Home Delivery Action */}
          <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
            <div className="text-left w-full sm:w-auto">
              <p className="text-xs font-bold text-stone-200">Done eating or leaving cafe?</p>
              <p className="text-[10px] text-stone-400">Exit Table #{tableNumber} session & switch back to Home Delivery</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Leave Table #${tableNumber} and switch back to normal online delivery?`)) {
                  exitDineIn();
                  navigate('/');
                }
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-800 hover:bg-red-950/70 text-stone-300 hover:text-red-300 border border-stone-700 hover:border-red-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Leave Table & Exit Dine-In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DineInOrderTrackerModal;
