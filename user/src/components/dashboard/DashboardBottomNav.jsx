import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Heart, 
  User, 
  MoreHorizontal, 
  MapPin, 
  LogOut, 
  X, 
  UtensilsCrossed, 
  HelpCircle, 
  MessageSquareWarning, 
  Gift 
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import gsap from 'gsap';

const mainNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed, exact: true },
  { path: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/dashboard/profile', label: 'Profile', icon: User },
];

const moreItems = [
  { path: '/dashboard/refer-earn', label: 'Refer & Earn', icon: Gift },
  { path: '/dashboard/complaints', label: 'My Complaints', icon: MessageSquareWarning },
  { path: '/dashboard/help', label: 'Help & Support', icon: HelpCircle },
  { path: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
  { path: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
];

export const DashboardBottomNav = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const bgRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo(bgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(drawerRef.current, { y: '100%' }, { y: '0%', duration: 0.35, ease: 'power3.out' });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const closeDrawer = () => {
    gsap.to(bgRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(drawerRef.current, { 
      y: '100%', 
      duration: 0.25, 
      ease: 'power3.in', 
      onComplete: () => setIsDrawerOpen(false) 
    });
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-stone-950/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.5)] z-40 pb-safe">
        <div className="flex items-center justify-around px-2 py-2.5">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-stone-950 font-black bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/25 scale-105' 
                    : 'text-stone-400 hover:text-white font-bold'
                }`
              }
            >
              <item.icon className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-black">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-stone-400 hover:text-white font-bold transition-all cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-black">More</span>
          </button>
        </div>
      </nav>

      {/* GSAP Animated Drawer */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end flex-col">
          <div
            ref={bgRef}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div
            ref={drawerRef}
            className="relative bg-stone-900 border-t border-white/10 rounded-t-3xl p-6 pb-12 shadow-2xl z-10"
          >
            <div className="w-12 h-1.5 bg-stone-700 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white tracking-tight">Dashboard Navigation</h3>
              <button 
                onClick={closeDrawer} 
                className="p-2 bg-stone-800 text-stone-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {moreItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-3.5 rounded-2xl font-black text-xs transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-md' 
                        : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800 hover:text-white border border-white/5'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="h-px bg-white/5 my-3" />
              <button
                onClick={() => {
                  closeDrawer();
                  logout();
                }}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl font-black text-xs bg-rose-950/30 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors text-left border border-rose-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardBottomNav;
