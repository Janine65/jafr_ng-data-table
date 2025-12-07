# @syrius/data-table

A comprehensive Angular data table component library with PrimeNG integration, providing powerful table functionality with responsive design, filtering, sorting, pagination, and export capabilities.

## Features

- 🔧 **PrimeNG Integration**: Built on top of PrimeNG Table with comprehensive UI components
- 📱 **Responsive Design**: Automatic column management based on screen width and column priorities
- 🔍 **Advanced Filtering**: Global search, column-specific filters, and custom filter types
- 📊 **Sorting & Pagination**: Client-side and server-side support for sorting and pagination
- 📤 **Export Functionality**: Configurable export menus with custom filtering and column selection
- 🎯 **Custom Actions**: Add toolbar buttons with custom logic (e.g., "Open in Syrius")
- 🎨 **Customizable**: Flexible column definitions with custom rendering and actions
- 🔄 **Loading States**: Built-in loading spinner with customizable messages
- 🌐 **i18n Ready**: Full translation support with @ngx-translate integration

## Installation

```bash
npm install @syrius/data-table
```

## Dependencies

This library requires the following peer dependencies:

```json
{
  "@angular/animations": "^20.0.0",
  "@angular/common": "^20.0.0",
  "@angular/core": "^20.0.0",
  "@angular/forms": "^20.0.0",
  "@ngx-translate/core": "^17.0.0",
  "primeng": "^20.0.0",
  "rxjs": "~7.8.0"
}
```

## Quick Start

### Basic Usage

```typescript
import { DataTableComponent, ColumnDefinition } from "@syrius/data-table";

@Component({
  template: `
    <syr-data-table
      [data]="users"
      [columnDefs]="columns"
      [config]="tableConfig"
      [loading]="loading"
      (rowSelected)="onRowSelected($event)"
      (exportData)="onExportData($event)"
    >
    </syr-data-table>
  `,
  imports: [DataTableComponent],
})
export class UserListComponent {
  users = [
    { id: 1, name: "John Doe", email: "john@example.com", active: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", active: false },
  ];

  columns: ColumnDefinition[] = [
    { field: "id", header: "ID", type: "number", mustShow: true },
    { field: "name", header: "Name", type: "string", filterable: true },
    { field: "email", header: "Email", type: "string", filterable: true },
    { field: "active", header: "Active", type: "boolean" },
  ];

  tableConfig = {
    enableSorting: true,
    enableColumnFiltering: true,
    enableExport: true,
    pageSize: 25,
  };

  loading = false;

  onRowSelected(user: User) {
    console.log("Selected:", user);
  }

  onExportData(data: User[]) {
    // Handle export logic
    console.log("Export data:", data);
  }
}
```

### Advanced Column Configuration

```typescript
const advancedColumns: ColumnDefinition<User>[] = [
  {
    field: "id",
    header: "User ID",
    type: "number",
    mustShow: true, // Always visible
    minWidth: "80px",
    sortable: true,
  },
  {
    field: "name",
    header: "Full Name",
    type: "string",
    filterable: true,
    filterType: "text",
    filterPlaceholder: "Search names...",
    minWidth: "200px",
  },
  {
    field: "createdAt",
    header: "Created",
    type: "date",
    format: "dd.MM.yyyy HH:mm",
    filterable: true,
    filterType: "date",
    minWidth: "150px",
  },
  {
    field: "status",
    header: "Actions",
    type: "actions",
    actions: [
      {
        label: "Edit",
        icon: "pi pi-pencil",
        command: (user) => this.editUser(user),
        visible: (user) => user.canEdit,
      },
      {
        label: "Delete",
        icon: "pi pi-trash",
        command: (user) => this.deleteUser(user),
        visible: (user) => user.canDelete,
      },
    ],
  },
  {
    field: "customField",
    header: "Custom",
    type: "custom",
    customRender: (user, col) => {
      return `<span class="badge">${user.role}</span>`;
    },
  },
];
```

### Table Configuration Options

```typescript
const config: TableConfiguration = {
  // Core functionality
  enableSorting: true,
  enableColumnFiltering: true,
  enablePagination: true,
  enableGlobalSearch: true,
  enableExport: true,

  // Pagination settings
  pageSize: 15,
  rowsPerPageOptions: [10, 15, 25, 50, 100],

  // Selection
  selectionMode: "single", // 'single' | 'multiple' | null
  dataKey: "id", // Unique identifier field

  // Display options
  scrollHeight: "400px", // Fixed height with scrolling
  emptyMessage: "No data found",
  showCaption: true,

  // Filtering
  filterDelay: 300, // ms delay for filter input
};
```

## Components

### DataTableComponent

The main table component with comprehensive features.

**Selector:** `syr-data-table`

**Inputs:**

