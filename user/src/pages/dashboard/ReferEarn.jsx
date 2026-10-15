import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { 
  Copy, 
  Share2, 
  Gift, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Ticket
} from 'lucide-react';

export const ReferEarn = () => {
  const { currentUser, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [referrals, setReferrals] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [friendNames, setFriendNames] = useState({});

  const referralCode = userProfile?.myReferralCode || `AGF${currentUser?.uid?.substring(0, 5)?.toUpperCase() || 'CAFE'}`;
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to referrals
    const qRef = query(collection(db, 'referrals'), where('referrerId', '==', currentUser.uid));
    const unsubRef = onSnapshot(qRef, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReferrals(data);
    }, (err) => {
      console.warn("Referrals collection listener error:", err);
    });

    // Listen to coupons
    const qCoupons = query(collection(db, 'coupons'), where('userId', '==', currentUser.uid));
    const unsubCoupons = onSnapshot(qCoupons, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserCoupons(data);
    }, (err) => {
      console.warn("Coupons collection listener error:", err);
    });

    return () => {
      unsubRef();
      unsubCoupons();
    };
  }, [currentUser]);

  // Resolve friend names
  useEffect(() => {
    if (referrals.length === 0) return;
    
    const fetchNames = async () => {
      const names = { ...friendNames };
      let changed = false;
      
      for (const refItem of referrals) {
        if (refItem.referredUserId && !names[refItem.referredUserId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', refItem.referredUserId));
            if (userDoc.exists() && (userDoc.data().fullName || userDoc.data().name)) {
              names[refItem.referredUserId] = userDoc.data().fullName || userDoc.data().name;
            } else {
              names[refItem.referredUserId] = `Friend #${refItem.referredUserId.substring(0, 4)}`;
            }
            changed = true;
          } catch (err) {
            names[refItem.referredUserId] = `Friend #${refItem.referredUserId.substring(0, 4)}`;
            changed = true;
          }
        }
      }
      
      if (changed) {
        setFriendNames(names);
      }
    };
    
    fetchNames();
  }, [referrals]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AGF CAFE — Taste The Luxury',
          text: `Use my invite code ${referralCode} to get ₹50 OFF your next artisan cafe meal!`,
          url: referralLink,
        });
      } catch (err) {
        console.warn('Share dismissed', err);
      }
    } else {
      handleCopy();
    }
  };

  const stats = {
    total: referrals.length,
    successful: referrals.filter(r => r.status === 'REWARDED').length,
    pending: referrals.filter(r => r.status === 'REGISTERED').length,
    availableCoupons: userCoupons.filter(c => !userProfile?.usedCoupons?.includes(c.id) && c.isActive !== false).length
  };

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-9 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black">
            <Gift className="w-3.5 h-3.5" />
            <span>AGF Community Referral</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-serif">
            Refer Friends, Savor Together ☕
          </h1>
          
          <p className="text-stone-300 text-xs sm:text-sm font-medium leading-relaxed">
            Invite your food lover friends! When they place their first order, both of you unlock an exclusive <strong className="text-amber-400">₹50 OFF discount voucher</strong>.
          </p>
          
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-4 flex items-center justify-between w-full sm:w-auto">
              <span className="font-mono font-black text-amber-400 tracking-wider mr-4 text-sm">{referralCode}</span>
              <button 
                onClick={handleCopy} 
                className="text-stone-300 hover:text-white transition-colors cursor-pointer text-xs font-black uppercase flex items-center gap-1.5"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <button 
              onClick={handleShare} 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'referrals', label: 'My Referrals' },
          { id: 'rewards', label: 'My Reward Coupons' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-900/60 text-stone-400 hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-stone-900/70 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Total Invites</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
            </div>
          </div>
          <div className="bg-stone-900/70 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Successful</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.successful}</p>
            </div>
          </div>
          <div className="bg-stone-900/70 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Pending Orders</p>
              <p className="text-2xl font-black text-white mt-0.5">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-stone-900/70 p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col gap-2">
            <Ticket className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Your Vouchers</p>
              <p className="text-2xl font-black text-amber-400 mt-0.5">{stats.availableCoupons} Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Referrals List Tab */}
      {activeTab === 'referrals' && (
        <div className="bg-stone-900/70 rounded-3xl border border-white/10 shadow-xl overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Users className="w-12 h-12 text-stone-700 mb-3" />
              <p className="text-sm font-black text-stone-400">No friends referred yet</p>
              <p className="text-xs text-stone-500 mt-1">Share your link to unlock meal rewards!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {referrals.map(refItem => (
                <div key={refItem.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-stone-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      <span>{friendNames[refItem.referredUserId] || `Friend #${refItem.referredUserId?.substring(0, 4)}`}</span>
                      {refItem.status === 'REWARDED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {refItem.status === 'REGISTERED' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                    </p>
                    <p className="text-[11px] font-semibold text-stone-400 mt-1">
                      Joined {refItem.createdAt ? new Date(refItem.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                    refItem.status === 'REWARDED' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {refItem.status || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Available Coupons</h3>
            <span className="text-xs font-bold text-amber-400">{stats.availableCoupons} Active</span>
          </div>

          {userCoupons.length === 0 ? (
            <div className="bg-stone-900/50 rounded-3xl border border-white/10 p-12 text-center flex flex-col items-center">
              <Ticket className="w-12 h-12 text-stone-700 mb-3" />
              <p className="text-sm font-black text-stone-400">No Reward Coupons in Wallet</p>
              <p className="text-xs text-stone-500 mt-1">Invite friends to unlock ₹50 discount coupons!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCoupons.map(coupon => {
                const isUsed = userProfile?.usedCoupons?.includes(coupon.id) || coupon.isActive === false;
                return (
                  <div 
                    key={coupon.id} 
                    className={`bg-stone-900/80 border border-white/10 rounded-3xl p-5 sm:p-6 flex items-center justify-between shadow-xl relative overflow-hidden ${
                      isUsed ? 'opacity-50' : 'hover:border-amber-500/40'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full ${isUsed ? 'bg-stone-700' : 'bg-gradient-to-b from-amber-400 to-amber-500'}`} />
                    <div className="pl-3">
                      <div className="flex items-center gap-2">
                        <p className={`font-black text-lg tracking-wider font-mono ${isUsed ? 'text-stone-500 line-through' : 'text-white'}`}>
                          {coupon.code}
                        </p>
                        {isUsed && (
                          <span className="px-2 py-0.5 bg-stone-800 text-stone-400 text-[10px] font-black rounded-md uppercase">
                            Used
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-black mt-1 ${isUsed ? 'text-stone-500' : 'text-amber-400'}`}>
                        {coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-2 font-medium">
                        Min. Order: ₹{coupon.minOrderValue || 199} &bull; Valid till: {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('en-IN') : '30 days'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferEarn;
