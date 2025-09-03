import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '../ui/data-table';
import DataTableCell from './data-table-cell.svelte';
import type { InterviewOneSchema } from '$lib/db/schema';
import StatusCell from './status-cell.svelte';
import DurationCell from './duration-cell.svelte';

export const columns: ColumnDef<InterviewOneSchema>[] = [
  {
    accessorKey: 'name',
    header: 'Interview Name',
    cell: ({ row }) =>
      renderComponent(DataTableCell, {
        name: row.original.name,
        startedAt: row.original.startedAt,
        agent: row.original.agent
      })
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      renderComponent(StatusCell, {
        status: row.original.status
      })
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) =>
      renderComponent(DurationCell, {
        duration: row.original.duration
      })
  }
];
