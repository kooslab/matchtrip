<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import MobileContainer from '$lib/components/MobileContainer.svelte';
	import PWAInstallBanner from '$lib/components/PWAInstallBanner.svelte';
	import { onMount } from 'svelte';
	import { pwaStore } from '$lib/stores/pwaStore';

	let { data } = $props();

	let user = $derived(data?.user);
	let isLoggedIn = $derived(!!user);

	// Initialize PWA functionality
	onMount(() => {
		pwaStore.init();
	});

	// Preload common routes for logged in users
	$effect(() => {
		if (isLoggedIn) {
			preloadCommonRoutes();
		}
	});
</script>

<MobileContainer>
	<!-- Global Navigation Progress Bar -->
	<NavigationProgress />

	<div class="relative mx-auto min-h-screen max-w-[430px] bg-white">
		<slot />
	</div>
	
	<!-- PWA Install Banner -->
	<PWAInstallBanner />
</MobileContainer>
