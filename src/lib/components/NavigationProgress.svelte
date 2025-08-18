<script lang="ts">
	import { navigating } from '$app/stores';
	import { browser } from '$app/environment';

	let isNavigating = $state(false);
	let isDesktop = $state(false);

	// Check if desktop
	$effect(() => {
		if (browser) {
			const checkDesktop = () => {
				isDesktop = window.innerWidth >= 1024;
			};

			checkDesktop();
			window.addEventListener('resize', checkDesktop);

			return () => {
				window.removeEventListener('resize', checkDesktop);
			};
		}
	});

	// Watch for navigation state changes
	$effect(() => {
		if ($navigating) {
			isNavigating = true;
		} else {
			// Add a small delay before hiding to ensure smooth animation
			setTimeout(() => {
				isNavigating = false;
			}, 300);
		}
	});
</script>

{#if isNavigating}
	<!-- On desktop, position below MobileContainer status bar (44px from top) -->
	<!-- On mobile, position at the very top -->
	<div class="fixed right-0 left-0 z-[100] h-1 bg-gray-200 {isDesktop ? 'top-11' : 'top-0'}">
		<div class="animate-progress h-full bg-blue-500"></div>
	</div>
{/if}

<style>
	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
		}
	}

	.animate-progress {
		animation: progress 2s ease-in-out infinite;
	}
</style>
