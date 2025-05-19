<script lang="ts">
	import { signUp } from '$lib/authClient';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit() {
		isLoading = true;
		try {
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
		} finally {
			isLoading = false;
		}
	}
</script>

<form class="mx-auto mt-10 flex max-w-md flex-col gap-4" onsubmit={handleSubmit}>
	<input
		type="email"
		placeholder="Email"
		class="rounded-md border border-gray-300 p-2"
		bind:value={email}
		disabled={isLoading} />
	<input
		type="password"
		placeholder="Password"
		class="rounded-md border border-gray-300 p-2"
		bind:value={password}
		disabled={isLoading} />
	<Button type="submit" loading={isLoading} loadingText="회원가입 중...">회원가입</Button>
	<p class="mt-4 text-sm text-gray-500">
		이미 계정이 있으신가요? <a href="/signin" class="text-blue-500">로그인</a>
	</p>
	{#if error}
		<p class="mt-4 text-sm text-red-500">{error}</p>
	{/if}
</form>
