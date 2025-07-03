<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, FileText, Upload, CheckCircle2, X } from 'lucide-svelte';

	type FileUpload = {
		id: string;
		label: string;
		file: File | null;
		uploading: boolean;
		uploaded: boolean;
		error: string;
	};

	let fileUploads = $state<FileUpload[]>([
		{
			id: 'guideCertificate',
			label: '가이드 자격증',
			file: null,
			uploading: false,
			uploaded: false,
			error: ''
		},
		{
			id: 'driverLicense',
			label: '현지 운전명허증(차량 가이드)',
			file: null,
			uploading: false,
			uploaded: false,
			error: ''
		},
		{
			id: 'vehicleInsurance',
			label: '차량 보험',
			file: null,
			uploading: false,
			uploaded: false,
			error: ''
		},
		{
			id: 'idDocument',
			label: '신분증 또는 여권',
			file: null,
			uploading: false,
			uploaded: false,
			error: ''
		}
	]);

	let isLoading = $state(false);
	let error = $state('');

	const acceptedFormats = '.pdf,.pptx,.hwp,.docx,.jpg,.jpeg,.png,.gif';
	const maxFileSize = 10 * 1024 * 1024; // 10MB

	function handleFileSelect(uploadId: string, event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		// Validate file size
		if (file.size > maxFileSize) {
			const upload = fileUploads.find(u => u.id === uploadId);
			if (upload) {
				upload.error = '파일 크기가 10MB를 초과합니다.';
			}
			return;
		}

		// Update the file upload state
		const upload = fileUploads.find(u => u.id === uploadId);
		if (upload) {
			upload.file = file;
			upload.error = '';
			upload.uploaded = true;
		}
	}

	function removeFile(uploadId: string) {
		const upload = fileUploads.find(u => u.id === uploadId);
		if (upload) {
			upload.file = null;
			upload.uploaded = false;
			upload.error = '';
			// Reset the file input
			const input = document.getElementById(`file-${uploadId}`) as HTMLInputElement;
			if (input) input.value = '';
		}
	}

	function triggerFileInput(uploadId: string) {
		const input = document.getElementById(`file-${uploadId}`) as HTMLInputElement;
		input?.click();
	}

	// Check if all files are uploaded
	const allFilesUploaded = $derived.by(() => {
		return fileUploads.every(upload => upload.file !== null);
	});

	async function handleSubmit() {
		// Double-check all files are uploaded
		if (!allFilesUploaded) {
			error = '모든 서류를 업로드해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Create FormData to upload files
			const formData = new FormData();
			fileUploads.forEach(upload => {
				if (upload.file) {
					formData.append(upload.id, upload.file);
				}
			});

			// Upload files to the server
			const response = await fetch('/api/profile/guide/qualifications', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('파일 업로드에 실패했습니다.');
			}

			// Navigate to complete page
			await goto('/onboarding/complete');
		} catch (err) {
			error = err instanceof Error ? err.message : '제출에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

</script>

<div class="min-h-screen bg-white overflow-hidden rounded-[40px] shadow-[0px_8px_24px_0px_rgba(255,255,255,0.12)]">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-white/92 backdrop-blur-sm">
		<div class="h-14 px-4 py-2.5">
			<div class="flex items-center h-9">
				<button
					onclick={() => history.back()}
					class="shrink-0"
				>
					<ChevronLeft class="h-6 w-6 text-[#052236]" />
				</button>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="px-4 py-3 pb-32">
		<div class="space-y-10">
			<!-- Title -->
			<div class="space-y-2">
				<h1 class="text-[22px] font-bold text-[#052236] leading-9">가이드 자격</h1>
				<p class="text-[14px] text-[#8ea0ac] leading-5">
					가이드에 필요한 구비 서류를 업로드해 주세요
				</p>
			</div>

			<!-- File uploads -->
			<div class="space-y-10">
				{#each fileUploads as upload}
					<div class="space-y-2">
						<label class="text-[11px] font-medium text-[#052236] tracking-[0.11px]">
							{upload.label}
						</label>
						
						{#if upload.uploaded && upload.file}
							<!-- Uploaded file state -->
							<div class="relative bg-[#1095f4]/5 rounded-[9px] border border-solid border-[#1095f4] transition-all">
								<div class="px-4 py-4 flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div class="flex items-center justify-center w-10 h-10 bg-[#1095f4]/10 rounded-full">
											<CheckCircle2 class="h-5 w-5 text-[#1095f4]" />
										</div>
										<div class="text-left">
											<p class="text-[13px] font-medium text-[#052236] truncate max-w-[200px]">
												{upload.file.name}
											</p>
											<p class="text-[11px] text-[#8ea0ac]">
												{upload.file.size > 1024 * 1024 
													? `${(upload.file.size / (1024 * 1024)).toFixed(1)} MB`
													: `${(upload.file.size / 1024).toFixed(1)} KB`
												}
											</p>
										</div>
									</div>
									<button
										onclick={(e) => {
											e.stopPropagation();
											removeFile(upload.id);
										}}
										class="p-1 hover:bg-gray-100 rounded-full transition-colors"
									>
										<X class="h-4 w-4 text-gray-500" />
									</button>
								</div>
							</div>
						{:else}
							<!-- Empty upload state -->
							<div
								class="relative bg-[rgba(0,62,129,0.02)] rounded-[9px] border border-dashed border-[rgba(0,62,129,0.01)] cursor-pointer transition-all hover:bg-[rgba(0,62,129,0.04)]"
								onclick={() => triggerFileInput(upload.id)}
							>
								<input
									id={`file-${upload.id}`}
									type="file"
									accept={acceptedFormats}
									onchange={(e) => handleFileSelect(upload.id, e)}
									class="hidden"
								/>
								
								<div class="px-3 py-6 flex flex-col items-center justify-center gap-3">
									<FileText class="h-8 w-8 opacity-24 text-[#052236]" />
									<p class="text-[12px] leading-[18px]">
										<span class="font-medium text-[#1095f4]">파일</span>
										<span class="text-[#8ea0ac]">을 클릭하여 찾아보세요.</span>
									</p>
								</div>
							</div>
						{/if}
						
						{#if upload.error}
							<p class="text-[11px] text-red-500">{upload.error}</p>
						{:else}
							<p class="text-[11px] text-[#919fa8] tracking-[0.11px] leading-4">
								지원되는 파일 형식: pdf, pptx, hwp, docx, jpg, png, gif
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		{#if error}
			<div class="mt-6 rounded-lg border border-red-200 bg-red-50 p-3">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	</div>

	<!-- Bottom section with button -->
	<div class="fixed bottom-0 left-0 right-0">
		<!-- Button container -->
		<div class="bg-[rgba(254,254,254,0.96)] backdrop-blur-sm rounded-t-[16px] px-4 py-2 border-t border-[#f1f1f1] shadow-[0px_-5px_20px_0px_rgba(0,0,0,0.02)]">
			<button
				onclick={handleSubmit}
				disabled={isLoading || !allFilesUploaded}
				class="w-full rounded-[9px] py-3.5 font-semibold text-[14px] tracking-[0.14px] text-white transition-colors {allFilesUploaded && !isLoading
					? 'bg-[#1095f4] hover:bg-[#0d7ed4]'
					: 'bg-gray-300 cursor-not-allowed'}"
			>
				{isLoading ? '제출 중...' : '최종 제안'}
			</button>
		</div>
		
		<!-- Home indicator -->
		<div class="bg-[rgba(254,254,254,0.96)] h-[34px] relative">
			<div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
		</div>
	</div>
</div>