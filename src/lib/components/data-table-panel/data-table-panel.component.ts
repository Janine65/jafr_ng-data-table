import { PanelModule } from 'primeng/panel';

import { CommonModule } from '@angular/common';
import {
    Component, ContentChild, EventEmitter, Input, Output, TemplateRef, ViewChild
} from '@angular/core';

import { DataTableComponent } from '../data-table/data-table.component';
import {
    ActionButtonDefinition, ColumnDefinition, ExportDefinition, TableConfiguration,
    TableFilterEvent, TablePaginationEvent, TableRowSelectionEvent
} from '../data-table/data-table.interface';

/**
 * Data Table Panel Component - Wraps DataTableComponent in a PrimeNG Panel
 *
 * This component provides a consistent panel styling around the data-table component.
 * It passes through all inputs and outputs to the underlying data-table while adding
 * a panel container with optional header and styling.
 *
 * @example
 * ```html
 * <syr-data-table-panel
 *   [data]="myData"
 *   [columnDefs]="columns"
 *   [config]="config"
 *   [panelHeader]="'My Data Table'"
 *   [panelStyleClass]="'my-custom-class'"
 *   (rowSelect)="onRowSelect($event)">
 * </syr-data-table-panel>
 * ```
 */
@Component({
  selector: "syr-data-table-panel",
  standalone: true,
  imports: [CommonModule, PanelModule, DataTableComponent],
  template: `
    <p-panel
      [header]="panelHeader"
      [toggleable]="panelToggleable"
      [collapsed]="panelCollapsed"
      [class]="'data-table-panel ' + (panelStyleClass || '')"
      (collapsedChange)="onPanelCollapse($event)"
    >
      <ng-template pTemplate="header" *ngIf="headerTemplate">
        <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
      </ng-template>

      <syr-data-table
        [data]="data"
        [columnDefs]="columnDefs"
        [config]="config"
        [loading]="loading"
        [selection]="selection"
        (rowSelected)="rowSelected.emit($event)"
        (rowUnselected)="rowUnselected.emit($event)"
        (selectionChange)="onSelectionChange($event)"
        (pageChanged)="pageChanged.emit($event)"
        (sortChanged)="sortChanged.emit($event)"
        (filterChanged)="filterChanged.emit($event)"
        (exportData)="exportData.emit($event)"
        (filteredData)="filteredData.emit($event)"
      >
        <!-- Pass through content projection slots -->
        <ng-content
          select="[pTemplate=caption]"
          ngProjectAs="[pTemplate=caption]"
        ></ng-content>
        <ng-content
          select="[pTemplate=summary]"
          ngProjectAs="[pTemplate=summary]"
        ></ng-content>
        <ng-content
          select="[pTemplate=emptymessage]"
          ngProjectAs="[pTemplate=emptymessage]"
        ></ng-content>
      </syr-data-table>

      <ng-template pTemplate="footer" *ngIf="footerTemplate">
        <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
      </ng-template>
    </p-panel>
  `,
  styles: [
    `
      :host ::ng-deep .data-table-panel {
        .p-panel-content {
          padding: 0;
        }

        .p-panel-header {
          background: var(--surface-50);
          border-bottom: 1px solid var(--surface-200);
        }
      }
    `,
  ],
})
export class DataTablePanelComponent<T = Record<string, unknown>> {
  // ========== Panel-specific inputs ==========
  /** Header text for the panel */
  @Input() panelHeader?: string;

  /** Whether the panel is toggleable (collapsible) */
  @Input() panelToggleable: boolean = false;

  /** Initial collapsed state of the panel */
  @Input() panelCollapsed: boolean = false;

  /** Custom CSS class for the panel */
  @Input() panelStyleClass?: string;

  /** Event emitted when panel collapse state changes */
  @Output() panelCollapsedChange = new EventEmitter<boolean>();

  // ========== Data Table inputs (pass-through) ==========
  @Input() data: T[] = [];
  @Input() columnDefs?: ColumnDefinition<T>[];
  @Input() config?: Partial<TableConfiguration<T>>;
  @Input() loading: boolean = false;
  @Input() selection?: T | T[] | null;

  // ========== Data Table outputs (pass-through) ==========
  @Output() rowSelected = new EventEmitter<T>();
  @Output() rowUnselected = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T | T[] | null>();
  @Output() pageChanged = new EventEmitter<TablePaginationEvent>();
  @Output() sortChanged = new EventEmitter<any>();
  @Output() filterChanged = new EventEmitter<{
    filters: Record<string, unknown>;
    globalFilter?: string;
  }>();
  @Output() exportData = new EventEmitter<T[]>();
  @Output() filteredData = new EventEmitter<T[]>();

  // ========== Template references ==========
  @ContentChild("panelHeader") headerTemplate?: TemplateRef<any>;
  @ContentChild("panelFooter") footerTemplate?: TemplateRef<any>;

  // ========== ViewChild to access underlying data-table ==========
  @ViewChild(DataTableComponent, { static: false })
  dataTable?: DataTableComponent<T>;

  /**
   * Handle panel collapse/expand
   */
  onPanelCollapse(collapsed: boolean): void {
    this.panelCollapsedChange.emit(collapsed);
  }

  /**
   * Handle selection changes from the data-table
   */
  onSelectionChange(selection: T | T[] | null): void {
    this.selectionChange.emit(selection);
  }

  /**
   * Public method to access the underlying data-table component
   * Allows parent components to call data-table methods like reset()
   */
  public getDataTable(): DataTableComponent<T> | undefined {
    return this.dataTable;
  }

  /**
   * Public method to reset the data-table (convenience wrapper)
   */
  public reset(): void {
    this.dataTable?.reset();
  }
}
