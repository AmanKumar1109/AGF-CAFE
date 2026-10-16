import { Minus, Plus, Trash2, ChefHat, Sparkles } from 'lucide-react';
import { useCart } from '../../../context/useCart';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const itemIdentifier = item.cartItemId || item.id;

  const hasAddOns = item.selectedAddOns && item.selectedAddOns.length > 0;
  const hasNotes = Boolean(item.specialInstructions && item.specialInstructions.trim());

  return (
    <div className="flex flex-col p-3 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-stone-700/80 transition-all text-left space-y-2">
      <div className="flex items-start gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0 mt-0.5"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-bold text-stone-100 truncate">{item.name}</h4>
            <button
              onClick={() => removeFromCart(itemIdentifier)}
              className="text-stone-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer shrink-0"
              title="Remove item"
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xs text-stone-400">₹{item.price} each</span>
            {hasAddOns && item.basePrice && item.basePrice !== item.price && (
              <span className="text-[10px] text-stone-500 line-through">Base: ₹{item.basePrice}</span>
            )}
          </div>

          <p className="text-sm font-black text-amber-400 mt-1 font-mono">
            ₹{item.price * item.quantity}
          </p>
        </div>
      </div>

      {/* Selected Add-ons Badges */}
      {hasAddOns && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-stone-800/80">
          {item.selectedAddOns.map((addon, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"
            >
              <span>+ {addon.name}</span>
              {addon.price > 0 && <span className="text-stone-400">(₹{addon.price})</span>}
            </span>
          ))}
        </div>
      )}

      {/* Special Kitchen Notes */}
      {hasNotes && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-300 bg-stone-950/80 p-2 rounded-xl border border-stone-800">
          <ChefHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate italic">"{item.specialInstructions}"</span>
        </div>
      )}

      {/* Bottom Quantity Controller */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-800/50">
        <span className="text-[11px] font-semibold text-stone-400">Quantity</span>
        <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-0.5 rounded-full border border-stone-700/60">
          <button
            onClick={() => updateQuantity(itemIdentifier, item.quantity - 1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-xs font-bold text-stone-200 min-w-[1rem] text-center font-mono">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(itemIdentifier, item.quantity + 1)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

