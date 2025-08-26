<script lang="ts">
  import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { ChevronRightIcon, MoreVerticalIcon, PencilIcon, TrashIcon } from '@lucide/svelte';
  import Button from './ui/button/button.svelte';

  type Props = {
    interviewId: string;
    interviewName: string;
    onUpdate: () => void;
    onRemove: () => void;
  };

  let { interviewId, interviewName, onRemove, onUpdate }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link class="text-xl font-medium" href="/dashboard/interviews">
          My Interviews
        </Breadcrumb.Link>
      </Breadcrumb.Item>
      <Breadcrumb.Separator class="text-foreground text-xl font-medium [&svg]:size-4">
        <ChevronRightIcon />
      </Breadcrumb.Separator>
      <Breadcrumb.Item>
        <Breadcrumb.Link
          class="text-foreground text-xl font-medium"
          href={`/dashboard/interviews/${interviewId}`}
        >
          {interviewName}
        </Breadcrumb.Link>
      </Breadcrumb.Item>
    </Breadcrumb.List>
  </Breadcrumb.Root>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Button variant="ghost">
        <MoreVerticalIcon />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item onclick={onUpdate}>
        <PencilIcon class="size-4 text-black" /> Update
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={onRemove}>
        <TrashIcon class="size-4 text-black" /> Delete
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
