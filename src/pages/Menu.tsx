import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { MenuItem } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import MenuItemModal from '@/components/MenuItemModal';
import NoBackendMessage from '@/components/NoBackendMessage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMenuItemName, getMenuItemDescription, getMenuItemCategory } from '@/utils/localization';

const Menu: React.FC = () => {
  const { t, language } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [apiError, setApiError] = useState(false);

  const fetchMenuItems = async () => {
    try {
      const response = await apiService.getMenuItems();
      console.log('API Response:', response); // Debug log
      
      // Handle different response structures
      let items: MenuItem[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object') {
        const responseObj = response as any;
        if (Array.isArray(responseObj.data)) {
          items = responseObj.data;
        } else if (responseObj.items && Array.isArray(responseObj.items)) {
          items = responseObj.items;
        } else {
          console.warn('Unexpected response structure:', response);
          items = [];
        }
      } else {
        console.warn('Unexpected response type:', typeof response);
        items = [];
      }
      
      setMenuItems(items);
      setApiError(false);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setApiError(true);
      toast.error('No backend API available. Please start your API server.');
      // Set empty menu items instead of failing
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`${t('common.delete')} "${item.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteMenuItem(item.id);
      setMenuItems(prev => prev.filter(i => i.id !== item.id));
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      toast.error(t('common.error'));
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updatedItem = await apiService.updateMenuItem(item.id, {
        ...item,
        active: !item.active
      });
      setMenuItems(prev => 
        prev.map(i => i.id === item.id ? updatedItem : i)
      );
      toast.success(`${item.name} is now ${!item.active ? t('menu.available') : t('menu.unavailable')}`);
    } catch (error) {
      console.error('Failed to update menu item:', error);
      toast.error(t('common.error'));
    }
  };

  const handleSaveItem = async (itemData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingItem) {
        const updatedItem = await apiService.updateMenuItem(editingItem.id, itemData);
        setMenuItems(prev => 
          prev.map(i => i.id === editingItem.id ? updatedItem : i)
        );
        toast.success(t('common.success'));
      } else {
        const newItem = await apiService.createMenuItem(itemData);
        setMenuItems(prev => [...prev, newItem]);
        toast.success(t('common.success'));
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to save menu item:', error);
      toast.error(t('common.error'));
    }
  };

  const categories = Array.isArray(menuItems) ? [...new Set(menuItems.map(item => 
    getMenuItemCategory(item, language)
  ).filter(category => category))] : [];

  const filteredItems = Array.isArray(menuItems) ? menuItems.filter(item => {
    const name = getMenuItemName(item, language);
    const description = getMenuItemDescription(item, language);
    const category = getMenuItemCategory(item, language);
    
    const matchesSearch = (name && name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (description && description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && item.active) ||
                               (availabilityFilter === 'unavailable' && !item.active);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('menu.title')}</h1>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t('menu.addItem')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('menu.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="all">{t('menu.allCategories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="input"
          >
            <option value="all">{t('menu.allItems')}</option>
            <option value="available">{t('menu.availableOnly')}</option>
            <option value="unavailable">{t('menu.unavailableOnly')}</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            {filteredItems.length} of {menuItems.length} items
          </div>
        </div>
      </div>

      {/* Menu Items Grid - optimized for tablets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="card overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
            {/* Image */}
            <div className="h-48 bg-gray-200 relative overflow-hidden">
              {(item.image_url) ? (
                <img
                  src={item.image_url}
                  alt={getMenuItemName(item, language)}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-100">
                          <span class="text-gray-400 text-sm">Image not found</span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
              
              {/* Availability overlay */}
              {!item.active && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <EyeOff className="h-8 w-8 text-white mx-auto mb-2" />
                    <span className="text-white font-semibold text-sm">{t('menu.unavailableLabel')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{getMenuItemName(item, language)}</h3>
                <span className="text-lg font-bold text-primary-600">
                  ฿{Number(item.base_price).toFixed(2)}
                </span>
              </div>
              
              {(() => {
                const description = getMenuItemDescription(item, language);
                return description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {description}
                  </p>
                );
              })()}
              
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {getMenuItemCategory(item, language)}
                </span>
                <div className="flex items-center space-x-1">
                  {item.active ? (
                    <>
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">{t('menu.available')}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">{t('menu.unavailable')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Customizations */}
              {item.customizations && Object.keys(item.customizations).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Customizations:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.customizations).map(([key, values]) => (
                      values && values.length > 0 && (
                        <span
                          key={key}
                          className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded"
                        >
                          {key}: {values.join(', ')}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto flex space-x-2">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`flex-1 btn tap-target ${
                    item.active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      {t('menu.hide')}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('menu.show')}
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 tap-target"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 tap-target"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <>
          {apiError ? (
            <NoBackendMessage />
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('menu.noItems')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all' || availabilityFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by creating your first menu item.'
                }
              </p>
              {!searchTerm && categoryFilter === 'all' && availabilityFilter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={handleCreate}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('menu.addItem')}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <MenuItemModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        item={editingItem}
      />
    </div>
  );
};

export default Menu;
