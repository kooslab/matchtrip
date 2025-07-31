<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { goto, invalidateAll } from '$app/navigation';
	import IconCheckCircle from '$lib/icons/icon-check-circle-mono.svg?raw';
	import IconArrowRight from '$lib/icons/icon-arrow-right-small-mono.svg?raw';
	import TermsModal from './TermsModal.svelte';

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

	// Terms modal state
	let showTermsModal = $state(false);
	let termsModalType: 'terms' | 'privacy' | 'marketing' = $state('terms');
	let termsModalTitle = $state('');

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

	// Open terms modal
	function openTermsModal(type: 'terms' | 'privacy' | 'marketing', title: string) {
		termsModalType = type;
		termsModalTitle = title;
		showTermsModal = true;
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/50" transition:fade={{ duration: 200 }}>
		<!-- Modal Container -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Modal Content -->
			<div
				class="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
				transition:fly={{ y: 50, duration: 300 }}
				onclick={handleModalClick}
			>
				<!-- Header -->
				<div class="px-6 pt-8 pb-4">
					<h2 class="text-2xl font-bold text-gray-900">약관 동의</h2>
					<p class="mt-2 text-base text-gray-500">서비스 이용을 위해 약관에 동의해 주세요</p>
				</div>

				<!-- Content -->
				<div class="px-6 pb-6">
					<!-- All agreements checkbox -->
					<button
						onclick={toggleAllAgreements}
						class="mb-6 flex w-full cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
					>
						<div class="h-6 w-6" class:checked={allChecked}>
							{@html IconCheckCircle}
						</div>
						<span class="text-base font-medium text-gray-900">모든 약관에 동의합니다.</span>
					</button>

					<div class="mb-8 space-y-0">
						<!-- Terms agreement -->
						<div class="flex w-full items-center gap-3 py-4">
							<button
								onclick={() => (termsAgreed = !termsAgreed)}
								class="h-6 w-6"
								class:checked={termsAgreed}
							>
								{@html IconCheckCircle}
							</button>
							<div class="flex flex-1 items-center justify-between">
								<button
									onclick={() => (termsAgreed = !termsAgreed)}
									class="flex items-center gap-1 text-left"
								>
									<span class="text-base text-gray-900">이용약관 동의</span>
									<span class="text-sm text-blue-500">(필수)</span>
								</button>
								<button
									onclick={() => openTermsModal('terms', '이용약관')}
									class="h-6 w-6 text-gray-400 hover:text-gray-600"
								>
									{@html IconArrowRight}
								</button>
							</div>
						</div>

						<!-- Privacy agreement -->
						<div class="flex w-full items-center gap-3 py-4">
							<button
								onclick={() => (privacyAgreed = !privacyAgreed)}
								class="h-6 w-6"
								class:checked={privacyAgreed}
							>
								{@html IconCheckCircle}
							</button>
							<div class="flex flex-1 items-center justify-between">
								<button
									onclick={() => (privacyAgreed = !privacyAgreed)}
									class="flex items-center gap-1 text-left"
								>
									<span class="text-base text-gray-900">개인정보처리방침 동의</span>
									<span class="text-sm text-blue-500">(필수)</span>
								</button>
								<button
									onclick={() => openTermsModal('privacy', '개인정보처리방침')}
									class="h-6 w-6 text-gray-400 hover:text-gray-600"
								>
									{@html IconArrowRight}
								</button>
							</div>
						</div>

						<!-- Marketing agreement -->
						<div class="flex w-full items-center gap-3 py-4">
							<button
								onclick={() => (marketingAgreed = !marketingAgreed)}
								class="h-6 w-6"
								class:checked={marketingAgreed}
							>
								{@html IconCheckCircle}
							</button>
							<div class="flex flex-1 items-center justify-between">
								<button
									onclick={() => (marketingAgreed = !marketingAgreed)}
									class="text-left text-base text-gray-900"
								>
									마케팅 및 광고 활용 동의
								</button>
								<button
									onclick={() => openTermsModal('marketing', '마케팅 정보 수신 동의')}
									class="h-6 w-6 text-gray-400 hover:text-gray-600"
								>
									{@html IconArrowRight}
								</button>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-3">
						<button
							disabled
							class="flex-1 cursor-not-allowed rounded-xl bg-gray-100 py-4 text-base font-medium text-gray-400"
						>
							취소
						</button>
						<button
							onclick={handleSubmit}
							disabled={!allRequiredAgreed || isSubmitting}
							class="flex-1 rounded-xl bg-blue-500 py-4 text-base font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
						>
							{#if isSubmitting}
								처리 중...
							{:else}
								동의하기
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Terms Modal -->
<TermsModal
	isOpen={showTermsModal}
	onClose={() => (showTermsModal = false)}
	title={termsModalTitle}
	type={termsModalType}
/>

<style>
	/* Checkbox styling */
	.checked :global(svg path) {
		fill: #3b82f6;
	}

	/* Ensure icons maintain their aspect ratio */
	:global(.h-6.w-6 svg) {
		width: 100%;
		height: 100%;
	}
</style>
