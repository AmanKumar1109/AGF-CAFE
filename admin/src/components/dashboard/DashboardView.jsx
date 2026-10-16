import React, { useState, useRef } from 'react';
import { useRealDashboardData } from '../../hooks/useRealDashboardData';
import { DashboardHeader } from './DashboardHeader';
import { MetricCards } from './MetricCards';
import { ProfitAnalytics } from './ProfitAnalytics';
import { BestSellingProducts } from './BestSellingProducts';
import { MostDayActive } from './MostDayActive';
import { RepeatCustomerRate } from './RepeatCustomerRate';
import { AIAssistantWidget } from './AIAssistantWidget';
import { RecentOrdersSnapshot } from './RecentOrdersSnapshot';
import { ExportModal } from '../modals/ExportModal';
import { AddWidgetModal } from '../modals/AddWidgetModal';
import { useStaggerEntrance } from '../../hooks/useGSAPAnimation';
import { Radio, Navigation } from 'lucide-react';

export const DashboardView = ({ onNavigateTab }) => {
  const [timeframe, setTimeframe] = useState('30days');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState(false);

  // Widget visibility toggles
  const [widgetVisibility, setWidgetVisibility] = useState({
    profit: true,
    activity: true,
    retention: true,
    products: true,
    assistant: true,
    recentOrders: true,
  });

  const dashboardContainerRef = useRef(null);

  // GSAP light entrance stagger animation on mount
  useStaggerEntrance(dashboardContainerRef, '.gsap-card', 0.12);

  // Fetch 100% Real-Time Firestore Data
  const {
    todayRevenue,
    todayGrowthPercent,
    todayOrdersCount,
    activeOrdersCount,
    deliveredTodayCount,
    thisMonthRevenue,
    monthGrowthPercent,
    lifetimeRevenue,
    totalCustomers,
    repeatRate,
    aov,
    dailyPoints,
    codRevenue,
    onlineRevenue,
    bestSellingProducts,
    weeklyActivity,
    recentOrders,
    availableFleetCount,
    loading,
    exportOrdersCSV,
  } = useRealDashboardData(timeframe);

  const toggleWidget = (widgetId) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const topDish = bestSellingProducts.length > 0 ? bestSellingProducts[0].name : 'Margherita Pizza';

  return (
    <div ref={dashboardContainerRef} className="space-y-5 animate-in fade-in pb-12">
      {/* Dashboard Top Title & Controls */}
      <DashboardHeader
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onAddWidget={() => setIsAddWidgetModalOpen(true)}
        onExport={() => setIsExportModalOpen(true)}
      />

      {/* 4 Core Financial & Operational KPI Cards */}
      <MetricCards
        todayRevenue={todayRevenue}
        todayGrowthPercent={todayGrowthPercent}
        todayOrdersCount={todayOrdersCount}
        activeOrdersCount={activeOrdersCount}
        deliveredTodayCount={deliveredTodayCount}
        thisMonthRevenue={thisMonthRevenue}
        monthGrowthPercent={monthGrowthPercent}
        totalCustomers={totalCustomers}
        repeatRate={repeatRate}
        onNavigateTab={onNavigateTab}
      />

      {/* Live Fleet Radar & Delivery Map Quick Access Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white rounded-3xl p-5 sm:p-6 border border-stone-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-white">
                Live Delivery Fleet Radar ("God View")
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                10 KM Hub Active
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Real-time GPS tracking & road routing for {availableFleetCount} ready riders and {activeOrdersCount} active kitchen deliveries across Baharagora.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('fleet-radar')}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-stone-950" />
            <span>Open Live Map Radar</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Revenue Curve + Best Selling Dishes + Live Orders Pipeline */}
        <div className="lg:col-span-8 space-y-5">
          {widgetVisibility.profit && (
            <ProfitAnalytics
              dailyPoints={dailyPoints}
              totalPeriodRevenue={thisMonthRevenue || lifetimeRevenue}
              codRevenue={codRevenue}
              onlineRevenue={onlineRevenue}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          )}

          {widgetVisibility.products && (
            <BestSellingProducts
              products={bestSellingProducts}
              onNavigateTab={onNavigateTab}
            />
          )}

          {widgetVisibility.recentOrders !== false && (
            <RecentOrdersSnapshot
              orders={recentOrders}
              onNavigateTab={onNavigateTab}
            />
          )}
        </div>

        {/* Right Column (4 cols): Peak Days + Customer Retention + AI Assistant */}
        <div className="lg:col-span-4 space-y-5">
          {widgetVisibility.activity && (
            <MostDayActive activityData={weeklyActivity} />
          )}

          {widgetVisibility.retention && (
            <RepeatCustomerRate
              repeatRate={repeatRate}
              aov={aov}
              totalCustomers={totalCustomers}
            />
          )}

          {widgetVisibility.assistant && (
            <AIAssistantWidget
              todayRevenue={todayRevenue}
              activeOrdersCount={activeOrdersCount}
              topDishName={topDish}
              availableFleetCount={availableFleetCount}
              aov={aov}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportCSV={exportOrdersCSV}
      />

      <AddWidgetModal
        isOpen={isAddWidgetModalOpen}
        onClose={() => setIsAddWidgetModalOpen(false)}
        widgetVisibility={widgetVisibility}
        onToggleWidget={toggleWidget}
      />
    </div>
  );
};
