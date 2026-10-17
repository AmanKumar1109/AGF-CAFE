import React, { useState, Suspense, lazy } from 'react';
import { 
  ShoppingBag, 
  History, 
  Volume2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { useDeliveryRadius } from '../../hooks/useDeliveryRadius';
import { CurrentOrdersView } from './CurrentOrdersView';
import { OrderHistoryView } from './OrderHistoryView';

const FleetRadarView = lazy(() => import('../fleet/FleetRadarView'));

export const OrdersManager = () => {
  const { radiusKm } = useDeliveryRadius();
  const [activeTab, setActiveTab] = useState('live');
  const { activeOrders, playOrderPingChime, toastMessage } = useAdminOrders();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Cafe Orders Management
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time Live</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Accept online orders, dispatch kitchen meals, verify delivery PINs, and print 80mm bills
          </p>
        </div>

        {/* Audio Test & Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={playOrderPingChime}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="Test new order sound chime"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Test Order Chime</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'live'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
          <span>Live Kitchen & Deliveries</span>
          {activeOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/15 text-stone-950">
              {activeOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 stroke-[2.5] animate-pulse text-amber-500" />
          <span>Live Delivery Map & Radar</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
            {radiusKm} KM
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4 stroke-[2.5]" />
          <span>Order History & Billing</span>
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === 'live' ? (
        <CurrentOrdersView />
      ) : activeTab === 'map' ? (
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading Live Fleet Radar...</div>}>
          <FleetRadarView />
        </Suspense>
      ) : (
        <OrderHistoryView />
      )}
    </div>
  );
};

export default OrdersManager;
