<script lang="ts">
  import { Badge } from '../../ui/badge';
  import { cn } from '$lib/utils';
  import { CircleCheckIcon, CircleXIcon, ClockArrowUpIcon, LoaderIcon } from '@lucide/svelte';

  type Props = {
    status: string;
  };

  const statusIconMap = {
    upcoming: ClockArrowUpIcon,
    active: LoaderIcon,
    completed: CircleCheckIcon,
    processing: LoaderIcon,
    cancelled: CircleXIcon
  };

  const statusColorMap = {
    upcoming: 'bg-yellow-500/20 text-yellow-800 border-yellow-800/5',
    active: 'bg-blue-500/20 text-blue-800 border-blue-800/5',
    completed: 'bg-emerald-500/20 text-emerald-800 border-emerald-800/5',
    processing: 'bg-gray-300/20 text-gray-800 border-gray-800/5',
    cancelled: 'bg-rose-500/20 text-rose-800 border-rose-800/5'
  };

  const { status }: Props = $props();
  const Icon = statusIconMap[status as keyof typeof statusIconMap];
</script>

<Badge
  variant="outline"
  class={cn(
    'text-muted-foreground capitalize [&>svg]:size-4',
    statusColorMap[status as keyof typeof statusColorMap]
  )}
>
  <Icon class={cn(status === 'processing' && 'animate-spin')} />
  {status}
</Badge>
