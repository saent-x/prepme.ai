<script lang="ts">
  import type { Picture } from 'vite-imagetools';

  type Props = {
    title: string;
    description: string;
    src?: string;
  };

  let { title, description, src }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center">
  <img src={src ?? '/src/assets/empty.svg'} alt="Empty" class="h-[240px] w-[240px]" />
  <div class="mx-auto flex max-w-md flex-col gap-y-6 text-center">
    <h6 class="text-lg font-medium">{title}</h6>
    <p class="text-muted-foreground text-sm">{description}</p>
  </div>
</div>
