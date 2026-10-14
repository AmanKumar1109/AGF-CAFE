import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  FileText,
  Store,
  Banknote,
  BarChart2,
  Percent,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../constants/navigation';

export const Sidebar = ({ isCollapsed, onToggleCollapse, activeTab, onSelectTab }) => {
  const [financesExpanded, setFinancesExpanded] = useState(true);

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
      case 'FileText':
        return <FileText className={className} />;
      case 'Store':
        return <Store className={className} />;
      case 'Banknote':
        return <Banknote className={className} />;
      case 'BarChart2':
        return <BarChart2 className={className} />;
      case 'Percent':
        return <Percent className={className} />;
      case 'Settings':
        return <Settings className={className} />;
      case 'HelpCircle':
        return <HelpCircle className={className} />;
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
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50">
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

        {/* Main Navigation List */}
        <div className="px-3 py-4 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
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

                {!isCollapsed && item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Finances Section */}
          <div className="pt-2">
            <button
              onClick={() => setFinancesExpanded(!financesExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  <Banknote className="w-[18px] h-[18px]" />
                </span>
                {!isCollapsed && <span>Finances</span>}
              </div>
              {!isCollapsed && (
                <span className="text-slate-400">
                  {financesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              )}
            </button>

            {/* Submenu items */}
            {financesExpanded && !isCollapsed && (
              <div className="pl-9 pr-3 py-1 space-y-1 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                {['Invoices', 'Transactions', 'Reports'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onSelectTab(sub.toLowerCase())}
                    className="w-full text-left py-1.5 px-2 text-[13px] text-slate-500 hover:text-blue-600 hover:bg-slate-50/80 rounded-lg transition"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Other Secondary Items */}
            <button
              onClick={() => onSelectTab('analytics')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="text-slate-400">
                <BarChart2 className="w-[18px] h-[18px]" />
              </span>
              {!isCollapsed && <span>Analytics</span>}
            </button>

            <button
              onClick={() => onSelectTab('discounts')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="text-slate-400">
                <Percent className="w-[18px] h-[18px]" />
              </span>
              {!isCollapsed && <span>Discounts</span>}
            </button>
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

        {/* Upgrade to Premium Card */}
        {!isCollapsed && (
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#121b33] via-[#0f1d3e] to-[#1d3570] text-white shadow-lg shadow-blue-900/10 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-blue-300" />
            </div>

            <h4 className="text-[13.5px] font-semibold text-white tracking-tight">
              Upgrade to Premium!
            </h4>
            <p className="text-[11.5px] text-slate-300/80 mt-1 mb-3.5 leading-relaxed">
              Upgrade your account and unlock all of the benefits.
            </p>

            <button className="w-full py-2 px-3 bg-[#2563eb] hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/30 transition-all cursor-pointer">
              Upgrade premium
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
