<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Local state
	let selectedFile = $state<File | null>(formData.file || null);
	let fileInputEl: HTMLInputElement;

	// Handle file selection
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			// Check file size (limit to 10MB)
			if (file.size > 10 * 1024 * 1024) {
				alert('파일 크기는 10MB 이하여야 합니다.');
				input.value = '';
				return;
			}

			selectedFile = file;
			onUpdate('file', file);
		}
	}

	// Remove selected file
	function removeFile() {
		selectedFile = null;
		onUpdate('file', null);
		if (fileInputEl) {
			fileInputEl.value = '';
		}
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' bytes';
		else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
		else return Math.round(bytes / 1048576) + ' MB';
	}

	// Validation
	export function validate() {
		// Optional field, always valid
		return true;
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">파일 첨부</h1>
		<p class="mt-2 text-gray-600">여행 관련 참고 자료를 첨부해주세요 (선택)</p>
	</div>

	<div class="px-4 pb-6">
		{#if !selectedFile}
			<label class="block">
				<input
					bind:this={fileInputEl}
					type="file"
					accept=".pdf,.jpg,.jpeg,.png,.docx,.pptx,.xlsx"
					onchange={handleFileSelect}
					class="hidden"
				/>
				<div
					class="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-gray-400"
				>
					<div class="text-center">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p class="mt-2 text-sm text-gray-600">클릭하여 파일 선택</p>
						<p class="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, GIF (최대 10MB)</p>
					</div>
				</div>
			</label>
		{:else}
			<div class="rounded-lg border border-gray-300 p-4">
				<div class="flex items-center justify-between">
					<div class="flex flex-1 items-center gap-3">
						<div class="rounded bg-gray-100 p-2">
							<svg
								class="h-6 w-6 text-gray-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900">{selectedFile.name}</p>
							<p class="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
						</div>
					</div>
					<button
						onclick={removeFile}
						class="p-2 text-gray-400 transition-colors hover:text-gray-600"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<button
				onclick={() => fileInputEl?.click()}
				class="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
			>
				다른 파일 선택
			</button>
		{/if}
	</div>
</div>
