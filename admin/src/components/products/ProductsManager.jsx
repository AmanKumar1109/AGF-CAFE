import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  UtensilsCrossed,
  Layers,
  Flame,
  Star,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../firebase';
import { ProductModal } from './ProductModal';

// Default initial items to seed if database is brand new
const INITIAL_SEED_ITEMS = [
  {
    name: 'Margherita Pizza',
    category: 'Pizza',
    description: 'Fresh tomatoes, mozzarella, with a hint of basil.',
    price: 249,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
    popular: true,
    badge: 'Popular',
    inStock: true,
    isVeg: true,
    rating: 4.9,
    calories: '650 kcal',
    prepTime: '20 min',
  },
  {
    name: 'Classic Burger',
    category: 'Burger',
    description: 'Juicy patty, fresh veggies, our special sauce.',
    price: 199,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    popular: true,
    badge: 'Chef Special',
    inStock: true,
    isVeg: true,
    rating: 4.8,
    calories: '540 kcal',
    prepTime: '15 min',
  },
  {
    name: 'French Fries',
    category: 'Sides',
    description: 'Crispy, golden and absolutely delicious.',
    price: 129,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    popular: true,
    badge: null,
    inStock: true,
    isVeg: true,
    rating: 4.7,
    calories: '320 kcal',
    prepTime: '10 min',
  },
  {
    name: 'Chocolate Shake',
    category: 'Beverages',
    description: 'Rich, creamy and full of chocolatey goodness.',
    price: 149,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
    popular: true,
    badge: null,
    inStock: true,
    isVeg: true,
    rating: 4.9,
    calories: '410 kcal',
    prepTime: '8 min',
  },
  {
    name: 'Spicy Pepperoni & Herb Pizza',
    category: 'Pizza',
    description: 'Crisp hand-stretched crust topped with savory pepperoni slices, melted mozzarella & crushed red chilies.',
    price: 349,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
    popular: false,
    badge: 'Bestseller',
    inStock: true,
    isVeg: false,
    rating: 4.9,
    calories: '720 kcal',
    prepTime: '22 min',
  },
  {
    name: 'Double Smash Cheeseburger',
    category: 'Burger',
    description: 'Two seared premium patties stacked with double melted cheddar, caramelized onions and spicy mayo.',
    price: 279,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    popular: false,
    badge: 'Chef Special',
    inStock: true,
    isVeg: false,
    rating: 4.8,
    calories: '680 kcal',
    prepTime: '18 min',
  },
  {
    name: 'Creamy Alfredo Penne',
    category: 'Pasta',
    description: 'Al dente penne bathed in rich parmesan cream sauce with garlic herbs and sautéed button mushrooms.',
    price: 269,
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
    popular: false,
    badge: null,
    inStock: true,
    isVeg: true,
    rating: 4.7,
    calories: '580 kcal',
    prepTime: '16 min',
  },
  {
    name: 'Warm Lava Molten Cake',
    category: 'Desserts',
    description: 'Decadent Belgian chocolate cake with a velvety molten center served warm.',
    price: 179,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    popular: false,
    badge: 'Sweet Tooth',
    inStock: true,
    isVeg: true,
    rating: 4.9,
    calories: '420 kcal',
    prepTime: '12 min',
  },
];

