import { useState, useRef, useEffect } from 'react';
import { Cell as CellType } from '../types/spreadsheet';
import { evaluateFormula } from '../utils/formulaEngine';

interface CellProps {
  cell: CellType | undefined;
  row: number;
  col: number;
  isSelected: boolean;
  onCellChange: (row: number, col: number, value: string) => void;
  onSelect: (row: number, col: number, extend: boolean) => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  cells: { [key: string]: CellType };
  cellKey: string;
}

export default function Cell({
  cell,
  row,
  col,
  isSelected,
  onCellChange,
  onSelect,
  onNavigate,
  cells,
  cellKey,
}: CellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const displayValue = cell
    ? cell.formula
      ? String(evaluateFormula(cell.formula, cells, cellKey))
      : cell.value
    : '';

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(cell?.formula || cell?.value || '');
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (editValue !== (cell?.formula || cell?.value || '')) {
        onCellChange(row, col, editValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        onCellChange(row, col, editValue);
        onNavigate('down');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setEditValue(cell?.formula || cell?.value || '');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setIsEditing(false);
        onCellChange(row, col, editValue);
        onNavigate(e.shiftKey ? 'left' : 'right');
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(true);
        setEditValue(cell?.formula || cell?.value || '');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsEditing(true);
        setEditValue(cell?.formula || cell?.value || '');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onCellChange(row, col, '');
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setIsEditing(true);
        setEditValue(e.key);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('right');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onNavigate(e.shiftKey ? 'left' : 'right');
      }
    }
  };

  return (
    <div
      className={`border-r border-b border-gray-300 min-w-[100px] h-[30px] relative ${
        isSelected ? 'ring-2 ring-blue-500 z-10' : ''
      }`}
      onClick={(e) => onSelect(row, col, e.shiftKey)}
      onDoubleClick={handleDoubleClick}
      style={{
        backgroundColor: cell?.style?.backgroundColor || 'white',
        color: cell?.style?.color || 'black',
        fontWeight: cell?.style?.fontWeight || 'normal',
        fontStyle: cell?.style?.fontStyle || 'normal',
        textAlign: cell?.style?.textAlign || 'left',
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-2 outline-none border-none bg-transparent"
          style={{
            color: cell?.style?.color || 'black',
            fontWeight: cell?.style?.fontWeight || 'normal',
            fontStyle: cell?.style?.fontStyle || 'normal',
            textAlign: cell?.style?.textAlign || 'left',
          }}
        />
      ) : (
        <div
          className="px-2 py-1 overflow-hidden text-ellipsis whitespace-nowrap h-full flex items-center text-sm"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {displayValue}
        </div>
      )}
    </div>
  );
}
