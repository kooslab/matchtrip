<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession, signOut } from '$lib/authClient';

	const session = useSession();
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1 class="text-2xl font-bold">Welcome to the app</h1>
	<p class=" mt-2">
		This is a protected page. See the <span class="font-mono">hooks.server.ts</span> file to see how it works.
	</p>
	<p class="mt-4">Logged in as <span class="font-bold">{$session.data?.user?.email}</span></p>
	<button
		onclick={() =>
			signOut({
				fetchOptions: {
					onSuccess: () => {
						goto('/signin', { invalidateAll: true });
					}
				}
			})}
		class="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white">Sign out</button>
</div>
