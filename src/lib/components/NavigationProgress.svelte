<script lang="ts">
	import { navigating } from '$app/stores';
	
	let isNavigating = $state(false);
	
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
	<div class="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200">
		<div class="h-full bg-blue-500 animate-progress"></div>
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