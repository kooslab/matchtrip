<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';

	let { data } = $props();

	let user = $derived(data?.user);
	let isLoggedIn = $derived(!!user);

	// Preload common routes for logged in users
	$effect(() => {
		if (isLoggedIn) {
			preloadCommonRoutes();
		}
	});
</script>

<!-- Global Loading Bar -->
{#if typeof window !== 'undefined' && $navigating}
	<div class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-200">
		<div class="h-full animate-pulse bg-gradient-to-r from-blue-500 to-pink-500"></div>
	</div>
{/if}


<div class="mx-auto max-w-[430px] min-h-screen bg-white">
	<slot />
</div>
