import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { logAuditEvent } from '../components/audit/AuditLogsView';
import { sendOrderStatusEmail } from '../utils/emailTemplates';

// Helper to qualify referral reward automatically upon order delivery
const qualifyReferralForDeliveredOrder = async (order) => {
  if (!order) return;
  const customerId = order.userId || order.customerId;
  if (!customerId) return;

  try {
    // 1. Check if this customer has a pending referral
    const refQuery = query(
      collection(db, 'referrals'),
      where('referredUserId', '==', customerId),
      where('status', '==', 'REGISTERED')
    );
    const refSnap = await getDocs(refQuery);
    if (refSnap.empty) return;

    // 2. Fetch campaign settings
    const settingsRef = doc(db, 'settings', 'referrals');
    const settingsSnap = await getDoc(settingsRef);
    const campaignConfig = settingsSnap.exists() ? settingsSnap.data() : {};

    const isCampaignActive = campaignConfig.referralCampaignActive !== false;
    if (!isCampaignActive) return;

    const minOrderVal = Number(campaignConfig.referralMinOrderValue ?? 199);
    const referrerReward = Number(campaignConfig.referrerRewardAmount ?? 50);
    const referredReward = Number(campaignConfig.referredUserRewardAmount ?? 50);
    const couponMinOrder = Number(campaignConfig.referralCouponMinOrderValue ?? 199);
    const validityDays = Number(campaignConfig.referralCouponValidityDays ?? 30);

    const orderTotal = Number(order.totalAmount || order.grandTotal || 0);

    // If order total does not meet the threshold, keep pending for future qualifying order
    if (orderTotal < minOrderVal) {
      console.log(`Referral order amount ₹${orderTotal} is below threshold ₹${minOrderVal}`);
      return;
    }

    // Process each matching pending referral
    for (const refDoc of refSnap.docs) {
      const referralData = refDoc.data();
      const expiryDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();

      // Create Referrer coupon (Flat ₹X OFF)
      const referrerCouponCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await addDoc(collection(db, 'coupons'), {
        code: referrerCouponCode,
        title: `₹${referrerReward} Referral Reward`,
        description: `Earned by referring ${referralData.referredUserName || 'a friend'} to AGF Cafe`,
        discountType: 'flat',
        type: 'FLAT',
        discountValue: referrerReward,
        discount: referrerReward,
        minOrderValue: couponMinOrder,
        minOrder: couponMinOrder,
        maxDiscount: referrerReward,
        validUntil: expiryDate,
        expiryDate: expiryDate,
        isActive: true,
        usageCount: 0,
        usageLimit: 1,
        userId: referralData.referrerId,
        assignedUserId: referralData.referrerId,
        isGlobal: false,
        isReferralCoupon: true,
        createdAt: serverTimestamp(),
      });

      // Create Referred Friend coupon (Flat ₹X Welcome OFF)
      const referredCouponCode = `WELCOME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await addDoc(collection(db, 'coupons'), {
        code: referredCouponCode,
        title: `₹${referredReward} Welcome Reward`,
        description: `Welcome bonus for completing your first order at AGF Cafe`,
        discountType: 'flat',
        type: 'FLAT',
        discountValue: referredReward,
        discount: referredReward,
        minOrderValue: couponMinOrder,
        minOrder: couponMinOrder,
        maxDiscount: referredReward,
        validUntil: expiryDate,
        expiryDate: expiryDate,
        isActive: true,
        usageCount: 0,
        usageLimit: 1,
        userId: referralData.referredUserId,
        assignedUserId: referralData.referredUserId,
        isGlobal: false,
        isReferralCoupon: true,
        createdAt: serverTimestamp(),
      });

      // Update referral doc to REWARDED
      await updateDoc(doc(db, 'referrals', refDoc.id), {
        status: 'REWARDED',
        orderId: order.id,
        orderAmount: orderTotal,
        orderQualifiedAt: serverTimestamp(),
        rewardedAt: serverTimestamp(),
        referrerCouponCode,
        referredCouponCode,
        referrerReward,
        referredReward,
        updatedAt: serverTimestamp(),
      });

      // Record Audit Log
      await logAuditEvent({
        action: 'REFERRAL_REWARDED',
        details: `Auto-qualified referral #${refDoc.id.slice(0, 8)} on delivered Order #${order.id.slice(0, 8)} (₹${orderTotal}). Issued coupons: ${referrerCouponCode} to Referrer & ${referredCouponCode} to Friend`,
        category: 'Referrals',
        severity: 'success',
        actor: 'System / Delivery Automation',
      });
    }
  } catch (err) {
    console.error("Error qualifying referral for order delivery:", err);
  }
};

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
      // Filter out offline/dine-in orders to keep Cafe Orders strictly for online delivery
      const loaded = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => o.orderType !== 'dine-in' && o.source !== 'qr_table' && o.source !== 'counter_pos');
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

      // Record Audit Log
      await logAuditEvent({
        action: 'ORDER_STATUS_UPDATE',
        details: `Updated Order #${orderId.slice(0, 8)} status to "${newStatus}"`,
        category: 'Orders',
        severity: newStatus.toLowerCase() === 'delivered' ? 'success' : 'info',
        actor: 'Admin',
      });

      // If marked as Delivered, qualify referral program rewards and update delivery staff metrics
      if (newStatus.toLowerCase() === 'delivered') {
        const orderObj = orders.find(o => o.id === orderId);
        if (orderObj) {
          qualifyReferralForDeliveredOrder(orderObj);
          if (orderObj.assignedPartnerId) {
            updateDoc(doc(db, 'staff', orderObj.assignedPartnerId), {
              totalDeliveries: increment(1),
              status: 'Available',
              updatedAt: serverTimestamp(),
            }).catch(console.warn);
          }
        } else {
          getDoc(orderRef).then(snap => {
            if (snap.exists()) {
              const data = { id: snap.id, ...snap.data() };
              qualifyReferralForDeliveredOrder(data);
              if (data.assignedPartnerId) {
                updateDoc(doc(db, 'staff', data.assignedPartnerId), {
                  totalDeliveries: increment(1),
                  status: 'Available',
                  updatedAt: serverTimestamp(),
                }).catch(console.warn);
              }
            }
          }).catch(console.error);
        }
      }

      // Send Order Status Email Notification (Preparing, Out for Delivery, Delivered)
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        sendOrderStatusEmail({ ...targetOrder, status: newStatus }, newStatus).catch(console.error);
      } else {
        getDoc(orderRef).then(snap => {
          if (snap.exists()) {
            sendOrderStatusEmail({ id: snap.id, ...snap.data(), status: newStatus }, newStatus);
          }
        }).catch(console.error);
      }

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

      // Record Audit Log
      await logAuditEvent({
        action: 'ORDER_CANCELLED',
        details: `Cancelled Order #${orderId.slice(0, 8)}. Reason: "${reason || 'Unspecified'}"`,
        category: 'Orders',
        severity: 'danger',
        actor: 'Admin',
      });

      // Send Order Cancelled Email Notification
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        sendOrderStatusEmail({ ...targetOrder, status: 'Cancelled' }, 'Cancelled', reason).catch(console.error);
      } else {
        getDoc(orderRef).then(snap => {
          if (snap.exists()) {
            sendOrderStatusEmail({ id: snap.id, ...snap.data(), status: 'Cancelled' }, 'Cancelled', reason);
          }
        }).catch(console.error);
      }

      return true;
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order.");
      return false;
    }
  };

  const assignDeliveryPartner = async (orderId, partnerData) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updatePayload = {
        assignedPartnerName: partnerData.name,
        assignedPartnerPhone: partnerData.phone,
        status: 'Out for Delivery',
        outForDeliveryAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };
      if (partnerData.id) {
        updatePayload.assignedPartnerId = partnerData.id;
      }
      if (partnerData.vehicle) {
        updatePayload.assignedPartnerVehicle = partnerData.vehicle;
      }
      await updateDoc(orderRef, updatePayload);

      // If staff partner ID is provided, set status to On Duty and increment active orders
      if (partnerData.id) {
        try {
          const staffRef = doc(db, 'staff', partnerData.id);
          await updateDoc(staffRef, {
            status: 'On Duty',
            activeOrders: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (sErr) {
          console.warn("Could not update staff document on assign:", sErr);
        }
      }

      showToast(`Assigned ${partnerData.name} & marked Out for Delivery!`);

      // Record Audit Log
      await logAuditEvent({
        action: 'PARTNER_ASSIGNED',
        details: `Assigned rider ${partnerData.name} (${partnerData.phone}) to Order #${orderId.slice(0, 8)}`,
        category: 'Orders',
        severity: 'success',
        actor: 'Admin',
      });

      // Send Out for Delivery Email Notification
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        sendOrderStatusEmail({ 
          ...targetOrder, 
          status: 'Out for Delivery', 
          assignedPartnerName: partnerData.name, 
          assignedPartnerPhone: partnerData.phone 
        }, 'Out for Delivery').catch(console.error);
      } else {
        getDoc(orderRef).then(snap => {
          if (snap.exists()) {
            sendOrderStatusEmail({ id: snap.id, ...snap.data(), status: 'Out for Delivery' }, 'Out for Delivery');
          }
        }).catch(console.error);
      }

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
