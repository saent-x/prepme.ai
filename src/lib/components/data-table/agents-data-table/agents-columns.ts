import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '../../ui/data-table';
import DataTableCell from './data-table-cell.svelte';
import type { InferSelectModel } from 'drizzle-orm';
import type { agents } from '$lib/db/schema';
import InterviewsCountCell from './interviews-count-cell.svelte';

type AgentColumnSchema = InferSelectModel<typeof agents> & {
  interviewCount: number;
};

export const columns: ColumnDef<AgentColumnSchema>[] = [
  {
    accessorKey: 'name',
    header: 'AgentName',
    cell: ({ row }) =>
      renderComponent(DataTableCell, {
        name: row.original.name,
        instructions: row.original.instructions
      })
  },
  {
    accessorKey: 'interviewCount',
    header: 'Interviews',
    cell: ({ row }) =>
      renderComponent(InterviewsCountCell, {
        interviewCount: row.original.interviewCount
      })
  },
  {
    accessorKey: 'amount',
    header: 'Amount'
  }
];
