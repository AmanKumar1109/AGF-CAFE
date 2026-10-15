import React, { useRef, useEffect, useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Home, 
  Briefcase, 
  Tag, 
  CheckCircle2, 
  X, 
  Navigation,
  Loader2,
  Check
} from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '../../context/useAuth';

export const SavedAddresses = () => {
  const containerRef = useRef(null);
  const { userProfile, addAddress, deleteAddress, setPrimaryAddress } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    locality: '',
    city: 'Baharagora',
    state: 'Jharkhand',
    pincode: '832101',
    type: 'Home',
    lat: null,
    lng: null
  });

  const addresses = userProfile?.addresses || [];
  const primaryId = userProfile?.primaryAddressId;

  useEffect(() => {
    if (userProfile) {
      setAddressForm(prev => ({
        ...prev,
        name: userProfile.fullName || userProfile.name || '',
        phone: userProfile.phone || ''
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.address-card', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, [addresses.length, showAddForm]);

  const getIcon = (type) => {
    if (type === 'Office') return Briefcase;
    if (type === 'Other') return Tag;
    return Home;
  };

  const handleInputChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.street || !addressForm.city || !addressForm.pincode) {
      alert("Please fill out street, city, and pincode");
      return;
    }
    
    setIsProcessing(true);
    await addAddress(addressForm);
    setIsProcessing(false);
    
    setShowAddForm(false);
    setAddressForm({
      name: userProfile?.fullName || '',
      phone: userProfile?.phone || '',
      street: '',
      locality: '',
      city: 'Baharagora',
      state: 'Jharkhand',
      pincode: '832101',
      type: 'Home',
      lat: null,
      lng: null
    });
  };

  // Browser Geolocation auto-fill with reverse geocoding
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
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
            setAddressForm(prev => ({
              ...prev,
              street: data.address.road || data.address.suburb || prev.street,
              locality: data.address.neighbourhood || data.address.suburb || prev.locality,
              city: data.address.city || data.address.town || data.address.village || prev.city,
              state: data.address.state || prev.state,
              pincode: data.address.postcode || prev.pincode,
              lat: latitude,
              lng: longitude
            }));
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err);
        setIsLocating(false);
        alert('Could not fetch GPS location. Please enter manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
            Saved Addresses
          </h1>
          <p className="text-stone-400 font-medium text-xs sm:text-sm mt-1">
            Manage your cafe delivery addresses and primary preferences
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="self-start sm:self-auto px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Add Address Form Modal / Inline Box */}
      {showAddForm && (
        <div className="bg-stone-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-black text-white">Add Delivery Location</h3>
              <p className="text-xs text-stone-400 mt-0.5">Where should we deliver your cafe meals?</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-stone-400 hover:text-white rounded-full bg-stone-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick GPS Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-5 py-3 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span>{isLocating ? 'Detecting Location...' : 'Use Current GPS Location'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Recipient Name *</label>
                <input
                  type="text"
                  name="name"
                  value={addressForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Aman Kumar"
                  className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">House / Flat / Street Address *</label>
              <input
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleInputChange}
                required
                placeholder="Flat 302, Green Avenue, Main Road"
                className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Area / Landmark</label>
                <input
                  type="text"
                  name="locality"
                  value={addressForm.locality}
                  onChange={handleInputChange}
                  placeholder="Near Shitla Mandir"
                  className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">City *</label>
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Baharagora"
                  className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={addressForm.pincode}
                  onChange={handleInputChange}
                  required
                  placeholder="832101"
                  className="w-full px-4 py-3 bg-stone-800/80 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                />
              </div>
            </div>

            {/* Address Type Buttons */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">Address Tag</label>
              <div className="flex gap-3">
                {['Home', 'Office', 'Other'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, type })}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      addressForm.type === type
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                        : 'bg-stone-800 text-stone-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs uppercase tracking-wider rounded-2xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                <span>Save Address</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 && !showAddForm ? (
        <div className="bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Addresses Saved Yet</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            Save your home, hostel, or workplace address for lightning-fast 1-click checkout.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {addresses.map((addr) => {
            const Icon = getIcon(addr.type);
            const isPrimary = primaryId === addr.id;

            return (
              <div
                key={addr.id}
                className={`address-card p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between ${
                  isPrimary
                    ? 'bg-stone-900/80 border-amber-500/50 shadow-xl shadow-amber-500/10'
                    : 'bg-stone-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {addr.type || 'Home'}
                      </span>
                    </div>

                    {isPrimary && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white">{addr.name}</h4>
                  <p className="text-xs text-stone-400 mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-stone-300 mt-2.5 leading-relaxed font-medium">
                    {[addr.houseNo, addr.street, addr.locality, addr.city, addr.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-white/5 flex items-center justify-between gap-3">
                  {!isPrimary ? (
                    <button
                      onClick={() => setPrimaryAddress(addr.id)}
                      className="text-xs font-black text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-500">
                      Primary Delivery Location
                    </span>
                  )}

                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="p-2 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedAddresses;
