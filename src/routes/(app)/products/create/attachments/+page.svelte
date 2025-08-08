<script lang="ts">
	import { goto } from '$app/navigation';
	import { Paperclip, X } from 'lucide-svelte';
	import pdfImage from '$lib/images/pdf.png';
	
	const { data } = $props();
	
	// Get product data from layout
	const productData = $derived(data.productData);
	
	// File state
	interface UploadedFile {
		id: string;
		name: string;
		size: number;
		progress: number;
		url?: string;
	}
	
	let uploadedFiles = $state<UploadedFile[]>([]);
	let uploading = $state(false);
	let fileInputEl: HTMLInputElement;
	let isSubmitting = $state(false);
	
	// Initialize with existing files
	$effect(() => {
		if (productData.fileIds && productData.fileIds.length > 0) {
			// In real implementation, we would fetch file details from API
			// For now, just initialize empty array
			uploadedFiles = [];
		}
	});
	
	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' bytes';
		else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
		else return Math.round(bytes / 1048576) + ' MB';
	}
	
	// Handle file selection
	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		
		if (!files || files.length === 0) return;
		
		for (const file of Array.from(files)) {
			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				window.alert(`${file.name} 파일이 5MB를 초과합니다.`);
				continue;
			}
			
			// Create temporary file object
			const tempFile: UploadedFile = {
				id: crypto.randomUUID(),
				name: file.name,
				size: file.size,
				progress: 0
			};
			
			uploadedFiles = [...uploadedFiles, tempFile];
			
			// Upload file
			await uploadFile(file, tempFile);
		}
		
		// Clear input
		input.value = '';
	}
	
	// Upload file to server
	async function uploadFile(file: File, uploadedFile: UploadedFile) {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', 'product_attachment');
		
		try {
			uploading = true;
			
			// Simulate progress (in real implementation, use XMLHttpRequest for progress)
			const progressInterval = setInterval(() => {
				const index = uploadedFiles.findIndex(f => f.id === uploadedFile.id);
				if (index !== -1) {
					uploadedFiles[index].progress = Math.min(uploadedFiles[index].progress + 10, 90);
					uploadedFiles = [...uploadedFiles];
				}
			}, 100);
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});
			
			clearInterval(progressInterval);
			
			if (!response.ok) throw new Error('Upload failed');
			
			const data = await response.json();
			const index = uploadedFiles.findIndex(f => f.id === uploadedFile.id);
			if (index !== -1) {
				uploadedFiles[index].progress = 100;
				uploadedFiles[index].url = data.url;
				uploadedFiles = [...uploadedFiles];
			}
		} catch (error) {
			console.error('Upload error:', error);
			// Remove failed upload
			uploadedFiles = uploadedFiles.filter(f => f.id !== uploadedFile.id);
			window.alert('파일 업로드에 실패했습니다.');
		} finally {
			uploading = false;
		}
	}
	
	// Remove file
	function removeFile(fileId: string) {
		uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
	}
	
	// Skip step - directly create product without files
	async function handleSkip() {
		await handleSubmit(true);
	}
	
	// Submit and create product
	async function handleSubmit(skipFiles = false) {
		if (!skipFiles && uploadedFiles.length === 0) {
			const confirm = window.confirm('첨부 파일 없이 계속하시겠습니까?');
			if (!confirm) return;
		}
		
		isSubmitting = true;
		
		try {
			// Save file IDs to cookies if any
			if (uploadedFiles.length > 0) {
				const fileIds = uploadedFiles.map(f => f.id);
				const saveResponse = await fetch('/api/products/create/save-step', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						step: 'attachments',
						data: { fileIds }
					})
				});
				
				if (!saveResponse.ok) {
					throw new Error('Failed to save attachments');
				}
			}
			
			// Create the product via API
			const response = await fetch('/api/products/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileIds: uploadedFiles.map(f => f.id)
				})
			});
			
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create product');
			}
			
			const data = await response.json();
			
			// Navigate to success page
			await goto(`/products/create/success?id=${data.productId}`);
		} catch (error) {
			console.error('Error creating product:', error);
			window.alert(error.message || '상품 생성 중 오류가 발생했습니다');
			isSubmitting = false;
		}
	}
</script>

<div class="flex-1 bg-white">
	<!-- Header with skip button -->
	<div class="px-4 pt-6 pb-4">
		<div class="flex items-start justify-between">
			<div>
				<h2 class="text-lg text-gray-600">여행을 안내할 파일을 업로드해 주세요</h2>
				<p class="mt-2 text-sm text-gray-500">참고 파일</p>
			</div>
			<button
				onclick={handleSkip}
				class="text-sm text-blue-500 font-medium"
			>
				건너뛰기
			</button>
		</div>
	</div>
	
	<!-- File upload area -->
	<div class="px-4 pb-6">
		<label class="block">
			<input
				bind:this={fileInputEl}
				type="file"
				multiple
				accept=".pdf,.pptx,.hwp,.docx"
				onchange={handleFileSelect}
				class="hidden"
			/>
			<div class="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-gray-400 bg-gray-50">
				<div class="text-center">
					<Paperclip class="mx-auto h-12 w-12 text-gray-400" />
					<p class="mt-2 text-sm text-gray-600">파일을 클릭하여 찾아보세요.</p>
					<p class="mt-1 text-xs text-gray-500">지원되는 파일 형식: pdf, pptx, hwp, docx</p>
				</div>
			</div>
		</label>
	</div>
	
	<!-- Uploaded files list -->
	{#if uploadedFiles.length > 0}
		<div class="px-4 pb-6">
			<h3 class="text-sm font-medium text-gray-700 mb-3">첨부 파일</h3>
			<div class="space-y-2">
				{#each uploadedFiles as file}
					<div class="rounded-lg border border-gray-200 p-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<div class="flex-shrink-0">
									<img src={pdfImage} alt="PDF" class="h-8 w-8 object-contain" />
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
									<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
								</div>
							</div>
							{#if file.progress < 100}
								<div class="w-16 text-right">
									<span class="text-xs text-blue-600">{file.progress}%</span>
								</div>
							{:else}
								<button
									onclick={() => removeFile(file.id)}
									class="p-1 text-gray-400 hover:text-gray-600"
								>
									<X class="h-4 w-4" />
								</button>
							{/if}
						</div>
						{#if file.progress < 100}
							<div class="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
								<div 
									class="h-full bg-blue-500 transition-all duration-300"
									style="width: {file.progress}%"
								></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	<!-- Submit Button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
		<div class="mx-auto max-w-[430px]">
			<button
				onclick={handleSubmit}
				disabled={uploading || isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? '저장 중...' : '상품 등록'}
			</button>
		</div>
	</div>
</div>