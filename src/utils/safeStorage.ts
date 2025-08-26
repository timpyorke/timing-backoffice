// A safe wrapper around localStorage that avoids crashes in Safari Private Mode
// Falls back to in-memory storage if localStorage is unavailable or throws

const memoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (hasLocalStorage) return window.localStorage.getItem(key);
    } catch {}
    return memoryStore.has(key) ? (memoryStore.get(key) as string) : null;
  },
  setItem(key: string, value: string): void {
    try {
      if (hasLocalStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore.set(key, value);
  },
  removeItem(key: string): void {
    try {
      if (hasLocalStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStore.delete(key);
  }
};

