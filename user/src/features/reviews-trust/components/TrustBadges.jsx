import { Leaf, Star, Truck, ShieldCheck } from 'lucide-react';

export const TrustBadges = () => {
  const badges = [
    {
      icon: <Leaf className="w-5 h-5 text-amber-500" />,
      text: '100% Fresh Ingredients'
    },
    {
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-500" />,
      text: 'Top Rated by Customers'
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-500" />,
      text: 'Fast & Reliable Delivery'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
      text: 'Secure Online Payment'
    }
  ];

  return (
    <div className="w-full bg-[#faf7f2] pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-6 px-6 bg-white rounded-2xl border border-stone-200/80 shadow-sm">
          {badges.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center gap-3 text-stone-700 hover:text-stone-950 transition-colors"
            >
              <div className="p-2 rounded-xl bg-amber-500/10">
                {item.icon}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-stone-800 text-left">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
