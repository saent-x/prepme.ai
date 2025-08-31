<script lang="ts">
  type Props = {
    name: string;
  };

  const { name }: Props = $props();
  const initials = name
    .split(' ')
    .splice(0, 2)
    .map((n) => n[0])
    .join('');
</script>

<div class="flex h-[100px] w-[100px] items-center justify-center">
  {initials}
</div>
