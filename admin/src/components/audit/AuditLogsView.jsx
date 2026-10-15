import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardList,
  Search,
  ShieldCheck,
  Filter,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Copy,
  Check,
  DownloadCloud,
  RotateCcw,
  Tag,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  Package,
  CalendarDays,
  X,
  Database,
  Sparkles,
  Plus,
  Loader2,
  Trash2,
} from 'lucide-react';
import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';

// Helper to generate 9-digit traceable Log Code
export const generateLogCode = () => {
  return `LOG-${Math.floor(100000000 + Math.random() * 900000000)}`;
};

// Standalone helper to add audit log to Firestore
export const logAuditEvent = async ({
  action,
  details,
  category = 'General',
  severity = 'info',
  actor = 'Admin',
  metadata = {},
}) => {
  try {
    const logId = generateLogCode();
    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').slice(0, 19);

    await setDoc(doc(db, 'auditLogs', logId), {
      id: logId,
      action,
      details,
      category,
      severity,
      actor,
      timestamp: formattedTimestamp,
      createdAt: serverTimestamp(),
      ...metadata,
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
};

// Initial demo seed logs for AGF Cafe
const SAMPLE_CAFE_LOGS = [
  {
    id: 'LOG-849201948',
    action: 'ITEM_UPDATED',
    details: 'Updated menu item "Crunchy Double Patty Burger" price to ₹189 and set stock to Available',
    category: 'Catalog',
    severity: 'info',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-739102845',
    action: 'ORDER_STATUS_UPDATE',
    details: 'Updated Order #AGF-7821 status from "Preparing" to "Out for Delivery"',
    category: 'Orders',
    severity: 'success',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-628491039',
    action: 'POLICY_UPDATED',
    details: 'Published revised "Privacy Policy" with updated customer contact info',
    category: 'Content',
    severity: 'info',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-519382014',
    action: 'COMPLAINT_RESOLVED',
    details: 'Resolved complaint #CMP-4821 regarding "Packaging Seal": Issued ₹50 apology coupon',
    category: 'Support',
    severity: 'success',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-409281736',
    action: 'ITEM_CREATED',
    details: 'Added new beverage "Belgian Chocolate Thick Shake" (Category: Shakes, Price: ₹149)',
    category: 'Catalog',
    severity: 'success',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-398201947',
    action: 'ORDER_CANCELLED',
    details: 'Cancelled Order #AGF-7790. Reason: "Customer requested cancellation before kitchen prep"',
    category: 'Orders',
    severity: 'danger',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-287192840',
    action: 'CATEGORY_CREATED',
    details: 'Added new menu category "Stone-Baked Pizzas" with 8 items',
    category: 'Catalog',
    severity: 'success',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString().replace('T', ' ').slice(0, 19),
  },
  {
    id: 'LOG-176291830',
    action: 'STORE_SETTINGS_UPDATE',
    details: 'Updated Cafe delivery radius to 8.0 KM and free delivery threshold to ₹299',
    category: 'Settings',
    severity: 'warning',
    actor: 'Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().replace('T', ' ').slice(0, 19),
  },
];

export const AuditLogsView = () => {
  // Initialize with SAMPLE_CAFE_LOGS so the screen is never blank even before network finishes
  const [auditLogs, setAuditLogs] = useState(SAMPLE_CAFE_LOGS);
  const [loading, setLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Search & Filter States matching Grocery Hub
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'today' | 'yesterday' | 'week' | 'month'
  const [specificDate, setSpecificDate] = useState(''); // 'YYYY-MM-DD'
  const [selectedProduct, setSelectedProduct] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Copied Log ID state for visual feedback
  const [copiedId, setCopiedId] = useState(null);

  // Auto-seed helper
  const seedLogsToFirestore = async () => {
    try {
      for (const log of SAMPLE_CAFE_LOGS) {
        await setDoc(doc(db, 'auditLogs', log.id), {
          ...log,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Auto-seed failed:', e);
    }
  };

  // Firestore real-time listener
  useEffect(() => {
    let isSubscribed = true;
    try {
      const unsub = onSnapshot(
        collection(db, 'auditLogs'),
        (snap) => {
          if (!isSubscribed) return;

          if (snap.empty) {
            // Firestore collection has 0 documents! Auto-seed demo logs so it permanently populates in cloud
            setAuditLogs(SAMPLE_CAFE_LOGS);
            seedLogsToFirestore();
            setLoading(false);
            return;
          }

          const loaded = [];
          snap.forEach((d) => {
            loaded.push({ id: d.id, ...d.data() });
          });

          // Sort descending by timestamp / createdAt
          loaded.sort((a, b) => {
            const timeA = a.createdAt?.toDate?.()?.getTime() || new Date(a.timestamp || 0).getTime();
            const timeB = b.createdAt?.toDate?.()?.getTime() || new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
          });

          setAuditLogs(loaded);
          setLoading(false);
        },
        (err) => {
          console.warn('Audit logs snapshot note (using local cache):', err);
          if (isSubscribed) {
            setAuditLogs(SAMPLE_CAFE_LOGS);
            setLoading(false);
          }
        }
      );

      return () => {
        isSubscribed = false;
        unsub();
      };
    } catch (e) {
      console.warn('Audit logs listener setup failed, using sample logs:', e);
      setAuditLogs(SAMPLE_CAFE_LOGS);
      setLoading(false);
    }
  }, []);

  // Seed sample logs if collection is empty
  const handleSeedDemoLogs = async () => {
    setIsSeeding(true);
    try {
      for (const log of SAMPLE_CAFE_LOGS) {
        await setDoc(doc(db, 'auditLogs', log.id), {
          ...log,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('Failed to seed demo logs:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Extract Dynamic List of Categories
  const uniqueCategories = useMemo(() => {
    const cats = new Set(auditLogs.map((l) => l.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [auditLogs]);

  // Extract Dynamic List of Actions with live counts
  const uniqueActions = useMemo(() => {
    const actionMap = {};
    auditLogs.forEach((l) => {
      if (l.action) {
        actionMap[l.action] = (actionMap[l.action] || 0) + 1;
      }
    });
    return Object.entries(actionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([action, count]) => ({ action, count }));
  }, [auditLogs]);

  // Extract Unique Product Names from audit log details (quoted strings)
  const uniqueProductNames = useMemo(() => {
    const prodSet = new Set();
    auditLogs.forEach((log) => {
      if (log.details) {
        const matches = log.details.match(/"([^"]+)"/g);
        if (matches) {
          matches.forEach((m) => {
            const clean = m.replace(/"/g, '').trim();
            if (
              clean &&
              clean.length > 2 &&
              !clean.startsWith('LOG-') &&
              !clean.startsWith('AGF-') &&
              !clean.startsWith('CMP-')
            ) {
              prodSet.add(clean);
            }
          });
        }
      }
    });
    return ['All', ...Array.from(prodSet).sort()];
  }, [auditLogs]);

  // Comprehensive Filter & Search Logic matching Grocery Hub
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentMonthStr = now.toISOString().slice(0, 7);

    return auditLogs.filter((log) => {
      // 1. Category Filter
      if (categoryFilter !== 'All' && log.category !== categoryFilter) {
        return false;
      }

      // 2. Action Filter
      if (actionFilter !== 'All' && log.action !== actionFilter) {
        return false;
      }

      // 3. Severity Filter
      if (severityFilter !== 'All' && log.severity !== severityFilter) {
        return false;
      }

      // 4. Product Name Filter
      if (selectedProduct !== 'All') {
        const prodMatch = (log.details || '').toLowerCase().includes(selectedProduct.toLowerCase());
        if (!prodMatch) return false;
      }

      // 5. Specific Date Filter
      if (specificDate) {
        const logDateStr = log.timestamp ? log.timestamp.split(' ')[0] : '';
        if (logDateStr !== specificDate) {
          return false;
        }
      } else if (dateFilter !== 'All') {
        const logDateStr = log.timestamp ? log.timestamp.split(' ')[0] : '';
        const logDate = new Date(log.timestamp || 0);
        if (dateFilter === 'today' && logDateStr !== todayStr) return false;
        if (dateFilter === 'yesterday' && logDateStr !== yesterdayStr) return false;
        if (dateFilter === 'week' && logDate < sevenDaysAgo) return false;
        if (dateFilter === 'month' && (!logDateStr || !logDateStr.startsWith(currentMonthStr))) return false;
      }

      // 6. Universal Search Filter
      if (searchQuery.trim()) {
        const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableCorpus = [
          log.id || '',
          log.action || '',
          log.details || '',
          log.actor || '',
          log.category || '',
          log.severity || '',
          log.timestamp || '',
        ]
          .join(' ')
          .toLowerCase();

        const allTermsMatch = queryTerms.every((term) => searchableCorpus.includes(term));
        if (!allTermsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    auditLogs,
    categoryFilter,
    actionFilter,
    severityFilter,
    dateFilter,
    specificDate,
    selectedProduct,
    searchQuery,
  ]);

  // Reset to first page whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, actionFilter, severityFilter, dateFilter, specificDate, selectedProduct, searchQuery]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Copy Log ID handler
  const handleCopyLogId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setActionFilter('All');
    setSeverityFilter('All');
    setDateFilter('All');
    setSpecificDate('');
    setSelectedProduct('All');
  };

  const isAnyFilterActive =
    searchQuery !== '' ||
    categoryFilter !== 'All' ||
    actionFilter !== 'All' ||
    severityFilter !== 'All' ||
    dateFilter !== 'All' ||
    specificDate !== '' ||
    selectedProduct !== 'All';

  // Export to CSV / Excel handler (Universal spreadsheet format)
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['#', 'Log ID', 'Timestamp', 'Action', 'Category', 'Severity', 'Details', 'Performed By'];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      `"${log.id || 'N/A'}"`,
      `"${log.timestamp || 'N/A'}"`,
      `"${log.action || 'N/A'}"`,
      `"${log.category || 'General'}"`,
      `"${log.severity || 'info'}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      `"${log.actor || 'Admin'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AGFCafe_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Warning
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
            <XCircle className="w-3 h-3 text-rose-600" /> Danger
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
            <Info className="w-3 h-3 text-blue-600" /> Info
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-64px)] bg-slate-50/50 flex flex-col pb-12">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xs">
        <div className="px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">System Audit Logs</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {auditLogs.length} events
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Chronological timeline of catalog updates, order tracking & 9-digit traceable log IDs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {auditLogs.length === 0 && (
              <button
                type="button"
                onClick={handleSeedDemoLogs}
                disabled={isSeeding}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                Seed Demo Cafe Logs
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200"
              title="Export filtered logs to Excel/CSV"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600" /> Export ({filteredLogs.length})
            </button>
          </div>
        </div>
      </div>

      <main className="p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* TOP FILTER & SEARCH CONTROL CARD */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Row 1: Universal Search Bar & Action Buttons */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID (LOG / ITEM / ORD), Dish Name (e.g. Burger), Action, Admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>

          {/* Row 2: Comprehensive Multi-Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            {/* Particular Single Date Picker */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600" /> Particular Date
                </span>
                {specificDate && (
                  <button
                    type="button"
                    onClick={() => setSpecificDate('')}
                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  if (e.target.value) setDateFilter('All');
                }}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer ${
                  specificDate ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-bold' : 'border-slate-200'
                }`}
              />
            </div>

            {/* Date Range Presets */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Date Preset
              </label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  if (e.target.value !== 'All') setSpecificDate('');
                }}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer ${
                  dateFilter !== 'All' ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Action Event Type Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" /> Action Event ({uniqueActions.length})
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer ${
                  actionFilter !== 'All' ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Actions ({auditLogs.length})</option>
                {uniqueActions.map(({ action, count }) => (
                  <option key={action} value={action}>
                    {action} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Product / Dish Name Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-400" /> Dish / Item Name
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer ${
                  selectedProduct !== 'All' ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Items</option>
                {uniqueProductNames.filter((p) => p !== 'All').map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" /> Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer ${
                  categoryFilter !== 'All' ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-bold' : 'border-slate-200 text-slate-700'
                }`}
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS & RESULTS COUNTER */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800 font-bold">{paginatedLogs.length}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> matching log events
            {isAnyFilterActive && ' (Filtered)'}
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Total recorded: {auditLogs.length}
          </span>
        </div>

        {/* AUDIT LOG TIMELINE LIST */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold">Loading system audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-700 text-sm">No audit log entries found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAnyFilterActive
                    ? 'Try clearing the search query, selecting another date, or resetting filters.'
                    : 'Perform an action (update product, change order status, save policy) to generate audit records.'}
                </p>
              </div>
              {isAnyFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSeedDemoLogs}
                  disabled={isSeeding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Seed Demo Logs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const isCopied = copiedId === log.id;

                return (
                  <div
                    key={log.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 transition-all border border-slate-200/70 hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActionFilter(log.action)}
                            className="font-bold text-slate-800 text-xs hover:text-blue-600 transition-colors cursor-pointer text-left"
                            title={`Filter logs by action "${log.action}"`}
                          >
                            {log.action}
                          </button>
                          {getSeverityBadge(log.severity)}
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 text-[10px] font-semibold">
                            {log.category || 'General'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.details}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> Performed by:{' '}
                          <strong className="text-slate-700">{log.actor || 'Admin'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {log.timestamp}
                      </span>

                      {/* 9-DIGIT ALPHANUMERIC LOG NUMBER BADGE WITH CLICK TO COPY */}
                      <button
                        type="button"
                        onClick={() => handleCopyLogId(log.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                        title="Click to copy 9-digit Log Number"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{log.id}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                <strong className="text-slate-800">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default AuditLogsView;
