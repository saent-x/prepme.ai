import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '../ui/data-table';
import DataTableCell from './data-table-cell.svelte';
import type { AgentOneSchema, InterviewOneSchema } from '$lib/db/schema';
import StatusCell from './status-cell.svelte';
import DurationCell from './duration-cell.svelte';

type InterviewColumnSchema = InterviewOneSchema & {
  agent: AgentOneSchema;
  duration: number;
};

export const columns: ColumnDef<InterviewColumnSchema>[] = [
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
