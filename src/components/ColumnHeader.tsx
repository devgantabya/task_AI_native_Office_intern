import { useState } from 'react';
import { ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { SortDirection } from '../types/spreadsheet';
import { getColumnLabel } from '../utils/formulaEngine';
import FilterDropdown from './FilterDropdown';

interface ColumnHeaderProps {
  col: number;
  sortDirection: SortDirection;
  hasFilter: boolean;
  onSort: () => void;
  onFilter: (values: Set<string>) => void;
  uniqueValues: string[];
  selectedValues: Set<string>;
}

export default function ColumnHeader({
  col,
  sortDirection,
  hasFilter,
  onSort,
  onFilter,
  uniqueValues,
  selectedValues,
}: ColumnHeaderProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <div className="border-r border-b border-gray-300 bg-gray-100 min-w-[100px] h-[30px] font-semibold relative flex items-center justify-between px-2">
      <span className="text-sm">{getColumnLabel(col)}</span>

      <div className="flex items-center gap-1">
        <button
          onClick={onSort}
          className="p-1 hover:bg-gray-200 rounded"
          title="Sort column"
        >
          {sortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
          {sortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
          {sortDirection === null && <div className="w-3 h-3"></div>}
        </button>

        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`p-1 hover:bg-gray-200 rounded ${hasFilter ? 'text-blue-600' : ''}`}
          title="Filter column"
        >
          <Filter className="w-3 h-3" />
        </button>
      </div>

      {showFilterDropdown && (
        <FilterDropdown
          uniqueValues={uniqueValues}
          selectedValues={selectedValues}
          onFilterChange={onFilter}
          onClose={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  );
}
