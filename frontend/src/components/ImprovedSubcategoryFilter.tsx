import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  count?: number;
}

interface ImprovedSubcategoryFilterProps {
  category: string;
  subcategories: Subcategory[];
  selectedSubcategory?: string;
  onSubcategoryChange: (subcategory: string | null) => void;
  onApply: () => void;
}

export default function ImprovedSubcategoryFilter({
  category,
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
  onApply,
}: ImprovedSubcategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSubcategories, setFilteredSubcategories] = useState(subcategories);

  useEffect(() => {
    const filtered = subcategories.filter((sub) =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubcategories(filtered);
  }, [searchTerm, subcategories]);

  const selectedSubcategoryName = subcategories.find(
    (sub) => sub.id === selectedSubcategory
  )?.name;

  const handleSelect = (subcategoryId: string) => {
    onSubcategoryChange(subcategoryId);
    setIsOpen(false);
    onApply();
  };

  const handleClear = () => {
    onSubcategoryChange(null);
    setSearchTerm("");
    onApply();
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white border-2 border-green-500 rounded-lg flex items-center justify-between hover:bg-green-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedSubcategoryName ? `Filter: ${selectedSubcategoryName}` : "All Subcategories"}
        </span>
        <ChevronDown
          size={18}
          className={`text-green-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-green-500 rounded-lg shadow-lg z-50">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search subcategories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
            />
          </div>

          {/* Subcategories List */}
          <div className="max-h-64 overflow-y-auto">
            {/* All Subcategories Option */}
            <button
              onClick={handleClear}
              className={`w-full text-left px-4 py-2 hover:bg-green-50 transition-colors flex items-center justify-between ${
                !selectedSubcategory ? "bg-green-100 text-green-700 font-semibold" : ""
              }`}
            >
              <span className="text-sm">All Subcategories</span>
              {!selectedSubcategory && <X size={16} />}
            </button>

            {/* Individual Subcategories */}
            {filteredSubcategories.length > 0 ? (
              filteredSubcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSelect(subcategory.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-green-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                    selectedSubcategory === subcategory.id
                      ? "bg-green-100 text-green-700 font-semibold"
                      : ""
                  }`}
                >
                  <span className="text-sm">{subcategory.name}</span>
                  {subcategory.count && (
                    <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                      {subcategory.count}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                No subcategories found
              </div>
            )}
          </div>

          {/* Clear Selection Button */}
          {selectedSubcategory && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
