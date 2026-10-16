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
  Gift,
  Mail,
  ShieldCheck,
  ChevronDown,
  Bike,
  Radio,
} from 'lucide-react';
import { 
  NAV_CATEGORIES, 
  CONTENT_NAV_ITEMS, 
  BOTTOM_NAV_ITEMS 
} from '../../constants/navigation';
import { useAdminOrders } from '../../context/AdminOrdersContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export const Sidebar = ({ isCollapsed, onToggleCollapse, activeTab, onSelectTab }) => {
  const { activeOrders } = useAdminOrders();
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [activeCouponsCount, setActiveCouponsCount] = useState(0);
  const [pendingReferralsCount, setPendingReferralsCount] = useState(0);
  const [availableStaffCount, setAvailableStaffCount] = useState(0);

  // Content Management dropdown open/close state
  const isCurrentTabContent = CONTENT_NAV_ITEMS.some((i) => i.id === activeTab) || activeTab === 'content';
  const [isContentOpen, setIsContentOpen] = useState(isCurrentTabContent);

  // Auto-expand content dropdown if a content tab is selected
  useEffect(() => {
    if (isCurrentTabContent) {
      setIsContentOpen(true);
    }
  }, [activeTab, isCurrentTabContent]);

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

      const qRef = query(collection(db, 'referrals'), where('status', '==', 'REGISTERED'));
      const unsubRef = onSnapshot(qRef, (snap) => {
        setPendingReferralsCount(snap.size);
      }, (err) => console.warn('Sidebar referrals count error:', err));

      const qStaff = query(collection(db, 'staff'), where('role', '==', 'delivery'));
      const unsubStaff = onSnapshot(qStaff, (snap) => {
        const avail = snap.docs.filter((d) => d.data().status === 'Available').length;
        setAvailableStaffCount(avail);
      }, (err) => console.warn('Sidebar staff count error:', err));

      return () => {
        unsubRev();
        unsubComp();
        unsubCoup();
        unsubRef();
        unsubStaff();
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
      case 'Bike':
        return <Bike className={className} />;
      case 'Radio':
        return <Radio className={`${className} animate-pulse text-amber-500`} />;
      case 'Users':
        return <Users className={className} />;
      case 'Ticket':
        return <Ticket className={className} />;
      case 'Gift':
        return <Gift className={className} />;
      case 'Mail':
        return <Mail className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'MessageSquareWarning':
        return <MessageSquareWarning className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Store':
        return <Store className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      default:
        return <LayoutDashboard className={className} />;
    }
  };

  // Helper for dynamic notification badges
  const renderItemBadge = (itemId) => {
    if (isCollapsed) return null;

    if (itemId === 'orders') {
      const count = activeOrders?.length || 0;
      return (
        <span
          className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
            count > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      );
    }

    if (itemId === 'fleet-radar') {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>RADAR</span>
        </span>
      );
    }

    if (itemId === 'staff' && availableStaffCount > 0) {
      return (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          {availableStaffCount}
        </span>
      );
    }

    if (itemId === 'reviews' && pendingReviewsCount > 0) {
      return (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          {pendingReviewsCount}
        </span>
      );
    }

    if (itemId === 'complaints' && pendingComplaintsCount > 0) {
      return (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
          {pendingComplaintsCount}
        </span>
      );
    }

    if (itemId === 'coupons' && activeCouponsCount > 0) {
      return (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          {activeCouponsCount}
        </span>
      );
    }

    if (itemId === 'referrals' && pendingReferralsCount > 0) {
      return (
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
          {pendingReferralsCount}
        </span>
      );
    }

    return null;
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
            {/* AGF Cafe Logo Badge */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/25">
              <span className="text-stone-950 font-black text-sm">☕</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-slate-900 tracking-tight font-serif">
                AGF CAFE
              </span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
              title="Toggle sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          
          {/* CATEGORIZED NAVIGATION GROUPS */}
          {NAV_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 pt-1 pb-1">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    {category.label}
                  </p>
                </div>
              ) : (
                <div className="my-1.5 border-t border-slate-100" />
              )}

              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group relative cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {/* Active Indicator Strip */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-md" />
                      )}

                      <div className="flex items-center gap-3">
                        <span className={`${isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          {getIcon(item.icon)}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {renderItemBadge(item.id)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CONTENT MANAGEMENT (COLLAPSIBLE ACCORDION DROPDOWN) */}
          <div className="pt-1">
            {!isCollapsed ? (
              <div className="px-3 pb-1">
                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  CMS & Legal
                </p>
              </div>
            ) : (
              <div className="my-1.5 border-t border-slate-100" />
            )}

            <div className="space-y-1">
              {/* Dropdown Header Trigger */}
              <button
                onClick={() => {
                  if (isCollapsed) {
                    onSelectTab('content');
                  } else {
                    setIsContentOpen(!isContentOpen);
                  }
                }}
                title={isCollapsed ? 'Content Pages' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group relative cursor-pointer ${
                  isCurrentTabContent
                    ? 'bg-amber-50/70 text-amber-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isCurrentTabContent && !isContentOpen && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-500 rounded-r-md" />
                )}

                <div className="flex items-center gap-3">
                  <span className={`${isCurrentTabContent ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    <FileText className="w-[18px] h-[18px]" />
                  </span>
                  {!isCollapsed && <span>Content & Policies</span>}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      7
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isContentOpen ? 'rotate-180 text-amber-600' : ''
                      }`}
                    />
                  </div>
                )}
              </button>

              {/* Collapsible Content Sub-Items */}
              {isContentOpen && !isCollapsed && (
                <div className="ml-5 pl-2.5 border-l-2 border-slate-100 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                  {CONTENT_NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                          isActive
                            ? 'text-amber-700 font-bold bg-amber-50/80'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isActive ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-slate-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Section (Audit Logs Sab Se Niche + Settings) */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-1 shrink-0">
        {!isCollapsed && (
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-3 pb-0.5">
            System
          </p>
        )}

        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-stone-950 rounded-r-md" />
              )}
              <span className={isActive ? 'text-stone-950' : 'text-slate-400'}>
                {getIcon(item.icon)}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
