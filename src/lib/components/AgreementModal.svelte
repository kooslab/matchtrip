<script lang="ts">
	import { X, Check } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto, invalidateAll } from '$app/navigation';

	interface Props {
		isOpen: boolean;
		onClose?: () => void;
		user?: any;
	}

	let { isOpen, onClose, user }: Props = $props();

	let termsAgreed = $state(false);
	let privacyAgreed = $state(false);
	let marketingAgreed = $state(false);
	let isSubmitting = $state(false);
	let allChecked = $state(false);

	// Computed property for all required agreements
	const allRequiredAgreed = $derived(termsAgreed && privacyAgreed);

	// Watch for all checkbox state
	$effect(() => {
		allChecked = termsAgreed && privacyAgreed && marketingAgreed;
	});

	// Toggle all agreements
	function toggleAllAgreements() {
		if (allChecked) {
			// If all are checked, uncheck all
			termsAgreed = false;
			privacyAgreed = false;
			marketingAgreed = false;
		} else {
			// Otherwise, check all
			termsAgreed = true;
			privacyAgreed = true;
			marketingAgreed = true;
		}
	}

	async function handleSubmit() {
		if (!allRequiredAgreed || isSubmitting) return;

		isSubmitting = true;

		try {
			const response = await fetch('/api/user/agreements', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					termsAgreed,
					privacyAgreed,
					marketingAgreed
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save agreements');
			}

			await response.json();
			
			// Invalidate all data to refresh the user session
			await invalidateAll();
			
			// Close modal and redirect to role selection
			if (onClose) onClose();
			
			// Redirect to role selection page
			await goto('/select-role', { replaceState: true });
		} catch (error) {
			console.error('Error saving agreements:', error);
			alert('약관 동의 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
			isSubmitting = false;
		}
	}

	// Prevent modal from closing when clicking inside
	function handleModalClick(e: MouseEvent) {
		e.stopPropagation();
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 z-50 bg-black/50"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
	>
		<!-- Modal Container -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Modal Content -->
			<div 
				class="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
				transition:fly={{ y: 50, duration: 300 }}
				onclick={handleModalClick}
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-gray-100 p-6">
					<h2 class="text-xl font-bold text-gray-900">서비스 이용약관</h2>
					{#if onClose}
						<button 
							onclick={onClose}
							class="rounded-full p-1.5 transition-colors hover:bg-gray-100"
							aria-label="닫기"
						>
							<X class="h-5 w-5 text-gray-500" />
						</button>
					{/if}
				</div>

				<!-- Content -->
				<div class="p-6">
					<p class="mb-6 text-sm text-gray-600">
						매치트립 서비스 이용을 위해 아래 약관에 동의해주세요.
					</p>

					<!-- All agreements checkbox -->
					<label class="mb-4 flex cursor-pointer items-start rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
						<input
							type="checkbox"
							checked={allChecked}
							onchange={toggleAllAgreements}
							class="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div class="ml-3">
							<span class="font-medium text-gray-900">전체 동의</span>
							<p class="mt-1 text-sm text-gray-500">
								서비스 이용을 위한 필수 및 선택 약관에 모두 동의합니다
							</p>
						</div>
					</label>

					<div class="mb-6 space-y-3 border-t border-gray-100 pt-4">
						<!-- Terms agreement -->
						<label class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50">
							<input
								type="checkbox"
								bind:checked={termsAgreed}
								class="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<div class="ml-3 flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">이용약관 동의</span>
									<span class="text-xs font-medium text-red-500">(필수)</span>
								</div>
								<a
									href="/terms"
									target="_blank"
									class="mt-1 inline-block text-xs text-blue-600 hover:underline"
									onclick={(e) => e.stopPropagation()}
								>
									약관 보기
								</a>
							</div>
						</label>

						<!-- Privacy agreement -->
						<label class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50">
							<input
								type="checkbox"
								bind:checked={privacyAgreed}
								class="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<div class="ml-3 flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">개인정보 처리방침 동의</span>
									<span class="text-xs font-medium text-red-500">(필수)</span>
								</div>
								<a
									href="/terms/privacy"
									target="_blank"
									class="mt-1 inline-block text-xs text-blue-600 hover:underline"
									onclick={(e) => e.stopPropagation()}
								>
									개인정보 처리방침 보기
								</a>
							</div>
						</label>

						<!-- Marketing agreement -->
						<label class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50">
							<input
								type="checkbox"
								bind:checked={marketingAgreed}
								class="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<div class="ml-3 flex-1">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">마케팅 정보 수신 동의</span>
									<span class="text-xs font-medium text-gray-500">(선택)</span>
								</div>
								<p class="mt-1 text-xs text-gray-500">
									이벤트, 할인 및 유용한 정보를 받아보실 수 있습니다
								</p>
							</div>
						</label>
					</div>

					<!-- Submit Button -->
					<button
						onclick={handleSubmit}
						disabled={!allRequiredAgreed || isSubmitting}
						class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						{#if isSubmitting}
							<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							<span>처리 중...</span>
						{:else}
							<Check class="h-5 w-5" />
							<span>동의하고 시작하기</span>
						{/if}
					</button>

					<!-- Info text -->
					<p class="mt-4 text-center text-xs text-gray-500">
						필수 항목에 동의하지 않으면 서비스를 이용할 수 없습니다.
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Spinner animation */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>