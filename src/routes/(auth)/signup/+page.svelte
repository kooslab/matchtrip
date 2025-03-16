<script lang="ts">
	import { signUp } from '$lib/authClient';
	import { goto } from '$app/navigation';
	let email = $state('');
	let password = $state('');
    let error = $state('');

	async function handleSubmit() {
		const result = await signUp.email({
			email,
			password,
			name: email
		});
		if (result.error) {
			error = result.error.message ?? 'An unknown error occurred';
		} else {
			goto('/app');
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
	<button type="submit" class="rounded-md bg-blue-500 p-2 text-white">Sign up</button>
	<p class="mt-4 text-sm text-gray-500">Already have an account? <a href="/signin" class="text-blue-500">Sign in</a></p>
    {#if error}
        <p class="mt-4 text-sm text-red-500">{error}</p>
    {/if}
</form>
