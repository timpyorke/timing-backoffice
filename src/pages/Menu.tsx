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

const Menu: React.FC = () => {
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
      const items = await apiService.getMenuItems();
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
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteMenuItem(item.id);
      setMenuItems(prev => prev.filter(i => i.id !== item.id));
      toast.success('Menu item deleted successfully');
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updatedItem = await apiService.updateMenuItem(item.id, {
        ...item,
        available: !item.available
      });
      setMenuItems(prev => 
        prev.map(i => i.id === item.id ? updatedItem : i)
      );
      toast.success(`${item.name} is now ${!item.available ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Failed to update menu item:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleSaveItem = async (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingItem) {
        const updatedItem = await apiService.updateMenuItem(editingItem.id, itemData);
        setMenuItems(prev => 
          prev.map(i => i.id === editingItem.id ? updatedItem : i)
        );
        toast.success('Menu item updated successfully');
      } else {
        const newItem = await apiService.createMenuItem(itemData);
        setMenuItems(prev => [...prev, newItem]);
        toast.success('Menu item created successfully');
      }
      setModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to save menu item:', error);
      toast.error('Failed to save menu item');
    }
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && item.available) ||
                               (availabilityFilter === 'unavailable' && !item.available);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
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
              <option value="all">All Categories</option>
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
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            {filteredItems.length} of {menuItems.length} items
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="h-48 bg-gray-200 relative">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}
              
              {/* Availability overlay */}
              {!item.available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold">UNAVAILABLE</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                <span className="text-lg font-bold text-primary-600">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {item.category}
                </span>
                <div className="flex items-center space-x-1">
                  {item.available ? (
                    <>
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">Available</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">Unavailable</span>
                    </>
                  )}
                </div>
              </div>

              {/* Customizations */}
              {item.customizations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Customizations:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.customizations.map((custom) => (
                      <span
                        key={custom.id}
                        className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded"
                      >
                        {custom.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`flex-1 btn ${
                    item.available 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.available ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items found</h3>
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
                    Add Menu Item
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