<script lang="ts">
  import InterviewerEditor from '$lib/components/app/interviewer-editor.svelte';
  let { form } = $props();
</script>

<svelte:head><title>New interviewer · PrepMe</title></svelte:head>
<a href="/dashboard/interviewers" class="text-sm text-muted-foreground hover:text-foreground">← Interviewers</a>
<h1 class="mt-4 mb-8 text-3xl font-semibold tracking-tight">New interviewer</h1>
<InterviewerEditor
  values={{ name: '', instructions: '', voice: 'marin', template: null }}
  error={form?.error}
  submitLabel="Create interviewer"
  showTemplates
/>
