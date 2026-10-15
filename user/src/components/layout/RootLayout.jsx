import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CartDrawer } from '../../features/cart';
import { Toast } from '../common/Toast';

export const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0e1014] text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
    </div>
  );
};
