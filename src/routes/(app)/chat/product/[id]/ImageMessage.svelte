<script lang="ts">
	interface Props {
		message: any;
		currentUserId: string;
	}

	const { message, currentUserId }: Props = $props();

	const isOwnMessage = $derived(message.senderId === currentUserId);
	const imageUrl = $derived(message.metadata?.url || message.content);
	const isUploading = $derived(message.metadata?.isUploading || false);

	let showFullImage = $state(false);

	function handleImageClick() {
		if (!isUploading) {
			showFullImage = true;
		}
	}

	function closeFullImage() {
		showFullImage = false;
	}
</script>

<!-- Thumbnail -->
<div class="relative">
	<button
		onclick={handleImageClick}
		class="block max-w-xs overflow-hidden rounded-2xl {isUploading
			? 'cursor-wait'
			: 'cursor-pointer'}"
		disabled={isUploading}
	>
		<img
			src={imageUrl}
			alt="Uploaded image"
			class="h-auto w-full {isUploading ? 'opacity-50' : ''}"
			loading="lazy"
		/>
	</button>

	{#if isUploading}
		<!-- Loading overlay -->
		<div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
			<!-- Loading spinner -->
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"
			></div>
		</div>
	{/if}
</div>

<!-- Full Image Modal -->
{#if showFullImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
		onclick={closeFullImage}
	>
		<!-- Close button with better visibility -->
		<button
			onclick={closeFullImage}
			class="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
			aria-label="Close image"
		>
			<svg
				class="h-6 w-6 text-white"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<img
			src={imageUrl}
			alt="Enlarged view"
			class="max-h-full max-w-full object-contain"
			onclick={(e) => e.stopPropagation()}
		/>
	</div>
{/if}

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
