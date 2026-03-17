export interface CellStyle {
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
}

export interface Cell {
  value: string;
  formula?: string;
  computedValue?: string | number;
  style?: CellStyle;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnSort {
  column: number;
  direction: SortDirection;
}

export interface ColumnFilter {
  column: number;
  values: Set<string>;
}

export interface SpreadsheetState {
  cells: { [key: string]: Cell };
  rows: number;
  cols: number;
  sortConfig: ColumnSort | null;
  filters: Map<number, Set<string>>;
  hiddenRows: Set<number>;
}

export interface HistoryState {
  cells: { [key: string]: Cell };
  rows: number;
  cols: number;
}

export interface Selection {
  start: { row: number; col: number };
  end: { row: number; col: number };
}
