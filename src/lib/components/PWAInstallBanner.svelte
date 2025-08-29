<script lang="ts">
	import { pwaStore } from '$lib/stores/pwaStore';
	import { X, Download, Smartphone } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let showBanner = $state(false);
	let isIOS = $state(false);

	onMount(() => {
		// Check if iOS
		isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

		// Initialize PWA store
		pwaStore.init();

		// Subscribe to store changes
		const unsubscribe = pwaStore.subscribe((state) => {
			showBanner = state.showInstallPrompt && !state.isInstalled;
		});

		return unsubscribe;
	});

	async function handleInstall() {
		if (isIOS) {
			// Show iOS install instructions
			alert(
				'iOS에서 설치하려면:\n1. Safari 하단의 공유 버튼을 탭하세요\n2. "홈 화면에 추가"를 선택하세요'
			);
		} else {
			await pwaStore.install();
		}
	}

	function handleDismiss() {
		pwaStore.dismissPrompt();
		showBanner = false;
	}
</script>

{#if showBanner}
	<div class="animate-slide-up fixed right-0 bottom-20 left-0 z-50 p-4">
		<div class="mx-auto max-w-md">
			<div class="relative rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
				<!-- Close button -->
				<button
					onclick={handleDismiss}
					class="absolute top-2 right-2 rounded-full bg-white/20 p-1 text-white transition-colors hover:bg-white/30"
					aria-label="닫기"
				>
					<X size={20} />
				</button>

				<div class="flex items-start gap-4">
					<!-- Icon -->
					<div class="flex-shrink-0 rounded-full bg-white/20 p-3">
						<Smartphone size={24} class="text-white" />
					</div>

					<!-- Content -->
					<div class="flex-1">
						<h3 class="mb-1 text-base font-semibold text-white">매치트립 앱 설치</h3>
						<p class="mb-3 text-sm text-white/90">
							홈 화면에 추가하면 더 빠르고 편리하게 이용할 수 있어요
						</p>

						<!-- Features -->
						<div class="mb-3 flex flex-wrap gap-2 text-xs text-white/80">
							<span class="flex items-center gap-1"> ✓ 오프라인 지원 </span>
							<span class="flex items-center gap-1"> ✓ 빠른 실행 </span>
							<span class="flex items-center gap-1"> ✓ 푸시 알림 </span>
						</div>

						<!-- Buttons -->
						<div class="flex gap-2">
							<button
								onclick={handleInstall}
								class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-white/90"
							>
								<Download size={16} />
								{isIOS ? '설치 방법 보기' : '지금 설치'}
							</button>
							<button
								onclick={handleDismiss}
								class="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
							>
								나중에
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- iOS Install Instructions Modal -->
{#if isIOS && showBanner}
	<div class="fixed inset-0 z-[60] hidden" id="ios-instructions">
		<div
			class="fixed inset-0 bg-black/50"
			onclick={() => document.getElementById('ios-instructions')?.classList.add('hidden')}
		></div>
		<div class="fixed right-0 bottom-0 left-0 mx-auto max-w-md rounded-t-2xl bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold">iOS 설치 방법</h3>
			<ol class="space-y-3 text-sm">
				<li class="flex gap-3">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600"
						>1</span
					>
					<span>Safari 브라우저에서 이 페이지를 여세요</span>
				</li>
				<li class="flex gap-3">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600"
						>2</span
					>
					<span>하단의 공유 버튼 <span class="inline-block px-1">􀈂</span>을 탭하세요</span>
				</li>
				<li class="flex gap-3">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600"
						>3</span
					>
					<span>"홈 화면에 추가"를 선택하세요</span>
				</li>
				<li class="flex gap-3">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600"
						>4</span
					>
					<span>"추가"를 탭하세요</span>
				</li>
			</ol>
			<button
				onclick={() => document.getElementById('ios-instructions')?.classList.add('hidden')}
				class="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white"
			>
				확인
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
