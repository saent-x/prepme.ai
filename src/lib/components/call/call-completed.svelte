<script lang="ts">
  import type { InterviewOneSchema } from '$lib/db/schema';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { ScrollArea, Scrollbar } from '../ui/scroll-area';
  import {
    BookOpenTextIcon,
    ClockFadingIcon,
    FileTextIcon,
    FileVideoIcon,
    SparkleIcon
  } from '@lucide/svelte';
  import AvatarGen from '../shared/avatar-gen.svelte';
  import { format } from 'date-fns';
  import { Badge } from '../ui/badge';
  import { formatDuration } from '$lib/utils';
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import CallTranscript from './call-transcript.svelte';
  import ChatProvider from '../chat/chat-provider.svelte';

  type Props = {
    data: InterviewOneSchema;
  };

  const { data }: Props = $props();
  const plugins = [gfmPlugin()];
  let videoEl: HTMLVideoElement;

  function handleLoadedMetadata() {
    if (!videoEl) return;

    videoEl.currentTime = 0.01;
    videoEl.pause();
  }
</script>

<div class="flex flex-col gap-y-4">
  <Tabs.Root value="chat">
    <div class="rounded-lg border bg-white px-3">
      <ScrollArea>
        <Tabs.List class="bg-background h-13 justify-start rounded-none p-0">
          <Tabs.Trigger
            value="summary"
            class="text-muted-foreground bg-background data-[state=active]:border-b-primary
              data-[state=active]:text-accent-foreground hover:text-accent-foreground h-full rounded-none
              border-b-2 border-transparent data-[state=active]:shadow-none"
          >
            <BookOpenTextIcon />
            Summary
          </Tabs.Trigger>
          <Tabs.Trigger
            value="transcript"
            class="text-muted-foreground bg-background data-[state=active]:border-b-primary
              data-[state=active]:text-accent-foreground hover:text-accent-foreground h-full rounded-none
              border-b-2 border-transparent data-[state=active]:shadow-none"
          >
            <FileTextIcon />
            Transcript
          </Tabs.Trigger>
          <Tabs.Trigger
            value="recording"
            class="text-muted-foreground bg-background data-[state=active]:border-b-primary
              data-[state=active]:text-accent-foreground hover:text-accent-foreground h-full rounded-none
              border-b-2 border-transparent data-[state=active]:shadow-none"
          >
            <FileVideoIcon />
            Recording
          </Tabs.Trigger>
          <Tabs.Trigger
            value="chat"
            class="text-muted-foreground bg-background data-[state=active]:border-b-primary
              data-[state=active]:text-accent-foreground hover:text-accent-foreground h-full rounded-none
              border-b-2 border-transparent data-[state=active]:shadow-none"
          >
            <SparkleIcon />
            Ask AI
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="summary">
          <div class="rounded-lg bg-white">
            <div class="col-span-5 flex flex-col gap-y-5 px-4 py-5">
              <h2 class="text-2xl font-medium capitalize">{data.name}</h2>
              <div class="flex items-center gap-x-2">
                <a
                  href={`/dashboard/agents/${data.agentId}`}
                  class="flex items-center gap-x-2 underline underline-offset-4"
                >
                  <AvatarGen variant="bot" name={data.agent.name} class="size-5" />
                  {data.agent.name}
                </a>
                <p>{data.startedAt ? format(data.startedAt, 'PPP') : ''}</p>
              </div>
              <div class="flex items-center gap-x-2">
                <SparkleIcon class="size-4" />
                <p>General Summary</p>
              </div>
              <Badge variant="outline" class="flex items-center gap-x-2 [&>svg]:size-4">
                <ClockFadingIcon class="text-blue-700" />
                {data.duration ? formatDuration(data.duration) : 'No duration'}
              </Badge>
              <div class="markdown-body">
                <Markdown md={data.summary!} {plugins} />
              </div>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="transcript">
          <CallTranscript interviewId={data.id} />
        </Tabs.Content>
        <Tabs.Content value="recording">
          <div class="rounded-lg bg-white px-4 py-5">
            <p class="p-2 text-sm text-red-700">*NOTE: videos expire after 2 weeks</p>
            <video
              bind:this={videoEl}
              onloadedmetadata={handleLoadedMetadata}
              id="recordedVideo"
              src={data.recordingUrl!}
              class="w-full rounded-lg"
              controls
              preload="auto"
            >
              <track kind="captions" />
            </video>
          </div>
        </Tabs.Content>
        <Tabs.Content value="chat">
          <ChatProvider interviewId={data.id} interviewName={data.name} />
        </Tabs.Content>
        <Scrollbar orientation="horizontal" />
      </ScrollArea>
    </div>
  </Tabs.Root>
</div>

<style>
  :global(.markdown-body) {
    line-height: 1.7;
    font-size: 0.95rem;
  }

  :global(.markdown-body h1),
  :global(.markdown-body h2),
  :global(.markdown-body h3),
  :global(.markdown-body h4),
  :global(.markdown-body h5),
  :global(.markdown-body h6) {
    color: var(--foreground, #111827);
    margin: 1em 0 0.5em;
    line-height: 1.7;
    font-weight: 600;
  }
  :global(.markdown-body h1) {
    font-size: 1.625rem;
  }
  :global(.markdown-body h2) {
    font-size: 1.375rem;
  }
  :global(.markdown-body h3) {
    font-size: 1.25rem;
  }

  :global(.markdown-body p) {
    margin: 0.75em 0;
  }

  :global(.markdown-body a) {
    color: var(--primary, #2563eb);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :global(.markdown-body ul),
  :global(.markdown-body ol) {
    margin: 0.75em 0 0.75em 1.25em;
    padding: 0;
  }
  :global(.markdown-body ul) {
    list-style: disc;
  }
  :global(.markdown-body ol) {
    list-style: decimal;
  }
  :global(.markdown-body li + li) {
    margin-top: 0.25em;
  }

  :global(.markdown-body code) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
    background: var(--muted, #f3f4f6);
    color: var(--foreground, #111827);
    padding: 0.15em 0.35em;
    border-radius: 6px;
    font-size: 0.9em;
  }
  :global(.markdown-body pre) {
    background: var(--muted, #f3f4f6);
    color: var(--foreground, #111827);
    padding: 1rem;
    border-radius: 8px;
    overflow: auto;
    margin: 1em 0;
  }
  :global(.markdown-body pre code) {
    background: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 0.9em;
  }

  :global(.markdown-body blockquote) {
    margin: 1em 0;
    padding-left: 1rem;
    border-left: 3px solid var(--border, #e5e7eb);
    color: var(--muted-foreground, #374151);
  }

  :global(.markdown-body hr) {
    border: 0;
    border-top: 1px solid var(--border, #e5e7eb);
    margin: 1.25em 0;
  }

  :global(.markdown-body table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.95rem;
  }
  :global(.markdown-body th),
  :global(.markdown-body td) {
    border: 1px solid var(--border, #e5e7eb);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  :global(.markdown-body thead th) {
    background: var(--muted, #f3f4f6);
    color: var(--foreground, #111827);
  }

  :global(.markdown-body img) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }
</style>
