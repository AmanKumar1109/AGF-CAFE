import React from 'react';
import {
  MoreHorizontal,
  Headphones,
  Watch,
  Smartphone,
  Gamepad2,
  DollarSign,
  Star,
} from 'lucide-react';

export const BestSellingProducts = ({ products }) => {
  const getProductIcon = (type) => {
    switch (type) {
      case 'headphones':
        return <Headphones className="w-4 h-4 text-slate-700" />;
      case 'watch':
        return <Watch className="w-4 h-4 text-slate-700" />;
      case 'phone':
        return <Smartphone className="w-4 h-4 text-slate-700" />;
      case 'gamepad':
        return <Gamepad2 className="w-4 h-4 text-slate-700" />;
      default:
        return <Headphones className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="gsap-card bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Best Selling Products
        </h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              <th className="pb-3 font-semibold pl-1">ID</th>
              <th className="pb-3 font-semibold">NAME</th>
              <th className="pb-3 font-semibold text-center sm:text-left">SOLD</th>
              <th className="pb-3 font-semibold">REVENUE</th>
              <th className="pb-3 font-semibold text-right pr-2">RATING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map((product, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
              >
                {/* ID */}
                <td className="py-3.5 pl-1 font-medium text-slate-400 text-[11.5px]">
                  {product.id}
                </td>

                {/* Name & Product Icon */}
                <td className="py-3.5 pr-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getProductIcon(product.type)}
                    </div>
                    <span className="font-semibold text-slate-800 tracking-tight truncate max-w-[170px] sm:max-w-[210px]">
                      {product.name}
                    </span>
                  </div>
                </td>

                {/* Sold Count */}
                <td className="py-3.5 font-medium text-slate-500 whitespace-nowrap">
                  {product.sold}
                </td>

                {/* Revenue with Dollar Sign Icon */}
                <td className="py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        product.revenueStatus === 'up'
                          ? 'text-emerald-500'
                          : 'text-rose-400'
                      }`}
                    >
                      $
                    </span>
                    <span
                      className={
                        product.revenueStatus === 'up'
                          ? 'text-emerald-600'
                          : 'text-rose-500'
                      }
                    >
                      {product.revenue}
                    </span>
                  </div>
                </td>

                {/* Rating with Star */}
                <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-[11.5px] text-slate-500">
                      ({product.rating})
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
