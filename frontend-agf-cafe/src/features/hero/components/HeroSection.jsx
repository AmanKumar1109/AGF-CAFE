import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { HeroVideo } from './HeroVideo';
import { HeroFeatures } from './HeroFeatures';

export const HeroSection = () => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const badgeRef = useRef(null);
  const floatingBadgeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(badgeRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
      })
        .from(titleRef.current, {
          y: 30,
          opacity: 0,
          duration: 0.8,
        }, '-=0.3')
        .from(subtitleRef.current, {
          y: 25,
          opacity: 0,
          duration: 0.7,
        }, '-=0.4')
        .from(ctaRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.6,
        }, '-=0.3');

      // Floating doodle badge animation
      gsap.to(floatingBadgeRef.current, {
        y: -12,
        rotation: 2,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center overflow-hidden text-white pt-28 pb-16 lg:pt-36 lg:pb-24"
    >
      {/* Full Hero Video playing directly - crystal clear without shadow filters */}
      <HeroVideo />

      {/* Hero Foreground Content directly over video */}
      <div className="relative z-10 w-full px-5 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Main Left Content */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8 text-left">

            {/* Tagline Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-amber-300 bg-black/40 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-md">
                AGF CAFE • Fresh & Fast
              </span>
            </div>

            {/* Main Headline */}
            <h1
              ref={titleRef}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              Baharagora ka <br />
              <span className="font-handwriting text-amber-400 font-bold text-5xl sm:text-7xl lg:text-8xl inline-block transform -rotate-2 relative drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                Zomato ♡
              </span>
            </h1>

            {/* Subtitle Description */}
            <p
              ref={subtitleRef}
              className="text-base sm:text-lg text-stone-100 max-w-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              From cheesy pizzas to juicy burgers, enjoy Beheragoda's most loved food delivered hot and fresh with a whole lot of love.
            </p>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  const menuSection = document.getElementById('popular-menu');
                  if (menuSection) {
                    menuSection.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/menu');
                  }
                }}
                className="group px-8 py-3.5 text-base font-bold shadow-2xl shadow-amber-500/40"
                icon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />}
              >
                Order Now
              </Button>

              <button
                onClick={() => navigate('/menu')}
                className="px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-black/40 hover:bg-black/60 border border-white/30 backdrop-blur-md transition-all duration-300 shadow-lg cursor-pointer"
              >
                Explore Full Menu
              </button>
            </div>

            {/* 3 Trust Feature Columns */}
            <HeroFeatures />
          </div>

          {/* Right Floating Badge / Callout */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div
              ref={floatingBadgeRef}
              className="relative inline-block bg-black/50 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl shadow-black max-w-xs text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase mb-1">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                <span>Speciality</span>
              </div>
              <h3 className="font-handwriting text-3xl sm:text-4xl font-bold text-amber-300 leading-tight drop-shadow-md">
                Best Burger<br />in Town 🍔
              </h3>
              <p className="text-xs text-stone-200 mt-2">
                Flame-grilled fresh patty, melted cheese & house secret glaze.
              </p>
              {/* Hand drawn arrow icon */}
              <div className="mt-2 text-amber-400 text-center font-bold text-lg">
                ↓↓↓
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
