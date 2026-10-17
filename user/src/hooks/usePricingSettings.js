import { useState, useEffect } from 'react';
import {
  getCachedPricingSettings,
  subscribeToPricingSettings,
  DEFAULT_PRICING_SETTINGS
} from '../services/pricingSettingsService';

export function usePricingSettings() {
  const [settings, setSettings] = useState(getCachedPricingSettings);

  useEffect(() => {
    const unsubscribe = subscribeToPricingSettings((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  return {
    pricingSettings: settings,
    defaults: DEFAULT_PRICING_SETTINGS
  };
}
