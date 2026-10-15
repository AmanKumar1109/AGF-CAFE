import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { CartDrawer } from '../../features/cart';
import { Toast } from '../common/Toast';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen w-full bg-[#0c0e12] flex flex-col font-sans text-stone-100 antialiased selection:bg-amber-500 selection:text-stone-950 print:bg-white print:text-black">
      {/* Top Navbar */}
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Main Dashboard Layout */}
      <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:py-32 flex items-start gap-8 print:p-0 print:m-0 print:max-w-none print:block">
        {/* Desktop Sticky Sidebar */}
        <div className="print:hidden hidden lg:block">
          <DashboardSidebar />
        </div>

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 w-full min-w-0 print:w-full print:m-0 print:p-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <div className="print:hidden">
        <DashboardBottomNav />
      </div>

      {/* Slide-over Cart Drawer */}
      <div className="print:hidden">
        <CartDrawer />
      </div>

      {/* Global Notifications Toast */}
      <div className="print:hidden">
        <Toast />
      </div>

      {/* Footer */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
