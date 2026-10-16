import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Sparkles,
  Plus,
  Navigation,
  Loader2,
  Check,
  Home,
  Briefcase,
  Tag,
  Clock,
  ArrowRight,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useCart } from '../../../context/useCart';
import { useAuth } from '../../../context/useAuth';
import { Button } from '../../../components/ui/Button';
import { sendOrderReceivedEmail } from '../../../utils/emailTemplates';
import LocationPickerModal from '../../../components/location/LocationPickerModal';
import { 
  checkDeliveryServiceable, 
  checkAddressTextServiceability, 
  calculateDistance, 
  calculateETA,
  resolveOrderCoordinates,
  AGF_CAFE_HUB, 
  MAX_DELIVERY_RADIUS_KM 
} from '../../../utils/locationUtils';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const {
    cart,
    subtotal,
    discountAmount,
    deliveryFee,
    grandTotal,
    clearCart,
    showToast,
    appliedCoupon,
    availableCoupons,
    promoCodeInput,
    setPromoCodeInput,
    promoError,
    setPromoError,
    promoSuccess,
    handleApplyPromo,
    handleRemovePromo,
  } = useCart();
  const { currentUser, userProfile, addAddress, updateAddress, setIsAuthModalOpen } = useAuth();

  // Address state
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [geoCheckResult, setGeoCheckResult] = useState(null);

  // Form for new address
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    houseNo: '',
    street: '',
    locality: '',
    city: 'Baharagora',
    pincode: '832101',
    type: 'Home',
    lat: null,
    lng: null,
    deliveryInstructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'online'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Compute addresses list
  const savedAddresses = userProfile?.addresses || [];
  
  // If user has a single string address but no addresses array, create a virtual item
  const addresses = savedAddresses.length > 0 ? savedAddresses : (userProfile?.address ? [{
    id: 'profile_addr_default',
    name: userProfile.name || currentUser?.displayName || '',
    phone: userProfile.phone || '',
    street: userProfile.address,
    locality: userProfile.landmark || '',
    city: userProfile.city || 'Baharagora',
    pincode: userProfile.pincode || '832101',
    type: 'Home',
    isPrimary: true
  }] : []);

  // Determine active address
  useEffect(() => {
    if (addresses.length > 0) {
      if (!activeAddressId || !addresses.some(a => a.id === activeAddressId)) {
        const primary = addresses.find(a => a.isPrimary) || addresses[0];
        setActiveAddressId(primary.id);
      }
      setShowNewAddressForm(false);
    } else {
      setShowNewAddressForm(true);
    }
  }, [addresses.length, userProfile?.primaryAddressId, isOpen]);

  // Pre-fill name and phone when user opens modal
  useEffect(() => {
    if (userProfile || currentUser) {
      setAddressForm((prev) => ({
        ...prev,
        name: prev.name || userProfile?.name || currentUser?.displayName || '',
        phone: prev.phone || userProfile?.phone || '',
      }));
    }
  }, [userProfile, currentUser, isOpen]);

  if (!isOpen) return null;

  const activeAddress = addresses.find(a => a.id === activeAddressId) || addresses[0] || null;
  const hasSavedAddress = Boolean(activeAddress && (activeAddress.street || activeAddress.houseNo || activeAddress.address));

  // Geolocation Auto-detect via openstreetmap Nominatim reverse geocode
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const detectedStreet = [addr.house_number, addr.road, addr.building, addr.suburb]
              .filter(Boolean)
              .join(', ');
            const detectedLocality = [addr.neighbourhood, addr.residential, addr.commercial]
              .filter(Boolean)
              .join(', ');
            const detectedCity = addr.city || addr.town || addr.village || addr.county || 'Baharagora';
            const detectedPincode = addr.postcode || '832101';

            setAddressForm((prev) => ({
              ...prev,
              street: detectedStreet || prev.street,
              locality: detectedLocality || prev.locality,
              city: detectedCity || prev.city,
              pincode: detectedPincode || prev.pincode,
            }));
            if (showToast) showToast('📍 Location detected successfully!');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          if (showToast) showToast('Could not fetch address details automatically.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (showToast) {
          showToast(err.code === 1 ? 'Location permission denied. Please enter address manually.' : 'Could not fetch your location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Location confirmed from LocationPickerModal
  const handleLocationConfirmed = async (locationData) => {
    setAddressForm((prev) => ({
      ...prev,
      street: locationData.street || prev.street,
      houseNo: locationData.houseNo || prev.houseNo,
      locality: locationData.landmark || prev.locality,
      city: locationData.city || prev.city,
      pincode: locationData.pincode || prev.pincode,
      lat: locationData.lat,
      lng: locationData.lng,
      deliveryInstructions: locationData.deliveryInstructions || prev.deliveryInstructions,
    }));

    // If an existing address is selected, also persist coordinates to it directly
    if (activeAddress && activeAddress.id && updateAddress) {
      activeAddress.lat = locationData.lat;
      activeAddress.lng = locationData.lng;
      try {
        await updateAddress(activeAddress.id, {
          lat: locationData.lat,
          lng: locationData.lng,
          street: locationData.street || activeAddress.street || activeAddress.address || '',
          locality: locationData.landmark || activeAddress.locality || '',
        });
      } catch (err) {
        console.warn('Could not update activeAddress lat/lng in profile:', err);
      }
    }

    setGeoCheckResult({
      isServiceable: locationData.isServiceable,
      distanceKm: locationData.distanceKm,
      eta: locationData.eta,
    });

    if (showToast) {
      showToast(`📍 Doorstep location pinned (${locationData.distanceKm} km from cafe • ${locationData.eta})!`);
    }
  };

  const handleSaveAndUseAddress = async () => {
    if (!currentUser) {
      if (showToast) showToast('Please sign in first to save your address! ☕');
      return;
    }

    if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
      if (showToast) showToast('Please enter your street address, city, and pincode.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const customerName = addressForm.name || userProfile?.name || currentUser?.displayName || 'Valued Customer';
      const customerPhone = addressForm.phone || userProfile?.phone || '';

      const newId = await addAddress({
        name: customerName,
        phone: customerPhone,
        houseNo: addressForm.houseNo || '',
        street: addressForm.street,
        locality: addressForm.locality || '',
        city: addressForm.city,
        pincode: addressForm.pincode,
        type: addressForm.type || 'Home',
        lat: addressForm.lat || null,
        lng: addressForm.lng || null,
        isPrimary: addresses.length === 0,
      });

      if (newId) {
        setActiveAddressId(newId);
      }
      setShowNewAddressForm(false);
      if (showToast) showToast('🎉 Address saved to your profile address section!');
    } catch (err) {
      console.error('Error saving address to profile:', err);
      if (showToast) showToast('Could not save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      if (showToast) showToast('Please sign in first to place your order! ☕');
      onClose();
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      return;
    }

    let finalShippingAddress = null;
    let finalCustomerName = '';
    let finalCustomerPhone = '';
    let resolvedLat = null;
    let resolvedLng = null;

    // If using new address form
    if (showNewAddressForm || !hasSavedAddress) {
      if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
        if (showToast) showToast('Please enter your street address, city, and pincode.');
        return;
      }

      finalCustomerName = addressForm.name || userProfile?.name || currentUser?.displayName || 'Valued Customer';
      finalCustomerPhone = addressForm.phone || userProfile?.phone || '';
      resolvedLat = addressForm.lat ? parseFloat(addressForm.lat) : null;
      resolvedLng = addressForm.lng ? parseFloat(addressForm.lng) : null;

      finalShippingAddress = {
        fullName: finalCustomerName,
        phone: finalCustomerPhone,
        houseNo: addressForm.houseNo || '',
        street: addressForm.street,
        locality: addressForm.locality || '',
        city: addressForm.city,
        pincode: addressForm.pincode,
        type: addressForm.type || 'Home',
        lat: resolvedLat,
        lng: resolvedLng,
        deliveryInstructions: addressForm.deliveryInstructions || '',
        addressLine1: [addressForm.houseNo, addressForm.street, addressForm.locality, addressForm.city, addressForm.pincode].filter(Boolean).join(', ')
      };

      // Guaranteed save to user profile in Firestore
      if (currentUser && addAddress) {
        try {
          const newId = await addAddress({
            name: finalCustomerName,
            phone: finalCustomerPhone,
            houseNo: addressForm.houseNo || '',
            street: addressForm.street,
            locality: addressForm.locality || '',
            city: addressForm.city,
            pincode: addressForm.pincode,
            type: addressForm.type || 'Home',
            lat: resolvedLat,
            lng: resolvedLng,
            isPrimary: addresses.length === 0,
          });
          if (newId) {
            setActiveAddressId(newId);
          }
        } catch (err) {
          console.warn('Could not auto-save address to profile:', err);
        }
      }
    } else {
      // Using existing saved address
      finalCustomerName = activeAddress.name || userProfile?.name || currentUser?.displayName || 'Valued Customer';
      finalCustomerPhone = activeAddress.phone || userProfile?.phone || '';
      resolvedLat = activeAddress.lat ? parseFloat(activeAddress.lat) : (addressForm.lat ? parseFloat(addressForm.lat) : null);
      resolvedLng = activeAddress.lng ? parseFloat(activeAddress.lng) : (addressForm.lng ? parseFloat(addressForm.lng) : null);

      finalShippingAddress = {
        fullName: finalCustomerName,
        phone: finalCustomerPhone,
        houseNo: activeAddress.houseNo || '',
        street: activeAddress.street || activeAddress.address || '',
        locality: activeAddress.locality || activeAddress.area || '',
        city: activeAddress.city || 'Baharagora',
        pincode: activeAddress.pincode || '832101',
        type: activeAddress.type || 'Home',
        lat: resolvedLat,
        lng: resolvedLng,
        deliveryInstructions: activeAddress.deliveryInstructions || addressForm.deliveryInstructions || '',
        addressLine1: [activeAddress.houseNo, activeAddress.street || activeAddress.address, activeAddress.locality, activeAddress.city, activeAddress.pincode].filter(Boolean).join(', ')
      };
    }

    // 5 KM DELIVERY RADIUS & TEXT SERVICEABILITY CHECK
    const textServiceCheck = checkAddressTextServiceability(finalShippingAddress);
    if (!textServiceCheck.isServiceable) {
      if (showToast) showToast(textServiceCheck.reason);
      return;
    }

    // Guarantee coordinates resolution from address text / landmarks if resolvedLat is null
    if (!resolvedLat || !resolvedLng || isNaN(resolvedLat) || isNaN(resolvedLng)) {
      const fallbackResolved = await resolveOrderCoordinates({
        deliveryAddress: finalShippingAddress.addressLine1,
        address: finalShippingAddress.addressLine1,
        shippingAddress: finalShippingAddress,
      });
      if (fallbackResolved && fallbackResolved.lat && fallbackResolved.lng) {
        resolvedLat = fallbackResolved.lat;
        resolvedLng = fallbackResolved.lng;
        finalShippingAddress.lat = resolvedLat;
        finalShippingAddress.lng = resolvedLng;
      }
    }

    if (resolvedLat && resolvedLng) {
      const radiusCheck = checkDeliveryServiceable(resolvedLat, resolvedLng);
      if (!radiusCheck.isServiceable) {
        if (showToast) {
          showToast(`🚫 Delivery Unavailable: Address is ${radiusCheck.distanceKm} km away. AGF Cafe delivers strictly within 5 km!`);
        }
        return;
      }
    }

    // Calculate road / aerial distance and ETA
    const calculatedDistanceKm = resolvedLat && resolvedLng 
      ? calculateDistance(AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng, resolvedLat, resolvedLng)
      : (geoCheckResult?.distanceKm || 2.5);
    const calculatedETA = calculateETA(calculatedDistanceKm);

    setIsSubmitting(true);
    const generatedId = `AGF-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomOtp = String(Math.floor(1000 + Math.random() * 9000));

    const orderPayload = {
      orderId: generatedId,
      userId: currentUser ? currentUser.uid : null,
      customerEmail: currentUser ? currentUser.email : null,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      deliveryAddress: finalShippingAddress.addressLine1,
      shippingAddress: finalShippingAddress,
      customerCoords: resolvedLat && resolvedLng ? { lat: resolvedLat, lng: resolvedLng } : { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
      lat: resolvedLat || AGF_CAFE_HUB.lat,
      lng: resolvedLng || AGF_CAFE_HUB.lng,
      distanceKm: calculatedDistanceKm,
      deliveryEta: calculatedETA,
      deliveryInstructions: finalShippingAddress.deliveryInstructions || '',
      paymentMethod: paymentMethod,
      items: cart,
      subtotal: subtotal,
      discountAmount: discountAmount || 0,
      couponApplied: appliedCoupon ? appliedCoupon.code : null,
      appliedCouponId: appliedCoupon ? (appliedCoupon.id || null) : null,
      deliveryFee: deliveryFee,
      grandTotal: grandTotal,
      totalAmount: grandTotal,
      status: 'Order Received',
      deliveryOtp: randomOtp,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'orders'), orderPayload);

      // Trigger Order Received Confirmation Email
      if (orderPayload.customerEmail) {
        sendOrderReceivedEmail(orderPayload).catch(console.warn);
      }

      // If user is signed in and used a coupon, record it in usedCoupons
      if (appliedCoupon && currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            usedCoupons: arrayUnion(appliedCoupon.id || appliedCoupon.code),
          });
        } catch (uErr) {
          console.warn('Could not record used coupon on user document:', uErr);
        }
      }
    } catch (err) {
      console.warn('Firestore order push error:', err);
    }

    setConfirmedOrder({
      id: generatedId,
      otp: randomOtp,
      name: finalCustomerName,
      phone: finalCustomerPhone,
      address: finalShippingAddress.addressLine1,
      paymentMethod: paymentMethod,
      subtotal: subtotal,
      discount: discountAmount,
      couponCode: appliedCoupon?.code || null,
      deliveryFee: deliveryFee,
      total: grandTotal,
    });

    setIsSubmitted(true);
    setIsSubmitting(false);
    clearCart();
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setConfirmedOrder(null);
    onClose();
  };

  // Mandatory Login Gate: Guests cannot place orders without signing in
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 text-center space-y-4">
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition cursor-pointer absolute top-5 right-5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <User className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
            Member Authentication
          </span>
          <h3 className="text-2xl font-black text-white font-serif">
            Sign In Required
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xs mx-auto leading-relaxed">
            Please log in or create an account to place your order, use saved addresses, and track live kitchen preparation.
          </p>

          <div className="pt-2">
            <Button
              onClick={() => {
                onClose();
                if (setIsAuthModalOpen) setIsAuthModalOpen(true);
              }}
              className="w-full py-3.5 justify-center gap-2 font-black text-sm cursor-pointer"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl text-stone-100 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-800 bg-stone-950/60 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-black">
                {isSubmitted ? 'Order Receipt' : 'Express Checkout'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-serif mt-0.5">
              {isSubmitted ? 'Order Confirmed! 🎉' : 'Delivery & Payment'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
          
          {isSubmitted && confirmedOrder ? (
            <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-500 text-stone-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25 animate-bounce">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-white font-serif">
                  Your Meal is Being Prepared! ☕
                </h4>
                <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  Our chef is brewing your favorites. Our rider will arrive at your doorstep in approx 25-30 minutes.
                </p>
              </div>

              {/* Order PIN Code Card */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl max-w-sm mx-auto text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Delivery Handover PIN (Share with rider)
                </span>
                <span className="text-3xl font-black text-white font-mono tracking-widest block">
                  {confirmedOrder.otp}
                </span>
              </div>

              {/* Order Info Breakdown */}
              <div className="p-5 bg-stone-950/80 rounded-2xl border border-stone-800 text-left text-xs space-y-2 text-stone-300">
                <div className="flex justify-between border-b border-stone-800/80 pb-2">
                  <span className="text-stone-400">Order ID</span>
                  <span className="font-bold text-white font-mono">#{confirmedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Recipient</span>
                  <span className="font-bold text-white">{confirmedOrder.name} ({confirmedOrder.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 shrink-0 mr-4">Delivery Address</span>
                  <span className="font-medium text-stone-200 text-right leading-relaxed">{confirmedOrder.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Payment Mode</span>
                  <span className="font-bold text-amber-400 uppercase">
                    {confirmedOrder.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online UPI / Card'}
                  </span>
                </div>
                {confirmedOrder.subtotal !== undefined && (
                  <div className="flex justify-between border-t border-stone-800/80 pt-2">
                    <span className="text-stone-400">Items Subtotal</span>
                    <span className="font-medium text-stone-200">₹{confirmedOrder.subtotal}</span>
                  </div>
                )}
                {confirmedOrder.discount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-400">
                    <span>Discount ({confirmedOrder.couponCode || 'Coupon'})</span>
                    <span>-₹{confirmedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>Delivery Fee</span>
                  <span>{confirmedOrder.deliveryFee === 0 ? 'FREE' : `₹${confirmedOrder.deliveryFee}`}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-800/80 text-sm font-black text-white">
                  <span>Grand Total</span>
                  <span className="text-amber-400 font-mono">₹{confirmedOrder.total}</span>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full py-3.5 mt-2">
                Back to Cafe Dining
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* ======================================================== */}
              {/* DELIVERY ADDRESS SECTION (Grovery-Hub Pattern)           */}
              {/* ======================================================== */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-black text-white font-serif">
                      Delivery Location
                    </h4>
                  </div>

                  {hasSavedAddress && !showNewAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* CASE A: User HAS a saved address and is NOT adding a new one */}
                {hasSavedAddress && !showNewAddressForm ? (
                  <div className="space-y-3">
                    {/* Primary Selected Address Box */}
                    <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/60 bg-emerald-950/20 relative shadow-md">
                      <div className="absolute top-4 right-4 text-emerald-400 flex items-center gap-1 text-[11px] font-black">
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black rounded-md uppercase">
                          {activeAddress.type || 'Home'}
                        </span>
                        <h4 className="font-black text-white text-sm">
                          {activeAddress.name || userProfile?.name || currentUser?.displayName || 'Customer'}
                        </h4>
                      </div>

                      <p className="text-xs font-medium text-stone-300 leading-relaxed max-w-[85%]">
                        {[activeAddress.houseNo, activeAddress.street || activeAddress.address, activeAddress.locality, activeAddress.city, activeAddress.pincode].filter(Boolean).join(', ')}
                      </p>

                      {activeAddress.phone && (
                        <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-500" />
                          <span>{activeAddress.phone}</span>
                        </p>
                      )}

                      {/* Doorstep Pin Status / Set Pin Button */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-emerald-500/20">
                        <button
                          type="button"
                          onClick={() => {
                            setAddressForm({
                              name: activeAddress.name || '',
                              phone: activeAddress.phone || '',
                              houseNo: activeAddress.houseNo || '',
                              street: activeAddress.street || activeAddress.address || '',
                              locality: activeAddress.locality || '',
                              city: activeAddress.city || 'Baharagora',
                              pincode: activeAddress.pincode || '832101',
                              type: activeAddress.type || 'Home',
                              lat: activeAddress.lat || null,
                              lng: activeAddress.lng || null,
                              deliveryInstructions: activeAddress.deliveryInstructions || '',
                            });
                            setIsLocationPickerOpen(true);
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                        >
                          <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{activeAddress.lat ? 'Adjust Doorstep Pin (5 KM)' : 'Pin on Map (5 KM)'}</span>
                        </button>
                        {activeAddress.lat && activeAddress.lng ? (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Doorstep Pinned ({calculateDistance(AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng, activeAddress.lat, activeAddress.lng)} km)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-300/80">
                            📌 Pin your entrance for fast & accurate doorstep delivery
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Switch between other saved addresses if multiple exist */}
                    {addresses.length > 1 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-stone-400">
                          Or deliver to another saved location:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {addresses.map((addr) => {
                            const isSelected = activeAddressId === addr.id;
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => setActiveAddressId(addr.id)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? 'border-amber-400 bg-amber-500/10 text-white'
                                    : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-[10px] font-black uppercase text-amber-400 block">
                                    {addr.type || 'Address'}
                                  </span>
                                  <p className="text-xs font-medium truncate mt-0.5">
                                    {[addr.houseNo, addr.street || addr.address, addr.city].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CASE B: User DOES NOT have an address OR clicked "Add New Address" */
                  <div className="space-y-4 bg-stone-950 p-4 sm:p-5 rounded-2xl border border-stone-800">
                    
                    {/* Header info / Auto detect button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-800/80">
                      <div>
                        <h5 className="text-xs font-black text-white uppercase tracking-wider">
                          Where should we deliver?
                        </h5>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Enter your exact delivery address for fast doorstep arrival
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setIsLocationPickerOpen(true)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Pin on Map (5 KM)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          disabled={isLocating}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isLocating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{isLocating ? 'Detecting...' : 'Auto-detect GPS'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Geo Verification Badge if pinned */}
                    {geoCheckResult && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>5 KM Radius Verified: {geoCheckResult.distanceKm} km from cafe</span>
                        </span>
                        <span className="text-amber-400 font-black">{geoCheckResult.eta}</span>
                      </div>
                    )}

                    {/* Address Form Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          Phone Number *
                        </label>
                        <input
                          required
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          House / Flat No / Street Address *
                        </label>
                        <input
                          required
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          placeholder="e.g. Flat 302, Green Avenue, Main Market Road"
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          Landmark / Area (Optional)
                        </label>
                        <input
                          type="text"
                          value={addressForm.locality}
                          onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                          placeholder="Near Gandhi Chowk"
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            City *
                          </label>
                          <input
                            required
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="City"
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Pincode *
                          </label>
                          <input
                            required
                            type="text"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                            placeholder="832101"
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Address Type Tag Buttons */}
                      <div className="sm:col-span-2 pt-1">
                        <label className="block text-[11px] font-bold text-stone-300 mb-1.5">
                          Address Label
                        </label>
                        <div className="flex gap-2">
                          {['Home', 'Office', 'Other'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAddressForm({ ...addressForm, type })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                addressForm.type === type
                                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20'
                                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                              }`}
                            >
                              {type === 'Home' && <Home className="w-3.5 h-3.5" />}
                              {type === 'Office' && <Briefcase className="w-3.5 h-3.5" />}
                              {type === 'Other' && <Tag className="w-3.5 h-3.5" />}
                              <span>{type}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto-save Info Badge & Save Address Action */}
                      <div className="sm:col-span-2 pt-1 space-y-2.5">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-300">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>This address will be automatically saved in your profile <strong>Address Section</strong> for 1-click reorders.</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSaveAndUseAddress}
                            disabled={isSavingAddress}
                            className="w-full sm:w-auto flex-1 py-2.5 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
                          >
                            {isSavingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            <span>Save Address & Deliver Here</span>
                          </button>

                          {addresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowNewAddressForm(false)}
                              className="w-full sm:w-auto py-2.5 px-4 border border-stone-800 hover:border-stone-700 bg-stone-900 text-stone-400 hover:text-stone-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* PAYMENT METHOD SELECTION                                 */}
              {/* ======================================================== */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-stone-300">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-500/10'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="hidden"
                    />
                    <span className="text-base">💵</span>
                    <div>
                      <span className="block text-white font-bold">Cash on Delivery</span>
                      <span className="text-[10px] text-stone-400 font-normal">Pay at your doorstep</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                      paymentMethod === 'online'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-500/10'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="hidden"
                    />
                    <span className="text-base">💳</span>
                    <div>
                      <span className="block text-white font-bold">Online UPI / Card</span>
                      <span className="text-[10px] text-stone-400 font-normal">Instant digital checkout</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary & Customizations Review */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <label className="block text-xs font-bold text-stone-300">
                  Order Summary ({cart.length} item{cart.length === 1 ? '' : 's'})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {cart.map((ci, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 text-xs text-left">
                      <div className="flex items-center justify-between font-bold text-stone-200">
                        <span className="truncate">{ci.name} × {ci.quantity}</span>
                        <span className="font-mono text-amber-400">₹{ci.price * ci.quantity}</span>
                      </div>
                      {ci.selectedAddOns?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ci.selectedAddOns.map((addon, aIdx) => (
                            <span key={aIdx} className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                              + {addon.name} {addon.price > 0 && `(₹${addon.price})`}
                            </span>
                          ))}
                        </div>
                      )}
                      {ci.specialInstructions && (
                        <p className="text-[10px] text-amber-400/90 italic mt-1 bg-stone-900/60 p-1 rounded border border-stone-800/60">
                          Note: "{ci.specialInstructions}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon / Promo Code in Checkout */}
              <div className="pt-2 border-t border-stone-800">
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
                          You save ₹{discountAmount} on this order!
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                      <span className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        <span>Have a Promo Code?</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                          type="text"
                          placeholder="e.g. WELCOME50"
                          value={promoCodeInput}
                          onChange={(e) => {
                            setPromoCodeInput(e.target.value.toUpperCase().replace(/\s/g, ''));
                            if (promoError) setPromoError('');
                          }}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white placeholder-stone-500 uppercase focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        disabled={!promoCodeInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-stone-950 text-xs font-black rounded-xl transition cursor-pointer"
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
                  </div>
                )}
              </div>

              {/* Order Bill Breakdown & Submit Action */}
              <div className="pt-3 border-t border-stone-800 space-y-2.5">
                <div className="space-y-1.5 text-xs text-stone-400">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="text-stone-200 font-medium">₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Coupon Discount ({appliedCoupon?.code}):</span>
                      </span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 font-semibold">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-stone-800 font-bold text-white">
                    <span>Total Bill Amount ({cart.length} items):</span>
                    <span className="text-lg font-black text-amber-400 font-mono">₹{grandTotal}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 font-black text-sm justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Your Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order • ₹{grandTotal}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-stone-500 text-[11px] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>100% Safe, Contactless & Hygienic Delivery</span>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Interactive Map Picker Modal with 5 KM Geofence */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onConfirm={handleLocationConfirmed}
        initialLocation={addressForm}
      />
    </div>
  );
};
export default CheckoutModal;
