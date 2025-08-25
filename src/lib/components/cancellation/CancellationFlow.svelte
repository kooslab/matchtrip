<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ChevronLeft } from 'lucide-svelte';
	import {
		TRAVELER_CANCELLATION_REASONS,
		GUIDE_CANCELLATION_REASONS,
		EXCEPTION_REASONS
	} from '$lib/constants/cancellation';
	import { formatCurrency } from '$lib/utils/refundCalculator';
	import ArrowBackIcon from '$lib/icons/icon-arrow-back-android-mono.svg';
	import CheckCircleIcon from '$lib/icons/icon-check-circle-mono.svg';

	interface Props {
		isOpen: boolean;
		userRole: 'traveler' | 'guide';
		paymentId: string;
		paymentAmount: number;
		tripStartDate?: Date | null;
		productDate?: Date | null;
	}

	let { isOpen, userRole, paymentId, paymentAmount, tripStartDate, productDate }: Props = $props();

	const dispatch = createEventDispatcher();

	// Step management
	let currentStep = $state<'reason' | 'preview' | 'confirm'>('reason');
	
	// Form data
	let selectedReason = $state('');
	let reasonDetail = $state('');
	let calculatedRefund = $state<any>(null);
	let isSubmitting = $state(false);
	let isCalculating = $state(false);
	let showRefundPolicy = $state(false);

	const reasons = userRole === 'traveler' ? TRAVELER_CANCELLATION_REASONS : GUIDE_CANCELLATION_REASONS;
	const eventDate = tripStartDate || productDate;

	// Reset when modal opens/closes
	$effect(() => {
		if (!isOpen) {
			currentStep = 'reason';
			selectedReason = '';
			reasonDetail = '';
			calculatedRefund = null;
		}
	});

	async function handleReasonNext() {
		if (!selectedReason) {
			alert('취소 사유를 선택해주세요.');
			return;
		}

		// Calculate refund amount
		isCalculating = true;
		try {
			const response = await fetch('/api/cancellations/calculate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentId,
					reasonType: selectedReason
				})
			});

			if (response.ok) {
				const data = await response.json();
				calculatedRefund = data.calculation;
				currentStep = 'preview';
			} else {
				throw new Error('Failed to calculate refund');
			}
		} catch (error) {
			console.error('Failed to calculate refund:', error);
			alert('환불 금액 계산에 실패했습니다.');
		} finally {
			isCalculating = false;
		}
	}

	async function handleConfirmCancellation() {
		if (!selectedReason || !calculatedRefund) return;

		isSubmitting = true;

		try {
			const response = await fetch('/api/cancellations/request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentId,
					reasonType: selectedReason,
					reasonDetail,
					supportingDocuments: []
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || '취소 요청 실패');
			}

			const result = await response.json();
			currentStep = 'confirm';
			
			// Dispatch success after showing confirmation
			setTimeout(() => {
				dispatch('success', result);
				handleClose();
			}, 2000);
		} catch (error) {
			console.error('Cancellation request failed:', error);
			alert(error instanceof Error ? error.message : '취소 요청 중 오류가 발생했습니다.');
			isSubmitting = false;
		}
	}

	function handleBack() {
		if (currentStep === 'preview') {
			currentStep = 'reason';
		} else if (currentStep === 'confirm') {
			// Can't go back from confirmation
		}
	}

	function handleClose() {
		if (!isSubmitting) {
			dispatch('close');
		}
	}

	function formatDate(date: Date | string | null) {
		if (!date) return '날짜 정보 없음';
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');
		return `${year}.${month}.${day}`;
	}
</script>

