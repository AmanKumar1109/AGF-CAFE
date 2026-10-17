import React, { useState } from 'react';
import {
  UtensilsCrossed,
  User,
  Clock,
  CheckCircle2,
  Receipt,
  PlusCircle,
  Sparkles,
  ChefHat,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { clearTable, settleTableBill, updateDineInOrderStatus } from '../../services/tableService';

export const TableFloorGrid = ({
  tables = [],
  dineInOrders = [],
  onOpenWalkInPos,
  onViewOrderKOT,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'available' | 'occupied'

  // Map active order to each table
  const tableOrderMap = {};
  dineInOrders.forEach((order) => {
    if (order.tableNumber && order.status !== 'Completed' && order.status !== 'Cancelled') {
      const key = String(order.tableNumber).trim();
      tableOrderMap[key] = order;
      tableOrderMap[`table-${key}`] = order;
    }
  });

  const filteredTables = tables.filter((t) => {
    const activeOrder = tableOrderMap[t.tableNumber] || tableOrderMap[t.id];
    const isOccupied = t.status === 'occupied' || Boolean(activeOrder);
    if (filter === 'available') return !isOccupied;
    if (filter === 'occupied') return isOccupied;
    return true;
  });

  const handleSettle = async (table, activeOrder) => {
    if (
      window.confirm(
        `Settle bill of ₹${activeOrder?.grandTotal || activeOrder?.totalAmount || 0} for Table #${table.tableNumber}? This will mark the order completed and free the table.`
      )
    ) {
      await settleTableBill(table.id, activeOrder?.id, 'counter_cash');
    }
  };

  const handleClear = async (table) => {
    if (window.confirm(`Mark Table #${table.tableNumber} as Clean & Vacant?`)) {
      await clearTable(table.id);
    }
  };

  const handleMarkServed = async (activeOrder) => {
    if (activeOrder?.id) {
      await updateDineInOrderStatus(activeOrder.id, 'Served');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter Pills & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tables ({tables.length})
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'occupied'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Occupied ({tables.filter((t) => t.status === 'occupied' || tableOrderMap[t.tableNumber]).length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Vacant ({tables.filter((t) => t.status !== 'occupied' && !tableOrderMap[t.tableNumber]).length})
          </button>
        </div>

        <button
          onClick={() => onOpenWalkInPos()}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.4]" />
          <span>Punch Walk-in Table Order</span>
        </button>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = tableOrderMap[table.tableNumber] || tableOrderMap[table.id];
          const isOccupied = table.status === 'occupied' || Boolean(activeOrder);
          const guestName = activeOrder?.customerName || table.currentGuestName || 'Guest';
          const guestPhone = activeOrder?.customerPhone || table.currentGuestPhone;
          const orderStatus = activeOrder?.status || (isOccupied ? 'Seated' : 'Available');

          return (
            <div
              key={table.id}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-sm ${
                isOccupied
                  ? orderStatus === 'Cooking'
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
                    : orderStatus === 'Served'
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 font-serif">
                      Table #{table.tableNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {table.capacity || 4} seats
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{table.area || 'Main Hall'}</p>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                    !isOccupied
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : orderStatus === 'Cooking'
                      ? 'bg-amber-400 text-slate-950 border border-amber-500 animate-pulse'
                      : orderStatus === 'Served'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !isOccupied
                        ? 'bg-emerald-500'
                        : orderStatus === 'Cooking'
                        ? 'bg-amber-950'
                        : orderStatus === 'Served'
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}
                  />
                  <span>{!isOccupied ? 'Available' : orderStatus}</span>
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 space-y-3">
                {isOccupied && activeOrder ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{guestName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{activeOrder.orderId || activeOrder.id?.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {guestPhone && (
                      <p className="text-[11px] text-slate-500">Phone: {guestPhone}</p>
                    )}

                    {/* Order summary */}
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>Items ({activeOrder.items?.length || 0}):</span>
                        <span className="font-mono text-amber-700 font-black">
                          ₹{activeOrder.grandTotal || activeOrder.totalAmount || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate" title={(activeOrder.items || []).map((i) => {
                        const addons = (i.selectedAddOns || i.addons || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
                        return `${i.quantity}x ${i.name}${addons.length ? ` (+${addons.join(', ')})` : ''}`;
                      }).join(', ')}>
                        {(activeOrder.items || []).map((i) => {
                          const addons = (i.selectedAddOns || i.addons || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean);
                          return `${i.quantity}x ${i.name}${addons.length ? ` (+${addons.join(', ')})` : ''}`;
                        }).join(', ')}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Payment:</span>
                        <span
                          className={`font-bold ${
                            activeOrder.paymentMethod === 'counter_cash' &&
                            activeOrder.paymentStatus !== 'paid'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {activeOrder.paymentMethod === 'counter_cash'
                            ? 'Unpaid (Counter)'
                            : 'Paid (Online UPI)'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : isOccupied ? (
                  <div className="p-3 bg-white/60 rounded-xl text-center space-y-1 text-xs text-slate-600">
                    <p className="font-bold">Table Occupied</p>
                    <p className="text-[11px] text-slate-400">Guest: {guestName}</p>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    <UtensilsCrossed className="w-8 h-8 text-slate-200 mx-auto mb-1.5" />
                    <span>Table is clean and ready for guests</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                {isOccupied ? (
                  <>
                    {activeOrder && (
                      <button
                        onClick={() => onViewOrderKOT(activeOrder)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="View Kitchen Order Ticket (KOT)"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px]">KOT</span>
                      </button>
                    )}

                    {activeOrder?.status === 'Cooking' && (
                      <button
                        onClick={() => handleMarkServed(activeOrder)}
                        className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Mark Served 🍽️
                      </button>
                    )}

                    <button
                      onClick={() => handleSettle(table, activeOrder)}
                      className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      Settle Bill 💵
                    </button>

                    <button
                      onClick={() => handleClear(table)}
                      className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                      title="Clear Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onOpenWalkInPos(table.tableNumber)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seat & Punch Order</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TableFloorGrid;
