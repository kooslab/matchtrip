<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let { data } = $props();

	let userRole = $derived(data?.userRole);
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');

	// Initialize with false for SSR, will be updated on client
	let hideBottomNav = $state(false);
	let hideTopNav = $state(false);

	// Update navigation visibility based on current page
	$effect(() => {
		if (browser) {
			const pathname = $page.url.pathname;
			
			// Update bottom nav visibility
			hideBottomNav = pathname.startsWith('/offers/create') ||
				pathname.match(/^\/trips\/[^\/]+$/) ||
				pathname.match(/^\/my-trips\/[^\/]+$/) ||
				pathname.match(/^\/my-trips\/[^\/]+\/edit/) ||
				pathname.match(/^\/my-offers\/[^\/]+$/) ||
				pathname.startsWith('/write-review/') ||
				pathname.match(/^\/profile\/guide\/orders\/[^\/]+$/) ||
				pathname.startsWith('/order-confirmation/') ||
				pathname.startsWith('/my-trips/create/') ||
				pathname.startsWith('/products') ||
				pathname.startsWith('/profile/guide/products') ||
				pathname.startsWith('/profile/guide/edit') ||
				pathname.startsWith('/profile/guide/revenue') ||
				pathname.startsWith('/chat/product/') ||
				pathname.startsWith('/order-history/details');
			
			// Update top nav visibility
			hideTopNav = pathname.startsWith('/chat/product/') ||
				pathname.match(/^\/chat\/[^\/]+$/) ||
				pathname.startsWith('/products/create');
		}
	});
</script>

<!-- Top Navigation -->
{#if !hideTopNav}
	<TopNav />
{/if}

<div class="flex min-h-screen flex-col {(isTraveler || isGuide) && !hideBottomNav ? 'pb-20' : ''}">
	<slot />

	<!-- Bottom Navigation for Travelers -->
	{#if isTraveler && !hideBottomNav}
		<BottomNav />
	{/if}

	<!-- Bottom Navigation for Guides -->
	{#if isGuide && !hideBottomNav}
		<GuideBottomNav />
	{/if}
</div>
