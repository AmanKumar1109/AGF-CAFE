import React, { useState, useEffect } from 'react';
import { useDineIn } from '../../context/DineInContext';
import {
  UtensilsCrossed,
  MapPin,
  User,
  Phone,
  Hash,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  KeyRound,
  RotateCw,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const TableEntryModal = () => {
  const {
    isTableEntryModalOpen,
    setIsTableEntryModalOpen,
    tableNumber,
    customerInfo,
    saveDineInDetails,
    verifyLocation,
    bypassGeofenceWithPin,
    geofenceStatus,
    distanceMeters,
    exitDineIn,
  } = useDineIn();

  const [name, setName] = useState(customerInfo.name || '');
  const [phone, setPhone] = useState(customerInfo.phone || '');
  const [selectedTable, setSelectedTable] = useState(tableNumber || '1');
  const [staffPin, setStaffPin] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifyingGps, setIsVerifyingGps] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Sync incoming tableNumber or customerInfo props
  useEffect(() => {
    if (tableNumber) setSelectedTable(tableNumber);
    if (customerInfo.name) setName(customerInfo.name);
    if (customerInfo.phone) setPhone(customerInfo.phone);
  }, [tableNumber, customerInfo]);

  // Auto-verify location on open if not already granted or bypassed
  useEffect(() => {
    if (isTableEntryModalOpen && geofenceStatus === 'prompt') {
      handleAutoVerify();
    }
  }, [isTableEntryModalOpen]);

  const handleAutoVerify = async () => {
    setIsVerifyingGps(true);
    setGpsErrorMsg('');
    const res = await verifyLocation();
    setIsVerifyingGps(false);
    if (!res.success) {
      setGpsErrorMsg(res.reason || 'GPS check failed');
    }
  };

  if (!isTableEntryModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your name (minimum 2 characters)');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!selectedTable) {
      setErrorMsg('Please choose your Table Number');
      return;
    }

    // Geofence check: if strictly outside and not bypassed, require staff pin or retry
    if (geofenceStatus === 'outside') {
      setErrorMsg('You appear to be outside AGF Cafe. Dine-in is only available inside the cafe.');
      return;
    }

    saveDineInDetails({
      name: cleanName,
      phone: cleanPhone,
      tableNumber: selectedTable,
    });
  };

  const handleStaffPinBypass = () => {
    if (!staffPin.trim()) return;
    const res = bypassGeofenceWithPin(staffPin);
    if (res.success) {
      setErrorMsg('');
      setShowStaffPin(false);
      setStaffPin('');
    } else {
      setErrorMsg(res.error || 'Invalid Staff PIN');
    }
  };

  const popularTables = ['1', '2', '3', '4', '5', '6', '7', '8', 'VIP-1', 'Outdoor-1'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100 max-h-[92vh]">
        
        {/* Glow Header */}
        <div className="relative p-6 pb-5 bg-gradient-to-b from-amber-500/15 via-stone-900/60 to-transparent border-b border-stone-800/80">
          <button
            onClick={() => setIsTableEntryModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-stone-950">
              <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Dine-In Mode
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ₹0 Delivery Fee
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif text-white mt-0.5">Welcome to AGF Cafe</h2>
            </div>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Order delicious food and refreshing drinks straight to your seat. Hot & fresh from the kitchen.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Table Number Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                Table Number
              </span>
              <span className="text-[11px] font-normal text-amber-400/80">
                Check sticker on your table
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularTables.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTable(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    String(selectedTable) === String(t)
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                      : 'bg-stone-800/80 text-stone-300 border-stone-700/80 hover:border-amber-400/50'
                  }`}
                >
                  Table {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              placeholder="Or enter custom table (e.g. Outdoor 3)"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 text-sm focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aman Kumar"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 text-sm focus:border-amber-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              10-Digit Mobile Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-stone-800/90 border border-stone-700 text-stone-100 text-sm focus:border-amber-400 focus:outline-none tracking-wider font-mono transition-colors"
                required
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Used for your order receipt & kitchen updates via SMS/WhatsApp.
            </p>
          </div>

          {/* Geofence Security & Verification Pill */}
          <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {geofenceStatus === 'granted' || geofenceStatus === 'bypassed' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : geofenceStatus === 'outside' ? (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                ) : (
                  <MapPin className="w-4 h-4 text-amber-400" />
                )}
                <span className="text-xs font-semibold text-stone-200">
                  {geofenceStatus === 'granted'
                    ? 'Verified at AGF Cafe'
                    : geofenceStatus === 'bypassed'
                    ? 'Staff Override Active'
                    : geofenceStatus === 'outside'
                    ? 'Outside Cafe Range'
                    : isVerifyingGps
                    ? 'Checking Cafe Proximity...'
                    : 'Location Check'}
                </span>
              </div>

              {geofenceStatus !== 'granted' && geofenceStatus !== 'bypassed' && (
                <button
                  type="button"
                  onClick={handleAutoVerify}
                  disabled={isVerifyingGps}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isVerifyingGps ? 'animate-spin' : ''}`} />
                  {isVerifyingGps ? 'Verifying...' : 'Re-check GPS'}
                </button>
              )}
            </div>

            {geofenceStatus === 'granted' && (
              <p className="text-[11px] text-emerald-400/90">
                ✓ Seated at Cafe (~{distanceMeters || 12}m from counter). Delivery fee waived!
              </p>
            )}

            {geofenceStatus === 'outside' && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-red-300">
                  {gpsErrorMsg || 'You appear to be far from AGF Cafe. Dine-In is only for guests seated at tables.'}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowStaffPin(!showStaffPin)}
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    Staff Override PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exitDineIn();
                    }}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline"
                  >
                    Switch to Delivery
                  </button>
                </div>
              </div>
            )}

            {showStaffPin && (
              <div className="flex gap-2 pt-2">
                <input
                  type="password"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  placeholder="Ask server for PIN"
                  className="w-full px-3 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleStaffPinBypass}
                  className="px-3 py-1.5 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg hover:bg-amber-300"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={geofenceStatus === 'outside'}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Start Ordering for Table #{selectedTable}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                exitDineIn();
              }}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-200 transition-colors text-center"
            >
              Not dining in? Switch to Online Delivery (Doorstep)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TableEntryModal;