export const ProductsManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Real-time Firestore subscription
  useEffect(() => {
    try {
      const menuCol = collection(db, 'menu_items');
      const unsubscribe = onSnapshot(
        menuCol,
        (snapshot) => {
          const fetched = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort items by creation or name
          fetched.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setItems(fetched);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore onSnapshot error:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Add or update item
  const handleSaveProduct = async (productData) => {
    if (editingItem) {
      const docRef = doc(db, 'menu_items', editingItem.id);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp(),
      });
      showNotification(`"${productData.name}" updated successfully!`);
    } else {
      await addDoc(collection(db, 'menu_items'), {
        ...productData,
        createdAt: serverTimestamp(),
      });
      showNotification(`"${productData.name}" added to menu!`);
    }
  };

  // Delete item
  const handleDeleteProduct = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}" from the live menu?`)) {
      try {
        await deleteDoc(doc(db, 'menu_items', item.id));
        showNotification(`"${item.name}" removed from menu.`);
      } catch (err) {
        alert('Failed to delete item: ' + err.message);
      }
    }
  };

  // Quick toggle in-stock
  const handleToggleStock = async (item) => {
    try {
      const docRef = doc(db, 'menu_items', item.id);
      const newStatus = !item.inStock;
      await updateDoc(docRef, { inStock: newStatus });
      showNotification(
        `"${item.name}" marked as ${newStatus ? 'In Stock' : 'Out of Stock'}`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Quick seed initial items
  const handleSeedMenu = async () => {
    try {
      setSeeding(true);
      const menuCol = collection(db, 'menu_items');
      for (const item of INITIAL_SEED_ITEMS) {
        await addDoc(menuCol, {
          ...item,
          createdAt: serverTimestamp(),
        });
      }
      showNotification('Successfully seeded 8 default cafe dishes to Firestore!');
    } catch (err) {
      console.error(err);
      alert('Error seeding menu: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Derive categories list
  const categories = ['All', ...new Set(items.map((i) => i.category || 'Other').filter(Boolean))];

  // Filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'in-stock' && item.inStock !== false) ||
      (stockFilter === 'out-of-stock' && item.inStock === false);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalInStock = items.filter((i) => i.inStock !== false).length;
  const totalOutOfStock = items.filter((i) => i.inStock === false).length;
  const totalPopular = items.filter((i) => i.popular).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Live Catalog
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Synced with Customer App
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1.5">
            Products & Menu Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add new food items, update prices, adjust stock availability, or modify category details in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {items.length === 0 && !loading && (
            <button
              onClick={handleSeedMenu}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{seeding ? 'Seeding...' : 'Seed Initial Cafe Menu'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Items</span>
            <span className="text-xl font-bold text-slate-800">{items.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">In Stock</span>
            <span className="text-xl font-bold text-emerald-600">{totalInStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Out of Stock</span>
            <span className="text-xl font-bold text-rose-600">{totalOutOfStock}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Homepage Specials</span>
            <span className="text-xl font-bold text-amber-600">{totalPopular}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name or keyword..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Availability:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setStockFilter('all')}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition ${
                  stockFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('in-stock')}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition ${
                  stockFilter === 'in-stock'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                In Stock ({totalInStock})
              </button>
              <button
                onClick={() => setStockFilter('out-of-stock')}
                className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition ${
                  stockFilter === 'out-of-stock'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Out of Stock ({totalOutOfStock})
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-slate-500">Connecting to Firestore live menu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No menu items found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {items.length === 0
              ? 'Your Firestore database currently has no dishes. You can seed the default cafe menu with 1 click or add your first item.'
              : 'No items match your search or filter criteria.'}
          </p>
          {items.length === 0 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleSeedMenu}
                disabled={seeding}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition cursor-pointer"
              >
                {seeding ? 'Seeding...' : 'Seed Default Cafe Menu'}
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition cursor-pointer"
              >
                + Add Custom Item
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStockFilter('all');
              }}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                item.inStock === false
                  ? 'border-rose-200 bg-rose-50/20 opacity-80'
                  : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Image & Status Badge */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Veg / Non-Veg badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center bg-white shadow-xs ${
                        item.isVeg !== false
                          ? 'border-emerald-600'
                          : 'border-rose-600'
                      }`}
                      title={item.isVeg !== false ? 'Pure Veg' : 'Non-Veg'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isVeg !== false ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>

                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Stock Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleStock(item)}
                      title="Click to toggle availability"
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs cursor-pointer transition flex items-center gap-1 ${
                        item.inStock !== false
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-rose-500 text-white hover:bg-rose-600'
                      }`}
                    >
                      {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>

                  {/* Rating Tag */}
                  {item.rating && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-semibold text-white">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                    <span>{item.category || 'General'}</span>
                    <span>{item.prepTime || '15 min'}</span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
                    {item.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
                    {item.description || 'Delicious handcrafted cafe item.'}
                  </p>
                </div>
              </div>

              {/* Price & Actions Bottom Bar */}
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-slate-900">
                    ₹ {item.price}
                  </span>
                  {item.calories && (
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
                      {item.calories}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveProduct}
        itemToEdit={editingItem}
      />
    </div>
  );
};
