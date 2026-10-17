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
  Share2,
  DollarSign,
  Receipt,
  Percent,
  Bike,
  Layers,
  ArrowRight,
  TrendingDown,
  Gift
} from 'lucide-react';
import { useDeliveryRadius } from '../../hooks/useDeliveryRadius';
import { usePricingSettings } from '../../hooks/usePricingSettings';
import { AGF_CAFE_HUB } from '../../utils/locationUtils';

export const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('pricing'); // 'pricing' | 'radius'
  const { radiusKm, updateRadius, isSaving: isSavingRadius, presets } = useDeliveryRadius();
  const { settings: pricingSettings, saveSettings: savePricing, isSaving: isSavingPricing } = usePricingSettings();

  const [customRadius, setCustomRadius] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Editable Pricing Form State
  const [pricingForm, setPricingForm] = useState(() => ({
    deliveryFeeOriginal: pricingSettings.deliveryFeeOriginal ?? 40,
    deliveryFee: pricingSettings.deliveryFee ?? 0,
    deliveryFeeEnabled: pricingSettings.deliveryFeeEnabled ?? true,
    freeDeliveryThreshold: pricingSettings.freeDeliveryThreshold ?? 499,

    platformFeeOriginal: pricingSettings.platformFeeOriginal ?? 10,
    platformFee: pricingSettings.platformFee ?? 5,
    platformFeeEnabled: pricingSettings.platformFeeEnabled ?? true,

    gstPercentage: pricingSettings.gstPercentage ?? 5.0,
    gstEnabled: pricingSettings.gstEnabled ?? true,
  }));

  // Sync state if pricingSettings loads/updates from Firestore
  React.useEffect(() => {
    setPricingForm({
      deliveryFeeOriginal: pricingSettings.deliveryFeeOriginal ?? 40,
      deliveryFee: pricingSettings.deliveryFee ?? 0,
      deliveryFeeEnabled: pricingSettings.deliveryFeeEnabled ?? true,
      freeDeliveryThreshold: pricingSettings.freeDeliveryThreshold ?? 499,

      platformFeeOriginal: pricingSettings.platformFeeOriginal ?? 10,
      platformFee: pricingSettings.platformFee ?? 5,
      platformFeeEnabled: pricingSettings.platformFeeEnabled ?? true,

      gstPercentage: pricingSettings.gstPercentage ?? 5.0,
      gstEnabled: pricingSettings.gstEnabled ?? true,
    });
  }, [pricingSettings]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handlePresetRadiusClick = async (km) => {
    const res = await updateRadius(km);
    if (res.success) {
      showToast(`✅ Delivery radius successfully updated to ${km} KM! Customer apps synced live.`);
    } else {
      showToast(`❌ Error: ${res.error}`);
    }
  };

  const handleCustomRadiusSubmit = async (e) => {
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

  // 1-Click quick actions for pricing
  const handleCutDeliveryFeeToZero = async () => {
    const updated = { ...pricingForm, deliveryFee: 0 };
    setPricingForm(updated);
    const res = await savePricing(updated);
    if (res.success) {
      showToast('⚡ Delivery Fee cut to ₹0! Free Delivery promotion active across user app.');
    }
  };

  const handleSetDeliveryFee = async (fee) => {
    const updated = { ...pricingForm, deliveryFee: fee };
    setPricingForm(updated);
    const res = await savePricing(updated);
    if (res.success) {
      showToast(`✅ Delivery Fee set to ₹${fee}!`);
    }
  };

  const handleCutPlatformFeeToZero = async () => {
    const updated = { ...pricingForm, platformFee: 0 };
    setPricingForm(updated);
    const res = await savePricing(updated);
    if (res.success) {
      showToast('⚡ Platform Fee cut to ₹0! Waived for customers.');
    }
  };

  const handleSetPlatformFee = async (fee) => {
    const updated = { ...pricingForm, platformFee: fee };
    setPricingForm(updated);
    const res = await savePricing(updated);
    if (res.success) {
      showToast(`✅ Platform Fee set to ₹${fee}!`);
    }
  };

  const handleSetGst = async (rate) => {
    const updated = { ...pricingForm, gstPercentage: rate, gstEnabled: rate > 0 };
    setPricingForm(updated);
    const res = await savePricing(updated);
    if (res.success) {
      showToast(`✅ GST Rate set to ${rate}%!`);
    }
  };

  const handleSaveAllPricing = async (e) => {
    if (e) e.preventDefault();
    const res = await savePricing(pricingForm);
    if (res.success) {
      showToast('✅ All Pricing, Charges & GST settings saved live to Firestore!');
    } else {
      showToast(`❌ Error: ${res.error}`);
    }
  };

  // Simulator Calculations for ₹200 food item demo
  const demoSubtotal = 200;
  const demoDeliveryFee = pricingForm.deliveryFeeEnabled ? pricingForm.deliveryFee : 0;
  const demoDeliverySaved = pricingForm.deliveryFeeEnabled ? Math.max(0, pricingForm.deliveryFeeOriginal - demoDeliveryFee) : 0;

  const demoPlatformFee = pricingForm.platformFeeEnabled ? pricingForm.platformFee : 0;
  const demoPlatformSaved = pricingForm.platformFeeEnabled ? Math.max(0, pricingForm.platformFeeOriginal - demoPlatformFee) : 0;

  const demoGstAmount = pricingForm.gstEnabled ? Math.round((demoSubtotal * (pricingForm.gstPercentage / 100)) * 100) / 100 : 0;
  const demoTotalSaved = demoDeliverySaved + demoPlatformSaved;
  const demoGrandTotal = Math.max(0, Math.round((demoSubtotal + demoDeliveryFee + demoPlatformFee + demoGstAmount) * 100) / 100);

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
              <span>Admin Pricing & Operations Control</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Realtime Cloud Sync</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-serif text-white">
            Pricing, Charges & Delivery Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
            Manage delivery partner fees, platform fees, GST (5%), and your kitchen delivery radius in 1 click. Cut fees to ₹0 anytime to offer free delivery promos while customers see total money saved!
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-stone-900 p-1.5 rounded-2xl border border-stone-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pricing'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Fees & GST</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('radius')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'radius'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Radius ({radiusKm} km)</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: PRICING, CHARGES & TAXES HUB                                      */}
      {/* ======================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          
          {/* Quick Summary Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Delivery Partner Fee Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Delivery Partner Fee
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {pricingForm.deliveryFee === 0 ? 'FREE (₹0)' : `₹${pricingForm.deliveryFee}`}
                  </span>
                  {pricingForm.deliveryFee < pricingForm.deliveryFeeOriginal && (
                    <span className="text-xs font-bold line-through text-slate-400">
                      ₹{pricingForm.deliveryFeeOriginal}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                  {pricingForm.deliveryFee === 0 ? '🎉 Free Delivery Promo Active' : 'Active Fee to Customer'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
            </div>

            {/* Platform Fee Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Platform Fee
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {pricingForm.platformFee === 0 ? 'FREE (₹0)' : `₹${pricingForm.platformFee}`}
                  </span>
                  {pricingForm.platformFee < pricingForm.platformFeeOriginal && (
                    <span className="text-xs font-bold line-through text-slate-400">
                      ₹{pricingForm.platformFeeOriginal}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                  {pricingForm.platformFee === 0 ? '🎉 Waived for Customers' : 'Active Platform Charge'}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* GST Status */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Govt. GST Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {pricingForm.gstEnabled ? `${pricingForm.gstPercentage}%` : 'Disabled (0%)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                  Restaurant & Food GST
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Pricing Controls Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. DELIVERY PARTNER FEE CONTROL CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Delivery Partner Fee
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard fee vs. actual fee charged to customer
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">Enable</span>
                  <input
                    type="checkbox"
                    checked={pricingForm.deliveryFeeEnabled}
                    onChange={(e) => setPricingForm({ ...pricingForm, deliveryFeeEnabled: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* 1-Click Action Preset Buttons */}
              <div>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-2">
                  1-Click Fee Quick Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleCutDeliveryFeeToZero}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      pricingForm.deliveryFee === 0
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>⚡ Cut to ₹0 (FREE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDeliveryFee(20)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.deliveryFee === 20
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹20 Promo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDeliveryFee(30)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.deliveryFee === 30
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹30 Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDeliveryFee(40)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.deliveryFee === 40
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹40 Standard
                  </button>
                </div>
              </div>

              {/* Exact Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Base / Standard Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricingForm.deliveryFeeOriginal}
                    onChange={(e) => setPricingForm({ ...pricingForm, deliveryFeeOriginal: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    placeholder="40"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Shown with strikethrough (~~₹40~~)</span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Active Charged Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricingForm.deliveryFee}
                    onChange={(e) => setPricingForm({ ...pricingForm, deliveryFee: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-emerald-700 bg-emerald-50/40 focus:outline-none focus:border-emerald-500"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">Set 0 for FREE Delivery</span>
                </div>
              </div>

              {/* Free Delivery Threshold */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Free Delivery on Orders Above:</span>
                  <span className="text-[10px] text-slate-500">Auto-frees delivery fee for cart value</span>
                </div>
                <div className="flex items-center gap-1.5 w-28">
                  <span className="font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    value={pricingForm.freeDeliveryThreshold}
                    onChange={(e) => setPricingForm({ ...pricingForm, freeDeliveryThreshold: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-2 py-1 bg-white rounded-lg border border-slate-300 text-xs font-bold text-slate-800 text-right"
                  />
                </div>
              </div>
            </div>

            {/* 2. PLATFORM FEE CONTROL CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Platform Fee
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard fee vs. active fee charged per order
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">Enable</span>
                  <input
                    type="checkbox"
                    checked={pricingForm.platformFeeEnabled}
                    onChange={(e) => setPricingForm({ ...pricingForm, platformFeeEnabled: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* 1-Click Action Preset Buttons */}
              <div>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-2">
                  1-Click Fee Quick Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleCutPlatformFeeToZero}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      pricingForm.platformFee === 0
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span>⚡ Cut to ₹0 (FREE)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPlatformFee(3)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.platformFee === 3
                        ? 'bg-blue-600 text-white border-blue-600 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹3 Minimal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPlatformFee(5)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.platformFee === 5
                        ? 'bg-blue-600 text-white border-blue-600 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹5 Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPlatformFee(10)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.platformFee === 10
                        ? 'bg-blue-600 text-white border-blue-600 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ₹10 Regular
                  </button>
                </div>
              </div>

              {/* Exact Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Base / Standard Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricingForm.platformFeeOriginal}
                    onChange={(e) => setPricingForm({ ...pricingForm, platformFeeOriginal: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="10"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Shown with strikethrough (~~₹10~~)</span>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Active Charged Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricingForm.platformFee}
                    onChange={(e) => setPricingForm({ ...pricingForm, platformFee: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-blue-700 bg-blue-50/40 focus:outline-none focus:border-blue-500"
                    placeholder="5"
                  />
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Set 0 to waive platform fee</span>
                </div>
              </div>

              {/* Platform Fee Benefit description */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>When set lower than Base Fee, user receives a highlight tag: "Saved ₹{pricingForm.platformFeeOriginal - pricingForm.platformFee}"</span>
              </div>
            </div>

          </div>

          {/* 3. GST 5% & LIVE CUSTOMER BILL SIMULATOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* GST 5% Control Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Govt. Taxes (GST 5%)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standard Cafe / Food & Beverage tax configuration
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-bold text-slate-500">Enable</span>
                  <input
                    type="checkbox"
                    checked={pricingForm.gstEnabled}
                    onChange={(e) => setPricingForm({ ...pricingForm, gstEnabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* 1-Click Action Preset Buttons */}
              <div>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-2">
                  1-Click GST Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetGst(5.0)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      pricingForm.gstPercentage === 5.0 && pricingForm.gstEnabled
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    <span>5.0% Food GST</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGst(12.0)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.gstPercentage === 12.0
                        ? 'bg-purple-600 text-white border-purple-600 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    12% GST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGst(18.0)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.gstPercentage === 18.0
                        ? 'bg-purple-600 text-white border-purple-600 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    18% Commercial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGst(0.0)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pricingForm.gstPercentage === 0 || !pricingForm.gstEnabled
                        ? 'bg-slate-800 text-white border-slate-800 font-black'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    0% Exempt
                  </button>
                </div>
              </div>

              {/* Exact GST Input */}
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Custom GST Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={pricingForm.gstPercentage}
                    onChange={(e) => setPricingForm({ ...pricingForm, gstPercentage: Math.max(0, Number(e.target.value)) })}
                    className="w-44 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                    placeholder="5.0"
                  />
                  <span className="text-xs font-bold text-slate-500">% on Subtotal</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Compliant with Indian Restaurant GST rules (5% without Input Tax Credit)
                </span>
              </div>
            </div>

            {/* Live Customer Bill & Savings Simulator Card */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-6 border border-stone-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm text-white">
                    Live Customer Bill Simulator
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Sample ₹{demoSubtotal} Cart
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-stone-300">
                <div className="flex justify-between">
                  <span className="text-stone-400">Items Subtotal (Cold Coffee + Burger)</span>
                  <span className="font-mono font-bold text-white">₹{demoSubtotal.toFixed(2)}</span>
                </div>

                {/* Delivery Fee Simulation */}
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Delivery Partner Fee:</span>
                  <span className="font-mono">
                    {demoDeliverySaved > 0 ? (
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="line-through text-stone-500">₹{pricingForm.deliveryFeeOriginal}</span>
                        <span className="text-emerald-400 font-black">{demoDeliveryFee === 0 ? 'FREE' : `₹${demoDeliveryFee}`}</span>
                      </span>
                    ) : (
                      <span className={demoDeliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-stone-200 font-bold'}>
                        {demoDeliveryFee === 0 ? 'FREE' : `₹${demoDeliveryFee}`}
                      </span>
                    )}
                  </span>
                </div>

                {/* Platform Fee Simulation */}
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Platform Fee:</span>
                  <span className="font-mono">
                    {demoPlatformSaved > 0 ? (
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="line-through text-stone-500">₹{pricingForm.platformFeeOriginal}</span>
                        <span className="text-emerald-400 font-black">{demoPlatformFee === 0 ? 'FREE' : `₹${demoPlatformFee}`}</span>
                      </span>
                    ) : (
                      <span className={demoPlatformFee === 0 ? 'text-emerald-400 font-bold' : 'text-stone-200 font-bold'}>
                        {demoPlatformFee === 0 ? 'FREE' : `₹${demoPlatformFee}`}
                      </span>
                    )}
                  </span>
                </div>

                {/* GST Simulation */}
                {pricingForm.gstEnabled && (
                  <div className="flex justify-between text-stone-400">
                    <span>Govt. Taxes (GST {pricingForm.gstPercentage}%):</span>
                    <span className="font-mono text-stone-200 font-bold">₹{demoGstAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Total Saved Celebratory Banner */}
                {demoTotalSaved > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black flex items-center justify-between text-xs animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Total Money Saved by Customer</span>
                    </span>
                    <span className="font-mono text-sm text-emerald-400">₹{demoTotalSaved.toFixed(2)} 🎉</span>
                  </div>
                )}

                {/* Net Payable */}
                <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-sm font-black text-white">
                  <span>Customer Net Payable:</span>
                  <span className="font-mono text-amber-400 text-lg">₹{demoGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Save All Pricing Changes Button Bar */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Publish Pricing Updates Live
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saving updates Firestore instantly. All customer carts, checkouts, and invoices will reflect these rates immediately.
              </p>
            </div>

            <button
              type="button"
              disabled={isSavingPricing}
              onClick={handleSaveAllPricing}
              className="px-7 py-3 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingPricing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
              <span>Save & Publish Live Charges</span>
            </button>
          </div>

        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: DELIVERY RADIUS & GEOFENCE CIRCLE                                 */}
      {/* ======================================================================= */}
      {activeTab === 'radius' && (
        <div className="space-y-6">
          
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
                    disabled={isSavingRadius}
                    onClick={() => handlePresetRadiusClick(km)}
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

              <form onSubmit={handleCustomRadiusSubmit} className="flex items-center gap-2 w-full sm:w-auto">
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
                  disabled={isSavingRadius || !customRadius}
                  className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingRadius ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Set Radius</span>
                </button>
              </form>
            </div>
          </div>

          {/* Central Hub & Coverage Scope References */}
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
      )}

    </div>
  );
};

export default SettingsView;
