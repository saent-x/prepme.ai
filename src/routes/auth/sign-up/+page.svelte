<script lang="ts">
  import AuthForm from '$lib/components/app/auth-form.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Create account · PrepMe</title></svelte:head>
<AuthForm mode="sign-up" providers={data.providers} next={data.next} />
