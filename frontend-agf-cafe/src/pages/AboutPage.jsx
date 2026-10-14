import { Award, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#faf7f2] text-stone-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-amber-600 uppercase">
            Our Story & Heritage
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-tight">
            Crafting Food With Passion & <span className="font-handwriting text-amber-600 text-6xl">Love</span>
          </h1>
          <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
            AGF CAFE was born from a simple belief: Beheragoda deserves the best cafe dining without compromising on quality, freshness, or warmth. Every burger is hand-shaped, every pizza hand-tossed, and every milkshake prepared fresh on spot.
          </p>
        </div>

        {/* Visual Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
              alt="Our Kitchen & Chefs"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-stone-900/90 text-white p-4 rounded-2xl backdrop-blur-md border border-stone-700/60 flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Award Winning Quality</p>
                <p className="text-sm font-semibold">Best Casual Cafe 2025</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Our Promise</span>
              <h2 className="text-3xl font-extrabold text-stone-900">Why Food Lovers Choose AGF CAFE</h2>
            </div>
            
            <p className="text-stone-600 text-sm leading-relaxed">
              We collaborate directly with local dairy farms and artisan bakeries to procure the finest flour, unadulterated cheddar cheese, and farm-fresh organic vegetables every single morning.
            </p>

            <div className="space-y-3 pt-2">
              {[
                '100% Preservative-free brioche buns baked daily',
                'Stone ground San Marzano tomato pizza sauce',
                'Prime cuts marinated with authentic herbs & spices',
                'Strict 5-star temperature controlled kitchen hygiene',
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-stone-800">{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={() => navigate('/menu')} size="lg">
                Taste Our Dishes
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
