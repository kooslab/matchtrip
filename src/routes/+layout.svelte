<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import MobileContainer from '$lib/components/MobileContainer.svelte';
	import PWAInstallBanner from '$lib/components/PWAInstallBanner.svelte';
	import { onMount } from 'svelte';
	import { pwaStore } from '$lib/stores/pwaStore';
	import { afterNavigate, beforeNavigate, disableScrollHandling } from '$app/navigation';
	import { browser } from '$app/environment';
	import { trackPageView, setUserProperties } from '$lib/utils/analytics';

	let { data } = $props();

	let user = $derived(data?.user);
	let isLoggedIn = $derived(!!user);

	// Disable SvelteKit's scroll handling at module level (before any navigation)
	if (browser) {
		disableScrollHandling();
	}

	// Initialize PWA functionality
	onMount(() => {
		pwaStore.init();
	});

	// Scroll to top before navigation starts
	beforeNavigate(() => {
		if (browser) {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}
	});

	// Also scroll to top after navigation completes (belt and suspenders)
	afterNavigate((navigation) => {
		if (browser) {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

			// Track pageview
			trackPageView(navigation.to?.url.pathname || '/');
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
</MobileContainer>
