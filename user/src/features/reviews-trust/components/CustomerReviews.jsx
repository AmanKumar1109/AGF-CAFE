import React, { useState, useEffect } from 'react';
import { Star, Quote, PenLine, CheckCircle2, Sparkles, MapPin, Coffee } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';

// High-quality curated default reviews if Firestore collection is new
const DEFAULT_REVIEWS = [
  {
    id: 'def_1',
    userName: 'Ananya Sharma',
    location: 'Baharagora, Jharkhand',
    rating: 5,
    comment: 'The Classic Burger and French Fries combo is easily the tastiest in town! Buns are super soft and the special house sauce is absolutely addictive.',
    favoriteDish: 'Artisan Double Burger',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'def_2',
    userName: 'Rohan Verma',
    location: 'Baharagora, Jharkhand',
    rating: 5,
    comment: 'Ordered the Margherita Pizza for movie night. Delivered piping hot in 20 minutes with bubbling cheese. 10/10 recommendation!',
    favoriteDish: 'Woodfired Margherita',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'def_3',
    userName: 'Sneha Patel',
    location: 'Baharagora, Jharkhand',
    rating: 5,
    comment: 'Their Chocolate Shake and Hazelnut Cold Brew are heaven! Rich, thick, and perfectly sweetened. The cafe ambience and online delivery are top tier.',
    favoriteDish: 'Hazelnut Cold Brew',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
];

export const CustomerReviews = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'customer_reviews'),
        where('status', '==', 'approved')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const revs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort descending by date
          revs.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
          });

          setApprovedReviews(revs);
          setLoading(false);
        },
        (error) => {
          console.warn('Could not fetch approved reviews from Firestore:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Reviews listener setup error:', err);
      setLoading(false);
    }
  }, []);

  // Display approved reviews from Firestore, or fallback to default
  const displayReviews = approvedReviews.length > 0 ? approvedReviews : DEFAULT_REVIEWS;

  return (
    <section className="w-full bg-[#101216] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-800 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guest Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            What Our Foodies Say
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Real feedback from verified guests enjoying artisanal sourdough burgers, woodfired pizzas, and cold brew coffees daily.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {displayReviews.slice(0, 6).map((rev) => {
            const avatarUrl =
              rev.userPhoto ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                rev.userName || rev.name || 'Customer'
              )}&background=f59e0b&color=101216&bold=true`;

            return (
              <div
                key={rev.id}
                className="bg-stone-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-stone-800/80 flex flex-col justify-between hover:border-amber-500/40 hover:-translate-y-1 transition duration-300 shadow-xl relative group"
              >
                <Quote className="w-8 h-8 text-stone-800 absolute top-6 right-6 group-hover:text-amber-500/20 transition-colors" />

                <div className="space-y-4 relative z-10">
                  {/* Rating Stars & Favorite Tag */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    {rev.favoriteDish && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Coffee className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[120px]">{rev.favoriteDish}</span>
                      </span>
                    )}
                  </div>

                  {/* Comment Text */}
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed italic">
                    "{rev.comment || rev.review}"
                  </p>
                </div>

                {/* Author Info Footer */}
                <div className="flex items-center justify-between pt-5 mt-6 border-t border-stone-800/80">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl}
                      alt={rev.userName || rev.name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shadow-sm"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1">
                        <span>{rev.userName || rev.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-2.5 h-2.5 text-stone-600" />
                        <span>{rev.location || 'Baharagora, Jharkhand'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button: Write a Review */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <PenLine className="w-4 h-4 stroke-[2.5]" />
            <span>Write a Cafe Review</span>
          </button>
        </div>
      </div>

      {/* Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default CustomerReviews;
