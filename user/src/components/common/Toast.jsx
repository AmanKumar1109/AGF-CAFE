import { useCart } from '../../context/useCart';
import { CheckCircle } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-stone-900 border border-amber-500/40 text-stone-100 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-bounce">
      <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
      <span className="text-sm font-medium">{toastMessage}</span>
    </div>
  );
};
