# @syrius/data-table Usage Examples

## Basic Data Table

```typescript
import { Component } from '@angular/core';
import { DataTableComponent, ColumnDefinition, TableConfiguration } from '@syrius/data-table';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <syr-data-table
      [data]="users"
      [columnDefs]="columns"
      [config]="tableConfig"
      [loading]="loading"
      (rowSelected)="onRowSelected($event)"
      (exportData)="onExportData($event)">
    </syr-data-table>
  `
})
export class UserListComponent {
  loading = false;
  
  users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      active: true,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith', 
      email: 'jane.smith@example.com',
      active: false,
      createdAt: '2024-01-20T14:45:00Z'
    }
  ];

  columns: ColumnDefinition<User>[] = [
    {
      field: 'id',
      header: 'ID',
      type: 'number',
      mustShow: true,
      minWidth: '80px'
    },
    {
      field: 'name',
      header: 'Name',
      type: 'string',
      filterable: true,
      minWidth: '150px'
    },
    {
      field: 'email',
      header: 'Email',
      type: 'string',
      filterable: true,
      minWidth: '200px'
    },
    {
      field: 'active',
      header: 'Active',
      type: 'boolean',
      filterable: true,
      minWidth: '100px'
    },
    {
      field: 'createdAt',
      header: 'Created',
      type: 'date',
      format: 'dd.MM.yyyy',
      minWidth: '120px'
    }
  ];

  tableConfig: TableConfiguration<User> = {
    enableSorting: true,
    enableColumnFiltering: true,
    enableGlobalSearch: true,
    enablePagination: true,
    enableExport: true,
    pageSize: 15,
    selectionMode: 'single',
    dataKey: 'id',
    showCaption: true,
    captionText: 'User Management'
  };

  onRowSelected(user: User) {
    console.log('Selected user:', user);
  }

  onExportData(data: User[]) {
    // Convert to CSV, Excel, etc.
    console.log('Exporting users:', data);
    this.exportToCsv(data);
  }

  private exportToCsv(data: User[]) {
    // Implementation for CSV export
    const csvContent = this.convertToCsv(data);
    this.downloadFile(csvContent, 'users.csv', 'text/csv');
  }

  private convertToCsv(data: User[]): string {
    const headers = ['ID', 'Name', 'Email', 'Active', 'Created'];
    const rows = data.map(user => [
      user.id,
      user.name,
      user.email,
      user.active ? 'Yes' : 'No',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  private downloadFile(content: string, filename: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
```

## Advanced Features

### Action Columns

```typescript
const columnsWithActions: ColumnDefinition<User>[] = [
  // ... other columns ...
  {
    field: 'actions',
    header: 'Actions',
    type: 'actions',
    mustShow: true,
    minWidth: '120px',
    actions: [
      {
        label: 'common.actions.edit',
        icon: 'pi pi-pencil',
        command: (user) => this.editUser(user),
        visible: (user) => this.canEdit(user)
      },
      {
        label: 'common.actions.delete',
        icon: 'pi pi-trash',
        command: (user) => this.deleteUser(user),
        visible: (user) => this.canDelete(user)
      },
      {
        label: 'common.actions.view',
        icon: 'pi pi-eye',
        command: (user) => this.viewUser(user)
      }
    ]
  }
];
```

### Custom Rendering

```typescript
const customColumns: ColumnDefinition<User>[] = [
  {
    field: 'status',
    header: 'Status',
    type: 'custom',
    customRender: (user, col) => {
      const statusClass = user.active ? 'success' : 'danger';
      const statusText = user.active ? 'Active' : 'Inactive';
      return `<span class="badge badge-${statusClass}">${statusText}</span>`;
    }
  },
  {
    field: 'profile',
    header: 'Profile',
    type: 'custom',
    customRender: (user, col) => {
      return `
        <div class="user-profile">
          <img src="${user.avatarUrl}" alt="${user.name}" class="avatar">
          <span>${user.name}</span>
        </div>
      `;
    }
  }
];
```

### Server-Side Data

```typescript
@Component({
  template: `
    <syr-data-table
      [data]="users"
      [columnDefs]="columns"
      [config]="tableConfig"
      [loading]="loading"
      [totalRecords]="totalRecords"
      (pageChanged)="onPageChanged($event)"
      (sortChanged)="onSortChanged($event)"
      (filterChanged)="onFilterChanged($event)">
    </syr-data-table>
  `
})
export class ServerSideTableComponent {
  users: User[] = [];
  loading = false;
  totalRecords = 0;
  
  private currentPage = 0;
  private currentPageSize = 15;
  private currentFilters: Record<string, any> = {};
  private currentSort: any[] = [];

  tableConfig: TableConfiguration<User> = {
    enablePagination: true,
    enableSorting: true,
    enableColumnFiltering: true,
    pageSize: 15,
    // Important: Server-side mode
    // The component will emit events instead of handling data locally
  };

  ngOnInit() {
    this.loadData();
  }

  onPageChanged(event: TablePaginationEvent) {
    this.currentPage = event.page || 0;
    this.currentPageSize = event.rows;
    this.loadData();
  }

  onSortChanged(sortEvents: TableSortEvent[]) {
    this.currentSort = sortEvents;
    this.loadData();
  }

  onFilterChanged(filterEvent: { filters: Record<string, unknown>, globalFilter?: string }) {
    this.currentFilters = filterEvent.filters;
    this.currentPage = 0; // Reset to first page when filtering
    this.loadData();
  }

  private loadData() {
    this.loading = true;
    
    const params = {
      page: this.currentPage,
      size: this.currentPageSize,
      sort: this.currentSort.map(s => `${s.field},${s.order === 1 ? 'asc' : 'desc'}`),
      filters: this.currentFilters
    };

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        this.users = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading = false;
      }
    });
  }
}
```

## Integration with Existing Components

If you have existing components using the old `app-data-table`, update them:

```typescript
// Before (old app component)
import { DataTableComponent } from '@components/data-table/data-table.component';

@Component({
  template: `
    <app-data-table [data]="data" [columnDefs]="columns"></app-data-table>
  `,
  imports: [DataTableComponent]
})

// After (new library)
import { DataTableComponent } from '@syrius/data-table';

@Component({
  template: `
    <syr-data-table [data]="data" [columnDefs]="columns"></syr-data-table>
  `,
  imports: [DataTableComponent]
})
```

## Responsive Configuration

```typescript
const responsiveColumns: ColumnDefinition<User>[] = [
  {
    field: 'id',
    header: 'ID',
    mustShow: true,        // Always visible
    minWidth: '60px'
  },
  {
    field: 'name',
    header: 'Name',
    mustShow: true,        // Always visible
    minWidth: '150px'
  },
  {
    field: 'email',
    header: 'Email',
    minWidth: '200px'      // Hidden on small screens
  },
  {
    field: 'phone',
    header: 'Phone',
    minWidth: '150px'      // Hidden on smaller screens
  },
  {
    field: 'department',
    header: 'Department',
    minWidth: '120px'      // Hidden on smallest screens
  },
  {
    field: 'actions',
    header: 'Actions',
    type: 'actions',
    mustShow: true,        // Always visible
    minWidth: '100px'
  }
];
```

The table will automatically show/hide columns based on available width, prioritizing `mustShow` columns and then adding others based on their `minWidth` requirements.
