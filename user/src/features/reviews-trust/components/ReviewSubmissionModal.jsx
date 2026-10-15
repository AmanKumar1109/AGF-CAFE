import React, { useState, useEffect } from 'react';
import { X, Star, Loader2, CheckCircle2, Coffee, Sparkles } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/useAuth';

export const ReviewSubmissionModal = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [favoriteDish, setFavoriteDish] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Baharagora, Jharkhand');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser || userProfile) {
      setName(userProfile?.fullName || userProfile?.name || currentUser?.displayName || '');
      setEmail(currentUser?.email || userProfile?.phone || '');
    }
  }, [currentUser, userProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a brief feedback or dining experience.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'customer_reviews'), {
        userId: currentUser ? currentUser.uid : 'guest',
        userName: name.trim(),
        userEmail: email.trim() || 'N/A',
        userPhoto: currentUser?.photoURL || '',
        rating: Number(rating),
        comment: comment.trim(),
        favoriteDish: favoriteDish.trim() || 'Signature Cafe Brew',
        location: location.trim() || 'Baharagora, Jharkhand',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setRating(5);
        setComment('');
        setFavoriteDish('');
      }, 2500);
    } catch (err) {
      console.error('Error submitting review to Firestore:', err);
      setError('Failed to submit review. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer animate-fade-in"
        onClick={onClose}
      />

      <div className="relative bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 text-stone-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/15">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black text-white font-serif">
              Thank You for Your Love! ☕
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 font-medium max-w-sm mx-auto leading-relaxed">
              Your review has been submitted to our cafe moderation team and will appear publicly on our homepage after quick verification.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 space-y-1">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Customer Review
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
                Share Your Cafe Experience
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Tell fellow food lovers in town about our taste, aroma, ambiance, and doorstep delivery service!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Selector */}
              <div className="flex flex-col items-center py-2 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">
                  Tap Stars to Rate
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-125 active:scale-95 cursor-pointer p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'text-stone-700 fill-stone-800'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {rating === 5 && '🌟 Exceptional! 5 Out of 5 Stars'}
                  {rating === 4 && '✨ Really Good! 4 Stars'}
                  {rating === 3 && '👍 Good Experience (3 Stars)'}
                  {rating === 2 && '⚠️ Needs Improvement (2 Stars)'}
                  {rating === 1 && '👎 Not Satisfied (1 Star)'}
                </span>
              </div>

              {/* Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Email / Phone (For Verification)
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {/* Favorite Dish & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Favorite Dish / Beverage
                  </label>
                  <input
                    type="text"
                    value={favoriteDish}
                    onChange={(e) => setFavoriteDish(e.target.value)}
                    placeholder="e.g. Classic Burger & Cold Coffee"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Your Town / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Baharagora, Jharkhand"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Your Review / Dining Feedback *
                </label>
                <textarea
                  required
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the flavor, portion, coffee aroma, delivery packaging, or staff service..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition resize-none leading-relaxed"
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Your Review...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Review for Moderation</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmissionModal;
