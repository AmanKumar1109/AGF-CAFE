import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import { ArrowRight, Utensils } from 'lucide-react';
import { useLiveMenuItems } from '../hooks/useLiveMenuItems';
import { MenuItemCard } from './MenuItemCard';

export const PopularMenu = () => {
  const { popularItems, loading } = useLiveMenuItems();
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);

  useEffect(() => {
    if (!loading && popularItems.length > 0) {
      const ctx = gsap.context(() => {
        if (cardsContainerRef.current?.children?.length) {
          gsap.fromTo(
            cardsContainerRef.current.children,
            { y: 25, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power2.out',
              clearProps: 'all', // Cleans up inline opacity & transforms completely so cards never stay faded
            }
          );
        }
      }, sectionRef);

      return () => ctx.revert();
    }
  }, [popularItems.length, loading]);

  return (
    <section
      id="popular-menu"
      ref={sectionRef}
      className="w-full bg-[#faf7f2] text-stone-900 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-200/40"
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6">
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-600 uppercase">
                Our Specials
              </span>
              <span className="w-8 h-[2px] bg-amber-500 rounded-full" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
              Popular Menu
            </h2>

            <p className="text-sm sm:text-base text-stone-600 max-w-lg">
              Explore our most loved dishes, crafted for your taste and happiness.
            </p>
          </div>

          <div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 text-stone-800 hover:text-stone-950 hover:border-stone-900 font-semibold text-xs sm:text-sm transition-all duration-300 group shadow-sm bg-white"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-stone-200/60 animate-pulse space-y-4">
                <div className="w-full aspect-square rounded-2xl bg-stone-200/70" />
                <div className="h-5 bg-stone-200/70 rounded-md w-3/4" />
                <div className="h-3 bg-stone-200/60 rounded-md w-full" />
                <div className="h-10 bg-stone-200/60 rounded-2xl w-full pt-2" />
              </div>
            ))}
          </div>
        ) : popularItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center max-w-md mx-auto space-y-3 border border-stone-200/70">
            <Utensils className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">Fresh dishes being added soon!</h3>
            <p className="text-xs text-stone-500">
              Check out our full menu or add items from the Admin Dashboard to feature them here.
            </p>
            <Link
              to="/menu"
              className="inline-block mt-2 text-xs font-bold text-amber-600 hover:underline"
            >
              Browse Full Menu &rarr;
            </Link>
          </div>
        ) : (
          <div
            ref={cardsContainerRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7"
          >
            {popularItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
