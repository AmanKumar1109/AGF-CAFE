import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { checkDineInGeofence, AGF_CAFE_HUB } from '../utils/locationUtils';
import { useAuth } from './useAuth';

const SESSION_KEY = 'agf_dinein_session';

export const DineInContext = createContext(null);

export const DineInProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  // Restore session from sessionStorage if available
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse dine-in session:', e);
    }
    return {
      isDineIn: false,
      tableNumber: '',
      customerInfo: { name: '', phone: '' },
      activeOrderId: null,
      geofenceStatus: 'prompt', // 'prompt' | 'verifying' | 'granted' | 'outside' | 'error' | 'bypassed'
      distanceMeters: null,
    };
  });

  const [isTableEntryModalOpen, setIsTableEntryModalOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  // Sync session changes to sessionStorage
  useEffect(() => {
    try {
      if (session.isDineIn) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn('Failed to save dine-in session:', e);
    }
  }, [session]);

  // Autofill customer name and phone if user logs in and hasn't filled them
  useEffect(() => {
    if (session.isDineIn && (!session.customerInfo.name || !session.customerInfo.phone)) {
      const autoName = userProfile?.displayName || currentUser?.displayName || '';
      const autoPhone = userProfile?.phoneNumber || currentUser?.phoneNumber || '';
      if (autoName || autoPhone) {
        setSession((prev) => ({
          ...prev,
          customerInfo: {
            name: prev.customerInfo.name || autoName,
            phone: prev.customerInfo.phone || autoPhone,
          },
        }));
      }
    }
  }, [currentUser, userProfile, session.isDineIn]);

  // Listen for realtime updates on active order if exists
  useEffect(() => {
    if (!session.activeOrderId) {
      setActiveOrder(null);
      return;
    }

    try {
      const orderRef = doc(db, 'offline_orders', session.activeOrderId);
      const unsubscribe = onSnapshot(
        orderRef,
        (snap) => {
          if (snap.exists()) {
            setActiveOrder({ id: snap.id, ...snap.data() });
          } else {
            setActiveOrder(null);
          }
        },
        (err) => console.warn('Active dine-in order listener error:', err)
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Error setting up dine-in order listener:', err);
    }
  }, [session.activeOrderId]);

  /**
   * Verifies if customer device is physically at AGF Cafe (~150m)
   */
  const verifyLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setSession((prev) => ({ ...prev, geofenceStatus: 'error' }));
        resolve({ success: false, reason: 'Geolocation not supported by this browser.' });
        return;
      }

      setSession((prev) => ({ ...prev, geofenceStatus: 'verifying' }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const res = checkDineInGeofence(lat, lng, 150);

          if (res.isWithinGeofence) {
            setSession((prev) => ({
              ...prev,
              geofenceStatus: 'granted',
              distanceMeters: res.distanceMeters,
            }));
            resolve({ success: true, distanceMeters: res.distanceMeters });
          } else {
            setSession((prev) => ({
              ...prev,
              geofenceStatus: 'outside',
              distanceMeters: res.distanceMeters,
            }));
            resolve({
              success: false,
              outside: true,
              distanceMeters: res.distanceMeters,
              reason: `You are ~${res.distanceMeters}m away from AGF Cafe. Dine-In is strictly for guests at tables inside the cafe.`,
            });
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // If permission denied or timeout
          setSession((prev) => ({
            ...prev,
            geofenceStatus: error.code === 1 ? 'outside' : 'error',
          }));
          resolve({
            success: false,
            error: error.message,
            code: error.code,
            reason: error.code === 1
              ? 'Location access was denied. Please allow location access to order at your table.'
              : 'Unable to detect location. Please check your GPS signal or ask cafe staff.',
          });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
      );
    });
  }, []);

  /**
   * Allows staff to bypass geofence using emergency PIN if customer phone has GPS drift indoors
   */
  const bypassGeofenceWithPin = useCallback((pin) => {
    const validPins = ['1109', '832101', 'AGF2026', 'CAFE'];
    if (validPins.includes(String(pin).trim().toUpperCase())) {
      setSession((prev) => ({
        ...prev,
        geofenceStatus: 'bypassed',
      }));
      return { success: true };
    }
    return { success: false, error: 'Invalid Staff Override PIN' };
  }, []);

  /**
   * Initializes Dine-In mode with a given table ID (e.g. from QR scan)
   */
  const initDineInTable = useCallback(
    (tableId) => {
      const cleanTableId = String(tableId || '').replace(/[^a-zA-Z0-9-]/g, '');
      setSession((prev) => ({
        ...prev,
        isDineIn: true,
        tableNumber: cleanTableId || prev.tableNumber || '1',
      }));

      // If customer info is missing, prompt entry modal
      if (!session.customerInfo.name || !session.customerInfo.phone) {
        setIsTableEntryModalOpen(true);
      }
    },
    [session.customerInfo]
  );

  /**
   * Saves customer details and table number
   */
  const saveDineInDetails = useCallback(({ name, phone, tableNumber }) => {
    setSession((prev) => ({
      ...prev,
      isDineIn: true,
      tableNumber: String(tableNumber || prev.tableNumber || '1').trim(),
      customerInfo: {
        name: (name || '').trim(),
        phone: (phone || '').trim(),
      },
      geofenceStatus: prev.geofenceStatus === 'prompt' ? 'granted' : prev.geofenceStatus,
    }));
    setIsTableEntryModalOpen(false);
  }, []);

  /**
   * Sets active order ID after order is placed
   */
  const setDineInActiveOrder = useCallback((orderId) => {
    setSession((prev) => ({
      ...prev,
      activeOrderId: orderId,
    }));
    setIsOrderTrackerOpen(true);
  }, []);

  /**
   * Clears Dine-In mode and returns to normal online delivery
   */
  const exitDineIn = useCallback(() => {
    setSession({
      isDineIn: false,
      tableNumber: '',
      customerInfo: { name: '', phone: '' },
      activeOrderId: null,
      geofenceStatus: 'prompt',
      distanceMeters: null,
    });
    sessionStorage.removeItem(SESSION_KEY);
    setIsTableEntryModalOpen(false);
    setIsOrderTrackerOpen(false);
    setActiveOrder(null);
  }, []);

  return (
    <DineInContext.Provider
      value={{
        isDineIn: session.isDineIn,
        tableNumber: session.tableNumber,
        customerInfo: session.customerInfo,
        geofenceStatus: session.geofenceStatus,
        distanceMeters: session.distanceMeters,
        activeOrderId: session.activeOrderId,
        activeOrder,
        isTableEntryModalOpen,
        setIsTableEntryModalOpen,
        isOrderTrackerOpen,
        setIsOrderTrackerOpen,
        initDineInTable,
        saveDineInDetails,
        verifyLocation,
        bypassGeofenceWithPin,
        setDineInActiveOrder,
        exitDineIn,
        cafeHub: AGF_CAFE_HUB,
      }}
    >
      {children}
    </DineInContext.Provider>
  );
};

export const useDineIn = () => {
  const ctx = useContext(DineInContext);
  if (!ctx) {
    throw new Error('useDineIn must be used within a DineInProvider');
  }
  return ctx;
};
