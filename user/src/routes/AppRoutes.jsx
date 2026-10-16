import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout';
import { HomePage } from '../pages/HomePage';
import { MenuPage } from '../pages/MenuPage';
import { AboutPage } from '../pages/AboutPage';
import { GalleryPage } from '../pages/GalleryPage';
import { ContactPage } from '../pages/ContactPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ComplaintPage } from '../pages/ComplaintPage';
import DynamicPage from '../pages/DynamicPage';

import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardHome } from '../pages/dashboard/DashboardHome';
import { MyOrders } from '../pages/dashboard/MyOrders';
import { TrackOrder } from '../pages/dashboard/TrackOrder';
import { InvoicePage } from '../pages/dashboard/InvoicePage';
import { SavedAddresses } from '../pages/dashboard/SavedAddresses';
import { Wishlist } from '../pages/dashboard/Wishlist';
import { ReferEarn } from '../pages/dashboard/ReferEarn';
import { MyComplaints } from '../pages/dashboard/MyComplaints';
import { Profile } from '../pages/dashboard/Profile';
import { HelpSupport } from '../pages/dashboard/HelpSupport';
import { useAuth } from '../context/useAuth';
import { User } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, setIsAuthModalOpen } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-700">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 font-serif mb-2">Member Sign In Required</h2>
        <p className="text-xs text-stone-600 max-w-sm mb-6 leading-relaxed">
          Please sign in to access your cafe orders, saved delivery addresses, reward vouchers, and customer lounge.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-sm transition-all cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }
  
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages inside RootLayout */}
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="about-us" element={<DynamicPage documentId="aboutUs" title="About Us" />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="complaint" element={<ComplaintPage />} />
        <Route path="privacy-policy" element={<DynamicPage documentId="privacyPolicy" title="Privacy Policy" />} />
        <Route path="terms-of-service" element={<DynamicPage documentId="termsOfService" title="Terms and Conditions" />} />
        <Route path="terms" element={<Navigate to="/terms-of-service" replace />} />
        <Route path="refund-policy" element={<DynamicPage documentId="refundPolicy" title="Refund Policy" />} />
        <Route path="cancellation-policy" element={<DynamicPage documentId="cancellationPolicy" title="Cancellation Policy" />} />
        <Route path="disclaimer" element={<DynamicPage documentId="disclaimer" title="Disclaimer" />} />
        <Route path="shipping-policy" element={<DynamicPage documentId="shippingPolicy" title="Shipping & Delivery" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Customer Dashboard Nested Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="track/:id" element={<TrackOrder />} />
        <Route path="track-order/:id" element={<TrackOrder />} />
        <Route path="track" element={<Navigate to="/dashboard/orders" replace />} />
        <Route path="invoice/:id" element={<InvoicePage />} />
        <Route path="addresses" element={<SavedAddresses />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="refer-earn" element={<ReferEarn />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help" element={<HelpSupport />} />
      </Route>
    </Routes>
  );
};
