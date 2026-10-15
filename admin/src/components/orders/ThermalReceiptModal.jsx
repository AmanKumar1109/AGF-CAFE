import React, { useState } from 'react';
import { Printer, X, CheckCircle, Receipt } from 'lucide-react';

export const ThermalReceiptModal = ({ order, onClose }) => {
  const [printStatus, setPrintStatus] = useState('ready');

  if (!order) return null;

  const handlePrint = () => {
    setPrintStatus('sending');
    setTimeout(() => {
      setPrintStatus('printed');
      
      const receiptElement = document.getElementById('printable-cafe-receipt');
      if (!receiptElement) return;

      const printContents = receiptElement.outerHTML;
      let stylesHtml = '';
      for (const node of [...document.querySelectorAll('link[rel="stylesheet"], style')]) {
        stylesHtml += node.outerHTML;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Receipt #${order.id?.slice(0, 8)}</title>
            ${stylesHtml}
            <style>
              @page { margin: 0 !important; size: 80mm auto; }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                width: 80mm !important; 
                background: white !important; 
                color: black !important;
                font-family: 'Courier New', Courier, monospace !important;
              }
              #printable-cafe-receipt { 
                margin: 0 !important; 
                padding: 4mm !important; 
                box-shadow: none !important; 
                width: 80mm !important; 
                max-width: 80mm !important; 
                transform: none !important; 
                position: static !important;
                background: white !important;
                color: black !important;
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          setPrintStatus('ready');
        }, 1000);
      }, 250);

    }, 300);
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

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date = timestamp;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (typeof timestamp === 'number') date = new Date(timestamp);
    else if (typeof timestamp === 'string') date = new Date(timestamp);
    
    try {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return 'Today';
    }
  };

  let totalQty = 0;
  let itemsTotal = 0;

  order.items?.forEach(item => {
    const qty = parseFloat(item.quantity || 1);
    totalQty += qty;
    const price = parseFloat(item.price || 0);
    itemsTotal += (price * qty);
  });

  const netPayable = parseFloat(order.totalAmount || order.grandTotal || itemsTotal);
  const customerName = order.customerName || order.shippingAddress?.fullName || 'Walk-in / Online';
  const customerPhone = order.customerPhone || order.shippingAddress?.phone || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-800 text-sm">POS Thermal Bill Preview</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100">
          <div 
            id="printable-cafe-receipt"
            className="w-[320px] bg-white shadow-md p-5 font-mono text-[11px] leading-tight text-black border border-slate-200"
          >
            {/* Cafe Details */}
            <div className="text-center mb-3">
              <h1 className="text-lg font-bold uppercase mb-0.5 tracking-wider">AGF CAFE & RESTRO</h1>
              <p className="text-[10px]">GOOD FOOD • HAPPY MOOD</p>
              <p className="text-[10px]">MAIN ROAD, NEAR CAMPUS</p>
              <p className="text-[10px]">MOB: +91 98765 43210</p>
              <p className="text-[10px]">FSSAI LIC: 22024001000123</p>
            </div>
            
            <div className="border-t border-b border-dashed border-black py-1 text-center font-bold mb-2">
              KITCHEN & CUSTOMER TAX INVOICE
            </div>
            
            <div className="mb-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Inv: #{order.id?.slice(0, 8)?.toUpperCase()}</span>
                <span>Date: {formatDateShort(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cust: {customerName?.slice(0, 16)}</span>
                <span>Ph: {customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>Pay: {order.paymentMethod || 'Online'}</span>
                <span>Status: {order.status || 'Received'}</span>
              </div>
            </div>
            
            <div className="border-t border-black border-dashed mb-2" />
            
            {/* Table */}
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-black border-dashed font-bold">
                  <th className="py-1 w-[48%]">Item</th>
                  <th className="py-1 text-center w-[12%]">Qty</th>
                  <th className="py-1 text-right w-[20%] pr-1">Rate</th>
                  <th className="py-1 text-right w-[20%]">Amt</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const qty = parseFloat(item.quantity || 1);
                  const price = parseFloat(item.price || 0);
                  const amt = price * qty;
                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1">{idx + 1}. {item.name}</td>
                      <td className="py-1 text-center">{qty}</td>
                      <td className="py-1 text-right pr-1">{price.toFixed(2)}</td>
                      <td className="py-1 text-right">{amt.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="border-t border-black border-dashed mt-2 py-1.5 font-bold text-[10px] flex justify-between">
              <span>Total Items: {totalQty}</span>
              <span>Subtotal: ₹{itemsTotal.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-black border-dashed py-1.5 space-y-1 text-[10px]">
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>: ₹{parseFloat(order.deliveryFee).toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Discount</span>
                  <span>: -₹{parseFloat(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-black border-dashed">
                <span>NET PAYABLE</span>
                <span>: Rs. {netPayable.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-black border-dashed mt-1.5 pt-1.5 text-center text-[9px]">
              <p>Rupees {numberToWords(netPayable)}</p>
            </div>

            <div className="border-t border-black border-dashed mt-1.5 pt-1.5 text-center text-[9px]">
              <p className="font-bold">Thank You For Choosing AGF CAFE!</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500 font-medium">Standard 80mm Roll Width</p>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {printStatus === 'printed' ? <CheckCircle className="w-4 h-4 text-emerald-800" /> : <Printer className="w-4 h-4" />}
            <span>{printStatus === 'printed' ? 'Printed!' : 'Print Bill (80mm)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceiptModal;
