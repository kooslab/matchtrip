<script lang="ts">
	import { Button } from 'bits-ui';

	interface $$Props {
		loading?: boolean;
		loadingText?: string;
		disabled?: boolean;
		class?: string;
		href?: string;
		onclick?: (event: Event) => void;
		type?: string;
	}

	let {
		loading = false,
		loadingText = 'Loading...',
		class: className = '',
		onclick = undefined,
		...props
	} = $props();

	let isClicked = $state(false);

	function handleClick(event: Event) {
		// Show immediate feedback
		isClicked = true;

		// Reset after a short delay
		setTimeout(() => {
			isClicked = false;
		}, 150);

		// Call the provided onclick handler
		if (onclick) {
			onclick(event);
		}
	}
</script>

<Button.Root
	{...props}
	disabled={loading || props.disabled}
	onclick={handleClick}
	class="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 {isClicked
		? 'scale-95 bg-blue-600'
		: ''} {className}"
>
	{#if loading}
		<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
		<span>{loadingText}</span>
	{:else}
		<slot />
	{/if}
</Button.Root>
