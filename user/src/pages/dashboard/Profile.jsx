import React, { useRef, useState, useEffect } from 'react';
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Check, 
  MapPin, 
  AlertCircle, 
  Loader2,
  Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../../context/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

export const Profile = () => {
  const containerRef = useRef(null);
  const { currentUser, userProfile, completeProfile, updateProfilePhoto } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (userProfile || currentUser) {
      setFullName(userProfile?.fullName || userProfile?.name || currentUser?.displayName || '');
      setPhone(userProfile?.phone || '');
    }
  }, [userProfile, currentUser]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.form-group', {
        y: 20,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      setSaving(true);
      await completeProfile({
        name: fullName.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const userInitial = (fullName?.[0] || currentUser?.email?.[0] || 'C').toUpperCase();
  const displayPhoto = userProfile?.photoURL || currentUser?.photoURL;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}-${Date.now()}.${fileExt}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const success = await updateProfilePhoto(downloadURL);
      if (success) {
        setMessage('Profile photo updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Failed to update profile photo.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload photo. Please check storage configuration.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
          My Profile
        </h1>
        <p className="text-stone-600 font-medium text-xs sm:text-sm mt-1">
          Manage personal credentials, phone number, and account membership
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Profile Avatar & Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-400 border-4 border-stone-100 shadow-sm flex items-center justify-center overflow-hidden">
              {displayPhoto ? (
                <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-stone-950 font-serif">{userInitial}</span>
              )}
            </div>
            
            <input 
              type="file" 
              id="profile-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
            />
            
            <label 
              htmlFor="profile-upload" 
              className={`absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform cursor-pointer ${
                uploadingPhoto ? 'bg-stone-200' : 'bg-amber-400 hover:bg-amber-500 text-stone-950'
              }`}
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-stone-950" /> : <Camera className="w-4 h-4 stroke-[2.5]" />}
            </label>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">{fullName || 'Cafe Member'}</h2>
            <p className="text-xs font-mono font-bold text-stone-500 mt-0.5">{currentUser?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-900 font-black mt-2 text-xs bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mx-auto sm:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 
              <span>Gold Member • Verified Account</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-black text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form className="space-y-6 relative z-10" onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group space-y-1.5">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your Name"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm" 
                />
              </div>
            </div>

            <div className="form-group space-y-1.5">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider pl-1">Mobile Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input 
                  type="tel" 
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all font-bold text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm" 
                />
              </div>
            </div>

            <div className="form-group space-y-1.5 md:col-span-2">
              <label className="text-xs font-black text-stone-700 uppercase tracking-wider pl-1">Email Address (Registered)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input 
                  type="email" 
                  value={currentUser?.email || ''} 
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-stone-100 border border-stone-200 text-stone-500 font-mono font-bold cursor-not-allowed text-xs sm:text-sm" 
                />
              </div>
            </div>
          </div>

          {/* Manage Addresses Shortcut */}
          <div className="pt-6 border-t border-stone-100">
            <h3 className="text-sm font-black text-stone-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>Delivery Addresses</span>
            </h3>
            
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-stone-900 text-xs">Saved delivery locations</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Quickly add or edit home and office addresses.</p>
              </div>
              <Link 
                to="/dashboard/addresses" 
                className="px-5 py-2.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-900 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                Manage Addresses
              </Link>
            </div>
          </div>

          <div className="form-group pt-4 flex items-center justify-end">
            <button 
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
