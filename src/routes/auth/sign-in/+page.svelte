<script lang="ts">
  import AuthForm from '$lib/components/app/auth-form.svelte';
  let { data } = $props();
</script>

<svelte:head><title>Sign in · PrepMe</title></svelte:head>
<AuthForm mode="sign-in" providers={data.providers} next={data.next} />
