import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface SubcategoryFilter {
  category: string | null;
  subcategory: string | null;
  setCategory: (category: string | null) => void;
  setSubcategory: (subcategory: string | null) => void;
  clearFilters: () => void;
}

export const useSubcategoryFilter = (): SubcategoryFilter => {
  const [location] = useLocation();
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.split('?')[1]);
    const categoryParam = params.get('category');
    const subcategoryParam = params.get('subcategory');

    setCategory(categoryParam);
    setSubcategory(subcategoryParam);
  }, [location]);

  const clearFilters = () => {
    setCategory(null);
    setSubcategory(null);
  };

  return {
    category,
    subcategory,
    setCategory,
    setSubcategory,
    clearFilters,
  };
};
