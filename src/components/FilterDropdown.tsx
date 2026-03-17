import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface FilterDropdownProps {
  uniqueValues: string[];
  selectedValues: Set<string>;
  onFilterChange: (values: Set<string>) => void;
  onClose: () => void;
}

export default function FilterDropdown({
  uniqueValues,
  selectedValues,
  onFilterChange,
  onClose,
}: FilterDropdownProps) {
  const [localSelection, setLocalSelection] = useState(new Set(selectedValues));
  const [selectAll, setSelectAll] = useState(selectedValues.size === 0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleToggleValue = (value: string) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(value)) {
      newSelection.delete(value);
    } else {
      newSelection.add(value);
    }
    setLocalSelection(newSelection);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setLocalSelection(new Set());
      setSelectAll(false);
    } else {
      setLocalSelection(new Set());
      setSelectAll(true);
    }
  };

  const handleApply = () => {
    if (selectAll) {
      onFilterChange(new Set());
    } else {
      onFilterChange(localSelection);
    }
    onClose();
  };

  const handleClear = () => {
    setLocalSelection(new Set());
    setSelectAll(true);
    onFilterChange(new Set());
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 w-64"
    >
      <div className="p-2 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-2 max-h-64 overflow-y-auto">
        <label className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
          <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center">
            {selectAll && <Check className="w-3 h-3 text-blue-500" />}
          </div>
          <span className="text-sm font-medium" onClick={handleSelectAll}>
            Select All
          </span>
        </label>

        <div className="border-t border-gray-200 my-2"></div>

        {uniqueValues.map((value, index) => {
          const isChecked = selectAll || localSelection.has(value);
          return (
            <label
              key={index}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
            >
              <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center">
                {isChecked && <Check className="w-3 h-3 text-blue-500" />}
              </div>
              <span className="text-sm" onClick={() => handleToggleValue(value)}>
                {value || '(blank)'}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
