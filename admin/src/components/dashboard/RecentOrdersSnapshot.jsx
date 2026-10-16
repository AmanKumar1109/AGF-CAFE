import React from 'react';
import { ShoppingBag, ArrowUpRight, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export const RecentOrdersSnapshot = ({ orders = [], onNavigateTab }) => {
  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('delivery') || s.includes('out')) {
      return 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
    }
    if (s.includes('preparing') || s.includes('packing')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('cancel')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const formatTime = (val) => {
    if (!val) return 'Recently';
    let d;
    if (typeof val.toDate === 'function') d = val.toDate();
    else if (val.seconds) d = new Date(val.seconds * 1000);
    else if (typeof val === 'string') d = new Date(val);
    else if (val instanceof Date) d = val;

    if (!d || isNaN(d.getTime())) return 'Recently';

    const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight font-serif">
              Live Orders Pipeline
            </h3>
            <p className="text-xs text-slate-400 font-medium">Recent incoming cafe orders & status</p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            Open Live Kitchen Orders ({orders.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              <th className="pb-3 pl-2">Order ID</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Items Summary</th>
              <th className="pb-3 text-right">Amount (₹)</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                  No incoming orders yet. Incoming customer orders will appear here automatically with audio alert!
                </td>
              </tr>
            ) : (
              orders.map((ord) => {
                const itemsCount = ord.items?.length || 0;
                const itemsPreview = (ord.items || [])
                  .slice(0, 2)
                  .map(i => `${i.qty || 1}x ${i.name}`)
                  .join(', ');

                return (
                  <tr key={ord.id} className="hover:bg-amber-50/30 transition-colors group">
                    {/* Order ID & Time */}
                    <td className="py-3.5 pl-2 font-mono font-bold text-amber-800 text-[11px]">
                      <div>#{ord.orderId || ord.id.slice(0, 8)}</div>
                      <span className="text-[10px] text-slate-400 font-sans font-normal">
                        {formatTime(ord.createdAt || ord.updatedAt)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5">
                      <p className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {ord.customerName || 'Customer'}
                      </p>
                      <p className="text-[10px] text-slate-400">{ord.customerPhone || 'N/A'}</p>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 max-w-[200px] truncate">
                      <p className="font-semibold text-slate-800 truncate">
                        {itemsPreview || 'Cafe Order'}
                        {itemsCount > 2 && ` +${itemsCount - 2} more`}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {ord.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Prepaid'}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 text-right font-black text-slate-900 text-sm font-serif">
                      ₹{Number(ord.totalAmount || ord.grandTotal || 0).toFixed(2)}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(ord.status)}`}>
                        {ord.status || 'Order Received'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => onNavigateTab && onNavigateTab('orders')}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
