<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	let userRole = $derived(data?.userRole);
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');

	// Hide bottom nav for offers/create routes, trips detail pages, my-trips detail pages, my-offers detail pages, write-review pages, edit pages, guide order detail pages, order-confirmation pages, and my-trips/create pages
	let hideBottomNav = $derived(
		$page.url.pathname.startsWith('/offers/create') ||
			$page.url.pathname.match(/^\/trips\/[^\/]+$/) ||
			$page.url.pathname.match(/^\/my-trips\/[^\/]+$/) ||
			$page.url.pathname.match(/^\/my-trips\/[^\/]+\/edit/) ||
			$page.url.pathname.match(/^\/my-offers\/[^\/]+$/) ||
			$page.url.pathname.startsWith('/write-review/') ||
			$page.url.pathname.match(/^\/profile\/guide\/orders\/[^\/]+$/) ||
			$page.url.pathname.startsWith('/order-confirmation/') ||
			$page.url.pathname.startsWith('/my-trips/create/')
	);
</script>

<!-- Top Navigation -->
<TopNav />

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