{#if isOpen}
	<!-- Step 1: Cancellation Reason Selection -->
	{#if currentStep === 'reason'}
		<!-- Bottom Sheet Modal Style -->
		<div class="fixed inset-0 bg-black/10 z-40" onclick={handleClose}></div>
		<div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-md mx-auto animate-slide-up z-50">
					<!-- Modal Handle -->
					<div class="flex justify-center pt-2 pb-4">
						<div class="w-12 h-1 bg-gray-300 rounded-full"></div>
					</div>
					
					<!-- Header -->
					<div class="px-6 pb-4">
						<h2 class="text-lg font-semibold">취소 사유</h2>
					</div>

					<!-- Reason List -->
					<div class="px-6 pb-6 max-h-[60vh] overflow-y-auto">
						<div class="space-y-1">
							{#each Object.entries(reasons) as [value, label]}
								<button
									onclick={() => selectedReason = value}
									class="w-full flex items-center justify-between py-2 text-left"
								>
									<span class="text-base text-gray-700">{label}</span>
									<div class="relative w-6 h-6">
										<img 
											src={CheckCircleIcon} 
											alt=""
											class="w-6 h-6 {selectedReason === value ? '[&_path]:fill-[#1095f4]' : '[&_path]:fill-[#8B95A1]'}"
											style={selectedReason === value ? 'filter: brightness(0) saturate(100%) invert(43%) sepia(96%) saturate(1237%) hue-rotate(184deg) brightness(101%) contrast(95%)' : ''}
										/>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Bottom Button -->
					<div class="px-6 pb-8 pt-4 border-t">
						<button
							onclick={handleReasonNext}
							disabled={!selectedReason || isCalculating}
							class="w-full py-4 bg-blue-500 text-white rounded-xl font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isCalculating ? '계산 중...' : '선택하기'}
						</button>
					</div>
		</div>
	{/if}

	<!-- Step 2: Refund Amount Preview -->
	{#if currentStep === 'preview'}
		<!-- Bottom Sheet Modal Style -->
		<div class="fixed inset-0 bg-black/10 z-40" onclick={handleClose}></div>
		<div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-md mx-auto animate-slide-up z-50">
					<!-- Modal Handle -->
					<div class="flex justify-center pt-2 pb-4">
						<div class="w-12 h-1 bg-gray-300 rounded-full"></div>
					</div>
					
					<!-- Header -->
					<div class="px-6 pb-4">
						<h2 class="text-lg font-semibold">취소 요청</h2>
					</div>

					<!-- Content -->
					<div class="px-6 pb-6">
						{#if calculatedRefund}
							<!-- Refund Amount Section -->
							<div class="space-y-4">
								{#if calculatedRefund.refundAmount > 0}
									<div>
										<div class="text-sm text-gray-600 mb-2">예상 환불 금액</div>
										<div class="flex items-center gap-2">
											<div class="text-2xl font-bold">{calculatedRefund.refundAmount.toLocaleString()}</div>
											<div class="text-sm text-blue-500">원</div>
										</div>
									</div>

									<!-- Refund Calculation Details -->
									<div class="p-3 bg-gray-50 rounded-lg">
										<div class="text-sm text-gray-600">
											총 금액 {paymentAmount.toLocaleString()}원 중 {100 - calculatedRefund.refundPercentage}% 공제 후 {calculatedRefund.refundAmount.toLocaleString()}원 환불 예정
										</div>
									</div>
								{:else}
									<!-- When refund amount is 0 -->
									<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div class="text-sm text-gray-700 mb-2">
											<strong>환불 금액 검토 필요</strong>
										</div>
										<div class="text-sm text-gray-600">
											환불 여부 혹은 환불 가능 금액은 관리자 검토 이후에 결정됩니다.
										</div>
										<div class="text-xs text-gray-500 mt-2">
											영업일 기준 1-2일 내에 결과를 안내드리겠습니다.
										</div>
									</div>
								{/if}

								<!-- Terms Agreement -->
								<button
									onclick={() => showRefundPolicy = true}
									class="flex items-start gap-3 p-4 bg-blue-50 rounded-lg w-full text-left"
								>
									<div class="mt-0.5">
										<div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
											<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
											</svg>
										</div>
									</div>
									<div class="flex-1">
										<div class="text-sm text-blue-700">
											<span class="font-medium">취소 환불 규정</span>을 모두 확인했습니다.
										</div>
									</div>
									<ChevronLeft class="h-5 w-5 text-gray-400 rotate-180" />
								</button>
							</div>
						{/if}
					</div>

					<!-- Bottom Button -->
					<div class="px-6 pb-8 pt-4 border-t">
						<button
							onclick={handleConfirmCancellation}
							disabled={isSubmitting}
							class="w-full py-4 bg-blue-500 text-white rounded-xl font-medium text-base disabled:opacity-50"
						>
							{isSubmitting ? '처리 중...' : '요청하기'}
						</button>
				</div>
		</div>
	{/if}

	<!-- Step 3: Confirmation -->
	{#if currentStep === 'confirm'}
		<!-- Bottom Sheet Modal Style -->
		<div class="fixed inset-0 bg-black/10 z-40" onclick={handleClose}></div>
		<div class="fixed bottom-4 left-4 right-4 bg-white rounded-2xl max-w-md mx-auto animate-slide-up z-50">
			<!-- Modal Handle -->
			<div class="flex justify-center pt-2 pb-2">
				<div class="w-12 h-1 bg-gray-300 rounded-full"></div>
			</div>
			
			<!-- Content -->
			<div class="px-6 pb-6">
				<div class="text-center py-4">
					<div class="mb-4">
						<div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
							<svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
						</div>
					</div>
					
					<h2 class="text-lg font-semibold mb-2">취소 요청이 완료되었습니다</h2>
					
					{#if calculatedRefund && calculatedRefund.refundAmount > 0}
						<p class="text-sm text-gray-600 mb-2">
							예상 환불 금액
						</p>
						<p class="text-2xl font-bold mb-1">
							{formatCurrency(calculatedRefund.refundAmount)}
						</p>
						<p class="text-xs text-gray-500">
							환불은 영업일 기준 3-5일 내에 처리됩니다.
						</p>
					{:else}
						<p class="text-sm text-gray-600 mb-2">
							환불 여부 혹은 환불 가능 금액은 관리자 검토 이후에 결정됩니다.
						</p>
						<p class="text-xs text-gray-500">
							영업일 기준 1-2일 내에 결과를 안내드리겠습니다.
						</p>
					{/if}
				</div>
			</div>
			
			<!-- Bottom Button -->
			<div class="px-6 pb-6">
				<button
					onclick={handleClose}
					class="w-full py-4 bg-blue-500 text-white rounded-xl font-medium text-base"
				>
					확인
				</button>
			</div>
		</div>
	{/if}

	<!-- Refund Policy Modal -->
	{#if showRefundPolicy}
		<div class="fixed inset-0 bg-black/50 z-[60]" onclick={() => showRefundPolicy = false}>
			<div class="fixed inset-0 flex items-end justify-center">
				<div 
					class="w-full max-w-md bg-white rounded-t-2xl animate-slide-up"
					onclick={(e) => e.stopPropagation()}
				>
					<!-- Modal Handle -->
					<div class="flex justify-center pt-2 pb-4">
						<div class="w-12 h-1 bg-gray-300 rounded-full"></div>
					</div>

					<!-- Header -->
					<div class="px-6 pb-4 border-b">
						<h2 class="text-lg font-semibold">취소 환불 규정</h2>
					</div>

					<!-- Content -->
					<div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
						<div class="space-y-6">
							<!-- Traveler Cancellation Policy -->
							<div>
								<h3 class="font-semibold text-sm mb-3">여행자 취소 시</h3>
								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 30일 전</span>
										<span class="font-medium">100% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 14일 전</span>
										<span class="font-medium">70% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 7일 전</span>
										<span class="font-medium">50% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 3일 전</span>
										<span class="font-medium">30% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 1일 전 ~ 당일</span>
										<span class="font-medium text-red-500">환불 불가</span>
									</div>
								</div>
							</div>

							<!-- Guide Cancellation Policy -->
							<div>
								<h3 class="font-semibold text-sm mb-3">가이드 취소 시</h3>
								<div class="space-y-2">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 30일 전</span>
										<span class="font-medium">100% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 14일 전</span>
										<span class="font-medium">100% 환불</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">여행 시작 7일 전 ~ 당일</span>
										<span class="font-medium">100% 환불 + 위약금</span>
									</div>
								</div>
							</div>

							<!-- Exception Cases -->
							<div>
								<h3 class="font-semibold text-sm mb-3">예외 사항</h3>
								<div class="space-y-2 text-sm text-gray-600">
									<p>• 천재지변, 전쟁, 정부 규제 등 불가항력: 100% 환불</p>
									<p>• 질병/사고 (의료 증빙 필요): 100% 환불</p>
									<p>• 직계가족 사망 (증빙 필요): 100% 환불</p>
									<p>• 여행지 안전 문제 발생: 100% 환불</p>
								</div>
							</div>

							<!-- Notice -->
							<div class="p-3 bg-gray-50 rounded-lg">
								<p class="text-xs text-gray-600">
									※ 환불 금액은 결제 수단으로 영업일 기준 3-5일 내 환불됩니다.
								</p>
								<p class="text-xs text-gray-600 mt-1">
									※ 예외 사항의 경우 관련 증빙 서류 제출이 필요합니다.
								</p>
							</div>
						</div>
					</div>

					<!-- Bottom Button -->
					<div class="px-6 pb-8 pt-4 border-t">
						<button
							onclick={() => showRefundPolicy = false}
							class="w-full py-4 bg-blue-500 text-white rounded-xl font-medium text-base"
						>
							확인
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	:global(.animate-slide-up) {
		animation: slide-up 0.3s ease-out;
	}
</style>