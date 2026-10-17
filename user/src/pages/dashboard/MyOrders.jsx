import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Loader2, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { OrderSkeleton } from '../../components/dashboard/OrderSkeleton';
import gsap from 'gsap';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { sendOrderCancelledEmail } from '../../utils/emailTemplates';

export const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [userCancelReason, setUserCancelReason] = useState('Ordered by mistake');
  const [userCustomCancelReason, setUserCustomCancelReason] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const containerRef = useRef(null);
  
  const { currentUser } = useAuth();
  const { addToCart, setIsCartOpen, showToast } = useCart();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = [];
      querySnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        if (orderData.orderType !== 'dine-in' && orderData.source !== 'qr_table' && orderData.source !== 'counter_pos') {
          fetchedOrders.push({ id: docSnap.id, ...orderData });
        }
      });
      
      const getTimeMs = (val) => {
        if (!val) return 0;
        if (typeof val === 'string') return new Date(val).getTime() || 0;
        if (typeof val.toMillis === 'function') return val.toMillis();
        if (typeof val.seconds === 'number') return val.seconds * 1000;
        if (typeof val === 'number') return val;
        if (val instanceof Date) return val.getTime();
        return 0;
      };

      fetchedOrders.sort((a, b) => getTimeMs(b.createdAt || b.updatedAt) - getTimeMs(a.createdAt || a.updatedAt));

      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Keep cancellation countdown live
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    try {
      const finalReason = userCancelReason === 'Other' 
        ? (userCustomCancelReason.trim() || 'No reason provided') 
        : userCancelReason;
        
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'Cancelled',
        cancelReason: `Cancelled by Customer: ${finalReason}`,
        updatedAt: new Date().toISOString()
      });

      // Trigger Cancellation Email to Customer
      const order = orders.find(o => o.id === orderId);
      if (order) {
        sendOrderCancelledEmail({ ...order, status: 'Cancelled' }, finalReason).catch(console.warn);
      }

      // Restore inventory if stock tracking is present
      if (order && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.id) {
            try {
              const menuRef = doc(db, 'menu', item.id);
              const menuSnap = await getDoc(menuRef);
              if (menuSnap.exists()) {
                const data = menuSnap.data();
                if (data.stock !== undefined && data.stock !== null) {
                  const currentStock = parseInt(data.stock, 10);
                  if (!isNaN(currentStock)) {
                    await updateDoc(menuRef, {
                      stock: currentStock + (item.quantity || 1),
                      isAvailable: true
                    });
                  }
                }
              }
            } catch (err) {
              console.warn("Inventory restoration skipped:", err);
            }
          }
        }
      }

      showToast("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please check connection.");
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
      setUserCancelReason('Ordered by mistake');
      setUserCustomCancelReason('');
    }
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      showToast("No items found in this order.");
      return;
    }
    
    order.items.forEach(item => {
      addToCart(item, item.quantity || 1);
    });
    
    setIsCartOpen(true);
    showToast("Items added back to your cart!");
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    let date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.order-card');
    if (cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab, orders.length, loading]);

  const filteredOrders = orders.filter(order => {
    const status = order.status?.toLowerCase() || '';
    let matchesTab = false;
    
    if (activeTab === 'all') {
      matchesTab = true;
    } else if (activeTab === 'active') {
      matchesTab = status !== 'delivered' && status !== 'cancelled';
    } else if (activeTab === 'delivered') {
      matchesTab = status === 'delivered';
    } else if (activeTab === 'cancelled') {
      matchesTab = status === 'cancelled';
    }

    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusConfig = (rawStatus) => {
    const status = rawStatus?.toLowerCase() || '';
    if (status === 'delivered') {
      return { 
        color: 'text-emerald-700', 
        bg: 'bg-emerald-50 border border-emerald-200', 
        icon: CheckCircle2, 
        label: 'Delivered' 
      };
    }
    if (status === 'cancelled') {
      return { 
        color: 'text-rose-700', 
        bg: 'bg-rose-50 border border-rose-200', 
        icon: XCircle, 
        label: 'Cancelled' 
      };
    }
    return { 
        color: 'text-amber-800', 
        bg: 'bg-amber-50 border border-amber-200', 
      icon: Clock, 
      label: rawStatus || 'Preparing Order' 
    };
  };

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
            My Orders
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-1">
            Track active cafe orders and review your meal history
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-full text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all w-full sm:w-64"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'active', label: 'Active 🛵' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-amber-400 text-stone-950 font-black shadow-sm' 
                : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div>
            {[...Array(3)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const isCancelled = order.status?.toLowerCase() === 'cancelled';
            const isDelivered = order.status?.toLowerCase() === 'delivered';
            
            const itemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
            const orderAmount = order.totalAmount || order.grandTotal || order.amount || 0;
            const orderDate = formatDate(order.createdAt);
            const orderImage = order.items?.[0]?.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200';
            
            // 5-minute cancellation window logic
            const orderTimeMs = order.createdAt ? (
              typeof order.createdAt.toMillis === 'function' ? order.createdAt.toMillis() :
              typeof order.createdAt.seconds === 'number' ? order.createdAt.seconds * 1000 :
              typeof order.createdAt === 'string' ? new Date(order.createdAt).getTime() :
              typeof order.createdAt === 'number' ? order.createdAt :
              order.createdAt instanceof Date ? order.createdAt.getTime() : currentTime
            ) : currentTime;
            
            const timeElapsed = currentTime - orderTimeMs;
            const timeRemaining = Math.max(0, 5 * 60 * 1000 - timeElapsed);
            const isCancelable = !isCancelled && !isDelivered && timeRemaining > 0;
            
            const formatTime = (ms) => {
              const totalSeconds = Math.floor(ms / 1000);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            };

            return (
              <div 
                key={order.id} 
                className={`order-card border rounded-3xl p-5 sm:p-7 transition-all duration-200 relative overflow-hidden ${
                  isCancelled 
                    ? 'bg-stone-50 border-rose-200' 
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm hover:shadow'
                }`}
              >
                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-stone-900 font-mono tracking-tight">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] font-bold text-stone-500 mt-0.5">{orderDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-stone-900 font-mono">
                      ₹{orderAmount.toFixed(2)}
                    </p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
                    <img src={orderImage} alt="Order items" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-stone-900 text-sm sm:text-base line-clamp-1">
                      {order.items?.length > 1 ? `${order.items[0].name} +${order.items.length - 1} more items` : order.items?.[0]?.name || 'Delicious Cafe Order'}
                    </h4>
                    <p className="text-xs font-bold text-stone-500 mt-1">
                      {itemCount} Items • {order.paymentMethod || 'Online'} Payment
                    </p>
                    {order.items?.some(i => (i.selectedAddOns?.length > 0 || i.addons?.length > 0 || i.addOns?.length > 0 || i.specialInstructions || (i.selectedCrust && i.selectedCrust !== 'Standard'))) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {order.items.flatMap(i => {
                          const list = (i.selectedAddOns || i.addons || i.addOns || []).map(a => typeof a === 'string' ? a : (a.name || a.title)).filter(Boolean);
                          if (i.selectedCrust && typeof i.selectedCrust === 'string' && i.selectedCrust !== 'Standard') list.unshift(i.selectedCrust);
                          else if (i.selectedCrust?.name && i.selectedCrust.name !== 'Standard') list.unshift(i.selectedCrust.name);
                          return list;
                        }).map((addonName, aIdx) => (
                          <span key={aIdx} className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.5 rounded">
                            + {addonName}
                          </span>
                        ))}
                        {order.items.some(i => i.specialInstructions) && (
                          <span className="text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.5 rounded italic">
                            Custom Notes
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery OTP Badge for Active Orders */}
                {!isCancelled && !isDelivered && order.deliveryOtp && (
                  <div className="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Delivery Verification OTP</span>
                      </p>
                      <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                        Share this PIN with delivery partner upon arrival
                      </p>
                    </div>
                    <div className="px-4 py-2 bg-white border border-amber-300 rounded-xl shadow-sm">
                      <span className="text-xl font-black font-mono tracking-[0.25em] text-amber-700">
                        {order.deliveryOtp}
                      </span>
                    </div>
                  </div>
                )}

                {/* Cancel Reason Display */}
                {isCancelled && order.cancelReason && (
                  <div className="my-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-rose-800">Cancellation Reason</p>
                      <p className="text-xs text-stone-600 mt-0.5">{order.cancelReason}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-stone-100">
                  {!isCancelled && !isDelivered && (
                    <>
                      <Link 
                        to={`/dashboard/track/${order.id}`} 
                        className="flex-1 min-w-[140px] py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 stroke-[2.5]" />
                        <span>Track Live Delivery</span>
                      </Link>

                      {isCancelable ? (
                        <button 
                          onClick={() => setOrderToCancel(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="flex-1 min-w-[140px] py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {cancellingOrderId === order.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <span>Cancel Order</span>
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-mono">
                                {formatTime(timeRemaining)}
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div 
                          className="flex-1 min-w-[130px] py-3 bg-stone-100 border border-stone-200 text-stone-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed select-none"
                          title="Cancellation period of 5 minutes has passed"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancellation Window Closed</span>
                        </div>
                      )}
                    </>
                  )}

                  {(isCancelled || isDelivered) && (
                    <button 
                      onClick={() => handleReorder(order)}
                      className="flex-1 min-w-[130px] py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reorder Meal</span>
                    </button>
                  )}

                  <Link 
                    to={`/dashboard/invoice/${order.id}`}
                    className="flex-1 min-w-[120px] py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors cursor-pointer text-center flex items-center justify-center gap-2 border border-stone-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Bill</span>
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState 
            icon={Package}
            title="No orders found"
            description={`No ${activeTab !== 'all' ? activeTab : ''} cafe orders matched your selection.`}
            actionText="Explore Cafe Menu"
            actionLink="/menu"
          />
        )}
      </div>

      {/* Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mb-5 mx-auto">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-stone-900 text-center mb-2">Cancel Order?</h3>
            <p className="text-xs font-semibold text-stone-500 text-center mb-6 leading-relaxed">
              Are you sure you want to cancel this order? This action cannot be undone and your payment will be refunded.
            </p>

            <div className="mb-6 space-y-3">
              <label className="block text-xs font-bold text-stone-700">Cancellation Reason</label>
              <select 
                value={userCancelReason}
                onChange={(e) => setUserCancelReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Forgot to apply discount code">Forgot to apply discount code</option>
                <option value="Change of meal preference">Change of meal preference</option>
                <option value="Other">Other</option>
              </select>

              {userCancelReason === 'Other' && (
                <textarea 
                  placeholder="Please specify why you are cancelling..."
                  value={userCustomCancelReason}
                  onChange={(e) => setUserCustomCancelReason(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none h-20"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setOrderToCancel(null);
                  setUserCancelReason('Ordered by mistake');
                  setUserCustomCancelReason('');
                }}
                disabled={cancellingOrderId}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-stone-200"
              >
                No, Keep It
              </button>
              <button 
                onClick={() => handleCancelOrder(orderToCancel)}
                disabled={cancellingOrderId}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {cancellingOrderId ? (
                  <><Loader2 className="w-4 h-4 animate-spin"/> Cancelling...</>
                ) : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
