<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { colors } from '$lib/constants/colors';
	import iconCheck from '$lib/icons/icon-check-circle-mono.svg';

	onMount(() => {
		// Redirect to my-trips after 2 seconds
		setTimeout(() => {
			// Use window.location for a hard refresh to ensure session is updated
			window.location.href = '/my-trips';
		}, 2000);
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-white px-4">
	<div class="text-center">
		<div class="mb-6 flex justify-center">
			<img 
				src={iconCheck} 
				alt="완료" 
				class="h-20 w-20"
				style="filter: invert(59%) sepia(97%) saturate(1564%) hue-rotate(121deg) brightness(95%) contrast(94%);"
			/>
		</div>
		<h1 class="mb-2 text-2xl font-bold text-primary">프로필 등록 완료!</h1>
		<p class="mb-8 text-secondary">이제 매치트립을 시작할 수 있습니다</p>
		<div class="text-sm text-secondary">잠시 후 내 여행 페이지로 이동합니다...</div>
	</div>
</div>