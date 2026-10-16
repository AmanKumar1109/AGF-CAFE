import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Tag,
  Trash2,
  Power,
  PowerOff,
  Percent,
  Calendar,
  Search,
  Copy,
  Check,
  Sparkles,
  Users,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { logAuditEvent } from '../audit/AuditLogsView';

export const CouponsView = () => {
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'paused' | 'flat' | 'percentage'
  const [targetFilter, setTargetFilter] = useState('all'); // 'all' | 'global' | 'targeted'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const initialFormState = {
    code: '',
    description: '',
    discountType: 'flat', // 'flat' | 'percentage'
    discountValue: '',
    minOrderValue: '199',
    maxDiscount: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    userId: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Subscribe to Firestore 'coupons' collection
  useEffect(() => {
    setLoading(true);
    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Sort newest first
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });
        setCoupons(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching coupons:', err);
        setLoading(false);
      }
    );

    // 2. Subscribe to Firestore 'users' collection for targeted coupons
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setUsers(list);
      },
      (err) => console.warn('Error fetching users:', err)
    );

    return () => {
      unsubCoupons();
      unsubUsers();
    };
  }, []);

  // Quick Seed Sample Coupons if empty
  const handleSeedSamples = async () => {
    const sampleCoupons = [
      {
        code: 'WELCOME50',
        description: 'Flat ₹50 OFF on your first delicious cafe order',
        discountType: 'flat',
        discountValue: 50,
        minOrderValue: 199,
        maxDiscount: 0,
        validUntil: '2026-12-31',
        isGlobal: true,
        userId: null,
        isActive: true,
      },
      {
        code: 'CAFE15',
        description: '15% OFF on burgers, pizzas, and artisan coffees',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 299,
        maxDiscount: 100,
        validUntil: '2026-12-31',
        isGlobal: true,
        userId: null,
        isActive: true,
      },
      {
        code: 'BIGFEAST100',
        description: 'Special ₹100 discount for group & family meal combos',
        discountType: 'flat',
        discountValue: 100,
        minOrderValue: 599,
        maxDiscount: 0,
        validUntil: '2026-12-31',
        isGlobal: true,
        userId: null,
        isActive: true,
      },
      {
        code: 'SHAKE25',
        description: '25% OFF on all thick shakes and cold brew beverages',
        discountType: 'percentage',
        discountValue: 25,
        minOrderValue: 249,
        maxDiscount: 75,
        validUntil: '2026-12-31',
        isGlobal: true,
        userId: null,
        isActive: true,
      },
    ];

    try {
      setIsSubmitting(true);
      for (const coupon of sampleCoupons) {
        await addDoc(collection(db, 'coupons'), {
          ...coupon,
          createdAt: serverTimestamp(),
        });
      }

      await logAuditEvent({
        action: 'CREATE_COUPON',
        details: 'Seeded 4 default cafe promotional discount coupons',
        category: 'Marketing',
        severity: 'info',
        actor: 'Admin',
        metadata: { seededCount: sampleCoupons.length },
      });

      showToast('Seeded 4 promotional coupons successfully!');
    } catch (err) {
      console.error('Seed error:', err);
      showToast('Failed to seed coupons: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit create coupon form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const code = formData.code.trim().toUpperCase().replace(/\s/g, '');
      if (!code) throw new Error('Coupon Code is required');

      // Check duplicate
      const exists = coupons.some((c) => c.code?.toUpperCase() === code);
      if (exists) throw new Error(`Coupon code "${code}" already exists!`);

      const discountVal = parseFloat(formData.discountValue);
      if (isNaN(discountVal) || discountVal <= 0) {
        throw new Error('Please enter a valid discount value');
      }

      if (formData.discountType === 'percentage' && (discountVal < 1 || discountVal > 100)) {
        throw new Error('Percentage discount must be between 1% and 100%');
      }

      const minOrder = parseFloat(formData.minOrderValue) || 0;
      const maxDisc = parseFloat(formData.maxDiscount) || 0;

      if (!formData.validUntil) {
        throw new Error('Please select an expiry date');
      }

      const isGlobal = !formData.userId;

      const couponPayload = {
        code,
        description: formData.description.trim() || (formData.discountType === 'flat' ? `Flat ₹${discountVal} OFF` : `${discountVal}% OFF`),
        discountType: formData.discountType,
        discountValue: discountVal,
        minOrderValue: minOrder,
        maxDiscount: formData.discountType === 'percentage' ? maxDisc : 0,
        validUntil: formData.validUntil,
        isGlobal,
        userId: formData.userId || null,
        isActive: Boolean(formData.isActive),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'coupons'), couponPayload);

      // Audit log
      await logAuditEvent({
        action: 'CREATE_COUPON',
        details: `Created coupon code ${code} (${formData.discountType === 'flat' ? `₹${discountVal} OFF` : `${discountVal}% OFF`})`,
        category: 'Marketing',
        severity: 'info',
        actor: 'Admin',
        metadata: {
          couponId: docRef.id,
          code,
          discountType: formData.discountType,
          discountValue: discountVal,
          minOrderValue: minOrder,
        },
      });

      showToast(`Coupon "${code}" created successfully!`);
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Coupon Active/Paused
  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = !coupon.isActive;
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: newStatus,
        updatedAt: serverTimestamp(),
      });

      await logAuditEvent({
        action: 'UPDATE_COUPON',
        details: `${newStatus ? 'Activated' : 'Paused'} coupon ${coupon.code}`,
        category: 'Marketing',
        severity: 'info',
        actor: 'Admin',
        metadata: {
          couponId: coupon.id,
          code: coupon.code,
          isActive: newStatus,
        },
      });

      showToast(`Coupon ${coupon.code} ${newStatus ? 'activated' : 'paused'}!`);
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('Failed to update status');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (coupon) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'coupons', coupon.id));

      await logAuditEvent({
        action: 'DELETE_COUPON',
        details: `Permanently deleted coupon code ${coupon.code}`,
        category: 'Marketing',
        severity: 'warning',
        actor: 'Admin',
        metadata: {
          couponId: coupon.id,
          code: coupon.code,
        },
      });

      showToast(`Coupon "${coupon.code}" deleted!`);
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete coupon');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showToast(`Copied "${code}" to clipboard!`);
  };

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const codeMatches = (c.code || '').toLowerCase().includes(q);
      const descMatches = (c.description || '').toLowerCase().includes(q);
      let userMatches = false;
      if (c.userId) {
        const u = users.find((usr) => usr.id === c.userId);
        if (u) {
          userMatches =
            (u.name || u.fullName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q);
        }
      }
      if (q && !codeMatches && !descMatches && !userMatches) return false;

      // Status filter
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'paused' && c.isActive) return false;
      if (statusFilter === 'flat' && c.discountType !== 'flat') return false;
      if (statusFilter === 'percentage' && c.discountType !== 'percentage') return false;

      // Target filter
      if (targetFilter === 'global' && c.userId) return false;
      if (targetFilter === 'targeted' && !c.userId) return false;

      return true;
    });
  }, [coupons, searchQuery, statusFilter, targetFilter, users]);

  // Metrics
  const activeCount = coupons.filter((c) => c.isActive).length;
  const globalCount = coupons.filter((c) => !c.userId).length;
  const targetedCount = coupons.filter((c) => c.userId).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Discount Coupons & Offers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Create promotional codes, manage flat and percentage cafe discounts, set minimum cart thresholds, and reward loyal customers.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {coupons.length === 0 && (
            <button
              onClick={handleSeedSamples}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Seed Sample Coupons</span>
            </button>
          )}

          <button
            onClick={() => {
              setFormData(initialFormState);
              setFormError('');
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coupons */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Coupons</p>
            <p className="text-2xl font-black text-slate-900">{coupons.length}</p>
          </div>
        </div>

        {/* Active Coupons */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Power className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Active Codes</p>
            <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          </div>
        </div>

        {/* Global Public Coupons */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Global Offers</p>
            <p className="text-2xl font-black text-purple-600">{globalCount}</p>
          </div>
        </div>

        {/* Targeted Personal Coupons */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">User Targeted</p>
            <p className="text-2xl font-black text-amber-600">{targetedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupon code, offer details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({coupons.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'paused' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Paused ({coupons.length - activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('flat')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'flat' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Flat ₹
            </button>
            <button
              onClick={() => setStatusFilter('percentage')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'percentage' ? 'bg-white text-amber-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Percent %
            </button>
          </div>

          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="bg-slate-100 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Audiences</option>
            <option value="global">Global Only</option>
            <option value="targeted">Customer Specific</option>
          </select>
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading discount coupons...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
            <Ticket className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No promotional coupons match your search query.'
                : 'Create your first discount coupon to boost cafe sales and reward your customers!'}
            </p>
          </div>
          {coupons.length === 0 ? (
            <button
              onClick={handleSeedSamples}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Seed 4 Starter Coupons
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTargetFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => {
            const isPercentage = coupon.discountType === 'percentage';
            const assignedUser = coupon.userId
              ? users.find((u) => u.id === coupon.userId)
              : null;
            const isExpired = new Date(coupon.validUntil) < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={coupon.id}
                className={`relative bg-white rounded-3xl p-5 border transition-all duration-200 hover:shadow-md ${
                  coupon.isActive
                    ? 'border-slate-200/90 shadow-xs'
                    : 'border-slate-200/50 bg-slate-50/60 opacity-75'
                }`}
              >
                {/* Coupon Ticket Jagged Punch Holes */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-r border-slate-200" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-slate-50 rounded-full border-l border-slate-200" />

                {/* Top Badge & Actions */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className={`px-3 py-1 rounded-xl text-xs font-black font-mono tracking-widest border transition flex items-center gap-1.5 cursor-pointer ${
                        coupon.isActive
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title="Click to copy coupon code"
                    >
                      <span>{coupon.code}</span>
                      {copiedCode === coupon.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    {coupon.isReferralCoupon && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                        Referral
                      </span>
                    )}

                    {!coupon.userId ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Global
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                        Personal
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Active Button */}
                    <button
                      onClick={() => handleToggleStatus(coupon)}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        coupon.isActive
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
                    >
                      {coupon.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteCoupon(coupon)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Offer Value & Details */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {isPercentage ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </span>
                    {isPercentage && coupon.maxDiscount > 0 && (
                      <span className="text-[11px] font-bold text-slate-400">
                        (Up to ₹{coupon.maxDiscount})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {coupon.description || `Applicable on orders above ₹${coupon.minOrderValue}`}
                  </p>
                </div>

                {/* Conditions Chip */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 mb-3 text-[11px] font-medium text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Min Order Value:</span>
                    <span className="font-bold text-slate-800">
                      ₹{coupon.minOrderValue || 0}
                    </span>
                  </div>

                  {coupon.userId && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="text-slate-400">Assigned To:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[140px]" title={coupon.userId}>
                        {assignedUser ? assignedUser.name || assignedUser.fullName || assignedUser.email : 'Specific Customer'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Expiry & Status */}
                <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] font-bold">
                  <span className={`flex items-center gap-1 ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {isExpired ? 'Expired: ' : 'Valid till: '}
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry'}
                    </span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700'
                        : coupon.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isExpired ? 'EXPIRED' : coupon.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Create New Discount Coupon</h3>
                  <p className="text-xs text-slate-400">Offer your cafe diners irresistible deals</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Coupon Code *
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME50, BURGER20"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/\s/g, ''),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-black font-mono tracking-wider text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Codes are automatically converted to uppercase.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Offer Headline / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat ₹50 OFF on orders above ₹199"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="flat">Flat (₹) Off</option>
                    <option value="percentage">Percentage (%) Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Discount Value *
                  </label>
                  <div className="relative">
                    {formData.discountType === 'flat' ? (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        ₹
                      </span>
                    ) : (
                      <Percent className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    )}
                    <input
                      type="number"
                      required
                      min="1"
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      max={formData.discountType === 'percentage' ? '100' : '9999'}
                      placeholder={formData.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 50'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Percentage Max Discount Cap */}
              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Discount Cap (₹) (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100 (Max ₹100 discount)"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Leaves uncapped if left blank or 0.</p>
                </div>
              )}

              {/* Minimum Order Value */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Minimum Order Value (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 199"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Valid Till (Expiry Date) *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Customer Dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Global Coupon (All Customers Can Use)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.fullName || 'Customer'} ({u.email || u.phone || u.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Card */}
              <div className="pt-2">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">Live Preview</p>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-900 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-sm text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {formData.code || 'CODE'}
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {formData.discountType === 'flat'
                        ? `₹${formData.discountValue || 0} OFF`
                        : `${formData.discountValue || 0}% OFF`}{' '}
                      • Min order ₹{formData.minOrderValue || 0}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Expires {formData.validUntil || 'Soon'}
                  </span>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-black shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ticket className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Creating...' : 'Create Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CouponsView;
