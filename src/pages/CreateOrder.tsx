import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { CreateOrderInput, MenuItem, Order } from '@/types';
import { toast } from 'sonner';
import { Plus, Minus, Save, ArrowLeft, User, Phone, Mail, StickyNote, Search } from 'lucide-react';

type LineItem = {
  menu_id: number;
  quantity: number;
  price?: number;
  customizations?: Record<string, any>;
};

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedByMenuId, setSelectedByMenuId] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiService.getMenuItems();
        setMenu(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load menu:', e);
        toast.error('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const priceFor = (menu_id: number): number => {
    const m = menu.find(mi => Number(mi.id) === Number(menu_id));
    return m ? Number(m.base_price) : 0;
  };

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menu;
    return menu.filter(m => (m.name_en || m.name_th || m.name || '').toLowerCase().includes(q));
  }, [menu, search]);

  const normalizeCustomizations = (c?: Record<string, any>) => {
    if (!c) return {} as Record<string, any>;
    const out: Record<string, any> = {};
    Object.keys(c).sort().forEach(k => {
      const v = c[k];
      if (Array.isArray(v)) {
        out[k] = [...v].sort();
      } else {
        out[k] = v;
      }
    });
    return out;
  };

  const sameCustomizations = (a?: Record<string, any>, b?: Record<string, any>) => {
    return JSON.stringify(normalizeCustomizations(a)) === JSON.stringify(normalizeCustomizations(b));
  };

  const addItemByMenuId = (menuId: number, custom?: Record<string, any>) => {
    if (menu.length === 0) {
      toast.error('No menu items available. Please add menu items first.');
      return;
    }
    const menuItem = menu.find(m => Number(m.id) === Number(menuId));
    if (!menuItem) {
      toast.error('Menu item not found');
      return;
    }
    setItems(prev => {
      const idx = prev.findIndex(i => Number(i.menu_id) === Number(menuId) && sameCustomizations(i.customizations, custom));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 0) + 1 };
        return next;
      }
      return [...prev, { menu_id: Number(menuId), quantity: 1, price: Number(menuItem.base_price), customizations: normalizeCustomizations(custom) }];
    });
  };

  const incrementQty = (index: number) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: it.quantity + 1 } : it));
  };

  const decrementQty = (index: number) => {
    setItems(prev => prev
      .map((it, i) => i === index ? { ...it, quantity: it.quantity - 1 } : it)
      .filter(it => it.quantity > 0)
    );
  };

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      const unit = typeof it.price === 'number' ? it.price : priceFor(it.menu_id);
      return sum + unit * (it.quantity || 0);
    }, 0);
  }, [items, menu]);

  const canSubmit = useMemo(() => {
    return customerName.trim().length > 0 && items.length > 0 && items.every(i => i.quantity > 0);
  }, [customerName, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: CreateOrderInput = {
        customer_info: {
          name: customerName.trim(),
          email: customerEmail.trim() || undefined,
          phone: customerPhone.trim() || undefined,
        },
        items: items.map(it => ({
          menu_id: Number(it.menu_id),
          quantity: Number(it.quantity),
          price: typeof it.price === 'number' ? it.price : priceFor(it.menu_id),
          customizations: it.customizations && Object.keys(it.customizations).length ? it.customizations : undefined,
        })),
        notes: notes.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
      };

      const created: Order = await apiService.createOrder(payload);
      toast.success('Order created');
      if (created && created.id) {
        navigate(`/orders/${created.id}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      console.error('Create order failed:', err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Failed to create order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span>Customer Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <input className="input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 080-000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <input type="email" className="input" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Catalog */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Search menu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-gray-500">Loading menu...</div>
            ) : menu.length === 0 ? (
              <div className="text-sm text-gray-600">No menu items found. Please add items in Menu Management first.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenu.map(m => {
                  const sid = String(m.id);
                  const sel = selectedByMenuId[sid] || {};
                  const hasCustoms = m.customizations && Object.keys(m.customizations).length > 0;
                  return (
                    <div key={m.id} className="border rounded-lg bg-white flex flex-col overflow-hidden h-full">
                      <div className="h-36 bg-gray-100">
                        {m.image_url ? (
                          <img
                            src={m.image_url}
                            alt={m.name_en || m.name_th || m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="font-medium text-gray-900 truncate">{m.name_en || m.name_th || m.name}</div>
                        <div className="text-sm text-gray-500">฿{Number(m.base_price).toFixed(2)}</div>

                        {hasCustoms && (
                          <div className="mt-3 space-y-3 text-sm">
                            {Object.entries(m.customizations || {}).map(([key, options]) => {
                              const opts = Array.isArray(options) ? options : [];
                              if (!opts.length) return null;
                              if (key.toLowerCase() === 'extras') {
                                const selectedExtras: string[] = Array.isArray(sel.extras) ? sel.extras : [];
                                return (
                                  <div key={key}>
                                    <div className="text-gray-700 font-medium capitalize">{key}</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {opts.map(opt => {
                                        const checked = selectedExtras.includes(opt);
                                        return (
                                          <label key={opt} className={`px-2 py-1 rounded border cursor-pointer ${checked ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white text-gray-700'}`}>
                                            <input
                                              type="checkbox"
                                              className="mr-1 align-middle"
                                              checked={checked}
                                              onChange={(e) => {
                                                const next = new Set(selectedExtras);
                                                if (e.target.checked) next.add(opt); else next.delete(opt);
                                                setSelectedByMenuId(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), [key]: Array.from(next) } }));
                                              }}
                                            />
                                            {opt}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              // default single-select (hide size selectors entirely)
                              const isSize = ['size', 'sizes'].includes(key.toLowerCase());
                              if (isSize) return null;
                              const currentRaw = typeof sel[key] === 'string' ? sel[key] : '';
                              return (
                                <div key={key}>
                                  <div className="text-gray-700 font-medium capitalize">{key}</div>
                                  <select
                                    className="input mt-1"
                                    value={currentRaw}
                                    onChange={(e) => setSelectedByMenuId(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), [key]: e.target.value } }))}
                                  >
                                    <option value="">Select {key}</option>
                                    {opts.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="h-4" />
                        <button
                          type="button"
                          className="btn-primary mt-auto mb-2 w-full tap-target py-3"
                          onClick={() => addItemByMenuId(Number(m.id), selectedByMenuId[sid])}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <StickyNote className="h-5 w-5 text-gray-500" />
              <span>Notes</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea className="input h-24" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="e.g. Less sugar, no ice" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea className="input h-24" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
            </div>
          </div>
        </div>

        {/* Cart & Summary */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart</h2>
            {items.length === 0 ? (
              <div className="text-sm text-gray-600">No items in the cart. Add from the menu.</div>
            ) : (
              <div className="space-y-3">
                {items.map((it, idx) => {
                  const m = menu.find(mi => Number(mi.id) === Number(it.menu_id));
                  const name = m ? (m.name_en || m.name_th || m.name) : `Item #${it.menu_id}`;
                  const unit = typeof it.price === 'number' ? it.price : priceFor(it.menu_id);
                  return (
                    <div key={`${it.menu_id}-${idx}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 mr-2">
                          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
                          {it.customizations && Object.keys(it.customizations).length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              {Object.entries(it.customizations).map(([k, v]) => {
                                const val = Array.isArray(v) ? v.join(', ') : String(v);
                                return <span key={k} className="mr-2">{k}: {val}</span>;
                              })}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">฿{unit.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button type="button" className="btn-secondary px-2" onClick={() => decrementQty(idx)}>
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center">{it.quantity}</span>
                          <button type="button" className="btn-secondary px-2" onClick={() => incrementQty(idx)}>
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-24 text-right text-sm text-gray-700">฿{(unit * it.quantity).toFixed(2)}</div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="input w-24"
                            value={unit}
                            onChange={e => updateItem(idx, { price: Number(e.target.value) })}
                            title="Unit price"
                          />
                          <button type="button" className="btn-danger" onClick={() => removeItem(idx)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-sm">
                <span>Items</span>
                <span>{items.reduce((acc, it) => acc + it.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 mt-1">
                <span>Total</span>
                <span>฿{total.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full mt-4 btn-primary flex items-center justify-center space-x-2"
              >
                <Save className={`h-4 w-4 ${submitting ? 'animate-spin' : ''}`} />
                <span>{submitting ? 'Creating...' : 'Create Order'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
