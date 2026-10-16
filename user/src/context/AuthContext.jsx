import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { sendWelcomeEmail } from '../utils/emailTemplates';

const AuthContext = createContext(null);

// Generate unique, readable customer referral code (e.g. AMAN582CAFE)
const generateReferralCode = (name, uid) => {
  const cleanName = (name || 'AGF').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'AGF';
  const randomDigits = Math.floor(100 + Math.random() * 900);
  const uidSuffix = (uid || '').substring(0, 3).toUpperCase();
  return `${cleanName.slice(0, 5)}${randomDigits}${uidSuffix}`;
};

// Process referral registration linking in Firestore
const processReferralLink = async (newUserId, newUserName, newUserEmail, explicitCode = null) => {
  try {
    const code = (explicitCode || localStorage.getItem('pendingReferralCode') || '').trim().toUpperCase();
    if (!code) return;

    // Look for referrer by myReferralCode
    const q = query(collection(db, 'users'), where('myReferralCode', '==', code));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const referrerDoc = snap.docs[0];
      const referrerData = referrerDoc.data();
      const referrerId = referrerDoc.id;

      if (referrerId === newUserId) return; // Cannot refer self

      const qExisting = query(
        collection(db, 'referrals'),
        where('referrerId', '==', referrerId),
        where('referredUserId', '==', newUserId)
      );
      const snapExisting = await getDocs(qExisting);

      if (snapExisting.empty) {
        await addDoc(collection(db, 'referrals'), {
          referrerId,
          referrerName: referrerData.name || referrerData.fullName || 'Cafe Member',
          referrerCode: code,
          referredUserId: newUserId,
          referredUserName: newUserName || 'Valued Friend',
          referredUserEmail: newUserEmail || '',
          status: 'REGISTERED',
          orderId: null,
          orderAmount: 0,
          registeredAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        const userDocRef = doc(db, 'users', newUserId);
        await updateDoc(userDocRef, {
          referredBy: referrerId,
          referredByCode: code,
        });
      }
    }
  } catch (err) {
    console.warn('Error processing referral link:', err);
  } finally {
    try {
      localStorage.removeItem('pendingReferralCode');
    } catch {
      // ignore
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Capture URL referral param on mount (?ref=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        localStorage.setItem('pendingReferralCode', refParam.trim().toUpperCase());
      }
    } catch (e) {
      console.warn('Could not read referral query parameter:', e);
    }
  }, []);

  // Load and subscribe to user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            // Migration: Generate referral code if missing for existing account
            if (!data.myReferralCode) {
              const myReferralCode = generateReferralCode(data.name || user.displayName, user.uid);
              data.myReferralCode = myReferralCode;
              await updateDoc(userDocRef, { myReferralCode });
            }

            setUserProfile(data);

            // If phone or address is not set yet, prompt user to complete profile
            if (!data.phone || !data.address) {
              setIsProfileModalOpen(true);
            }
          } else {
            // New user registered: generate unique referral code and link referrer
            const pendingCode = localStorage.getItem('pendingReferralCode') || null;
            const myReferralCode = generateReferralCode(user.displayName, user.uid);

            const initialData = {
              uid: user.uid,
              name: user.displayName || '',
              email: user.email || '',
              photoURL: user.photoURL || '',
              phone: '',
              address: '',
              city: '',
              pincode: '',
              landmark: '',
              myReferralCode,
              referredByCode: pendingCode,
              usedCoupons: [],
              createdAt: serverTimestamp(),
            };

            await setDoc(userDocRef, initialData);
            setUserProfile(initialData);
            setIsProfileModalOpen(true);

            // Link referral in background
            if (pendingCode) {
              await processReferralLink(user.uid, user.displayName, user.email, pendingCode);
            }

            // Send Welcome Email
            if (user.email) {
              sendWelcomeEmail(user.email, user.displayName).catch(console.warn);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile from Firestore:', error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email & Password Login
  const loginWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Email & Password Signup (supports optional referral code)
  const signupWithEmail = async (email, password, displayName, referralCode = null) => {
    if (referralCode) {
      try {
        localStorage.setItem('pendingReferralCode', referralCode.trim().toUpperCase());
      } catch {
        // ignore
      }
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    return res;
  };

  // Google Sign In
  const loginWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  // Save / Update delivery address & profile
  const saveUserProfile = async (details) => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updatedData = {
      ...details,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userDocRef, updatedData);
    setUserProfile((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  const completeProfile = async (details) => {
    return saveUserProfile(details);
  };

  const updateProfilePhoto = async (photoURL) => {
    if (!currentUser) return false;
    try {
      await updateProfile(currentUser, { photoURL });
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { photoURL, updatedAt: serverTimestamp() });
      setUserProfile((prev) => ({ ...prev, photoURL }));
      setCurrentUser((prev) => ({ ...prev, photoURL }));
      return true;
    } catch (err) {
      console.error('Error updating profile photo:', err);
      return false;
    }
  };

  const addAddress = async (newAddress) => {
    if (!currentUser) return null;
    const currentAddresses = Array.isArray(userProfile?.addresses) ? userProfile.addresses : [];
    const addressId = 'addr_' + Date.now();
    const parsedLat = newAddress.lat !== null && newAddress.lat !== undefined && !isNaN(parseFloat(newAddress.lat))
      ? parseFloat(newAddress.lat)
      : null;
    const parsedLng = newAddress.lng !== null && newAddress.lng !== undefined && !isNaN(parseFloat(newAddress.lng))
      ? parseFloat(newAddress.lng)
      : null;

    const formattedAddress = {
      id: addressId,
      name: newAddress.name || userProfile?.name || currentUser?.displayName || '',
      phone: newAddress.phone || userProfile?.phone || '',
      houseNo: newAddress.houseNo || '',
      street: newAddress.street || '',
      locality: newAddress.locality || '',
      city: newAddress.city || 'Baharagora',
      state: newAddress.state || 'Jharkhand',
      pincode: newAddress.pincode || '832101',
      type: newAddress.type || 'Home',
      lat: parsedLat,
      lng: parsedLng,
      deliveryInstructions: newAddress.deliveryInstructions || '',
      createdAt: new Date().toISOString(),
    };

    const isPrimary = newAddress.isPrimary || currentAddresses.length === 0 || !userProfile?.primaryAddressId;
    const updatedAddresses = [...currentAddresses, formattedAddress];

    const updates = {
      addresses: updatedAddresses,
      address: [formattedAddress.houseNo, formattedAddress.street, formattedAddress.locality].filter(Boolean).join(', ') || formattedAddress.street,
      city: formattedAddress.city,
      pincode: formattedAddress.pincode,
      landmark: formattedAddress.locality,
      phone: formattedAddress.phone || userProfile?.phone || '',
      lat: parsedLat,
      lng: parsedLng,
      updatedAt: serverTimestamp(),
    };

    if (isPrimary) {
      updates.primaryAddressId = addressId;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, updates, { merge: true });

    setUserProfile((prev) => ({
      ...prev,
      ...updates,
      addresses: updatedAddresses,
      primaryAddressId: isPrimary ? addressId : (prev?.primaryAddressId || addressId),
    }));

    return addressId;
  };

  const updateAddress = async (addressId, updatedData) => {
    if (!currentUser) return;
    const currentAddresses = Array.isArray(userProfile?.addresses) ? userProfile.addresses : [];
    const updatedAddresses = currentAddresses.map((addr) => {
      if (addr.id === addressId) {
        const parsedLat = updatedData.lat !== undefined
          ? (updatedData.lat !== null && !isNaN(parseFloat(updatedData.lat)) ? parseFloat(updatedData.lat) : null)
          : addr.lat;
        const parsedLng = updatedData.lng !== undefined
          ? (updatedData.lng !== null && !isNaN(parseFloat(updatedData.lng)) ? parseFloat(updatedData.lng) : null)
          : addr.lng;
        return {
          ...addr,
          ...updatedData,
          lat: parsedLat,
          lng: parsedLng,
          updatedAt: new Date().toISOString()
        };
      }
      return addr;
    });

    const updates = {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp(),
    };

    if (userProfile?.primaryAddressId === addressId) {
      if (updatedData.street) updates.address = [updatedData.houseNo, updatedData.street, updatedData.locality].filter(Boolean).join(', ');
      if (updatedData.city) updates.city = updatedData.city;
      if (updatedData.pincode) updates.pincode = updatedData.pincode;
      if (updatedData.phone) updates.phone = updatedData.phone;
      if (updatedData.lat !== undefined) updates.lat = updatedData.lat ? parseFloat(updatedData.lat) : null;
      if (updatedData.lng !== undefined) updates.lng = updatedData.lng ? parseFloat(updatedData.lng) : null;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, updates, { merge: true });
    setUserProfile((prev) => ({
      ...prev,
      ...updates,
      addresses: updatedAddresses,
    }));
  };

  const deleteAddress = async (addressId) => {
    if (!currentUser) return;
    const currentAddresses = Array.isArray(userProfile?.addresses) ? userProfile.addresses : [];
    const updatedAddresses = currentAddresses.filter((a) => a.id !== addressId);
    
    const updates = {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp(),
    };

    if (userProfile?.primaryAddressId === addressId) {
      const nextPrimary = updatedAddresses[0] || null;
      updates.primaryAddressId = nextPrimary ? nextPrimary.id : null;
      if (nextPrimary) {
        updates.address = [nextPrimary.houseNo, nextPrimary.street, nextPrimary.locality].filter(Boolean).join(', ') || nextPrimary.street;
        updates.city = nextPrimary.city || '';
        updates.pincode = nextPrimary.pincode || '';
      }
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, updates, { merge: true });
    setUserProfile((prev) => ({
      ...prev,
      ...updates,
      addresses: updatedAddresses,
    }));
  };

  const setPrimaryAddress = async (addressId) => {
    if (!currentUser) return;
    const currentAddresses = Array.isArray(userProfile?.addresses) ? userProfile.addresses : [];
    const targetAddr = currentAddresses.find((a) => a.id === addressId);

    const updates = {
      primaryAddressId: addressId,
      updatedAt: serverTimestamp(),
      ...(targetAddr ? {
        address: [targetAddr.houseNo, targetAddr.street, targetAddr.locality].filter(Boolean).join(', ') || targetAddr.street,
        city: targetAddr.city || '',
        pincode: targetAddr.pincode || '',
        phone: targetAddr.phone || userProfile?.phone || '',
      } : {})
    };

    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, updates, { merge: true });
    setUserProfile((prev) => ({
      ...prev,
      ...updates,
      primaryAddressId: addressId,
    }));
  };

  const toggleWishlist = async (dish) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const currentWishlist = userProfile?.wishlist || [];
    const dishId = typeof dish === 'object' ? dish.id : dish;
    const exists = currentWishlist.some((item) => (typeof item === 'object' ? item.id === dishId : item === dishId));
    
    let updatedWishlist;
    if (exists) {
      updatedWishlist = currentWishlist.filter((item) => (typeof item === 'object' ? item.id !== dishId : item !== dishId));
    } else {
      const sanitizedDish = typeof dish === 'object' ? {
        id: dish.id || String(Date.now()),
        name: dish.name || 'Artisan Dish',
        price: Number(dish.price) || 0,
        image: dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        description: dish.description || '',
        category: dish.category || 'Special',
        isVeg: dish.isVeg !== undefined ? Boolean(dish.isVeg) : true,
        ...(dish.originalPrice ? { originalPrice: Number(dish.originalPrice) } : {}),
        ...(dish.rating ? { rating: Number(dish.rating) } : {}),
        ...(dish.calories ? { calories: String(dish.calories) } : {}),
        ...(dish.badge ? { badge: String(dish.badge) } : {}),
      } : dish;
      updatedWishlist = [...currentWishlist, sanitizedDish];
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { wishlist: updatedWishlist, updatedAt: serverTimestamp() });
    setUserProfile((prev) => ({
      ...prev,
      wishlist: updatedWishlist,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        saveUserProfile,
        completeProfile,
        updateProfilePhoto,
        addAddress,
        updateAddress,
        deleteAddress,
        setPrimaryAddress,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