- `data: T[]` - Array of data objects to display
- `columnDefs: ColumnDefinition<T>[]` - Column configuration (optional, auto-derived if not provided)
- `config: TableConfiguration<T>` - Table configuration options
- `loading: boolean` - Loading state flag
- `totalRecords: number` - Total record count for server-side pagination

**Outputs:**

- `rowSelected: EventEmitter<T>` - Fires when a row is selected
- `rowUnselected: EventEmitter<T>` - Fires when a row is unselected
- `pageChanged: EventEmitter<TablePaginationEvent>` - Page change events
- `sortChanged: EventEmitter<TableSortEvent[]>` - Sort change events
- `filterChanged: EventEmitter<{filters: Record<string, unknown>, globalFilter?: string}>` - Filter events
- `exportData: EventEmitter<T[]>` - Export data events

### LoadingSpinnerComponent

A customizable loading spinner for use within data tables.

**Selector:** `lib-loading-spinner`

**Inputs:**

- `loadingText: string` - Loading message text
- `spinnerVisible: boolean` - Show/hide spinner
- `spinnerSize: string` - Spinner size (default: '50px')

## Type Definitions

### ColumnDefinition

```typescript
interface ColumnDefinition<T = Record<string, unknown>> {
  field: keyof T & string; // Data field name
  header: string; // Column header text
  sortable?: boolean; // Enable sorting (default: true)
  type?: "string" | "date" | "number" | "boolean" | "custom" | "actions";
  format?: string; // Format string for dates/numbers
  class?: string; // CSS class for column cells
  headerStyleClass?: string; // CSS class for header
  filterable?: boolean; // Enable column filtering
  filterType?: "text" | "numeric" | "date" | "boolean" | "custom";
  filterPlaceholder?: string; // Filter input placeholder
  filterMatchMode?: string; // PrimeNG filter match mode
  mustShow?: boolean; // Always visible (responsive)
  minWidth?: string; // Minimum column width
  customRender?: (rowData: T, colDef: ColumnDefinition<T>) => string;
  actions?: ColumnAction<T>[]; // Actions for 'actions' type columns
}
```

### TableConfiguration

```typescript
interface TableConfiguration<T = Record<string, unknown>> {
  enableSorting?: boolean;
  enableColumnFiltering?: boolean;
  filterDelay?: number;
  enablePagination?: boolean;
  enableGlobalSearch?: boolean;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  selectionMode?: "single" | "multiple" | null;
  dataKey?: keyof T & string;
  scrollHeight?: string;
  emptyMessage?: string;
  showCaption?: boolean;
  captionText?: string;
  enableExport?: boolean;
  exportDefinitions?: ExportDefinition<T>[]; // Custom export menu
  customActions?: ActionButtonDefinition<T>[]; // Custom toolbar buttons
}
```

## Responsive Behavior

The data table automatically adjusts visible columns based on available width:

1. **Must Show Columns**: Columns with `mustShow: true` are always visible
2. **Width-Based**: Other columns are shown if their `minWidth` fits in remaining space
3. **Priority Order**: Columns are prioritized by their order in the `columnDefs` array

## Export Features

The export functionality provides flexible options through custom export definitions:

### Default Export Options (Legacy)

If no custom `exportDefinitions` are provided:

- **Export All**: All table data
- **Export Selected**: Only selected rows (requires selection mode)
- **Export Successful**: Rows without error messages
- **Export Failed**: Rows with error messages

### Custom Export Definitions (New)

Define custom export menus with filtering logic:

```typescript
const exportDefinitions: ExportDefinition[] = [
  {
    label: "Export All Data",
    icon: "pi pi-download",
    fileName: "all_data",
  },
  {
    label: "Export High Value (>1000)",
    icon: "pi pi-filter",
    fileName: "high_value",
    filterFn: (data) => data.filter((item) => item.amount > 1000),
  },
  {
    label: "Export Summary",
    icon: "pi pi-file",
    fileName: "summary",
    columnsFn: (columns) =>
      columns.filter((col) => ["id", "name", "amount"].includes(col.field)),
  },
];

const config: TableConfiguration = {
  enableExport: true,
  exportDefinitions: exportDefinitions,
};
```

### Custom Action Buttons

Add custom toolbar buttons:

```typescript
const customActions: ActionButtonDefinition[] = [
  {
    label: "Open in Syrius",
    icon: "pi pi-external-link",
    severity: "info",
    command: (selectedRows) => {
      window.open(`/syrius/${selectedRows[0].id}`, "_blank");
    },
    disabled: (selectedRows) => selectedRows.length !== 1,
  },
];

const config: TableConfiguration = {
  customActions: customActions,
};
```

**📚 See [EXPORT-ACTIONS-USAGE.md](EXPORT-ACTIONS-USAGE.md) for complete documentation**

## Styling

The component uses PrimeNG styling classes. You can customize appearance using:

- `class` and `headerStyleClass` on column definitions
- Standard PrimeNG theme variables
- Custom CSS targeting `.data-table-container` class
