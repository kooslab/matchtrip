<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Client-side fallback redirect in case server-side redirect fails
	onMount(() => {
		goto('/order-history', { replaceState: true });
	});
</script>

<div class="min-h-screen bg-white">
	<div class="relative mx-auto max-w-md">
		<div class="flex min-h-screen items-center justify-center px-4">
			<div class="text-center">
				<p class="text-gray-600">주문 내역으로 이동 중...</p>
			</div>
		</div>
	</div>
</div>
