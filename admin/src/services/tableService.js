import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_CAFE_TABLES = [
  { id: 'table-1', tableNumber: '1', name: 'Table 1', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-2', tableNumber: '2', name: 'Table 2', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-3', tableNumber: '3', name: 'Table 3', capacity: 2, area: 'Window Corner', status: 'available' },
  { id: 'table-4', tableNumber: '4', name: 'Table 4', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-5', tableNumber: '5', name: 'Table 5', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-6', tableNumber: '6', name: 'Table 6', capacity: 6, area: 'Family Section', status: 'available' },
  { id: 'table-7', tableNumber: '7', name: 'Table 7', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-8', tableNumber: '8', name: 'Table 8', capacity: 2, area: 'Window Corner', status: 'available' },
  { id: 'table-9', tableNumber: '9', name: 'Table 9', capacity: 4, area: 'Main Hall', status: 'available' },
  { id: 'table-10', tableNumber: '10', name: 'Table 10', capacity: 6, area: 'Family Section', status: 'available' },
  { id: 'table-VIP-1', tableNumber: 'VIP-1', name: 'VIP Lounge 1', capacity: 8, area: 'VIP Lounge', status: 'available' },
  { id: 'table-Outdoor-1', tableNumber: 'Outdoor-1', name: 'Garden Table 1', capacity: 4, area: 'Outdoor Garden', status: 'available' },
];

/**
 * Initializes default tables if Firestore collection is empty
 */
export async function initializeTablesIfEmpty() {
  try {
    const snap = await getDocs(collection(db, 'tables'));
    if (snap.empty) {
      console.log('Seeding initial cafe tables in Firestore...');
      for (const t of DEFAULT_CAFE_TABLES) {
        await setDoc(doc(db, 'tables', t.id), {
          ...t,
          activeOrderId: null,
          currentGuestName: null,
          currentGuestPhone: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Error checking/seeding tables:', err);
  }
}

/**
 * Realtime listener for tables
 */
export function subscribeTables(callback) {
  initializeTablesIfEmpty();

  const q = collection(db, 'tables');
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort by table number natural order
      list.sort((a, b) => {
        const numA = parseInt(a.tableNumber, 10);
        const numB = parseInt(b.tableNumber, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.tableNumber).localeCompare(String(b.tableNumber));
      });

      callback(list);
    },
    (err) => console.warn('Tables subscription error:', err)
  );
}

/**
 * Realtime listener for offline Dine-In orders
 */
export function subscribeDineInOrders(callback) {
  const q = collection(db, 'offline_orders');

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort newest first
      orders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      callback(orders);
    },
    (err) => console.warn('Offline orders subscription error:', err)
  );
}

/**
 * Realtime listener for dedicated Offline Customers CRM
 */
export function subscribeOfflineCustomers(callback) {
  const q = collection(db, 'offline_customers');

  return onSnapshot(
    q,
    (snapshot) => {
      const customers = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort most visits / highest spend first
      customers.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));

      callback(customers);
    },
    (err) => console.warn('Offline customers subscription error:', err)
  );
}

/**
 * Updates table status in Firestore
 */
