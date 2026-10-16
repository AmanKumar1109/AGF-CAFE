import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  FileText,
  Store,
  Settings,
  PanelLeftClose,
  Star,
  MessageSquareWarning,
  Ticket,
} from 'lucide-react';
import { MAIN_NAV_ITEMS, CONTENT_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../constants/navigation';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export const Sidebar = ({ isCollapsed, onToggleCollapse, activeTab, onSelectTab }) => {
  const { activeOrders } = useAdminOrders();
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [activeCouponsCount, setActiveCouponsCount] = useState(0);

  useEffect(() => {
    try {
      const qRev = query(collection(db, 'customer_reviews'), where('status', '==', 'pending'));
      const unsubRev = onSnapshot(qRev, (snap) => {
        setPendingReviewsCount(snap.size);
      }, (err) => console.warn('Sidebar reviews count error:', err));

      const qComp = query(collection(db, 'complaints'), where('status', '==', 'pending'));
      const unsubComp = onSnapshot(qComp, (snap) => {
        setPendingComplaintsCount(snap.size);
      }, (err) => console.warn('Sidebar complaints count error:', err));

      const qCoup = query(collection(db, 'coupons'), where('isActive', '==', true));
      const unsubCoup = onSnapshot(qCoup, (snap) => {
        setActiveCouponsCount(snap.size);
      }, (err) => console.warn('Sidebar coupons count error:', err));

      return () => {
        unsubRev();
        unsubComp();
        unsubCoup();
      };
    } catch (e) {
      console.warn('Sidebar listener setup error:', e);
    }
  }, []);

  // Icon mapper
  const getIcon = (name, className = 'w-[18px] h-[18px]') => {
    switch (name) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={className} />;
      case 'ClipboardList':
        return <ClipboardList className={className} />;
      case 'Package':
        return <Package className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Ticket':
        return <Ticket className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'MessageSquareWarning':
        return <MessageSquareWarning className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Store':
        return <Store className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      default:
        return <LayoutDashboard className={className} />;
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-100 flex flex-col justify-between z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-[260px]'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            {/* Shopeers Blue Hex Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/25">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" preserveAspectRatio="xMidYMid meet">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3.2l6 3.3-6 3.3-6-3.3 6-3.3zm-7 5.2l6 3.3v5.6l-6-3.3v-5.6zm14 0v5.6l-6 3.3v-5.6l6-3.3z" opacity="0.9" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                AGF CAFE
              </span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
              title="Toggle sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/70 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md" />
                )}

                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {getIcon(item.icon)}
                  </span>
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && (item.id === 'orders' ? (
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    (activeOrders?.length || 0) > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {activeOrders?.length || 0}
                  </span>
                ) : item.id === 'reviews' ? (
                  pendingReviewsCount > 0 ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {pendingReviewsCount}
                    </span>
                  ) : null
                ) : item.id === 'complaints' ? (
                  pendingComplaintsCount > 0 ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                      {pendingComplaintsCount}
                    </span>
                  ) : null
                ) : item.id === 'coupons' ? (
                  activeCouponsCount > 0 ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {activeCouponsCount}
                    </span>
                  ) : null
                ) : item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60">
                    {item.badge}
                  </span>
                ))}
              </button>
            );
          })}

          {/* CONTENT MANAGEMENT SECTION */}
          <div className="pt-4 pb-1">
            {!isCollapsed ? (
              <div className="px-3 pb-2">
                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  CONTENT MANAGEMENT
                </p>
              </div>
            ) : (
              <div className="my-2 border-t border-slate-100" />
            )}

            <div className="space-y-0.5">
              {CONTENT_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group relative cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-md" />
                    )}

                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        <FileText className="w-[17px] h-[17px]" />
                      </span>
                      {!isCollapsed && (
                        <span className="truncate text-left">{item.label}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-5 space-y-2">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="text-slate-400">{getIcon(item.icon)}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};
