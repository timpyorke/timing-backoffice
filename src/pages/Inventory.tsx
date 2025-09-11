import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { AddStockInput, Ingredient, UpsertIngredientInput } from '@/types';
import { Plus, RefreshCw, Save, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const Inventory: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<UpsertIngredientInput>({ name: '', unit: '', stock: undefined });
  const [editingName, setEditingName] = useState<string | null>(null);
  const [addStock, setAddStock] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(term) || i.unit.toLowerCase().includes(term));
  }, [ingredients, search]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiService.getIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load ingredients', e);
      toast.error('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) {
      toast.error('Name and unit are required');
      return;
    }
    try {
      const saved = await apiService.upsertIngredient({
        name: form.name.trim().toLowerCase(),
        unit: form.unit.trim(),
        stock: typeof form.stock === 'number' ? form.stock : undefined,
      });
      // Update local list (replace or add)
      setIngredients((prev) => {
        const idx = prev.findIndex((x) => x.name.toLowerCase() === saved.name.toLowerCase());
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...prev[idx], ...saved };
          return next;
        }
        return [...prev, saved];
      });
      toast.success('Ingredient saved');
      setForm({ name: '', unit: '', stock: undefined });
      setEditingName(null);
    } catch (e) {
      console.error('Failed to upsert ingredient', e);
      toast.error('Failed to save ingredient');
    }
  };

  const handleAddStock = async (name: string) => {
    const q = addStock[name] ?? 0;
    if (!q || q <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    try {
      const payload: AddStockInput = { name, quantity: q };
      const result = await apiService.addIngredientStock(payload);
      // Optimistically update stock if server returns latest ingredient
      setIngredients((prev) => {
        const idx = prev.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
        if (idx >= 0) {
          const next = [...prev];
          const updatedStock = (result && (result as any).stock != null)
            ? Number((result as any).stock)
            : Number(next[idx].stock) + q;
          next[idx] = { ...next[idx], stock: updatedStock };
          return next;
        }
        return prev;
      });
      setAddStock((s) => ({ ...s, [name]: 0 }));
      toast.success('Stock updated');
    } catch (e) {
      console.error('Failed to add stock', e);
      toast.error('Failed to add stock');
    }
  };

  const startEdit = (ing: Ingredient) => {
    setForm({ name: ing.name, unit: ing.unit, stock: ing.stock });
    setEditingName(ing.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (ing: Ingredient) => {
    const ok = confirm(`Delete ingredient "${ing.name}"?`);
    if (!ok) return;
    try {
      const success = await apiService.deleteIngredient({ name: ing.name, id: ing.id as any });
      if (success) {
        setIngredients((prev) => prev.filter((x) => x.name.toLowerCase() !== String(ing.name).toLowerCase()));
        toast.success('Ingredient deleted');
        if (editingName && editingName.toLowerCase() === String(ing.name).toLowerCase()) {
          setForm({ name: '', unit: '', stock: undefined });
          setEditingName(null);
        }
      } else {
        toast.error('Delete failed');
      }
    } catch (e) {
      console.error('Failed to delete ingredient', e);
      toast.error('Failed to delete ingredient');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          className={`btn-secondary flex items-center space-x-2 ${refreshing ? 'opacity-60' : ''}`}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Create / Update Ingredient */}
      <div className="card p-4 center">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="input"
              placeholder="e.g., milk"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={!!editingName && editingName !== form.name}
            />
            {editingName && (
              <div className="text-xs text-gray-500 mt-1">Editing: {editingName}</div>
            )}
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              className="input"
              placeholder="e.g., ml, g, pcs"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
            {editingName && (
              <div className="text-xs text-gray-500 mt-1">Editing: unit</div>
            )}
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
            <input
              className="input"
              type="number"
              min={0}
              placeholder="optional"
              value={form.stock ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
            {editingName && (
              <div className="text-xs text-gray-500 mt-1">Editing: stock</div>
            )}
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            {editingName && (
              <button
                type="button"
                onClick={() => { setForm({ name: '', unit: '', stock: undefined }); setEditingName(null); }}
                className="mt-2 btn-secondary w-full"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          className="input"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No ingredients found</div>
        ) : (
          <div className="divide-y">
            {filtered.map((ing) => (
              <div key={`${ing.name}`} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 capitalize">{ing.name}</div>
                  <div className="text-sm text-gray-500">Unit: {ing.unit}</div>
                </div>
                <div className="w-full md:w-48">
                  <div className="text-sm text-gray-600">Stock</div>
                  <div className="text-lg font-semibold">{Number(ing.stock)} {ing.unit}</div>
                </div>
                <div className="w-full md:w-64 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={addStock[ing.name] ?? 0}
                      onChange={(e) => setAddStock((s) => ({ ...s, [ing.name]: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddStock(ing.name)}
                      className="btn-secondary whitespace-nowrap flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => startEdit(ing)}
                      className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 tap-target inline-flex items-center justify-center"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ing)}
                      className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 tap-target inline-flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
