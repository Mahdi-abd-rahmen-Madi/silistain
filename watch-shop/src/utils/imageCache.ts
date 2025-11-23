import { ProductImage } from '@/types/product';

const CACHE_PREFIX = 'img-cache-';
const CACHE_VERSION = '1';
const CACHE_EXPIRY_DAYS = 7;

interface CacheEntry {
  url: string;
  timestamp: number;
  data: string; // Base64 encoded image data
}

// Check if browser supports localStorage
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = 'test';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const getCacheKey = (url: string): string => {
  return `${CACHE_PREFIX}${CACHE_VERSION}-${btoa(url)}`;
};

export const cacheImage = async (url: string): Promise<string> => {
  const cacheKey = getCacheKey(url);
  const now = Date.now();
  
  // Try to get from memory cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const entry: CacheEntry = JSON.parse(cached);
    if (now - entry.timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      return entry.data;
    }
  }

  // Try to get from localStorage if available
  if (isLocalStorageAvailable()) {
    const localCached = localStorage.getItem(cacheKey);
    if (localCached) {
      const entry: CacheEntry = JSON.parse(localCached);
      if (now - entry.timestamp < CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
        // Update session storage with the local storage value
        sessionStorage.setItem(cacheKey, localCached);
        return entry.data;
      }
    }
  }

  try {
    // Fetch the image
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const cacheEntry: CacheEntry = {
          url,
          timestamp: now,
          data: dataUrl
        };
        
        // Save to session storage
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        
        // Also save to local storage if available
        if (isLocalStorageAvailable()) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
          } catch (e) {
            // If localStorage is full, remove some old entries
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
              clearOldCacheEntries();
              try {
                localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
              } catch (e) {
                // If still failing, just continue with session storage only
                console.warn('LocalStorage is full, using sessionStorage only');
              }
            }
          }
        }
        
        resolve(dataUrl);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error caching image:', error);
    throw error;
  }
};

const clearOldCacheEntries = () => {
  if (!isLocalStorageAvailable()) return;
  
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) || '{}') as CacheEntry;
        if (now - entry.timestamp > expiryTime) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // If the entry is corrupted, remove it
        if (key) localStorage.removeItem(key);
      }
    }
  }
};

export const getCachedImageUrl = async (image: string | ProductImage | undefined): Promise<string> => {
  if (!image) return '/placeholder-watch.jpg';
  
  let imageUrl: string;
  
  if (typeof image === 'string') {
    imageUrl = image;
  } else if ('url' in image) {
    imageUrl = image.url;
  } else {
    return '/placeholder-watch.jpg';
  }
  
  // Skip cache for local images
  if (imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  try {
    return await cacheImage(imageUrl);
  } catch (error) {
    console.error('Error getting cached image:', error);
    return imageUrl; // Return original URL if caching fails
  }
};
