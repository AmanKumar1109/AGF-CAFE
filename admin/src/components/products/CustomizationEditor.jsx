import React from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  CheckSquare, 
  CircleDot, 
  MessageSquare,
  Utensils,
  ChevronDown
} from 'lucide-react';

export const CUSTOMIZATION_PRESETS = {
  pizza: {
    id: 'pizza',
    label: '🍕 Pizza Template',
    customizations: [
      {
        id: 'group_crust',
        title: 'Base & Crust Upgrade',
        type: 'single',
        required: true,
        options: [
          { name: 'Regular Hand-Tossed Crust', price: 0 },
          { name: '100% Cheese Burst Crust', price: 60 },
          { name: 'Crispy Gourmet Thin Crust', price: 35 },
          { name: 'Fresh Pan Soft Crust', price: 40 },
        ],
      },
      {
        id: 'group_toppings',
        title: 'Extra Cheese & Toppings',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Mozzarella Cheese', price: 45 },
          { name: 'Fresh Paneer Cubes', price: 35 },
          { name: 'Spicy BBQ Chicken / Paneer Chunks', price: 50 },
          { name: 'Grilled Mushrooms', price: 30 },
          { name: 'Golden Sweet Corn & Capsicum', price: 25 },
          { name: 'Pickled Jalapenos', price: 25 },
          { name: 'Black Olives', price: 30 },
        ],
      },
      {
        id: 'group_dips',
        title: 'Dips & Seasoning',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Cheesy Garlic Dip (30g)', price: 25 },
          { name: 'Spicy Peri Peri Dip', price: 20 },
          { name: 'Extra Seasoning Flakes Pouches', price: 10 },
        ],
      },
    ],
  },
  burger: {
    id: 'burger',
    label: '🍔 Burger / Sandwich Template',
    customizations: [
      {
        id: 'group_bun',
        title: 'Bun Upgrade',
        type: 'single',
        required: true,
        options: [
          { name: 'Classic Brioche Toasted Bun', price: 0 },
          { name: 'Whole Wheat Gourmet Bun', price: 20 },
          { name: 'Multigrain Sesame Bun', price: 25 },
        ],
      },
      {
        id: 'group_fillings',
        title: 'Extra Fillings & Cheese',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Melted Cheddar Cheese Slice', price: 25 },
          { name: 'Double Patty Upgrade', price: 55 },
          { name: 'Caramelized Butter Onions', price: 15 },
          { name: 'Crispy French Fries (Side Portion)', price: 45 },
        ],
      },
      {
        id: 'group_dips',
        title: 'Gourmet Dips',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Tandoori Smokey Mayo Dip', price: 20 },
          { name: 'Creamy Cheese Jalapeno Dip', price: 25 },
        ],
      },
    ],
  },
  beverage: {
    id: 'beverage',
    label: '🥤 Drinks / Shakes Template',
    customizations: [
      {
        id: 'group_size',
        title: 'Select Portion / Size',
        type: 'single',
        required: true,
        options: [
          { name: 'Regular (300 ml)', price: 0 },
          { name: 'Large Jumbo (500 ml)', price: 40 },
        ],
      },
      {
        id: 'group_add_ons',
        title: 'Add-ons & Sweetness',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Scoop of Vanilla Ice Cream', price: 35 },
          { name: 'Crushed Oreo Bits & Chocolate Drizzle', price: 25 },
          { name: 'Whipped Cream Swirl', price: 25 },
          { name: 'No Sugar / Less Sweet', price: 0 },
        ],
      },
    ],
  },
  starters: {
    id: 'starters',
    label: '🍟 Starters / Sides Template',
    customizations: [
      {
        id: 'group_style',
        title: 'Portion / Style Upgrade',
        type: 'single',
        required: false,
        options: [
          { name: 'Regular Portion', price: 0 },
          { name: 'Extra Cheese Loaded Style', price: 45 },
          { name: 'Spicy Schezwan Tossed Style', price: 30 },
        ],
      },
      {
        id: 'group_dips',
        title: 'Add Dips & Sauces',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Schezwan Sauce Cup (40g)', price: 20 },
          { name: 'Cheesy Garlic Mayo Dip', price: 20 },
          { name: 'Peri Peri Shake Seasoning', price: 15 },
        ],
      },
    ],
  },
};

