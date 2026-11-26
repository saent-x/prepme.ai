<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';

  // Everything PrepMe draws or plays that someone else made, with its licence.
  const credits = [
    {
      what: 'Interviewer faces',
      name: 'Fun Emoji by Davis Uche, via DiceBear',
      licence: 'CC BY 4.0',
      href: 'https://www.dicebear.com/styles/fun-emoji/',
      licenceHref: 'https://creativecommons.org/licenses/by/4.0/',
      note: 'Recoloured and given set expressions per interviewer.'
    },
    {
      what: 'People avatars',
      name: 'Open Peeps by Pablo Stanley, via DiceBear',
      licence: 'CC0 1.0',
      href: 'https://www.dicebear.com/styles/open-peeps/',
      licenceHref: 'https://creativecommons.org/publicdomain/zero/1.0/'
    },
    {
      what: 'Avatar library',
      name: 'DiceBear by Florian Körner',
      licence: 'MIT',
      href: 'https://www.dicebear.com/',
      licenceHref: 'https://github.com/dicebear/dicebear/blob/main/LICENSE'
    },
    {
      what: 'Icons',
      name: 'Phosphor Icons by Helena Zhang and Tobias Fried',
      licence: 'MIT',
      href: 'https://phosphoricons.com/',
      licenceHref: 'https://github.com/phosphor-icons/homepage/blob/master/LICENSE'
    },
    {
      what: 'Illustrations',
      name: 'unDraw by Katerina Limpitsouni',
      licence: 'unDraw licence',
      href: 'https://undraw.co/',
      licenceHref: 'https://undraw.co/license',
      note: 'Recoloured to match PrepMe.'
    },
    {
      what: 'Sounds',
      name: 'SND kit 01 by Yasuhiro Tsuchiya',
      licence: 'SND terms',
      href: 'https://snd.dev/',
      licenceHref: 'https://snd.dev/',
      note: 'The notification and celebration sounds. The other sounds are made in the browser.'
    },
    {
      what: 'Typeface',
      name: 'Plus Jakarta Sans by Tokotype',
      licence: 'SIL OFL 1.1',
      href: 'https://fonts.google.com/specimen/Plus+Jakarta+Sans',
      licenceHref: 'https://openfontlicense.org/'
    }
  ];
</script>

<svelte:head><title>Credits · PrepMe</title></svelte:head>

<div class="mx-auto max-w-[720px] px-5 py-8 sm:py-12">
  <a href="/" aria-label="PrepMe home"><Logo /></a>
  <h1 class="page-title mt-10">Credits</h1>
  <p class="mt-1 text-sm text-muted-foreground">PrepMe is built with work these people share. Thank you.</p>

  <ul class="mt-6 border-y hair-list">
    {#each credits as c (c.what)}
      <li class="grid gap-1 py-3.5 sm:grid-cols-[160px_1fr_auto] sm:items-baseline sm:gap-4">
        <span class="text-xs font-semibold text-muted-foreground">{c.what}</span>
        <span class="min-w-0">
          <a href={c.href} target="_blank" rel="noopener noreferrer" class="text-sm font-semibold hover:underline">{c.name}</a>
          {#if c.note}<span class="block text-xs text-muted-foreground">{c.note}</span>{/if}
        </span>
        <a href={c.licenceHref} target="_blank" rel="noopener noreferrer" class="link text-xs">{c.licence}</a>
      </li>
    {/each}
  </ul>
</div>
