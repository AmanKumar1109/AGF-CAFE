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
import LocationPickerModal from '../../components/location/LocationPickerModal';

export const SavedAddresses = () => {
  const containerRef = useRef(null);
  const { userProfile, addAddress, deleteAddress, setPrimaryAddress } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  
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

  const handleLocationConfirmed = (loc) => {
    setAddressForm(prev => ({
      ...prev,
      street: loc.street || prev.street,
      locality: loc.landmark || prev.locality,
      city: loc.city || prev.city,
      pincode: loc.pincode || prev.pincode,
      lat: loc.lat,
      lng: loc.lng,
      type: loc.type || prev.type
    }));
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
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
            Saved Addresses
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-1">
            Manage your cafe delivery addresses and primary preferences
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="self-start sm:self-auto px-6 py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Add Address Form Modal / Inline Box */}
      {showAddForm && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-black text-stone-900">Add Delivery Location</h3>
              <p className="text-xs text-stone-500 mt-0.5">Where should we deliver your cafe meals?</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 text-stone-500 hover:text-stone-900 rounded-full bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Location Action Buttons */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLocationPickerOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 stroke-[2.5]" />
              <span>Pin Exact Point on Map (5 KM)</span>
            </button>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-amber-500" />}
              <span>{isLocating ? 'Detecting Location...' : 'Use Current GPS Location'}</span>
            </button>
          </div>

          {addressForm.lat && addressForm.lng && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Map Coordinates Saved: {addressForm.lat}, {addressForm.lng} (Inside 5 KM Zone)</span>
            </div>
          )}

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Recipient Name *</label>
                <input
                  type="text"
                  name="name"
                  value={addressForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Aman Kumar"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">House / Flat / Street Address *</label>
              <input
                type="text"
                name="street"
                value={addressForm.street}
                onChange={handleInputChange}
                required
                placeholder="Flat 302, Green Avenue, Main Road"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Area / Landmark</label>
                <input
                  type="text"
                  name="locality"
                  value={addressForm.locality}
                  onChange={handleInputChange}
                  placeholder="Near Shitla Mandir"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">City *</label>
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Baharagora"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={addressForm.pincode}
                  onChange={handleInputChange}
                  required
                  placeholder="832101"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Address Type Buttons */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Address Tag</label>
              <div className="flex gap-3">
                {['Home', 'Office', 'Other'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, type })}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      addressForm.type === type
                        ? 'bg-amber-400 text-stone-950 font-black shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
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
                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-stone-900">No Addresses Saved Yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Save your home, hostel, or workplace address for lightning-fast 1-click checkout.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm"
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
                className={`address-card p-6 rounded-3xl border transition-all duration-200 relative flex flex-col justify-between ${
                  isPrimary
                    ? 'bg-white border-2 border-amber-400 shadow-sm'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-stone-900">
                        {addr.type || 'Home'}
                      </span>
                    </div>

                    {isPrimary && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Default</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-stone-900">{addr.name}</h4>
                  <p className="text-xs text-stone-500 font-bold mt-0.5">{addr.phone}</p>
                  <p className="text-xs text-stone-600 mt-2.5 leading-relaxed font-medium">
                    {[addr.houseNo, addr.street, addr.locality, addr.city, addr.pincode].filter(Boolean).join(', ')}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-stone-100/80 flex items-center justify-between">
                    {addr.lat && addr.lng ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>📍 GPS Pinned ({addr.lat.toFixed(4)}, {addr.lng.toFixed(4)})</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressForm({
                            name: addr.name || '',
                            phone: addr.phone || '',
                            houseNo: addr.houseNo || '',
                            street: addr.street || '',
                            locality: addr.locality || '',
                            city: addr.city || 'Baharagora',
                            state: addr.state || 'Jharkhand',
                            pincode: addr.pincode || '832101',
                            type: addr.type || 'Home',
                            lat: null,
                            lng: null,
                          });
                          setIsLocationPickerOpen(true);
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Pin Exact Location on Map</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between gap-3">
                  {!isPrimary ? (
                    <button
                      onClick={() => setPrimaryAddress(addr.id)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-400">
                      Primary Delivery Location
                    </span>
                  )}

                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
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

      {/* Interactive Map Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onConfirm={handleLocationConfirmed}
        initialLocation={addressForm}
      />
    </div>
  );
};

export default SavedAddresses;
