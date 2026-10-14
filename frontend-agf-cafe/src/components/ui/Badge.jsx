export const Badge = ({ children, variant = 'amber', className = '' }) => {
  const variants = {
    amber: 'bg-amber-500/15 text-amber-500 border border-amber-500/20',
    red: 'bg-red-500 text-white font-medium shadow-sm',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    neutral: 'bg-stone-800 text-stone-300 border border-stone-700'
  };

  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium tracking-wide ${variants[variant] || variants.amber} ${className}`}>
      {children}
    </span>
  );
};
