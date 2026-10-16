import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ icon: Icon, title, description, actionText, actionLink }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-stone-200 rounded-3xl h-full min-h-[320px] shadow-sm">
      <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-amber-600 stroke-[1.7]" />
      </div>
      <h3 className="text-xl font-black text-stone-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-stone-500 font-medium mb-8 max-w-sm text-sm leading-relaxed">{description}</p>
      {actionText && actionLink && (
        <Link 
          to={actionLink} 
          className="px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-full shadow-sm hover:shadow transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
