import React, { useState, useRef } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardHeader } from './components/dashboard/DashboardHeader';
import { MetricCards } from './components/dashboard/MetricCards';
import { ProfitAnalytics } from './components/dashboard/ProfitAnalytics';
import { MostDayActive } from './components/dashboard/MostDayActive';
import { RepeatCustomerRate } from './components/dashboard/RepeatCustomerRate';
import { BestSellingProducts } from './components/dashboard/BestSellingProducts';
import { AIAssistantWidget } from './components/dashboard/AIAssistantWidget';
import { ExportModal } from './components/modals/ExportModal';
import { AddWidgetModal } from './components/modals/AddWidgetModal';
import { DatePickerModal } from './components/modals/DatePickerModal';
import {
  KPI_METRICS,
  PROFIT_DATA,
  WEEKLY_ACTIVITY,
  REPEAT_CUSTOMER_DATA,
  BEST_SELLING_PRODUCTS,
} from './constants/dashboardData';
import { useStaggerEntrance } from './hooks/useGSAPAnimation';

import { ProductsManager } from './components/products/ProductsManager';
import { OrdersManager } from './components/orders/OrdersManager';
import { UsersView } from './components/users/UsersView';
import { ReviewsView } from './components/reviews/ReviewsView';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { ContentManagementView } from './components/content/ContentManagementView';
import { AdminOrdersProvider } from './context/AdminOrdersContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);

  // Widget visibility toggles
  const [widgetVisibility, setWidgetVisibility] = useState({
    profit: true,
    activity: true,
    retention: true,
    products: true,
    assistant: true,
  });

  const dashboardContainerRef = useRef(null);

  // GSAP light entrance stagger animation on mount
  useStaggerEntrance(dashboardContainerRef, '.gsap-card', 0.15);

  const toggleWidget = (widgetId) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

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
        ) : activeTab === 'customers' ? (
          <UsersView />
        ) : activeTab === 'reviews' ? (
          <ReviewsView />
        ) : activeTab === 'complaints' ? (
          <ComplaintsView />
        ) : isContentTab ? (
          <ContentManagementView
            initialPageId={activeTab === 'content' ? 'privacy-policy' : activeTab}
            onSelectPage={setActiveTab}
          />
        ) : (
          <div ref={dashboardContainerRef} className="space-y-5">
            {/* Dashboard Title & Top Action Controls */}
            <DashboardHeader
              onExport={() => setIsExportModalOpen(true)}
              onAddWidget={() => setIsAddWidgetModalOpen(true)}
              onOpenDatePicker={() => setIsDatePickerModalOpen(true)}
            />

          {/* 4 Top KPI Metrics */}
          <MetricCards metrics={KPI_METRICS} />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Profit Curve Chart + Best Selling Products */}
            <div className="lg:col-span-8 space-y-5">
              {widgetVisibility.profit && <ProfitAnalytics data={PROFIT_DATA} />}
              {widgetVisibility.products && (
                <BestSellingProducts products={BEST_SELLING_PRODUCTS} />
              )}
            </div>

            {/* Right Column: Most Day Active + Repeat Customer Rate + AI Assistant */}
            <div className="lg:col-span-4 space-y-5">
              {widgetVisibility.activity && (
                <MostDayActive activityData={WEEKLY_ACTIVITY} />
              )}
              {widgetVisibility.retention && (
                <RepeatCustomerRate data={REPEAT_CUSTOMER_DATA} />
              )}
              {widgetVisibility.assistant && <AIAssistantWidget />}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        widgetVisibility={widgetVisibility}
        onToggleWidget={toggleWidget}
      />
      <DatePickerModal
        isOpen={isDatePickerModalOpen}
        onClose={() => setIsDatePickerModalOpen(false)}
      />
    </MainLayout>
    </AdminOrdersProvider>
  );
}
