import React, { useRef, useEffect, useState } from 'react';
import { 
  Package, 
  Heart, 
  ChevronRight, 
  UtensilsCrossed, 
  Sparkles, 
  ArrowRight, 
  ShoppingBag, 
  Wallet, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import gsap from 'gsap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const DashboardHome = () => {
  const containerRef = useRef(null);
  const { currentUser, userProfile } = useAuth();
  const userName = (userProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Customer').split(' ')[0];

  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoadingOrders(true);

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );

    const getTimeMs = (val) => {
      if (!val) return 0;
      if (typeof val === 'string') return new Date(val).getTime() || 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.seconds === 'number') return val.seconds * 1000;
      if (typeof val === 'number') return val;
      if (val instanceof Date) return val.getTime();
      return 0;
    };

    const unsub = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loaded.sort((a, b) => getTimeMs(b.createdAt || b.updatedAt) - getTimeMs(a.createdAt || a.updatedAt));
      setUserOrders(loaded);
      setLoadingOrders(false);
    }, (err) => {
      console.error("Error fetching user orders:", err);
      setLoadingOrders(false);
    });

    return () => unsub();
  }, [currentUser]);

  const latestActiveOrder = userOrders.find(o => {
    const s = o.status?.toLowerCase();
    return s !== 'delivered' && s !== 'cancelled';
  });

  const totalSpent = userOrders.reduce((sum, order) => {
    if (order.status?.toLowerCase() !== 'cancelled') {
      const amt = parseFloat(order.totalAmount || order.grandTotal || order.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }
    return sum;
  }, 0);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.stagger-item');
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 space-y-6 sm:space-y-8">
      {/* Welcome Card Banner */}
      <div className="stagger-item bg-amber-400 border border-amber-300/80 rounded-3xl p-6 sm:p-9 text-stone-950 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/70 backdrop-blur-sm border border-stone-900/10 rounded-full text-stone-950 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-stone-900" /> 
              <span>Welcome to AGF CAFE Lounge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950 font-serif">
              Hello, {userName}! ☕
            </h1>
            <p className="text-stone-900/90 text-xs sm:text-sm font-semibold max-w-md leading-relaxed">
              Track live kitchen deliveries, explore fresh brews, and manage your saved delivery locations.
            </p>
          </div>

          <Link
            to="/menu"
            className="self-start sm:self-center px-7 py-3.5 bg-white hover:bg-stone-50 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group cursor-pointer"
          >
            <span>Order Fresh Food</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Stats Section Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Wishlist Card */}
        <Link
          to="/dashboard/wishlist"
          className="stagger-item bg-white border border-stone-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-stone-300 transition-all group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-pink-500 stroke-pink-600" />
          </div>
          <p className="text-[11px] font-black text-stone-500 uppercase tracking-wider">Wishlist Dishes</p>
          <h3 className="text-2xl font-black text-stone-900 mt-1">
            {userProfile?.wishlist?.length || 0} Saved
          </h3>
        </Link>

        {/* Total Orders Card */}
        <Link
          to="/dashboard/orders"
          className="stagger-item bg-white border border-stone-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-stone-300 transition-all group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-black text-stone-500 uppercase tracking-wider">Total Orders</p>
          <h3 className="text-2xl font-black text-stone-900 mt-1">
            {loadingOrders ? '...' : `${userOrders.length}`}
          </h3>
        </Link>

        {/* Total Spent Card */}
        <Link
          to="/dashboard/orders"
          className="stagger-item bg-white border border-stone-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:border-stone-300 transition-all group block col-span-2 sm:col-span-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-black text-stone-500 uppercase tracking-wider">Total Spent</p>
          <h3 className="text-2xl font-black text-stone-900 mt-1 truncate">
            {loadingOrders ? '...' : `₹${totalSpent.toFixed(2)}`}
          </h3>
        </Link>
      </div>

      {/* Active Delivery Section */}
      <div className="stagger-item space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>Active Cafe Delivery</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            </h2>
            <p className="text-xs font-semibold text-stone-500 mt-0.5">Real-time status of your ongoing cafe order</p>
          </div>
          <Link
            to="/dashboard/orders"
            className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <span>All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Order Card */}
        {latestActiveOrder ? (
          <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm hover:border-stone-300 transition-all relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                  latestActiveOrder.status?.toLowerCase() === 'delivered'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {latestActiveOrder.status || 'Preparing Order'} 🛵
                </span>
                <span className="text-xs font-mono font-bold text-stone-500">#{latestActiveOrder.id.slice(0, 8)}</span>
              </div>
              <span className="text-lg font-black text-stone-900 font-mono">
                ₹{(latestActiveOrder.totalAmount || latestActiveOrder.grandTotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex-shrink-0 overflow-hidden border border-stone-200">
                <img
                  src={latestActiveOrder.items?.[0]?.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200'}
                  alt="Cafe Dish"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-stone-900 text-sm sm:text-base truncate">
                  {latestActiveOrder.items?.[0]?.name || 'Delicious Cafe Meal'} {latestActiveOrder.items?.length > 1 ? `+${latestActiveOrder.items.length - 1} more items` : ''}
                </h4>
                <p className="text-xs font-bold text-stone-500 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{latestActiveOrder.items?.length || 1} items • Hot Kitchen Delivery</span>
                </p>
              </div>
            </div>

            <Link
              to={`/dashboard/track/${latestActiveOrder.id}`}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>Track Live Delivery Progress</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 p-8 sm:p-10 rounded-3xl shadow-sm text-center space-y-3.5">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h4 className="text-base font-black text-stone-900 tracking-tight">No active orders right now</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Craving artisan coffee, loaded burgers, or creamy pasta? Treat yourself with fresh delicacies!
            </p>
            <div className="pt-2">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm hover:bg-amber-500 transition-all"
              >
                <span>Explore Cafe Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Customer Support Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-sm shrink-0">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-black text-stone-900 text-sm sm:text-base">Need Help with Your Cafe Order?</h4>
            <p className="text-xs text-stone-500 mt-0.5">Lodge a complaint or connect directly with our support desk.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard/help"
            className="flex-1 sm:flex-initial py-3 px-5 bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center border border-stone-200 shadow-sm"
          >
            Help Desk
          </Link>
          <Link
            to="/complaint"
            className="flex-1 sm:flex-initial py-3 px-5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all text-center"
          >
            Lodge Complaint
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
