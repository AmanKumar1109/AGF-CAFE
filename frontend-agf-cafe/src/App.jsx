import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileAddressModal } from './components/auth/ProfileAddressModal';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <AuthModal />
          <ProfileAddressModal />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
