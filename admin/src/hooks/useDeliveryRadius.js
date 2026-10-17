import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToDeliverySettings,
  getCachedDeliveryRadius,
  updateDeliveryRadius as serviceUpdateRadius,
  QUICK_RADIUS_PRESETS,
} from '../services/deliverySettingsService';

export function useDeliveryRadius() {
  const [radiusKm, setRadiusKm] = useState(getCachedDeliveryRadius);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToDeliverySettings((settings) => {
      if (settings?.deliveryRadiusKm) {
        setRadiusKm(Number(settings.deliveryRadiusKm));
      }
      if (settings?.updatedAt) {
        setLastUpdated(settings.updatedAt);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateRadius = useCallback(async (newRadius, adminName = 'Admin') => {
    setIsSaving(true);
    try {
      const saved = await serviceUpdateRadius(newRadius, adminName);
      setRadiusKm(saved);
      return { success: true, radius: saved };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update radius' };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    radiusKm,
    updateRadius,
    isSaving,
    lastUpdated,
    presets: QUICK_RADIUS_PRESETS,
  };
}

export default useDeliveryRadius;
