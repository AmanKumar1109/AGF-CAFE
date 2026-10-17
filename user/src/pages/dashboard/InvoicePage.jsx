import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export const InvoicePage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center font-bold text-stone-600">
        Generating Cafe Tax Invoice...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center font-bold text-rose-600 bg-white rounded-3xl border border-stone-200 shadow-sm">
        Tax Invoice Not Found!
      </div>
    );
  }

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date = timestamp;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (typeof timestamp === 'number') date = new Date(timestamp);
    else if (typeof timestamp === 'string') date = new Date(timestamp);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
    const n = ('000000000' + Math.floor(num)).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
    return str.trim() + ' Only';
  };

  let totalQty = 0;
  let itemsTotal = 0;
  
  order.items?.forEach(item => {
    const qty = parseFloat(item.quantity || 1);
    totalQty += qty;
    const price = parseFloat(item.price || 0);
    itemsTotal += (price * qty);
  });

  const deliveryFee = parseFloat(order.deliveryFee || 0);
  const platformFee = parseFloat(order.platformFee || 0);
  const gstAmount = parseFloat(order.gstAmount || 0);
  const discountAmount = parseFloat(order.discountAmount || 0);
  const totalSaved = parseFloat(order.totalSaved || 0);
  const netPayable = parseFloat(order.totalAmount || order.grandTotal || (itemsTotal + deliveryFee + platformFee + gstAmount - discountAmount));
  const customerName = order.customerName || order.shippingAddress?.fullName || userProfile?.fullName || userProfile?.name || 'Customer';
  const customerPhone = order.customerPhone || order.shippingAddress?.phone || userProfile?.phone || '';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 min-h-screen print:p-0 print:m-0">
      <style>
        {`
          @media print {
            @page {
              margin: 0 !important;
              size: 80mm auto;
            }
            html, body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              color: black !important;
            }
            .thermal-print-container {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 4mm !important;
              box-shadow: none !important;
              border: none !important;
              font-family: 'Courier New', Courier, monospace !important;
              transform: none !important;
              color: black !important;
              background: white !important;
            }
          }
        `}
      </style>
      
      {/* Top Nav (Hidden on print) */}
      <div className="mb-6 print:hidden">
        <Link 
          to="/dashboard/orders" 
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 justify-center items-start print:m-0 print:p-0 print:gap-0 print:block print:w-[80mm] print:mx-0">
        
        {/* Left/Main Column: Thermal Receipt */}
        <div className="thermal-print-container w-full max-w-[380px] bg-white rounded-2xl shadow-sm p-6 font-mono text-[12px] leading-tight text-black print:shadow-none print:w-[80mm] print:max-w-[80mm] print:p-2 print:mx-0 print:ml-0 border border-stone-200">
          
          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold uppercase mb-0.5 tracking-wider">AGF CAFE & RESTRO</h1>
            <p className="text-[11px]">GOOD FOOD • HAPPY MOOD</p>
            <p className="text-[10px]">MAIN ROAD, NEAR CAMPUS</p>
            <p className="text-[10px]">MOB: +91 98765 43210</p>
            <p className="text-[10px]">FSSAI LIC: 22024001000123</p>
          </div>
          
          <div className="border-t border-b border-dashed border-black py-1 text-center font-bold mb-2">
            RESTAURANT TAX INVOICE
          </div>
          
          {/* Info */}
          <div className="mb-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Inv No: {order.id?.slice(0, 8)?.toUpperCase()}</span>
              <span>Date: {formatDateShort(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer: {customerName?.slice(0, 15)}</span>
              <span>Mob: {customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Pay: {order.paymentMethod || 'Online'}</span>
              <span>Status: {order.status || 'Received'}</span>
            </div>
          </div>
          
          <div className="border-t border-black border-dashed mb-2" />
          
          {/* Items Table */}
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black border-dashed">
                <th className="py-1 font-bold w-[46%]">Item</th>
                <th className="py-1 font-bold text-center w-[14%]">Qty</th>
                <th className="py-1 font-bold text-right w-[20%] pr-1">Rate</th>
                <th className="py-1 font-bold text-right w-[20%]">Amt</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => {
                const qty = parseFloat(item.quantity || 1);
                const price = parseFloat(item.price || 0);
                const amt = price * qty;
                return (
                  <tr key={idx} className="align-top border-b border-stone-200/40">
                    <td className="py-1 pr-1 font-medium">
                      <div>{idx + 1}. {item.name}</div>
                      {item.selectedAddOns?.length > 0 && (
                        <div className="text-[9px] text-stone-600 pl-2">
                          + {item.selectedAddOns.map(a => a.name).join(', ')}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-[9px] italic text-stone-600 pl-2">
                          Note: "{item.specialInstructions}"
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center font-medium">{qty}</td>
                    <td className="py-1 text-right pr-1 font-medium">{price.toFixed(2)}</td>
                    <td className="py-1 text-right font-medium">{amt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="border-t border-black border-dashed mt-2 py-2">
            <div className="flex justify-between font-bold text-[11px]">
              <span>Total Items: {totalQty}</span>
              <div className="flex items-center gap-2">
                <span>Subtotal:</span>
                <span>₹{itemsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="border-t border-black border-dashed py-2 space-y-1 text-[11px]">
            {deliveryFee > 0 ? (
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span>: ₹{deliveryFee.toFixed(2)}</span>
              </div>
            ) : (order.deliveryFeeSaved > 0 || order.deliveryFee === 0) && (
              <div className="flex justify-between text-emerald-850">
                <span>Delivery Partner Fee</span>
                <span>: FREE {order.deliveryFeeSaved ? `(Saved ₹${order.deliveryFeeSaved})` : ''}</span>
              </div>
            )}

            {platformFee > 0 ? (
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>: ₹{platformFee.toFixed(2)}</span>
              </div>
            ) : (order.platformFeeSaved > 0 || order.platformFee === 0) && (
              <div className="flex justify-between text-emerald-850">
                <span>Platform Fee</span>
                <span>: FREE {order.platformFeeSaved ? `(Saved ₹${order.platformFeeSaved})` : ''}</span>
              </div>
            )}

            {gstAmount > 0 && (
              <div className="flex justify-between">
                <span>Govt. Taxes (GST {order.gstPercentage || 5}%)</span>
                <span>: ₹{gstAmount.toFixed(2)}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between font-bold">
                <span>Discount / Coupon</span>
                <span>: -₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {totalSaved > 0 && (
              <div className="flex justify-between font-bold text-emerald-850 bg-emerald-50 px-1 py-0.5 rounded">
                <span>Total Money Saved</span>
                <span>: ₹{totalSaved.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-[13px] mt-1 pt-1 border-t border-black border-dashed">
              <span>NET PAYABLE</span>
              <span>: Rs. {netPayable.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-black border-dashed mt-2 pt-2 text-center text-[10px]">
            <p>Rupees {numberToWords(netPayable)}</p>
          </div>

          <div className="border-t border-black border-dashed mt-2 pt-2 text-center text-[10px]">
            <p className="font-bold">Thank You For Dining With Us!</p>
            <p>Visit Again • Follow @agfcafe</p>
          </div>
        </div>

        {/* Right Column: Actions (Hidden on Print) */}
        <div className="w-full md:w-72 shrink-0 space-y-4 print:hidden">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-stone-500 uppercase tracking-wider">Print Options</h2>
            
            <button 
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Tax Receipt</span>
            </button>
            <p className="text-[11px] text-stone-500 text-center leading-relaxed font-medium">
              Uses standard 80mm thermal receipt format. Select "80mm Roll" or "Save as PDF" when printing.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePage;
