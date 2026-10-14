import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../../context/useCart';

export const MenuItemCard = ({ item }) => {
  const { addToCart } = useCart();
  const isOutOfStock = item.inStock === false;

  return (
    <div className={`group relative bg-white rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/60 hover:-translate-y-1 ${isOutOfStock ? 'opacity-75' : ''}`}>
      
      {/* Top Image & Badge */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-4">
        {item.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md tracking-wide">
              {item.badge}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-stone-900/80 backdrop-blur-xs text-stone-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-stone-700 shadow-md">
              Sold Out
            </span>
          </div>
        )}

        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className={`w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale-40' : ''}`}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />

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

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg sm:text-xl font-extrabold text-stone-900">
              ₹ {item.price}
            </span>
            {item.calories && (
              <span className="text-[11px] text-stone-400 font-medium">
                {item.calories}
              </span>
            )}
          </div>

          <button
            onClick={() => !isOutOfStock && addToCart(item)}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed shadow-none'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30'
            }`}
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
