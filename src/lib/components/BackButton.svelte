<script lang="ts">
	import { goto } from '$app/navigation';
	import arrowBackUrl from '$lib/icons/icon-arrow-back-android-mono.svg';

	interface Props {
		href?: string;
		onclick?: () => void;
		class?: string;
	}

	let { href, onclick, class: className = '' }: Props = $props();

	function handleClick() {
		if (onclick) {
			onclick();
		} else if (href) {
			goto(href);
		} else {
			history.back();
		}
	}
</script>

<button
	onclick={handleClick}
	class="relative size-5 shrink-0 overflow-clip {className}"
	aria-label="Go back"
>
	<img
		alt="Back"
		class="block size-full max-w-none"
		src={arrowBackUrl}
		style="filter: brightness(0) saturate(100%) invert(30%) sepia(98%) saturate(1773%) hue-rotate(197deg) brightness(102%) contrast(96%);"
	/>
</button>
