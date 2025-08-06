<script lang="ts">
	interface Props {
		message: any;
		currentUserId: string;
	}
	
	const { message, currentUserId }: Props = $props();
	
	const isOwnMessage = $derived(message.senderId === currentUserId);
	const imageUrl = $derived(message.metadata?.url || message.content);
	
	let showFullImage = $state(false);
	
	function handleImageClick() {
		showFullImage = true;
	}
	
	function closeFullImage() {
		showFullImage = false;
	}
</script>

<!-- Thumbnail -->
<button
	onclick={handleImageClick}
	class="block max-w-xs rounded-2xl overflow-hidden cursor-pointer"
>
	<img 
		src={imageUrl} 
		alt="Uploaded image"
		class="w-full h-auto"
		loading="lazy"
	/>
</button>

<!-- Full Image Modal -->
{#if showFullImage}
	<div 
		class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
		onclick={closeFullImage}
	>
		<button
			onclick={closeFullImage}
			class="absolute top-4 right-4 text-white p-2 rounded-full bg-white/20 hover:bg-white/30"
		>
			<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		
		<img 
			src={imageUrl} 
			alt="Full size image"
			class="max-w-full max-h-full object-contain"
			onclick={(e) => e.stopPropagation()}
		/>
	</div>
{/if}