<script lang="ts">
	import { Button } from 'bits-ui';

	interface $$Props {
		loading?: boolean;
		loadingText?: string;
		disabled?: boolean;
		class?: string;
		href?: string;
	}

	let { loading = false, loadingText = 'Loading...', class: className = '', ...props } = $props();
</script>

<Button.Root
	{...props}
	disabled={loading || props.disabled}
	class="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50 {className}">
	{#if loading}
		<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
		<span>{loadingText}</span>
	{:else}
		<slot />
	{/if}
</Button.Root>
