import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { setDynamicDeliveryRadius } from '../utils/locationUtils';

const STORAGE_KEY = 'agf_delivery_radius_km';
const DEFAULT_RADIUS_KM = 10.0;

/**
 * Get synchronously cached delivery radius (0ms delay on startup)
 */
export function getCachedDeliveryRadius() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = parseFloat(cached);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        return parsed;
      }
    }
  } catch (e) {
    // localStorage may be disabled or restricted in private browsing
  }
  return DEFAULT_RADIUS_KM;
}

/**
 * Cache delivery radius locally
 */
export function cacheDeliveryRadius(radius) {
  try {
    const num = Number(radius);
    if (!isNaN(num) && num > 0) {
      localStorage.setItem(STORAGE_KEY, String(num));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Subscribe to real-time delivery settings from Firestore
 * Returns unsubscribe function
 */
export function subscribeToDeliverySettings(onUpdate) {
  try {
    const docRef = doc(db, 'settings', 'delivery');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const radius = Number(data.deliveryRadiusKm);
          if (!isNaN(radius) && radius > 0) {
            cacheDeliveryRadius(radius);
            setDynamicDeliveryRadius(radius);
            if (onUpdate) onUpdate({ ...data, deliveryRadiusKm: radius });
            return;
          }
        }
        // Fallback if document doesn't exist yet
        const fallback = getCachedDeliveryRadius();
        setDynamicDeliveryRadius(fallback);
        if (onUpdate) onUpdate({ deliveryRadiusKm: fallback });
      },
      (error) => {
        console.warn('Could not subscribe to delivery settings in Firestore:', error);
        const fallback = getCachedDeliveryRadius();
        setDynamicDeliveryRadius(fallback);
        if (onUpdate) onUpdate({ deliveryRadiusKm: fallback });
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to initialize delivery settings listener:', err);
    const fallback = getCachedDeliveryRadius();
    setDynamicDeliveryRadius(fallback);
    if (onUpdate) onUpdate({ deliveryRadiusKm: fallback });
    return () => {};
  }
}
