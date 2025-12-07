/*
 * Public API Surface of @syrius/data-table
 */

// Main data table component
export { DataTableComponent } from "./lib/components/data-table/data-table.component";

// Data table panel wrapper component
export { DataTablePanelComponent } from "./lib/components/data-table-panel/data-table-panel.component";

// Supporting loading spinner component
export { LoadingSpinnerComponent } from "./lib/components/loading-spinner/loading-spinner.component";

// Actions panel component
export { ActionsPanelComponent } from "./lib/components/actions-panel/actions-panel.component";
export type { ActionButton } from "./lib/components/actions-panel/actions-panel.component";

// Data table types and interfaces
export type {
  ColumnDefinition,
  ColumnAction,
  TableConfiguration,
  TableRowSelectionEvent,
  TablePaginationEvent,
  TableSortEvent,
  TableFilterEvent,
  ExportDefinition,
  ActionButtonDefinition,
} from "./lib/components/data-table/data-table.interface";
