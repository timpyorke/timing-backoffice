import { useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import { MenuItem } from '@/types';

interface MenuItemCache {
  [id: string]: MenuItem;
}

export const useMenuItems = () => {
  const [menuItemCache, setMenuItemCache] = useState<MenuItemCache>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const getMenuItemById = useCallback(async (id: string): Promise<MenuItem | null> => {
    if (!id) {
      console.log('getMenuItemById: No ID provided');
      return null;
    }

    console.log(`getMenuItemById: Fetching menu item ${id}`);

    // Return cached item if available
    if (menuItemCache[id]) {
      console.log(`getMenuItemById: Found cached item ${id}:`, menuItemCache[id]);
      return menuItemCache[id];
    }

    // Check if already loading this item
    if (loadingItems.has(id)) {
      console.log(`getMenuItemById: Already loading item ${id}`);
      return null;
    }

    // Add to loading set
    setLoadingItems(prev => new Set(prev).add(id));

    try {
      console.log(`getMenuItemById: Making API call for item ${id}`);
      const menuItem = await apiService.getMenuItemById(id);
      console.log(`getMenuItemById: API response for ${id}:`, menuItem);
      
      // Cache the result
      setMenuItemCache(prev => ({
        ...prev,
        [id]: menuItem
      }));

      return menuItem;
    } catch (error) {
      console.error(`Failed to fetch menu item ${id}:`, error);
      return null;
    } finally {
      // Remove from loading set
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [menuItemCache, loadingItems]);

  const getMenuItemName = useCallback(async (menuId: number | string): Promise<string> => {
    if (!menuId) return 'Unknown Item';
    
    const id = menuId.toString();
    
    // Check cache first
    if (menuItemCache[id]) {
      return menuItemCache[id].name_en || menuItemCache[id].name || 'Unknown Item';
    }

    // If not in cache, try to fetch
    const menuItem = await getMenuItemById(id);
    return menuItem?.name_en || menuItem?.name || `Menu Item #${menuId}`;
  }, [menuItemCache, getMenuItemById]);

  const getMenuItemNameSync = useCallback((menuId: number | string): string => {
    if (!menuId) {
      console.log('getMenuItemNameSync: No menuId provided');
      return 'Unknown Item';
    }
    
    const id = menuId.toString();
    console.log(`getMenuItemNameSync: Looking for menu item ${id}`);
    console.log('getMenuItemNameSync: Current cache:', menuItemCache);
    
    const cachedItem = menuItemCache[id];
    
    if (cachedItem) {
      const name = cachedItem.name_en || cachedItem.name || 'Unknown Item';
      console.log(`getMenuItemNameSync: Found cached item ${id}:`, name);
      return name;
    }

    console.log(`getMenuItemNameSync: Item ${id} not cached, triggering fetch`);
    // If not cached, trigger async fetch but return fallback
    getMenuItemById(id);
    return `Menu Item #${menuId}`;
  }, [menuItemCache, getMenuItemById]);

  const preloadMenuItems = useCallback(async (ids: (string | number)[], batchSize = 10): Promise<void> => {
    console.log('preloadMenuItems: Called with IDs:', ids);
    console.log('preloadMenuItems: Current cache:', menuItemCache);
    console.log('preloadMenuItems: Currently loading:', Array.from(loadingItems));

    const idsToFetch = ids
      .map(id => id.toString())
      .filter(id => !menuItemCache[id] && !loadingItems.has(id));

    console.log('preloadMenuItems: IDs to fetch:', idsToFetch);

    if (idsToFetch.length === 0) {
      console.log('preloadMenuItems: No new items to fetch');
      return;
    }

    setLoadingItems(prev => {
      const newSet = new Set(prev);
      idsToFetch.forEach(id => newSet.add(id));
      return newSet;
    });

    try {
      for (let i = 0; i < idsToFetch.length; i += batchSize) {
        const batch = idsToFetch.slice(i, i + batchSize);
        console.log(`Preloading batch: ${batch.join(', ')}`);
        
        const fetchPromises = batch.map(async (id) => {
          try {
            const menuItem = await apiService.getMenuItemById(id);
            return { id, menuItem };
          } catch (error) {
            console.error(`Failed to fetch menu item ${id}:`, error);
            return { id, menuItem: null };
          }
        });

        const results = await Promise.all(fetchPromises);

        setMenuItemCache(prev => {
          const newCache = { ...prev };
          results.forEach(({ id, menuItem }) => {
            if (menuItem) {
              newCache[id] = menuItem;
            }
          });
          return newCache;
        });
      }
    } catch (error) {
      console.error('Failed to preload menu items:', error);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        idsToFetch.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [menuItemCache, loadingItems]);

  const clearCache = useCallback(() => {
    setMenuItemCache({});
    setLoadingItems(new Set());
  }, []);

  return {
    getMenuItemById,
    getMenuItemName,
    getMenuItemNameSync,
    preloadMenuItems,
    clearCache,
    isLoading: (id: string) => loadingItems.has(id),
    getCachedItem: (id: string) => menuItemCache[id] || null,
  };
};