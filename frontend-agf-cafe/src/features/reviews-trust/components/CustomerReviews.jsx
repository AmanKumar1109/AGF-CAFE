import { Star, Quote } from 'lucide-react';

export const CustomerReviews = () => {
  const reviews = [
    {
      name: 'Ananya Sharma',
      role: 'Food Blogger',
      rating: 5,
      review: 'The Classic Burger and French Fries combo is easily the tastiest in town! Buns are super soft and the special sauce is addictive.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Rohan Verma',
      role: 'Local Guide',
      rating: 5,
      review: 'Ordered the Margherita Pizza for movie night. Delivered piping hot in 20 minutes with bubbling cheese. 10/10 recommendation!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    {
      name: 'Sneha Patel',
      role: 'Verified Customer',
      rating: 5,
      review: 'Their Chocolate Shake is heaven! Rich, thick, and perfectly sweetened. The cafe ambience and online delivery service are top notch.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    }
  ];

  return (
    <section className="w-full bg-[#101216] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Customer Love
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            What Our Foodies Say
          </h2>
          <p className="text-stone-400 text-sm">
            Over 15,000+ satisfied customers who love great food and good vibes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, index) => (
            <div
              key={index}
              className="bg-stone-900/60 rounded-3xl p-6 border border-stone-800 flex flex-col justify-between hover:border-amber-500/40 transition duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-stone-700" />
                </div>
                <p className="text-stone-300 text-sm leading-relaxed italic">
                  "{rev.review}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 mt-4 border-t border-stone-800">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
                />
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white">{rev.name}</h4>
                  <p className="text-xs text-stone-500">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
