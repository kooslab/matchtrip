<script lang="ts">
	import { FileText, Download } from 'lucide-svelte';
	
	interface Props {
		message: any;
		currentUserId: string;
	}
	
	const { message, currentUserId }: Props = $props();
	
	const isOwnMessage = $derived(message.senderId === currentUserId);
	const fileData = $derived(message.metadata as { 
		filename: string; 
		fileSize: number; 
		url: string 
	});
	
	// Format file size
	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
	
	// Handle file download
	async function handleDownload() {
		try {
			const response = await fetch(fileData.url);
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

<div class="{isOwnMessage ? 'bg-blue-500' : 'bg-gray-100'} rounded-2xl p-3 max-w-xs">
	<div class="flex items-center gap-3">
		<div class="{isOwnMessage ? 'bg-blue-400' : 'bg-gray-200'} p-2 rounded-lg">
			<FileText class="h-6 w-6 {isOwnMessage ? 'text-white' : 'text-gray-600'}" />
		</div>
		
		<div class="flex-1 min-w-0">
			<p class="{isOwnMessage ? 'text-white' : 'text-gray-900'} text-sm font-medium truncate">
				{fileData.filename}
			</p>
			<p class="{isOwnMessage ? 'text-blue-100' : 'text-gray-500'} text-xs">
				PDF • {formatFileSize(fileData.fileSize)}
			</p>
		</div>
		
		<button
			onclick={handleDownload}
			class="{isOwnMessage ? 'text-white hover:bg-blue-400' : 'text-gray-600 hover:bg-gray-200'} p-1.5 rounded-full transition-colors"
		>
			<Download class="h-4 w-4" />
		</button>
	</div>
</div>