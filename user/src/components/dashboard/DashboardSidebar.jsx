import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  User, 
  LogOut, 
  UtensilsCrossed, 
  HelpCircle, 
  MessageSquareWarning, 
  Gift, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/menu', label: 'Back to Menu', icon: UtensilsCrossed, exact: true },
  { path: '/dashboard/orders', label: 'My Orders', icon: ShoppingBag },
  { path: '/dashboard/refer-earn', label: 'Refer & Earn', icon: Gift },
  { path: '/dashboard/complaints', label: 'My Complaints', icon: MessageSquareWarning },
  { path: '/dashboard/help', label: 'Help & Support', icon: HelpCircle },
  { path: '/dashboard/wishlist', label: 'My Wishlist', icon: Heart },
  { path: '/dashboard/addresses', label: 'Saved Addresses', icon: MapPin },
  { path: '/dashboard/profile', label: 'Profile Settings', icon: User },
];

export const DashboardSidebar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const userName = userProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Cafe Guest';
  const displayPhoto = userProfile?.photoURL || currentUser?.photoURL;
  const userInitial = (userName?.[0] || currentUser?.email?.[0] || 'C').toUpperCase();

  return (
    <aside className="w-64 bg-white border border-stone-200 shadow-sm rounded-3xl p-5 sticky top-24 z-20 flex-shrink-0 flex flex-col">
      {/* Profile Summary Card */}
      <div className="flex items-center gap-3.5 mb-6 p-3 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 flex-shrink-0 flex items-center justify-center bg-amber-500 text-stone-950 font-black text-lg">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-stone-900 text-sm truncate tracking-tight">{userName}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full inline-flex mt-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Gold Member ☕</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-amber-400 text-stone-950 font-black shadow-sm translate-x-1'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-transparent'
              }`
            }
          >
            <item.icon className="w-4 h-4 stroke-[2.2]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="pt-4 mt-6 border-t border-stone-200">
        <button
          onClick={logout}
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 w-full text-left cursor-pointer border border-transparent hover:border-rose-200"
        >
          <LogOut className="w-4 h-4 stroke-[2.2]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
