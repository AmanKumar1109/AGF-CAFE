import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { usePricingSettings } from '../hooks/usePricingSettings';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('agf_cafe_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Coupon state
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const savedCoupon = localStorage.getItem('agf_cafe_coupon');
      return savedCoupon ? JSON.parse(savedCoupon) : null;
    } catch {
      return null;
    }
  });
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('agf_cafe_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to local storage', e);
    }
  }, [cart]);

  // Persist applied coupon
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('agf_cafe_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('agf_cafe_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon to local storage', e);
    }
  }, [appliedCoupon]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Real-time listener for available coupons from Firestore
  useEffect(() => {
    try {
      const q = collection(db, 'coupons');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const list = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((c) => {
              // Active check
              if (c.isActive === false) return false;

              // Expiry check
              if (c.validUntil) {
                const expiry = new Date(c.validUntil);
                if (expiry < today) return false;
              }

              // Target audience check
              if (c.userId) {
                if (!currentUser || c.userId !== currentUser.uid) return false;
              }

              // Check if user already used this personal coupon
              if (userProfile?.usedCoupons) {
                const usedList = Array.isArray(userProfile.usedCoupons)
                  ? userProfile.usedCoupons
                  : [userProfile.usedCoupons];
                if (usedList.includes(c.id) || usedList.includes(c.code)) {
                  return false;
                }
              }

              return true;
            });

          setAvailableCoupons(list);
        },
        (error) => {
          console.warn('Error fetching available coupons:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Coupon listener initialization error:', err);
    }
  }, [currentUser, userProfile?.usedCoupons]);

  const getCartItemId = (item) => {
    if (item.cartItemId) return item.cartItemId;
    const addOnsPart = (item.selectedAddOns || [])
      .map((a) => `${a.name}:${a.price || 0}`)
      .sort()
      .join('|');
    const notePart = (item.specialInstructions || '').trim().toLowerCase();
    if (!addOnsPart && !notePart) {
      return String(item.id);
    }
    return `${item.id}_${addOnsPart}_${notePart}`;
  };

  const addToCart = (item, quantityToAdd = 1) => {
    const qty = parseInt(quantityToAdd, 10) || 1;
    const key = getCartItemId(item);
    const itemWithKey = {
      ...item,
      cartItemId: key,
      basePrice: item.basePrice || item.price,
    };

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => (cartItem.cartItemId || String(cartItem.id)) === key
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          (cartItem.cartItemId || String(cartItem.id)) === key
            ? { ...cartItem, quantity: cartItem.quantity + qty }
            : cartItem
        );
      }
      return [...prevCart, { ...itemWithKey, quantity: qty }];
    });
    showToast(`Added ${item.name} to cart!`);
  };

  const removeFromCart = (identifier) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          item.cartItemId !== identifier &&
          String(item.id) !== String(identifier)
      )
    );
  };

  const updateQuantity = (identifier, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(identifier);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === identifier || String(item.id) === String(identifier)
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setPromoError('');
    setPromoSuccess('');
    try {
      localStorage.removeItem('agf_cafe_coupon');
    } catch (e) {
      console.warn('Coupon removal error:', e);
    }
  };

  const getItemTotalQuantity = (itemId) => {
    return cart
      .filter((item) => String(item.id) === String(itemId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Base calculations
  const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // Recalculate discount whenever subtotal or appliedCoupon changes
  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    const minRequired = parseFloat(appliedCoupon.minOrderValue) || 0;

    // Auto-remove if cart dropped below threshold
    if (subtotal < minRequired) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setPromoSuccess('');
      setPromoError(`Coupon ${appliedCoupon.code} requires minimum cart of ₹${minRequired}`);
      showToast(`Coupon ${appliedCoupon.code} removed: Cart is below ₹${minRequired}`);
      return;
    }

    let calculatedDiscount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      const pct = parseFloat(appliedCoupon.discountValue) || 0;
      calculatedDiscount = (subtotal * pct) / 100;
      const maxLimit = parseFloat(appliedCoupon.maxDiscount) || 0;
      if (maxLimit > 0 && calculatedDiscount > maxLimit) {
        calculatedDiscount = maxLimit;
      }
    } else {
      // Flat discount
      calculatedDiscount = parseFloat(appliedCoupon.discountValue) || 0;
    }

    // Discount cannot exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, subtotal);
    setDiscountAmount(Math.round(calculatedDiscount));
  }, [subtotal, appliedCoupon]);

  // Apply Promo Action
  const handleApplyPromo = useCallback(
    (codeToApply) => {
      setPromoError('');
      setPromoSuccess('');

      const raw = (codeToApply || promoCodeInput || '').trim().toUpperCase();
      if (!raw) {
        setPromoError('Please enter a coupon code');
        return false;
      }

      if (cart.length === 0 || subtotal === 0) {
        setPromoError('Your cart is empty. Add food items first!');
        return false;
      }

      const match = availableCoupons.find((c) => c.code?.toUpperCase() === raw);
      if (!match) {
        setPromoError(`Coupon "${raw}" is invalid or expired`);
        return false;
      }

      if (match.isActive === false) {
        setPromoError(`Coupon "${raw}" is currently not active`);
        return false;
      }

      const minRequired = parseFloat(match.minOrderValue) || 0;
      if (subtotal < minRequired) {
        setPromoError(`Add items worth ₹${minRequired - subtotal} more to use "${match.code}" (Min: ₹${minRequired})`);
        return false;
      }

      // Calculate anticipated discount
      let discount = 0;
      if (match.discountType === 'percentage') {
        const pct = parseFloat(match.discountValue) || 0;
        discount = (subtotal * pct) / 100;
        const maxLimit = parseFloat(match.maxDiscount) || 0;
        if (maxLimit > 0 && discount > maxLimit) {
          discount = maxLimit;
        }
      } else {
        discount = parseFloat(match.discountValue) || 0;
      }
      discount = Math.min(discount, subtotal);
      discount = Math.round(discount);

      setAppliedCoupon(match);
      setDiscountAmount(discount);
      setPromoCodeInput('');
      setPromoSuccess(`🎉 Coupon "${match.code}" applied! You save ₹${discount}`);
      showToast(`Coupon "${match.code}" applied: ₹${discount} saved!`);
      return true;
    },
    [availableCoupons, promoCodeInput, cart.length, subtotal]
  );

  // Remove Promo Action
  const handleRemovePromo = useCallback(() => {
    const prevCode = appliedCoupon?.code;
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setPromoError('');
    setPromoSuccess('');
    if (prevCode) {
      showToast(`Coupon "${prevCode}" removed`);
    }
  }, [appliedCoupon]);

  // Dynamic Pricing Settings from Firestore
  const { pricingSettings } = usePricingSettings();

  // Delivery, Platform Fee, GST & Total Savings Calculation
  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);

  // 1. Delivery Partner Fee (Admin can discount from e.g. ₹40 down to ₹0)
  const deliveryFeeOriginal = Number(pricingSettings.deliveryFeeOriginal ?? 40);
  const isFreeDeliveryByThreshold = subtotal > 0 && pricingSettings.freeDeliveryThreshold && subtotal >= pricingSettings.freeDeliveryThreshold;
  const isDeliveryFeeZero = !pricingSettings.deliveryFeeEnabled || isFreeDeliveryByThreshold || pricingSettings.deliveryFee === 0;
  const deliveryFee = subtotal === 0 ? 0 : (isDeliveryFeeZero ? 0 : Number(pricingSettings.deliveryFee ?? 40));
  const deliveryFeeSaved = subtotal > 0 ? Math.max(0, deliveryFeeOriginal - deliveryFee) : 0;

  // 2. Platform Fee (Admin can discount from e.g. ₹10 down to ₹0 or ₹5)
  const platformFeeOriginal = Number(pricingSettings.platformFeeOriginal ?? 10);
  const isPlatformFeeZero = !pricingSettings.platformFeeEnabled || pricingSettings.platformFee === 0;
  const platformFee = subtotal === 0 ? 0 : (isPlatformFeeZero ? 0 : Number(pricingSettings.platformFee ?? 5));
  const platformFeeSaved = subtotal > 0 && pricingSettings.platformFeeEnabled ? Math.max(0, platformFeeOriginal - platformFee) : 0;

  // 3. GST 5% (Standard Cafe Restaurant GST)
  const gstPercentage = Number(pricingSettings.gstPercentage ?? 5.0);
  const gstEnabled = Boolean(pricingSettings.gstEnabled ?? true);
  const gstAmount = subtotal === 0 || !gstEnabled 
    ? 0 
    : Math.round((effectiveSubtotal * (gstPercentage / 100)) * 100) / 100;

  // 4. Total Saved on this Order (Coupon + Delivery Fee Saved + Platform Fee Saved)
  const totalSaved = Math.round((discountAmount + deliveryFeeSaved + platformFeeSaved) * 100) / 100;

  // 5. Grand Total (Net payable)
  const grandTotal = subtotal === 0 
    ? 0 
    : Math.max(0, Math.round((effectiveSubtotal + deliveryFee + platformFee + gstAmount) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemTotalQuantity,
        totalCount,
        subtotal,
        discountAmount,
        // Delivery Partner Fee
        deliveryFee,
        deliveryFeeOriginal,
        deliveryFeeSaved,
        // Platform Fee
        platformFee,
        platformFeeOriginal,
        platformFeeSaved,
        // GST 5%
        gstPercentage,
        gstEnabled,
        gstAmount,
        // Total Money Saved
        totalSaved,
        grandTotal,
        pricingSettings,
        toastMessage,
        showToast,
        // Coupon system exports
        availableCoupons,
        appliedCoupon,
        promoCodeInput,
        setPromoCodeInput,
        promoError,
        setPromoError,
        promoSuccess,
        setPromoSuccess,
        handleApplyPromo,
        handleRemovePromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
