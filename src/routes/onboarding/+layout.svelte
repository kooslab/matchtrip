<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	
	// Disable browser's scroll restoration
	if (browser) {
		history.scrollRestoration = 'manual';
	}
	
	// Reset scroll BEFORE navigation
	beforeNavigate(() => {
		if (browser) {
			window.scrollTo(0, 0);
		}
	});
	
	// Force scroll to top AFTER navigation with multiple attempts
	afterNavigate(async () => {
		if (!browser) return;
		
		// Immediate attempt
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
		
		// After Svelte updates
		await tick();
		window.scrollTo(0, 0);
		
		// After browser paint
		requestAnimationFrame(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		});
		
		// Final attempt after a small delay
		setTimeout(() => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 100);
	});
	
	// Also reset on mount
	onMount(() => {
		// Disable browser's scroll restoration
		history.scrollRestoration = 'manual';
		
		// Force scroll to top
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
	});
</script>

<style>
	:global(html) {
		scroll-behavior: auto !important;
	}
</style>

<slot />