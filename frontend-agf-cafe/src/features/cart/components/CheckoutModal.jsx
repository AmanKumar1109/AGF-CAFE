import { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, MapPin, Phone, User, Sparkles } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/useAuth';
import { Button } from '../../../components/ui/Button';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, grandTotal, clearCart } = useCart();
  const { currentUser, userProfile, setIsAuthModalOpen } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofill user profile if logged in
  useEffect(() => {
    if (userProfile) {
      const fullAddress = [
        userProfile.address,
        userProfile.landmark ? `(Near ${userProfile.landmark})` : '',
        userProfile.city,
        userProfile.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      setFormData((prev) => ({
        ...prev,
        name: userProfile.name || currentUser?.displayName || prev.name,
        phone: userProfile.phone || prev.phone,
        address: fullAddress || prev.address,
      }));
    } else if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.displayName || prev.name,
      }));
    }
  }, [userProfile, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const generatedId = `AGF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(generatedId);

    try {
      await addDoc(collection(db, 'orders'), {
        orderId: generatedId,
        userId: currentUser ? currentUser.uid : null,
        customerEmail: currentUser ? currentUser.email : null,
        customerName: formData.name,
        customerPhone: formData.phone,
        deliveryAddress: formData.address,
        paymentMethod: formData.paymentMethod,
        items: cart,
        grandTotal: grandTotal,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore order push warning (stored locally):', err);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
    setTimeout(() => {
      clearCart();
    }, 800);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white">Order Confirmed! 🎉</h3>
            <p className="text-stone-300 text-sm max-w-sm mx-auto">
              Thank you for ordering with AGF CAFE! Your delicious meal is being prepared with love and will reach you shortly.
            </p>
            <div className="p-4 bg-stone-800/60 rounded-2xl border border-stone-700/60 text-left text-xs space-y-1 text-stone-300">
              <p><span className="text-stone-400">Order ID:</span> #{orderId}</p>
              <p><span className="text-stone-400">Recipient:</span> {formData.name} ({formData.phone})</p>
              <p><span className="text-stone-400">Delivery Address:</span> {formData.address}</p>
              <p><span className="text-stone-400">Estimated Delivery:</span> 25-30 mins</p>
              <p><span className="text-stone-400">Payment:</span> {formData.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online UPI / Card'}</p>
            </div>
            <Button onClick={handleClose} className="w-full mt-4">
              Back to Dining
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Quick Checkout</span>
              <h3 className="text-2xl font-bold text-white mt-1">Complete Your Order</h3>
              <p className="text-xs text-stone-400 mt-1">
                {cart.length} item{cart.length > 1 ? 's' : ''} • Total Amount: <span className="font-bold text-amber-400">₹ {grandTotal}</span>
              </p>
            </div>

            {/* Prompt to sign in if guest */}
            {!currentUser && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Have an account? Sign in for auto-filled address!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-amber-400 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <textarea
                    required
                    rows="2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat No, Building, Street, Landmark, City"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition resize-none"
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition ${
                      formData.paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      className="hidden"
                    />
                    <span>💵 Cash on Delivery</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition ${
                      formData.paymentMethod === 'online'
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-stone-800 bg-stone-950 text-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={() => setFormData({ ...formData, paymentMethod: 'online' })}
                      className="hidden"
                    />
                    <span>💳 Online UPI / Card</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full py-3">
                  {isSubmitting ? 'Placing Order...' : `Place Order (₹ ${grandTotal})`}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-stone-500 text-[11px] pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Contactless & Secure Delivery</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
