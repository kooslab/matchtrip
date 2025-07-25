<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { colors } from '$lib/constants/colors';
	import iconCheck from '$lib/icons/icon-check-circle-mono.svg';

	onMount(() => {
		// Redirect to pending approval page after 1 second
		setTimeout(() => {
			// Use window.location for a hard refresh to ensure session is updated
			window.location.href = '/guide/pending-approval';
		}, 1000);
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
		<h1 class="text-primary mb-2 text-2xl font-bold">가이드 프로필 등록 완료!</h1>
		<p class="text-secondary mb-8">관리자 승인 후 가이드 활동을 시작할 수 있습니다</p>
		<div class="text-secondary text-sm">잠시 후 페이지로 이동합니다...</div>
	</div>
</div>
