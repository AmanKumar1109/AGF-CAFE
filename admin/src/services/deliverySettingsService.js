import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { setDynamicDeliveryRadius } from '../utils/locationUtils';

const STORAGE_KEY = 'agf_delivery_radius_km';
export const DEFAULT_RADIUS_KM = 10.0;
export const QUICK_RADIUS_PRESETS = [3, 5, 8, 10, 12, 15, 20];

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
    // Ignore error
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
    // Ignore error
  }
}

/**
 * Update delivery radius in Firestore (1-Click Save)
 */
export async function updateDeliveryRadius(newRadiusKm, adminName = 'Admin') {
  const parsed = parseFloat(newRadiusKm);
  if (isNaN(parsed) || parsed < 0.5 || parsed > 50) {
    throw new Error('Please enter a valid radius between 0.5 and 50 km');
  }

  // Preserve up to 2 decimal places (e.g. 7.53)
  const radius = Math.round(parsed * 100) / 100;

  // Update locally immediately for instant feedback
  cacheDeliveryRadius(radius);
  setDynamicDeliveryRadius(radius);

  const docRef = doc(db, 'settings', 'delivery');
  await setDoc(
    docRef,
    {
      deliveryRadiusKm: radius,
      updatedAt: serverTimestamp(),
      updatedBy: adminName,
    },
    { merge: true }
  );

  return radius;
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
    console.warn('Failed to initialize delivery settings listener in admin:', err);
    const fallback = getCachedDeliveryRadius();
    setDynamicDeliveryRadius(fallback);
    if (onUpdate) onUpdate({ deliveryRadiusKm: fallback });
    return () => {};
  }
}
