import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Trash2,
  Phone,
  Truck,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ShieldAlert,
  Mail,
  Lock,
  FileText,
  User,
  Shield,
  Bike,
  Sparkles,
  ExternalLink,
  ChevronRight,
  MapPin,
  RefreshCw,
  Radio
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { logAuditEvent } from '../audit/AuditLogsView';
import { AddStaffModal } from './AddStaffModal';
import gsap from 'gsap';

const FleetRadarModal = React.lazy(() => import('./FleetRadarModal'));

export const StaffView = ({ onOpenRiderPortal }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFleetRadarOpen, setIsFleetRadarOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [removingStaff, setRemovingStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const containerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Real-time listener for delivery staff
  useEffect(() => {
    const q = query(collection(db, 'staff'), where('role', '==', 'delivery'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // If empty, let's also fetch general staff in case role wasn't strictly indexed
        if (loaded.length === 0) {
          const generalQ = collection(db, 'staff');
          onSnapshot(generalQ, (genSnap) => {
            const genLoaded = genSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setStaff(genLoaded);
            setLoading(false);
          });
        } else {
          setStaff(loaded);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error loading staff:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Filter staff
  const filteredStaff = staff.filter((person) => {
    const matchesStatus = statusFilter === 'All' || person.status === statusFilter;
    const qLower = searchQuery.toLowerCase();
    const matchesSearch =
      (person.name || '').toLowerCase().includes(qLower) ||
      (person.email || '').toLowerCase().includes(qLower) ||
      (person.vehicle || '').toLowerCase().includes(qLower) ||
      (person.phone || '').includes(searchQuery) ||
      (person.id || '').toLowerCase().includes(qLower);
    return matchesStatus && matchesSearch;
  });

  // Entrance animation
  useEffect(() => {
    if (containerRef.current && filteredStaff.length > 0) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [statusFilter, searchQuery, filteredStaff.length]);

  // Toggle duty status
  const handleToggleStatus = async (staffId, newStatus) => {
    try {
      const staffRef = doc(db, 'staff', staffId);
      await updateDoc(staffRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      const target = staff.find((s) => s.id === staffId);
      await logAuditEvent({
        action: 'STAFF_STATUS_CHANGE',
        details: `Changed rider ${target?.name || staffId} status to "${newStatus}"`,
        category: 'Staff',
        severity: 'info',
        actor: 'Admin',
      });

      showToast(`Rider status set to ${newStatus}`);
    } catch (err) {
      console.error('Error updating staff status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Remove staff
  const handleConfirmRemove = async () => {
    if (!removingStaff) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'staff', removingStaff.id));
      await logAuditEvent({
        action: 'STAFF_REMOVED',
        details: `Deleted delivery rider "${removingStaff.name}" (${removingStaff.id}) from Firestore`,
        category: 'Staff',
        severity: 'danger',
        actor: 'Admin',
      });
      showToast(`Removed "${removingStaff.name}" from delivery fleet`);
      setRemovingStaff(null);
    } catch (err) {
      console.error('Error removing staff:', err);
      showToast('Failed to remove rider', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Fleet Stats
  const totalCount = staff.length;
  const availableCount = staff.filter((s) => s.status === 'Available').length;
  const onDutyCount = staff.filter((s) => s.status === 'On Duty').length;
  const offlineCount = staff.filter((s) => s.status === 'Offline').length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-black transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/40 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold mb-3">
            <Bike className="w-3.5 h-3.5" /> Fleet & Delivery Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
            Delivery Personnel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Manage your cafe delivery riders, register new accounts with login credentials, view real-time fleet availability, and monitor active orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsFleetRadarOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse text-stone-950" />
            Live Fleet Radar ("God View")
          </button>

          {onOpenRiderPortal && (
            <button
              type="button"
              onClick={onOpenRiderPortal}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Rider Portal (Delivery Boy View)
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Delivery Person
          </button>
        </div>
      </div>

      {/* Fleet KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Fleet</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-800">{totalCount}</h3>
            <span className="text-xs font-bold text-slate-400">Riders</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs bg-emerald-50/20">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Available
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-emerald-700">{availableCount}</h3>
            <span className="text-xs font-bold text-emerald-600">Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs bg-amber-50/20">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> On Duty
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-amber-700">{onDutyCount}</h3>
            <span className="text-xs font-bold text-amber-600">Delivering</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Offline
          </p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-500">{offlineCount}</h3>
            <span className="text-xs font-bold text-slate-400">Resting</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rider name, phone, vehicle, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Available', 'On Duty', 'Offline'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Staff Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading delivery fleet...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No Delivery Partners Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'Try clearing your search query or selecting a different status filter.'
                : 'You have not registered any delivery partners yet. Click "Add Delivery Person" to create your first rider account.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Delivery Person
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((person) => {
            const isAvail = person.status === 'Available';
            const isOnDuty = person.status === 'On Duty';

            return (
              <div
                key={person.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Status Pulse */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-black text-lg flex items-center justify-center shadow-md">
                          {person.name ? person.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            isAvail
                              ? 'bg-emerald-500'
                              : isOnDuty
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {person.id}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {person.role || 'delivery'}
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base truncate mt-1">
                          {person.name}
                        </h3>
                      </div>
                    </div>

                    {/* Rating Pill */}
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-black">{person.rating ? person.rating.toFixed(1) : '5.0'}</span>
                    </div>
                  </div>

                  {/* Vehicle & Contacts Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{person.vehicle || 'Standard Delivery Partner'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{person.email || 'No email registered'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <a
                        href={`tel:${person.phone}`}
                        className="flex items-center gap-2 text-slate-600 hover:text-amber-600 font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{person.phone}</span>
                      </a>
                      <span className="text-[10px] text-slate-400">Click to call</span>
                    </div>

                    {person.aadhaarNumber && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Aadhaar: <strong className="text-slate-700 font-mono">{person.aadhaarNumber}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Deliveries & Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Active Orders</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        {person.activeOrders || 0}
                      </p>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Deliveries Done</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">
                        {person.totalDeliveries || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duty Status Selector & Card Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Duty Status</span>
                    <select
                      value={person.status || 'Available'}
                      onChange={(e) => handleToggleStatus(person.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-black border transition-all cursor-pointer focus:outline-none ${
                        isAvail
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isOnDuty
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="On Duty">🟡 On Duty</option>
                      <option value="Offline">⚪ Offline</option>
                    </select>
                  </div>

                  {/* Actions: View Profile & Remove */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingStaff(person)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemovingStaff(person)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="Remove Delivery Partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD STAFF MODAL */}
      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStaffAdded={(newStaff) => {
          showToast(`Registered "${newStaff.name}" into delivery fleet`);
        }}
      />

      {/* VIEW RIDER PROFILE MODAL */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Delivery Partner Profile</h3>
              <button
                onClick={() => setViewingStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-2xl shadow-md">
                {viewingStaff.name ? viewingStaff.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {viewingStaff.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                    {viewingStaff.role || 'delivery'}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">{viewingStaff.name}</h2>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-1 ${
                    viewingStaff.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : viewingStaff.status === 'On Duty'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {viewingStaff.status || 'Available'}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Email Authentication</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{viewingStaff.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Phone Number</p>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingStaff.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Vehicle Info</p>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingStaff.vehicle || 'Bike'}</p>
                </div>
              </div>

              {viewingStaff.aadhaarNumber && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Aadhaar / ID Card</p>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{viewingStaff.aadhaarNumber}</p>
                </div>
              )}

              {viewingStaff.address && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Home Address / Locality</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Lifetime Deliveries</p>
                  <p className="font-black text-emerald-700 mt-0.5">{viewingStaff.totalDeliveries || 0} orders</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Joined Fleet</p>
                  <p className="font-bold text-slate-900 mt-0.5">{viewingStaff.joinedDate || 'Recent'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingStaff(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRMATION MODAL */}
      {removingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Remove Delivery Partner?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{removingStaff.name}"</strong> ({removingStaff.id}) from the cafe delivery fleet?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setRemovingStaff(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmRemove}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {deleting ? 'Removing...' : 'Yes, Remove Partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Radar Modal */}
      {isFleetRadarOpen && (
        <React.Suspense fallback={null}>
          <FleetRadarModal
            isOpen={isFleetRadarOpen}
            onClose={() => setIsFleetRadarOpen(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
};
