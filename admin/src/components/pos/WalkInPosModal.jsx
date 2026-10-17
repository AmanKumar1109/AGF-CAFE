import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { punchWalkInTableOrder } from '../../services/tableService';
import {
  X,
  Plus,
  Minus,
  UtensilsCrossed,
  Search,
  CheckCircle2,
  ChefHat,
  Banknote,
  CreditCard,
  Trash2,
  Sparkles
} from 'lucide-react';

export const WalkInPosModal = ({
  isOpen,
  onClose,
  initialTableNumber = '1',
  tables = [],
  onOrderPunched,
}) => {
  const [selectedTable, setSelectedTable] = useState(initialTableNumber || '1');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('counter_cash');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'paid'
  const [notes, setNotes] = useState('');

  // Products from Firestore
  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTableNumber) setSelectedTable(initialTableNumber);
  }, [initialTableNumber]);

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
      } catch (e) {
        console.warn('Failed to load products for POS:', e);
      }
    }
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchProduct.trim()) {
      return p.name.toLowerCase().includes(searchProduct.toLowerCase());
    }
    return true;
  });

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price || product.basePrice || 0),
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const gstPercentage = 5.0;
  const gstAmount = Math.round((subtotal * (gstPercentage / 100)) * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Please add at least one dish to the order');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await punchWalkInTableOrder({
        tableNumber: selectedTable,
        customerName: customerName || 'Walk-in Guest',
        customerPhone,
        paymentMethod,
        paymentStatus,
        items: cartItems,
        subtotal,
        gstPercentage,
        gstAmount,
        totalAmount: grandTotal,
        notes,
      });

      setIsSubmitting(false);
      setCartItems([]);
      onClose();
      if (onOrderPunched) onOrderPunched(order);
    } catch (err) {
      console.error('Walk-in POS punch error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] border border-slate-200">
        
        {/* Left: Product Selector */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50/50">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-base">Walk-in Table POS Billing</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Seated At:</span>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-black text-amber-900 focus:outline-none"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.tableNumber}>
                      Table #{t.tableNumber} ({t.area || 'Floor'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search & Categories */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Search dishes, drinks, burgers..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-3 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200 hover:border-amber-400 text-left transition-all flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-semibold">{p.category}</span>
                    <span className="w-5 h-5 rounded-lg bg-amber-100 group-hover:bg-amber-400 text-amber-900 flex items-center justify-center font-bold text-xs transition">
                      +
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{p.name}</h4>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono font-black text-amber-700 text-sm">
                    ₹{p.price || p.basePrice || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Bill & Punch Panel */}
        <div className="w-full md:w-96 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-black text-slate-900 text-sm font-serif">
              Order Receipt • Table #{selectedTable}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guest Info inputs */}
          <div className="p-4 border-b border-slate-100 space-y-2 bg-slate-50/40">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98765..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Items In Bill */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Click dishes from left to add to Table #{selectedTable}
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">₹{item.price} each</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="w-14 text-right font-mono font-bold text-slate-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Totals */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (5%)</span>
                <span className="font-mono text-slate-800">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="text-emerald-700 font-bold">₹0 (Dine-In)</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-amber-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment toggles */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <label
                className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition ${
                  paymentMethod === 'counter_cash'
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="posPay"
                  checked={paymentMethod === 'counter_cash'}
                  onChange={() => setPaymentMethod('counter_cash')}
                  className="hidden"
                />
                💵 Cash at Counter
              </label>

              <label
                className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition ${
                  paymentMethod === 'upi'
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="posPay"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="hidden"
                />
                📱 Counter UPI QR
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ChefHat className="w-4 h-4 stroke-[2.4]" />
              <span>
                {isSubmitting
                  ? 'Punching Order...'
                  : `Punch & Send to Kitchen (₹${grandTotal.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WalkInPosModal;
