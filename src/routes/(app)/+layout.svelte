<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	let userRole = $derived(data?.userRole);
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');

	// Hide bottom nav for offers/create routes, trips detail pages, my-trips detail pages, my-offers detail pages, write-review pages, edit pages, guide order detail pages, order-confirmation pages, my-trips/create pages, products pages, product chat pages, and order-history detail pages
	let hideBottomNav = $derived.by(() => {
		const pathname = $page.url.pathname;
		return pathname.startsWith('/offers/create') ||
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
			pathname.startsWith('/chat/product/') ||
			pathname.startsWith('/order-history/details');
	});

	// Hide top nav for chat pages (both regular and product chat) and product creation pages
	let hideTopNav = $derived.by(() => {
		const pathname = $page.url.pathname;
		return pathname.startsWith('/chat/product/') ||
			pathname.match(/^\/chat\/[^\/]+$/) ||
			pathname.startsWith('/products/create');
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
