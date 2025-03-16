<script lang="ts">
	import { signIn } from '$lib/authClient';
    import { goto } from '$app/navigation';
	let email = $state('');
	let password = $state('');
    let error = $state('');
	async function handleSubmit() {
		const result = await signIn.email({
			email,
			password,
			rememberMe: true,
			callbackURL: '/app'
		});
		if (result.error) {
			error = result.error.message ?? 'An unknown error occurred';
		} else {
			goto(result.data.url ?? '/app');
		}
	}
</script>

<form class="mx-auto mt-10 flex max-w-md flex-col gap-4" onsubmit={handleSubmit}>
	<input
		type="email"
		placeholder="Email"
		class="rounded-md border border-gray-300 p-2"
		bind:value={email}
	/>
	<input
		type="password"
		placeholder="Password"
		class="rounded-md border border-gray-300 p-2"
		bind:value={password}
	/>
	<button type="submit" class="rounded-md bg-blue-500 p-2 text-white">Sign in</button>
	<p class="mt-4 text-sm text-gray-500">Don't have an account? <a href="/signup" class="text-blue-500">Sign up</a></p>
    {#if error}
        <p class="mt-4 text-sm text-red-500">{error}</p>
    {/if}
</form>
