import { useState, useEffect, useCallback } from 'react';
import {
  getCachedPricingSettings,
  updatePricingSettings,
  subscribeToPricingSettings,
  DEFAULT_PRICING_SETTINGS
} from '../services/pricingSettingsService';

export function usePricingSettings() {
  const [settings, setSettings] = useState(getCachedPricingSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToPricingSettings((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  const saveSettings = useCallback(async (updatedFields, adminName = 'Admin') => {
    setIsSaving(true);
    try {
      const result = await updatePricingSettings(updatedFields, adminName);
      setSettings(result);
      return { success: true, settings: result };
    } catch (err) {
      console.error('Failed to update pricing settings:', err);
      return { success: false, error: err.message };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    settings,
    saveSettings,
    isSaving,
    defaults: DEFAULT_PRICING_SETTINGS
  };
}