export async function updateTableStatus(tableId, status, payload = {}) {
  const tableRef = doc(db, 'tables', tableId);
  return updateDoc(tableRef, {
    status,
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Clears table after guest leaves
 */
export async function clearTable(tableId) {
  const tableRef = doc(db, 'tables', tableId);
  return updateDoc(tableRef, {
    status: 'available',
    activeOrderId: null,
    currentGuestName: null,
    currentGuestPhone: null,
    lastOrderTime: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Settles table bill and marks order as paid in offline_orders
 */
export async function settleTableBill(tableId, orderId, paymentMethod = 'counter_cash') {
  if (orderId) {
    const orderRef = doc(db, 'offline_orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'paid',
      paymentMethod,
      status: 'Completed',
      settledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (tableId) {
    await clearTable(tableId);
  }
}

/**
 * Settles all active orders for a table (Master Running Bill) and clears the table
 */
export async function settleMasterTableOrders(tableId, orderIds = [], paymentMethod = 'counter_cash') {
  for (const oId of orderIds) {
    if (oId) {
      try {
        const orderRef = doc(db, 'offline_orders', oId);
        await updateDoc(orderRef, {
          paymentStatus: 'paid',
          paymentMethod,
          status: 'Completed',
          settledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Error settling order in master bill:', oId, e);
      }
    }
  }

  if (tableId) {
    await clearTable(tableId);
  }
}

/**
 * Updates order status in offline_orders (e.g. Cooking, Served, Completed)
 */
export async function updateDineInOrderStatus(orderId, newStatus, extra = {}) {
  const orderRef = doc(db, 'offline_orders', orderId);
  return updateDoc(orderRef, {
    status: newStatus,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Direct Walk-in POS Billing: Cashier punches order directly from counter
 */
export async function punchWalkInTableOrder(payload) {
  const generatedId = `AGF-POS-${Math.floor(100000 + Math.random() * 900000)}`;

  let roundNumber = 1;
  try {
    const qActive = query(
      collection(db, 'offline_orders'),
      where('tableNumber', '==', String(payload.tableNumber || '1')),
      where('status', 'in', ['Order Received', 'Cooking', 'Served'])
    );
    const snap = await getDocs(qActive);
    if (!snap.empty) {
      roundNumber = snap.size + 1;
    }
  } catch (err) {
    console.warn('Error checking table rounds for walk-in:', err);
  }

  const orderData = {
    orderId: generatedId,
    orderType: 'dine-in',
    source: 'counter_pos',
    tableNumber: String(payload.tableNumber || '1'),
    roundNumber,
    customerName: (payload.customerName || 'Walk-in Guest').trim(),
    customerPhone: (payload.customerPhone || '').trim(),
    deliveryAddress: `Table #${payload.tableNumber || '1'}, AGF Cafe Dine-In`,
    shippingAddress: {
      type: 'Dine-In Table',
      tableNumber: String(payload.tableNumber || '1'),
      addressLine1: `Table #${payload.tableNumber || '1'}, AGF Cafe Dine-In`,
    },
    paymentMethod: payload.paymentMethod || 'counter_cash',
    paymentStatus: payload.paymentStatus || 'pending',
    items: payload.items || [],
    subtotal: payload.subtotal || 0,
    discountAmount: payload.discountAmount || 0,
    deliveryFee: 0,
    platformFee: 0,
    gstPercentage: payload.gstPercentage ?? 5.0,
    gstAmount: payload.gstAmount || 0,
    totalAmount: payload.totalAmount || 0,
    grandTotal: payload.totalAmount || 0,
    status: payload.status || 'Order Received',
    notes: payload.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'offline_orders'), orderData);

  // Mark table occupied
  const tableDocRef = doc(db, 'tables', `table-${payload.tableNumber}`);
  await setDoc(
    tableDocRef,
    {
      id: `table-${payload.tableNumber}`,
      tableNumber: String(payload.tableNumber),
      name: `Table ${payload.tableNumber}`,
      status: 'occupied',
      activeOrderId: docRef.id,
      currentGuestName: orderData.customerName,
      currentGuestPhone: orderData.customerPhone,
      roundsCount: roundNumber,
      lastOrderTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Record customer data in offline_customers collection
  if (orderData.customerPhone) {
    try {
      const customerDocRef = doc(db, 'offline_customers', orderData.customerPhone);
      await setDoc(
        customerDocRef,
        {
          phone: orderData.customerPhone,
          name: orderData.customerName,
          totalVisits: roundNumber > 1 ? increment(0) : increment(1),
          totalSpent: increment(orderData.grandTotal),
          lastTableNumber: String(payload.tableNumber || '1'),
          lastOrderId: docRef.id,
          lastOrderAmount: orderData.grandTotal,
          lastVisitAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (cErr) {
      console.warn('Offline customer record error in POS:', cErr);
    }
  }

  return { id: docRef.id, ...orderData };
}
