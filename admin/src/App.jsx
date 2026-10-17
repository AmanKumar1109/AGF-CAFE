import React, { useState, Suspense, lazy } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardView } from './components/dashboard/DashboardView';

import { ProductsManager } from './components/products/ProductsManager';
import { OrdersManager } from './components/orders/OrdersManager';
import { UsersView } from './components/users/UsersView';
import { ReviewsView } from './components/reviews/ReviewsView';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { ContentManagementView } from './components/content/ContentManagementView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { CouponsView } from './components/coupons/CouponsView';
import { ReferralsView } from './components/referrals/ReferralsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { StaffView } from './components/staff/StaffView';
import { RiderDashboard } from './components/staff/RiderDashboard';
import { SettingsView } from './components/settings/SettingsView';
import { OfflinePosView } from './components/pos/OfflinePosView';
import { AdminOrdersProvider } from './context/AdminOrdersContext';

const FleetRadarView = lazy(() => import('./components/fleet/FleetRadarView'));

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const isContentTab = [
    'privacy-policy',
    'terms-of-service',
    'refund-policy',
    'cancellation-policy',
    'disclaimer',
    'shipping-policy',
    'about-us',
    'content',
  ].includes(activeTab);

  return (
    <AdminOrdersProvider>
      <MainLayout activeTab={activeTab} onSelectTab={setActiveTab}>
        {activeTab === 'products' ? (
          <ProductsManager />
        ) : activeTab === 'orders' ? (
          <OrdersManager />
        ) : activeTab === 'offline-tables' ? (
          <OfflinePosView />
        ) : activeTab === 'fleet-radar' ? (
          <Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading Live Fleet Radar...</div>}>
            <FleetRadarView onSelectTab={setActiveTab} />
          </Suspense>
        ) : activeTab === 'coupons' ? (
          <CouponsView />
        ) : activeTab === 'referrals' ? (
          <ReferralsView />
        ) : activeTab === 'customers' ? (
          <UsersView />
        ) : activeTab === 'reviews' ? (
          <ReviewsView />
        ) : activeTab === 'complaints' ? (
          <ComplaintsView />
        ) : activeTab === 'audit-logs' ? (
          <AuditLogsView />
        ) : activeTab === 'settings' ? (
          <SettingsView />
        ) : activeTab === 'notifications' ? (
          <NotificationsView />
        ) : activeTab === 'staff' ? (
          <StaffView onOpenRiderPortal={() => setActiveTab('rider-portal')} />
        ) : activeTab === 'rider-portal' ? (
          <RiderDashboard onBackToAdmin={() => setActiveTab('staff')} />
        ) : isContentTab ? (
          <ContentManagementView
            initialPageId={activeTab === 'content' ? 'privacy-policy' : activeTab}
            onSelectPage={setActiveTab}
          />
        ) : (
          <DashboardView onNavigateTab={setActiveTab} />
        )}
      </MainLayout>
    </AdminOrdersProvider>
  );
}
