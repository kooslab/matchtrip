<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';

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

<!-- Global Navigation Progress Bar -->
<NavigationProgress />

<div class="mx-auto min-h-screen max-w-[430px] bg-white">
	<slot />
</div>
