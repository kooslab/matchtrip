<script lang="ts">
	import { Download } from 'lucide-svelte';
	import ClipIcon from '$lib/icons/icon-clip-mono.svg';

	interface Props {
		message: any;
		currentUserId: string;
	}

	const { message, currentUserId }: Props = $props();

	const isOwnMessage = $derived(message.senderId === currentUserId);
	const fileData = $derived(
		message.metadata as {
			filename: string;
			fileSize: number;
			url: string;
			isUploading?: boolean;
		}
	);
	const isUploading = $derived(fileData?.isUploading || false);

	// Format file size
	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	// Handle file download
	async function handleDownload() {
		if (isUploading) return;

		// If it's a blob URL (from optimistic update), don't try to download it
		if (fileData.url.startsWith('blob:')) {
			alert('파일이 아직 업로드 중입니다. 잠시 후 다시 시도해주세요.');
			return;
		}

		try {
			// Fetch the file from our API (which now streams PDFs directly)
			const response = await fetch(fileData.url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = fileData.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);
		} catch (error) {
			console.error('Download failed:', error);
			alert('파일 다운로드에 실패했습니다.');
		}
	}
</script>

<div
	class="{isOwnMessage
		? 'bg-blue-500'
		: 'bg-gray-100'} relative max-w-xs rounded-2xl p-3 {isUploading ? 'opacity-70' : ''}"
>
	<div class="flex items-center gap-3">
		<div class="{isOwnMessage ? 'bg-blue-400' : 'bg-gray-200'} rounded-lg p-2">
			<img
				src={ClipIcon}
				alt="File attachment"
				class="h-6 w-6"
				style="filter: {isOwnMessage ? 'brightness(0) invert(1)' : ''}"
			/>
		</div>

		<div class="min-w-0 flex-1">
			<p class="{isOwnMessage ? 'text-white' : 'text-gray-900'} truncate text-sm font-medium">
				{fileData.filename}
			</p>
			<p class="{isOwnMessage ? 'text-blue-100' : 'text-gray-500'} text-xs">
				PDF • {formatFileSize(fileData.fileSize)}
			</p>
		</div>

		{#if !isUploading}
			<button
				onclick={handleDownload}
				class="{isOwnMessage
					? 'text-white hover:bg-blue-400'
					: 'text-gray-600 hover:bg-gray-200'} rounded-full p-1.5 transition-colors"
				title="파일 다운로드"
			>
				<Download class="h-4 w-4" />
			</button>
		{:else}
			<!-- Loading spinner -->
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 {isOwnMessage
					? 'border-white border-t-transparent'
					: 'border-gray-600 border-t-transparent'}"
			></div>
		{/if}
	</div>
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
