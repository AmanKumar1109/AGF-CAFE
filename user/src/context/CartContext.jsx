import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
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

  useEffect(() => {
    try {
      localStorage.setItem('agf_cafe_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to local storage', e);
    }
  }, [cart]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

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
  };

  const getItemTotalQuantity = (itemId) => {
    return cart
      .filter((item) => String(item.id) === String(itemId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

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
        deliveryFee,
        grandTotal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
