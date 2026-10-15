import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Filter,
  Eye,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import gsap from 'gsap';

export const OrderHistoryView = () => {
  const { orders } = useAdminOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [printingOrder, setPrintingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const tableRef = useRef(null);

  const filteredOrders = orders.filter(order => {
    const status = order.status || '';
    const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
    
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (order.id || '').toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q) ||
      (order.customerPhone || '').toLowerCase().includes(q) ||
      (order.deliveryAddress || '').toLowerCase().includes(q);

    let matchesDate = true;
    if (dateFilter) {
      const val = order.createdAt;
      let d;
      if (val?.toDate) d = val.toDate();
      else if (val?.seconds) d = new Date(val.seconds * 1000);
      else if (typeof val === 'string') d = new Date(val);

      if (d && !isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        matchesDate = `${year}-${month}-${day}` === dateFilter;
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  useEffect(() => {
    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll('tr'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' }
      );
    }
  }, [statusFilter, searchQuery, dateFilter, filteredOrders.length]);

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export.");
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Total (INR)', 'Payment', 'Status', 'Items'];
    const rows = filteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'N/A'}"`,
      `"${o.customerName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      parseFloat(o.totalAmount || o.grandTotal || 0).toFixed(2),
      `"${o.paymentMethod || 'Online'}"`,
      `"${o.status || 'Received'}"`,
      `"${(o.items || []).map(i => `${i.name} (${i.quantity}x)`).join('; ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agf_cafe_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    let d;
    if (timestamp.toDate) d = timestamp.toDate();
    else if (timestamp.seconds) d = new Date(timestamp.seconds * 1000);
    else if (typeof timestamp === 'string') d = new Date(timestamp);
    if (!d || isNaN(d.getTime())) return 'Recent';

    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Order Received">Order Received</option>
            <option value="Preparing">Preparing</option>
            <option value="Out for Delivery">Out for Delivery</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* CSV Export Button */}
        <button
          onClick={exportToCSV}
          className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody ref={tableRef} className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isDelivered = order.status?.toLowerCase() === 'delivered';
                  const isCancelled = order.status?.toLowerCase() === 'cancelled';
                  const total = order.totalAmount || order.grandTotal || 0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 pl-6 font-mono font-black text-slate-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{order.customerName || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="p-4 font-medium text-slate-600">
                        {order.items?.length || 1} items
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900">
                        ₹{parseFloat(total).toFixed(2)}
                      </td>
                      <td className="p-4 uppercase text-[10px] font-bold text-slate-500">
                        {order.paymentMethod || 'Online'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status || 'Received'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                            title="Print Thermal Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Customer & Delivery Details</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <p className="font-bold text-slate-800">Name: {selectedOrder.customerName}</p>
                  <p className="text-slate-600">Phone: {selectedOrder.customerPhone}</p>
                  <p className="text-slate-600">Address: {selectedOrder.deliveryAddress || selectedOrder.shippingAddress?.street}</p>
                  <p className="text-slate-600">Payment: {selectedOrder.paymentMethod} &bull; Status: {selectedOrder.status}</p>
                  {selectedOrder.deliveryOtp && (
                    <p className="font-bold text-amber-700">Delivery PIN: {selectedOrder.deliveryOtp}</p>
                  )}
                  {selectedOrder.cancelReason && (
                    <p className="font-bold text-rose-700">Cancel Reason: {selectedOrder.cancelReason}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Items Ordered</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-800 font-bold flex items-center justify-center text-xs">
                          {item.quantity || 1}x
                        </span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">
                        ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-black text-base border-t border-slate-100">
                <span className="text-slate-600">Grand Total:</span>
                <span className="font-mono text-slate-900 text-lg">
                  ₹{parseFloat(selectedOrder.totalAmount || selectedOrder.grandTotal || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  setPrintingOrder(selectedOrder);
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Thermal Modal */}
      {printingOrder && (
        <ThermalReceiptModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderHistoryView;
