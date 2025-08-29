<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let targetUrl = '';

	onMount(() => {
		// Get the target path from query parameter
		const targetPath = $page.url.searchParams.get('to');
		if (targetPath) {
			// Build the full URL
			targetUrl = `${$page.url.origin}${targetPath}`;

			// Try to open in external browser using various methods
			// Method 1: Using intent URL for Android
			if (/android/i.test(navigator.userAgent)) {
				const intentUrl = `intent:${targetUrl}#Intent;scheme=https;package=com.android.chrome;end`;
				window.location.href = intentUrl;
			}
			// Method 2: For iOS, try to use a different approach
			else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
				// This might open in Safari
				window.location.href = targetUrl.replace('https://', 'x-web-search://?');
				setTimeout(() => {
					window.location.href = targetUrl;
				}, 100);
			}
			// Method 3: Fallback - just redirect normally
			else {
				window.location.href = targetUrl;
			}
		}
	});
</script>

<div class="min-h-screen bg-white">
	<div class="relative mx-auto max-w-md">
		<div class="flex min-h-screen flex-col items-center justify-center px-4">
			<div class="text-center">
				<h1 class="mb-4 text-2xl font-bold text-gray-900">잠시만 기다려주세요</h1>
				<p class="mb-8 text-gray-600">외부 브라우저로 이동 중입니다...</p>

				{#if targetUrl}
					<div class="space-y-4">
						<p class="text-sm text-gray-500">자동으로 이동되지 않는다면 아래 버튼을 클릭해주세요</p>

						<a
							href={targetUrl}
							class="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
							target="_blank"
							rel="noopener noreferrer"
						>
							브라우저에서 열기
						</a>

						<div class="mt-4">
							<p class="text-xs text-gray-400">
								이동할 페이지: {targetUrl}
							</p>
						</div>
					</div>
				{:else}
					<p class="text-red-600">이동할 페이지를 찾을 수 없습니다.</p>
					<a href="/" class="mt-4 inline-block text-blue-600 underline"> 홈으로 이동 </a>
				{/if}
			</div>
		</div>
	</div>
</div>
