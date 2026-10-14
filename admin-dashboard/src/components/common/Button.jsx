import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-sm shadow-blue-500/20 transition-all duration-150 active:scale-[0.98]',
    secondary:
      'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium transition-all duration-150 active:scale-[0.98]',
    outline:
      'border border-slate-200 text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 transition-all duration-150',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-150',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all duration-150 active:scale-[0.98]',
  };

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium select-none cursor-pointer ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export const IconButton = ({
  icon: Icon,
  className = '',
  size = 'md',
  onClick,
  title,
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7 p-1 rounded-lg',
    md: 'w-8 h-8 p-1.5 rounded-xl',
    lg: 'w-10 h-10 p-2 rounded-xl',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors duration-150 cursor-pointer ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
    </button>
  );
};
