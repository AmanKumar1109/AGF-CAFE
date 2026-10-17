import React, { useState } from 'react';
import { Printer, X, ChefHat, Check } from 'lucide-react';

export const KitchenOrderTicketModal = ({ order, onClose }) => {
  const [printStatus, setPrintStatus] = useState('ready');

  if (!order) return null;

  const handlePrint = () => {
    setPrintStatus('sending');
    setTimeout(() => {
      setPrintStatus('printed');

      const kotElement = document.getElementById('printable-kitchen-kot');
      if (!kotElement) return;

      const printContents = kotElement.outerHTML;
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
        const isMaster = Boolean(order.isMasterBill);
        const titleText = isMaster ? `Master Bill Table #${order.tableNumber || '1'}` : `KOT Table #${order.tableNumber || '1'}`;
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${titleText} - ${order.id?.slice(0, 8)}</title>
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
              #printable-kitchen-kot { 
                margin: 0 !important; 
                padding: 4mm !important; 
                box-shadow: none !important; 
                width: 80mm !important; 
                max-width: 80mm !important; 
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
      }, 500);
    }, 300);
  };

  const orderTime = order.createdAt?.seconds
    ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                {order.isMasterBill ? 'Master Table Bill' : 'Kitchen Order Ticket (KOT)'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {order.isMasterBill ? 'Combined Running Tab • 80mm Thermal' : '80mm Thermal Printer View'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Slip */}
        <div className="p-4 overflow-y-auto max-h-[70vh] bg-slate-100 flex justify-center">
          <div
            id="printable-kitchen-kot"
            className="w-full max-w-[280px] bg-white text-slate-900 p-4 border border-dashed border-slate-400 font-mono text-xs shadow-md space-y-2"
          >
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <p className="font-bold text-sm tracking-wider">AGF CAFE & BISTRO</p>
              {order.isMasterBill ? (
                <>
                  <p className="text-[11px] uppercase font-black tracking-widest text-slate-900 mt-0.5">
                    *** FINAL MASTER BILL ***
                  </p>
                  <p className="text-[10px] font-bold text-slate-600">
                    Running Tab: All {order.roundsCount || ''} Rounds Consolidated
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mt-0.5">
                    *** KITCHEN ORDER TICKET (KOT) ***
                  </p>
                  {order.roundNumber > 1 && (
                    <div className="mt-1 px-1 py-0.5 bg-amber-100 border border-amber-300 rounded text-[11px] font-black text-amber-950">
                      ★ ADD-ON ORDER (ROUND #{order.roundNumber}) ★
                      <p className="text-[9px] font-normal text-slate-600 lowercase tracking-normal">
                        (prepare only newly added dishes below)
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Giant Table Badge */}
            <div className="text-center py-1 border-b border-dashed border-slate-400">
              <p className="text-xl font-black">
                TABLE #{order.tableNumber || '1'}
              </p>
              <p className="text-[10px] text-slate-600">
                {order.isMasterBill
                  ? `Date: ${new Date().toLocaleDateString('en-IN')} • ${orderTime}`
                  : `Order: #${order.orderId || order.id?.slice(-6).toUpperCase()} • ${orderTime}`}
              </p>
              <p className="text-[10px] text-slate-600">
                Guest: {order.customerName || 'Walk-in'} {order.customerPhone ? `(${order.customerPhone})` : ''}
              </p>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              <div className="flex justify-between font-bold text-[11px] border-b border-slate-200 pb-1">
                <span>QTY & DISH</span>
                {order.isMasterBill && <span>AMOUNT</span>}
              </div>

              {(order.items || []).map((item, idx) => {
                const addons = [];
                if (item.selectedCrust && typeof item.selectedCrust === 'string' && item.selectedCrust.toLowerCase() !== 'standard') {
                  addons.push({ name: item.selectedCrust });
                } else if (item.selectedCrust?.name && item.selectedCrust.name.toLowerCase() !== 'standard') {
                  addons.push({ name: item.selectedCrust.name });
                }
                const rawAddons = item.selectedAddOns || item.selectedAddons || item.addons || item.addOns || [];
                if (Array.isArray(rawAddons)) {
                  rawAddons.forEach(a => {
                    if (typeof a === 'string' && a.trim()) addons.push({ name: a.trim() });
                    else if (a && typeof a === 'object') {
                      const name = a.name || a.title || a.label || '';
                      if (name) addons.push({ name });
                    }
                  });
                }

                const itemTotal = (Number(item.price || item.basePrice || 0)) * (Number(item.quantity || 1));

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-start justify-between font-bold text-xs">
                      <span className="flex-1 pr-2">
                        {item.quantity}x {item.name}
                      </span>
                      {order.isMasterBill && (
                        <span className="shrink-0 font-mono font-bold">₹{itemTotal}</span>
                      )}
                    </div>
                    {addons.length > 0 && (
                      <div className="text-[10px] font-bold text-black pl-4">
                        + {addons.map((a) => a.name).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-[10px] font-bold text-black pl-4">
                        ** NOTE: {item.specialInstructions} **
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total items & Grand Total */}
            <div className="pt-1 text-[11px] flex justify-between font-bold">
              <span>Total Food Items:</span>
              <span>{(order.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)}</span>
            </div>

            {order.isMasterBill && (
              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between text-xs font-black">
                  <span>MASTER TOTAL:</span>
                  <span className="text-sm font-mono">₹{order.grandTotal || order.totalAmount || 0}</span>
                </div>
                <div className="text-[10px] text-center font-bold pt-2 border-t border-dashed border-slate-300 text-slate-700">
                  <p>*** THANK YOU FOR DINING WITH US! ***</p>
                  <p className="text-[9px] text-slate-500">Please visit again soon ☕</p>
                </div>
              </div>
            )}

            {!order.isMasterBill && order.notes && (
              <div className="text-[10px] pt-1 border-t border-dashed border-slate-400">
                Chef Note: {order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.4]" />
            <span>
              {printStatus === 'sending'
                ? 'Printing...'
                : order.isMasterBill
                ? 'Print Master Bill (Thermal)'
                : 'Print KOT (Thermal)'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default KitchenOrderTicketModal;
