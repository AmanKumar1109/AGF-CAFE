import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ icon: Icon, title, description, actionText, actionLink }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-3xl h-full min-h-[320px] shadow-2xl">
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/10">
        <Icon className="w-10 h-10 text-amber-400 stroke-[1.7]" />
      </div>
      <h3 className="text-xl font-black text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-stone-400 font-medium mb-8 max-w-sm text-sm leading-relaxed">{description}</p>
      {actionText && actionLink && (
        <Link 
          to={actionLink} 
          className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
