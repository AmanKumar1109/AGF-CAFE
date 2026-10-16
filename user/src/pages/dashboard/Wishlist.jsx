import React, { useRef, useEffect } from 'react';
import { Heart, ShoppingBag, Plus, Minus, UtensilsCrossed } from 'lucide-react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import gsap from 'gsap';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';

export const Wishlist = () => {
  const { userProfile, toggleWishlist } = useAuth();
  const { addToCart, cart, updateQuantity, setIsCartOpen } = useCart();
  
  const wishlist = userProfile?.wishlist || [];
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.dish-card', {
        scale: 0.92,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'back.out(1.4)',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [wishlist.length]);

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
          My Wishlist
        </h1>
        <p className="text-stone-500 font-medium text-xs sm:text-sm mt-1">
          Your favorite cafe dishes, coffee brews, and desserts ready to order
        </p>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {wishlist.map(item => {
            const dish = typeof item === 'object' ? item : { id: item, name: 'Cafe Special', price: 149 };
            const cartItem = cart.find(ci => ci.id === dish.id);
            const quantityInCart = cartItem ? cartItem.quantity : 0;
            const dishImage = dish.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400';

            return (
              <div 
                key={dish.id} 
                className="dish-card bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow hover:border-stone-300 transition-all duration-200 flex flex-col justify-between p-3.5 sm:p-5 group"
              >
                <div>
                  <div className="relative h-36 sm:h-44 bg-stone-100 rounded-2xl overflow-hidden mb-3.5">
                    <img 
                      src={dishImage} 
                      alt={dish.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <button 
                      onClick={() => toggleWishlist(dish)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-pink-600 hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer border border-stone-200"
                      title="Remove from Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-pink-500 stroke-pink-600" />
                    </button>
                    {dish.originalPrice > dish.price && (
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-full shadow-sm">
                        {Math.round(((dish.originalPrice - dish.price) / dish.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-stone-900 text-xs sm:text-base mb-1 line-clamp-1">
                      {dish.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-3.5">
                      <span className="text-base sm:text-xl font-black text-stone-900 font-mono">
                        ₹{dish.price}
                      </span>
                      {dish.originalPrice > dish.price && (
                        <span className="text-[10px] sm:text-xs font-bold text-stone-400 line-through">
                          ₹{dish.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {quantityInCart > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-between bg-amber-400 text-stone-950 p-1 sm:p-1.5 rounded-2xl shadow-sm">
                        <button
                          onClick={() => updateQuantity(dish.id, quantityInCart - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/10 hover:bg-black/20 text-stone-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs sm:text-sm px-2 font-mono">{quantityInCart}</span>
                        <button
                          onClick={() => updateQuantity(dish.id, quantityInCart + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/10 hover:bg-black/20 text-stone-950 flex items-center justify-center font-black transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-9 h-9 sm:w-11 sm:h-11 bg-stone-100 text-stone-800 flex items-center justify-center rounded-2xl shadow-sm cursor-pointer hover:bg-stone-200 transition-all border border-stone-200"
                        title="View Cart"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(dish, 1)}
                      className="w-full py-2.5 sm:py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon={Heart}
          title="Your wishlist is empty"
          description="Save artisan dishes and hand-crafted coffees here to quickly order them anytime."
          actionText="Browse Cafe Menu"
          actionLink="/menu"
        />
      )}
    </div>
  );
};

export default Wishlist;
