<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import documentUrl from '$lib/icons/icon-document-mono.svg';
	import closeUrl from '$lib/icons/icon-x-mono.svg';
	import downloadUrl from '$lib/icons/icon-download-mono.svg';

	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Get files from store
	let files = $state($offerFormStore.additionalFiles);

	function handleNext() {
		goto(`/offers/create/review?tripId=${tripId}`);
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			const newFiles = Array.from(input.files);
			offerFormStore.addFiles(newFiles);
			files = $offerFormStore.additionalFiles;
		}
		// Reset input to allow selecting the same file again
		input.value = '';
	}

	function removeFile(index: number) {
		offerFormStore.removeFile(index);
		files = $offerFormStore.additionalFiles;
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	// Get file icon based on extension
	function getFileIcon(filename: string): string {
		const ext = filename.split('.').pop()?.toLowerCase();
		// For now, we'll use the same document icon for all files
		// In a real app, you might have different icons for different file types
		return documentUrl;
	}

	// Allowed file types
	const acceptedFileTypes = '.pdf,.pptx,.hwp,.docx,.doc,.xls,.xlsx';
	const maxFileSize = 10 * 1024 * 1024; // 10MB
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">여행을 안내할 파일을 업로드해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				상세한 일정표나 안내 자료가 있다면 첨부해주세요. (선택사항)
			</p>
		</div>

		<!-- File Upload Area -->
		<div class="space-y-4">
			<label class="block">
				<input
					type="file"
					multiple
					accept={acceptedFileTypes}
					onchange={handleFileUpload}
					class="hidden"
				/>
				<div
					class="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-gray-400 hover:bg-gray-100"
				>
					<img
						src={downloadUrl}
						alt="업로드"
						class="mx-auto mb-3 h-12 w-12 text-gray-400"
						style="transform: rotate(180deg);"
					/>
					<p class="mb-1 text-base font-medium text-gray-700">파일을 클릭하여 찾아보세요</p>
					<p class="text-sm text-gray-500">또는 파일을 여기로 드래그하세요</p>
					<p class="mt-3 text-xs text-gray-400">지원 형식: PDF, PPTX, HWP, DOCX (최대 10MB)</p>
				</div>
			</label>

			<!-- File List -->
			{#if files.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium text-gray-700">업로드된 파일 ({files.length}개)</p>
					{#each files as file, index}
						<div
							class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
						>
							<div class="flex items-center gap-3">
								<img src={getFileIcon(file.name)} alt="파일" class="h-8 w-8 text-gray-400" />
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-gray-900">
										{file.name}
									</p>
									<p class="text-xs text-gray-500">
										{formatFileSize(file.size)}
									</p>
								</div>
							</div>
							<button
								onclick={() => removeFile(index)}
								class="flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-gray-600"
								title="파일 삭제"
							>
								<img src={closeUrl} alt="삭제" class="h-5 w-5" />
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Info Box -->
		<div class="rounded-lg bg-blue-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-blue-900">파일 업로드 안내</h3>
			<ul class="space-y-1 text-sm text-blue-800">
				<li>• 상세 일정표, 코스 안내서 등을 첨부하면 좋습니다</li>
				<li>• 여러 파일을 한 번에 선택할 수 있습니다</li>
				<li>• 파일은 여행자가 제안을 수락한 후에 다운로드할 수 있습니다</li>
				<li>• 개인정보가 포함된 파일은 업로드하지 마세요</li>
			</ul>
		</div>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<button
		onclick={handleNext}
		class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
		style="background-color: {colors.primary}"
	>
		다음
	</button>
</div>
