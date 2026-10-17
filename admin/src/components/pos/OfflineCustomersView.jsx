import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  UtensilsCrossed,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Award,
  Eye,
  X,
  Printer,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { subscribeOfflineCustomers } from '../../services/tableService';

export const OfflineCustomersView = ({ dineInOrders = [], onViewOrderKOT }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend'); // 'spend' | 'visits' | 'recent'
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const unsub = subscribeOfflineCustomers(setCustomers);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.lastTableNumber || '').toLowerCase().includes(q)
    );
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'spend') return (b.totalSpent || 0) - (a.totalSpent || 0);
    if (sortBy === 'visits') return (b.totalVisits || 0) - (a.totalVisits || 0);
    if (sortBy === 'recent') {
      const timeA = a.lastVisitAt?.seconds || 0;
      const timeB = b.lastVisitAt?.seconds || 0;
      return timeB - timeA;
    }
    return 0;
  });

  const totalDiners = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalVisits = customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0);

  // Orders placed by selected customer
  const customerOrders = selectedCustomer
    ? dineInOrders.filter((o) => {
        const orderPhone = (o.customerPhone || '').replace(/\D/g, '');
        const targetPhone = (selectedCustomer.phone || '').replace(/\D/g, '');
        return orderPhone && targetPhone && (orderPhone === targetPhone || orderPhone.endsWith(targetPhone) || targetPhone.endsWith(orderPhone));
      })
    : [];

  const getCustomerTier = (cust) => {
    const spend = cust.totalSpent || 0;
    const visits = cust.totalVisits || 1;
    if (spend >= 2500 || visits >= 6) {
      return { label: 'Gold Diner', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (spend >= 1000 || visits >= 3) {
      return { label: 'Silver Diner', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
    return { label: 'Regular Guest', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Offline Guests
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {totalDiners}
            </span>
            <span className="text-[11px] text-slate-400">Unique mobile numbers saved</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Offline Visits
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
              {totalVisits}
            </span>
            <span className="text-[11px] text-slate-400">Total tables occupied & served</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Offline Revenue
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
              ₹{totalRevenue.toFixed(0)}
            </span>
            <span className="text-[11px] text-slate-400">Lifetime table billings</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
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
            placeholder="Search offline guest by name, mobile number, or table..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none"
          >
            <option value="spend">Highest Spend (₹)</option>
            <option value="visits">Most Visits</option>
            <option value="recent">Most Recent Visit</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {sortedCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-600">No offline guests found</p>
            <p className="text-xs text-slate-400">
              When customers enter their Name & Mobile at tables, their profiles and order history are securely saved here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Guest Info</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Tier Status</th>
                  <th className="py-3 px-4 text-center">Visits</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Last Table</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCustomers.map((cust) => {
                  const tier = getCustomerTier(cust);
                  return (
                    <tr
                      key={cust.id || cust.phone}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-amber-50/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                            {(cust.name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{cust.name || 'Guest'}</p>
                            <span className="text-[10px] text-slate-400">Verified Table Guest</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>+91 {cust.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${tier.color}`}>
                          {tier.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                          {cust.totalVisits || 1} visit{cust.totalVisits === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-amber-700 text-sm">
                        ₹{cust.totalSpent || cust.lastOrderAmount || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-black text-xs font-serif">
                          Table #{cust.lastTableNumber || '1'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {cust.lastVisitAt?.seconds
                          ? new Date(cust.lastVisitAt.seconds * 1000).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>View History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OFFLINE GUEST DETAILS & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 font-black text-lg flex items-center justify-center shadow-md">
                  {(selectedCustomer.name || 'G')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white font-serif">
                      {selectedCustomer.name || 'Guest'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getCustomerTier(selectedCustomer).color}`}>
                      {getCustomerTier(selectedCustomer).label}
                    </span>
                  </div>
                  <p className="text-xs text-amber-400/90 font-mono mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    +91 {selectedCustomer.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-5 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Visits</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {selectedCustomer.totalVisits || 1}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Spent</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  ₹{selectedCustomer.totalSpent || selectedCustomer.lastOrderAmount || 0}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Table</span>
                <span className="text-lg font-black text-amber-600 font-serif">
                  #{selectedCustomer.lastTableNumber || '1'}
                </span>
              </div>
            </div>

            {/* Order History List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Dine-In Table Orders ({customerOrders.length})
                </h4>
                <span className="text-[11px] text-slate-400">Stored in dedicated offline collection</span>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-1">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="font-bold text-xs text-slate-600">No active/archived orders loaded in memory</p>
                  <p className="text-[11px]">The customer profile is recorded with summary totals.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 bg-white transition space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-black rounded-lg text-xs font-serif">
                            Table #{ord.tableNumber || '1'}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-500">
                            #{ord.orderId || ord.id?.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {ord.paymentStatus === 'paid' ? '✓ Paid' : '⚠️ Unpaid'}
                          </span>
                          {onViewOrderKOT && (
                            <button
                              onClick={() => {
                                onViewOrderKOT(ord);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>KOT Slip</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        {(ord.items || []).map((i, iIdx) => {
                          const addons = (i.selectedAddOns || i.addons || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
                          return (
                            <div key={iIdx} className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">{i.quantity}x {i.name}</span>
                              {addons.length > 0 && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                                  +{addons.join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>
                          {ord.createdAt?.seconds
                            ? new Date(ord.createdAt.seconds * 1000).toLocaleString([], {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recent'}
                        </span>
                        <span className="font-mono font-black text-amber-700 text-sm">
                          ₹{ord.grandTotal || ord.totalAmount || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default OfflineCustomersView;
