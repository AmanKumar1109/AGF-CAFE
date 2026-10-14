export const GalleryPage = () => {
  const photos = [
    {
      title: 'Artisan Cheesy Crust Pizza',
      category: 'Pizza',
      url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Smoked Bacon & Cheddar Burger',
      category: 'Burger',
      url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Crispy Crinkle Cut French Fries',
      category: 'Sides',
      url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Decadent Belgian Chocolate Shake',
      category: 'Beverages',
      url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Rustic Cafe Cozy Seating',
      category: 'Ambience',
      url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=700&q=80',
    },
    {
      title: 'Wood-fired Oven Freshly Baked Pizza',
      category: 'Kitchen',
      url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80',
    },
  ];

  return (
    <div className="w-full bg-[#faf7f2] text-stone-900 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-amber-600 uppercase">
            Visual Delights
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
            Our Food & Cafe Gallery
          </h1>
          <p className="text-stone-600 text-sm sm:text-base">
            Take a visual tour through our delicious food creations and lively cafe atmosphere.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="group relative rounded-3xl overflow-hidden shadow-md bg-stone-100 aspect-[4/3] border border-stone-200"
            >
              <img
                src={photo.url}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white text-left">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  {photo.category}
                </span>
                <h4 className="text-base font-bold text-white mt-1">
                  {photo.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
