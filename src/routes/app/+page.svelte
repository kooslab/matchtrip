<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession, signOut } from '$lib/authClient';
	import Button from '$lib/components/Button.svelte';

	const session = useSession();
	let isLoading = $state(false);

	async function handleSignOut() {
		isLoading = true;
		try {
			await signOut({
				fetchOptions: {
					onSuccess: () => {
						goto('/signin', { invalidateAll: true });
					}
				}
			});
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1 class="text-2xl font-bold">Welcome to the MatchTrip</h1>
	<p class=" mt-2">
		This is a protected page. See the <span class="font-mono">hooks.server.ts</span> file to see how
		it works.
	</p>
	<p class="mt-4">Logged in as <span class="font-bold">{$session.data?.user?.email}</span></p>
	<Button onclick={handleSignOut} loading={isLoading} loadingText="로그아웃 중..." class="mt-4">
		로그아웃
	</Button>
</div>
