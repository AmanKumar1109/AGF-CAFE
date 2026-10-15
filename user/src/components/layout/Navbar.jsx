import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu as MenuIcon,
  X,
  ArrowRight,
  User,
  LogOut,
  MapPin,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { Button } from '../ui/Button';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { totalCount, setIsCartOpen } = useCart();
  const {
    currentUser,
    userProfile,
    logout,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'About', path: '/about' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-stone-950/85 backdrop-blur-md border-b border-white/10 py-3 shadow-lg'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      {/* Full width navbar directly on top of video */}
      <div className="w-full px-5 sm:px-10 lg:px-16 flex items-center justify-between">
        
        {/* Brand / Logo - AGF CAFE */}
        <NavLink to="/" className="flex flex-col group text-left drop-shadow-md select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-400 group-hover:-translate-x-0.5 transition-transform font-serif">
              &lt;
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
              AGF CAFE
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-bold text-stone-300 pl-3">
            Good Food • Happy Mood
          </span>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive: isLinkActive }) =>
                  `relative py-1 text-sm font-semibold transition-all duration-200 drop-shadow-md ${
                    isLinkActive ? 'text-amber-400 font-bold' : 'text-stone-100 hover:text-amber-300'
                  }`
                }
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full shadow-sm" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right Actions: Search, Cart, Order Now Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Search Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-white hover:text-amber-300 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 transition cursor-pointer shadow-sm"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isSearchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute right-0 top-12 w-64 bg-stone-900/95 backdrop-blur-md border border-stone-700 rounded-2xl p-2 shadow-2xl flex items-center gap-2 z-50 animate-fadeIn"
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search pizza, burger..."
                  autoFocus
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  Go
                </button>
              </form>
            )}
          </div>

          {/* Cart Icon & Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-white hover:text-amber-300 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 transition cursor-pointer shadow-sm"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scaleUp">
                {totalCount}
              </span>
            )}
          </button>

          {/* User Auth Profile Trigger (Desktop & Tablet) */}
          <div className="relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/15 transition cursor-pointer shadow-sm text-white"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-amber-400"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-semibold max-w-[90px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 top-12 w-56 bg-stone-900 border border-stone-800 rounded-2xl p-2 shadow-2xl z-50 text-stone-200 animate-fadeIn"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-stone-800">
                      <p className="text-xs font-bold text-white truncate">
                        {userProfile?.name || currentUser.displayName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-200 hover:text-white hover:bg-stone-800/80 rounded-xl transition cursor-pointer text-left"
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-400" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard/orders');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-200 hover:text-white hover:bg-stone-800/80 rounded-xl transition cursor-pointer text-left"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                        <span>My Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard/addresses');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-200 hover:text-white hover:bg-stone-800/80 rounded-xl transition cursor-pointer text-left"
                      >
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>Saved Addresses</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-stone-800">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-xl transition cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs transition cursor-pointer backdrop-blur-md"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>

          {/* Desktop Order Now Button */}
          <div className="hidden sm:block">
            <Button
              size="sm"
              onClick={() => {
                if (totalCount > 0) {
                  setIsCartOpen(true);
                } else {
                  navigate('/menu');
                }
              }}
              className="px-5 py-2 font-bold text-xs group shadow-lg"
              icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            >
              Order Now
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-amber-300 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-stone-950/95 backdrop-blur-xl border-b border-stone-800 px-6 py-6 space-y-4 animate-fadeIn mt-2">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-base font-semibold py-2 px-3 rounded-xl transition ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-stone-200 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
          
          {/* Mobile Auth Section */}
          <div className="pt-3 border-t border-stone-800">
            {currentUser ? (
              <div className="space-y-3 bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800/80">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-amber-400"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {userProfile?.name || currentUser.displayName || 'Customer'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold hover:text-white transition"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard/orders');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold hover:text-white transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard/addresses');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 text-stone-200 text-xs font-semibold hover:text-white transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Addresses</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/40 text-rose-300 text-xs font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs transition cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Sign In / Create Account</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <Button
              className="w-full justify-center"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/menu');
              }}
            >
              Order Now
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
