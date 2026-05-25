import { useState, useEffect } from "react";

interface FilterState {
  [key: string]: any;
}

const STORAGE_KEY_PREFIX = "marketplace_filters_";

/**
 * Hook for persisting filter state to localStorage
 * Automatically saves and restores filter values
 */
export function useFilterPersistence<T extends FilterState>(
  filterId: string,
  initialFilters: T
): [T, (filters: T) => void] {
  const [filters, setFilters] = useState<T>(() => {
    // Try to restore from localStorage
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${filterId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return { ...initialFilters, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to restore filters from localStorage:", error);
    }
    return initialFilters;
  });

  // Save to localStorage whenever filters change
  useEffect(() => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${filterId}`;
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error);
    }
  }, [filters, filterId]);

  return [filters, setFilters];
}

/**
 * Clear saved filters for a specific filter ID
 */
export function clearSavedFilters(filterId: string): void {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${filterId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear saved filters:", error);
  }
}

/**
 * Clear all saved filters
 */
export function clearAllSavedFilters(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear all saved filters:", error);
  }
}
