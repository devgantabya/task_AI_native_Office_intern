import { Cell } from '../types/spreadsheet';

export function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellReference(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const colStr = match[1];
  const rowStr = match[2];

  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }

  return { row: parseInt(rowStr) - 1, col: col - 1 };
}

export function getColumnLabel(col: number): string {
  let label = '';
  let num = col + 1;

  while (num > 0) {
    num--;
    label = String.fromCharCode(65 + (num % 26)) + label;
    num = Math.floor(num / 26);
  }

  return label;
}

export function getCellReference(row: number, col: number): string {
  return `${getColumnLabel(col)}${row + 1}`;
}

export function evaluateFormula(
  formula: string,
  cells: { [key: string]: Cell },
  currentKey: string,
  visitedCells: Set<string> = new Set()
): string | number {
  if (visitedCells.has(currentKey)) {
    return '#CIRCULAR!';
  }

  visitedCells.add(currentKey);

  try {
    let processedFormula = formula.slice(1);

    const cellRefPattern = /([A-Z]+\d+)/g;
    const cellRefs = [...processedFormula.matchAll(cellRefPattern)];

    const replacements: { [key: string]: string } = {};

    for (const match of cellRefs) {
      const ref = match[1];
      const cellPos = parseCellReference(ref);

      if (cellPos) {
        const key = getCellKey(cellPos.row, cellPos.col);
        const cell = cells[key];

        if (cell) {
          let value: string | number;

          if (cell.formula) {
            value = evaluateFormula(cell.formula, cells, key, new Set(visitedCells));
          } else {
            value = cell.value;
          }

          if (typeof value === 'number' || !isNaN(Number(value))) {
            replacements[ref] = String(value);
          } else {
            replacements[ref] = '0';
          }
        } else {
          replacements[ref] = '0';
        }
      }
    }

    for (const [ref, value] of Object.entries(replacements)) {
      processedFormula = processedFormula.replace(new RegExp(ref, 'g'), value);
    }

    processedFormula = processedFormula.toUpperCase();

    if (processedFormula.startsWith('SUM(')) {
      const rangeMatch = processedFormula.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/);
      if (rangeMatch) {
        const start = parseCellReference(rangeMatch[1]);
        const end = parseCellReference(rangeMatch[2]);

        if (start && end) {
          let sum = 0;
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              const key = getCellKey(r, c);
              const cell = cells[key];
              if (cell) {
                const val = cell.formula
                  ? evaluateFormula(cell.formula, cells, key, new Set(visitedCells))
                  : cell.value;
                sum += Number(val) || 0;
              }
            }
          }
          return sum;
        }
      }
    }

    if (processedFormula.startsWith('AVERAGE(')) {
      const rangeMatch = processedFormula.match(/AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)/);
      if (rangeMatch) {
        const start = parseCellReference(rangeMatch[1]);
        const end = parseCellReference(rangeMatch[2]);

        if (start && end) {
          let sum = 0;
          let count = 0;
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              const key = getCellKey(r, c);
              const cell = cells[key];
              if (cell && cell.value) {
                const val = cell.formula
                  ? evaluateFormula(cell.formula, cells, key, new Set(visitedCells))
                  : cell.value;
                sum += Number(val) || 0;
                count++;
              }
            }
          }
          return count > 0 ? sum / count : 0;
        }
      }
    }

    const result = eval(processedFormula);
    return typeof result === 'number' ? result : String(result);

  } catch (error) {
    return '#ERROR!';
  }
}
