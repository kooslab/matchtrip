<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { preloadRoute } from '$lib/utils/preloader';

	interface $$Props {
		href: string;
		class?: string;
		onclick?: () => void;
	}

	let { href, class: className = '', onclick = undefined, children } = $props();

	let isCurrentPage = $derived($page.url.pathname === href);

	function handleClick(event: Event) {
		// Don't navigate if already on this page
		if (isCurrentPage) {
			event.preventDefault();
			return;
		}

		// Call custom onclick if provided
		if (onclick) {
			onclick();
		}

		// Navigate immediately
		goto(href);
	}

	function handleMouseEnter() {
		// Preload on hover for faster navigation
		if (!isCurrentPage) {
			preloadRoute(href);
		}
	}
</script>

<a
	{href}
	class="transition-colors duration-200 {className}"
	onclick={handleClick}
	onmouseenter={handleMouseEnter}>
	{@render children()}
</a>
