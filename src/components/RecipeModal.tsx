import React, { useEffect, useState } from 'react';
import { X, Plus, Save, Trash2 } from 'lucide-react';
import { RecipeItemInput, Ingredient } from '@/types';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  menuId: string;
  onClose: () => void;
  onSaved?: () => void;
}

const RecipeModal: React.FC<Props> = ({ isOpen, onClose, menuId, onSaved }) => {
  const [items, setItems] = useState<RecipeItemInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngs, setLoadingIngs] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      return;
    }
    // Load ingredient list when opening
    (async () => {
      try {
        setLoadingIngs(true);
        const data = await apiService.getIngredients();
        const list = Array.isArray(data) ? data : [];
        setIngredients(list);
        // Ensure at least one row is visible when ingredients exist
        if (list.length > 0) {
          setItems((prev) => prev.length === 0
            ? [{ ingredient_name: list[0].name, quantity: 1 }]
            : prev
          );
        }
      } catch (e) {
        console.warn('Failed to load ingredients for recipe modal', e);
        setIngredients([]);
      } finally {
        setLoadingIngs(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const addRow = () => setItems((prev) => [...prev, { ingredient_name: '', quantity: 0 }]);
  const removeRow = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const valid = items.filter((it) => it.ingredient_name && it.quantity > 0);
    if (valid.length === 0) {
      toast.error('Please add at least one ingredient with quantity');
      return;
    }
    setSaving(true);
    try {
      await apiService.setMenuRecipe(menuId, valid);
      toast.success('Recipe saved');
      onSaved?.();
      onClose();
    } catch (e) {
      console.error('Failed to save recipe', e);
      toast.error('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Set Menu Recipe</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100"><X className="h-5 w-5" /></button>
          </div>

          <div className="space-y-3">
            {loadingIngs ? (
              <div className="text-sm text-gray-500">Loading ingredients...</div>
            ) : ingredients.length === 0 ? (
              <div className="text-sm text-gray-600">
                No ingredients found. Please add ingredients in Inventory first.
              </div>
            ) : (
              <>
                {items.map((it, idx) => {
                  const selected = ingredients.find(ing => ing.name === it.ingredient_name);
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
                        <select
                          className="input h-10"
                          value={it.ingredient_name}
                          onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, ingredient_name: e.target.value } : p))}
                        >
                          <option value="" disabled>Select ingredient</option>
                          {ingredients.map((ing) => (
                            <option key={String(ing.id ?? ing.name)} value={ing.name}>
                              {ing.name} {ing.unit ? `(${ing.unit})` : ''}
                            </option>
                          ))}
                        </select>
                        {selected && (
                          <div className="text-xs text-gray-500 mt-1">Stock: {Number(selected.stock)} {selected.unit}</div>
                        )}
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity {selected?.unit ? `(${selected.unit})` : ''}</label>
                        <input
                          type="number"
                          min={0}
                          className="input h-10"
                          value={it.quantity}
                          onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: Number(e.target.value) } : p))}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => removeRow(idx)} className="h-10 w-10 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={addRow} className="btn-secondary flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Ingredient</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className={`btn-primary flex items-center space-x-2 ${saving ? 'opacity-60' : ''}`}>
              <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
