import React, { useState } from 'react';
import { ShoppingCart, Star, Heart, Plus, Minus, ShoppingBag, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/useAuth';
import { ItemCustomizationModal } from './ItemCustomizationModal';

export const MenuItemCard = ({ item }) => {
  const { cart, addToCart, updateQuantity, getItemTotalQuantity, setIsCartOpen, showToast } = useCart();
  const { currentUser, userProfile, toggleWishlist, setIsAuthModalOpen } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const isOutOfStock = item.inStock === false;

  // Real-time cart check across any customizations of this item
  const quantityInCart = getItemTotalQuantity ? getItemTotalQuantity(item.id) : (cart?.filter((ci) => String(ci.id) === String(item.id)).reduce((s, i) => s + i.quantity, 0) || 0);

  // Real-time wishlist check
  const wishlist = userProfile?.wishlist || [];
  const isWishlisted = wishlist.some((w) =>
    typeof w === 'object' ? w.id === item.id : w === item.id
  );

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsLiking(true);
      const willBeWishlisted = !isWishlisted;
      await toggleWishlist(item);
      if (showToast) {
        showToast(
          willBeWishlisted
            ? `Saved "${item.name}" to Wishlist! ❤️`
            : `Removed "${item.name}" from Wishlist`
        );
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setTimeout(() => setIsLiking(false), 300);
    }
  };

  return (
    <>
      <div
        className={`group relative bg-white rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/60 hover:-translate-y-1 ${
          isOutOfStock ? 'opacity-75' : ''
        }`}
      >
        {/* Top Image & Badges & Wishlist Heart */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-4">
          {/* Left Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
            {item.badge && (
              <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md tracking-wide">
                {item.badge}
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-stone-900/85 backdrop-blur-xs text-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-stone-700 shadow-md">
                Sold Out
              </span>
            )}
          </div>

          {/* Right Wishlist / Like Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isLiking}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-90 ${
              isWishlisted
                ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105 ring-2 ring-rose-400/50'
                : 'bg-black/45 hover:bg-black/65 text-white/90 hover:text-rose-400 backdrop-blur-md border border-white/20'
            }`}
            title={isWishlisted ? 'Saved in Wishlist (Click to remove)' : 'Save to Wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-300 ${
                isWishlisted ? 'fill-current scale-110' : 'hover:scale-110'
              } ${isLiking ? 'scale-125' : ''}`}
            />
          </button>

          {/* Product Image */}
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className={`w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale-40' : ''
            }`}
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Rating Badge */}
          {item.rating && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-semibold text-white">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{item.rating}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col text-left">
          <div className="flex items-center gap-2">
            {item.isVeg !== undefined && (
              <span
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                  item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                }`}
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-stone-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
            {item.description}
          </p>

          {/* Price & Add to Cart / Quantity Controller */}
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold text-stone-900">
                  ₹{item.price}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-xs text-stone-400 line-through font-medium">
                    ₹{item.originalPrice}
                  </span>
                )}
              </div>
              {item.calories && (
                <span className="text-[11px] text-stone-400 font-medium">
                  {item.calories}
                </span>
              )}
            </div>

            {quantityInCart > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {/* Minus - Count - Plus Interactive Controller */}
                  <div className="flex-1 flex items-center justify-between bg-amber-400 text-stone-950 p-1 sm:p-1.5 rounded-2xl shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, quantityInCart - 1)}
                      className="w-8 h-8 rounded-xl bg-black/10 hover:bg-black/20 active:bg-black/30 text-stone-950 flex items-center justify-center font-black transition-all cursor-pointer active:scale-90"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <span className="font-black text-sm sm:text-base px-2 font-mono">
                      {quantityInCart}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomizing(true)}
                      className="w-8 h-8 rounded-xl bg-black/10 hover:bg-black/20 active:bg-black/30 text-stone-950 flex items-center justify-center font-black transition-all cursor-pointer active:scale-90"
                      title="Add more or customize"
                      aria-label="Add more or customize"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* View Cart Quick Button */}
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-stone-900 hover:bg-stone-800 text-amber-400 flex items-center justify-center rounded-2xl shadow-sm cursor-pointer transition-all border border-stone-800 active:scale-95 shrink-0"
                    title="Open Cart"
                    aria-label="Open Cart"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] px-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomizing(true)}
                    className="text-amber-800 hover:text-amber-950 font-black hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Customise</span>
                    <span className="text-[9px]">▾</span>
                  </button>
                  <span className="text-stone-400 font-medium">Customised in cart</span>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => !isOutOfStock && setIsCustomizing(true)}
                  disabled={isOutOfStock}
                  className={`w-full flex items-center justify-between py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none'
                      : 'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-stone-950 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                    <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                  </div>
                  {!isOutOfStock && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-md">
                      Customise +
                    </span>
                  )}
                </button>
                {!isOutOfStock && (
                  <p className="text-[10px] text-stone-400 text-center font-medium mt-1">
                    Customisable toppings & cooking notes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zomato / Swiggy style customization modal */}
      <ItemCustomizationModal 
        item={item} 
        isOpen={isCustomizing} 
        onClose={() => setIsCustomizing(false)} 
      />
    </>
  );
};

