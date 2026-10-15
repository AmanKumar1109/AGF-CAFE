import { Truck, ShieldCheck, Leaf } from 'lucide-react';

export const HeroFeatures = () => {
  const features = [
    {
      icon: <Leaf className="w-5 h-5 text-amber-400" />,
      title: 'Fresh Ingredients',
      description: 'Locally sourced daily'
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-400" />,
      title: 'Fast Delivery',
      description: 'Hot within 30 mins'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      title: 'Hygienic & Safe',
      description: '5-star hygiene rating'
    }
  ];

  return (
    <div className="pt-8 border-t border-white/10">
      <div className="grid grid-cols-3 gap-3 sm:gap-6 divide-x divide-white/10 text-left">
        {features.map((item, index) => (
          <div key={index} className={index !== 0 ? 'pl-3 sm:pl-6' : ''}>
            <div className="mb-2 p-2.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 w-fit">
              {item.icon}
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-stone-100">
              {item.title}
            </h4>
            <p className="text-[10px] sm:text-xs text-stone-400 hidden sm:block mt-0.5">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
