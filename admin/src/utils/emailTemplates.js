import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const EMAIL_WRAPPER = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #fafaf9;
    margin: 0;
    padding: 0;
    color: #292524;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    border: 1px solid #e7e5e4;
  }
  .header {
    background: linear-gradient(135deg, #1c1917 0%, #292524 60%, #451a03 100%);
    padding: 36px 24px;
    text-align: center;
    border-bottom: 2px solid #f59e0b;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
    font-family: Georgia, serif;
  }
  .header p {
    color: #fbbf24;
    margin: 6px 0 0 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .content {
    padding: 36px 30px;
    font-size: 15px;
    color: #44403c;
  }
  .content p {
    margin-top: 0;
    margin-bottom: 18px;
    line-height: 1.65;
  }
  .highlight {
    background: #fffbeb;
    padding: 18px 22px;
    border-radius: 16px;
    border-left: 4px solid #f59e0b;
    border-top: 1px solid #fef3c7;
    border-right: 1px solid #fef3c7;
    border-bottom: 1px solid #fef3c7;
    margin-bottom: 22px;
    color: #78350f;
    font-size: 14px;
  }
  .footer {
    background: #f5f5f4;
    padding: 24px 20px;
    text-align: center;
    font-size: 12px;
    color: #78716c;
    border-top: 1px solid #e7e5e4;
  }
  .footer p {
    margin: 4px 0;
  }
  .btn {
    display: inline-block;
    background: #f59e0b;
    color: #1c1917;
    text-decoration: none;
    padding: 12px 26px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 14px;
    margin-top: 10px;
    letter-spacing: 0.5px;
  }
  .order-table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e7e5e4;
  }
  .order-table th {
    background: #f5f5f4;
    padding: 12px 14px;
    text-align: left;
    font-size: 12px;
    font-weight: 800;
    color: #57534e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e7e5e4;
  }
  .order-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #f5f5f4;
    color: #292524;
    font-size: 13px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AGF CAFE ☕</h1>
      <p>Taste The Luxury • Artisan Brews & Gourmet Kitchen</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>AGF CAFE & GOURMET KITCHEN</strong></p>
      <p>Thank you for choosing luxury taste! For inquiries, contact support at <strong>agfcafe01@gmail.com</strong></p>
      <p style="color: #a8a29e; font-size: 11px; margin-top: 8px;">&copy; ${new Date().getFullYear()} AGF CAFE. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const formatOrderItems = (items, orderTotal, address, discount = 0, deliveryFee = 0) => {
  if (!items || items.length === 0) return '';
  let html = `<table class="order-table">`;
  html += `<tr><th>Item / Dish</th><th style="text-align: right;">Amount</th></tr>`;
  
  items.forEach(item => {
    const qty = item.quantity || item.qty || 1;
    const name = item.name || 'Artisan Dish';
    const price = item.price || 0;
    const total = (price * qty).toFixed(2);
    html += `
      <tr>
        <td>
          <strong style="color: #1c1917;">${name}</strong>
          <span style="display: block; font-size: 11px; color: #a8a29e;">Quantity: x${qty} @ ₹${price}</span>
        </td>
        <td style="text-align: right; font-weight: 700; color: #292524;">₹${total}</td>
      </tr>
    `;
  });

  if (discount > 0) {
    html += `
      <tr>
        <td style="text-align: right; font-size: 12px; color: #15803d; font-weight: 600;">Coupon Discount</td>
        <td style="text-align: right; font-size: 12px; color: #15803d; font-weight: 700;">-₹${parseFloat(discount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (deliveryFee > 0) {
    html += `
      <tr>
        <td style="text-align: right; font-size: 12px; color: #78716c;">Delivery Fee</td>
        <td style="text-align: right; font-size: 12px; color: #44403c; font-weight: 600;">₹${parseFloat(deliveryFee).toFixed(2)}</td>
      </tr>
    `;
  }

  if (orderTotal !== undefined && orderTotal !== null) {
    html += `
      <tr style="background: #fafaf9;">
        <td style="text-align: right; font-weight: 900; color: #1c1917; font-size: 14px; text-transform: uppercase;">Total Paid</td>
        <td style="text-align: right; font-weight: 900; color: #b45309; font-size: 16px;">₹${parseFloat(orderTotal).toFixed(2)}</td>
      </tr>
    `;
  }

  if (address) {
    html += `
      <tr>
        <td colspan="2" style="padding: 14px; background: #fffbeb; font-size: 12px; color: #78350f; line-height: 1.5; border-top: 1px solid #fef3c7;">
          <strong style="color: #92400e; display: block; margin-bottom: 2px;">📍 Delivery Address:</strong>
          ${address}
        </td>
      </tr>
    `;
  }

  html += `</table>`;
  return html.replace(/\n/g, '');
};

export const DEFAULT_TEMPLATES = {
  Welcome: {
    subject: "Welcome to AGF CAFE! ☕✨ Taste The Luxury",
    body: `Hi [Customer Name],

Welcome to the AGF CAFE family! ☕🥐

We are delighted to have you with us. From signature artisan roasts and handcrafted coffee beverages to freshly baked pastries and gourmet kitchen meals, every recipe is prepared to bring you culinary luxury.

<div class="highlight">
<strong>Your Registered Account:</strong> [Email]
</div>

Explore our artisan menu, discover today's chef specials, and enjoy fresh cafe delights delivered hot & prompt right to your door.

Warm regards,
The AGF CAFE Team
Taste The Luxury.`
  },

  Pending: {
    subject: "Order Received – AGF CAFE #[Order ID] ☕",
    body: `Dear [Customer Name],

Thank you for choosing AGF CAFE! ☕✨

Your order <strong>#[Order ID]</strong> has been successfully received by our kitchen.

<div class="highlight">
💰 <strong>Order Total:</strong> ₹[Amount]<br>
📍 <strong>Delivery Address:</strong> [Address]<br>
🕐 <strong>Order Time:</strong> [Time]<br><br>
<strong>🍽️ Meal Details:</strong>
[Order Items]
</div>

Our chefs are preparing your dishes with the finest hand-picked ingredients. We'll notify you as soon as your order moves to the kitchen!

AGF CAFE
Artisan Roasts • Gourmet Kitchen`
  },

  Preparing: {
    subject: "Your Meal is Sizzling in Kitchen! 🍳 #[Order ID]",
    body: `Dear [Customer Name],

Great taste takes craft! 🍳✨

Your order <strong>#[Order ID]</strong> has been confirmed and is actively being prepared in the AGF Cafe kitchen with fresh ingredients.

<div class="highlight">
<strong>🍽️ Meal Details:</strong>
[Order Items]
</div>

Once your order is freshly packed and sealed in insulated packaging, our delivery partner will be dispatched.

AGF CAFE
Freshly Prepared With Passion. ❤️`
  },

  "Out for delivery": {
    subject: "Your Cafe Order is Out for Delivery! 🛵💨 #[Order ID]",
    body: `Dear [Customer Name],

Hot & fresh on the move! 🎉

Your meal <strong>#[Order ID]</strong> is carefully packed and is now out for delivery. 🛵💨

<div class="highlight">
📍 <strong>Delivering To:</strong> [Address]<br>
💰 <strong>Amount:</strong> ₹[Amount]<br><br>
<strong>🍽️ Meal Details:</strong>
[Order Items]
</div>

Please keep your phone handy so our delivery partner can coordinate with you smoothly upon arrival.

AGF CAFE
Taste The Luxury At Your Doorstep.`
  },

  Delivered: {
    subject: "Order Delivered – Bon Appétit! 🍽️ #[Order ID]",
    body: `Dear [Customer Name],

Your meal <strong>#[Order ID]</strong> has been successfully delivered! ✅🍽️

We hope you thoroughly enjoy your gourmet dishes and artisan beverages.

<div class="highlight">
<strong>🍽️ Delivered Items:</strong>
[Order Items]
</div>

<div class="highlight" style="text-align: center;">
<strong>How was your dining experience with AGF CAFE? ⭐</strong><br>
We value your feedback and would love to hear your thoughts!<br>
Rate your dishes and leave a quick review on your dashboard.
</div>

Thank you for dining with AGF CAFE! ☕🥐`
  },

  Cancelled: {
    subject: "Order Cancelled - #[Order ID] ❌",
    body: `Dear [Customer Name],

Your order <strong>#[Order ID]</strong> has been cancelled. ❌

<div class="highlight">
<strong>Reason for Cancellation:</strong> [Cancel Reason]
</div>

If you made an online prepayment, your refund will be processed and credited back to your original payment method within 3-5 business days. Please reach out to our cafe support if you need any assistance.

Warm regards,
AGF CAFE Support Team`
  }
};

/**
 * Replace placeholders in template body and subject
 */
export const renderEmailContent = (template, params = {}) => {
  if (!template) return { subject: '', html: '' };

  const {
    customerName = 'Customer',
    email = '',
    orderId = '',
    amount = '0.00',
    address = 'N/A',
    time = new Date().toLocaleString('en-IN'),
    cancelReason = 'Unspecified',
    orderItemsHtml = '',
  } = params;

  let subject = (template.subject || '')
    .replace(/\[Customer Name\]/gi, customerName)
    .replace(/\[Order ID\]/gi, orderId)
    .replace(/\[Amount\]/gi, amount);

  let rawBody = (template.body || '')
    .replace(/\n/g, '<br>')
    .replace(/\[Customer Name\]/gi, customerName)
    .replace(/\[Email\]/gi, email)
    .replace(/\[Order ID\]/gi, orderId)
    .replace(/\[Amount\]/gi, amount)
    .replace(/\[Address\]/gi, address)
    .replace(/\[Time\]/gi, time)
    .replace(/\[Cancel Reason\]/gi, cancelReason)
    .replace(/\[Order Items?\]/gi, orderItemsHtml);

  return {
    subject,
    html: EMAIL_WRAPPER(rawBody),
  };
};

/**
 * Send Order Status Email automatically by queueing in Firestore `mail` collection
 */
export const sendOrderStatusEmail = async (order, status, cancelReason = '') => {
  if (!order) return;
  const targetEmail = order.customerEmail || order.email || order.userEmail;
  if (!targetEmail) {
    console.log("No recipient email found for order:", order.id);
    return;
  }

  try {
    // 1. Fetch notification templates from Firestore settings
    const notifDocRef = doc(db, 'settings', 'notifications');
    const notifSnap = await getDoc(notifDocRef);
    const settingsData = notifSnap.exists() ? notifSnap.data() : {};
    const templates = settingsData.templates || DEFAULT_TEMPLATES;
    const senderName = settingsData.senderName || 'AGF CAFE';
    const senderEmail = settingsData.senderEmail || 'agfcafe01@gmail.com';

    // 2. Map order status to template key
    let templateKey = null;
    const normStatus = (status || '').toLowerCase();
    if (normStatus === 'order received' || normStatus === 'pending') {
      templateKey = 'Pending';
    } else if (normStatus === 'preparing' || normStatus === 'packing' || normStatus === 'cooking') {
      templateKey = 'Preparing';
    } else if (normStatus === 'out for delivery') {
      templateKey = 'Out for delivery';
    } else if (normStatus === 'delivered') {
      templateKey = 'Delivered';
    } else if (normStatus === 'cancelled') {
      templateKey = 'Cancelled';
    }

    if (!templateKey || !templates[templateKey]) {
      console.log(`No matching email template found for status: ${status}`);
      return;
    }

    const template = templates[templateKey];

    // Format address
    let addressStr = 'N/A';
    if (order.deliveryAddress) {
      addressStr = typeof order.deliveryAddress === 'string' 
        ? order.deliveryAddress 
        : order.deliveryAddress.addressLine1 || 'N/A';
    } else if (order.shippingAddress) {
      addressStr = typeof order.shippingAddress === 'string'
        ? order.shippingAddress
        : order.shippingAddress.addressLine1 || 'N/A';
    }

    const orderTotal = Number(order.totalAmount || order.grandTotal || 0).toFixed(2);
    const orderItemsTable = formatOrderItems(
      order.items || [], 
      orderTotal, 
      addressStr, 
      Number(order.discountAmount || 0), 
      Number(order.deliveryFee || 0)
    );

    const formatTime = (ts) => {
      if (!ts) return new Date().toLocaleString('en-IN');
      if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString('en-IN');
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString('en-IN');
      return new Date(ts).toLocaleString('en-IN');
    };

    const rendered = renderEmailContent(template, {
      customerName: order.customerName || order.userName || 'Valued Customer',
      email: targetEmail,
      orderId: order.orderId || (order.id ? order.id.slice(0, 8).toUpperCase() : 'CAFE-ORDER'),
      amount: orderTotal,
      address: addressStr,
      time: formatTime(order.createdAt),
      cancelReason: cancelReason || order.cancelReason || 'Unspecified by staff',
      orderItemsHtml: orderItemsTable,
    });

    // 3. Queue in Firestore `mail` collection
    await addDoc(collection(db, 'mail'), {
      to: targetEmail,
      from: `"${senderName}" <${senderEmail}>`,
      message: {
        subject: rendered.subject,
        html: rendered.html,
      },
      orderId: order.id || order.orderId || null,
      status: status,
      queuedAt: serverTimestamp(),
    });

    console.log(`Email successfully queued for ${targetEmail} (Status: ${status})`);
  } catch (err) {
    console.error("Failed to queue order status email:", err);
  }
};
