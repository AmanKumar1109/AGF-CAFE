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
      <div className="stagger-item bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-9 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-amber-600/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 
              <span>Welcome to AGF CAFE Lounge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-serif">
              Hello, {userName}! ☕
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm font-medium max-w-md leading-relaxed">
              Track live kitchen deliveries, explore fresh brews, and manage your saved delivery locations.
            </p>
          </div>

          <Link
            to="/menu"
            className="self-start sm:self-center px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
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
          className="stagger-item bg-stone-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-3xl shadow-lg hover:border-pink-500/40 hover:bg-stone-900/80 transition-all group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-pink-500/10">
            <Heart className="w-5 h-5 fill-pink-500/80 stroke-pink-400" />
          </div>
          <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Wishlist Dishes</p>
          <h3 className="text-2xl font-black text-white mt-1">
            {userProfile?.wishlist?.length || 0} Saved
          </h3>
        </Link>

        {/* Total Orders Card */}
        <Link
          to="/dashboard/orders"
          className="stagger-item bg-stone-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-3xl shadow-lg hover:border-amber-500/40 hover:bg-stone-900/80 transition-all group block"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-amber-500/10">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Total Orders</p>
          <h3 className="text-2xl font-black text-white mt-1">
            {loadingOrders ? '...' : `${userOrders.length}`}
          </h3>
        </Link>

        {/* Total Spent Card */}
        <Link
          to="/dashboard/orders"
          className="stagger-item bg-stone-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-3xl shadow-lg hover:border-emerald-500/40 hover:bg-stone-900/80 transition-all group block col-span-2 sm:col-span-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/10">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-black text-stone-400 uppercase tracking-wider">Total Spent</p>
          <h3 className="text-2xl font-black text-white mt-1 truncate">
            {loadingOrders ? '...' : `₹${totalSpent.toFixed(2)}`}
          </h3>
        </Link>
      </div>

      {/* Active Delivery Section */}
      <div className="stagger-item space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Active Cafe Delivery</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
            </h2>
            <p className="text-xs font-semibold text-stone-400 mt-0.5">Real-time status of your ongoing cafe order</p>
          </div>
          <Link
            to="/dashboard/orders"
            className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full transition-colors"
          >
            <span>All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Order Card */}
        {latestActiveOrder ? (
          <div className="bg-stone-900/70 backdrop-blur-xl border border-amber-500/30 p-6 rounded-3xl shadow-xl hover:border-amber-500/50 transition-all relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                  latestActiveOrder.status?.toLowerCase() === 'delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                }`}>
                  {latestActiveOrder.status || 'Preparing Order'} 🛵
                </span>
                <span className="text-xs font-mono font-bold text-stone-400">#{latestActiveOrder.id.slice(0, 8)}</span>
              </div>
              <span className="text-lg font-black text-amber-400 font-mono">
                ₹{(latestActiveOrder.totalAmount || latestActiveOrder.grandTotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-stone-800 flex-shrink-0 overflow-hidden border border-white/10">
                <img
                  src={latestActiveOrder.items?.[0]?.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=200'}
                  alt="Cafe Dish"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-white text-sm sm:text-base truncate">
                  {latestActiveOrder.items?.[0]?.name || 'Delicious Cafe Meal'} {latestActiveOrder.items?.length > 1 ? `+${latestActiveOrder.items.length - 1} more items` : ''}
                </h4>
                <p className="text-xs font-bold text-stone-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{latestActiveOrder.items?.length || 1} items • Hot Kitchen Delivery</span>
                </p>
              </div>
            </div>

            <Link
              to={`/dashboard/track/${latestActiveOrder.id}`}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>Track Live Delivery Progress</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </Link>
          </div>
        ) : (
          <div className="bg-stone-900/50 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-lg text-center space-y-3.5">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <UtensilsCrossed className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h4 className="text-base font-black text-white tracking-tight">No active orders right now</h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
              Craving artisan coffee, loaded burgers, or creamy pasta? Treat yourself with fresh delicacies!
            </p>
            <div className="pt-2">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all"
              >
                <span>Explore Cafe Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Customer Support Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-amber-500/20 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="font-black text-white text-sm sm:text-base">Need Help with Your Cafe Order?</h4>
            <p className="text-xs text-stone-400 mt-0.5">Lodge a complaint or connect directly with our support desk.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard/help"
            className="flex-1 sm:flex-initial py-3 px-5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all text-center border border-white/5"
          >
            Help Desk
          </Link>
          <Link
            to="/complaint"
            className="flex-1 sm:flex-initial py-3 px-5 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-400 transition-all text-center"
          >
            Lodge Complaint
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
