<script lang="ts" generics="TData, TValue">
  import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
  import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
  import * as Table from '$lib/components/ui/table/index.js';

  type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
  };

  let { data, columns, onRowClick }: DataTableProps<TData, TValue> = $props();

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    getCoreRowModel: getCoreRowModel()
  });
</script>

<div class="bg-background overflow-auto rounded-lg border">
  <Table.Root>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row
          class="cursor-pointer"
          data-state={row.getIsSelected() && 'selected'}
          onclick={() => onRowClick?.(row.original)}
        >
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell class="p-4 text-sm">
              <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-19 text-center text-muted-foreground"
            >No results.</Table.Cell
          >
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
