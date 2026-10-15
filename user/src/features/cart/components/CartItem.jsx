import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../../context/useCart';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-900/60 border border-stone-800 hover:border-stone-700/80 transition-all">
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-stone-100 truncate">{item.name}</h4>
        <p className="text-xs text-stone-400 mt-0.5">₹ {item.price} each</p>
        <p className="text-sm font-bold text-amber-400 mt-1">₹ {item.price * item.quantity}</p>
      </div>

      <div className="flex items-center gap-2 bg-stone-800/80 px-2 py-1 rounded-full border border-stone-700/60">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-stone-200 min-w-[1rem] text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={() => removeFromCart(item.id)}
        className="text-stone-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
