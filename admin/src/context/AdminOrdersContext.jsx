import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const AdminOrdersContext = createContext();

export const useAdminOrders = () => {
  const context = useContext(AdminOrdersContext);
  if (!context) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }
  return context;
};

export const AdminOrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synthesize Web Audio Chime for new incoming orders
  const playOrderPingChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Tone 1: High E (659.25 Hz) -> Tone 2: Higher A (880.00 Hz)
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn("Audio ping chime failed:", err);
    }
  };

  const getTimeMs = (val) => {
    if (!val) return 0;
    if (typeof val === 'string') return new Date(val).getTime() || 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    return 0;
  };

  // Listen to Firestore orders collection real-time
  useEffect(() => {
    let isInitialLoad = true;

    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      loaded.sort((a, b) => getTimeMs(b.createdAt || b.updatedAt) - getTimeMs(a.createdAt || a.updatedAt));

      if (!isInitialLoad) {
        const hasNewOrder = snap.docChanges().some(change => change.type === 'added');
        if (hasNewOrder) {
          playOrderPingChime();
          showToast('🔔 New Customer Order Arrived!');
        }
      }

      setOrders(loaded);
      setLoading(false);
      isInitialLoad = false;
    }, (err) => {
      console.error("Orders snapshot error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order #${orderId.slice(0, 8)} status set to "${newStatus}"`);
      return true;
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status. Check connection.");
      return false;
    }
  };

  // Cancel order with reason
  const cancelOrder = async (orderId, reason) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Cancelled',
        cancelReason: `Cancelled by Cafe Admin: ${reason}`,
        updatedAt: serverTimestamp(),
      });
      showToast(`Order #${orderId.slice(0, 8)} has been cancelled.`);
      return true;
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order.");
      return false;
    }
  };

  // Assign delivery partner
  const assignDeliveryPartner = async (orderId, partnerData) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        assignedPartnerName: partnerData.name,
        assignedPartnerPhone: partnerData.phone,
        status: 'Out for Delivery',
        updatedAt: serverTimestamp(),
      });
      showToast(`Assigned ${partnerData.name} & marked Out for Delivery!`);
      return true;
    } catch (err) {
      console.error("Error assigning rider partner:", err);
      alert("Failed to assign partner.");
      return false;
    }
  };

  // Verify delivery OTP
  const verifyDeliveryOtp = async (order, inputOtp) => {
    const cleanInput = (inputOtp || '').trim();
    const targetOtp = (order.deliveryOtp || '').trim();

    if (!targetOtp || cleanInput === targetOtp) {
      await updateOrderStatus(order.id, 'Delivered');
      return { success: true };
    }
    return { success: false, message: 'Invalid OTP code. Please check with customer.' };
  };

  // Active orders count for badges
  const activeOrders = orders.filter(
    o => o.status?.toLowerCase() !== 'delivered' && o.status?.toLowerCase() !== 'cancelled'
  );

  return (
    <AdminOrdersContext.Provider
      value={{
        orders,
        activeOrders,
        loading,
        updateOrderStatus,
        cancelOrder,
        assignDeliveryPartner,
        verifyDeliveryOtp,
        showToast,
        toastMessage,
        playOrderPingChime,
      }}
    >
      {children}
    </AdminOrdersContext.Provider>
  );
};
