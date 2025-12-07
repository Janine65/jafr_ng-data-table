import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TooltipModule } from 'primeng/tooltip';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * ActionButton definition for custom action buttons in the panel
 */
export interface ActionButton {
  label: string;
  icon?: string;
  severity?:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "danger"
    | "help"
    | "contrast";
  disabled?: boolean;
  tooltip?: string;
  command?: () => void;
}

/**
 * ActionsPanel Component
 *
 * A reusable panel component for displaying action buttons (like SYRIUS, Export, etc.)
 * above data tables. Styled consistently with search criteria panels using p-panel.
 *
 * Features:
 * - Custom action buttons with icons and tooltips
 * - Export button with dropdown menu
 * - Consistent styling with form panels
 * - Responsive layout
 *
 * @example
 * ```html
 * <syr-data-table-actions-panel
 *   [header]="'Actions'"
 *   [actions]="actionButtons"
 *   [exportLabel]="'Export'"
 *   [exportMenuItems]="exportOptions"
 *   [showExport]="true"
 *   (actionClick)="handleAction($event)"
 * ></syr-data-table-actions-panel>
 * ```
 */
@Component({
  selector: "syr-data-table-actions-panel",
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    ButtonModule,
    SplitButtonModule,
    TooltipModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    TranslateModule,
  ],
  template: `
    <p-panel
      [header]="header | translate"
      [toggleable]="toggleable"
      [(collapsed)]="collapsed"
      class="mb-3"
    >
      <div class="flex gap-2 align-items-center flex-wrap">
        <!-- Custom Action Buttons -->
        <button
          *ngFor="let action of actions"
          pButton
          type="button"
          [label]="action.label | translate"
          [icon]="action.icon || ''"
          [severity]="action.severity || 'secondary'"
          [disabled]="action.disabled"
          [pTooltip]="action.tooltip | translate"
          (click)="onActionClick(action)"
        ></button>

        <!-- Export Split Button with Dropdown -->
        <p-splitbutton
          *ngIf="showExport && exportMenuItems.length > 0"
          [label]="exportLabel | translate"
          icon="pi pi-download"
          [model]="exportMenuItems"
          [severity]="exportSeverity"
          (onClick)="onExportClick()"
          [pTooltip]="exportTooltip | translate"
          class="p-button-icon-left"
        ></p-splitbutton>

        <!-- Global Search -->
        <div *ngIf="showGlobalSearch" class="ml-auto">
          <p-inputgroup [ngStyle]="{ width: '25rem' }">
            <p-inputgroup-addon>
              <i class="pi pi-search"></i>
            </p-inputgroup-addon>
            <input
              pInputText
              type="text"
              [value]="globalSearchValue"
              (input)="onGlobalSearchChange($event)"
              [placeholder]="globalSearchPlaceholder | translate"
            />
          </p-inputgroup>
        </div>
      </div>
    </p-panel>
  `,
})
export class ActionsPanelComponent {
  /**
   * Header text for the panel (e.g., "Actions", "Aktionen")
   */
  @Input() header: string = "Actions";

  /**
   * Whether the panel is toggleable (can be collapsed/expanded)
   */
  @Input() toggleable: boolean = false;

  /**
   * Initial collapsed state of the panel
   */
  @Input() collapsed: boolean = false;

  /**
   * Array of action button definitions
   */
  @Input() actions: ActionButton[] = [];

  /**
   * Whether to show the export button
   */
  @Input() showExport: boolean = true;

  /**
   * Label for the export button
   */
  @Input() exportLabel: string = "Export";

  /**
   * Icon for the export button
   */
  @Input() exportIcon: string = "pi pi-download";

  /**
   * Severity/color scheme for the export button
   */
  @Input() exportSeverity:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "danger"
    | "help"
    | "contrast" = "secondary";

  /**
   * Tooltip for the export button
   */
  @Input() exportTooltip: string = "Export";

  /**
   * Menu items for the export dropdown
   */
  @Input() exportMenuItems: MenuItem[] = [];

  /**
   * Whether to show the global search input
   */
  @Input() showGlobalSearch: boolean = false;

  /**
   * Current value of the global search input
   */
  @Input() globalSearchValue: string = "";

  /**
   * Placeholder text for the global search input
   */
  @Input() globalSearchPlaceholder: string = "In Resultaten suchen";

  /**
   * Emits when an action button is clicked
   * Returns the action button definition
   */
  @Output() actionClick = new EventEmitter<ActionButton>();

  /**
   * Emits when the main export button is clicked (not dropdown items)
   */
  @Output() exportClick = new EventEmitter<void>();

  /**
   * Emits when the global search input value changes
   */
  @Output() globalSearchChange = new EventEmitter<string>();

  /**
   * Handle action button click
   */
  onActionClick(action: ActionButton): void {
    if (action.command) {
      action.command();
    }
    this.actionClick.emit(action);
  }

  /**
   * Handle main export button click
   */
  onExportClick(): void {
    this.exportClick.emit();
  }

  /**
   * Handle global search input change
   */
  onGlobalSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalSearchChange.emit(value);
  }
}
