import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/types';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/services/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => void;
  item?: MenuItem | null;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name_en: '',
    name_th: '',
    description_en: '',
    description_th: '',
    base_price: 0,
    category_en: '',
    category_th: '',
    image_url: '',
    active: true,
    customizations: {} as { [id: string]: { name: string; options: string[] } }
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name_en: item.name_en || item.name || '',
        name_th: item.name_th || item.name || '',
        description_en: item.description_en || item.description || '',
        description_th: item.description_th || item.description || '',
        base_price: item.base_price,
        category_en: item.category_en || item.category || '',
        category_th: item.category_th || item.category || '',
        image_url: item.image_url || '',
        active: item.active,
        customizations: Object.fromEntries(
          Object.entries(item.customizations || {}).map(([k, v], index) => [
            `customization_${index}_${k}`, 
            { name: k, options: v ?? [] }
          ])
        )
      });
      setImagePreview(item.image_url || '');
    } else {
      setFormData({
        name_en: '',
        name_th: '',
        description_en: '',
        description_th: '',
        base_price: 0,
        category_en: '',
        category_th: '',
        image_url: '',
        active: true,
        customizations: {}
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

  const uploadImageToSupabase = async (): Promise<string> => {
    if (!imageFile) return formData.image_url;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      return imageUrl;
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
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImageToSupabase();
      }

      // Convert customizations back to the expected API format
      const apiCustomizations = Object.fromEntries(
        Object.values(formData.customizations)
          .filter(custom => custom.name.trim()) // Only include customizations with names
          .map(custom => [custom.name, custom.options.filter(opt => opt.trim())]) // Filter out empty options
      );

      const itemData = {
        ...formData,
        image: imageUrl,
        image_url: imageUrl,
        base_price: Number(formData.base_price),
        customizations: apiCustomizations
      };

      onSave(itemData);
    } catch (error) {
      console.error('Failed to save menu item:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCustomization = () => {
    const customizationId = `customization_${Date.now()}`;
    const customizationName = '';
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customizationId]: {
          name: customizationName,
          options: ['']
        }
      }
    }));
  };

  const updateCustomizationName = (customId: string, newName: string) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customId]: {
          ...prev.customizations[customId],
          name: newName
        }
      }
    }));
  };

  const removeCustomization = (key: string) => {
    setFormData(prev => {
      const newCustomizations = { ...prev.customizations };
      delete newCustomizations[key];
      return {
        ...prev,
        customizations: newCustomizations
      };
    });
  };

  const addOption = (customId: string) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customId]: {
          ...prev.customizations[customId],
          options: [...(prev.customizations[customId]?.options || []), '']
        }
      }
    }));
  };

  const updateOption = (customId: string, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customId]: {
          ...prev.customizations[customId],
          options: prev.customizations[customId].options.map((opt, j) => 
            j === optionIndex ? value : opt
          )
        }
      }
    }));
  };

  const removeOption = (customId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [customId]: {
          ...prev.customizations[customId],
          options: prev.customizations[customId].options.filter((_, j) => j !== optionIndex)
        }
      }
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
                  {item ? t('menuForm.editTitle') : t('menuForm.addTitle')}
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
                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('menuForm.nameEn')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                        className="input"
                        placeholder={t('menuForm.nameEnPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('menuForm.nameTh')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name_th}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_th: e.target.value }))}
                        className="input"
                        placeholder={t('menuForm.nameThPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  {/* Base Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('menuForm.basePriceRequired')}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                      className="input"
                      placeholder={t('menuForm.basePricePlaceholder')}
                    />
                  </div>
                </div>

                {/* Description Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('menuForm.descriptionEn')}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                      className="input"
                      placeholder={t('menuForm.descriptionEnPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('menuForm.descriptionTh')}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description_th}
                      onChange={(e) => setFormData(prev => ({ ...prev, description_th: e.target.value }))}
                      className="input"
                      placeholder={t('menuForm.descriptionThPlaceholder')}
                    />
                  </div>
                </div>

                {/* Category Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('menuForm.categoryEn')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_en: e.target.value }))}
                      className="input"
                      placeholder={t('menuForm.categoryEnPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('menuForm.categoryTh')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category_th}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_th: e.target.value }))}
                      className="input"
                      placeholder={t('menuForm.categoryThPlaceholder')}
                    />
                  </div>
                </div>
                
                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('menuForm.availability')}
                  </label>
                  <select
                    value={formData.active.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                    className="input"
                  >
                    <option value="true">{t('menuForm.active')}</option>
                    <option value="false">{t('menuForm.inactive')}</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('menuForm.image')}
                  </label>
                  
                  {/* Image URL Input */}
                  <div className="mb-3">
                    <input
                      type="url"
                      placeholder={t('menuForm.imageUrl')}
                      value={formData.image_url}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, image_url: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="input w-full"
                    />
                  </div>

                  {/* File Upload */}
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
                        {t('menuForm.uploadImage')}
                      </label>
                      <span className="ml-2 text-xs text-gray-500">{t('menuForm.orEnterUrl')}</span>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover object-center rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormData(prev => ({ ...prev, image_url: '', image: '' }));
                            setImageFile(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customizations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('menuForm.customizations')}
                    </label>
                    <button
                      type="button"
                      onClick={addCustomization}
                      className="btn-secondary text-xs flex items-center space-x-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{t('menuForm.addCustomization')}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(formData.customizations).map(([customId, customData]) => (
                      <div key={customId} className="border rounded-md p-3">
                        <div className="grid grid-cols-1 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder={t('menuForm.customizationPlaceholder')}
                            value={customData.name}
                            onChange={(e) => updateCustomizationName(customId, e.target.value)}
                            className="input text-sm"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-600">{t('menuForm.options')}</span>
                            <button
                              type="button"
                              onClick={() => addOption(customId)}
                              className="text-xs text-primary-600 hover:text-primary-800"
                            >
                              {t('menuForm.addOption')}
                            </button>
                          </div>
                          <div className="space-y-1">
                            {customData.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder={t('menuForm.optionPlaceholder')}
                                  value={option}
                                  onChange={(e) => updateOption(customId, optionIndex, e.target.value)}
                                  className="input text-xs flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOption(customId, optionIndex)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => removeCustomization(customId)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>{t('menuForm.remove')}</span>
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
                {saving ? t('menuForm.saving') : uploading ? t('menuForm.uploading') : (item ? t('menuForm.update') : t('menuForm.create'))}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary mt-3 sm:mt-0 sm:w-auto w-full"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
