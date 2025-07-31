<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to /terms/service
	onMount(() => {
		goto('/terms/service', { replaceState: true });
	});
</script>

<div class="mx-auto max-w-3xl px-4 py-12">
	<!-- Loading state while redirecting -->
	<div class="flex items-center justify-center">
		<div class="text-gray-500">리다이렉트 중...</div>
	</div>
</div>