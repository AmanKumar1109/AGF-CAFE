import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  Clock,
  LogOut,
  ShoppingBag,
  User,
  ChevronRight,
  Navigation,
  Star,
  AlertCircle,
  Radio,
  Locate,
  X,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Link } from 'react-router-dom';
import { AGF_CAFE_HUB } from '../../utils/locationUtils';

const STATUS_CONFIG = {
  'Order Received': { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Order Received' },
  'Pending':        { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Order Received' },
  'Packing':        { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Kitchen / Preparing' },
  'Preparing':      { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Kitchen / Preparing' },
  'Out for Delivery': { color: 'bg-amber-400/20 text-amber-300 border-amber-400/30', label: 'Out for Delivery' },
  'Delivered':      { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Delivered' },
};

const TRACKING_STEPS = [
  { value: 'Order Received', label: 'Received', icon: '📦' },
  { value: 'Preparing', label: 'Kitchen', icon: '☕' },
  { value: 'Out for Delivery', label: 'On Way', icon: '🛵' },
  { value: 'Delivered', label: 'Delivered', icon: '✅' },
];

function TrackingBar({ status }) {
  const normalize = (s) => {
    if (s === 'Pending') return 'Order Received';
    if (s === 'Packing') return 'Preparing';
    return s;
  };
  const current = normalize(status);
  const currentIdx = TRACKING_STEPS.findIndex((s) => s.value === current);

  return (
    <div className="flex items-center gap-0 w-full py-1">
      {TRACKING_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <React.Fragment key={step.value}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                  isDone
                    ? isCurrent
                      ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-md shadow-amber-500/30 font-black scale-105'
                      : 'bg-amber-900/60 border-amber-600/40 text-amber-300'
                    : 'bg-stone-800 border-stone-700 text-stone-500'
                }`}
              >
                <span>{step.icon}</span>
              </div>
              <p
                className={`text-[9px] font-bold text-center leading-tight ${
                  isCurrent ? 'text-amber-300' : isDone ? 'text-stone-300' : 'text-stone-600'
                }`}
                style={{ width: 44 }}
              >
                {step.label}
              </p>
            </div>
            {idx < TRACKING_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                  idx < currentIdx ? 'bg-amber-500' : 'bg-stone-800'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const RiderDashboardPage = () => {
  // Rider Session State
  const [activeRider, setActiveRider] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Orders & Fleet State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deliveringId, setDeliveringId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [toast, setToast] = useState(null);

  // OTP Verification Modal
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [riderOtpInput, setRiderOtpInput] = useState('');
  const [riderOtpError, setRiderOtpError] = useState('');
  const [riderOtpVerifying, setRiderOtpVerifying] = useState(false);

  // Live GPS Tracking Broadcaster State
  const [isSharingGps, setIsSharingGps] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch available staff list for quick login / demo
  useEffect(() => {
    const q = collection(db, 'staff');
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAvailableRiders(list);

      if (activeRider) {
        const updated = list.find((r) => r.id === activeRider.id);
        if (updated) setActiveRider(updated);
      }
    });

    return () => unsub();
  }, [activeRider?.id]);

  // Check if any rider is currently logged in or persisted in localStorage
  useEffect(() => {
    const savedRider = localStorage.getItem('agf_active_rider');
    if (savedRider && !activeRider) {
      try {
        const parsed = JSON.parse(savedRider);
        setActiveRider(parsed);
      } catch (e) {
        localStorage.removeItem('agf_active_rider');
      }
    }
  }, []);

  // 2. Real-time listen to orders assigned to active rider
  useEffect(() => {
    if (!activeRider?.id) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);

    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      const riderOrders = allOrders.filter(
        (o) =>
          o.assignedPartnerId === activeRider.id ||
          o.assignedPartnerPhone === activeRider.phone ||
          (o.assignedPartnerName && o.assignedPartnerName.toLowerCase() === activeRider.name.toLowerCase())
      );

      // Sort: Active first, then by time
      riderOrders.sort((a, b) => {
        const aActive = a.status !== 'Delivered' && a.status !== 'Cancelled';
        const bActive = b.status !== 'Delivered' && b.status !== 'Cancelled';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return 0;
      });

      setOrders(riderOrders);
      setLoadingOrders(false);
    }, (err) => {
      console.warn("Rider orders subscription error:", err);
      setLoadingOrders(false);
    });

    return () => unsub();
  }, [activeRider?.id, activeRider?.phone, activeRider?.name]);

  // 3. Live GPS Geolocation Broadcaster to Firestore
  useEffect(() => {
    if (!isSharingGps || !navigator.geolocation || !activeRider?.id) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
        const heading = pos.coords.heading || 0;
        const timestamp = new Date().toISOString();

        setGpsCoords({ lat, lng, speed, heading, timestamp });
        setGpsError('');

        // Broadcast to Rider Staff Document in Firestore
        try {
          updateDoc(doc(db, 'staff', activeRider.id), {
            location: { lat, lng, speed, heading, updatedAt: timestamp }
          }).catch(() => {});

          // Broadcast to active assigned orders
          const active = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
          for (const ord of active) {
            updateDoc(doc(db, 'orders', ord.id), {
              riderLocation: { lat, lng, speed, heading, updatedAt: timestamp }
            }).catch(() => {});
          }
        } catch (e) {
          // ignore
        }
      },
      (err) => {
        console.warn("GPS Location Error:", err);
        setGpsError('GPS permission not enabled on device. Please allow location access for turn-by-turn navigation.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharingGps, activeRider?.id, orders.length]);

  // Handle Rider Login
  const handleRiderLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      let matchedStaff = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword.trim());
        const staffSnap = await getDocs(
          query(collection(db, 'staff'), where('email', '==', cred.user.email.toLowerCase()))
        );
        if (!staffSnap.empty) {
          matchedStaff = { id: staffSnap.docs[0].id, ...staffSnap.docs[0].data() };
        }
      } catch (authErr) {
        console.warn("Auth sign-in fallback:", authErr);
      }

      if (!matchedStaff) {
        const found = availableRiders.find(
          (r) =>
            r.email?.toLowerCase() === loginEmail.trim().toLowerCase() ||
            r.phone === loginEmail.trim()
        );
        if (found) {
          matchedStaff = found;
        }
      }

      if (matchedStaff) {
        setActiveRider(matchedStaff);
        localStorage.setItem('agf_active_rider', JSON.stringify(matchedStaff));
        showToast(`Welcome back, ${matchedStaff.name}! 🛵`);
      } else {
        setLoginError('No delivery partner account found with these credentials. Please contact cafe manager.');
      }
    } catch (err) {
      console.error("Rider login error:", err);
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick Demo Select Login
  const handleQuickSelectRider = (rider) => {
    setActiveRider(rider);
    localStorage.setItem('agf_active_rider', JSON.stringify(rider));
    showToast(`Logged in as ${rider.name}`);
  };

  // Handle Rider Logout
  const handleRiderLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setActiveRider(null);
    localStorage.removeItem('agf_active_rider');
    showToast('Logged out of Delivery Fleet');
  };

  // Toggle Duty Status (Available / On Duty / Offline)
  const handleStatusToggle = async (newStatus) => {
    if (!activeRider?.id) return;
    try {
      await updateDoc(doc(db, 'staff', activeRider.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setActiveRider((prev) => ({ ...prev, status: newStatus }));
      showToast(`Duty Status: ${newStatus}`);
    } catch (err) {
      console.error("Status toggle error:", err);
      showToast('Failed to update status', 'error');
    }
  };

  // Mark as Delivered handler with OTP verification
  const handleMarkDelivered = async (order) => {
    if (deliveringId) return;
    setDeliveringId(order.id);

    try {
      // 1. Mark order as Delivered in Firestore
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Delivered',
        deliveredAt: new Date().toISOString(),
        riderOtpVerified: true,
        updatedAt: serverTimestamp(),
      });

      // 2. Update staff active orders & stats
      if (activeRider?.id) {
        const remainingActive = activeOrders.filter(
          (o) => o.id !== order.id && o.status !== 'Delivered' && o.status !== 'Cancelled'
        ).length;

        await updateDoc(doc(db, 'staff', activeRider.id), {
          activeOrders: remainingActive,
          status: remainingActive === 0 ? 'Available' : 'On Duty',
          totalDeliveries: (activeRider?.totalDeliveries || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }

      showToast(`Order #${order.orderId || order.id.slice(0, 8)} Delivered! 🎉`);
    } catch (err) {
      console.error('Mark delivered error:', err);
      showToast('Error marking delivered. Try again.', 'error');
    } finally {
      setDeliveringId(null);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');

  // ==========================================
  // VIEW 1: RIDER LOGIN SCREEN
  // ==========================================
  if (!activeRider) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-stone-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Bike className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-white font-serif">AGF-CAFE Delivery Fleet</h1>
            <p className="text-xs text-stone-400">
              Delivery Boy Portal · Access assigned cafe orders, turn-by-turn routes, and customer handover PIN verification
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleRiderLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">
                Rider Email or Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="rider@agfcafe.com or +91..."
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  <Bike className="w-4 h-4" /> Sign In to Delivery Panel
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          {availableRiders.length > 0 && (
            <div className="pt-4 border-t border-stone-800 space-y-2">
              <p className="text-[11px] font-bold text-stone-400 text-center">
                ⚡ Quick Demo Mode: Click to launch as Rider
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {availableRiders.map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => handleQuickSelectRider(rider)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-950/70 hover:bg-stone-800 border border-stone-800 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {rider.name ? rider.name[0].toUpperCase() : 'R'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-300">{rider.name}</p>
                        <p className="text-[10px] text-stone-400">{rider.vehicle || 'Bike'} · {rider.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/" className="text-xs font-bold text-stone-500 hover:text-amber-400 transition-colors">
              ← Return to Cafe Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE RIDER DASHBOARD (PORTAL)
  // ==========================================
  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans p-3 sm:p-6 space-y-5 animate-in fade-in">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-black transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">AGF-CAFE Fleet</p>
            <h1 className="text-sm font-black text-white leading-none">Delivery Partner Portal</h1>
          </div>
        </div>

        <button
          onClick={handleRiderLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all border border-rose-500/20 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </header>

      <main className="max-w-xl mx-auto space-y-5">
        {/* Rider Profile Card */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-900/90 border border-amber-500/20 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-2xl shadow-lg">
                {activeRider?.name ? activeRider.name[0].toUpperCase() : 'R'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">{activeRider?.name || 'Rider'}</h2>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {activeRider?.id}
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-amber-500" /> {activeRider?.vehicle || 'Delivery Partner'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-amber-400">
                    {activeRider?.rating ? activeRider.rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-[10px] text-stone-400">· {activeRider?.totalDeliveries || 0} lifetime deliveries</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <select
                value={activeRider?.status || 'Available'}
                onChange={(e) => handleStatusToggle(e.target.value)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-black border transition-all cursor-pointer focus:outline-none ${
                  activeRider?.status === 'On Duty'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : activeRider?.status === 'Offline'
                    ? 'bg-stone-800 text-stone-400 border-stone-700'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <option value="Available" className="bg-stone-900 text-white">🟢 Available</option>
                <option value="On Duty" className="bg-stone-900 text-white">🟡 On Duty</option>
                <option value="Offline" className="bg-stone-900 text-white">⚪ Offline</option>
              </select>
              <p className="text-[9px] text-stone-500 mt-1 font-bold">Tap to toggle duty</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-xl font-black text-amber-400">{activeOrders.length}</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase">Active Orders</p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="text-xl font-black text-white">{deliveredOrders.length}</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase">Today Done</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-emerald-400">{activeRider?.totalDeliveries || 0}</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase">Total Done</p>
            </div>
          </div>
        </div>

        {/* Live GPS Geolocation Broadcaster HUD Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  isSharingGps
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-stone-800 text-stone-500 border-stone-700'
                }`}
              >
                <Radio className={`w-5 h-5 ${isSharingGps ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  Live GPS Broadcaster
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSharingGps ? 'bg-emerald-400 animate-ping' : 'bg-stone-600'
                    }`}
                  />
                </h3>
                <p className="text-[10px] text-stone-400">
                  {isSharingGps ? 'Sharing live phone coordinates with Cafe & Customer' : 'GPS Sharing Inactive'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSharingGps(!isSharingGps)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                isSharingGps
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              {isSharingGps ? 'GPS ACTIVE 🟢' : 'ENABLE GPS 📡'}
            </button>
          </div>

          {isSharingGps && (
            <div className="bg-stone-950/80 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs font-bold text-stone-300">
              <div className="flex items-center gap-2">
                <Locate className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-[11px]">
                  {gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : 'Fetching live device coordinates...'}
                </span>
              </div>
              {gpsCoords?.speed > 0 && (
                <span className="text-[11px] text-amber-400 font-black bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                  ⚡ {gpsCoords.speed} km/h
                </span>
              )}
            </div>
          )}

          {gpsError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Active Assigned Orders Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Active Cafe Deliveries ({activeOrders.length})
            </h2>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center text-stone-500 text-xs font-bold">
              <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
              Checking assigned orders...
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-stone-800/80 flex items-center justify-center text-stone-500">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-black text-stone-300">No active orders assigned</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  You are currently marked as {activeRider?.status || 'Available'}. When the cafe kitchen dispatches an order to you, it will appear here in real time!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Order Received'];
                const isExpanded = expandedOrder === order.id;
                const isDelivering = deliveringId === order.id;
                const destinationAddress = typeof order.deliveryAddress === 'string' 
                  ? order.deliveryAddress 
                  : order.shippingAddress?.addressLine1 || 'Cafe Customer Delivery Address';

                return (
                  <div
                    key={order.id}
                    className="bg-stone-900/90 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl space-y-4"
                  >
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-black text-amber-400 tracking-wider">
                            #{order.orderId || order.id.slice(0, 8)}
                          </span>
                          <h3 className="text-base font-black text-white mt-0.5">
                            {order.customerName || 'Customer'}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <TrackingBar status={order.status} />

                      <div className="space-y-2">
                        {/* Pickup Location Info */}
                        <div className="flex items-center justify-between bg-stone-950/80 rounded-2xl p-3 border border-white/5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">☕</span>
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-amber-400 block">Pickup Hub</span>
                              <p className="text-xs text-stone-200 font-bold truncate">AGF Cafe, Main Boulevard</p>
                            </div>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${AGF_CAFE_HUB.lat},${AGF_CAFE_HUB.lng}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" /> Cafe Pickup
                          </a>
                        </div>

                        {/* Drop Location Info */}
                        <div className="flex items-start gap-2.5 bg-stone-950/80 rounded-2xl p-3 border border-white/5">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold text-emerald-400">Customer Drop</span>
                              {(order.roadDistanceKm || order.distanceKm) && (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  ~{parseFloat(order.roadDistanceKm || order.distanceKm).toFixed(1)} km Road
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-200 font-medium leading-relaxed mt-0.5">
                              {destinationAddress}
                            </p>
                          </div>
                        </div>

                        {/* Customer Delivery Instructions (Quick Notes) */}
                        {order.deliveryInstructions && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs font-bold text-amber-300 flex items-start gap-2">
                            <span className="text-sm shrink-0">📝</span>
                            <div>
                              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">Customer Instruction</span>
                              <p className="text-xs text-stone-200 mt-0.5">{order.deliveryInstructions}</p>
                            </div>
                          </div>
                        )}

                        {/* Customer Contact Row: Direct Phone & WhatsApp */}
                        {order.customerPhone && (
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="flex items-center justify-center gap-2 bg-stone-950/80 hover:bg-stone-800 rounded-2xl p-3 border border-white/5 transition-colors text-xs font-bold text-emerald-300"
                            >
                              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Call Customer</span>
                            </a>

                            <a
                              href={`https://api.whatsapp.com/send?phone=91${order.customerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hi ${order.customerName || 'Customer'}, I am your AGF Cafe delivery partner on the way with your order #${order.orderId || order.id.slice(0, 8)}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-2xl p-3 border border-emerald-500/30 transition-colors text-xs font-bold text-emerald-300"
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-950/60 border border-white/5 text-xs">
                        <span className="text-stone-400 font-bold">Payment Mode</span>
                        <span className="font-black text-amber-400">
                          {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Prepaid (Online)'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-stone-800/50 hover:bg-stone-800 transition-colors text-xs font-bold text-stone-300"
                      >
                        <span>
                          {order.items?.length || 0} Cafe Items · ₹{(order.totalAmount || order.grandTotal || 0).toFixed(2)}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="bg-stone-950/80 rounded-2xl p-3 space-y-2 border border-white/5">
                          {order.items?.map((item, i) => {
                            const qty = item.qty || item.quantity || 1;
                            return (
                              <div key={i} className="flex justify-between text-xs text-stone-300">
                                <span>{qty}x {item.name || item.title}</span>
                                <span className="font-bold text-white">₹{(qty * (item.price || 0)).toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-black">
                            <span className="text-stone-300">Total Order Amount</span>
                            <span className="text-amber-400">₹{(order.totalAmount || order.grandTotal || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5 space-y-2.5">
                      <a
                        href={
                          order.customerCoords?.lat && order.customerCoords?.lng
                            ? `https://www.google.com/maps/dir/?api=1&origin=${AGF_CAFE_HUB.lat},${AGF_CAFE_HUB.lng}&destination=${order.customerCoords.lat},${order.customerCoords.lng}&travelmode=driving`
                            : order.lat && order.lng
                            ? `https://www.google.com/maps/dir/?api=1&origin=${AGF_CAFE_HUB.lat},${AGF_CAFE_HUB.lng}&destination=${order.lat},${order.lng}&travelmode=driving`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-stone-800 via-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-amber-300 text-xs font-black flex items-center justify-center gap-2 border border-amber-500/40 transition-all shadow-md active:scale-98"
                      >
                        <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Open Turn-by-Turn Google Navigation</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setRiderOtpInput('');
                          setRiderOtpError('');
                          setOtpModalOrder(order);
                        }}
                        disabled={isDelivering}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 active:scale-98 cursor-pointer disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        Mark as Delivered (Verify PIN)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Deliveries Today */}
        {deliveredOrders.length > 0 && (
          <div className="pt-4 border-t border-stone-800 space-y-2.5">
            <h2 className="text-xs font-black text-stone-400 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed Today ({deliveredOrders.length})
            </h2>
            <div className="space-y-2">
              {deliveredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-mono font-bold text-amber-400 text-[11px]">#{ord.orderId || ord.id.slice(0, 8)}</p>
                    <p className="font-bold text-white mt-0.5">{ord.customerName || 'Customer'}</p>
                    <p className="text-[10px] text-stone-400">₹{(ord.totalAmount || ord.grandTotal || 0).toFixed(2)}</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    ✓ Handed Over
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CUSTOMER HANDOVER PIN VERIFICATION MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-stone-900 w-full max-w-sm rounded-3xl border border-amber-500/30 shadow-2xl p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Enter Handover PIN</h3>
                  <p className="text-xs text-stone-400">
                    Order #{otpModalOrder.orderId || otpModalOrder.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpModalOrder(null);
                  setRiderOtpInput('');
                  setRiderOtpError('');
                }}
                className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-300 block">
                Ask the customer for the 4-digit Delivery PIN shown on their cafe screen:
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={riderOtpInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setRiderOtpInput(val);
                  setRiderOtpError('');
                }}
                placeholder="4-digit PIN"
                className={`w-full text-center text-3xl font-black tracking-[0.4em] py-4 px-4 rounded-2xl border-2 transition-all focus:outline-none bg-stone-950 ${
                  riderOtpError
                    ? 'border-rose-500 text-rose-300 focus:ring-4 focus:ring-rose-500/20'
                    : 'border-stone-700 text-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20'
                }`}
                autoFocus
              />

              {riderOtpError && (
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {riderOtpError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOtpModalOrder(null);
                  setRiderOtpInput('');
                  setRiderOtpError('');
                }}
                disabled={riderOtpVerifying}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={riderOtpInput.length < 4 || riderOtpVerifying}
                onClick={async () => {
                  setRiderOtpVerifying(true);
                  setRiderOtpError('');
                  try {
                    const cleanTargetOtp = String(otpModalOrder.deliveryOtp || '').trim();
                    const cleanInput = riderOtpInput.trim();

                    if (cleanTargetOtp && cleanInput === cleanTargetOtp) {
                      await handleMarkDelivered(otpModalOrder);
                      setOtpModalOrder(null);
                      setRiderOtpInput('');
                    } else if (!cleanTargetOtp) {
                      await handleMarkDelivered(otpModalOrder);
                      setOtpModalOrder(null);
                      setRiderOtpInput('');
                    } else {
                      setRiderOtpError('Incorrect PIN. Please re-check with the customer.');
                    }
                  } catch (err) {
                    console.error("PIN check error:", err);
                    setRiderOtpError('Verification failed. Please try again.');
                  } finally {
                    setRiderOtpVerifying(false);
                  }
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {riderOtpVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Verify & Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
