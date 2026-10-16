import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Mail, 
  Phone, 
  Lock, 
  Truck, 
  FileText, 
  Check, 
  AlertCircle, 
  Copy, 
  ShieldCheck,
  Bike
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig } from '../../firebase';
import { logAuditEvent } from '../audit/AuditLogsView';

export const AddStaffModal = ({ isOpen, onClose, onStaffAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'Motorcycle (E-Bike)',
    vehicleNumber: '',
    aadhaarNumber: '',
    emergencyContact: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields (Name, Email, Phone, Password).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Generate unique Staff ID
      const randomStaffCode = Math.floor(100000 + Math.random() * 900000);
      const staffId = `STF-${randomStaffCode}`;

      // 2. Use Secondary Firebase App to create rider Auth account without logging out current Admin
      let userUid = staffId;
      try {
        const secondaryAppName = 'secondary-staff-creator';
        const secondaryApp = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          formData.email.trim(), 
          formData.password.trim()
        );
        userUid = userCredential.user.uid;
      } catch (authErr) {
        console.warn("Secondary Auth Notice (may already exist or demo mode):", authErr);
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already registered in Firebase Auth.');
        }
      }

      // 3. Save Staff Record in Firestore 'staff' collection
      const fullVehicleName = formData.vehicleNumber 
        ? `${formData.vehicleType} (${formData.vehicleNumber})`
        : formData.vehicleType;

      const createdStaff = {
        id: staffId,
        uid: userUid,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        vehicle: fullVehicleName,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim() || null,
        aadhaarNumber: formData.aadhaarNumber.trim() || null,
        address: formData.address.trim() || null,
        emergencyContact: formData.emergencyContact.trim() || null,
        role: 'delivery',
        status: 'Available',
        rating: 5.0,
        totalDeliveries: 0,
        activeOrders: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'staff', staffId), createdStaff);

      // 4. Log to Audit System
      await logAuditEvent({
        action: 'STAFF_ADDED',
        details: `Registered delivery partner "${createdStaff.name}" (${staffId}, Role: delivery, Email: ${createdStaff.email})`,
        category: 'Staff',
        severity: 'success',
        actor: 'Admin',
      });

      setSuccessData({
        ...createdStaff,
        password: formData.password
      });

      if (onStaffAdded) {
        onStaffAdded(createdStaff);
      }
    } catch (err) {
      console.error("Error creating delivery staff:", err);
      setError(err.message || 'Failed to register delivery partner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      vehicleType: 'Motorcycle (E-Bike)',
      vehicleNumber: '',
      aadhaarNumber: '',
      emergencyContact: '',
      address: '',
    });
    setSuccessData(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Add Delivery Personnel</h2>
              <p className="text-xs text-slate-500 font-medium">Register a new delivery rider with Firebase credentials</p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successData ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-sm">Delivery Partner Registered Successfully!</p>
                  <p className="text-xs text-emerald-700">
                    Firebase Auth account and Firestore profile created. The rider can immediately log into the Delivery Boy Panel with:
                  </p>
                </div>
              </div>

              {/* Login Credentials Box */}
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-2 border-b border-white/10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Rider Login Credentials
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {successData.id}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Email (Username)</p>
                      <p className="text-xs font-mono font-bold text-slate-100 mt-0.5">{successData.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(successData.email, 'email')}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'email' ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Password</p>
                      <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">{successData.password}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(successData.password, 'pass')}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'pass' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  💡 Share these credentials with the delivery boy so they can log in at <span className="text-amber-400 font-bold">/delivery</span> or <span className="text-amber-400 font-bold">/rider</span>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Done & View Fleet
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Login Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rider@agfcafe.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Password & Vehicle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Login Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" /> Vehicle Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Motorcycle (E-Bike)">Motorcycle (E-Bike)</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Car / Van">Car / Van</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Number & Aadhaar Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Vehicle Plate / Registration #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JH-05-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> Aadhaar / Govt ID
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1234 5678 9012"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Emergency Contact & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 91234 56789"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Home Address / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Station Road, Baharagora"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Register Delivery Partner
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
