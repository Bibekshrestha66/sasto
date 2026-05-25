import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, TrendingUp, Package } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Autocomplete query
  const { data: autocompleteData, isLoading: isLoadingAutocomplete } = trpc.search.autocomplete.useQuery(
    { query, limit: 10 },
    { enabled: query.length > 0 }
  );

  // Trending searches
  const { data: trendingSearches } = trpc.search.trending.useQuery();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allItems = [
      ...(autocompleteData?.listings || []),
      ...(autocompleteData?.categories || []),
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (allItems.length || 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          const item = allItems[selectedIndex] as any;
          if (item.type === 'listing') {
            navigate(`/listing/${item.id}`);
          } else if (item.type === 'category') {
            navigate(`/marketplace?category=${item.slug}`);
          }
          setIsOpen(false);
          setQuery('');
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // ✅ Changed: use /marketplace?search= instead of /search?q=
  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === 'listing') {
      navigate(`/listing/${item.id}`);
    } else if (item.type === 'category') {
      navigate(`/marketplace?category=${item.slug}`);
    }
    setIsOpen(false);
    setQuery('');
  };

  const allItems = [
    ...(autocompleteData?.listings || []),
    ...(autocompleteData?.categories || []),
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search listings, categories..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        {isLoadingAutocomplete && (
          <Loader2 className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.length > 0 ? (
            <>
              {allItems.length > 0 ? (
                <>
                  {/* Listings Section */}
                  {autocompleteData?.listings && autocompleteData.listings.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        Listings
                      </div>
                      {autocompleteData.listings.map((listing, idx) => (
                        <button
                          key={`listing-${listing.id}`}
                          onClick={() => handleItemClick(listing)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${
                            selectedIndex === idx ? 'bg-green-50' : ''
                          }`}
                        >
                          {listing.image && (
                            <img
                              src={listing.image}
                              alt={listing.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {listing.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Rs. {listing.price?.toLocaleString()} • {listing.location}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Categories Section */}
                  {autocompleteData?.categories && autocompleteData.categories.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        Categories
                      </div>
                      {autocompleteData.categories.map((category, idx) => (
                        <button
                          key={`category-${category.id}`}
                          onClick={() => handleItemClick(category)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${
                            selectedIndex === (autocompleteData.listings?.length || 0) + idx
                              ? 'bg-green-50'
                              : ''
                          }`}
                        >
                          <Package className="w-5 h-5 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <p className="text-sm">No results found for "{query}"</p>
                </div>
              )}
            </>
          ) : (
            // Show trending searches when input is empty
            <>
              {trendingSearches && trendingSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </div>
                  {trendingSearches.map((search, idx) => (
                    <button
                      key={search}
                      onClick={() => {
                        setQuery(search);
                        setIsOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}