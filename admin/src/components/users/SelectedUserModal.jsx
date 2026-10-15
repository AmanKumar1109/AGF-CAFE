import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  StickyNote,
  BarChart2,
  Save,
  Loader2,
  Heart,
  Tag,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export const SelectedUserModal = ({ user, onClose, onUserUpdated }) => {
  if (!user) return null;

  const [isBlocking, setIsBlocking] = useState(false);
  const [noteText, setNoteText] = useState(user.adminNote || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // Helper date formatter
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      if (typeof val?.toDate === 'function') {
        return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const d = new Date(val);
      if (isNaN(d)) return String(val);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      if (typeof val?.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      }
      const d = new Date(val);
      if (isNaN(d)) return String(val);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // Block / Unblock Toggle Handler
  const handleBlockToggle = async () => {
    if (!user.isFromFirestore || !user.id) {
      alert("This is a guest customer record generated from orders. Only registered Firestore accounts can be blocked.");
      return;
    }

    setIsBlocking(true);
    try {
      const newStatus = !user.isBlocked;
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        isBlocked: newStatus,
        updatedAt: serverTimestamp()
      });
      user.isBlocked = newStatus;
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error('Failed to toggle block status:', err);
      alert('Could not update user status. Please check Firestore permissions.');
    } finally {
      setIsBlocking(false);
    }
  };

  // Admin Note Save Handler
  const handleSaveNote = async () => {
    if (!user.isFromFirestore || !user.id) {
      alert("Remarks can be saved for registered accounts.");
      return;
    }

    setIsSavingNote(true);
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        adminNote: noteText,
        updatedAt: serverTimestamp()
      });
      user.adminNote = noteText;
      setNoteSavedSuccess(true);
      setTimeout(() => setNoteSavedSuccess(false), 2500);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error('Failed to save admin note:', err);
      alert('Failed to save note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  // 6-Month Spending Trend Computation
  const spendingTrend = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      months[label] = 0;
    }

    (user.ordersList || []).forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (s === 'cancelled' || s === 'rejected') return;
      const d = new Date(o.createdAt || o.orderTime);
      if (isNaN(d)) return;
      const label = d.toLocaleString('en-US', { month: 'short' });
      if (months[label] !== undefined) {
        months[label] += Number(o.totalAmount) || 0;
      }
    });

    const maxVal = Math.max(...Object.values(months), 1);
    return Object.keys(months).map(label => ({
      label,
      value: months[label],
      percent: Math.round((months[label] / maxVal) * 100)
    }));
  }, [user.ordersList]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        label: 'Delivered'
      };
    }
    if (s === 'preparing') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Package,
        label: 'Preparing'
      };
    }
    if (s === 'out for delivery') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Truck,
        label: 'On the Way'
      };
    }
    if (s === 'cancelled') {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
        label: 'Cancelled'
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Clock,
      label: status || 'Received'
    };
  };

  // Wishlist Items
  const wishlistItems = Array.isArray(user.wishlist) ? user.wishlist : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 shrink-0 bg-slate-50/50 rounded-t-3xl">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {/* Avatar / Initials */}
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20">
                  {(user.name || '?')[0].toUpperCase()}
                </div>
              )}
              {user.isBlocked && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white" title="Account Blocked" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-serif">
                  {user.name}
                </h2>
                {user.smartTags && user.smartTags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${tag.color}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                <span>Customer since {formatDate(user.createdAt)}</span>
                {user.isFromFirestore ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                    Registered Profile
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200">
                    Guest Order Customer
                  </span>
                )}
                {user.isBlocked && (
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-200">
                    Suspended
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {user.isFromFirestore && (
              <button
                onClick={handleBlockToggle}
                disabled={isBlocking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  user.isBlocked
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                } disabled:opacity-50`}
                title={user.isBlocked ? 'Click to unblock user' : 'Click to block user from placing orders'}
              >
                {isBlocking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : user.isBlocked ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {user.isBlocked ? 'Unblock User' : 'Block User'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            
            {/* ================= LEFT COLUMN ================= */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" /> Phone Number
                  </p>
                  {user.phone ? (
                    <a
                      href={`tel:${user.phone}`}
                      className="text-sm font-bold text-slate-800 hover:text-amber-600 transition-colors flex items-center justify-between group"
                    >
                      <span>{user.phone}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Not provided</p>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Address
                  </p>
                  {user.email ? (
                    <a
                      href={`mailto:${user.email}`}
                      className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors break-all flex items-center justify-between group"
                    >
                      <span>{user.email}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0 ml-1" />
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Not provided</p>
                  )}
                </div>
              </div>

              {/* Delivery Address Book */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Delivery Addresses
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">
                    {Array.isArray(user.addresses) ? `${user.addresses.length} saved` : '1 recorded'}
                  </span>
                </div>

                {Array.isArray(user.addresses) && user.addresses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {user.addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          addr.isPrimary || idx === 0
                            ? 'bg-amber-50/60 border-amber-200/80'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{addr.name || user.name}</span>
                          <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200">
                            {addr.type || 'Home'}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          {[addr.houseNo, addr.street, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ')}
                        </p>
                        {addr.phone && (
                          <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {addr.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : user.address ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <p className="font-medium">{user.address}</p>
                    {(user.city || user.pincode) && (
                      <p className="text-slate-500 mt-0.5">
                        {[user.city, user.pincode].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No delivery address recorded yet.</p>
                )}
              </div>

              {/* Financial Health Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Orders</p>
                  <p className="text-xl font-black text-slate-900 font-mono">{user.totalOrders}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Spent</p>
                  <p className="text-lg font-black text-amber-600 font-mono">
                    ₹{Math.round(user.totalSpent).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">AOV</p>
                  <p className="text-lg font-black text-emerald-600 font-mono">
                    ₹{user.totalOrders > 0 ? Math.round(user.totalSpent / user.totalOrders).toLocaleString('en-IN') : 0}
                  </p>
                </div>
              </div>

              {/* 6-Month Monthly Spending Trend Bar Chart */}
              {user.totalOrders > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <BarChart2 className="w-3.5 h-3.5 text-blue-500" /> Spending Trend (6 Months)
                    </h4>
                  </div>
                  <div className="flex items-end justify-between gap-2 h-24 pt-4">
                    {spendingTrend.map((data, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
                        <div className="w-full bg-slate-200/80 rounded-t-md h-full flex items-end relative">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
                            style={{ height: `${Math.max(data.percent, data.value > 0 ? 10 : 0)}%` }}
                          />
                          {/* Tooltip on hover */}
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            ₹{data.value.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Private Admin Notes */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <StickyNote className="w-3.5 h-3.5 text-amber-600" /> Internal Staff Notes
                  </h4>
                  {noteSavedSuccess && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Saved ✓
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write internal remarks or preferences about this customer (e.g. prefers extra hot coffee, reliable customer)..."
                    className="w-full h-22 bg-white border border-amber-200/90 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-all placeholder:text-amber-700/40"
                  />
                  {noteText !== (user.adminNote || '') && (
                    <button
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="absolute bottom-2.5 right-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-3 py-1 rounded-lg text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>Save Note</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SAVED / WISHLIST PRODUCTS SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 font-serif">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>Saved / Wishlist Dishes</span>
                    <span className="text-xs font-bold text-slate-400 font-mono">({wishlistItems.length})</span>
                  </h3>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100 text-center">
                    <Heart className="w-8 h-8 text-rose-200 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-500">No saved dishes yet</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">This customer hasn't added dishes to their wishlist</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {wishlistItems.map((item, idx) => {
                      const dish = typeof item === 'object' ? item : { id: item, name: 'Cafe Dish', price: 0 };
                      return (
                        <div
                          key={dish.id || idx}
                          className="bg-slate-50 hover:bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all"
                        >
                          <img
                            src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                            alt={dish.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{dish.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{dish.category || 'Special'}</p>
                            <p className="text-xs font-black text-amber-600 mt-1 font-mono">₹{dish.price}</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Wishlisted" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ORDER HISTORY TIMELINE SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 font-serif">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Complete Order History</span>
                    <span className="text-xs font-bold text-slate-400 font-mono">({user.ordersList?.length || 0})</span>
                  </h3>
                </div>

                {!user.ordersList || user.ordersList.length === 0 ? (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center">
                    <ShoppingBag className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No orders placed yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">When this customer orders, their meals will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {user.ordersList
                      .slice()
                      .sort((a, b) => new Date(b.createdAt || b.orderTime) - new Date(a.createdAt || a.orderTime))
                      .map((order, idx) => {
                        const badge = getStatusBadge(order.status);
                        const BadgeIcon = badge.icon;
                        const items = Array.isArray(order.items) ? order.items : [];

                        return (
                          <div
                            key={order.id || idx}
                            className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3"
                          >
                            {/* Order Header Bar */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-slate-900">
                                  #{String(order.id).slice(-6).toUpperCase()}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  {formatDateTime(order.createdAt || order.orderTime)}
                                </span>
                              </div>

                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                <BadgeIcon className="w-3 h-3" />
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            {/* Items List */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                              {items.map((it, itIdx) => (
                                <div key={itIdx} className="flex justify-between items-center">
                                  <span className="font-medium text-slate-800">
                                    <span className="font-bold text-amber-600 font-mono">x{it.quantity || it.qty || 1}</span> {it.name}
                                  </span>
                                  <span className="font-mono text-slate-500">
                                    ₹{((it.price || 0) * (it.quantity || it.qty || 1))}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Order Footer */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                              <div className="text-[11px] text-slate-500">
                                <span>Payment: </span>
                                <span className="font-bold text-slate-700 uppercase">
                                  {order.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online UPI'}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[11px] text-slate-400 mr-1.5">Total:</span>
                                <span className="text-sm font-black text-slate-900 font-mono">
                                  ₹{order.totalAmount || order.grandTotal || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
