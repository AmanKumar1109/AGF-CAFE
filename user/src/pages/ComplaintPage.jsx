import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/useAuth';

export const ComplaintPage = () => {
  const { currentUser, userProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: userProfile?.fullName || userProfile?.name || currentUser?.displayName || '',
    phone: userProfile?.phone || '',
    orderId: '',
    issueType: 'Food Quality',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.description) {
      alert("Please fill in your name, phone, and issue description.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'complaints'), {
        ...formData,
        userId: currentUser ? currentUser.uid : 'guest',
        userEmail: currentUser?.email || 'N/A',
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setIsSuccess(true);
      setFormData({
        name: userProfile?.fullName || userProfile?.name || '',
        phone: userProfile?.phone || '',
        orderId: '',
        issueType: 'Food Quality',
        description: '',
      });
    } catch (error) {
      console.error("Error submitting complaint: ", error);
      alert("Failed to submit complaint. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-stone-100 flex flex-col font-sans pt-28 pb-16">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-stone-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-8 sm:p-9 border-b border-white/5">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 font-serif tracking-tight">
              Lodge a Complaint
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
              We take great pride in our hospitality. If something didn't meet your expectations, tell us and our cafe manager will resolve it directly.
            </p>
          </div>

          <div className="p-6 sm:p-9">
            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Complaint Lodged Successfully!</h3>
                <p className="text-stone-400 text-xs max-w-sm mx-auto leading-relaxed">
                  We have received your ticket. Our manager will review and respond to your inquiry shortly in your complaints dashboard.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/dashboard/complaints"
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-2xl shadow-lg shadow-amber-500/25 transition-all"
                  >
                    View My Complaints
                  </Link>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all"
                  >
                    Submit Another Issue
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Aman Kumar"
                      className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Mobile Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Order ID (Optional)</label>
                    <input
                      type="text"
                      name="orderId"
                      value={formData.orderId}
                      onChange={handleChange}
                      placeholder="e.g. #ORD-1049"
                      className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Issue Category *</label>
                    <select
                      name="issueType"
                      value={formData.issueType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-stone-800 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                    >
                      <option value="Food Quality">Food Quality & Taste</option>
                      <option value="Missing Item">Missing Food/Beverage Item</option>
                      <option value="Packaging Issue">Packaging & Spill Issue</option>
                      <option value="Delivery Delay">Delivery Partner Delay</option>
                      <option value="Billing / Payment">Billing / Payment Issue</option>
                      <option value="Other">Other Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">Detailed Description *</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Please explain the issue in detail so we can make it right..."
                    className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{isSubmitting ? 'Submitting Ticket...' : 'Submit Complaint to Cafe Manager'}</span>
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
