import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, RotateCw, Save, Trash2 } from 'lucide-react';
import { Cell as CellType, Selection, ColumnSort, SortDirection, HistoryState } from '../types/spreadsheet';
import { getCellKey } from '../utils/formulaEngine';
import { getSortedRowIndices, getNextSortDirection } from '../utils/sorting';
import { getUniqueValuesForColumn, getFilteredRows } from '../utils/filtering';
import { copyToClipboard, parseClipboardData, pasteData } from '../utils/clipboard';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage, debounce } from '../utils/storage';
import Cell from './Cell';
import ColumnHeader from './ColumnHeader';

const INITIAL_ROWS = 20;
const INITIAL_COLS = 10;

export default function Spreadsheet() {
  const [cells, setCells] = useState<{ [key: string]: CellType }>({});
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [cols, setCols] = useState(INITIAL_COLS);
  const [selection, setSelection] = useState<Selection>({
    start: { row: 0, col: 0 },
    end: { row: 0, col: 0 },
  });
  const [sortConfig, setSortConfig] = useState<ColumnSort | null>(null);
  const [filters, setFilters] = useState<Map<number, Set<string>>>(new Map());
  const [hiddenRows, setHiddenRows] = useState<Set<number>>(new Set());

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setCells(savedData.cells);
      setRows(savedData.rows);
      setCols(savedData.cols);

      const initialState: HistoryState = {
        cells: savedData.cells,
        rows: savedData.rows,
        cols: savedData.cols,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    } else {
      const initialState: HistoryState = {
        cells: {},
        rows: INITIAL_ROWS,
        cols: INITIAL_COLS,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  const debouncedSave = useCallback(
    debounce((cellsToSave: { [key: string]: CellType }, rowsToSave: number, colsToSave: number) => {
      saveToLocalStorage(cellsToSave, rowsToSave, colsToSave);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSave(cells, rows, cols);
  }, [cells, rows, cols, debouncedSave]);

  const addToHistory = (newCells: { [key: string]: CellType }, newRows: number, newCols: number) => {
    const newState: HistoryState = {
      cells: { ...newCells },
      rows: newRows,
      cols: newCols,
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > 50) {
      newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setCells(prevState.cells);
      setRows(prevState.rows);
      setCols(prevState.cols);
      setHistoryIndex(prevIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setCells(nextState.cells);
      setRows(nextState.rows);
      setCols(nextState.cols);
      setHistoryIndex(nextIndex);
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const key = getCellKey(row, col);
    const newCells = { ...cells };

    if (value === '') {
      delete newCells[key];
    } else {
      newCells[key] = {
        value,
        ...(cells[key] || {}),
      };

      if (value.startsWith('=')) {
        newCells[key].formula = value;
      } else {
        delete newCells[key].formula;
      }
    }

    setCells(newCells);
    addToHistory(newCells, rows, cols);
  };

  const handleSelect = (row: number, col: number, extend: boolean) => {
    if (extend) {
      setSelection({
        start: selection.start,
        end: { row, col },
      });
    } else {
      setSelection({
        start: { row, col },
        end: { row, col },
      });
    }
  };

  const handleNavigate = (direction: 'up' | 'down' | 'left' | 'right') => {
    let { row, col } = selection.end;

    switch (direction) {
      case 'up':
        row = Math.max(0, row - 1);
        break;
      case 'down':
        row = Math.min(rows - 1, row + 1);
        break;
      case 'left':
        col = Math.max(0, col - 1);
        break;
      case 'right':
        col = Math.min(cols - 1, col + 1);
        break;
    }

    setSelection({
      start: { row, col },
      end: { row, col },
    });
  };

  const handleSort = (column: number) => {
    const currentDirection = sortConfig?.column === column ? sortConfig.direction : null;
    const newDirection = getNextSortDirection(currentDirection);

    if (newDirection === null) {
      setSortConfig(null);
    } else {
      setSortConfig({ column, direction: newDirection });
    }
  };

  const handleFilter = (column: number, values: Set<string>) => {
    const newFilters = new Map(filters);

    if (values.size === 0) {
      newFilters.delete(column);
    } else {
      newFilters.set(column, values);
    }

    setFilters(newFilters);
    setHiddenRows(getFilteredRows(rows, newFilters, cells));
  };

  const handleCopy = async () => {
    const { start, end } = selection;
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);

    await copyToClipboard(startRow, startCol, endRow, endCol, cells);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = parseClipboardData(text);

      const { start } = selection;
      const newCells = pasteData(data, start.row, start.col, cells, rows, cols);

      setCells(newCells);
      addToHistory(newCells, rows, cols);
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      const newCells = {};
      setCells(newCells);
      setSortConfig(null);
      setFilters(new Map());
      setHiddenRows(new Set());
      addToHistory(newCells, rows, cols);
      clearLocalStorage();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, cells, rows, cols, historyIndex, history]);

  useEffect(() => {
    setHiddenRows(getFilteredRows(rows, filters, cells));
  }, [filters, cells, rows]);

  const sortedRowIndices = sortConfig
    ? getSortedRowIndices(rows, sortConfig.column, sortConfig.direction, cells)
    : Array.from({ length: rows }, (_, i) => i);

  const visibleRowIndices = sortedRowIndices.filter(rowIndex => !hiddenRows.has(rowIndex));

  const isSelected = (row: number, col: number) => {
    const { start, end } = selection;
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-300 p-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Spreadsheet</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={() => debouncedSave.cancel && saveToLocalStorage(cells, rows, cols)}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-2"
            title="Save now"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <button
            onClick={handleClearAll}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center gap-2"
            title="Clear all data"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="inline-block min-w-full">
          <div className="flex">
            <div className="border-r border-b border-gray-300 bg-gray-200 w-[50px] h-[30px]"></div>
            {Array.from({ length: cols }).map((_, col) => (
              <ColumnHeader
                key={col}
                col={col}
                sortDirection={sortConfig?.column === col ? sortConfig.direction : null}
                hasFilter={filters.has(col)}
                onSort={() => handleSort(col)}
                onFilter={(values) => handleFilter(col, values)}
                uniqueValues={getUniqueValuesForColumn(rows, col, cells)}
                selectedValues={filters.get(col) || new Set()}
              />
            ))}
          </div>

          {visibleRowIndices.map((rowIndex) => (
            <div key={rowIndex} className="flex">
              <div className="border-r border-b border-gray-300 bg-gray-100 w-[50px] h-[30px] flex items-center justify-center text-sm font-medium">
                {rowIndex + 1}
              </div>
              {Array.from({ length: cols }).map((_, col) => {
                const key = getCellKey(rowIndex, col);
                return (
                  <Cell
                    key={key}
                    cell={cells[key]}
                    row={rowIndex}
                    col={col}
                    isSelected={isSelected(rowIndex, col)}
                    onCellChange={handleCellChange}
                    onSelect={handleSelect}
                    onNavigate={handleNavigate}
                    cells={cells}
                    cellKey={key}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-300 p-2 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Selected: {getCellKey(selection.start.row, selection.start.col).replace(',', ', ')}
          </span>
          <span>Rows: {visibleRowIndices.length} / {rows}</span>
          <span>Columns: {cols}</span>
          <span className="text-gray-400">
            Ctrl+C: Copy | Ctrl+V: Paste | Ctrl+Z: Undo | Ctrl+Y: Redo
          </span>
        </div>
      </div>
    </div>
  );
}
