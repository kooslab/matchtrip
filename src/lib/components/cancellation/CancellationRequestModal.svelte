<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, AlertCircle, Upload } from 'lucide-svelte';
	import {
		TRAVELER_CANCELLATION_REASONS,
		GUIDE_CANCELLATION_REASONS,
		EXCEPTION_REASONS
	} from '$lib/constants/cancellation';
	import { formatCurrency, isPastTrip } from '$lib/utils/refundCalculator';
	import RefundCalculator from './RefundCalculator.svelte';
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		userRole: 'traveler' | 'guide';
		paymentId: string;
		paymentAmount: number;
		tripStartDate?: Date;
		productDate?: Date;
	}

	let { isOpen, userRole, paymentId, paymentAmount, tripStartDate, productDate }: Props = $props();
	
	const dispatch = createEventDispatcher();
	
	let reasonType = $state('');
	let reasonDetail = $state('');
	let supportingDocuments = $state<string[]>([]);
	let agreeToTerms = $state(false);
	let isSubmitting = $state(false);
	let calculatedRefund = $state<any>(null);
	let showRefundCalculator = $state(false);
	
	const reasons = userRole === 'traveler' ? TRAVELER_CANCELLATION_REASONS : GUIDE_CANCELLATION_REASONS;
	const eventDate = tripStartDate || productDate;
	const isPast = eventDate ? isPastTrip(eventDate) : false;
	
	// Check if selected reason requires supporting documents
	$effect(() => {
		if (reasonType && EXCEPTION_REASONS.includes(reasonType as any)) {
			// Show document upload for exception cases
		}
	});
	
	// Calculate refund when reason changes
	$effect(async () => {
		if (reasonType && paymentId) {
			try {
				const response = await fetch('/api/cancellations/calculate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						paymentId,
						reasonType
					})
				});
				
				if (response.ok) {
					const data = await response.json();
					calculatedRefund = data.calculation;
					showRefundCalculator = true;
				}
			} catch (error) {
				console.error('Failed to calculate refund:', error);
			}
		}
	});
	
	async function handleSubmit() {
		if (!reasonType || !agreeToTerms) {
			alert('취소 사유를 선택하고 약관에 동의해주세요.');
			return;
		}
		
		if (EXCEPTION_REASONS.includes(reasonType as any) && supportingDocuments.length === 0) {
			alert('예외 상황의 경우 증빙 서류를 첨부해주세요.');
			return;
		}
		
		isSubmitting = true;
		
		try {
			const response = await fetch('/api/cancellations/request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentId,
					reasonType,
					reasonDetail,
					supportingDocuments
				})
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || '취소 요청 실패');
			}
			
			const result = await response.json();
			dispatch('success', result);
			handleClose();
		} catch (error) {
			console.error('Cancellation request failed:', error);
			alert(error instanceof Error ? error.message : '취소 요청 중 오류가 발생했습니다.');
		} finally {
			isSubmitting = false;
		}
	}
	
	function handleClose() {
		if (!isSubmitting) {
			dispatch('close');
			// Reset form
			reasonType = '';
			reasonDetail = '';
			supportingDocuments = [];
			agreeToTerms = false;
			calculatedRefund = null;
			showRefundCalculator = false;
		}
	}
	
	function handleFileUpload(event: Event) {
		// TODO: Implement file upload to S3 and add URL to supportingDocuments
		const input = event.target as HTMLInputElement;
		if (input.files) {
			// Upload files and get URLs
			console.log('Files to upload:', input.files);
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Backdrop -->
			<div 
				class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onclick={handleClose}
			></div>
			
			<!-- Modal -->
			<div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
				<!-- Header -->
				<div class="flex items-center justify-between border-b p-4">
					<h3 class="text-lg font-semibold">취소 요청</h3>
					<button
						type="button"
						onclick={handleClose}
						class="rounded-lg p-1 hover:bg-gray-100"
						disabled={isSubmitting}
					>
						<X class="h-5 w-5" />
					</button>
				</div>
				
				<!-- Body -->
				<div class="p-4 space-y-4">
					{#if isPast}
						<div class="rounded-lg bg-orange-50 border border-orange-200 p-3">
							<div class="flex items-start gap-2">
								<AlertTriangle class="h-5 w-5 text-orange-600 mt-0.5" />
								<div class="text-sm text-orange-800">
									<p class="font-semibold">여행 종료 후 취소 요청</p>
									<p class="mt-1">여행이 이미 종료된 건은 관리자 검토 후 환불이 결정됩니다.</p>
									<p class="mt-1">취소 사유와 증빙 서류를 상세히 작성해주세요.</p>
								</div>
							</div>
						</div>
					{:else if userRole === 'guide'}
						<div class="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
							<div class="flex items-start gap-2">
								<AlertCircle class="h-5 w-5 text-yellow-600 mt-0.5" />
								<div class="text-sm text-yellow-800">
									<p class="font-semibold">가이드 취소 안내</p>
									<p class="mt-1">가이드가 취소하는 경우 여행자에게 전액 환불됩니다.</p>
									<p class="mt-1">무단 취소 시 제재가 있을 수 있습니다.</p>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Cancellation Reason -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							취소 사유 <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={reasonType}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
							disabled={isSubmitting}
						>
							<option value="">선택해주세요</option>
							{#each Object.entries(reasons) as [value, label]}
								<option value={value}>{label}</option>
							{/each}
						</select>
					</div>
					
					<!-- Exception Case Notice -->
					{#if reasonType && EXCEPTION_REASONS.includes(reasonType as any)}
						<div class="rounded-lg bg-blue-50 border border-blue-200 p-3">
							<p class="text-sm text-blue-800">
								예외 상황으로 인한 취소는 증빙 서류 제출 후 관리자 승인이 필요합니다.
								승인 시 전액 환불됩니다.
							</p>
						</div>
						
						<!-- File Upload -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								증빙 서류 <span class="text-red-500">*</span>
							</label>
							<div class="flex items-center justify-center w-full">
								<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
									<div class="flex flex-col items-center justify-center pt-5 pb-6">
										<Upload class="w-8 h-8 mb-2 text-gray-400" />
										<p class="text-sm text-gray-500">클릭하여 파일 업로드</p>
										<p class="text-xs text-gray-400 mt-1">PDF, JPG, PNG (최대 10MB)</p>
									</div>
									<input
										type="file"
										class="hidden"
										accept=".pdf,.jpg,.jpeg,.png"
										multiple
										onchange={handleFileUpload}
										disabled={isSubmitting}
									/>
								</label>
							</div>
							{#if supportingDocuments.length > 0}
								<div class="mt-2 text-sm text-gray-600">
									{supportingDocuments.length}개 파일 선택됨
								</div>
							{/if}
						</div>
					{/if}
					
					<!-- Reason Detail -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							상세 사유 (선택)
						</label>
						<textarea
							bind:value={reasonDetail}
							rows="3"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
							placeholder="추가로 전달하실 내용이 있다면 입력해주세요."
							disabled={isSubmitting}
						></textarea>
					</div>
					
					<!-- Refund Calculator -->
					{#if showRefundCalculator && calculatedRefund}
						<RefundCalculator
							originalAmount={paymentAmount}
							refundAmount={calculatedRefund.refundAmount}
							refundPercentage={calculatedRefund.refundPercentage}
							deductionAmount={calculatedRefund.deductionAmount}
							policyApplied={calculatedRefund.policyApplied}
							daysBeforeTrip={calculatedRefund.daysBeforeTrip}
							requiresAdminApproval={calculatedRefund.requiresAdminApproval}
						/>
					{/if}
					
					<!-- Terms Agreement -->
					<div class="border-t pt-4">
						<label class="flex items-start gap-2">
							<input
								type="checkbox"
								bind:checked={agreeToTerms}
								class="mt-1"
								disabled={isSubmitting}
							/>
							<span class="text-sm text-gray-600">
								취소 및 환불 규정을 확인하였으며, 이에 동의합니다.
								{#if userRole === 'traveler' && !calculatedRefund?.requiresAdminApproval}
									환불 금액은 약관에 따라 자동 계산됩니다.
								{/if}
							</span>
						</label>
					</div>
				</div>
				
				<!-- Footer -->
				<div class="border-t p-4 flex gap-2">
					<button
						type="button"
						onclick={handleClose}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
						disabled={isSubmitting}
					>
						취소
					</button>
					<button
						type="button"
						onclick={handleSubmit}
						class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
						disabled={!reasonType || !agreeToTerms || isSubmitting}
					>
						{isSubmitting ? '처리중...' : '취소 요청'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}