export const CustomizationEditor = ({
  customizationEnabled,
  onToggleEnabled,
  customizations = [],
  onChangeCustomizations,
  allowInstructions = true,
  onToggleInstructions,
}) => {
  // Apply a preset template
  const handleApplyPreset = (presetKey) => {
    const preset = CUSTOMIZATION_PRESETS[presetKey];
    if (preset) {
      onChangeCustomizations(JSON.parse(JSON.stringify(preset.customizations)));
      if (!customizationEnabled) {
        onToggleEnabled(true);
      }
    }
  };

  // Add a new empty group
  const handleAddGroup = () => {
    const newGroup = {
      id: `group_${Date.now()}`,
      title: 'New Option Group',
      type: 'multiple', // 'single' or 'multiple'
      required: false,
      options: [
        { name: 'Option 1', price: 0 },
        { name: 'Option 2', price: 30 },
      ],
    };
    onChangeCustomizations([...customizations, newGroup]);
  };

  // Update a specific group field
  const handleUpdateGroup = (groupIndex, field, value) => {
    const updated = [...customizations];
    updated[groupIndex] = {
      ...updated[groupIndex],
      [field]: value,
    };
    onChangeCustomizations(updated);
  };

  // Delete a group
  const handleDeleteGroup = (groupIndex) => {
    const updated = customizations.filter((_, idx) => idx !== groupIndex);
    onChangeCustomizations(updated);
  };

  // Add an option to a group
  const handleAddOption = (groupIndex) => {
    const updated = [...customizations];
    const group = updated[groupIndex];
    group.options = [
      ...(group.options || []),
      { name: '', price: 0 },
    ];
    onChangeCustomizations(updated);
  };

  // Update option in a group
  const handleUpdateOption = (groupIndex, optionIndex, field, value) => {
    const updated = [...customizations];
    const group = updated[groupIndex];
    const updatedOptions = [...group.options];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: field === 'price' ? Number(value) || 0 : value,
    };
    group.options = updatedOptions;
    onChangeCustomizations(updated);
  };

  // Delete option from a group
  const handleDeleteOption = (groupIndex, optionIndex) => {
    const updated = [...customizations];
    const group = updated[groupIndex];
    group.options = group.options.filter((_, idx) => idx !== optionIndex);
    onChangeCustomizations(updated);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      {/* Header and Master Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-800">
                Product Customization & Add-ons (Zomato/Swiggy Style)
              </h4>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Allow customers to select crusts, add extra cheese/toppings, choose dips, and write cooking instructions.
            </p>
          </div>
        </div>

        {/* Switch */}
        <label className="relative inline-flex items-center cursor-pointer shrink-0 self-start sm:self-center">
          <input
            type="checkbox"
            checked={customizationEnabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          <span className="ml-2.5 text-xs font-bold text-slate-800">
            {customizationEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* When Customization is Disabled */}
      {!customizationEnabled && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Customization is turned off for this item. Customers can 1-click add it directly to cart without opening an add-on modal.
          </span>
        </div>
      )}

      {/* When Customization is Enabled */}
      {customizationEnabled && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Quick 1-Click Templates (Auto-fills groups and options)
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CUSTOMIZATION_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
              {customizations.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChangeCustomizations([])}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Clear All Groups
                </button>
              )}
            </div>
          </div>

          {/* Cooking Instructions Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Allow Customer Cooking Instructions & Notes
                </span>
                <span className="text-[11px] text-slate-500">
                  Customers can type requests (e.g. "Less spicy", "Extra crispy base", "No onions")
                </span>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowInstructions}
                onChange={(e) => onToggleInstructions(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
            </label>
          </div>

          {/* Customization Groups List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Customization Option Groups ({customizations.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddGroup}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option Group</span>
              </button>
            </div>

            {customizations.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  No customization groups configured yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Click a 1-click template above (e.g. Pizza Template) or add a custom group manually.
                </p>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  + Add Group Manually
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customizations.map((group, groupIdx) => (
                  <div
                    key={group.id || groupIdx}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    {/* Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 text-xs font-black flex items-center justify-center shrink-0">
                          {groupIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) =>
                            handleUpdateGroup(groupIdx, 'title', e.target.value)
                          }
                          placeholder="Group Title (e.g. Crust Upgrade, Extra Toppings)"
                          className="flex-1 font-bold text-xs text-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Group Controls: Type & Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          value={group.type}
                          onChange={(e) =>
                            handleUpdateGroup(groupIdx, 'type', e.target.value)
                          }
                          className="text-xs font-semibold text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none cursor-pointer"
                        >
                          <option value="single">Single Choice (Radio • Pick 1)</option>
                          <option value="multiple">Multi Choice (Checkbox • Pick any)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(groupIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Options in this Group */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                        <span>Option Name</span>
                        <div className="flex items-center gap-6">
                          <span>Extra Price (₹)</span>
                          <span className="w-6" />
                        </div>
                      </div>

                      {group.options?.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70"
                        >
                          <div className="text-slate-400 shrink-0">
                            {group.type === 'single' ? (
                              <CircleDot className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>

                          {/* Option Name */}
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) =>
                              handleUpdateOption(
                                groupIdx,
                                optIdx,
                                'name',
                                e.target.value
                              )
                            }
                            placeholder="e.g. Cheese Burst Crust, Extra Paneer"
                            className="flex-1 text-xs font-medium text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                          />

                          {/* Option Price */}
                          <div className="flex items-center gap-1 shrink-0 w-24">
                            <span className="text-xs font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={opt.price}
                              onChange={(e) =>
                                handleUpdateOption(
                                  groupIdx,
                                  optIdx,
                                  'price',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-full text-xs font-bold text-slate-800 bg-white px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Remove Option */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(groupIdx, optIdx)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Remove Option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Option Button */}
                      <button
                        type="button"
                        onClick={() => handleAddOption(groupIdx)}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option to this Group</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
