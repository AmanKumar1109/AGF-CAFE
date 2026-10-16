import React from 'react';
import {
  UtensilsCrossed,
  Coffee,
  Pizza,
  Sandwich,
  Star,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const BestSellingProducts = ({ products = [], onNavigateTab }) => {
  const getDishIcon = (category = '') => {
    const c = category.toLowerCase();
    if (c.includes('coffee') || c.includes('tea') || c.includes('beverage') || c.includes('drink')) {
      return '☕';
    }
    if (c.includes('pizza')) {
      return '🍕';
    }
    if (c.includes('burger')) {
      return '🍔';
    }
    if (c.includes('sandwich')) {
      return '🥪';
    }
    if (c.includes('dessert') || c.includes('cake') || c.includes('sweet')) {
      return '🍰';
    }
    if (c.includes('pasta') || c.includes('noodle')) {
      return '🍝';
    }
    return '🍽️';
  };

  return (
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight font-serif">
              Best Selling Cafe Dishes & Beverages
            </h3>
            <p className="text-xs text-slate-400 font-medium">Aggregated popularity from customer orders</p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('products')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            Manage Menu <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dishes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              <th className="pb-3 pl-2">Dish</th>
              <th className="pb-3">Category</th>
              <th className="pb-3 text-center">Units Sold</th>
              <th className="pb-3 text-right">Revenue (₹)</th>
              <th className="pb-3 text-right pr-2">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                  No orders recorded yet. As orders arrive, best selling cafe items will appear here!
                </td>
              </tr>
            ) : (
              products.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-amber-50/30 transition-colors group"
                >
                  {/* Dish Name & Food Icon */}
                  <td className="py-3.5 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-base flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                        {getDishIcon(item.category || item.name)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          ₹{item.price ? Number(item.price).toFixed(2) : '150.00'} each
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category || 'Specialty'}
                    </span>
                  </td>

                  {/* Sold Count */}
                  <td className="py-3.5 text-center font-bold text-slate-800">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 rounded-lg font-black text-xs">
                      {item.unitsSold || 0} sold
                    </span>
                  </td>

                  {/* Revenue in Rupees */}
                  <td className="py-3.5 text-right font-black text-slate-900 text-sm font-serif">
                    ₹{Number(item.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 text-right pr-2">
                    <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70 text-amber-700 font-black text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{item.rating ? Number(item.rating).toFixed(1) : '4.9'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
