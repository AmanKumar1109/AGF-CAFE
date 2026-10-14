import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#0a0b0e] text-stone-400 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-serif">
                  &lt;
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  AGF CAFE
                </span>
              </div>
              <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-stone-500 pl-3">
                Good Food • Happy Mood
              </p>
            </div>

            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Beheragoda ka apna cafe! Crafting mouthwatering burgers, artisanal pizzas, and refreshing shakes made with fresh ingredients and lots of love.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#facebook"
                className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
              </a>
              <a
                href="#instagram"
                className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#twitter"
                className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition"
                aria-label="X / Twitter"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition">Home</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition">Our Menu</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition">About Us</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-amber-400 transition">Photo Gallery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition">Contact & Reservation</Link>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div className="text-left space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Cafe Hours</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <span className="text-stone-200 block font-medium">Mon - Fri:</span>
                10:00 AM – 11:30 PM
              </li>
              <li>
                <span className="text-stone-200 block font-medium">Saturday:</span>
                09:00 AM – Midnight
              </li>
              <li>
                <span className="text-stone-200 block font-medium">Sunday:</span>
                09:00 AM – Midnight
              </li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="text-left space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Visit Us</h4>
            <div className="space-y-2 text-xs text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>AGF Cafe, Main Boulevard, Beheragoda</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>hello@agfcafe.in</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 AGF CAFE. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-stone-300">Privacy Policy</a>
            <a href="#terms" className="hover:text-stone-300">Terms of Service</a>
            <a href="#hygiene" className="hover:text-stone-300">FSSAI Certified</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
