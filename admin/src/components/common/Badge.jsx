import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-emerald-50 text-emerald-600 font-medium',
    danger: 'bg-rose-50 text-rose-500 font-medium',
    warning: 'bg-amber-50 text-amber-600 font-medium',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-1.5 py-0.5 rounded',
    sm: 'text-xs px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export const TrendBadge = ({ isPositive, value, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
        isPositive
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-rose-50 text-rose-500'
      } ${className}`}
    >
      <span className="text-[9px]">{isPositive ? '▲' : '▼'}</span>
      <span>{value}</span>
    </span>
  );
};
