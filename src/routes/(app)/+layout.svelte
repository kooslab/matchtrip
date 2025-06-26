<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	
	let { data } = $props();
	
	let userRole = $derived(data?.userRole);
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');
</script>

<!-- Top Navigation -->
<TopNav />

<div class="flex min-h-screen flex-col {(isTraveler || isGuide) ? 'pb-20' : ''}">
	<slot />
	
	<!-- Bottom Navigation for Travelers -->
	{#if isTraveler}
		<BottomNav />
	{/if}
	
	<!-- Bottom Navigation for Guides -->
	{#if isGuide}
		<GuideBottomNav />
	{/if}
</div>