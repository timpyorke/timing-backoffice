import React, { useState, useEffect } from 'react';
import { MenuItem, CustomizationOption } from '@/types';
import { apiService } from '@/services/api';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  item?: MenuItem | null;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    available: true,
    customizations: [] as CustomizationOption[]
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image || '',
        available: item.available,
        customizations: item.customizations
      });
      setImagePreview(item.image || '');
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        image: '',
        available: true,
        customizations: []
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [item, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return formData.image;

    setUploading(true);
    try {
      const response = await apiService.uploadMenuImage(imageFile);
      return response.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const itemData = {
        ...formData,
        image: imageUrl,
        price: Number(formData.price)
      };

      onSave(itemData);
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCustomization = () => {
    const newCustomization: CustomizationOption = {
      id: Date.now().toString(),
      name: '',
      type: 'select',
      options: [''],
      required: false,
      additionalPrice: 0
    };
    setFormData(prev => ({
      ...prev,
      customizations: [...prev.customizations, newCustomization]
    }));
  };

  const updateCustomization = (index: number, updates: Partial<CustomizationOption>) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) => 
        i === index ? { ...custom, ...updates } : custom
      )
    }));
  };

  const removeCustomization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }));
  };

  const addOption = (customIndex: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) => 
        i === customIndex 
          ? { ...custom, options: [...custom.options, ''] }
          : custom
      )
    }));
  };

  const updateOption = (customIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) => 
        i === customIndex 
          ? { 
              ...custom, 
              options: custom.options.map((opt, j) => j === optionIndex ? value : opt)
            }
          : custom
      )
    }));
  };

  const removeOption = (customIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) => 
        i === customIndex 
          ? { ...custom, options: custom.options.filter((_, j) => j !== optionIndex) }
          : custom
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {item ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input"
                      placeholder="Item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    placeholder="Item description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input"
                      placeholder="e.g., Coffee, Tea, Pastry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <select
                      value={formData.available.toString()}
                      onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.value === 'true' }))}
                      className="input"
                    >
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        id="image-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </label>
                    </div>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                    )}
                  </div>
                </div>

                {/* Customizations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Customizations
                    </label>
                    <button
                      type="button"
                      onClick={addCustomization}
                      className="btn-secondary text-xs flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.customizations.map((customization, index) => (
                      <div key={customization.id} className="border rounded-md p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Customization name"
                            value={customization.name}
                            onChange={(e) => updateCustomization(index, { name: e.target.value })}
                            className="input text-sm"
                          />
                          <select
                            value={customization.type}
                            onChange={(e) => updateCustomization(index, { type: e.target.value as any })}
                            className="input text-sm"
                          >
                            <option value="select">Single Select</option>
                            <option value="multiselect">Multi Select</option>
                            <option value="text">Text Input</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={customization.required}
                              onChange={(e) => updateCustomization(index, { required: e.target.checked })}
                              className="h-4 w-4 text-primary-600 rounded border-gray-300"
                            />
                            <label className="ml-2 text-sm text-gray-700">Required</label>
                          </div>
                          <input
                            type="number"
                            placeholder="Additional price"
                            min="0"
                            step="0.01"
                            value={customization.additionalPrice || 0}
                            onChange={(e) => updateCustomization(index, { additionalPrice: parseFloat(e.target.value) || 0 })}
                            className="input text-sm"
                          />
                        </div>

                        {customization.type !== 'text' && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-600">Options:</span>
                              <button
                                type="button"
                                onClick={() => addOption(index)}
                                className="text-xs text-primary-600 hover:text-primary-800"
                              >
                                + Add Option
                              </button>
                            </div>
                            <div className="space-y-1">
                              {customization.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    placeholder="Option value"
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    className="input text-xs flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index, optionIndex)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => removeCustomization(index)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving || uploading}
                className="btn-primary sm:ml-3 sm:w-auto w-full disabled:opacity-50"
              >
                {saving ? 'Saving...' : uploading ? 'Uploading...' : (item ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary mt-3 sm:mt-0 sm:w-auto w-full"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;