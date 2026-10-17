import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'agf_pricing_settings';

export const DEFAULT_PRICING_SETTINGS = {
  // Delivery Partner Fee
  deliveryFeeOriginal: 40,
  deliveryFee: 0, // Admin can set to 0 to make delivery free (with strikethrough ~~₹40~~ FREE)
  deliveryFeeEnabled: true,
  freeDeliveryThreshold: 499,

  // Platform Fee
  platformFeeOriginal: 10,
  platformFee: 5, // Admin can set to 0 to make platform fee free (with strikethrough ~~₹10~~ FREE)
  platformFeeEnabled: true,

  // GST
  gstPercentage: 5.0, // Standard Food & Beverage GST (5%)
  gstEnabled: true,
};

/**
 * Get synchronously cached pricing settings
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
 * Update pricing settings in Firestore (1-Click Save)
 */
export async function updatePricingSettings(newSettings, adminName = 'Admin') {
  const current = getCachedPricingSettings();
  const merged = {
    ...current,
    ...newSettings,
    deliveryFeeOriginal: Number(newSettings.deliveryFeeOriginal ?? current.deliveryFeeOriginal),
    deliveryFee: Math.max(0, Number(newSettings.deliveryFee ?? current.deliveryFee)),
    deliveryFeeEnabled: Boolean(newSettings.deliveryFeeEnabled ?? current.deliveryFeeEnabled),
    freeDeliveryThreshold: Number(newSettings.freeDeliveryThreshold ?? current.freeDeliveryThreshold),

    platformFeeOriginal: Number(newSettings.platformFeeOriginal ?? current.platformFeeOriginal),
    platformFee: Math.max(0, Number(newSettings.platformFee ?? current.platformFee)),
    platformFeeEnabled: Boolean(newSettings.platformFeeEnabled ?? current.platformFeeEnabled),

    gstPercentage: Math.max(0, Number(newSettings.gstPercentage ?? current.gstPercentage)),
    gstEnabled: Boolean(newSettings.gstEnabled ?? current.gstEnabled),
  };

  cachePricingSettings(merged);

  const docRef = doc(db, 'settings', 'pricing');
  await setDoc(
    docRef,
    {
      ...merged,
      updatedAt: serverTimestamp(),
      updatedBy: adminName,
    },
    { merge: true }
  );

  return merged;
}

/**
 * Subscribe to real-time pricing settings from Firestore
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
        // If document doesn't exist yet, seed with defaults
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
