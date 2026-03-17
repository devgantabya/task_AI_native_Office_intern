# Advanced Spreadsheet Application

A feature-rich spreadsheet application built with a strong focus on real-world usability, performance, and Excel-like behavior. This project demonstrates advanced frontend engineering concepts including view-layer data manipulation, clipboard integration, and persistent state management.

---

## Live Features

### 🔹 Column Sorting & Filtering

- Implemented three-state column sorting:
  - Ascending → Descending → None
- Sorting works on computed values (formula results), not just raw inputs
- Excel-like filter dropdowns in column headers
- Filtering:
  - Hides rows instead of deleting them
  - Preserves original dataset integrity
- Fully reversible sorting and filtering
- Sorting is applied only at the view layer
  - Ensures formulas continue referencing original cell positions

---

### 🔹 Multi-Cell Copy & Paste (Clipboard Integration)

- Supports Ctrl + V paste from Excel / Google Sheets
- Handles multi-row and multi-column tab-separated data
- Internal copy-paste between cells
- Ctrl + C copies computed values (not formulas)
- All paste operations are undoable with Ctrl + Z

---

### 🔹 Local Storage Persistence

- Auto-save functionality using local storage
- Restores spreadsheet state on page reload
- Persisted data includes:
  - Cell values
  - Formulas
  - Styles
  - Grid dimensions
- Debounced saving (500ms) for performance optimization
- Handles storage limits and corrupted data safely
- Undo/redo history is not persisted (by design)

---

## Key Engineering Decisions

### View-Layer Sorting Architecture

Sorting does not mutate the original dataset. Instead:

- A transformed view is rendered
- Ensures stable formula references and predictable behavior

### Clipboard Data Handling

- Parses clipboard data using:
  - `\t` (tab separation)
  - `\n` (row separation)
- Ensures compatibility with Excel and Google Sheets

### Debounced Persistence Strategy

- Reduces unnecessary writes to local storage
- Improves performance during rapid input

---

## Edge Cases Handled

- Mixed data types during sorting
- Empty or null cells
- Large clipboard paste operations
- Partial grid pasting
- Formula recalculation after paste
- Filtering with no matching results
- Corrupted or overflowing local storage

---

## Evaluation Focus

- Clean and maintainable code structure
- Strong edge case handling
- Clear separation of data and UI layers
- Real-world spreadsheet UX behavior
- Performance optimizations (debouncing, efficient updates)

---

## Tech Stack

- Frontend: React + Vite
- Language: JavaScript, TypeScript
- State Management: React Hooks
- Storage: Browser LocalStorage
- Clipboard: Native Clipboard API

---

## Setup Instructions

```bash
# Clone the repository
git clone https://github.com/devgantabya/task_AI_native_Office_intern.git

# Navigate to project folder
cd task_AI_native_Office_intern

# Install dependencies
npm install

# Start development server
npm run dev
```
