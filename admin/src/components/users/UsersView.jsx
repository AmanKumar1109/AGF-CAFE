import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Download,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { SelectedUserModal } from './SelectedUserModal';
import gsap from 'gsap';

export const UsersView = () => {
  const { orders } = useAdminOrders();
  const [firestoreUsers, setFirestoreUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);

  const containerRef = useRef(null);

  // Subscribe to Firestore 'users' collection in real-time
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setFirestoreUsers(list);
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Error listening to users collection:', error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper date parsing
  const getTimeMs = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (val.seconds) return val.seconds * 1000;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

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

  // Helper to extract clean 10-digit phone
  const getCleanPhone = (p) => {
    if (!p) return '';
    const digits = String(p).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const isGenericName = (n) => {
    if (!n || typeof n !== 'string') return true;
    const lower = n.trim().toLowerCase();
    return (
      !lower ||
      lower === 'unknown' ||
      lower === 'cafe customer' ||
      lower === 'valued customer' ||
      lower === 'customer' ||
      lower === 'user' ||
      lower === 'member' ||
      lower === 'n/a'
    );
  };

  // Merge Firestore registered users + guest order customers
  const enrichedUsers = useMemo(() => {
    const userList = [];
    const phoneMap = new Map();
    const emailMap = new Map();
    const idMap = new Map();

    // 1. Process registered users
    firestoreUsers.forEach((u) => {
      const cleanPhone = getCleanPhone(u.phone || u.phoneNumber || u.mobile);
      const emailKey = (u.email || '').toLowerCase();
      const idKey = (u.id || u.uid || '').toLowerCase();

      const userObj = {
        id: u.id || u.uid,
        name: u.name || u.displayName || '',
        email: u.email || '',
        phone: u.phone || u.phoneNumber || '',
        photoURL: u.photoURL || '',
        address: u.address || (Array.isArray(u.addresses) && u.addresses[0] ? u.addresses[0] : ''),
        addresses: Array.isArray(u.addresses) ? u.addresses : [],
        wishlist: Array.isArray(u.wishlist) ? u.wishlist : [],
        createdAt: u.createdAt || '',
        isBlocked: u.isBlocked || false,
        adminNote: u.adminNote || '',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: '',
        lastOrderStatus: '',
        ordersList: [],
        isFromFirestore: true
      };

      userList.push(userObj);
      if (cleanPhone) phoneMap.set(cleanPhone, userObj);
      if (emailKey) emailMap.set(emailKey, userObj);
      if (idKey) idMap.set(idKey, userObj);
    });

    const findUser = (phone, email, uid) => {
      const cleanId = (uid || '').toLowerCase();
      if (cleanId && idMap.has(cleanId)) return idMap.get(cleanId);
      const cleanP = getCleanPhone(phone);
      if (cleanP && phoneMap.has(cleanP)) return phoneMap.get(cleanP);
      const cleanE = (email || '').toLowerCase();
      if (cleanE && emailMap.has(cleanE)) return emailMap.get(cleanE);
      return null;
    };

    // 2. Process all orders to attribute and discover guest customers
    orders.forEach((order) => {
      const phone = order.customerPhone || order.shippingAddress?.phone || order.phone || '';
      const email = order.customerEmail || order.email || '';
      const uid = order.userId || order.customerId || '';
      const rawName = order.customerName || order.shippingAddress?.fullName || order.name || '';
      const orderName = isGenericName(rawName) ? '' : rawName.trim();

      let userObj = findUser(phone, email, uid);

      if (!userObj) {
        const cleanP = getCleanPhone(phone);
        const cleanE = (email || '').toLowerCase();
        const fallbackKey = cleanP || cleanE || uid || order.id;

        if (!fallbackKey) return;

        userObj = {
          id: uid || `guest-${fallbackKey}`,
          name: orderName,
          email: email,
          phone: phone,
          photoURL: '',
          address: order.shippingAddress?.addressLine1 || order.address || '',
          addresses: order.shippingAddress ? [order.shippingAddress] : [],
          wishlist: [],
          createdAt: order.createdAt || '',
          isBlocked: false,
          adminNote: '',
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: '',
          lastOrderStatus: '',
          ordersList: [],
          isFromFirestore: false
        };

        userList.push(userObj);
        if (cleanP) phoneMap.set(cleanP, userObj);
        if (cleanE) emailMap.set(cleanE, userObj);
        if (uid) idMap.set(uid.toLowerCase(), userObj);
      }

      // Backfill missing name with real name from order
      if (isGenericName(userObj.name) && orderName) {
        userObj.name = orderName;
      }

      userObj.totalOrders += 1;
      const amt = Number(order.totalAmount || order.grandTotal) || 0;
      userObj.totalSpent += amt;

      const orderDate = order.createdAt || '';
      if (!userObj.lastOrderDate || getTimeMs(orderDate) > getTimeMs(userObj.lastOrderDate)) {
        userObj.lastOrderDate = orderDate;
        userObj.lastOrderStatus = order.status || '';
      }

      userObj.ordersList.push(order);
    });

    // 3. Fallback name resolution & smart customer segmentation tags
    const now = new Date();
    userList.forEach((user) => {
      if (isGenericName(user.name)) {
        if (user.email) {
          const prefix = user.email.split('@')[0];
          user.name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else if (user.phone) {
          user.name = `Customer (${user.phone})`;
        } else {
          user.name = 'Cafe Guest';
        }
      }

      const tags = [];
      const lastOrderTime = user.lastOrderDate ? getTimeMs(user.lastOrderDate) : null;
      const joinedTime = user.createdAt ? getTimeMs(user.createdAt) : null;

      const daysSinceLastOrder = lastOrderTime ? (now.getTime() - lastOrderTime) / (1000 * 60 * 60 * 24) : Infinity;
      const daysSinceJoined = joinedTime ? (now.getTime() - joinedTime) / (1000 * 60 * 60 * 24) : Infinity;

      if (user.totalSpent >= 5000 || user.totalOrders >= 15) {
        tags.push({ label: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' });
      } else if (user.totalOrders >= 5) {
        tags.push({ label: 'Frequent', color: 'bg-blue-100 text-blue-800 border-blue-300' });
      }

      if (user.totalOrders === 0 && daysSinceJoined <= 14) {
        tags.push({ label: 'Newbie', color: 'bg-teal-100 text-teal-800 border-teal-300' });
      }

      if (user.totalOrders > 0 && daysSinceLastOrder > 30) {
        tags.push({ label: 'At Risk', color: 'bg-rose-100 text-rose-800 border-rose-300' });
      }

      if (user.totalOrders > 0 && daysSinceLastOrder <= 7 && !tags.some(t => t.label === 'VIP' || t.label === 'Frequent')) {
        tags.push({ label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' });
      }

      user.smartTags = tags;
    });

    return userList;
  }, [firestoreUsers, orders]);

  // Filter & Sort
  const filteredUsers = useMemo(() => {
    let result = enrichedUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);

      const isActive = u.totalOrders > 0;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && isActive) ||
        (statusFilter === 'Inactive' && !isActive) ||
        (statusFilter === 'Registered' && u.isFromFirestore);

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return getTimeMs(b.createdAt) - getTimeMs(a.createdAt);
        case 'oldest':
          return getTimeMs(a.createdAt) - getTimeMs(b.createdAt);
        case 'most-orders':
          return b.totalOrders - a.totalOrders;
        case 'highest-spend':
          return b.totalSpent - a.totalSpent;
        case 'name-az':
          return String(a.name || '').localeCompare(String(b.name || ''));
        default:
          return 0;
      }
    });

    return result;
  }, [enrichedUsers, searchQuery, statusFilter, sortBy]);

  // Top KPI Metrics
  const metrics = useMemo(() => {
    const total = enrichedUsers.length;
    const registered = enrichedUsers.filter((u) => u.isFromFirestore).length;
    const active = enrichedUsers.filter((u) => u.totalOrders > 0).length;
    const totalRevenue = enrichedUsers.reduce((s, u) => s + u.totalSpent, 0);
    const avgSpend = active > 0 ? Math.round(totalRevenue / active) : 0;
    return { total, registered, active, totalRevenue, avgSpend };
  }, [enrichedUsers]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Email', 'Type', 'Total Orders', 'Total Spent (Rs)', 'Last Order Date', 'Tags'];
    const rows = filteredUsers.map((u) => {
      const tagLabels = (u.smartTags || []).map((t) => t.label).join('; ');
      return [
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${u.phone || ''}"`,
        `"${u.email || ''}"`,
        u.isFromFirestore ? 'Registered' : 'Guest',
        u.totalOrders,
        u.totalSpent,
        `"${formatDate(u.lastOrderDate)}"`,
        `"${tagLabels}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `agf_cafe_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Helper for Last Order
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return { bg: 'bg-emerald-100 text-emerald-800', label: 'Delivered' };
    if (s === 'preparing') return { bg: 'bg-amber-100 text-amber-800', label: 'Preparing' };
    if (s === 'out for delivery') return { bg: 'bg-blue-100 text-blue-800', label: 'On Way' };
    if (s === 'cancelled') return { bg: 'bg-rose-100 text-rose-800', label: 'Cancelled' };
    return { bg: 'bg-slate-100 text-slate-700', label: status || 'Pending' };
  };

  // GSAP light entrance
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.gsap-fade'),
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Customer Directory
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
              <Users className="w-3.5 h-3.5" />
              <span>{metrics.total} Customers</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time profiles, contact details, delivery addresses, order history, and spending insights
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:bg-slate-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 4 Top KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gsap-fade bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{metrics.total}</p>
          <p className="text-xs text-slate-400 font-medium">{metrics.registered} Registered Profiles</p>
        </div>

        <div className="gsap-fade bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Active Customers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{metrics.active}</p>
          <p className="text-xs text-slate-400 font-medium">
            {metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}% conversion rate` : '0%'}
          </p>
        </div>

        <div className="gsap-fade bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Customer LTV</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            ₹{Math.round(metrics.totalRevenue).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 font-medium">Lifetime revenue generated</p>
        </div>

        <div className="gsap-fade bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Avg Spend / User</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
            ₹{metrics.avgSpend.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 font-medium">Per active ordering customer</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, email, or UID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Filter Pills + Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {['All', 'Active', 'Inactive', 'Registered'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Joined</option>
              <option value="oldest">Oldest Joined</option>
              <option value="most-orders">Most Orders</option>
              <option value="highest-spend">Highest Spend</option>
              <option value="name-az">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No customers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? `No results matching "${searchQuery}". Try a different name, phone, or email.` : 'No customers in this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5">Customer Profile</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5 text-center">Account Type</th>
                  <th className="py-3.5 px-5 text-center">Orders</th>
                  <th className="py-3.5 px-5 text-right">Total Spent</th>
                  <th className="py-3.5 px-5">Last Order</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => {
                  const lastBadge = user.lastOrderStatus ? getStatusBadge(user.lastOrderStatus) : null;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-amber-50/20 transition-colors group"
                    >
                      {/* Customer Profile & Tags */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {(user.name || '?')[0].toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                {user.name}
                              </span>
                              {user.isBlocked && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                  Blocked
                                </span>
                              )}
                            </div>

                            {user.smartTags && user.smartTags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {user.smartTags.map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border uppercase tracking-wider ${tag.color}`}
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          ) : null}
                          {user.email ? (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          ) : null}
                          {!user.phone && !user.email && (
                            <span className="text-slate-400 italic text-[11px]">No contact info</span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-5 text-center">
                        {user.isFromFirestore ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Guest
                          </span>
                        )}
                      </td>

                      {/* Total Orders */}
                      <td className="py-4 px-5 text-center">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {user.totalOrders}
                        </span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-900">
                        ₹{Math.round(user.totalSpent).toLocaleString('en-IN')}
                      </td>

                      {/* Last Order Date & Status */}
                      <td className="py-4 px-5">
                        {user.lastOrderDate ? (
                          <div>
                            <p className="font-medium text-slate-800">{formatDate(user.lastOrderDate)}</p>
                            {lastBadge && (
                              <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${lastBadge.bg}`}>
                                {lastBadge.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No orders</span>
                        )}
                      </td>

                      {/* View Profile Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-amber-500 hover:text-stone-950 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-amber-400 flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs active:scale-95"
                          title="View complete customer profile, addresses, wishlist, and orders"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedUser && (
        <SelectedUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={() => {
            // Updated in Firestore; live onSnapshot will re-render
          }}
        />
      )}

    </div>
  );
};
export default UsersView;
