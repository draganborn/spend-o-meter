import { useState, useCallback } from 'react';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    if ('localStorage' in window) {
      return window.localStorage;
    }
  } catch (error) {
    console.warn('localStorage is not accessible:', error);
  }
  return null;
};

const storage = getStorage();

export const safeStorage = {
  getItem(key, fallback = null) {
    if (!storage) return fallback;
    try {
      const value = storage.getItem(key);
      return value ?? fallback;
    } catch (error) {
      console.warn('localStorage get failed:', error);
      return fallback;
    }
  },
  setItem(key, value) {
    if (!storage) return;
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage set failed:', error);
    }
  },
  getJSON(key, fallback = null) {
    try {
      const raw = this.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('localStorage JSON parse failed:', error);
      return fallback;
    }
  },
  setJSON(key, data) {
    try {
      this.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('localStorage JSON stringify failed:', error);
    }
  },
};

export const usePersistentState = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const stored = safeStorage.getItem(key);
    if (stored !== null && stored !== undefined) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  const updateValue = useCallback(
    newValue => {
      setValue(prev => {
        const resolved = typeof newValue === 'function' ? newValue(prev) : newValue;
        safeStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key],
  );

  return [value, updateValue];
};
