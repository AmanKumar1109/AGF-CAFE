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
        isLightNavbar
          ? 'bg-white/95 backdrop-blur-md border-b border-stone-200 py-3 shadow-sm'
          : isScrolled
          ? 'bg-stone-950/85 backdrop-blur-md border-b border-white/10 py-3 shadow-lg'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      {/* Full width navbar directly on top of video */}
      <div className="w-full px-5 sm:px-10 lg:px-16 flex items-center justify-between">
        
        {/* Brand / Logo - AGF CAFE */}
        <NavLink to="/" className="flex flex-col group text-left select-none">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive: isLinkActive }) =>
                  `relative py-1 text-sm font-semibold transition-all duration-200 ${
                    isLightNavbar
                      ? isLinkActive ? 'text-amber-600 font-bold' : 'text-stone-700 hover:text-amber-600'
                      : isLinkActive ? 'text-amber-400 font-bold' : 'text-stone-100 hover:text-amber-300'
                  }`
                }
              >
                {link.name}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-sm" />
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
              className={`p-2 rounded-full border transition cursor-pointer shadow-sm ${
                isLightNavbar
                  ? 'text-stone-700 hover:text-amber-600 bg-stone-100 hover:bg-stone-200 border-stone-200'
                  : 'text-white hover:text-amber-300 bg-black/30 backdrop-blur-md hover:bg-black/50 border-white/10'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isSearchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className={`absolute right-0 top-12 w-64 rounded-2xl p-2 shadow-xl flex items-center gap-2 z-50 animate-fadeIn border ${
                  isLightNavbar
                    ? 'bg-white border-stone-200'
                    : 'bg-stone-900/95 backdrop-blur-md border-stone-700'
                }`}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search pizza, burger..."
                  autoFocus
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 ${
                    isLightNavbar
                      ? 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'
                      : 'bg-stone-950 border-stone-800 text-white placeholder:text-stone-500'
                  }`}
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
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-base font-semibold py-2 px-3 rounded-xl transition ${
                    isLightNavbar
                      ? isActive
                        ? 'bg-amber-50 text-amber-600 font-bold border border-amber-200'
                        : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                      : isActive
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
