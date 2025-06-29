<script lang="ts">
    import AuthForm from "$lib/components/auth-form.svelte";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";

    let email = $state("vangerwua@outlook.com");
    let password = $state("johnpaul");

    let session = authClient.useSession();

    function signinHandler() {
        authClient.signIn.email(
            {
                email,
                password,
                callbackURL: '/dashboard'
            },
            {
                onError: () => {
                    toast.error("an error occurred!");
                },
                onSuccess: (e) => {
                    toast.success("Successful sign-in!");
                },
            },
        );
    }
</script>

<AuthForm
    authType="sign-in"
    bind:email
    bind:password
    onSubmit={signinHandler}
/>
