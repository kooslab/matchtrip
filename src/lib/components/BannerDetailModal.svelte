<script lang="ts">
	import { X, ExternalLink } from 'lucide-svelte';
	import type { Banner } from '$lib/server/db/schema';

	interface Props {
		banner: Banner;
		isOpen: boolean;
		onClose: () => void;
	}

	const { banner, isOpen, onClose }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleLinkClick() {
		window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
		onClose();
	}

	function handleImageClick() {
		window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
		onClose();
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={handleBackdropClick}></div>

	<!-- Modal - Bottom Sheet -->
	<div class="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md bg-white rounded-t-2xl">
		<!-- Header -->
		<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 rounded-t-2xl">
			<h3 class="text-lg font-semibold text-gray-900">광고 상세</h3>
			<button
				onclick={onClose}
				class="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Content -->
		<div class="max-h-[80vh] overflow-y-auto px-4 py-6">
			<!-- Full Ad Image -->
			<button
				onclick={handleImageClick}
				class="mb-4 w-full overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
			>
				<img
					src={banner.fullImageUrl}
					alt={banner.description}
					class="h-auto w-full object-contain"
				/>
			</button>

			<!-- Description -->
			<div class="mb-6">
				<p class="text-sm text-gray-700 whitespace-pre-wrap">{banner.description}</p>
			</div>

			<!-- CTA Button -->
			<button
				onclick={handleLinkClick}
				class="flex w-full items-center justify-center rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-600"
			>
				<span>자세히 보기</span>
				<ExternalLink class="ml-2 h-5 w-5" />
			</button>
		</div>

		<!-- Bottom Safe Area -->
		<div class="h-6"></div>
	</div>
{/if}