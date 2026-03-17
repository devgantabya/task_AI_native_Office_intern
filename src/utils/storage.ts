import { Cell } from '../types/spreadsheet';

const STORAGE_KEY = 'spreadsheet_data';

export interface StoredData {
  cells: { [key: string]: Cell };
  rows: number;
  cols: number;
  version: number;
}

export function saveToLocalStorage(
  cells: { [key: string]: Cell },
  rows: number,
  cols: number
): boolean {
  try {
    const data: StoredData = {
      cells,
      rows,
      cols,
      version: 1,
    };

    const jsonString = JSON.stringify(data);

    if (jsonString.length > 5 * 1024 * 1024) {
      console.warn('Data exceeds 5MB limit');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, jsonString);
    return true;
  } catch (error) {
    console.error('Failed to save to local storage:', error);
    return false;
  }
}

export function loadFromLocalStorage(): StoredData | null {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    if (!jsonString) return null;

    const data = JSON.parse(jsonString) as StoredData;

    if (!data.cells || typeof data.rows !== 'number' || typeof data.cols !== 'number') {
      console.error('Corrupted data detected');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load from local storage:', error);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear local storage:', error);
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
