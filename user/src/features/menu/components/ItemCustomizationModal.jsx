import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Minus, 
  Sparkles, 
  ChefHat, 
  ShoppingBag,
  Flame,
  Layers,
  Utensils
} from 'lucide-react';
import { useCart } from '../../../context/useCart';

export const ItemCustomizationModal = ({ item, isOpen, onClose }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Determine category presets based on item name and category
  const itemType = useMemo(() => {
    if (!item) return 'general';
    const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
    if (text.includes('pizza')) return 'pizza';
    if (text.includes('burger') || text.includes('sandwich') || text.includes('wrap')) return 'burger';
    if (text.includes('shake') || text.includes('beverage') || text.includes('coffee') || text.includes('tea') || text.includes('cold drink') || text.includes('drink')) return 'beverage';
    if (text.includes('chinese') || text.includes('noodle') || text.includes('rice') || text.includes('pasta') || text.includes('maggi') || text.includes('maggie')) return 'chinese';
    return 'general';
  }, [item]);

  // Preset customization data structure based on food type
  const config = useMemo(() => {
    if (itemType === 'pizza') {
      return {
        crustTitle: 'Select Pizza Crust & Base',
        crustSubtitle: 'Choose 1 option',
        crusts: [
          { id: 'c1', name: 'Regular Hand-Tossed', price: 0, default: true },
          { id: 'c2', name: '100% Cheese Burst Crust', price: 60 },
          { id: 'c3', name: 'Thin & Crispy Gourmet Crust', price: 30 },
          { id: 'c4', name: 'Fresh Pan Soft Crust', price: 40 },
        ],
        toppingsTitle: 'Add Extra Cheese & Toppings',
        toppingsSubtitle: 'Select any options you like',
        toppings: [
          { id: 't1', name: 'Extra Mozzarella Cheese', price: 45 },
          { id: 't2', name: 'Grilled Herb Paneer Cubes', price: 40 },
          { id: 't3', name: 'Spicy Barbeque Chicken Chunks', price: 50 },
          { id: 't4', name: 'Fresh Button Mushrooms', price: 30 },
          { id: 't5', name: 'Sweet Golden Corn & Capsicum', price: 25 },
          { id: 't6', name: 'Black Olives & Red Paprika', price: 35 },
          { id: 't7', name: 'Pickled Sliced Jalapenos', price: 25 },
        ],
        dipsTitle: 'Add Delicious Dips & Seasoning',
        dipsSubtitle: 'Pair with your warm slices',
        dips: [
          { id: 'd1', name: 'Creamy Cheesy Garlic Dip (30g)', price: 25 },
          { id: 'd2', name: 'Spicy Peri-Peri Mayo Dip', price: 25 },
          { id: 'd3', name: 'Extra Oregano & Chilli Flakes Pouches', price: 10 },
        ],
        quickChips: [
          '🌶️ Less Spicy',
          '🔥 Extra Spicy',
          '🧅 No Onions',
          '🧀 Well Done / Crispy Base',
          '🌿 Extra Oregano & Flakes',
          '🧀 Extra Cheese Melt',
        ]
      };
    }

    if (itemType === 'burger') {
      return {
        crustTitle: 'Choose Bun & Patty Upgrade',
        crustSubtitle: 'Choose 1 option',
        crusts: [
          { id: 'b1', name: 'Classic Brioche Toasted Bun', price: 0, default: true },
          { id: 'b2', name: 'Melted Cheddar Cheese Slice', price: 25 },
          { id: 'b3', name: 'Double Patty Monster Stack', price: 55 },
        ],
        toppingsTitle: 'Extra Fillings & Sides',
        toppingsSubtitle: 'Customise your crunch',
        toppings: [
          { id: 'bt1', name: 'Crispy Salted French Fries (Side)', price: 45 },
          { id: 'bt2', name: 'Caramelized Butter Onions', price: 15 },
          { id: 'bt3', name: 'Spicy Gherkins & Jalapenos', price: 20 },
          { id: 'bt4', name: 'Fried Farm Egg / Grilled Paneer', price: 30 },
        ],
        dipsTitle: 'Extra Sauces & Dips',
        dipsSubtitle: 'Saucy indulgence',
        dips: [
          { id: 'bd1', name: 'Tandoori Smokey Mayo Dip', price: 20 },
          { id: 'bd2', name: 'Sweet & Tangy BBQ Dip', price: 20 },
          { id: 'bd3', name: 'Spicy Green Mint Dip', price: 15 },
        ],
        quickChips: [
          '🧅 No Raw Onions',
          '🍅 No Tomatoes',
          '🧀 Extra Toasted Bun',
          '🌶️ Extra Spicy Mayo',
          '🍟 Extra Crispy Fries',
        ]
      };
    }

    if (itemType === 'beverage') {
      return {
        crustTitle: 'Sweetness & Chill Preference',
        crustSubtitle: 'Choose 1 option',
        crusts: [
          { id: 'bv1', name: 'Standard Cafe Recipe', price: 0, default: true },
          { id: 'bv2', name: 'Less Sweet / Mild', price: 0 },
          { id: 'bv3', name: 'Extra Sweet Indulgence', price: 0 },
          { id: 'bv4', name: 'Zero Sugar / Sugar-Free', price: 15 },
        ],
        toppingsTitle: 'Extra Mix-ins & Toppings',
        toppingsSubtitle: 'Make your sip richer',
        toppings: [
          { id: 'bvt1', name: 'Belgian Chocolate Ice Cream Scoop', price: 35 },
          { id: 'bvt2', name: 'Fluffy Whipped Cream Swirl', price: 25 },
          { id: 'bvt3', name: 'Crushed Oreo Cookies & Brownie Crumbs', price: 30 },
          { id: 'bvt4', name: 'Rich Dark Chocolate Syrup Drizzle', price: 20 },
          { id: 'bvt5', name: 'Extra Espresso Caffeine Shot', price: 30 },
        ],
        dipsTitle: 'Serving Preferences',
        dipsSubtitle: 'Packaging preferences',
        dips: [
          { id: 'bvd1', name: 'Chilled Ice Pack (For Takeaway)', price: 10 },
          { id: 'bvd2', name: 'Eco-friendly Sipper Straw', price: 5 },
        ],
        quickChips: [
          '🧊 Less Ice',
          '🧊 No Ice',
          '🍫 Extra Chocolate Drizzle',
          '🥤 Straw Needed',
          '☕ Extra Strong Coffee',
        ]
      };
    }

    // Default for Chinese, Starters, Pastas, & Other dishes
    return {
      crustTitle: 'Spice Level Preference',
      crustSubtitle: 'Choose 1 option',
      crusts: [
        { id: 'g1', name: 'Medium Spicy (Cafe Standard)', price: 0, default: true },
        { id: 'g2', name: 'Mild / Kids Friendly', price: 0 },
        { id: 'g3', name: 'Desi Extra Spicy & Fiery', price: 0 },
      ],
      toppingsTitle: 'Add Delicious Add-ons',
      toppingsSubtitle: 'Enhance your portion',
      toppings: [
        { id: 'gt1', name: 'Extra Grated Cheese Layer', price: 35 },
        { id: 'gt2', name: 'Extra Grilled Paneer / Chicken Bits', price: 45 },
        { id: 'gt3', name: 'Crispy Garlic & Butter Topping', price: 20 },
        { id: 'gt4', name: 'Extra Fried Veggies / Corn', price: 25 },
      ],
      dipsTitle: 'Extra Sauces & Chutneys',
      dipsSubtitle: 'Flavor boosters',
      dips: [
        { id: 'gd1', name: 'Fiery Schezwan Sauce Cup (40g)', price: 20 },
        { id: 'gd2', name: 'Creamy Garlic Mayo Dip', price: 20 },
        { id: 'gd3', name: 'Fresh Mint Chutney Cup', price: 15 },
      ],
      quickChips: [
        '🌶️ Less Spicy',
        '🔥 Extra Spicy',
        '🧅 No Onions / Garlic',
        '🧄 Extra Fried Garlic',
        '🍲 Keep Gravy / Sauce Separate',
        '🧂 Less Salt & Oil',
      ]
    };
  }, [itemType]);

  // States
  const [selectedCrust, setSelectedCrust] = useState(() => {
    const defaultCrust = config.crusts.find(c => c.default) || config.crusts[0];
    return defaultCrust;
  });
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedDips, setSelectedDips] = useState([]);

  // Reset when item changes
  React.useEffect(() => {
    if (isOpen) {
      const defaultCrust = config.crusts.find(c => c.default) || config.crusts[0];
      setSelectedCrust(defaultCrust);
      setSelectedToppings([]);
      setSelectedDips([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [isOpen, config]);

  if (!isOpen || !item) return null;

  // Toggle toppings
  const handleToggleTopping = (topping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      }
      return [...prev, topping];
    });
  };

  // Toggle dips
  const handleToggleDip = (dip) => {
    setSelectedDips(prev => {
      const exists = prev.some(d => d.id === dip.id);
      if (exists) {
        return prev.filter(d => d.id !== dip.id);
      }
      return [...prev, dip];
    });
  };

  // Quick chips appender
  const handleChipClick = (chipText) => {
    setSpecialInstructions(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return chipText;
      if (trimmed.includes(chipText)) {
        // Toggle off if already present
        return trimmed.replace(chipText, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
      }
      return `${trimmed}, ${chipText}`;
    });
  };

  // Live Unit and Total Price calculation
  const basePrice = Number(item.price) || 0;
  const crustPrice = Number(selectedCrust?.price) || 0;
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const dipsPrice = selectedDips.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
  const unitPrice = basePrice + crustPrice + toppingsPrice + dipsPrice;
  const grandTotal = unitPrice * quantity;

  // Add customized item to cart
  const handleConfirmAddToCart = () => {
    const allAddOns = [];
    if (selectedCrust && selectedCrust.price > 0) {
      allAddOns.push({ name: selectedCrust.name, price: selectedCrust.price, type: 'Crust/Size' });
    }
    selectedToppings.forEach(t => {
      allAddOns.push({ name: t.name, price: t.price, type: 'Add-on' });
    });
    selectedDips.forEach(d => {
      allAddOns.push({ name: d.name, price: d.price, type: 'Dip/Sauce' });
    });

    const customizedItem = {
      ...item,
      price: unitPrice,
      basePrice: basePrice,
      selectedCrust: selectedCrust?.name || 'Standard',
      selectedAddOns: allAddOns,
      specialInstructions: specialInstructions.trim(),
    };

    addToCart(customizedItem, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white text-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Preview Bar */}
        <div className="relative p-4 sm:p-5 border-b border-stone-200 bg-stone-50/80 flex items-start gap-4 shrink-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 pr-8 text-left">
            <div className="flex items-center gap-1.5 mb-1">
              {item.isVeg !== undefined && (
                <span
                  className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                    item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                  }`}
                  title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                </span>
              )}
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Customisation
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-stone-900 truncate">
              {item.name}
            </h3>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              Base Price: <span className="text-stone-900 font-bold">₹{item.price}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Customization Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-left">
          
          {/* Section 1: Crust / Size / Style (Radio) */}
          {config.crusts && config.crusts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>{config.crustTitle}</span>
                  </h4>
                  <p className="text-[11px] font-semibold text-stone-500">{config.crustSubtitle}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Required
                </span>
              </div>

              <div className="space-y-2">
                {config.crusts.map((crust) => {
                  const isSelected = selectedCrust?.id === crust.id;
                  return (
                    <label
                      key={crust.id}
                      onClick={() => setSelectedCrust(crust)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-50/60 shadow-xs' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-amber-500' : 'border-stone-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-stone-950 font-extrabold' : 'text-stone-700'}`}>
                          {crust.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-stone-900">
                        {crust.price > 0 ? `+ ₹${crust.price}` : 'Free'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Extra Toppings / Add-ons (Checkboxes) */}
          {config.toppings && config.toppings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>{config.toppingsTitle}</span>
                  </h4>
                  <p className="text-[11px] font-semibold text-stone-500">{config.toppingsSubtitle}</p>
                </div>
                <span className="text-[10px] font-semibold text-stone-400">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {config.toppings.map((topping) => {
                  const isSelected = selectedToppings.some(t => t.id === topping.id);
                  return (
                    <label
                      key={topping.id}
                      onClick={() => handleToggleTopping(topping)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-50/60 shadow-xs' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-stone-950 font-bold' : 'text-stone-700'}`}>
                          {topping.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-stone-900">
                        + ₹{topping.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Dips & Sauces (Checkboxes) */}
          {config.dips && config.dips.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
                <div>
                  <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>{config.dipsTitle}</span>
                  </h4>
                  <p className="text-[11px] font-semibold text-stone-500">{config.dipsSubtitle}</p>
                </div>
                <span className="text-[10px] font-semibold text-stone-400">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {config.dips.map((dip) => {
                  const isSelected = selectedDips.some(d => d.id === dip.id);
                  return (
                    <label
                      key={dip.id}
                      onClick={() => handleToggleDip(dip)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-50/60 shadow-xs' 
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-stone-950 font-bold' : 'text-stone-700'}`}>
                          {dip.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-stone-900">
                        + ₹{dip.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Special Cooking Instructions ("Write how you want it") */}
          <div className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
              <div>
                <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>Cooking Instructions & Preferences</span>
                </h4>
                <p className="text-[11px] font-semibold text-stone-500">
                  Write how you want our kitchen chef to prepare your meal
                </p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Customise
              </span>
            </div>

            {/* Quick 1-tap suggestion chips */}
            {config.quickChips && (
              <div className="flex flex-wrap gap-1.5">
                {config.quickChips.map((chip, idx) => {
                  const isApplied = specialInstructions.includes(chip);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition border cursor-pointer ${
                        isApplied 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs' 
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Free-form notes text area */}
            <div className="relative">
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Less spicy, extra crispy crust, no onions, keep sauces separate..."
                maxLength={200}
                rows={3}
                className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] font-bold text-stone-400">
                {specialInstructions.length}/200
              </span>
            </div>
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 shadow-lg">
          {/* Quantity Controller */}
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 active:bg-stone-300 text-stone-800 disabled:opacity-40 flex items-center justify-center font-black transition cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="font-mono font-black text-sm px-2 text-stone-900 min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(prev => prev + 1)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-stone-200 active:bg-stone-300 text-stone-800 flex items-center justify-center font-black transition cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Add Item to Cart CTA */}
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            className="flex-1 py-3.5 px-4 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Cart</span>
            </div>
            <span className="font-mono font-black text-sm sm:text-base">
              ₹{grandTotal}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
