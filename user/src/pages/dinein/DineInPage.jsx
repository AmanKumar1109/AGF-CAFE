import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDineIn } from '../../context/DineInContext';
import { UtensilsCrossed, Sparkles } from 'lucide-react';

export const DineInPage = () => {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initDineInTable, isDineIn } = useDineIn();

  useEffect(() => {
    const rawTable = tableId || searchParams.get('table') || '1';
    initDineInTable(rawTable);

    // Redirect to menu page with dine-in active
    const timer = setTimeout(() => {
      navigate('/menu', { replace: true });
    }, 600);

    return () => clearTimeout(timer);
  }, [tableId, searchParams, initDineInTable, navigate]);

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-center p-6 text-stone-100">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-2xl shadow-amber-500/30 mb-6 animate-bounce">
        <UtensilsCrossed className="w-8 h-8 stroke-[2.2]" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black font-serif text-white mb-2">
        Connecting to Table #{tableId || searchParams.get('table') || '1'}...
      </h1>
      <p className="text-sm text-stone-400 max-w-sm mb-6">
        Welcome to AGF Cafe Dine-In. Loading your contactless menu with ₹0 Delivery Fee...
      </p>
      <div className="w-8 h-8 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
};
export default DineInPage;
