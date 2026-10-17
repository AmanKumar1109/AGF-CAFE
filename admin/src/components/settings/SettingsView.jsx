import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building,
  Navigation,
  Compass,
  Clock,
  Radio,
  Sliders,
  AlertCircle,
  Loader2,
  RefreshCw,
  Check,
  Share2
} from 'lucide-react';
import { useDeliveryRadius } from '../../hooks/useDeliveryRadius';
import { AGF_CAFE_HUB } from '../../utils/locationUtils';

export const SettingsView = () => {
  const { radiusKm, updateRadius, isSaving, presets } = useDeliveryRadius();
  const [customRadius, setCustomRadius] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handlePresetClick = async (km) => {
    const res = await updateRadius(km);
    if (res.success) {
      showToast(`✅ Delivery radius successfully updated to ${km} KM! All customer apps synced live.`);
    } else {
      showToast(`❌ Error: ${res.error}`);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(customRadius);
    if (isNaN(val) || val < 0.5 || val > 50) {
      showToast('❌ Please enter a valid distance between 0.5 and 50 KM.');
      return;
    }
    const res = await updateRadius(val);
    if (res.success) {
      showToast(`✅ Delivery radius successfully updated to ${res.radius} KM!`);
      setCustomRadius('');
    } else {
      showToast(`❌ Error: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-slide-up text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>1-Click Configuration</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Realtime Cloud Sync</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif text-white">
            Cafe & Delivery Radius Manager
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
            Manage your kitchen's delivery geofence circle in 1 click. When changed here, all customer maps, checkout validations, and fleet tracking radars update instantly without code changes.
          </p>
        </div>

        {/* Current Active Radius Big Badge */}
        <div className="bg-stone-900/90 border border-amber-400/30 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg shadow-amber-400/5">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
            <Navigation className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
              Active Delivery Radius
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-black text-white">{radiusKm}</span>
              <span className="text-sm font-bold text-stone-400">Kilometers</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live Geofence Active
            </span>
          </div>
        </div>
      </div>

      {/* 1-Click Radius Preset Selector Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Select Delivery Radius (1-Click Change)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
              Instant
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any preset button below to immediately change the delivery boundary across the entire AGF Cafe system:
          </p>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
          {presets.map((km) => {
            const isActive = radiusKm === km;
            return (
              <button
                key={km}
                type="button"
                disabled={isSaving}
                onClick={() => handlePresetClick(km)}
                className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer relative overflow-hidden group active:scale-95 ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/10 text-stone-950 shadow-md shadow-amber-500/10'
                    : 'border-slate-200 hover:border-amber-400 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
                <span className="block text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  {km}
                </span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  KM Radius
                </span>
                {isActive ? (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                    ✓ ACTIVE
                  </span>
                ) : (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                    Click to Set
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Radius Input */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Need a Custom Distance?
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter any precise decimal radius (e.g. 7.53, 6.25, 8.4 km):
            </p>
          </div>

          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <input
                type="number"
                step="any"
                min="0.5"
                max="50"
                placeholder="e.g. 7.53"
                value={customRadius}
                onChange={(e) => setCustomRadius(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                KM
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving || !customRadius}
              className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Set Radius</span>
            </button>
          </form>
        </div>
      </div>

      {/* Central Hub & Geofence Reference Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Central Store Hub Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Central Kitchen & Dispatch Origin
              </h3>
              <p className="text-xs text-slate-500">
                All delivery distances and ETA times calculate from this origin point:
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">Store Name:</span>
              <span className="font-black text-slate-900">{AGF_CAFE_HUB.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">Location Address:</span>
              <span className="font-medium text-slate-800 text-right max-w-xs">{AGF_CAFE_HUB.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">GPS Coordinates:</span>
              <span className="font-mono text-amber-700 font-bold">{AGF_CAFE_HUB.lat}, {AGF_CAFE_HUB.lng}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500">Postal Pin:</span>
              <span className="font-bold text-slate-900">{AGF_CAFE_HUB.pincode}</span>
            </div>
          </div>
        </div>

        {/* Live Delivery Zone Coverage Reference */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                Coverage Zone Scope (~{radiusKm} KM)
              </h3>
              <p className="text-xs text-slate-500">
                Localities reachable within current delivery setting:
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="font-bold text-emerald-900">0 - 2.5 KM (Express 15-25m)</span>
              <span className="text-emerald-700 font-medium">Baharagora Chowk, College Rd, CHC Hospital</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <span className="font-bold text-blue-900">2.5 - 5 KM (Standard 25-35m)</span>
              <span className="text-blue-700 font-medium">Taliya, Barasol NH49, Kaimi, Mauda</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <span className="font-bold text-amber-900">5 - {radiusKm} KM (Extended Zone)</span>
              <span className="text-amber-700 font-medium">Outer Panchayats & Regional Doorsteps</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SettingsView;
