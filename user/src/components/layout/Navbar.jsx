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
  Gift,
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
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isDarkHeroPage = location.pathname === '/' || location.pathname === '/complaint';
  const isLightNavbar = isDashboard || !isDarkHeroPage;

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
        isLightNavbar
          ? 'bg-white/95 backdrop-blur-md border-b border-stone-200 py-3 shadow-sm'
          : isScrolled
          ? 'bg-stone-950/85 backdrop-blur-md border-b border-white/10 py-3 shadow-lg'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      {/* Full width navbar directly on top of video */}
      <div className="w-full px-5 sm:px-10 lg:px-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo - AGF CAFE */}
        <NavLink to="/" className="flex flex-col group text-left select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-500 group-hover:-translate-x-0.5 transition-transform font-serif">
              &lt;
            </span>
            <span className={`text-xl sm:text-2xl font-black tracking-tight transition-colors ${
              isLightNavbar ? 'text-stone-900 group-hover:text-amber-600' : 'text-white group-hover:text-amber-300'
            }`}>
              AGF CAFE
            </span>
          </div>
          <span className={`text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-bold pl-3 ${
            isLightNavbar ? 'text-stone-500' : 'text-stone-300'
          }`}>
            Good Food • Happy Mood
          </span>
        </NavLink>

        {/* Large Prominent Center Search Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-10">
          <form
            onSubmit={handleSearchSubmit}
            className={`w-full relative flex items-center rounded-full transition-all duration-300 shadow-sm border ${
              isLightNavbar
                ? 'bg-stone-100/90 hover:bg-stone-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500 border-stone-200'
                : 'bg-stone-900/80 hover:bg-stone-900 focus-within:bg-stone-950 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-400/80 border-white/15 backdrop-blur-md'
            }`}
          >
            <div className="pl-4 pr-2 text-stone-400 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-amber-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search delicious food, pizza, burgers, shakes..."
              className={`w-full py-2.5 sm:py-3 pr-28 text-sm bg-transparent outline-none font-medium transition-colors ${
                isLightNavbar
                  ? 'text-stone-900 placeholder:text-stone-400'
                  : 'text-white placeholder:text-stone-400'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 mr-1 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 text-xs font-bold rounded-full transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Right Actions: Search, Cart, Order Now Button */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Mobile Search Trigger (< md) */}
          <div className="relative md:hidden">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full border transition cursor-pointer shadow-sm ${
                isLightNavbar
                  ? 'text-stone-700 hover:text-amber-600 bg-stone-100 hover:bg-stone-200 border-stone-200'
                  : 'text-white hover:text-amber-300 bg-black/30 backdrop-blur-md hover:bg-black/50 border-white/10'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-amber-500" />
            </button>

            {isSearchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className={`fixed left-4 right-4 top-20 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2 z-50 animate-fadeIn border ${
                  isLightNavbar
                    ? 'bg-white border-stone-200'
                    : 'bg-stone-900/95 backdrop-blur-md border-stone-700'
                }`}
              >
                <Search className="w-4 h-4 text-amber-500 ml-2 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search pizza, burger, shakes..."
                  autoFocus
                  className={`w-full border-none px-2 py-1.5 text-xs focus:outline-none ${
                    isLightNavbar
                      ? 'bg-transparent text-stone-900 placeholder:text-stone-400'
                      : 'bg-transparent text-white placeholder:text-stone-500'
                  }`}
                />
                <button
                  type="submit"
                  className="bg-amber-500 text-stone-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  Search
                </button>
              </form>
            )}
          </div>

          {/* Cart Icon & Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative p-2 rounded-full border transition cursor-pointer shadow-sm ${
              isLightNavbar
                ? 'text-stone-700 hover:text-amber-600 bg-stone-100 hover:bg-stone-200 border-stone-200'
                : 'text-white hover:text-amber-300 bg-black/30 backdrop-blur-md hover:bg-black/50 border-white/10'
            }`}
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
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition cursor-pointer shadow-sm ${
                    isLightNavbar
                      ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                      : 'bg-black/30 backdrop-blur-md hover:bg-black/50 border-white/15 text-white'
                  }`}
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
                    className={`absolute right-0 top-12 w-56 rounded-2xl p-2 shadow-xl z-50 animate-fadeIn border ${
                      isLightNavbar
                        ? 'bg-white border-stone-200 text-stone-800'
                        : 'bg-stone-900 border-stone-800 text-stone-200 shadow-2xl'
                    }`}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className={`px-3 py-2 border-b ${isLightNavbar ? 'border-stone-100' : 'border-stone-800'}`}>
                      <p className={`text-xs font-bold truncate ${isLightNavbar ? 'text-stone-900' : 'text-white'}`}>
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
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                          isLightNavbar
                            ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                            : 'text-stone-200 hover:text-white hover:bg-stone-800/80'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-amber-500" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard/orders');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                          isLightNavbar
                            ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                            : 'text-stone-200 hover:text-white hover:bg-stone-800/80'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        <span>My Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard/addresses');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                          isLightNavbar
                            ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                            : 'text-stone-200 hover:text-white hover:bg-stone-800/80'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span>Saved Addresses</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/dashboard/refer-earn');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer text-left ${
                          isLightNavbar
                            ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                            : 'text-stone-200 hover:text-white hover:bg-stone-800/80'
                        }`}
                      >
                        <Gift className="w-4 h-4 text-amber-500" />
                        <span>Refer & Earn</span>
                      </button>
                    </div>

                    <div className={`pt-1 border-t ${isLightNavbar ? 'border-stone-100' : 'border-stone-800'}`}>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer text-left"
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
                className={`flex items-center gap-2 py-2 px-3.5 rounded-full border font-semibold text-xs transition cursor-pointer ${
                  isLightNavbar
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white backdrop-blur-md'
                }`}
              >
                <User className="w-4 h-4 text-amber-500" />
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
              className="px-5 py-2 font-bold text-xs group shadow-sm bg-amber-500 hover:bg-amber-600 text-stone-950"
              icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            >
              Order Now
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl border transition cursor-pointer ${
              isLightNavbar
                ? 'text-stone-700 hover:text-stone-900 bg-stone-100 border-stone-200'
                : 'text-white hover:text-amber-300 bg-black/30 backdrop-blur-md border-white/10'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b px-6 py-6 space-y-4 animate-fadeIn mt-2 ${
          isLightNavbar
            ? 'bg-white/98 backdrop-blur-xl border-stone-200 shadow-lg'
            : 'bg-stone-950/95 backdrop-blur-xl border-stone-800'
        }`}>
          {/* Mobile Drawer Search Bar */}
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setIsMobileMenuOpen(false);
            }}
            className="relative"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-amber-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dishes, burgers, pizza..."
                className={`w-full pl-10 pr-24 py-2.5 rounded-xl border text-sm outline-none ${
                  isLightNavbar
                    ? 'bg-stone-100 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500'
                    : 'bg-stone-900 border-stone-800 text-white placeholder:text-stone-500 focus:border-amber-400'
                }`}
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-lg cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>
          
          {/* Mobile Auth Section */}
          <div className={`pt-3 border-t ${isLightNavbar ? 'border-stone-200' : 'border-stone-800'}`}>
            {currentUser ? (
              <div className={`space-y-3 p-3.5 rounded-2xl border ${
                isLightNavbar ? 'bg-stone-50 border-stone-200' : 'bg-stone-900/80 border-stone-800/80'
              }`}>
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
                    <p className={`text-xs font-bold truncate ${isLightNavbar ? 'text-stone-900' : 'text-white'}`}>
                      {userProfile?.name || currentUser.displayName || 'Customer'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isLightNavbar ? 'border-stone-200' : 'border-stone-800'}`}>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                      isLightNavbar
                        ? 'bg-stone-200/70 text-stone-800 hover:bg-stone-200'
                        : 'bg-stone-800 text-stone-200 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard/orders');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                      isLightNavbar
                        ? 'bg-stone-200/70 text-stone-800 hover:bg-stone-200'
                        : 'bg-stone-800 text-stone-200 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/dashboard/addresses');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                      isLightNavbar
                        ? 'bg-stone-200/70 text-stone-800 hover:bg-stone-200'
                        : 'bg-stone-800 text-stone-200 hover:text-white'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Addresses</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                      isLightNavbar
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        : 'bg-rose-950/40 text-rose-300'
                    }`}
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
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition cursor-pointer border ${
                  isLightNavbar
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-800'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                <User className="w-4 h-4 text-amber-500" />
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
