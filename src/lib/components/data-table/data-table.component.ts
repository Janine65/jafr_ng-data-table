import { MenuItem, SharedModule } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';

import { CommonModule } from '@angular/common';
import {
    AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter,
    HostListener, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ActionButton, ActionsPanelComponent } from '../actions-panel/actions-panel.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import {
    ActionButtonDefinition, ColumnAction, ColumnDefinition, ExportDefinition, TableConfiguration,
    TableFilterEvent, TablePaginationEvent, TableRowSelectionEvent, TableSortEvent
} from './data-table.interface';

// Type for items that have a status property (used for export filtering)
interface ItemWithStatus {
  status?: string;
}

@Component({
  selector: "syr-data-table",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    PaginatorModule,
    InputTextModule,
    SharedModule,
    InputGroupModule,
    InputGroupAddonModule,
    LoadingSpinnerComponent,
    ActionsPanelComponent,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    ButtonModule,
    SplitButtonModule,
    MultiSelectModule,
    TranslateModule,
    MenuModule,
    TooltipModule,
  ],
  templateUrl: "./data-table.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T = Record<string, unknown>>
  implements OnInit, OnChanges, AfterViewInit
{
  private cdr = inject(ChangeDetectorRef);
  private el = inject(ElementRef);
  private translateService = inject(TranslateService);

  /** Input: The data to be displayed in the table. */
  @Input() data: T[] = [];
  /** Input: Definitions for table columns. If not provided, columns are derived from the data. */
  @Input() columnDefs: ColumnDefinition<T>[] = [];
  /** Input: Configuration options for the table. Merged with default configuration. */
  @Input() config: TableConfiguration<T> = {};
  /** Input: Flag to indicate if data is currently loading. Controls the display of the loading spinner. */
  @Input() loading: boolean = false;
  /** Input: Total number of records, used for server-side pagination. */
  @Input() totalRecords: number = 0;
  /** Input: Selected rows (for two-way binding with parent component). */
  @Input() selection?: T | T[] | null;

  /** Output: Emits when a row is selected. */
  @Output() rowSelected = new EventEmitter<T>();
  /** Output: Emits when a row is unselected. */
  @Output() rowUnselected = new EventEmitter<T>();
  /** Output: Emits when the selection changes (for two-way binding). */
  @Output() selectionChange = new EventEmitter<T | T[] | null>();
  /** Output: Emits when the page changes (e.g., for server-side pagination). */
  @Output() pageChanged = new EventEmitter<TablePaginationEvent>();
  /** Output: Emits when sorting changes (e.g., for server-side sorting). */
  @Output() sortChanged = new EventEmitter<TableSortEvent[]>();
  /** Output: Emits when filtering changes (e.g., for server-side filtering). */
  @Output() filterChanged = new EventEmitter<{
    filters: Record<string, unknown>;
    globalFilter?: string;
  }>();
  /** Output: Emits data to be exported. */
  @Output() exportData = new EventEmitter<T[]>();
  /** Output: Emits filtered data when table filters change. */
  @Output() filteredData = new EventEmitter<T[]>();

  // Internal component state
  /** Holds the currently selected row data. */
  selectedRow: T | null = null;
  /** Holds currently selected rows data. */
  selectedRows: T[] = [];
  /** Columns derived automatically from the data if `columnDefs` is not provided. */
  derivedColumns: ColumnDefinition<T>[] = [];
  /** Current value of the global filter input. */
  globalFilterValue: string = "";
  /** Options for the boolean column filter dropdown. */
  booleanFilterOptions: { label: string; value: boolean | null }[] = [
    { label: "Alle", value: null },
    { label: "Ja", value: true },
    { label: "Nein", value: false },
  ];
  /** Current value of the external global filter input. */
  public currentGlobalFilter: string = "";
  /** Export menu items for the split button dropdown. */
  exportMenuItems: MenuItem[] = [];
  /** Current export label displayed on the button. */
  currentExportLabel: string = "";
  /** Current export definition selected from dropdown. */
  private currentExportDefinition: ExportDefinition<T> | null = null;
  /** Current filtered data from the table (used for export filtered). */
  private currentFilteredData: T[] = [];
  /** Custom action buttons for the toolbar. */
  customActionButtons: ActionButtonDefinition<T>[] = [];
  /** Action buttons for the actions panel (converted from config.actionButtons). */
  actionsPanelButtons: ActionButton[] = [];
  /** Object to store column filter values for two-way binding */
  columnFilters: Record<string, any> = {};
  /** Cache for menu items to prevent re-creation on every change detection cycle */
  private menuItemsCache = new Map<string, MenuItem[]>();

  // Responsive column handling
  /** Master list of all columns (either from `columnDefs` or `derivedColumns`). */
  private allMasterColumns: ColumnDefinition<T>[] = [];
  /** Columns currently displayed, adjusted for responsiveness. */
  responsiveDisplayColumns: ColumnDefinition<T>[] = [];
  /** Reference to the PrimeNG p-table element. */
  @ViewChild("dt") dt!: Table;

  /** Default table configuration. User-provided config is merged with this. */
  defaultConfig: TableConfiguration<T> = {
    enableSorting: true,
    enableColumnFiltering: false,
    filterDelay: 300,
    enablePagination: true,
    enableGlobalSearch: true,
    pageSize: 15,
    rowsPerPageOptions: [10, 15, 25, 50, 100],
    selectionMode: "single",
    dataKey: "id" as keyof T & string, // Important: Override if the data's unique key is not 'id'
    scrollHeight: undefined,
    emptyMessage: "No data found.",
    showCaption: true,
    enableExport: false,
    enableStatusFilter: false,
  };
  /** The final configuration object, merging defaults with user-provided config. */
  mergedConfig: TableConfiguration<T> = this.defaultConfig;

  ngOnInit(): void {
    this.mergedConfig = { ...this.defaultConfig, ...this.config };
    if (!this.columnDefs || this.columnDefs.length === 0) {
      this.deriveColumnsFromData();
    }
    this.updateMasterColumns();
    this.updateResponsiveColumns();
    this.initializeExportMenu();
    this.initializeCustomActions();
    this.buildActionsPanelButtons();
    // Initialize filtered data with all data
    this.currentFilteredData = this.data;
    if (
      this.mergedConfig.exportDefinitions &&
      this.mergedConfig.exportDefinitions.length > 0
    ) {
      this.currentExportDefinition = this.mergedConfig.exportDefinitions[0];
      this.updateCurrentExportLabel();
    }
    // Sync selection input with internal selectedRows
    this.syncSelectionFromInput();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["config"]) {
      this.mergedConfig = { ...this.defaultConfig, ...this.config };
    }
    // If data or column definitions change, re-derive and update columns
    if (changes["data"] || changes["columnDefs"]) {
      // Clear menu items cache when data changes
      this.menuItemsCache.clear();

      if (!this.columnDefs || this.columnDefs.length === 0) {
        this.deriveColumnsFromData();
      }
      this.updateMasterColumns();
      this.updateResponsiveColumns();
      // Update filtered data when data changes
      this.currentFilteredData = this.data;
    }
    if (changes["loading"] || changes["data"]) {
      this.cdr.markForCheck(); // Ensure view updates when loading state or data changes
    }
    if (changes["data"] && this.dt && this.currentGlobalFilter) {
      this.dt.filterGlobal(this.currentGlobalFilter, "contains");
    }
    // Sync selection when it changes from parent
    if (changes["selection"]) {
      this.syncSelectionFromInput();
    }
  }

  ngAfterViewInit(): void {
    if (this.dt && this.currentGlobalFilter) {
      this.dt.filterGlobal(this.currentGlobalFilter, "contains");
    }
  }

  /** Initialize export menu items based on exportDefinitions or default export options. */
  private initializeExportMenu(): void {
    // Check if custom export definitions are provided
    if (
      this.mergedConfig.exportDefinitions &&
      this.mergedConfig.exportDefinitions.length > 0
    ) {
      // Use custom export definitions
      this.exportMenuItems = this.mergedConfig.exportDefinitions.map((def) => ({
        label: this.translateService.instant(def.label) || def.label,
        icon: def.icon,
        tooltip: def.tooltip
          ? this.translateService.instant(def.tooltip)
          : undefined,
        command: () => this.selectExportDefinition(def),
      }));
    } else {
      // Fall back to default export menu (all, selected, successful, failed)
      this.exportMenuItems = [
        {
          label:
            this.translateService.instant("common.export.all") ||
            "Alle exportieren",
          icon: "pi pi-download",
          command: () => this.selectDefaultExport("all"),
        },
        {
          label:
            this.translateService.instant("common.export.selected") ||
            "Ausgewählte exportieren",
          icon: "pi pi-check-square",
          command: () => this.selectDefaultExport("selected"),
          disabled: this.selectedRows.length === 0,
        },
        {
          label:
            this.translateService.instant("common.export.successful") ||
            "Erfolgreiche exportieren",
          icon: "pi pi-check-circle",
          command: () => this.selectDefaultExport("successful"),
        },
        {
          label:
            this.translateService.instant("common.export.failed") ||
            "Fehlgeschlagene exportieren",
          icon: "pi pi-times-circle",
          command: () => this.selectDefaultExport("failed"),
        },
      ];
    }
  }

  /** Initialize custom action buttons from configuration. */
  private initializeCustomActions(): void {
    this.customActionButtons = this.mergedConfig.customActions || [];
  }

  /** Build actions panel buttons from configuration. */
  private buildActionsPanelButtons(): void {
    if (
      !this.mergedConfig.actionButtons ||
      this.mergedConfig.actionButtons.length === 0
    ) {
      this.actionsPanelButtons = [];
      return;
    }

    this.actionsPanelButtons = this.mergedConfig.actionButtons.map(
      (actionDef) => {
        // Determine if button should be disabled based on selection requirements
        let disabled = false;

        // Check if disabled is provided as a function or boolean
        if (typeof actionDef.disabled === "function") {
          disabled = actionDef.disabled(this.selectedRows || []);
        } else if (typeof actionDef.disabled === "boolean") {
          disabled = actionDef.disabled;
        }

        // If requiresSelection is true, disable button when no rows are selected
        if (
          actionDef.requiresSelection &&
          (!this.selectedRows || this.selectedRows.length === 0)
        ) {
          disabled = true;
        }

        // If requiresSingleSelection is true, disable button when selection is not exactly 1
        if (
          actionDef.requiresSingleSelection &&
          (!this.selectedRows || this.selectedRows.length !== 1)
        ) {
          disabled = true;
        }

        return {
          label: actionDef.label,
          icon: actionDef.icon,
          severity: actionDef.severity,
          disabled: disabled,
          tooltip: actionDef.tooltip,
          command: () => {
            // Call the command with selected rows context
            if (actionDef.command) {
              actionDef.command(this.selectedRows || []);
            }
          },
        };
      }
    );

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /** Select an export definition (for custom exports). */
  selectExportDefinition(definition: ExportDefinition<T>): void {
    this.currentExportDefinition = definition;
    this.updateCurrentExportLabel();
  }

  /** Select default export type (for backward compatibility). */
  private defaultExportType: "all" | "selected" | "successful" | "failed" =
    "all";

  selectDefaultExport(
    type: "all" | "selected" | "successful" | "failed"
  ): void {
    this.defaultExportType = type;
    this.currentExportDefinition = null; // Clear custom definition
    this.updateCurrentExportLabelDefault(type);
  }

  /** Perform export based on currently selected export definition or default type. */
  performExport(): void {
    let dataToExport: T[];
    let columnsToExport = this.displayColumns;

    // Check if using custom export definitions
    if (this.currentExportDefinition) {
      // Special handling for "Export Selected" - check by label or filename
      if (
        this.currentExportDefinition.label ===
          "common.actions.exportSelection" ||
        this.currentExportDefinition.fileName?.includes("selected")
      ) {
        dataToExport = this.selectedRows;
      }
      // Special handling for "Export Filtered" - check by label or filename
      else if (
        this.currentExportDefinition.label ===
          "common.actions.exportFiltered" ||
        this.currentExportDefinition.fileName?.includes("filtered")
      ) {
        dataToExport =
          this.currentFilteredData.length > 0
            ? this.currentFilteredData
            : this.data;
      }
      // Apply custom filter function if provided
      else if (this.currentExportDefinition.filterFn) {
        dataToExport = this.currentExportDefinition.filterFn(this.data);
      } else {
        dataToExport = this.data;
      }

      // Apply custom column filter if provided
      if (this.currentExportDefinition.columnsFn) {
        columnsToExport = this.currentExportDefinition.columnsFn(
          this.displayColumns
        );
      }

      // Emit export event with filtered data and columns
      // The parent component can use the columns parameter to format the export
      this.exportData.emit(dataToExport);
    } else {
      // Use default export logic (backward compatibility)
      switch (this.defaultExportType) {
        case "selected":
          dataToExport = this.selectedRows;
          break;
        case "successful":
          dataToExport = this.data.filter((item) => {
            const errorMessage = (item as Record<string, unknown>)[
              "errorMessage"
            ];
            return !errorMessage || errorMessage === "";
          });
          break;
        case "failed":
          dataToExport = this.data.filter((item) => {
            const errorMessage = (item as Record<string, unknown>)[
              "errorMessage"
            ];
            return errorMessage && errorMessage !== "";
          });
          break;
        case "all":
        default:
          dataToExport = this.data;
          break;
      }

      this.exportData.emit(dataToExport);
    }
  }

  /** Update the current export label based on selected custom definition. */
  private updateCurrentExportLabel(): void {
    if (this.currentExportDefinition) {
      const exportText =
        this.translateService.instant("common.actions.export") || "Exportieren";
      const label =
        this.translateService.instant(this.currentExportDefinition.label) ||
        this.currentExportDefinition.label;
      this.currentExportLabel = `${exportText}: ${label}`;
    }
  }

  /** Update the current export label based on selected default option (backward compatibility). */
  private updateCurrentExportLabelDefault(
    type: "all" | "selected" | "successful" | "failed"
  ): void {
    const exportText =
      this.translateService.instant("common.actions.export") || "Exportieren";
    let typeText = "";

    switch (type) {
      case "all":
        typeText = this.translateService.instant("common.export.all") || "Alle";
        break;
      case "selected":
        typeText =
          this.translateService.instant("common.export.selected") ||
          "Ausgewählte";
        break;
      case "successful":
        typeText =
          this.translateService.instant("common.export.successful") ||
          "Erfolgreiche";
        break;
      case "failed":
        typeText =
          this.translateService.instant("common.export.failed") ||
          "Fehlgeschlagene";
        break;
    }

    this.currentExportLabel = `${exportText}: ${typeText}`;
  }

  /** Check if a custom action button should be disabled (toolbar/actions panel). */
  isToolbarActionDisabled(action: ActionButtonDefinition<T>): boolean {
    if (action.disabled) {
      if (typeof action.disabled === "function") {
        return action.disabled(this.selectedRows);
      }
      return action.disabled;
    }
    return false;
  }

  /** Initializes or updates `allMasterColumns` based on provided `columnDefs` or `derivedColumns`. */
  private updateMasterColumns(): void {
    this.allMasterColumns =
      this.columnDefs && this.columnDefs.length > 0
        ? [...this.columnDefs]
        : [...this.derivedColumns];
    // Initialize responsiveDisplayColumns if it's empty and master columns are available
    if (
      this.allMasterColumns.length > 0 &&
      this.responsiveDisplayColumns.length === 0
    ) {
      this.responsiveDisplayColumns = [...this.allMasterColumns];
    }
  }

  /** Handles window resize events to update responsive columns. */
  @HostListener("window:resize", ["$event"])
  onResize(_event: Event): void {
    this.updateResponsiveColumns();
  }

  /**
   * Calculates which columns to display based on available table width and column `minWidth` / `mustShow` properties.
   * Columns marked `mustShow` are always included.
   * Other columns are added if their `minWidth` fits within the remaining table width.
   */
  private updateResponsiveColumns(): void {
    if (!this.allMasterColumns || this.allMasterColumns.length === 0) {
      this.responsiveDisplayColumns = [];
      this.cdr.markForCheck();
      return;
    }

    const tableWidth = this.el.nativeElement.offsetWidth;
    let currentVisibleColumns: ColumnDefinition<T>[] = [];
    let accumulatedWidth = 0;

    // Add columns marked as `mustShow` first
    this.allMasterColumns.forEach((col) => {
      if (col.mustShow) {
        currentVisibleColumns.push(col);
        accumulatedWidth += this.parseMinWidth(col.minWidth || "100px");
      }
    });

    // Add other columns if space allows, respecting their `minWidth`
    // This prioritizes columns earlier in the `allMasterColumns` array
    this.allMasterColumns.forEach((col) => {
      if (!col.mustShow) {
        // Check if column is already added to prevent duplicates
        if (!currentVisibleColumns.find((c) => c.field === col.field)) {
          const colMinWidth = this.parseMinWidth(col.minWidth || "100px");
          if (tableWidth > accumulatedWidth + colMinWidth) {
            currentVisibleColumns.push(col);
            accumulatedWidth += colMinWidth;
          }
        }
      }
    });
    // Sort currentVisibleColumns based on the original order in allMasterColumns
    currentVisibleColumns.sort((a, b) => {
      const indexA = this.allMasterColumns.findIndex(
        (masterCol) => masterCol.field === a.field
      );
      const indexB = this.allMasterColumns.findIndex(
        (masterCol) => masterCol.field === b.field
      );
      return indexA - indexB;
    });

    this.responsiveDisplayColumns = [...currentVisibleColumns];
    this.cdr.markForCheck();
  }

  /** Parses a minWidth string (e.g., '100px') into a number. Defaults to 100 if parsing fails. */
  private parseMinWidth(minWidth: string): number {
    const parsed = parseInt(minWidth, 10);
    return isNaN(parsed) ? 100 : parsed;
  }

  /** Derives column definitions from the first item in the `data` array if `columnDefs` is not provided. */
  deriveColumnsFromData(): void {
    if (this.data && this.data.length > 0) {
      const firstItem = this.data[0] as Record<string, unknown>;
      this.derivedColumns = Object.keys(firstItem).map((key) => ({
        field: key as keyof T & string,
        header: this.capitalizeHeader(key),
        type: this.guessType(firstItem[key]),
        filterable: this.mergedConfig.enableColumnFiltering,
        filterType: this.guessFilterType(this.guessType(firstItem[key])),
        minWidth: "100px",
      })) as ColumnDefinition<T>[];
    } else {
      this.derivedColumns = [];
    }
  }

  /** Capitalizes a string and inserts spaces before uppercase letters for better header display. */
  capitalizeHeader(header: string): string {
    if (!header) return "";
    const result = header.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  /** Guesses the data type of a value to aid in default formatting and filtering. */
  guessType(value: unknown): "string" | "date" | "number" | "boolean" {
    if (typeof value === "boolean") {
      return "boolean";
    }
    // Basic ISO date string check or if it's already a Date object
    if (
      value instanceof Date ||
      (typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value))
    ) {
      return "date";
    }
    if (typeof value === "number") {
      return "number";
    }
    return "string";
  }

  /** Guesses the appropriate filter input type based on the column's data type. */
  guessFilterType(
    columnType: "string" | "date" | "number" | "boolean"
  ): "text" | "numeric" | "date" | "boolean" {
    switch (columnType) {
      case "date":
        return "date";
      case "number":
        return "numeric";
      case "boolean":
        return "boolean";
      default:
        return "text";
    }
  }

  /** Getter for the columns to be displayed in the table, considering responsive adjustments. */
  get displayColumns(): ColumnDefinition<T>[] {
    // Ensure a fallback to an empty array if properties are not yet initialized
    const responsiveCols = this.responsiveDisplayColumns || [];
    const masterCols = this.allMasterColumns || [];
    return responsiveCols.length > 0 ? responsiveCols : masterCols;
  }

  /**
   * Syncs the selection input from parent component to internal selectedRows
   * Handles both single selection (T) and multiple selection (T[])
   */
  private syncSelectionFromInput(): void {
    if (this.selection === undefined || this.selection === null) {
      this.selectedRows = [];
    } else if (Array.isArray(this.selection)) {
      this.selectedRows = [...this.selection];
    } else {
      this.selectedRows = [this.selection];
    }
  }

  /**
   * Emits the current selection to parent component
   * Handles both single and multiple selection modes
   */
  private emitSelectionChange(): void {
    if (this.mergedConfig.selectionMode === "single") {
      this.selectionChange.emit(
        this.selectedRows.length > 0 ? this.selectedRows[0] : null
      );
    } else {
      this.selectionChange.emit(this.selectedRows);
    }
  }

  /** Emits `rowSelected` event when a row is selected. */
  onRowSelect(event: TableRowSelectionEvent<T>): void {
    if (event.data) {
      // Handle single selection - event.data should be T, not T[]
      if (!Array.isArray(event.data)) {
        this.selectedRow = event.data;
        this.rowSelected.emit(this.selectedRow);
      }
    }
    // Update export menu and actions panel buttons to reflect new selection state
    // Use setTimeout with small delay to ensure Angular's two-way binding and change detection have completed
    setTimeout(() => {
      this.emitSelectionChange();
      this.initializeExportMenu();
      this.buildActionsPanelButtons();
      this.cdr.detectChanges();
    }, 10);
  }

  /** Emits `rowUnselected` event when a row is unselected. */
  onRowUnselect(event: TableRowSelectionEvent<T>): void {
    this.selectedRow = null;
    if (event.data) {
      // Handle single selection - event.data should be T, not T[]
      if (!Array.isArray(event.data)) {
        this.rowUnselected.emit(event.data);
        // Don't manually filter selectedRows - PrimeNG's two-way binding handles this
      }
    }
    // Update export menu and actions panel buttons to reflect new selection state
    // Use setTimeout with small delay to ensure Angular's two-way binding and change detection have completed
    setTimeout(() => {
      this.emitSelectionChange();
      this.initializeExportMenu();
      this.buildActionsPanelButtons();
      this.cdr.detectChanges();
    }, 10);
  }

  /** Emits `pageChanged` event. PrimeNG handles client-side pagination. Parent handles server-side. */
  onPageChange(event: TablePaginationEvent): void {
    this.pageChanged.emit(event);
  }

  /** Emits `sortChanged` event. PrimeNG handles client-side sorting. Parent handles server-side. */
  onSort(event: TableSortEvent[]): void {
    this.sortChanged.emit(event);
  }

  /** Emits `filterChanged` event with current filters. PrimeNG handles client-side filtering. */
  onFilter(event: TableFilterEvent): void {
    this.filterChanged.emit({
      filters: event.filters || {},
      globalFilter: this.globalFilterValue,
    });

    // Store and emit filtered data for export functionality
    const filtered = (event.filteredValue as T[]) || this.data;
    this.currentFilteredData = filtered;
    this.filteredData.emit(filtered);
  }

  /** Applies global filter to the table and emits `filterChanged` event. */
  applyGlobalFilter(dt: Table, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilterValue = filterValue;
    dt.filterGlobal(filterValue, "contains");
    this.filterChanged.emit({
      filters: dt.filters,
      globalFilter: this.globalFilterValue,
    });

    // Store and emit filtered data for export functionality
    const filtered = (dt.filteredValue as T[]) || this.data;
    this.currentFilteredData = filtered;
    this.filteredData.emit(filtered);
  }

  /**
   * Handles input events from the global search field.
   * Updates the currentGlobalFilter property and applies the filter to the p-table.
   * @param event The input event from the search field.
   */
  onGlobalSearchInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.currentGlobalFilter = inputValue;
    if (this.dt) {
      this.dt.filterGlobal(inputValue, "contains");

      // Store and emit filtered data for export functionality
      const filtered = (this.dt.filteredValue as T[]) || this.data;
      this.currentFilteredData = filtered;
      this.filteredData.emit(filtered);
    }
  }

  /**
   * Handles global search input from the actions panel
   * @param value The search value from the actions panel input
   */
  onGlobalSearchInputFromPanel(value: string): void {
    this.currentGlobalFilter = value;
    if (this.dt) {
      this.dt.filterGlobal(value, "contains");

      // Store and emit filtered data for export functionality
      const filtered = (this.dt.filteredValue as T[]) || this.data;
      this.currentFilteredData = filtered;
      this.filteredData.emit(filtered);
    }
  }

  /** Helper to safely get the value from an input event. */
  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** Returns an array of field names from `displayColumns` for PrimeNG's global filter. */
  getGlobalFilterFields(): string[] {
    return this.displayColumns.map((col) => col.field);
  }

  /**
   * Retrieves cell data, handling custom rendering and type-specific formatting (date, boolean).
   * For 'custom' type, calls the `customRender` function from `ColumnDefinition`.
   * For columns with `transform`, calls the transform function (supports sync/async).
   * For 'date', attempts to parse string values into Date objects.
   * For 'boolean', formats true/false based on `col.format` (e.g., 'Yes/No') or defaults.
   */
  getCellData(
    rowData: T,
    col: ColumnDefinition<T>
  ): unknown | Observable<string> | Promise<string> {
    // Transform via transformKey using config transformers if provided
    if (col.transformKey && this.mergedConfig.transformers) {
      const transformer = this.mergedConfig.transformers[col.transformKey];
      if (transformer) {
        return transformer(rowData, col);
      }
    }

    // Priority 1: transform function (new reactive approach)
    if (col.transform) {
      return col.transform(rowData, col);
    }

    // Priority 2: customRender (legacy approach for backwards compatibility)
    if (col.customRender && col.type === "custom") {
      return col.customRender(rowData, col);
    }

    const value = rowData[col.field];
    if (col.type === "date" && value && typeof value === "string") {
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        return dateValue; // Return Date object for the date pipe
      }
    }
    if (col.type === "boolean") {
      // Use format if provided (e.g., 'Active/Inactive'), otherwise default to 'Ja/Nein'
      const parts = col.format?.split("/");
      return value ? parts?.[0] || "Ja" : parts?.[1] || "Nein";
    }
    return value;
  }

  /** Helper method to cast cell data for date pipe. */
  getCellDataAsDate(
    rowData: T,
    col: ColumnDefinition<T>
  ): Date | string | number | null {
    return this.getCellData(rowData, col) as Date | string | number | null;
  }

  /** Helper method to cast cell data for number pipe. */
  getCellDataAsNumber(
    rowData: T,
    col: ColumnDefinition<T>
  ): number | string | null {
    return this.getCellData(rowData, col) as number | string | null;
  }

  /** Helper method to cast cell data for string operations. */
  getCellDataAsString(rowData: T, col: ColumnDefinition<T>): string {
    const value = this.getCellData(rowData, col);
    return value != null ? String(value) : "";
  }

  /** Get menu items for a row's action column. */
  getRowActionMenuItems(rowData: T, col: ColumnDefinition<T>): MenuItem[] {
    if (!col.actions) {
      return [];
    }

    // Create a cache key based on row data (use a unique identifier if available)
    const rowId =
      (rowData as any).id || (rowData as any).uuid || JSON.stringify(rowData);
    const cacheKey = `${col.field || "actions"}_${rowId}`;

    // Check if we have cached menu items for this row
    if (this.menuItemsCache.has(cacheKey)) {
      console.log("[DATA-TABLE] Using cached menu items for:", cacheKey);
      return this.menuItemsCache.get(cacheKey)!;
    }

    console.log("[DATA-TABLE] Creating new menu items for:", cacheKey);

    // Create new menu items
    const menuItems = col.actions
      .filter((action) => this.isActionVisible(action, rowData))
      .map((action) => ({
        label: this.translateService.instant(action.label),
        icon: action.icon,
        disabled: this.isActionDisabled(action, rowData),
        command: (event: any) => {
          console.log(
            "[DATA-TABLE] Menu command triggered:",
            action.label,
            event
          );
          const handler = this.resolveActionHandler(action);
          if (handler) {
            handler(rowData);
          }
        },
      }));

    // Cache the menu items
    this.menuItemsCache.set(cacheKey, menuItems);

    return menuItems;
  }

  /** Determine if an action should be rendered. */
  private isActionVisible(action: ColumnAction<T>, row: T): boolean {
    const guardResult = action.guard ? action.guard(row) : true;
    const visibleResult =
      action.visible === undefined
        ? true
        : typeof action.visible === "function"
          ? action.visible(row)
          : action.visible;
    const permissionResult = action.requiresPermission
      ? this.mergedConfig.actionPermissionResolver
        ? this.mergedConfig.actionPermissionResolver(
            action.requiresPermission,
            row
          )
        : true
      : true;
    return guardResult && visibleResult && permissionResult;
  }

  /** Determine if an action should be disabled. */
  private isActionDisabled(action: ColumnAction<T>, row: T): boolean {
    if (typeof action.disabled === "function") {
      return action.disabled(row);
    }
    return action.disabled ?? false;
  }

  /** Resolve action handler from inline command or config actionHandlers keyed by `key`. */
  private resolveActionHandler(
    action: ColumnAction<T>
  ): ((item: T) => void) | undefined {
    if (action.command) {
      return action.command;
    }
    if (action.key && this.mergedConfig.actionHandlers) {
      return this.mergedConfig.actionHandlers[action.key];
    }
    return undefined;
  }

  /**
   * Public method to reset all filters and clear column filter values
   * Can be called from parent components via ViewChild
   */
  public reset(): void {
    if (this.dt) {
      this.dt.clear();
    }
    // Clear all column filter values
    this.columnFilters = {};
    // Clear global filter
    this.currentGlobalFilter = "";
    this.globalFilterValue = "";
    // Reset filtered data to all data
    this.currentFilteredData = this.data;
    // Trigger change detection
    this.cdr.markForCheck();
  }
}
