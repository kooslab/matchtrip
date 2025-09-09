<script lang="ts">
	import { browser } from '$app/environment';
	import DesktopFrame from './DesktopFrame.svelte';

	let { children } = $props();

	let isDesktop = $state(false);

	$effect(() => {
		if (browser) {
			const checkDesktop = () => {
				isDesktop = window.innerWidth >= 1280;
			};

			checkDesktop();
			window.addEventListener('resize', checkDesktop);

			return () => {
				window.removeEventListener('resize', checkDesktop);
			};
		}
	});
</script>

{#if isDesktop}
	<DesktopFrame>
		{@render children()}
	</DesktopFrame>
{:else}
	{@render children()}
{/if}
