import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
            setUserProfile(data);

            // If phone or address is not set yet, prompt user to complete profile
            if (!data.phone || !data.address) {
              setIsProfileModalOpen(true);
            }
          } else {
            // New user registered: create initial profile doc and prompt for details
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
              createdAt: serverTimestamp(),
            };

            await setDoc(userDocRef, initialData);
            setUserProfile(initialData);
            setIsProfileModalOpen(true);
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

  // Email & Password Signup
  const signupWithEmail = async (email, password, displayName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
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
    const updatedAddresses = currentAddresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...updatedData, updatedAt: new Date().toISOString() } : addr
    );

    const updates = {
      addresses: updatedAddresses,
      updatedAt: serverTimestamp(),
    };

    if (userProfile?.primaryAddressId === addressId) {
      if (updatedData.street) updates.address = [updatedData.houseNo, updatedData.street, updatedData.locality].filter(Boolean).join(', ');
      if (updatedData.city) updates.city = updatedData.city;
      if (updatedData.pincode) updates.pincode = updatedData.pincode;
      if (updatedData.phone) updates.phone = updatedData.phone;
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
