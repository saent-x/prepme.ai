<script lang="ts">
    import AuthForm from "$lib/components/auth-form.svelte";
    import { authClient } from "$lib/auth-client";
    import { toast } from "svelte-sonner";

    let name = $state("devtor");
    let email = $state("vangerwua@outlook.com");
    let password = $state("johnpaul");

    let session = authClient.useSession();

    function signupHandler() {
        authClient.signUp.email(
            {
                email,
                name,
                password,
                callbackURL: '/auth/sign-in'
            },
            {
                onError: () => {
                    toast.error("an error occurred!");
                },
                onSuccess: () => {
                    toast.success("Successful sign-up!");
                },
            },
        );
    }
</script>

<AuthForm
    authType="sign-up"
    bind:name
    bind:email
    bind:password
    onSubmit={signupHandler}
/>
