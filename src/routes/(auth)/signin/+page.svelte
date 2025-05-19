<script lang="ts">
	import { signIn } from '$lib/authClient';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit() {
		isLoading = true;
		try {
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
	<Button type="submit" loading={isLoading} loadingText="로그인 중...">로그인</Button>
	<p class="mt-4 text-sm text-gray-500">
		계정이 없으신가요? <a href="/signup" class="text-blue-500">회원가입</a>
	</p>
	{#if error}
		<p class="mt-4 text-sm text-red-500">{error}</p>
	{/if}
</form>
