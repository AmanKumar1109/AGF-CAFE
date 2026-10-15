import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Sparkles, Phone, Package, HelpCircle, UtensilsCrossed, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/useAuth';

const ISSUE_CATEGORIES = [
  { value: 'Food Quality', label: 'Food Quality & Taste', icon: UtensilsCrossed },
  { value: 'Missing Item', label: 'Missing Food / Beverage Item', icon: Package },
  { value: 'Packaging Issue', label: 'Packaging & Spill Issue', icon: AlertCircle },
  { value: 'Delivery Delay', label: 'Delivery Partner Delay', icon: Clock },
  { value: 'Billing / Payment', label: 'Billing / UPI Payment Issue', icon: CreditCard },
  { value: 'Other', label: 'General / Other Inquiry', icon: HelpCircle },
];

export const ComplaintPage = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orderId: '',
    issueType: 'Food Quality',
    description: '',
  });

  const [userOrders, setUserOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState('');

  // Auto-fill user profile info
  useEffect(() => {
    if (userProfile || currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || userProfile?.fullName || userProfile?.name || currentUser?.displayName || '',
        phone: prev.phone || userProfile?.phone || '',
      }));
    }
  }, [userProfile, currentUser]);

  // Load user's recent orders for quick selection
  useEffect(() => {
    if (!currentUser) return;
    const fetchRecentOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const ordersList = snap.docs.map((doc) => ({
          id: doc.id,
          orderId: doc.data().orderId || doc.id.slice(0, 8),
          totalAmount: doc.data().grandTotal || doc.data().totalAmount || 0,
          date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString('en-IN') : 'Recent',
        }));
        setUserOrders(ordersList.slice(0, 6));
      } catch (err) {
        console.warn('Could not fetch user orders for complaint link:', err);
      }
    };
    fetchRecentOrders();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.description.trim()) {
      alert('Please fill in your name, phone number, and detailed issue description.');
      return;
    }

    setIsSubmitting(true);
    const generatedTicketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await addDoc(collection(db, 'complaints'), {
        ticketId: generatedTicketId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        orderId: formData.orderId.trim() || null,
        issueType: formData.issueType,
        description: formData.description.trim(),
        userId: currentUser ? currentUser.uid : 'guest',
        userEmail: currentUser?.email || 'N/A',
        status: 'pending',
        adminReply: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCreatedTicketId(generatedTicketId);
      setIsSuccess(true);
      setFormData({
        name: userProfile?.fullName || userProfile?.name || '',
        phone: userProfile?.phone || '',
        orderId: '',
        issueType: 'Food Quality',
        description: '',
      });
    } catch (error) {
      console.error('Error submitting complaint: ', error);
      alert('Failed to submit complaint. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-stone-100 flex flex-col font-sans pt-28 pb-16">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <Link
          to="/dashboard/complaints"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Dashboard</span>
        </Link>

        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-8 sm:p-9 border-b border-white/5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Customer Support & Hospitality Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight">
              Lodge a Complaint
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              We take great pride in our kitchen hygiene and cafe hospitality. If something didn't meet your expectations, tell us and our cafe manager will personally investigate and resolve it.
            </p>
          </div>

          <div className="p-6 sm:p-9">
            {isSuccess ? (
              <div className="text-center py-8 space-y-5 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                    Ticket Generated
                  </span>
                  <h3 className="text-2xl font-black text-white font-serif">
                    Complaint Lodged Successfully!
                  </h3>
                  <p className="text-stone-400 text-xs max-w-sm mx-auto leading-relaxed pt-1">
                    Your ticket <strong className="text-amber-400 font-mono">#{createdTicketId}</strong> has been assigned to our manager on duty.
                  </p>
                </div>

                <div className="p-4 bg-stone-950/80 rounded-2xl border border-stone-800 text-xs text-stone-300 max-w-md mx-auto text-left space-y-1.5">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Resolution Guarantee</span>
                  </p>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    You can track real-time resolution updates and read the cafe manager's response directly in your <strong>My Complaints</strong> dashboard.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/dashboard/complaints"
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider py-3.5 px-7 rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-center"
                  >
                    Track in My Complaints
                  </Link>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-2xl transition-all cursor-pointer"
                  >
                    Submit Another Issue
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Aman Kumar"
                      className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Contact Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                    />
                  </div>
                </div>

                {/* Order Selection / Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-300">
                      Related Cafe Order ID (Optional)
                    </label>
                    {userOrders.length > 0 && (
                      <span className="text-[10px] text-amber-400 font-semibold">
                        Select from your recent orders:
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    placeholder="e.g. AGF-718293"
                    className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                  />

                  {/* Quick Select Buttons from recent orders */}
                  {userOrders.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {userOrders.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, orderId: ord.orderId })}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            formData.orderId === ord.orderId
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          <Package className="w-3 h-3" />
                          <span>#{ord.orderId} (₹{ord.totalAmount})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Issue Category Radio Grid */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-300">
                    What best describes your issue? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ISSUE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = formData.issueType === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, issueType: cat.value })}
                          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                              : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-900 text-stone-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Describe your experience in detail *
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Please explain exactly what happened (e.g. food was cold on arrival, missing extra dip, delayed by 30 mins) so we can issue a replacement or refund..."
                    className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-medium text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 resize-none leading-relaxed"
                  />
                </div>

                {/* Assurance note */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] leading-relaxed">
                    Our cafe manager will review this ticket and contact you via phone or dashboard within business hours to resolve the dispute.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Support Ticket...</span>
                      </>
                    ) : (
                      <span>Submit Ticket to Cafe Manager</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComplaintPage;
