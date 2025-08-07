import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from './ui/data-table';
import DataTableCell from './data-table-cell.svelte';
import type { InferSelectModel } from 'drizzle-orm';
import type { agents } from '$lib/db/schema';
import MeetingsCountCell from './meetings-count-cell.svelte';

export const columns: ColumnDef<InferSelectModel<typeof agents>>[] = [
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
    accessorKey: 'meetingCount',
    header: 'Meetings',
    cell: ({ row }) =>
      renderComponent(MeetingsCountCell, {
        meetingCount: 5
      })
  },
  {
    accessorKey: 'amount',
    header: 'Amount'
  }
];
