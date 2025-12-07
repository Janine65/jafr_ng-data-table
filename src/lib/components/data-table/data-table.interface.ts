import { Observable } from 'rxjs';

// Type for table row selection events (compatible with PrimeNG)
export interface TableRowSelectionEvent<T> {
  data?: T | T[];
  originalEvent?: Event;
}

// Type for table pagination events (compatible with PrimeNG)
export interface TablePaginationEvent {
  first: number;
  rows: number;
  page?: number;
  pageCount?: number;
}

// Type for table sort events
export interface TableSortEvent {
  field: string;
  order: number;
}

// Type for table filter events (compatible with PrimeNG)
export interface TableFilterEvent {
  filters?: Record<string, unknown>;
  filteredValue?: unknown[];
}

export interface ColumnDefinition<T = Record<string, unknown>> {
  field: keyof T & string;
  header: string;
  sortable?: boolean;
  type?: "string" | "date" | "number" | "boolean" | "custom" | "actions";
  format?: string;
  class?: string;
  headerStyleClass?: string;
  filterable?: boolean;
  filterType?: "text" | "numeric" | "date" | "boolean" | "custom";
  filterPlaceholder?: string;
  filterMatchMode?: string; // e.g., 'startsWith', 'contains', 'endsWith', 'equals', 'notEquals', 'lt', 'lte', 'gt', 'gte', 'in', 'dateIs', 'dateIsNot', 'dateBefore', 'dateAfter'
  mustShow?: boolean;
  minWidth?: string;
  customRender?: (rowData: T, colDef: ColumnDefinition<T>) => string;

  /**
   * Optional key to look up a transformer from TableConfiguration.transformers.
   * Enables declarative transforms without per-column inline functions.
   */
  transformKey?: string;

  /**
   * Transform function for reactive data transformation
   * Can return a string directly, or an Observable/Promise for async operations
   * When async is true, the template will use the async pipe to handle subscriptions
   *
   * Example: transform: (rowData) => this.codeService.resolveCode(rowData.status)
   */
  transform?: (
    rowData: T,
    colDef: ColumnDefinition<T>
  ) => string | Observable<string> | Promise<string>;

  /**
   * Flag to indicate if transform returns an Observable or Promise
   * When true, the template will use the async pipe
   * Default: false
   */
  async?: boolean;

  action?: (item: T) => void;
  actions?: ColumnAction<T>[]; // Array of actions for the actions column
}

export interface ColumnAction<T = Record<string, unknown>> {
  /**
   * Optional key to resolve the command from table configuration (actionHandlers)
   * when you want to keep column definitions declarative.
   */
  key?: string;
  label: string; // Translation key or label text
  icon?: string; // PrimeNG icon class (e.g., 'pi pi-pencil')
  command?: (item: T) => void; // Action to execute (overrides key-based handler)
  /** Show/hide action; boolean or predicate */
  visible?: boolean | ((item: T) => boolean);
  /** Disable action; boolean or predicate */
  disabled?: boolean | ((item: T) => boolean);
  /**
   * Optional permission identifier(s) consumed by `actionPermissionResolver`
   * provided via TableConfiguration.
   */
  requiresPermission?: string | string[];
  /** Optional guard predicate evaluated before rendering the action */
  guard?: (item: T) => boolean;
}

/**
 * Export configuration type
 * Defines how data should be filtered and exported
 */
export interface ExportDefinition<T = Record<string, unknown>> {
  label: string; // Menu item label (i18n key or plain text)
  icon: string; // PrimeNG icon class
  filterFn?: (data: T[]) => T[]; // Optional filter function to filter data
  columnsFn?: (columns: ColumnDefinition<T>[]) => ColumnDefinition<T>[]; // Optional column filter
  fileName?: string; // Custom file name (defaults to 'export')
  tooltip?: string; // Optional tooltip
}

/**
 * Custom action button configuration for the toolbar
 * Allows adding custom buttons like "Open in Syrius"
 */
export interface ActionButtonDefinition<T = Record<string, unknown>> {
  label: string; // Button label (i18n key or plain text)
  icon: string; // PrimeNG icon class
  command: (selectedRows: T[]) => void; // Action to execute with selected rows
  tooltip?: string; // Optional tooltip
  disabled?: boolean | ((selectedRows: T[]) => boolean); // Optional function or boolean to disable button
  requiresSelection?: boolean; // If true, button is disabled when no rows are selected
  requiresSingleSelection?: boolean; // If true, button is disabled when selection is not exactly 1
  severity?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "help"
    | "danger"
    | "contrast"; // PrimeNG button severity
  visible?: boolean; // Whether button is visible (default: true)
}

export interface TableConfiguration<T = Record<string, unknown>> {
  enableSorting?: boolean;
  enableColumnFiltering?: boolean;
  filterDelay?: number;
  enablePagination?: boolean;
  enableGlobalSearch?: boolean;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  selectionMode?: "single" | "multiple" | null;
  dataKey?: keyof T & string;
  stateKey?: string;
  scrollHeight?: string;
  emptyMessage?: string;
  showCaption?: boolean;
  loading?: boolean;
  enableExport?: boolean;
  enableStatusFilter?: boolean;
  statusFilterOptions?: { label: string; value: string | null }[];
  exportDefinitions?: ExportDefinition<T>[]; // Custom export menu definitions
  customActions?: ActionButtonDefinition<T>[]; // Custom action buttons for toolbar

  // Actions Panel Configuration
  enableActionsPanel?: boolean; // Enable actions panel above table
  actionsPanelHeader?: string; // Header text for actions panel
  actionButtons?: ActionButtonDefinition<T>[]; // Action buttons for actions panel
  showActionsPanelExport?: boolean; // Show export in actions panel (uses exportDefinitions)

  /**
   * Optional map of reusable transformers keyed by transformKey (ColumnDefinition.transformKey).
   * Useful for declarative column configs.
   */
  transformers?: Record<
    string,
    (row: T, col: ColumnDefinition<T>) => string | Observable<string> | Promise<string>
  >;

  /**
   * Optional map of action handlers when actions use a `key` instead of an inline command.
   */
  actionHandlers?: Record<string, (item: T) => void>;
  /**
   * Optional resolver to decide if an action requiring permission should render.
   * Return true to show the action, false to hide it.
   */
  actionPermissionResolver?: (
    permissions: string | string[] | undefined,
    row?: T
  ) => boolean;
}
