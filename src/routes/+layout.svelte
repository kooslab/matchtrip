<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import MobileContainer from '$lib/components/MobileContainer.svelte';
	import PWAInstallBanner from '$lib/components/PWAInstallBanner.svelte';
	import AnnouncementModal from '$lib/components/AnnouncementModal.svelte';
	import { onMount } from 'svelte';
	import { pwaStore } from '$lib/stores/pwaStore';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { trackPageView, setUserProperties } from '$lib/utils/analytics';

	let { data } = $props();

	let user = $derived(data?.user);
	let isLoggedIn = $derived(!!user);

	// Initialize PWA functionality and enable scroll restoration
	onMount(() => {
		pwaStore.init();

		// Ensure browser scroll restoration is enabled
		if (browser && 'scrollRestoration' in history) {
			history.scrollRestoration = 'auto';
		}
	});

	// Track pageview and handle scroll after navigation completes
	afterNavigate((navigation) => {
		if (browser) {
			// Track pageview
			trackPageView(navigation.to?.url.pathname || '/');

			// Scroll to top on navigation (SvelteKit default behavior)
			// This ensures all scroll containers are reset
			requestAnimationFrame(() => {
				window.scrollTo(0, 0);
				// Also scroll document element and body to be thorough
				document.documentElement.scrollTop = 0;
				document.body.scrollTop = 0;
			});
		}
	});

	// Set user properties when user data changes
	$effect(() => {
		if (browser && user) {
			setUserProperties({
				user_role: user.role as 'traveler' | 'guide' | 'admin',
				is_authenticated: true
			});
		} else if (browser && !user) {
			setUserProperties({
				is_authenticated: false
			});
		}
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

	<!-- Announcement Modal -->
	<AnnouncementModal />
</MobileContainer>
