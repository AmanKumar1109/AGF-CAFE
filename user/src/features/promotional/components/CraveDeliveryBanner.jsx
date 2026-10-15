import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const CraveDeliveryBanner = () => {
  const navigate = useNavigate();
  const bannerRef = useRef(null);
  const doodleRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Floating animation for the doodle badge
      gsap.to(doodleRef.current, {
        y: -8,
        rotation: 2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, bannerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={bannerRef} className="w-full bg-[#faf7f2] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0c1713] via-[#0f1f1a] to-[#08120e] text-white p-8 sm:p-12 lg:p-16 border border-emerald-950/60 shadow-2xl">
          
          {/* Subtle green ambient light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 text-left space-y-5 sm:space-y-6 z-10">
              <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-emerald-400 uppercase">
                Good Food Always
              </span>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                <span className="font-handwriting text-amber-400 text-5xl sm:text-6xl lg:text-7xl block -mb-2 font-normal">
                  Crave It?
                </span>
                We'll Deliver It!
              </h2>

              <p className="text-stone-300 text-sm sm:text-base max-w-md leading-relaxed">
                Order your favorite food now and enjoy the perfect blend of taste and freshness delivered straight to your doorstep in minutes.
              </p>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate('/menu')}
                  className="px-8 py-3.5 font-bold shadow-xl shadow-amber-500/20 group"
                  icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />}
                >
                  Order Now
                </Button>
              </div>
            </div>

            {/* Right Visual Image with Doodle */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              
              {/* Handwritten doodle badge */}
              <div
                ref={doodleRef}
                className="absolute top-2 sm:top-4 right-4 sm:right-10 z-20 pointer-events-none select-none text-right"
              >
                <div className="bg-stone-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-400/30 shadow-lg">
                  <p className="font-handwriting text-xl sm:text-2xl text-amber-300 font-bold leading-tight">
                    Good Food ♡<br />
                    Good Vibes
                  </p>
                  <span className="text-amber-400 text-lg font-bold block transform -rotate-45 -mr-1">
                    ⤹
                  </span>
                </div>
              </div>

              {/* Pizza & Spread image */}
              <div className="relative w-full max-w-lg aspect-[16/10] rounded-3xl overflow-hidden border border-emerald-900/40 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80"
                  alt="Delicious Pizza and Drinks"
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-stone-200 border border-white/10 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wood Fired & Oven Fresh</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
