import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Calendar,
  Clock,
  Printer,
  ChefHat,
  Banknote,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export const OfflineOrdersHistoryView = ({ dineInOrders = [], onViewOrderKOT }) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | 'yesterday' | 'week' | 'all'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'

  const filteredOrders = dineInOrders.filter((order) => {
    // Status filter
    if (statusFilter !== 'all' && order.status?.toLowerCase() !== statusFilter) return false;

    // Date filter
    if (dateFilter !== 'all' && order.createdAt?.seconds) {
      const orderDate = new Date(order.createdAt.seconds * 1000);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const orderDay = new Date(orderDate);
      orderDay.setHours(0, 0, 0, 0);

      const diffDays = Math.round((now - orderDay) / (1000 * 60 * 60 * 24));

      if (dateFilter === 'today' && diffDays !== 0) return false;
      if (dateFilter === 'yesterday' && diffDays !== 1) return false;
      if (dateFilter === 'week' && diffDays > 7) return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTable = String(order.tableNumber || '').toLowerCase().includes(q);
      const matchName = String(order.customerName || '').toLowerCase().includes(q);
      const matchPhone = String(order.customerPhone || '').toLowerCase().includes(q);
      const matchId = String(order.orderId || order.id || '').toLowerCase().includes(q);
      if (!matchTable && !matchName && !matchPhone && !matchId) return false;
    }

    return true;
  });

  const totalOrdersCount = filteredOrders.length;
  const totalRevenue = filteredOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Offline Orders Count
          </span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {totalOrdersCount}
          </span>
          <span className="text-[11px] text-slate-400">Total table & counter POS orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Offline Revenue
          </span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
            ₹{totalRevenue.toFixed(0)}
          </span>
          <span className="text-[11px] text-slate-400">Excludes cancelled orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Average Table Bill
          </span>
          <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
            ₹{totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(0) : 0}
          </span>
          <span className="text-[11px] text-slate-400">Per table check size</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Table #, Guest Name, Mobile, or Order ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date pills */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'yesterday' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 rounded-lg transition ${
                dateFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-600">No offline orders found in this period</p>
            <p className="text-xs text-slate-400">
              Completed and past table orders are archived here, completely separated from online delivery orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Table</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Bill Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-xs font-serif mr-2">
                          Table #{order.tableNumber || '1'}
                        </span>
                        <span className="font-mono text-slate-500 font-bold">
                          #{order.orderId || order.id?.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Source: {order.source === 'counter_pos' ? 'Counter Walk-in' : 'Table QR Scan'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{order.customerName || 'Guest'}</p>
                      {order.customerPhone && (
                        <p className="text-[11px] text-slate-400 font-mono">+91 {order.customerPhone}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="space-y-1">
                        {(order.items || []).map((i, iIdx) => {
                          const addons = (i.selectedAddOns || i.addons || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
                          return (
                            <div key={iIdx} className="text-slate-800 font-medium">
                              <span>{i.quantity}x {i.name}</span>
                              {addons.length > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                                  +{addons.join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {(order.items || []).length} item{(order.items || []).length === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-amber-700 text-sm">
                      ₹{order.grandTotal || order.totalAmount || 0}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {order.paymentStatus === 'paid'
                          ? '✓ Paid'
                          : '⚠️ Unpaid'}
                        {order.paymentMethod === 'counter_cash' ? ' (Cash)' : ' (Online)'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          order.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Cooking'
                            ? 'bg-amber-100 text-amber-900'
                            : order.status === 'Served'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status || 'Received'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {order.createdAt?.seconds
                        ? new Date(order.createdAt.seconds * 1000).toLocaleString([], {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewOrderKOT(order)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        title="Print KOT Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>KOT</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OfflineOrdersHistoryView;
