import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { DineInProvider } from './context/DineInContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileAddressModal } from './components/auth/ProfileAddressModal';
import { TableEntryModal } from './components/dinein/TableEntryModal';
import { DineInOrderTrackerModal } from './components/dinein/DineInOrderTrackerModal';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DineInProvider>
          <CartProvider>
            <AppRoutes />
            <AuthModal />
            <ProfileAddressModal />
            <TableEntryModal />
            <DineInOrderTrackerModal />
          </CartProvider>
        </DineInProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
