import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  Search,
  Phone,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  CreditCard,
  AlertTriangle,
  Sparkles,
  UtensilsCrossed,
  MessageCircle,
  Send,
  Loader2
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { logAuditEvent } from '../audit/AuditLogsView';

export const ComplaintsView = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    try {
      const q = query(collection(db, 'complaints'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort descending by creation date
          list.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
          });

          setComplaints(list);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching complaints in admin:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Complaints subscription error:', err);
      setLoading(false);
    }
  }, []);

  // Issue category metadata
  const issueTypesMap = {
    'Food Quality': { label: 'Food Quality', icon: UtensilsCrossed, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    'Missing Item': { label: 'Missing Item', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'Packaging Issue': { label: 'Packaging Spill', icon: Package, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'Delivery Delay': { label: 'Delivery Delay', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Billing / Payment': { label: 'Billing / UPI', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'Other': { label: 'General / Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  // Status metadata
  const statusMap = {
    pending: { label: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
    resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
  };

  const updateComplaint = async (id, newStatus, adminReply = null) => {
    setIsUpdatingStatus(true);
    try {
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (adminReply !== null && adminReply.trim() !== '') {
        updateData.adminReply = adminReply.trim();
        updateData.adminReplyAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'complaints', id), updateData);

      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev) => ({
          ...prev,
          status: newStatus,
          adminReply: adminReply !== null ? adminReply.trim() : prev?.adminReply,
        }));
      }

      // Record Audit Log
      await logAuditEvent({
        action: newStatus === 'resolved' ? 'COMPLAINT_RESOLVED' : 'COMPLAINT_STATUS_UPDATE',
        details: `Updated complaint #${id.slice(0, 8)} status to "${newStatus}"${adminReply ? ` with reply: "${adminReply.slice(0, 50)}..."` : ''}`,
        category: 'Support',
        severity: newStatus === 'resolved' ? 'success' : 'info',
        actor: 'Admin',
      });
    } catch (err) {
      console.error('Error updating complaint status:', err);
      alert('Failed to update complaint status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const deleteComplaint = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this complaint record?')) {
      try {
        await deleteDoc(doc(db, 'complaints', id));
        if (selectedComplaint && selectedComplaint.id === id) {
          setSelectedComplaint(null);
        }

        // Record Audit Log
        await logAuditEvent({
          action: 'COMPLAINT_DELETED',
          details: `Deleted complaint record #${id.slice(0, 8)} from database`,
          category: 'Support',
          severity: 'danger',
          actor: 'Admin',
        });
      } catch (err) {
        console.error('Error deleting complaint:', err);
        alert('Failed to delete complaint.');
      }
    }
  };

  // Stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => (c.status || 'pending') === 'pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  // Filtered List
  const filteredComplaints = complaints.filter((c) => {
    const statusMatch = statusFilter === 'all' || (c.status || 'pending') === statusFilter;
    const issueMatch = issueFilter === 'all' || c.issueType === issueFilter;

    const term = searchTerm.toLowerCase().trim();
    const searchMatch =
      !term ||
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.orderId && c.orderId.toLowerCase().includes(term)) ||
      (c.ticketId && c.ticketId.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term));

    return statusMatch && issueMatch && searchMatch;
  });

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return { exact: 'Recent', relative: 'Just now' };
    const ms = timestamp?.toDate
      ? timestamp.toDate().getTime()
      : timestamp?.seconds
      ? timestamp.seconds * 1000
      : new Date(timestamp).getTime();

    if (!ms || isNaN(ms)) return { exact: 'Recent', relative: 'Just now' };

    const date = new Date(ms);
    const exact = date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    let relative = 'Just now';
    if (diffSec < 60) relative = 'Just now';
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else relative = `${Math.floor(diffSec / 86400)}d ago`;

    return { exact, relative };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Customer Support Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif mt-1">
            Customer Complaints & Support Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Investigate reported cafe issues, write manager responses, and resolve dispute tickets
          </p>
        </div>
      </div>

      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <MessageSquareWarning className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold animate-pulse">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Investigation</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone, ticket ID, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">All Statuses ({totalCount})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="in_progress">In Progress ({inProgressCount})</option>
                <option value="resolved">Resolved ({resolvedCount})</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:w-48">
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">All Issue Categories</option>
                <option value="Food Quality">Food Quality & Taste</option>
                <option value="Missing Item">Missing Food / Beverage</option>
                <option value="Packaging Issue">Packaging & Spill</option>
                <option value="Delivery Delay">Delivery Partner Delay</option>
                <option value="Billing / Payment">Billing & Payments</option>
                <option value="Other">Other / General</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-blue-600" />
            <span>Active Tickets ({filteredComplaints.length})</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">Live Sync from Firestore</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Customer & Phone</th>
                <th className="py-3.5 px-6">Issue Category</th>
                <th className="py-3.5 px-6">Order Ref</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Submitted</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading complaints...</p>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No complaints found</p>
                      <p className="text-slate-400 text-xs">
                        {searchTerm || statusFilter !== 'all' || issueFilter !== 'all'
                          ? 'Try adjusting your search keywords or active filters.'
                          : 'Zero open complaints! Customer dining satisfaction is 100%.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item) => {
                  const currentStatusKey = item.status || 'pending';
                  const statusObj = statusMap[currentStatusKey] || statusMap.pending;
                  const issueObj = issueTypesMap[item.issueType] || issueTypesMap.Other;
                  const IssueIcon = issueObj.icon;
                  const timeData = formatRelativeTime(item.createdAt);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer & Phone */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                            {(item.name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">
                              {item.name || 'Anonymous Guest'}
                            </p>
                            <a
                              href={`tel:${item.phone}`}
                              className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium text-[11px] transition-colors mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.phone || 'N/A'}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Issue Category */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${issueObj.color}`}
                        >
                          <IssueIcon className="w-3.5 h-3.5" />
                          <span>{issueObj.label}</span>
                        </span>
                      </td>

                      {/* Order Ref */}
                      <td className="py-4 px-6 font-semibold whitespace-nowrap">
                        {item.orderId ? (
                          <span className="font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-mono text-[11px]">
                            #{item.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not Provided</span>
                        )}
                      </td>

                      {/* Description Preview */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 text-xs leading-relaxed font-medium">
                          {item.description || 'No description provided.'}
                        </p>
                        {item.adminReply && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                            <MessageCircle className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">Replied: "{item.adminReply}"</span>
                          </div>
                        )}
                      </td>

                      {/* Date & Timing */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{timeData.exact}</span>
                        </p>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {timeData.relative}
                        </span>
                      </td>

                      {/* Inline Status Dropdown */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={currentStatusKey}
                            onChange={(e) => updateComplaint(item.id, e.target.value)}
                            className={`appearance-none font-bold text-[11px] px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${statusObj.color}`}
                          >
                            <option value="pending">⏳ Pending Review</option>
                            <option value="in_progress">🔄 In Progress</option>
                            <option value="resolved">✅ Resolved</option>
                            <option value="dismissed">❌ Dismissed</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedComplaint(item);
                              setReplyText(item.adminReply || '');
                            }}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="Respond / View Ticket"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteComplaint(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Complaint Record"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Complaint Detail & Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  {selectedComplaint.ticketId || `TICKET #${selectedComplaint.id.slice(0, 6).toUpperCase()}`}
                </span>
                <h3 className="text-xl font-black text-slate-900 font-serif mt-2">
                  {selectedComplaint.name || 'Customer Complaint'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setReplyText('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Phone & Order ID Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-bold mb-0.5">Customer Phone</p>
                  <a
                    href={`tel:${selectedComplaint.phone}`}
                    className="font-bold text-slate-800 text-sm hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedComplaint.phone || 'N/A'}</span>
                  </a>
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-0.5">Order Ref</p>
                  <p className="font-bold text-slate-900 text-sm font-mono">
                    {selectedComplaint.orderId ? `#${selectedComplaint.orderId}` : 'Not Provided'}
                  </p>
                </div>
              </div>

              {/* Category & Timestamp */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Issue Type</p>
                  <p className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedComplaint.issueType || 'General Inquiry'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported</p>
                  <p className="font-bold text-slate-700 text-xs mt-0.5">
                    {formatRelativeTime(selectedComplaint.createdAt).relative}
                  </p>
                </div>
              </div>

              {/* Customer's Description */}
              <div>
                <p className="text-slate-500 font-bold mb-1">Customer's Statement</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  "{selectedComplaint.description || 'No detailed statement provided.'}"
                </div>
              </div>

              {/* Admin Reply Input */}
              <div className="space-y-2">
                <label className="text-slate-700 font-bold block">
                  Write Resolution Response to Guest (Live in their dashboard)
                </label>
                <textarea
                  rows="3"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. Dear guest, we are truly sorry for the cold pizza delivery. Our chef has dispatched a complimentary freshly baked Margherita with our compliments..."
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Update Ticket Status & Dispatch Reply
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => updateComplaint(selectedComplaint.id, 'in_progress', replyText)}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      selectedComplaint.status === 'in_progress'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Mark Investigating</span>
                  </button>

                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => updateComplaint(selectedComplaint.id, 'resolved', replyText)}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      selectedComplaint.status === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Resolve & Reply</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => updateComplaint(selectedComplaint.id, 'dismissed', replyText)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Dismiss Ticket
              </button>

              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setReplyText('');
                }}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsView;
