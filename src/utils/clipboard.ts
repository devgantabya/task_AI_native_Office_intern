import { Cell } from '../types/spreadsheet';
import { getCellKey, evaluateFormula } from './formulaEngine';

export interface ClipboardData {
  data: string[][];
  isInternal: boolean;
}

export async function copyToClipboard(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cells: { [key: string]: Cell }
): Promise<void> {
  const rows: string[][] = [];

  for (let r = startRow; r <= endRow; r++) {
    const row: string[] = [];
    for (let c = startCol; c <= endCol; c++) {
      const key = getCellKey(r, c);
      const cell = cells[key];

      let value = '';
      if (cell) {
        if (cell.formula) {
          const computed = evaluateFormula(cell.formula, cells, key);
          value = String(computed);
        } else {
          value = cell.value;
        }
      }

      row.push(value);
    }
    rows.push(row);
  }

  const text = rows.map(row => row.join('\t')).join('\n');

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

export function parseClipboardData(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map(line => line.split('\t'));
}

export function pasteData(
  data: string[][],
  startRow: number,
  startCol: number,
  cells: { [key: string]: Cell },
  maxRows: number,
  maxCols: number
): { [key: string]: Cell } {
  const newCells = { ...cells };

  for (let r = 0; r < data.length; r++) {
    const targetRow = startRow + r;
    if (targetRow >= maxRows) break;

    for (let c = 0; c < data[r].length; c++) {
      const targetCol = startCol + c;
      if (targetCol >= maxCols) break;

      const key = getCellKey(targetRow, targetCol);
      const value = data[r][c];

      if (value === '') {
        delete newCells[key];
      } else {
        newCells[key] = {
          value,
          ...(newCells[key] || {}),
        };

        if (value.startsWith('=')) {
          newCells[key].formula = value;
        } else {
          delete newCells[key].formula;
        }
      }
    }
  }

  return newCells;
}
