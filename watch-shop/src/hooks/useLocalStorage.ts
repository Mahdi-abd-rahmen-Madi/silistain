import { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';

type SetValue<T> = (value: T | ((val: T) => T), persistImmediately?: boolean) => void;

interface UseLocalStorageOptions {
  lazy?: boolean; // If true, won't initialize from localStorage on mount
  persistOnUpdate?: boolean; // If false, changes won't be persisted to localStorage
}

export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  options: UseLocalStorageOptions = { lazy: false, persistOnUpdate: true }
): [T, SetValue<T>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    // If lazy loading, don't read from localStorage on initial render
    if (options.lazy) return initialValue;
    
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Function to explicitly load from localStorage
  const loadFromStorage = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
      return value;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that can conditionally persist
  const setValue: SetValue<T> = (value, persistImmediately = options.persistOnUpdate) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Optionally save to local storage
      if (persistImmediately && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Function to explicitly persist the current value to localStorage
  const persistToStorage = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        logger.warn(`Error persisting to localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  // Sync changes across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== JSON.stringify(storedValue)) {
        setStoredValue(JSON.parse(event.newValue || 'null') || initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
