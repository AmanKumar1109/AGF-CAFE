import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'agf_pricing_settings';

export const DEFAULT_PRICING_SETTINGS = {
  // Delivery Partner Fee
  deliveryFeeOriginal: 40,
  deliveryFee: 0, // When 0, customer gets FREE delivery with strikethrough ~~₹40~~ FREE
  deliveryFeeEnabled: true,
  freeDeliveryThreshold: 499,

  // Platform Fee
  platformFeeOriginal: 10,
  platformFee: 5, // When 0, customer gets FREE platform fee with strikethrough ~~₹10~~ FREE
  platformFeeEnabled: true,

  // GST (Goods & Services Tax)
  gstPercentage: 5.0, // Standard Food GST: 5%
  gstEnabled: true,
};

/**
 * Get cached pricing settings
 */
export function getCachedPricingSettings() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_PRICING_SETTINGS, ...parsed };
    }
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_PRICING_SETTINGS;
}

/**
 * Cache pricing settings locally
 */
export function cachePricingSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore error
  }
}

/**
 * Subscribe to real-time pricing and charges settings
 */
export function subscribeToPricingSettings(onUpdate) {
  try {
    const docRef = doc(db, 'settings', 'pricing');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cleanSettings = {
            deliveryFeeOriginal: Number(data.deliveryFeeOriginal ?? DEFAULT_PRICING_SETTINGS.deliveryFeeOriginal),
            deliveryFee: Number(data.deliveryFee ?? DEFAULT_PRICING_SETTINGS.deliveryFee),
            deliveryFeeEnabled: data.deliveryFeeEnabled !== undefined ? Boolean(data.deliveryFeeEnabled) : DEFAULT_PRICING_SETTINGS.deliveryFeeEnabled,
            freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? DEFAULT_PRICING_SETTINGS.freeDeliveryThreshold),

            platformFeeOriginal: Number(data.platformFeeOriginal ?? DEFAULT_PRICING_SETTINGS.platformFeeOriginal),
            platformFee: Number(data.platformFee ?? DEFAULT_PRICING_SETTINGS.platformFee),
            platformFeeEnabled: data.platformFeeEnabled !== undefined ? Boolean(data.platformFeeEnabled) : DEFAULT_PRICING_SETTINGS.platformFeeEnabled,

            gstPercentage: Number(data.gstPercentage ?? DEFAULT_PRICING_SETTINGS.gstPercentage),
            gstEnabled: data.gstEnabled !== undefined ? Boolean(data.gstEnabled) : DEFAULT_PRICING_SETTINGS.gstEnabled,
          };
          cachePricingSettings(cleanSettings);
          if (onUpdate) onUpdate(cleanSettings);
          return;
        }
        const fallback = getCachedPricingSettings();
        if (onUpdate) onUpdate(fallback);
      },
      (error) => {
        console.warn('Could not subscribe to pricing settings:', error);
        const fallback = getCachedPricingSettings();
        if (onUpdate) onUpdate(fallback);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToPricingSettings error:', err);
    if (onUpdate) onUpdate(getCachedPricingSettings());
    return () => {};
  }
}
