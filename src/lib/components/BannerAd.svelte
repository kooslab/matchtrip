<script lang="ts">
	import { onMount } from 'svelte';
	import type { Banner } from '$lib/server/db/schema';
	import BannerDetailModal from './BannerDetailModal.svelte';

	let banner = $state<Banner | null>(null);
	let showModal = $state(false);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const response = await fetch('/api/banners/active');
			const data = await response.json();
			banner = data.banner;
		} catch (err) {
			console.error('Error fetching active banner:', err);
		} finally {
			isLoading = false;
		}
	});

	function handleBannerClick() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}
</script>

{#if !isLoading && banner}
	<section class="mt-4 bg-white px-4">
		<button
			onclick={handleBannerClick}
			class="w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
		>
			<img
				src={banner.bannerImageUrl}
				alt={banner.description}
				class="h-auto w-full object-cover"
				loading="lazy"
			/>
		</button>
	</section>

	<!-- Banner Detail Modal -->
	<BannerDetailModal {banner} isOpen={showModal} onClose={closeModal} />
{/if}