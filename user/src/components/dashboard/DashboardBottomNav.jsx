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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-md z-40 pb-safe">
        <div className="flex items-center justify-around px-2 py-2.5">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-stone-950 font-black bg-amber-400 shadow-sm' 
                    : 'text-stone-600 hover:text-stone-900 font-bold'
                }`
              }
            >
              <item.icon className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-black">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 font-bold transition-all cursor-pointer"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div
            ref={drawerRef}
            className="relative bg-white border-t border-stone-200 rounded-t-3xl p-6 pb-12 shadow-2xl z-10"
          >
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-stone-900 tracking-tight">Dashboard Navigation</h3>
              <button 
                onClick={closeDrawer} 
                className="p-2 bg-stone-100 text-stone-500 hover:text-stone-900 rounded-full transition-colors cursor-pointer"
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
                    `flex items-center gap-4 p-3.5 rounded-2xl font-bold text-xs transition-all ${
                      isActive 
                        ? 'bg-amber-400 text-stone-950 font-black shadow-sm' 
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="h-px bg-stone-200 my-3" />
              <button
                onClick={() => {
                  closeDrawer();
                  logout();
                }}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl font-bold text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors text-left border border-rose-200 cursor-pointer"
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
