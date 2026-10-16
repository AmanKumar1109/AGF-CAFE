import { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Ticket,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  Percent,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/useAuth';
import { CartItem } from './CartItem';
import { Button } from '../../../components/ui/Button';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    subtotal,
    discountAmount,
    deliveryFee,
    grandTotal,
    totalCount,
    showToast,
    availableCoupons,
    appliedCoupon,
    promoCodeInput,
    setPromoCodeInput,
    promoError,
    setPromoError,
    promoSuccess,
    handleApplyPromo,
    handleRemovePromo,
  } = useCart();

  const { currentUser, setIsAuthModalOpen } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [showCouponsList, setShowCouponsList] = useState(false);

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

  const handleFormApply = (e) => {
    e.preventDefault();
    handleApplyPromo();
  };

  if (!isCartOpen && !isCheckoutOpen) return null;

  return (
    <>
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-950 border-l border-stone-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Your Cart</h3>
                  <p className="text-xs text-stone-400">
                    {totalCount} item{totalCount === 1 ? '' : 's'} added
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center mx-auto text-stone-600">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-stone-300">Your cart is hungry!</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Explore our popular menu with crispy pizzas, gourmet burgers, and chilling shakes to add them here.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setIsCartOpen(false)}>
                    Browse Menu
                  </Button>
                </div>
              ) : (
                cart.map((item) => (
                  <CartItem key={item.cartItemId || item.id} item={item} />
                ))
              )}
            </div>

            {/* Footer / Summary with Coupons */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-stone-800 bg-stone-900/80 backdrop-blur-md space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                
                {/* ======================================================== */}
                {/* DISCOUNT COUPON SECTION                                  */}
                {/* ======================================================== */}
                <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-stone-200 uppercase tracking-wider">
                        Coupons & Offers
                      </span>
                    </div>

                    {availableCoupons?.length > 0 && !appliedCoupon && (
                      <button
                        type="button"
                        onClick={() => setShowCouponsList(!showCouponsList)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{availableCoupons.length} Available</span>
                        {showCouponsList ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* If Coupon Applied */}
                  {appliedCoupon ? (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-stone-900 border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-emerald-400 tracking-wider">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                              Applied
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-300/80 font-medium">
                            You saved ₹{discountAmount} on this order!
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-stone-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-800 transition text-xs font-bold cursor-pointer"
                        title="Remove Coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Coupon Input Field */
                    <form onSubmit={handleFormApply} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                          <input
                            type="text"
                            placeholder="Enter Promo Code (e.g. WELCOME50)"
                            value={promoCodeInput}
                            onChange={(e) => {
                              setPromoCodeInput(e.target.value.toUpperCase().replace(/\s/g, ''));
                              if (promoError) setPromoError('');
                            }}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white placeholder-stone-500 uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!promoCodeInput.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-stone-950 text-xs font-black rounded-xl transition shadow-md shadow-amber-500/10 cursor-pointer"
                        >
                          APPLY
                        </button>
                      </div>

                      {promoError && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{promoError}</span>
                        </div>
                      )}

                      {promoSuccess && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>{promoSuccess}</span>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Collapsible Available Coupons List */}
                  {showCouponsList && !appliedCoupon && availableCoupons?.length > 0 && (
                    <div className="pt-2 border-t border-stone-800/80 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                        Available For You
                      </p>
                      {availableCoupons.map((coupon) => {
                        const isPercentage = coupon.discountType === 'percentage';
                        const isEligible = subtotal >= (parseFloat(coupon.minOrderValue) || 0);

                        return (
                          <div
                            key={coupon.id}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                              isEligible
                                ? 'bg-stone-900/90 border-stone-800 hover:border-amber-500/50'
                                : 'bg-stone-900/40 border-stone-800/50 opacity-60'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {coupon.code}
                                </span>
                                <span className="text-[11px] font-black text-white">
                                  {isPercentage
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} OFF`}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400 line-clamp-1">
                                Min order: ₹{coupon.minOrderValue || 0}
                                {isPercentage && coupon.maxDiscount > 0 && ` • Max ₹${coupon.maxDiscount}`}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyPromo(coupon.code)}
                              disabled={!isEligible}
                              className={`px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase transition cursor-pointer shrink-0 ${
                                isEligible
                                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs'
                                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              {isEligible ? 'APPLY' : `+₹${coupon.minOrderValue - subtotal}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="space-y-2 text-xs text-stone-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-stone-200 font-medium">₹ {subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Discount ({appliedCoupon?.code})</span>
                      </span>
                      <span>-₹ {discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 font-semibold">FREE</span>
                      ) : (
                        `₹ ${deliveryFee}`
                      )}
                    </span>
                  </div>

                  {deliveryFee > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Add ₹ {500 - (subtotal - discountAmount)} more for FREE delivery!</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-stone-800">
                    <span>Grand Total</span>
                    <span className="text-amber-400 text-base font-black font-mono">
                      ₹ {grandTotal}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full justify-center group"
                  size="lg"
                >
                  <span>Proceed to Checkout • ₹{grandTotal}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};
