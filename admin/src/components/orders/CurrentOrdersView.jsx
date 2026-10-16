import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ChevronRight, 
  Bike, 
  Printer, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  UtensilsCrossed,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import gsap from 'gsap';

export const CurrentOrdersView = () => {
  const { 
    orders, 
    updateOrderStatus, 
    cancelOrder, 
    assignDeliveryPartner, 
    verifyDeliveryOtp,
    showToast 
  } = useAdminOrders();

  const [filterStatus, setFilterStatus] = useState('All');
  const [printingOrder, setPrintingOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Out of stock / ingredients');
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [partnerForm, setPartnerForm] = useState({ name: 'Rider Rahul', phone: '+91 98765 43210' });
  const [otpVerifyOrder, setOtpVerifyOrder] = useState(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [viewDetailsOrder, setViewDetailsOrder] = useState(null);

  const containerRef = useRef(null);

  const activeOrders = orders.filter(
    o => o.status?.toLowerCase() !== 'delivered' && o.status?.toLowerCase() !== 'cancelled'
  );

  const filteredOrders = activeOrders.filter(order => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Order Received') return order.status === 'Order Received' || order.status === 'Pending';
    if (filterStatus === 'Preparing') return order.status === 'Preparing' || order.status === 'Packing';
    if (filterStatus === 'Out for Delivery') return order.status === 'Out for Delivery';
    return order.status === filterStatus;
  });

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [filterStatus, activeOrders.length]);

  const formatRelativeTime = (val) => {
    if (!val) return 'Just now';
    let date;
    if (typeof val === 'string') date = new Date(val);
    else if (val.toDate) date = val.toDate();
    else if (val.seconds) date = new Date(val.seconds * 1000);
    else date = new Date(val);

    if (isNaN(date.getTime())) return 'Recently';

    const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    await cancelOrder(cancellingOrder.id, cancelReason);
    setCancellingOrder(null);
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!assigningOrder) return;
    await assignDeliveryPartner(assigningOrder.id, partnerForm);
    setAssigningOrder(null);
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    if (!otpVerifyOrder) return;
    setOtpError('');
    const res = await verifyDeliveryOtp(otpVerifyOrder, inputOtp);
    if (res.success) {
      setOtpVerifyOrder(null);
      setInputOtp('');
    } else {
      setOtpError(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'All', label: 'All Active' },
            { id: 'Order Received', label: 'Order Received' },
            { id: 'Preparing', label: 'Preparing in Kitchen' },
            { id: 'Out for Delivery', label: 'Out for Delivery' }
          ].map(tab => {
            const count = tab.id === 'All'
              ? activeOrders.length
              : activeOrders.filter(o => {
                  if (tab.id === 'Order Received') return o.status === 'Order Received' || o.status === 'Pending';
                  if (tab.id === 'Preparing') return o.status === 'Preparing' || o.status === 'Packing';
                  return o.status === tab.id;
                }).length;

            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  filterStatus === tab.id ? 'bg-black/15 text-stone-950' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-bold text-slate-500">
          Live Real-time Pipeline &bull; {filteredOrders.length} Orders
        </span>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No active orders in this stage</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Incoming customer orders from User Panel will automatically show up here with audio chime notification.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map(order => {
            const customerName = order.customerName || order.shippingAddress?.fullName || 'Walk-in / Online';
            const customerPhone = order.customerPhone || order.shippingAddress?.phone || 'No phone';
            const address = order.deliveryAddress || order.shippingAddress?.street || 'Pickup';
            const total = order.totalAmount || order.grandTotal || 0;
            const items = order.items || [];
            const timeAgo = formatRelativeTime(order.createdAt);
            const isReceived = order.status === 'Order Received' || order.status === 'Pending';
            const isPreparing = order.status === 'Preparing' || order.status === 'Packing';
            const isOut = order.status === 'Out for Delivery';

            return (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                          {timeAgo}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1">{customerName}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isReceived 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isPreparing
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {order.status || 'Received'}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="px-5 py-3 bg-amber-50/40 border-b border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <a 
                        href={`tel:${customerPhone}`} 
                        className="font-bold text-slate-700 hover:text-amber-600 flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>{customerPhone}</span>
                      </a>
                      <div className="text-right">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{parseFloat(total).toFixed(2)}
                        </span>
                        {order.couponApplied && (
                          <span className="block text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5">
                            {order.couponApplied} (-₹{parseFloat(order.discountAmount || 0)})
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-start gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </p>
                  </div>

                  {/* Items List */}
                  <div className="p-5 space-y-2 max-h-48 overflow-y-auto">
                    {items.map((item, idx) => (
                      <div key={idx} className="space-y-1 py-1 border-b border-slate-50 last:border-none">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {item.quantity || 1}x
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-mono text-slate-600 shrink-0 font-semibold">
                            ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                        {item.selectedAddOns?.length > 0 && (
                          <div className="pl-7 flex flex-wrap gap-1">
                            {item.selectedAddOns.map((addon, aIdx) => (
                              <span key={aIdx} className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium">
                                + {addon.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div className="pl-7 text-[10px] text-amber-900 bg-amber-50/70 p-1 rounded border border-amber-200/60 font-medium italic">
                            Chef Note: "{item.specialInstructions}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Assigned Rider Info */}
                  {order.assignedPartnerName && (
                    <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Bike className="w-4 h-4 text-purple-600" />
                        <span>Rider: {order.assignedPartnerName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{order.assignedPartnerPhone}</span>
                    </div>
                  )}

                  {/* Delivery OTP Badge */}
                  {order.deliveryOtp && (
                    <div className="px-5 py-2 bg-amber-500/10 border-t border-amber-500/20 text-xs flex items-center justify-between">
                      <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Handover PIN:
                      </span>
                      <span className="font-mono font-black text-amber-900 tracking-wider">
                        {order.deliveryOtp}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    {isReceived && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Preparing')}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>Send to Kitchen</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => setAssigningOrder(order)}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Assign & Dispatch</span>
                      </button>
                    )}

                    {isOut && (
                      <button
                        onClick={() => {
                          setOtpVerifyOrder(order);
                          setInputOtp('');
                          setOtpError('');
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Mark Delivered</span>
                      </button>
                    )}

                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer"
                      title="Print Thermal Bill"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCancellingOrder(order)}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="Cancel Order"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Thermal Modal */}
      {printingOrder && (
        <ThermalReceiptModal 
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* Assign Delivery Partner Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 text-base">Assign Delivery Rider</h3>
              <button onClick={() => setAssigningOrder(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rider Name</label>
                <input
                  type="text"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rider Phone</label>
                <input
                  type="tel"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpVerifyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="font-black text-slate-900 text-base">Verify Handover PIN</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Ask customer for the 4-digit PIN displayed on their dashboard.
            </p>

            {otpError && (
              <div className="mb-3 p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleConfirmOtp} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                placeholder="e.g. 7284"
                required
                className="w-full text-center tracking-[0.3em] font-mono text-xl font-black py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpVerifyOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm"
                >
                  Verify & Deliver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-base mb-1">Cancel Order #{cancellingOrder.id.slice(0, 8)}?</h3>
            <p className="text-xs text-slate-500 mb-4">Select a reason for cancellation:</p>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Out of stock / ingredients">Out of stock / ingredients</option>
                <option value="Kitchen rush / high load">Kitchen rush / high load</option>
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Delivery address unserviceable">Delivery address unserviceable</option>
                <option value="Other">Other</option>
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm"
                >
                  Yes, Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentOrdersView;
