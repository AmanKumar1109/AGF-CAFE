import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Search,
  Gift,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Settings,
  Users,
  Sparkles,
  Ticket,
  Calendar,
  X,
  Phone,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { logAuditEvent } from '../audit/AuditLogsView';

export const ReferralsView = () => {
  const [referrals, setReferrals] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRewarding, setIsRewarding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Campaign Settings
  const [campaignSettings, setCampaignSettings] = useState({
    referralCampaignActive: true,
    referrerRewardAmount: 50,
    referredUserRewardAmount: 50,
    referralMinOrderValue: 199,
    referralCouponMinOrderValue: 199,
    referralCouponValidityDays: 30,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDateTime = (val) => {
    if (!val) return '—';
    try {
      if (typeof val?.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      const d = new Date(val);
      if (isNaN(d)) return String(val);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  // 1. Subscribe to Users Cache for resolving names & phones
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map = {};
      snap.forEach((d) => {
        const u = d.data();
        map[d.id] = {
          name: u.name || u.fullName || 'Customer',
          phone: u.phone || '',
          email: u.email || '',
        };
      });
      setUsersCache(map);
    });

    // 2. Fetch Campaign Settings
    const fetchSettings = async () => {
      try {
        const setDocRef = doc(db, 'settings', 'referrals');
        const sSnap = await getDoc(setDocRef);
        if (sSnap.exists()) {
          setCampaignSettings((prev) => ({ ...prev, ...sSnap.data() }));
        }
      } catch (err) {
        console.warn('Could not fetch referral settings:', err);
      }
    };
    fetchSettings();

    return () => unsubUsers();
  }, []);

  // 3. Subscribe to Referrals Collection in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReferrals(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching referrals:', err);
        // Fallback without orderBy if index not present
        const unsubFallback = onSnapshot(collection(db, 'referrals'), (fbSnap) => {
          const list = fbSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setReferrals(list);
          setLoading(false);
        });
        return () => unsubFallback();
      }
    );

    return () => unsub();
  }, []);

  // Manual Reward Action by Admin
  const handleManualReward = async (refItem) => {
    if (refItem.status === 'REWARDED') {
      showToast('This referral has already been rewarded!');
      return;
    }

    const confirm = window.confirm(
      `Issue ₹${campaignSettings.referrerRewardAmount} reward coupon to Referrer and ₹${campaignSettings.referredUserRewardAmount} to Friend?`
    );
    if (!confirm) return;

    setIsRewarding(true);
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (campaignSettings.referralCouponValidityDays || 30) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // 1. Generate Coupon for Referrer
      const refCode = `REF${Math.floor(1000 + Math.random() * 9000)}`;
      const referrerCoupon = {
        code: refCode,
        description: `Referral Reward: Invited ${usersCache[refItem.referredUserId]?.name || 'Friend'}`,
        discountType: 'flat',
        discountValue: Number(campaignSettings.referrerRewardAmount) || 50,
        minOrderValue: Number(campaignSettings.referralCouponMinOrderValue) || 199,
        maxDiscount: 0,
        validUntil: expiryDate,
        userId: refItem.referrerId,
        isGlobal: false,
        isReferralCoupon: true,
        isActive: true,
        createdAt: serverTimestamp(),
      };
      const referrerCouponRef = await addDoc(collection(db, 'coupons'), referrerCoupon);

      // 2. Generate Coupon for Referred Friend
      const welcomeCode = `WELCOME${Math.floor(1000 + Math.random() * 9000)}`;
      const friendCoupon = {
        code: welcomeCode,
        description: 'Welcome Reward: Joined via Referral',
        discountType: 'flat',
        discountValue: Number(campaignSettings.referredUserRewardAmount) || 50,
        minOrderValue: Number(campaignSettings.referralCouponMinOrderValue) || 199,
        maxDiscount: 0,
        validUntil: expiryDate,
        userId: refItem.referredUserId,
        isGlobal: false,
        isReferralCoupon: true,
        isActive: true,
        createdAt: serverTimestamp(),
      };
      const friendCouponRef = await addDoc(collection(db, 'coupons'), friendCoupon);

      // 3. Update Referral Document
      const refDocRef = doc(db, 'referrals', refItem.id);
      await updateDoc(refDocRef, {
        status: 'REWARDED',
        rewardedAt: serverTimestamp(),
        orderQualifiedAt: refItem.orderQualifiedAt || serverTimestamp(),
        referrerCouponId: referrerCouponRef.id,
        referrerCouponCode: refCode,
        referredCouponId: friendCouponRef.id,
        referredCouponCode: welcomeCode,
      });

      // 4. Audit Log
      await logAuditEvent({
        action: 'REWARD_REFERRAL',
        details: `Manually approved & rewarded referral ${refItem.id} (${refCode} & ${welcomeCode})`,
        category: 'Marketing',
        severity: 'info',
        actor: 'Admin',
        metadata: {
          referralId: refItem.id,
          referrerId: refItem.referrerId,
          referredUserId: refItem.referredUserId,
          referrerCoupon: refCode,
          friendCoupon: welcomeCode,
        },
      });

      showToast(`Referral rewarded! Coupons ${refCode} and ${welcomeCode} created.`);
      if (selectedReferral?.id === refItem.id) {
        setSelectedReferral((prev) => ({
          ...prev,
          status: 'REWARDED',
          referrerCouponCode: refCode,
          referredCouponCode: welcomeCode,
        }));
      }
    } catch (err) {
      console.error('Error rewarding referral:', err);
      showToast('Failed to reward referral: ' + err.message);
    } finally {
      setIsRewarding(false);
    }
  };

  // Save Campaign Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const setDocRef = doc(db, 'settings', 'referrals');
      await setDoc(setDocRef, campaignSettings, { merge: true });

      await logAuditEvent({
        action: 'UPDATE_SETTINGS',
        details: 'Updated Referral Campaign configuration rules',
        category: 'Marketing',
        severity: 'info',
        actor: 'Admin',
        metadata: campaignSettings,
      });

      showToast('Referral Campaign settings saved!');
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('Error saving settings');
    }
  };

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    return referrals.filter((ref) => {
      const q = searchTerm.toLowerCase().trim();
      const refIdMatches = (ref.id || '').toLowerCase().includes(q);
      const referrerUser = usersCache[ref.referrerId];
      const referrerMatches =
        (ref.referrerId || '').toLowerCase().includes(q) ||
        (referrerUser?.name || '').toLowerCase().includes(q) ||
        (referrerUser?.phone || '').toLowerCase().includes(q);

      const referredUser = usersCache[ref.referredUserId];
      const referredMatches =
        (ref.referredUserId || '').toLowerCase().includes(q) ||
        (referredUser?.name || '').toLowerCase().includes(q) ||
        (referredUser?.phone || '').toLowerCase().includes(q);

      const codeMatches = (ref.referrerCode || '').toLowerCase().includes(q);

      if (q && !refIdMatches && !referrerMatches && !referredMatches && !codeMatches) {
        return false;
      }

      if (statusFilter !== 'ALL' && ref.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [referrals, searchTerm, statusFilter, usersCache]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REWARDED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rewarded
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1 w-max">
            <Clock className="w-3.5 h-3.5" /> Registered (Pending First Order)
          </span>
        );
      case 'NOT_QUALIFIED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1 w-max">
            <XCircle className="w-3.5 h-3.5" /> Not Qualified
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 w-max">
            <AlertCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 w-max">
            {status || 'Pending'}
          </span>
        );
    }
  };

  const rewardedCount = referrals.filter((r) => r.status === 'REWARDED').length;
  const pendingCount = referrals.filter((r) => r.status === 'REGISTERED').length;
  const notQualifiedCount = referrals.filter(
    (r) => r.status === 'NOT_QUALIFIED' || r.status === 'CANCELLED'
  ).length;

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
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Referral Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Track customer invitations, monitor first qualifying orders, audit lifecycle timelines, and distribute reward discount vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Campaign Rules</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Referrals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Total Invites
          </span>
          <span className="text-3xl font-black text-slate-900">{referrals.length}</span>
        </div>

        {/* Rewarded (Successful) */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
            Rewarded Orders
          </span>
          <span className="text-3xl font-black text-emerald-800">{rewardedCount}</span>
        </div>

        {/* Registered (Pending) */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
            Pending First Order
          </span>
          <span className="text-3xl font-black text-amber-800">{pendingCount}</span>
        </div>

        {/* Not Qualified */}
        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200/60 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider">
            Not Qualified / Cancelled
          </span>
          <span className="text-3xl font-black text-rose-800">{notQualifiedCount}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search referral ID, user name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {['ALL', 'REGISTERED', 'REWARDED', 'NOT_QUALIFIED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer capitalize ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All'
                  : st === 'REGISTERED'
                  ? 'Pending'
                  : st === 'REWARDED'
                  ? 'Rewarded'
                  : st === 'NOT_QUALIFIED'
                  ? 'Not Qualified'
                  : 'Cancelled'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Referral ID
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Referrer (User A)
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Referred Friend (User B)
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Date Joined
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Qualifying Order
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 font-bold text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading referral records...
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 font-bold text-slate-400">
                    <Gift className="w-10 h-10 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                    No referral records found.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => {
                  const referrer = usersCache[ref.referrerId];
                  const referred = usersCache[ref.referredUserId];

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                          #{ref.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Referrer */}
                      <td className="px-5 py-4 truncate max-w-[170px]">
                        <p className="font-bold text-slate-900 truncate">
                          {referrer?.name || ref.referrerName || 'Cafe Diner'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{referrer?.phone || ref.referrerCode || ref.referrerId}</span>
                        </p>
                      </td>

                      {/* Referred Friend */}
                      <td className="px-5 py-4 truncate max-w-[170px]">
                        <p className="font-bold text-slate-900 truncate">
                          {referred?.name || ref.referredUserName || 'Invited Friend'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{referred?.phone || ref.referredUserEmail || ref.referredUserId}</span>
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {ref.registeredAt || ref.createdAt
                          ? formatDateTime(ref.registeredAt || ref.createdAt)
                          : '—'}
                      </td>

                      {/* Qualifying Order */}
                      <td className="px-5 py-4">
                        {ref.orderId ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 font-mono">
                              #{String(ref.orderId).substring(0, 8)}
                            </span>
                            <span className="text-emerald-600 font-bold font-mono">
                              ₹{ref.orderAmount || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No order yet</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">{getStatusBadge(ref.status)}</td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ref.status === 'REGISTERED' && (
                            <button
                              onClick={() => handleManualReward(ref)}
                              disabled={isRewarding}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                              title="Manually issue reward vouchers"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reward</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReferral(ref)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="View Referral Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFERRAL DETAILS & LIFECYCLE TIMELINE MODAL */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Referral Lifecycle Details</h3>
                  <p className="text-xs text-slate-400 font-mono">#{selectedReferral.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReferral(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Referrer & Friend Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Referrer (User A)
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {usersCache[selectedReferral.referrerId]?.name ||
                      selectedReferral.referrerName ||
                      'Member'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {usersCache[selectedReferral.referrerId]?.phone || selectedReferral.referrerCode}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    ID: {selectedReferral.referrerId}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Referred Friend (User B)
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {usersCache[selectedReferral.referredUserId]?.name ||
                      selectedReferral.referredUserName ||
                      'Friend'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {usersCache[selectedReferral.referredUserId]?.phone ||
                      selectedReferral.referredUserEmail}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    ID: {selectedReferral.referredUserId}
                  </p>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-600">Current Lifecycle Status:</span>
                <div>{getStatusBadge(selectedReferral.status)}</div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Lifecycle Progress
                </h4>

                <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Registration */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Friend Joined via Referral Link</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatDateTime(selectedReferral.registeredAt || selectedReferral.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Invitation code applied: <strong>{selectedReferral.referrerCode}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Step 2: First Order Placed / Qualified */}
                  <div className="relative">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        selectedReferral.orderQualifiedAt || selectedReferral.orderId
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-0.5 ${
                        selectedReferral.orderQualifiedAt || selectedReferral.orderId
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>First Order Qualified & Delivered</span>
                        {selectedReferral.orderQualifiedAt && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDateTime(selectedReferral.orderQualifiedAt)}
                          </span>
                        )}
                      </div>
                      {selectedReferral.orderId ? (
                        <p className="text-[11px] text-slate-600">
                          Order #{selectedReferral.orderId} (₹{selectedReferral.orderAmount || 0})
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Awaiting friend to place their first order (Min ₹
                          {campaignSettings.referralMinOrderValue || 199})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Rewards Issued */}
                  <div className="relative">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        selectedReferral.status === 'REWARDED' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        selectedReferral.status === 'REWARDED'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                          <span>₹50 Discount Vouchers Generated</span>
                        </span>
                        {selectedReferral.rewardedAt && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatDateTime(selectedReferral.rewardedAt)}
                          </span>
                        )}
                      </div>

                      {selectedReferral.status === 'REWARDED' ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded-lg bg-white border border-emerald-200">
                            <span className="text-[10px] text-slate-400 block">Referrer Voucher:</span>
                            <span className="font-mono font-black text-emerald-700">
                              {selectedReferral.referrerCouponCode || 'Active Voucher'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-emerald-200">
                            <span className="text-[10px] text-slate-400 block">Friend Voucher:</span>
                            <span className="font-mono font-black text-emerald-700">
                              {selectedReferral.referredCouponCode || 'Active Voucher'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          Rewards will unlock automatically upon successful delivery of the order.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {selectedReferral.status === 'REGISTERED' && (
                    <button
                      onClick={() => handleManualReward(selectedReferral)}
                      disabled={isRewarding}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRewarding ? 'Issuing...' : 'Issue Rewards Now'}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedReferral(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Referral Campaign Rules</h3>
                  <p className="text-xs text-slate-400">Set reward amounts & qualification rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              {/* Campaign Active Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="block text-xs font-black text-slate-800">
                    Referral Campaign Active
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Allow customers to invite friends and receive reward coupons
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={campaignSettings.referralCampaignActive}
                  onChange={(e) =>
                    setCampaignSettings({
                      ...campaignSettings,
                      referralCampaignActive: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Reward Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Referrer Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={campaignSettings.referrerRewardAmount}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        referrerRewardAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Friend Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={campaignSettings.referredUserRewardAmount}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        referredUserRewardAmount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Qualifying Order Minimum */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Friend Minimum First Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={campaignSettings.referralMinOrderValue}
                  onChange={(e) =>
                    setCampaignSettings({
                      ...campaignSettings,
                      referralMinOrderValue: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Reward is issued when the friend's order amount reaches this threshold.
                </p>
              </div>

              {/* Reward Coupon Minimum Order & Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Coupon Min Cart (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={campaignSettings.referralCouponMinOrderValue}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        referralCouponMinOrderValue: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={campaignSettings.referralCouponValidityDays}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        referralCouponValidityDays: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-indigo-500/25 transition cursor-pointer"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReferralsView;
