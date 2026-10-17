import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ChefHat,
  QrCode,
  PlusCircle,
  Clock,
  Sparkles,
  Banknote,
  Receipt,
  Layers,
  ArrowRight,
  Users,
  ClipboardList
} from 'lucide-react';
import { subscribeTables, subscribeDineInOrders } from '../../services/tableService';
import { TableFloorGrid } from './TableFloorGrid';
import { DineInOrdersFeed } from './DineInOrdersFeed';
import { TableQrGenerator } from './TableQrGenerator';
import { WalkInPosModal } from './WalkInPosModal';
import { KitchenOrderTicketModal } from './KitchenOrderTicketModal';
import { OfflineCustomersView } from './OfflineCustomersView';
import { OfflineOrdersHistoryView } from './OfflineOrdersHistoryView';

export const OfflinePosView = () => {
  const [activeSubTab, setActiveSubTab] = useState('floor'); // 'floor' | 'orders' | 'history' | 'customers' | 'standees'
  const [tables, setTables] = useState([]);
  const [dineInOrders, setDineInOrders] = useState([]);
  const [isWalkInPosOpen, setIsWalkInPosOpen] = useState(false);
  const [walkInTableNumber, setWalkInTableNumber] = useState('1');
  const [kotOrder, setKotOrder] = useState(null);

  // Subscribe to tables and dine-in orders
  useEffect(() => {
    const unsubTables = subscribeTables(setTables);
    const unsubOrders = subscribeDineInOrders(setDineInOrders);

    return () => {
      if (unsubTables) unsubTables();
      if (unsubOrders) unsubOrders();
    };
  }, []);

  // Compute summary metrics
  const activeOrders = dineInOrders.filter(
    (o) => o.status === 'Order Received' || o.status === 'Cooking' || o.status === 'Served'
  );
  const occupiedTablesCount = tables.filter((t) => {
    return (
      t.status === 'occupied' ||
      activeOrders.some((o) => String(o.tableNumber) === String(t.tableNumber))
    );
  }).length;

  const todayDineInTotal = dineInOrders
    .filter((o) => {
      if (o.status === 'Cancelled') return false;
      if (!o.createdAt?.seconds) return true;
      const orderDate = new Date(o.createdAt.seconds * 1000);
      const today = new Date();
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    })
    .reduce((sum, o) => sum + (Number(o.grandTotal || o.totalAmount || 0)), 0);

  const handleOpenWalkInPos = (tableNum = '1') => {
    setWalkInTableNumber(tableNum);
    setIsWalkInPosOpen(true);
  };

  const handleViewKOT = (order) => {
    setKotOrder(order);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <UtensilsCrossed className="w-7 h-7 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Offline Dine-In Hub
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ₹0 Delivery Fee
                </span>
              </div>
              <h2 className="text-2xl font-black font-serif text-white mt-1">
                Table Orders & Offline POS
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Manage live table occupancy, incoming QR dine-in tickets, quick walk-in billing, and printable standees.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 text-center min-w-[90px]">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">
                Occupied
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {occupiedTablesCount}/{tables.length}
              </span>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 text-center min-w-[90px]">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">
                In Kitchen
              </span>
              <span className="text-xl font-black text-white font-mono">
                {activeOrders.length}
              </span>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">
                Today Dine-In
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ₹{todayDineInTotal.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('floor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'floor'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Live Table Floor Grid</span>
            </button>

            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'orders'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>
                Live Dine-In Orders Queue
                {activeOrders.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 text-[10px] font-mono">
                    {activeOrders.length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Offline Orders History</span>
            </button>

            <button
              onClick={() => setActiveSubTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'customers'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Offline Guests CRM</span>
            </button>

            <button
              onClick={() => setActiveSubTab('standees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'standees'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 scale-105'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Table QR Standees</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenWalkInPos()}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.4]" />
            <span>Punch Counter Walk-in Order</span>
          </button>
        </div>
      </div>

      {/* Tab Views */}
      {activeSubTab === 'floor' && (
        <TableFloorGrid
          tables={tables}
          dineInOrders={dineInOrders}
          onOpenWalkInPos={handleOpenWalkInPos}
          onViewOrderKOT={handleViewKOT}
        />
      )}

      {activeSubTab === 'orders' && (
        <DineInOrdersFeed
          dineInOrders={dineInOrders}
          onViewOrderKOT={handleViewKOT}
        />
      )}

      {activeSubTab === 'history' && (
        <OfflineOrdersHistoryView
          dineInOrders={dineInOrders}
          onViewOrderKOT={handleViewKOT}
        />
      )}

      {activeSubTab === 'customers' && (
        <OfflineCustomersView
          dineInOrders={dineInOrders}
          onViewOrderKOT={handleViewKOT}
        />
      )}

      {activeSubTab === 'standees' && (
        <TableQrGenerator tables={tables} />
      )}

      {/* Modals */}
      <WalkInPosModal
        isOpen={isWalkInPosOpen}
        onClose={() => setIsWalkInPosOpen(false)}
        initialTableNumber={walkInTableNumber}
        tables={tables}
        onOrderPunched={(order) => {
          handleViewKOT(order);
        }}
      />

      {kotOrder && (
        <KitchenOrderTicketModal
          order={kotOrder}
          onClose={() => setKotOrder(null)}
        />
      )}
    </div>
  );
};
export default OfflinePosView;
