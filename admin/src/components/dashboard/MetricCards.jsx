import React from 'react';
import { 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  UtensilsCrossed
} from 'lucide-react';

export const MetricCards = ({ 
  todayRevenue = 0,
  todayGrowthPercent = 0,
  todayOrdersCount = 0,
  activeOrdersCount = 0,
  deliveredTodayCount = 0,
  thisMonthRevenue = 0,
  monthGrowthPercent = 0,
  totalCustomers = 0,
  repeatRate = 0,
  onNavigateTab
}) => {
  const cards = [
    {
      id: 'today_revenue',
      title: "Today's Cafe Revenue",
      value: `₹${Number(todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      growth: `${todayGrowthPercent >= 0 ? '+' : ''}${todayGrowthPercent}%`,
      isPositive: todayGrowthPercent >= 0,
      subtext: `${todayOrdersCount} orders placed today`,
      icon: IndianRupee,
      iconBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      actionTab: 'orders'
    },
    {
      id: 'active_orders',
      title: 'Active Kitchen Orders',
      value: String(activeOrdersCount),
      growth: `${deliveredTodayCount} delivered today`,
      isPositive: true,
      subtext: 'Kitchen prep & rider dispatch',
      icon: ShoppingBag,
      iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      actionTab: 'orders'
    },
    {
      id: 'month_revenue',
      title: 'Earning This Month',
      value: `₹${Number(thisMonthRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      growth: `${monthGrowthPercent >= 0 ? '+' : ''}${monthGrowthPercent}%`,
      isPositive: monthGrowthPercent >= 0,
      subtext: 'vs. previous calendar month',
      icon: TrendingUp,
      iconBg: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      actionTab: 'orders'
    },
    {
      id: 'total_customers',
      title: 'Registered Cafe Patrons',
      value: String(totalCustomers),
      growth: `${repeatRate}% repeat rate`,
      isPositive: true,
      subtext: 'Verified customer accounts',
      icon: Users,
      iconBg: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
      actionTab: 'customers'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onNavigateTab && card.actionTab && onNavigateTab(card.actionTab)}
            className="gsap-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 group cursor-pointer"
          >
            {/* Card Header: Title & Icon */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12.5px] font-bold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${card.iconBg}`}>
                <IconComponent className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>

            {/* Metric Value & Growth Badge */}
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
                {card.value}
              </h2>
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full ${
                  card.isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.growth}
              </span>
            </div>

            {/* Subtext */}
            <p className="text-[11.5px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
              <span>{card.subtext}</span>
              <span className="text-[10px] text-amber-600 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                View →
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
};
