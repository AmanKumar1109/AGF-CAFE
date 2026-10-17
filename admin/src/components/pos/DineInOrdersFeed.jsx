import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Volume2,
  VolumeX,
  CreditCard,
  Banknote,
  Search
} from 'lucide-react';
import { updateDineInOrderStatus, settleTableBill } from '../../services/tableService';

// Audio chime using Web Audio API (zero external asset dependency)
function playCafeChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // AudioContext blocked or not allowed
  }
}

export const DineInOrdersFeed = ({ dineInOrders = [], onViewOrderKOT }) => {
  const [filter, setFilter] = useState('active'); // 'active' | 'cooking' | 'served' | 'completed' | 'all'
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersCountRef = useRef(dineInOrders.length);

  // Play chime when new dine-in order arrives
  useEffect(() => {
    if (dineInOrders.length > prevOrdersCountRef.current && soundEnabled) {
      playCafeChime();
    }
    prevOrdersCountRef.current = dineInOrders.length;
  }, [dineInOrders.length, soundEnabled]);

  const filteredOrders = dineInOrders.filter((o) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTable = String(o.tableNumber || '').toLowerCase().includes(q);
      const matchName = String(o.customerName || '').toLowerCase().includes(q);
      const matchId = String(o.orderId || o.id || '').toLowerCase().includes(q);
      if (!matchTable && !matchName && !matchId) return false;
    }

    if (filter === 'active') {
      return o.status === 'Order Received' || o.status === 'Cooking' || o.status === 'Served';
    }
    if (filter === 'cooking') return o.status === 'Cooking';
    if (filter === 'served') return o.status === 'Served';
    if (filter === 'completed') return o.status === 'Completed';
    return true;
  });

  const handleUpdateStatus = async (orderId, newStatus) => {
    await updateDineInOrderStatus(orderId, newStatus);
  };

  const handleSettleAndCollectCash = async (order) => {
    if (window.confirm(`Collect ₹${order.grandTotal || order.totalAmount} for Table #${order.tableNumber} and mark paid?`)) {
      await settleTableBill(order.tableNumber ? `table-${order.tableNumber}` : null, order.id, 'counter_cash');
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'active'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Live Kitchen Queue (
            {dineInOrders.filter((o) => ['Order Received', 'Cooking', 'Served'].includes(o.status)).length}
            )
          </button>
          <button
            onClick={() => setFilter('cooking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'cooking'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cooking ({dineInOrders.filter((o) => o.status === 'Cooking').length})
          </button>
          <button
            onClick={() => setFilter('served')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'served'
                ? 'bg-blue-600 text-white font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Served ({dineInOrders.filter((o) => o.status === 'Served').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed ({dineInOrders.filter((o) => o.status === 'Completed').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white font-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All History
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Table #, Guest, Order..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-amber-400 w-52"
            />
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Order Sound Alert: ON' : 'Order Sound Alert: MUTED'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
          <ChefHat className="w-12 h-12 text-slate-200 mx-auto" />
          <p className="font-bold text-slate-600">No Dine-In orders in this filter</p>
          <p className="text-xs text-slate-400">
            When guests scan table QR codes or cashier punches orders, they appear here live.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isUnpaid =
              order.paymentMethod === 'counter_cash' && order.paymentStatus !== 'paid';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  order.status === 'Order Received'
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : order.status === 'Cooking'
                    ? 'border-amber-300'
                    : order.status === 'Served'
                    ? 'border-blue-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: Table & Customer */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black px-3 py-1 rounded-xl bg-amber-400 text-stone-950 font-serif shadow-xs">
                        TABLE #{order.tableNumber || '1'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{order.orderId || order.id?.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          order.status === 'Order Received'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                            : order.status === 'Cooking'
                            ? 'bg-amber-400 text-slate-950'
                            : order.status === 'Served'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {order.status}
                      </span>

                      {order.roundNumber > 1 ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-700 text-white shadow-xs flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          Round #{order.roundNumber} (Add-on Order)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          Round #1
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 pt-1 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{order.customerName || 'Guest'}</span>
                      {order.customerPhone && (
                        <span className="text-slate-400">({order.customerPhone})</span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.createdAt?.seconds
                          ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Payment badge & Total */}
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      ₹{order.grandTotal || order.totalAmount || 0}
                    </span>
                    <div className="text-[11px] mt-0.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          isUnpaid
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isUnpaid ? '⚠️ Unpaid (Cash at Counter)' : '✓ Paid (Online UPI)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(order.items || []).map((item, idx) => {
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
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-amber-600 shrink-0">{item.quantity}x</span>
                              <span className="font-bold text-slate-900">{item.name}</span>
                            </div>

                            {/* Add-ons & Customizations List */}
                            {addons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {addons.map((ad, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                  >
                                    <span>+ {ad.name}</span>
                                    {ad.price > 0 && <span className="text-amber-700">(+₹{ad.price})</span>}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.specialInstructions && (
                              <p className="text-[10px] text-amber-800 font-medium italic mt-1 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200">
                                Note: "{item.specialInstructions}"
                              </p>
                            )}
                          </div>

                          <span className="font-mono font-bold text-slate-700 text-xs shrink-0 pt-0.5">
                            ₹{(item.price || item.basePrice || 0) * (item.quantity || 1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onViewOrderKOT(order)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Kitchen KOT</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {order.status === 'Order Received' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Cooking')}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Accept & Start Cooking 🍳
                      </button>
                    )}

                    {order.status === 'Cooking' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Served')}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Mark Food Served 🍽️
                      </button>
                    )}

                    {isUnpaid ? (
                      <button
                        onClick={() => handleSettleAndCollectCash(order)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Collect Cash & Settle (₹{order.grandTotal || order.totalAmount})</span>
                      </button>
                    ) : order.status === 'Served' ? (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Completed')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Mark Completed ✓
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default DineInOrdersFeed;
