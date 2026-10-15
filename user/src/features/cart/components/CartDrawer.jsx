import { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/useAuth';
import { CartItem } from './CartItem';
import { Button } from '../../../components/ui/Button';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, subtotal, deliveryFee, grandTotal, totalCount, showToast } = useCart();
  const { currentUser, setIsAuthModalOpen } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // When user logs in after clicking checkout, automatically resume checkout
  useEffect(() => {
    if (currentUser && pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  }, [currentUser, pendingCheckout]);

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      if (showToast) showToast('Please sign in first to place your order! ☕');
      setIsCartOpen(false);
      setPendingCheckout(true);
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  if (!isCartOpen && !isCheckoutOpen) return null;

  return (
    <>
      {isCartOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />

          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-950 border-l border-stone-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Your Cart</h3>
              <p className="text-xs text-stone-400">{totalCount} item{totalCount === 1 ? '' : 's'} added</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {cart.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center mx-auto text-stone-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-stone-300">Your cart is hungry!</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Explore our popular menu with crispy pizzas, gourmet burgers, and chilling shakes to add them here.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCartOpen(false)}
              >
                Browse Menu
              </Button>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-stone-800 bg-stone-900/60 backdrop-blur-md space-y-3">
            <div className="space-y-1.5 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-200 font-medium">₹ {subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-400 font-semibold">FREE</span> : `₹ ${deliveryFee}`}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Add ₹ {500 - subtotal} more for FREE delivery!</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-stone-800">
                <span>Total</span>
                <span className="text-amber-400">₹ {grandTotal}</span>
              </div>
            </div>

            <Button
              onClick={handleProceedToCheckout}
              className="w-full justify-center group"
              size="lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
      </>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
};
