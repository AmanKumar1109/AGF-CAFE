import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, User, Home, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const ProfileAddressModal = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, userProfile, currentUser, saveUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    pincode: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || currentUser?.displayName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        landmark: userProfile.landmark || '',
        city: userProfile.city || '',
        pincode: userProfile.pincode || '',
      });
    } else if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        name: currentUser.displayName || '',
      }));
    }
  }, [userProfile, currentUser, isProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setIsProfileModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setError('Please provide a valid 10-digit mobile number for order updates');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please enter your delivery street / flat address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await saveUserProfile(formData);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Delivery Profile</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Delivery Address & Details
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Save your primary delivery information so your hot cafe orders reach you seamlessly!
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 flex items-center gap-3 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Details saved successfully! Preparing your experience...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/50 border border-red-800 flex items-center gap-2.5 text-red-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Phone Number <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Complete Street Address */}
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Flat / House No., Building, Street Name <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Flat 302, Palm Grove Apts, 4th Cross Road"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Landmark / Instructions for Delivery Partner
            </label>
            <div className="relative">
              <Building className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                placeholder="e.g. Behind City Mall / Ring bell on 3rd floor"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* City & Pincode */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 110001"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 px-3.5 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-200 font-semibold text-xs transition cursor-pointer"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
