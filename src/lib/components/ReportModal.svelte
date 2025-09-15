<script lang="ts">
	import type { ReportType } from '$lib/server/db/schema';

	interface Props {
		show: boolean;
		onClose: () => void;
		onSubmit: (reportType: ReportType) => Promise<void>;
	}

	let { show = $bindable(), onClose, onSubmit }: Props = $props();

	let selectedReason = $state<ReportType | null>(null);
	let submitting = $state(false);

	const reportReasons: { value: ReportType; label: string }[] = [
		{ value: 'scam', label: '사기인 것 같아요' },
		{ value: 'inappropriate_ads', label: '부적절한 광고가 있어요' },
		{ value: 'fraud', label: '직거래를 강요해요' },
		{ value: 'harassment', label: '욕설이나 비속어를 사용해요' },
		{ value: 'contact_info_leak', label: '연락이 되지 않아요' }
	];

	function handleReasonSelect(reason: ReportType) {
		selectedReason = reason;
	}

	async function handleSubmit() {
		if (!selectedReason || submitting) return;

		submitting = true;
		try {
			await onSubmit(selectedReason);
			show = false;
			selectedReason = null;
		} catch (error) {
			console.error('Failed to submit report:', error);
			alert('신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		if (!submitting) {
			show = false;
			selectedReason = null;
			onClose();
		}
	}
</script>

{#if show}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={handleClose}></div>

	<!-- Modal Content - Bottom Sheet on Mobile -->
	<div class="fixed bottom-0 left-0 right-0 z-50">
		<div class="mx-auto max-w-md bg-white rounded-t-2xl">
			<!-- Header -->
			<div class="relative border-b border-gray-100 px-6 py-4">
				<h2 class="text-center text-lg font-semibold text-gray-900">신고하기</h2>
				<button
					onclick={handleClose}
					disabled={submitting}
					class="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
					aria-label="닫기"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Report Reasons -->
			<div class="p-6">
				<div class="space-y-3">
					{#each reportReasons as reason}
						<button
							onclick={() => handleReasonSelect(reason.value)}
							disabled={submitting}
							class="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50 {selectedReason ===
							reason.value
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:bg-gray-50'}"
						>
							<span class="text-sm font-medium text-gray-700">{reason.label}</span>
							<div
								class="h-5 w-5 rounded-full border-2 {selectedReason === reason.value
									? 'border-blue-500 bg-blue-500'
									: 'border-gray-300'}"
							>
								{#if selectedReason === reason.value}
									<svg
										class="h-full w-full text-white"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</div>
						</button>
					{/each}
				</div>

				<!-- Submit Button -->
				<button
					onclick={handleSubmit}
					disabled={!selectedReason || submitting}
					class="mt-6 w-full rounded-lg bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					{submitting ? '신고 접수 중...' : '신고하기'}
				</button>

				<!-- Info Text -->
				<p class="mt-4 text-center text-xs text-gray-500">
					허위 신고 시 서비스 이용이 제한될 수 있습니다.
				</p>
			</div>
		</div>
	</div>
{/if}