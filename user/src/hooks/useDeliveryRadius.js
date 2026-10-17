import { useState, useEffect } from 'react';
import {
  subscribeToDeliverySettings,
  getCachedDeliveryRadius,
} from '../services/deliverySettingsService';

export function useDeliveryRadius() {
  const [radiusKm, setRadiusKm] = useState(getCachedDeliveryRadius);

  useEffect(() => {
    const unsubscribe = subscribeToDeliverySettings((settings) => {
      if (settings?.deliveryRadiusKm) {
        setRadiusKm(Number(settings.deliveryRadiusKm));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return radiusKm;
}

export default useDeliveryRadius;
