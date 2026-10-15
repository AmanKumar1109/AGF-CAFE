import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Utensils } from 'lucide-react';
import {
  MenuItemCard,
  MenuCategories,
  useMenuFilter,
  useLiveMenuItems,
} from '../features/menu';

export const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { items, categories: liveCategories, loading } = useLiveMenuItems();

  const {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredItems,
  } = useMenuFilter(items);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch, setSearchQuery]);

  return (
    <div className="w-full bg-[#faf7f2] min-h-screen text-stone-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-amber-600 uppercase">
              Delicious Bites
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
            Our Full Menu
          </h1>
          <p className="text-stone-600 text-sm sm:text-base">
            From oven-baked artisanal pizzas to flame-grilled burgers, explore all handcrafted delights.
          </p>
        </div>

        {/* Filter & Controls Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-stone-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Category Tabs */}
            <MenuCategories
              categories={liveCategories}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-full py-2 pl-9 pr-4 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-full py-2 px-4 pr-8 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none"
                >
                  <option value="default">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>

            </div>

          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-5 border border-stone-200/60 animate-pulse space-y-4">
                <div className="w-full aspect-square rounded-2xl bg-stone-200/70" />
                <div className="h-5 bg-stone-200/70 rounded-md w-3/4" />
                <div className="h-3 bg-stone-200/60 rounded-md w-full" />
                <div className="h-10 bg-stone-200/60 rounded-2xl w-full pt-2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 border border-stone-200">
            <Utensils className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-lg font-bold text-stone-800">
              {items.length === 0 ? 'No items in the menu yet' : 'No dishes match your search'}
            </h3>
            <p className="text-xs text-stone-500">
              {items.length === 0
                ? 'The menu is currently being populated by the restaurant manager. Please check back in a moment!'
                : 'Try searching with another keyword or pick another category tab above.'}
            </p>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
