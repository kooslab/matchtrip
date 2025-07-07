<script lang="ts">
	interface Props {
		class?: string;
		filled?: boolean;
	}

	let { class: className = 'h-5 w-5', filled = false }: Props = $props();
</script>

{#if filled}
	<svg class={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="10" cy="10" r="10" fill="currentColor" />
		<path
			d="M14.5 7L8.5 13L5.5 10"
			stroke="white"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{:else}
	<svg class={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" />
	</svg>
{/if}
