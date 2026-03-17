import { Cell } from '../types/spreadsheet';
import { getCellKey, evaluateFormula } from './formulaEngine';

export function getUniqueValuesForColumn(
  rows: number,
  column: number,
  cells: { [key: string]: Cell }
): string[] {
  const values = new Set<string>();

  for (let row = 0; row < rows; row++) {
    const key = getCellKey(row, column);
    const cell = cells[key];

    let value: string | number = '';

    if (cell) {
      if (cell.formula) {
        value = evaluateFormula(cell.formula, cells, key);
      } else {
        value = cell.value;
      }
    }

    values.add(String(value));
  }

  return Array.from(values).sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    return a.localeCompare(b);
  });
}

export function getFilteredRows(
  rows: number,
  filters: Map<number, Set<string>>,
  cells: { [key: string]: Cell }
): Set<number> {
  const hiddenRows = new Set<number>();

  if (filters.size === 0) {
    return hiddenRows;
  }

  for (let row = 0; row < rows; row++) {
    let shouldHide = false;

    for (const [column, allowedValues] of filters.entries()) {
      if (allowedValues.size === 0) continue;

      const key = getCellKey(row, column);
      const cell = cells[key];

      let value: string | number = '';

      if (cell) {
        if (cell.formula) {
          value = evaluateFormula(cell.formula, cells, key);
        } else {
          value = cell.value;
        }
      }

      if (!allowedValues.has(String(value))) {
        shouldHide = true;
        break;
      }
    }

    if (shouldHide) {
      hiddenRows.add(row);
    }
  }

  return hiddenRows;
}
