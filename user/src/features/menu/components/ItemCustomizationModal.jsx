import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Minus, 
  Sparkles, 
  ChefHat, 
  ShoppingBag,
  Layers,
  Utensils
} from 'lucide-react';
import { useCart } from '../../../context/useCart';

export const ItemCustomizationModal = ({ item, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Check if admin has configured custom groups on this item
  const hasAdminGroups = Array.isArray(item?.customizations) && item.customizations.length > 0;
  const allowInstructions = item?.allowInstructions !== false;

  // Single choice selections for dynamic groups: { [groupId]: selectedOption }
  const [selectedRadio, setSelectedRadio] = useState({});
  // Multiple choice selections for dynamic groups: { [groupId]: [selectedOptions] }
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});

  // Fallback presets based on item category for dishes without admin groups
  const itemType = useMemo(() => {
    if (!item) return 'general';
    const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
    if (text.includes('pizza')) return 'pizza';
    if (text.includes('burger') || text.includes('sandwich') || text.includes('wrap')) return 'burger';
    if (text.includes('shake') || text.includes('beverage') || text.includes('coffee') || text.includes('drink')) return 'beverage';
    return 'general';
  }, [item]);

  const config = useMemo(() => {
    if (itemType === 'pizza') {
      return {
        crustTitle: 'Select Pizza Crust & Base',
        crustSubtitle: 'Choose 1 option',
        crusts: [
          { id: 'c1', name: 'Regular Hand-Tossed', price: 0, default: true },
          { id: 'c2', name: '100% Cheese Burst Crust', price: 60 },
          { id: 'c3', name: 'Thin & Crispy Gourmet Crust', price: 35 },
          { id: 'c4', name: 'Fresh Pan Soft Crust', price: 40 },
        ],
        toppingsTitle: 'Add Extra Cheese & Toppings',
        toppingsSubtitle: 'Select any options you like',
        toppings: [
          { id: 't1', name: 'Extra Mozzarella Cheese', price: 45 },
          { id: 't2', name: 'Grilled Herb Paneer Cubes', price: 35 },
          { id: 't3', name: 'Fresh Button Mushrooms', price: 30 },
          { id: 't4', name: 'Sweet Golden Corn', price: 25 },
          { id: 't5', name: 'Pickled Jalapenos', price: 25 },
        ],
        dipsTitle: 'Add Delicious Dips & Seasoning',
        dipsSubtitle: 'Pair with your warm slices',
        dips: [
          { id: 'd1', name: 'Creamy Cheesy Garlic Dip (30g)', price: 25 },
          { id: 'd2', name: 'Spicy Peri-Peri Mayo Dip', price: 20 },
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
        crustTitle: 'Choose Bun Upgrade',
        crustSubtitle: 'Choose 1 option',
        crusts: [
          { id: 'b1', name: 'Classic Brioche Toasted Bun', price: 0, default: true },
          { id: 'b2', name: 'Whole Wheat Gourmet Bun', price: 20 },
        ],
        toppingsTitle: 'Extra Fillings & Cheese',
        toppingsSubtitle: 'Customise your crunch',
        toppings: [
          { id: 'bt1', name: 'Melted Cheddar Cheese Slice', price: 25 },
          { id: 'bt2', name: 'Caramelized Butter Onions', price: 15 },
          { id: 'bt3', name: 'Crispy Salted French Fries (Side)', price: 45 },
        ],
        dipsTitle: 'Extra Sauces & Dips',
        dipsSubtitle: 'Saucy indulgence',
        dips: [
          { id: 'bd1', name: 'Tandoori Smokey Mayo Dip', price: 20 },
          { id: 'bd2', name: 'Creamy Cheese Jalapeno Dip', price: 25 },
        ],
        quickChips: [
          '🧅 No Raw Onions',
          '🍅 No Tomatoes',
          '🧀 Extra Toasted Bun',
          '🌶️ Extra Spicy Sauce',
        ]
      };
    }

    return {
      crustTitle: 'Style / Size Preference',
      crustSubtitle: 'Choose 1 option',
      crusts: [
        { id: 'g1', name: 'Regular Portion', price: 0, default: true },
        { id: 'g2', name: 'Loaded Extra Special', price: 40 },
      ],
      toppingsTitle: 'Add Delicious Add-ons',
      toppingsSubtitle: 'Enhance your portion',
      toppings: [
        { id: 'gt1', name: 'Extra Grated Cheese Layer', price: 35 },
        { id: 'gt2', name: 'Extra Veggie / Paneer Bits', price: 30 },
      ],
      dipsTitle: 'Extra Sauces & Dips',
      dipsSubtitle: 'Flavor boosters',
      dips: [
        { id: 'gd1', name: 'Fiery Schezwan Sauce Cup (40g)', price: 20 },
        { id: 'gd2', name: 'Creamy Garlic Mayo Dip', price: 20 },
      ],
      quickChips: [
        '🌶️ Less Spicy',
        '🔥 Extra Spicy',
        '🧅 No Onions / Garlic',
        '🍲 Keep Gravy / Sauce Separate',
      ]
    };
  }, [itemType]);

  // Fallback states for non-admin groups
  const [selectedCrust, setSelectedCrust] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedDips, setSelectedDips] = useState([]);

  // Reset & Initialize when item changes or modal opens
  React.useEffect(() => {
    if (isOpen && item) {
      if (hasAdminGroups) {
        const initialRadio = {};
        const initialCheckboxes = {};
        item.customizations.forEach((group) => {
          const key = group.id || group.title;
          if (group.type === 'single' && group.options?.length > 0) {
            initialRadio[key] = group.options[0];
          } else {
            initialCheckboxes[key] = [];
          }
        });
        setSelectedRadio(initialRadio);
        setSelectedCheckboxes(initialCheckboxes);
      } else {
        const defaultCrust = config.crusts?.find(c => c.default) || config.crusts?.[0];
        setSelectedCrust(defaultCrust);
        setSelectedToppings([]);
        setSelectedDips([]);
      }
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [isOpen, item, hasAdminGroups, config]);

  if (!isOpen || !item) return null;

  // Handlers for Admin dynamic groups
  const handleSelectRadio = (groupId, option) => {
    setSelectedRadio(prev => ({
      ...prev,
      [groupId]: option
    }));
  };

  const handleToggleCheckbox = (groupId, option) => {
    setSelectedCheckboxes(prev => {
      const currentList = prev[groupId] || [];
      const exists = currentList.some(o => o.name === option.name);
      if (exists) {
        return {
          ...prev,
          [groupId]: currentList.filter(o => o.name !== option.name)
        };
      }
      return {
        ...prev,
        [groupId]: [...currentList, option]
      };
    });
  };

  // Handlers for fallback presets
  const handleToggleTopping = (topping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.id === topping.id);
      return exists ? prev.filter(t => t.id !== topping.id) : [...prev, topping];
    });
  };

  const handleToggleDip = (dip) => {
    setSelectedDips(prev => {
      const exists = prev.some(d => d.id === dip.id);
      return exists ? prev.filter(d => d.id !== dip.id) : [...prev, dip];
    });
  };

  const handleChipClick = (chipText) => {
    setSpecialInstructions(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return chipText;
      if (trimmed.includes(chipText)) {
        return trimmed.replace(chipText, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
      }
      return `${trimmed}, ${chipText}`;
    });
  };

  // Live Unit and Total Price calculation
  const basePrice = Number(item.price) || 0;
  let totalAddOnsPrice = 0;

  if (hasAdminGroups) {
    Object.values(selectedRadio).forEach(opt => {
      if (opt && opt.price) totalAddOnsPrice += Number(opt.price);
    });
    Object.values(selectedCheckboxes).forEach(opts => {
      if (Array.isArray(opts)) {
        opts.forEach(opt => {
          if (opt && opt.price) totalAddOnsPrice += Number(opt.price);
        });
      }
    });
  } else {
    const crustPrice = Number(selectedCrust?.price) || 0;
    const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    const dipsPrice = selectedDips.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
    totalAddOnsPrice = crustPrice + toppingsPrice + dipsPrice;
  }

  const unitPrice = basePrice + totalAddOnsPrice;
  const grandTotal = unitPrice * quantity;

  // Add customized item to cart
  const handleConfirmAddToCart = () => {
    const allAddOns = [];

    if (hasAdminGroups) {
      item.customizations.forEach(group => {
        const key = group.id || group.title;
        if (group.type === 'single') {
          const sel = selectedRadio[key];
          if (sel && sel.price > 0) {
            allAddOns.push({ name: sel.name, price: Number(sel.price), type: group.title });
          }
        } else {
          const list = selectedCheckboxes[key] || [];
          list.forEach(opt => {
            allAddOns.push({ name: opt.name, price: Number(opt.price), type: group.title });
          });
        }
      });
    } else {
      if (selectedCrust && selectedCrust.price > 0) {
        allAddOns.push({ name: selectedCrust.name, price: selectedCrust.price, type: 'Crust/Size' });
      }
      selectedToppings.forEach(t => {
        allAddOns.push({ name: t.name, price: t.price, type: 'Add-on' });
      });
      selectedDips.forEach(d => {
        allAddOns.push({ name: d.name, price: d.price, type: 'Dip/Sauce' });
      });
    }

    const customizedItem = {
      ...item,
      price: unitPrice,
      basePrice: basePrice,
      selectedCrust: hasAdminGroups 
        ? (Object.values(selectedRadio)[0]?.name || 'Standard') 
        : (selectedCrust?.name || 'Standard'),
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
          
          {/* CASE A: Dynamic Groups configured by Admin */}
          {hasAdminGroups ? (
            item.customizations.map((group, gIdx) => {
              const key = group.id || group.title;
              const isSingle = group.type === 'single';
              const selectedOption = selectedRadio[key];
              const selectedList = selectedCheckboxes[key] || [];

              return (
                <div key={key || gIdx} className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
                    <div>
                      <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>{group.title}</span>
                      </h4>
                      <p className="text-[11px] font-semibold text-stone-500">
                        {isSingle ? 'Choose 1 option' : 'Select any options you like'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      group.required || isSingle 
                        ? 'text-amber-700 bg-amber-50 border border-amber-200' 
                        : 'text-stone-400 bg-stone-50'
                    }`}>
                      {group.required || isSingle ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.options?.map((opt, oIdx) => {
                      const isSelected = isSingle
                        ? selectedOption?.name === opt.name
                        : selectedList.some(o => o.name === opt.name);

                      return (
                        <label
                          key={oIdx}
                          onClick={() =>
                            isSingle
                              ? handleSelectRadio(key, opt)
                              : handleToggleCheckbox(key, opt)
                          }
                          className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                            isSelected 
                              ? 'border-amber-400 bg-amber-50/60 shadow-xs' 
                              : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSingle ? (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-amber-500' : 'border-stone-300'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                              </div>
                            ) : (
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            )}
                            <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-stone-950 font-extrabold' : 'text-stone-700'}`}>
                              {opt.name}
                            </span>
                          </div>
                          <span className="text-xs font-black text-stone-900">
                            {Number(opt.price) > 0 ? `+ ₹${opt.price}` : 'Free'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            /* CASE B: Fallback Preset Customizations */
            <>
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
            </>
          )}

          {/* Section: Special Cooking Instructions ("Write how you want it") */}
          {allowInstructions && (
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
          )}

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
