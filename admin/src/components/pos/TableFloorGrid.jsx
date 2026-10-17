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
  Trash2,
  Layers,
  X,
  Printer,
  Check,
  Flame,
  CreditCard,
  Banknote
} from 'lucide-react';
import { clearTable, settleMasterTableOrders, updateDineInOrderStatus } from '../../services/tableService';

export const TableFloorGrid = ({
  tables = [],
  dineInOrders = [],
  onOpenWalkInPos,
  onViewOrderKOT,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'available' | 'occupied'
  const [selectedTableTab, setSelectedTableTab] = useState(null); // for Master Bill / Multi-Round modal
  const [isSettling, setIsSettling] = useState(false);

  // Group all active orders by tableNumber into running tabs
  const tableOrdersMap = {};
  dineInOrders.forEach((order) => {
    if (order.tableNumber && order.status !== 'Completed' && order.status !== 'Cancelled') {
      const key = String(order.tableNumber).trim();
      if (!tableOrdersMap[key]) tableOrdersMap[key] = [];
      tableOrdersMap[key].push(order);
    }
  });

  // Sort orders inside each table by roundNumber or creation time
  Object.keys(tableOrdersMap).forEach((tNum) => {
    tableOrdersMap[tNum].sort((a, b) => (a.roundNumber || 1) - (b.roundNumber || 1));
  });

  const filteredTables = tables.filter((t) => {
    const activeOrders = tableOrdersMap[t.tableNumber] || tableOrdersMap[t.id?.replace('table-', '')] || [];
    const isOccupied = t.status === 'occupied' || activeOrders.length > 0;
    if (filter === 'available') return !isOccupied;
    if (filter === 'occupied') return isOccupied;
    return true;
  });

  const handleOpenMasterTab = (table, activeOrders) => {
    setSelectedTableTab({
      table,
      orders: activeOrders,
    });
  };

  const handleSettleMaster = async (paymentMethod = 'counter_cash') => {
    if (!selectedTableTab) return;
    const { table, orders } = selectedTableTab;
    const orderIds = orders.map((o) => o.id);

    setIsSettling(true);
    try {
      await settleMasterTableOrders(table.id, orderIds, paymentMethod);
      setSelectedTableTab(null);
    } catch (err) {
      console.error('Error settling master table bill:', err);
    } finally {
      setIsSettling(false);
    }
  };

  const handleClear = async (table) => {
    if (window.confirm(`Mark Table #${table.tableNumber} as Clean & Vacant?`)) {
      await clearTable(table.id);
    }
  };

  const handleMarkServed = async (orderId) => {
    if (orderId) {
      await updateDineInOrderStatus(orderId, 'Served');
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
            Occupied ({tables.filter((t) => t.status === 'occupied' || (tableOrdersMap[t.tableNumber] && tableOrdersMap[t.tableNumber].length > 0)).length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'available'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Vacant ({tables.filter((t) => t.status !== 'occupied' && (!tableOrdersMap[t.tableNumber] || tableOrdersMap[t.tableNumber].length === 0)).length})
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
          const activeOrders = tableOrdersMap[table.tableNumber] || tableOrdersMap[table.id?.replace('table-', '')] || [];
          const isOccupied = table.status === 'occupied' || activeOrders.length > 0;
          const roundsCount = activeOrders.length;
          const latestOrder = activeOrders[activeOrders.length - 1];

          const guestName = latestOrder?.customerName || table.currentGuestName || 'Guest';
          const guestPhone = latestOrder?.customerPhone || table.currentGuestPhone;

          // Combined running total
          const combinedRunningTotal = activeOrders.reduce(
            (sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0),
            0
          );

          const hasCooking = activeOrders.some((o) => o.status === 'Cooking' || o.status === 'Order Received');
          const hasUnserved = activeOrders.some((o) => o.status !== 'Served');
          const isAllPaid = activeOrders.length > 0 && activeOrders.every((o) => o.paymentStatus === 'paid');

          const orderStatus = !isOccupied
            ? 'Available'
            : hasCooking
            ? 'Cooking'
            : hasUnserved
            ? 'In Kitchen'
            : 'Served';

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

                {/* Status Badge + Round Pill */}
                <div className="flex flex-col items-end gap-1">
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

                  {roundsCount > 1 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-rose-600" />
                      <span>{roundsCount} Orders Active</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 space-y-3">
                {isOccupied && activeOrders.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{guestName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {roundsCount > 1 ? `${roundsCount} Orders Combined` : `#${latestOrder?.orderId || latestOrder?.id?.slice(-6).toUpperCase()}`}
                      </span>
                    </div>

                    {guestPhone && (
                      <p className="text-[11px] text-slate-500">Phone: {guestPhone}</p>
                    )}

                    {/* Order summary box */}
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>
                          Running Bill {roundsCount > 1 ? `(${roundsCount} Orders)` : ''}:
                        </span>
                        <span className="font-mono text-amber-700 font-black text-sm">
                          ₹{combinedRunningTotal.toFixed(0)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 truncate" title={activeOrders.flatMap((o) => (o.items || []).map((i) => `${i.quantity}x ${i.name}`)).join(', ')}>
                        {activeOrders.flatMap((o) => (o.items || []).map((i) => `${i.quantity}x ${i.name}`)).join(', ')}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Payment:</span>
                        <span
                          className={`font-bold ${
                            !isAllPaid
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {!isAllPaid ? '⚠️ Unpaid (Counter Bill)' : '✓ Paid Online (UPI)'}
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
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-1.5">
                {isOccupied ? (
                  <>
                    {activeOrders.length > 0 && (
                      <button
                        onClick={() => onViewOrderKOT(latestOrder)}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="View Latest KOT Ticket"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px]">KOT</span>
                      </button>
                    )}

                    {latestOrder?.status === 'Cooking' && (
                      <button
                        onClick={() => handleMarkServed(latestOrder.id)}
                        className="py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Mark dish served"
                      >
                        Served 🍽️
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenMasterTab(table, activeOrders)}
                      className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{roundsCount > 1 ? `Settle (${roundsCount} Orders)` : 'Settle Bill'}</span>
                    </button>

                    <button
                      onClick={() => handleClear(table)}
                      className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                      title="Clear & Free Table"
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

      {/* ======================================================== */}
      {/* MASTER RUNNING TABLE TAB & BILL SETTLEMENT MODAL          */}
      {/* ======================================================== */}
      {selectedTableTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 font-black flex items-center justify-center shadow-md">
                  <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black font-serif text-white">
                      Table #{selectedTableTab.table.tableNumber} Master Bill
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      {selectedTableTab.orders.length} Round{selectedTableTab.orders.length === 1 ? '' : 's'} Ordered
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guest: {selectedTableTab.orders[0]?.customerName || 'Dine-In Guest'} • {selectedTableTab.orders[0]?.customerPhone ? `+91 ${selectedTableTab.orders[0]?.customerPhone}` : 'Walk-in'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTableTab(null)}
                className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Rounds breakdown */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                {selectedTableTab.orders.map((ord, oIdx) => {
                  const roundNum = ord.roundNumber || oIdx + 1;
                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-black text-xs rounded-lg">
                            {roundNum === 1 ? '1st Order' : `Extra Order #${roundNum - 1}`}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-bold">
                            #{ord.orderId || ord.id?.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'Served'
                                ? 'bg-blue-100 text-blue-900'
                                : ord.status === 'Cooking'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ord.status}
                          </span>

                          <button
                            onClick={() => {
                              onViewOrderKOT(ord);
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Print KOT"
                          >
                            <Printer className="w-3 h-3 text-amber-600" />
                            <span>KOT</span>
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                        {(ord.items || []).map((it, iIdx) => {
                          const itemAddons = [];
                          if (it.selectedCrust && typeof it.selectedCrust === 'string' && it.selectedCrust.toLowerCase() !== 'standard') {
                            itemAddons.push(it.selectedCrust);
                          } else if (it.selectedCrust?.name && it.selectedCrust.name.toLowerCase() !== 'standard') {
                            itemAddons.push(it.selectedCrust.name);
                          }
                          const rawAddons = it.selectedAddOns || it.selectedAddons || it.addons || it.addOns || [];
                          if (Array.isArray(rawAddons)) {
                            rawAddons.forEach(a => {
                              if (typeof a === 'string' && a.trim()) itemAddons.push(a.trim());
                              else if (a?.name || a?.title) itemAddons.push(a.name || a.title);
                            });
                          }

                          return (
                            <div key={iIdx} className="py-1 flex justify-between items-center text-slate-800">
                              <div>
                                <span className="font-semibold">{it.quantity}x {it.name}</span>
                                {itemAddons.length > 0 && (
                                  <span className="text-[10px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded ml-1 border border-amber-200">
                                    + {itemAddons.join(', ')}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-slate-700">
                                ₹{(it.price || it.basePrice || 0) * (it.quantity || 1)}
                              </span>
                            </div>
                          );
                        })}

                      <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                          {roundNum === 1 ? '1st Order' : 'Extra Order'} Subtotal:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{ord.grandTotal || ord.totalAmount || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master Combined Calculation Box */}
              {(() => {
                const combinedSubtotal = selectedTableTab.orders.reduce(
                  (sum, o) => sum + Number(o.subtotal || o.totalAmount || 0),
                  0
                );
                const combinedDiscount = selectedTableTab.orders.reduce(
                  (sum, o) => sum + Number(o.discountAmount || 0),
                  0
                );
                const combinedGst = selectedTableTab.orders.reduce(
                  (sum, o) => sum + Number(o.gstAmount || 0),
                  0
                );
                const combinedGrandTotal = selectedTableTab.orders.reduce(
                  (sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0),
                  0
                );
                const isAllPaid = selectedTableTab.orders.every((o) => o.paymentStatus === 'paid');

                return (
                  <div className="p-4 bg-stone-900 text-white rounded-2xl space-y-2 border border-amber-500/30">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Combined Items Subtotal</span>
                      <span className="font-mono font-bold">₹{combinedSubtotal.toFixed(2)}</span>
                    </div>

                    {combinedDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400 font-bold">
                        <span>Discounts</span>
                        <span>-₹{combinedDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-400 font-bold">FREE (Dine-In ₹0)</span>
                    </div>

                    {combinedGst > 0 && (
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>GST (5%)</span>
                        <span className="font-mono">₹{combinedGst.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-black tracking-wider block">
                          Master Grand Total
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          ₹{combinedGrandTotal.toFixed(2)}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl ${
                          isAllPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isAllPaid ? '✓ All Orders Paid Online' : '⚠️ Due at Counter'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => {
                  // Build a combined master order object for printing combined slip
                  const combinedItems = selectedTableTab.orders.flatMap((o) => o.items || []);
                  const masterTotal = selectedTableTab.orders.reduce(
                    (sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0),
                    0
                  );
                  onViewOrderKOT({
                    ...selectedTableTab.orders[0],
                    isMasterBill: true,
                    roundsCount: selectedTableTab.orders.length,
                    items: combinedItems,
                    grandTotal: masterTotal,
                    totalAmount: masterTotal,
                  });
                }}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-600" />
                <span>Print Master Bill</span>
              </button>

              <button
                onClick={() => handleSettleMaster('counter_cash')}
                disabled={isSettling}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Banknote className="w-4 h-4 stroke-[2.4]" />
                <span>{isSettling ? 'Settling...' : 'Settle Cash & Free Table'}</span>
              </button>

              <button
                onClick={() => handleSettleMaster('counter_upi')}
                disabled={isSettling}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>UPI Settle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TableFloorGrid;
