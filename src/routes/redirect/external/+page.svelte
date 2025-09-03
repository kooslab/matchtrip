<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let targetUrl = '';
	let redirectAttempted = false;

	onMount(() => {
		// Get the target path from query parameter
		const targetPath = $page.url.searchParams.get('to');
		if (targetPath) {
			// Build the full URL
			targetUrl = `${$page.url.origin}${targetPath}`;
			
			// Check if we're in Kakao in-app browser
			const userAgent = navigator.userAgent;
			const isKakaoInApp = userAgent.includes('KAKAOTALK');
			const isAndroid = /android/i.test(userAgent);
			const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
			
			console.log('User Agent:', userAgent);
			console.log('Is Kakao:', isKakaoInApp);
			console.log('Target URL:', targetUrl);

			redirectAttempted = true;

			// Method 1: Kakao-specific redirect
			if (isKakaoInApp) {
				// Use Kakao's official method to open external browser
				const kakaoScheme = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
				console.log('Attempting Kakao scheme:', kakaoScheme);
				
				// Try the Kakao scheme first
				window.location.href = kakaoScheme;
				
				// Fallback after a short delay
				setTimeout(() => {
					// Try alternative methods for Kakao
					if (isIOS) {
						// For iOS Kakao, try using a different approach
						window.location.href = `googlechrome://${targetUrl.replace(/^https?:\/\//, '')}`;
						setTimeout(() => {
							window.location.href = targetUrl;
						}, 500);
					} else if (isAndroid) {
						// For Android Kakao, try intent URL
						const intentUrl = `intent:${targetUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
						window.location.href = intentUrl;
						setTimeout(() => {
							window.location.href = targetUrl;
						}, 500);
					} else {
						// Final fallback
						window.location.href = targetUrl;
					}
				}, 1000);
			}
			// Method 2: Regular Android browser
			else if (isAndroid && !isKakaoInApp) {
				const intentUrl = `intent:${targetUrl}#Intent;scheme=https;package=com.android.chrome;end`;
				window.location.href = intentUrl;
				// Fallback for Android
				setTimeout(() => {
					window.location.href = targetUrl;
				}, 500);
			}
			// Method 3: Regular iOS browser
			else if (isIOS && !isKakaoInApp) {
				// Try to open in Safari
				window.location.href = targetUrl;
			}
			// Method 4: Desktop or other browsers
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

						<!-- Primary button for manual redirect -->
						<button
							onclick={() => {
								// Try Kakao scheme first if in Kakao
								if (navigator.userAgent.includes('KAKAOTALK')) {
									window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
									// Fallback after delay
									setTimeout(() => {
										window.open(targetUrl, '_blank');
									}, 500);
								} else {
									window.open(targetUrl, '_blank');
								}
							}}
							class="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
						>
							외부 브라우저에서 열기
						</button>

						<!-- Secondary link option -->
						<div>
							<a
								href={targetUrl}
								class="text-sm text-blue-600 underline"
							>
								일반 링크로 이동
							</a>
						</div>

						<!-- Copy URL option for manual handling -->
						<div class="mt-4 rounded-lg bg-gray-50 p-3">
							<p class="mb-2 text-xs text-gray-600">URL을 복사해서 브라우저에 붙여넣기:</p>
							<div class="flex items-center gap-2">
								<input
									type="text"
									value={targetUrl}
									readonly
									class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
								/>
								<button
									onclick={() => {
										navigator.clipboard.writeText(targetUrl);
										alert('URL이 복사되었습니다');
									}}
									class="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"
								>
									복사
								</button>
							</div>
						</div>

						<div class="mt-4">
							<p class="text-xs text-gray-400">
								{#if redirectAttempted}
									리다이렉트 시도됨
								{/if}
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
