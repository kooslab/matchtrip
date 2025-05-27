<script lang="ts">
	interface $$Props {
		class?: string;
		rows?: number;
		height?: string;
	}

	let { class: className = '', rows = 3, height = 'h-4' } = $props();
</script>

<div class="animate-pulse space-y-3 {className}">
	{#each Array(rows) as _, i}
		<div class="rounded bg-gray-200 {height} {i === rows - 1 ? 'w-3/4' : 'w-full'}"></div>
	{/each}
</div>
