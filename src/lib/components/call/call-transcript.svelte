<script lang="ts">
  import { SearchIcon } from '@lucide/svelte';
  import { getTranscript } from '../../../routes/dashboard/interviews/interviews.remote';
  import { Input } from '../ui/input';
  import { ScrollArea } from '../ui/scroll-area';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { generateAvatarUri } from '../avatar-gen.svelte';
  import { format } from 'date-fns';
  import Highlighter from '../highlighter.svelte';

  type Props = {
    interviewId: string;
  };

  type TranscriptItem = {
    user: {
      name: string;
      image: string;
    };
    speaker_id: string;
    type: string;
    text: string;
    start_ts: number;
    stop_ts: number;
  };

  const { interviewId }: Props = $props();
  const interviewQuery = getTranscript(interviewId);
  let searchQuery = $state<string>('');

  let data = $state<() => TranscriptItem[]>(() => {
    if (!interviewQuery.ready) {
      return [];
    }

    return interviewQuery.current!;
  });

  let filteredData = $state<() => TranscriptItem[]>(() =>
    data().filter((item) => item.text.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<div class="flex w-full flex-col gap-y-4 rounded-lg bg-white px-4 py-5">
  <p class="text-sm font-medium">Transcript</p>
  <div class="relative">
    <Input placeholder="Search Transcript" class="h-9 w-[240px] pl-7" bind:value={searchQuery} />
    <SearchIcon class="text-muted-foreground absolute top-1/2 left-2 size-4 -translate-y-1/2" />
  </div>

  <ScrollArea>
    <div class="flex flex-col gap-y-4">
      {#each filteredData() as item}
        <div class="hover:bg-muted flex flex-col gap-y-2 rounded-md border p-4">
          <div class="flex items-center gap-x-2">
            <Avatar.Root class="size-6">
              <Avatar.Image
                src={item.user.image ?? generateAvatarUri('initials', item.user.name)}
                alt="User Avatar"
              />
            </Avatar.Root>
            <p class="text-sm font-medium">{item.user.name}</p>
            <p class="text-sm font-medium text-blue-500">
              {format(new Date(0, 0, 0, 0, 0, 0, item.start_ts), 'mm:ss')}
            </p>
          </div>
          <Highlighter class="text-sm text-neutral-700" text={item.text} bind:query={searchQuery} />
        </div>
      {/each}
    </div>
  </ScrollArea>
</div>
