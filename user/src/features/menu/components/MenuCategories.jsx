export const MenuCategories = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25'
                : 'bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700/80 border border-stone-700/50'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};
