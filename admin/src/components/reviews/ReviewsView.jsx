import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle,
  XCircle,
  Search,
  Clock,
  ShieldAlert,
  PenLine,
  X,
  Plus,
  Trash2,
  MapPin,
  Coffee,
  MessageSquare,
  Sparkles,
  Filter
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { logAuditEvent } from '../audit/AuditLogsView';

export const ReviewsView = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [editingReview, setEditingReview] = useState(null);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 5,
    comment: '',
    favoriteDish: 'Hazelnut Cold Brew',
    location: 'Baharagora, Jharkhand'
  });

  useEffect(() => {
    try {
      const q = query(collection(db, 'customer_reviews'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const revs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort descending by creation date
          revs.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
          });

          setReviews(revs);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching customer reviews in admin:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Reviews subscription error:', err);
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'customer_reviews', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Record Audit Log
      await logAuditEvent({
        action: newStatus === 'approved' ? 'REVIEW_APPROVED' : 'REVIEW_STATUS_CHANGED',
        details: `${newStatus === 'approved' ? 'Approved' : 'Updated'} customer review #${id.slice(0, 8)} to "${newStatus}"`,
        category: 'Reviews',
        severity: newStatus === 'approved' ? 'success' : 'warning',
        actor: 'Admin',
      });
    } catch (err) {
      console.error('Error updating review status:', err);
      alert('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this customer review?')) {
      try {
        await deleteDoc(doc(db, 'customer_reviews', id));

        // Record Audit Log
        await logAuditEvent({
          action: 'REVIEW_DELETED',
          details: `Permanently deleted customer review #${id.slice(0, 8)}`,
          category: 'Reviews',
          severity: 'danger',
          actor: 'Admin',
        });
      } catch (err) {
        console.error('Error deleting review:', err);
        alert('Failed to delete review.');
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      await updateDoc(doc(db, 'customer_reviews', editingReview.id), {
        userName: editingReview.userName,
        rating: Number(editingReview.rating),
        comment: editingReview.comment,
        favoriteDish: editingReview.favoriteDish || '',
        location: editingReview.location,
        updatedAt: serverTimestamp(),
      });

      // Record Audit Log
      await logAuditEvent({
        action: 'REVIEW_EDITED',
        details: `Edited customer review #${editingReview.id.slice(0, 8)} for "${editingReview.userName}"`,
        category: 'Reviews',
        severity: 'info',
        actor: 'Admin',
      });

      setEditingReview(null);
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Failed to update review.');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) {
      alert('Please fill out customer name and review text.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'customer_reviews'), {
        ...newReview,
        rating: Number(newReview.rating),
        status: 'approved', // Admin added reviews are approved by default
        userId: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Record Audit Log
      await logAuditEvent({
        action: 'REVIEW_CREATED',
        details: `Published verified customer testimonial for "${newReview.userName}" (${newReview.rating}★)`,
        category: 'Reviews',
        severity: 'success',
        actor: 'Admin',
      });

      setIsAddingReview(false);
      setNewReview({
        userName: '',
        rating: 5,
        comment: '',
        favoriteDish: 'Hazelnut Cold Brew',
        location: 'Baharagora, Jharkhand'
      });
      setActiveTab('approved');
    } catch (err) {
      console.error('Error adding review:', err);
      alert('Failed to add review.');
    }
  };

  // Filter reviews by active tab and search query
  const filteredReviews = reviews.filter((rev) => {
    const matchesTab = (rev.status || 'pending') === activeTab;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (rev.userName && rev.userName.toLowerCase().includes(term)) ||
      (rev.comment && rev.comment.toLowerCase().includes(term)) ||
      (rev.favoriteDish && rev.favoriteDish.toLowerCase().includes(term)) ||
      (rev.location && rev.location.toLowerCase().includes(term));

    return matchesTab && matchesSearch;
  });

  const pendingCount = reviews.filter((r) => (r.status || 'pending') === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Moderation Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif mt-1">
            Customer Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Moderate guest testimonials before they appear publicly on the cafe homepage
          </p>
        </div>

        <button
          onClick={() => setIsAddingReview(true)}
          className="self-start sm:self-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Official Review</span>
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          {[
            { id: 'pending', label: 'Pending Moderation', count: pendingCount, color: 'text-amber-600' },
            { id: 'approved', label: 'Approved Live', count: approvedCount, color: 'text-emerald-600' },
            { id: 'rejected', label: 'Rejected', count: rejectedCount, color: 'text-rose-600' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive ? 'bg-slate-100 ' + tab.color : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, dish or review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Reviews Content Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading reviews queue...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            No {activeTab} reviews found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Try modifying your search keywords.'
              : `There are currently no customer reviews under the "${activeTab}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => {
            const initial = (rev.userName || 'Guest')[0]?.toUpperCase();
            const dateStr = rev.createdAt?.toDate
              ? rev.createdAt.toDate().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div>
                  {/* Review Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-stone-950 font-black text-base flex items-center justify-center shadow-sm">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{rev.userName || 'Anonymous Guest'}</span>
                          {rev.status === 'approved' && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                          )}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{rev.location || 'Baharagora, Jharkhand'}</span>
                          {rev.userEmail && rev.userEmail !== 'N/A' && (
                            <span>• {rev.userEmail}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 justify-end mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (Number(rev.rating) || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </p>
                    </div>
                  </div>

                  {/* Favorite Dish Badge */}
                  {rev.favoriteDish && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>Loved: {rev.favoriteDish}</span>
                      </span>
                    </div>
                  )}

                  {/* Comment */}
                  <p className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl leading-relaxed italic border border-slate-100">
                    "{rev.comment}"
                  </p>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {activeTab !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'approved')}
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Live</span>
                    </button>
                  )}

                  {activeTab === 'approved' && (
                    <button
                      onClick={() => setEditingReview(rev)}
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {activeTab !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'rejected')}
                      className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                  Review Editor
                </span>
                <h3 className="text-lg font-black text-slate-900">Edit Customer Review</h3>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingReview.userName}
                    onChange={(e) => setEditingReview({ ...editingReview, userName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Star Rating (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={editingReview.rating}
                    onChange={(e) => setEditingReview({ ...editingReview, rating: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Favorite Dish</label>
                  <input
                    type="text"
                    value={editingReview.favoriteDish || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, favoriteDish: e.target.value })}
                    placeholder="e.g. Sourdough Pizza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editingReview.location || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, location: e.target.value })}
                    placeholder="Baharagora, Jharkhand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Review Text *</label>
                <textarea
                  required
                  rows="4"
                  value={editingReview.comment}
                  onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Review Modal */}
      {isAddingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                  Admin Endorsement
                </span>
                <h3 className="text-lg font-black text-slate-900">Add Pre-Approved Review</h3>
              </div>
              <button
                onClick={() => setIsAddingReview(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newReview.userName}
                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                    placeholder="e.g. Vikramaditya Singh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Star Rating (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Favorite Dish</label>
                  <input
                    type="text"
                    value={newReview.favoriteDish}
                    onChange={(e) => setNewReview({ ...newReview, favoriteDish: e.target.value })}
                    placeholder="e.g. Cold Hazelnut Shake"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={newReview.location}
                    onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                    placeholder="Baharagora, Jharkhand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Review Text *</label>
                <textarea
                  required
                  rows="4"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Paste or write the customer's dining review..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingReview(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  Publish Approved Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsView;
