import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { SUBCATEGORIES } from "@/lib/subcategories";

interface FunctionalSubcategoryFilterProps {
  category: string;
  onSubcategoryChange: (subcategoryId: string) => void;
  selectedSubcategory?: string;
}

export default function FunctionalSubcategoryFilter({
  category,
  onSubcategoryChange,
  selectedSubcategory,
}: FunctionalSubcategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(selectedSubcategory || "");

  const subcategories = category ? SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] || [] : [];

  useEffect(() => {
    setSelected(selectedSubcategory || "");
  }, [selectedSubcategory]);

  const handleSelect = (subcategoryId: string) => {
    setSelected(subcategoryId);
    onSubcategoryChange(subcategoryId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected("");
    onSubcategoryChange("");
  };

  const selectedLabel = subcategories.find((sub) => sub.id === selected)?.name || "All Subcategories";

  if (!category || subcategories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-green-500 transition-colors focus:outline-none focus:border-green-500"
      >
        <span className="text-gray-700 font-medium">{selectedLabel}</span>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          )}
          <ChevronDown
            size={20}
            className={`text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-10">
          <div className="p-2 max-h-64 overflow-y-auto">
            {/* All Subcategories Option */}
            <button
              onClick={() => handleSelect("")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selected === ""
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Subcategories
            </button>

            {/* Subcategory Options */}
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSelect(sub.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selected === sub.id
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
