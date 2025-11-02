<script lang="ts">
	import { X, ChevronDown } from 'lucide-svelte';

	type Props = {
		isOpen: boolean;
		onClose: () => void;
		userRole: 'guide' | 'traveler';
	};

	const { isOpen, onClose, userRole }: Props = $props();

	let reason = $state('');
	let details = $state('');
	let agreedToTerms = $state(false);
	let isDeleting = $state(false);
	let errorMessage = $state('');

	const reasonOptions = [
		{ value: '', label: '탈퇴 사유를 선택해 주세요' },
		{ value: '서비스 불만족', label: '서비스 불만족' },
		{ value: '사용 빈도 낮음', label: '사용 빈도 낮음' },
		{ value: '개인정보 보호', label: '개인정보 보호' },
		{ value: '다른 서비스 이용', label: '다른 서비스 이용' },
		{ value: '기타', label: '기타' }
	];

	const importantNotices = [
		'탈퇴 계정은 재사용 및 복구가 불가능하며, 계정과 관련된 모든 권한이 삭제됩니다.',
		'재가입시에는 서류 등 모든 것을 처음부터 등록해야 하며, 기존의 계정으로 확인하였던 정보는 확인할 수 없습니다.',
		'작성한 게시글, 메시지 등은 데이터베이스에 보관되나 개인정보는 모두 삭제됩니다.',
		'아래의 내용은 개인정보 처리방침을 잘 숙지 후 진행해 주세요.'
	];

	async function handleDelete() {
		if (!reason || !agreedToTerms) {
			errorMessage = '모든 필수 항목을 입력해주세요.';
			return;
		}

		try {
			isDeleting = true;
			errorMessage = '';

			const response = await fetch('/api/users/delete-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					reason,
					details
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || '계정 삭제에 실패했습니다.');
			}

			// Success - force full page reload to clear all cached data
			window.location.href = '/';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : '계정 삭제에 실패했습니다.';
			isDeleting = false;
		}
	}

	function resetForm() {
		reason = '';
		details = '';
		agreedToTerms = false;
		errorMessage = '';
	}

	function handleClose() {
		if (!isDeleting) {
			resetForm();
			onClose();
		}
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={handleClose}></div>

	<!-- Modal Container -->
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<!-- Modal Content -->
		<div class="animate-slide-up relative w-full max-w-lg rounded-t-3xl bg-white">
			<!-- Header -->
			<div class="sticky top-0 z-10 border-b bg-white px-6 pb-4 pt-6">
				<div class="mb-2 flex items-start justify-between">
					<div>
						<h2 class="text-2xl font-bold text-[#052236]">탈퇴하기</h2>
						<p class="mt-2 text-sm text-[#999999]">계정 기록이 모두 삭제됩니다.</p>
					</div>
					<button
						onclick={handleClose}
						disabled={isDeleting}
						class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50"
					>
						<X class="h-5 w-5 text-gray-400" />
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="max-h-[60vh] overflow-y-auto px-6 py-6">
				<!-- Important Notices -->
				<div class="mb-6">
					<h3 class="mb-3 text-sm font-semibold text-[#052236]">• 종요 안함 사유</h3>
					<ul class="space-y-2">
						{#each importantNotices as notice}
							<li class="flex gap-2 text-xs leading-relaxed text-[#666666]">
								<span class="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400"></span>
								<span>{notice}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Reason Dropdown -->
				<div class="mb-4">
					<label class="mb-2 block text-sm font-medium text-[#052236]">탈퇴 사유</label>
					<div class="relative">
						<select
							bind:value={reason}
							disabled={isDeleting}
							class="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-[#052236] focus:border-[#1E90FF] focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 disabled:opacity-50"
						>
							{#each reasonOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
					</div>
				</div>

				<!-- Details Textarea -->
				<div class="mb-6">
					<label class="mb-2 block text-sm font-medium text-[#052236]">
						상세 내용 <span class="text-gray-400">(선택)</span>
					</label>
					<textarea
						bind:value={details}
						disabled={isDeleting}
						placeholder="탈퇴 사유를 자세히 알려주시면 서비스 개선에 도움이 됩니다."
						rows="4"
						class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#052236] placeholder-gray-400 focus:border-[#1E90FF] focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 disabled:opacity-50"
					></textarea>
				</div>

				<!-- Confirmation Checkbox -->
				<div class="mb-4">
					<label class="flex cursor-pointer items-start gap-3">
						<input
							type="checkbox"
							bind:checked={agreedToTerms}
							disabled={isDeleting}
							class="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/20 disabled:opacity-50"
						/>
						<span class="text-sm text-[#052236]">네, 모든 종요 사항을 검토하였습니다.</span>
					</label>
				</div>

				<!-- Error Message -->
				{#if errorMessage}
					<div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
						{errorMessage}
					</div>
				{/if}
			</div>

			<!-- Bottom Buttons -->
			<div class="sticky bottom-0 bg-white px-6 pb-6 pt-4">
				<div class="flex gap-3">
					<button
						onclick={handleClose}
						disabled={isDeleting}
						class="flex-1 rounded-xl border border-gray-200 py-4 text-center text-[16px] font-semibold text-[#052236] transition-colors hover:bg-gray-50 disabled:opacity-50"
					>
						취소
					</button>
					<button
						onclick={handleDelete}
						disabled={!reason || !agreedToTerms || isDeleting}
						class="flex-1 rounded-xl bg-[#052236] py-4 text-center text-[16px] font-semibold text-white transition-colors hover:bg-[#052236]/90 disabled:opacity-50"
					>
						{isDeleting ? '처리중...' : '탈퇴 신청'}
					</button>
				</div>
			</div>
		</div>
	</div>
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

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
