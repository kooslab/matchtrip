<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	
	const { data } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 bg-white border-b">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/profile/guide')} class="p-1">
					<ArrowLeft class="h-6 w-6" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">여행 상품 만들기</h1>
				<div class="w-8"></div>
			</div>
		</header>
		
		<!-- Main Content -->
		<main class="p-4">
			<div class="flex items-center justify-center h-[60vh]">
				<p class="text-lg text-gray-600">여행 상품 만들기</p>
			</div>
		</main>
	</div>
</div>