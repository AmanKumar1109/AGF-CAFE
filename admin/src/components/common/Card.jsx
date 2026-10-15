import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.015)] transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:border-slate-200/80' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, rightContent, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h3>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
};
