import { Cell, SortDirection } from '../types/spreadsheet';
import { getCellKey, evaluateFormula } from './formulaEngine';

export function getSortedRowIndices(
  rows: number,
  column: number,
  direction: SortDirection,
  cells: { [key: string]: Cell }
): number[] {
  if (direction === null) {
    return Array.from({ length: rows }, (_, i) => i);
  }

  const rowIndices = Array.from({ length: rows }, (_, i) => i);

  return rowIndices.sort((a, b) => {
    const keyA = getCellKey(a, column);
    const keyB = getCellKey(b, column);

    const cellA = cells[keyA];
    const cellB = cells[keyB];

    let valueA: string | number = '';
    let valueB: string | number = '';

    if (cellA) {
      if (cellA.formula) {
        valueA = evaluateFormula(cellA.formula, cells, keyA);
      } else {
        valueA = cellA.value;
      }
    }

    if (cellB) {
      if (cellB.formula) {
        valueB = evaluateFormula(cellB.formula, cells, keyB);
      } else {
        valueB = cellB.value;
      }
    }

    const numA = Number(valueA);
    const numB = Number(valueB);

    const isNumA = !isNaN(numA) && valueA !== '';
    const isNumB = !isNaN(numB) && valueB !== '';

    if (isNumA && isNumB) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }

    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();

    if (strA < strB) return direction === 'asc' ? -1 : 1;
    if (strA > strB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function getNextSortDirection(current: SortDirection): SortDirection {
  if (current === null) return 'asc';
  if (current === 'asc') return 'desc';
  return null;
}
