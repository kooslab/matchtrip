<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import { browser } from '$app/environment';

	interface Announcement {
		id: string;
		title: string;
		content: string;
		imageUrl?: string | null;
		createdAt: Date;
	}

	let announcements = $state<Announcement[]>([]);
	let currentAnnouncementIndex = $state(0);
	let showModal = $state(false);
	let isLoading = $state(true);

	// LocalStorage key prefix
	const STORAGE_KEY_PREFIX = 'announcement_dismissed_';

	onMount(async () => {
		if (!browser) return;

		try {
			console.log('[AnnouncementModal] Fetching announcements...');

			// Add timeout to prevent hanging
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			// Fetch active announcements
			const response = await fetch('/api/announcements', {
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			console.log('[AnnouncementModal] Response status:', response.status);

			if (!response.ok) {
				throw new Error(`Failed to fetch announcements: ${response.status}`);
			}

			const allAnnouncements: Announcement[] = await response.json();
			console.log('[AnnouncementModal] Fetched announcements:', allAnnouncements.length);

			// Filter out announcements that were dismissed today
			const today = new Date().toDateString();
			announcements = allAnnouncements.filter((announcement) => {
				const dismissedDate = localStorage.getItem(`${STORAGE_KEY_PREFIX}${announcement.id}`);
				return dismissedDate !== today;
			});

			console.log('[AnnouncementModal] Filtered announcements:', announcements.length);

			// Show modal if there are announcements to display
			if (announcements.length > 0) {
				showModal = true;
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				console.error('[AnnouncementModal] Request timeout after 5s');
			} else {
				console.error('[AnnouncementModal] Error fetching announcements:', error);
			}
		} finally {
			isLoading = false;
		}
	});

	function closeModal() {
		showModal = false;
	}

	function dismissToday() {
		if (!browser || !currentAnnouncement) return;

		const today = new Date().toDateString();
		localStorage.setItem(`${STORAGE_KEY_PREFIX}${currentAnnouncement.id}`, today);

		// Show next announcement or close modal
		if (currentAnnouncementIndex < announcements.length - 1) {
			currentAnnouncementIndex++;
		} else {
			showModal = false;
		}
	}

	function showNextAnnouncement() {
		if (currentAnnouncementIndex < announcements.length - 1) {
			currentAnnouncementIndex++;
		} else {
			showModal = false;
		}
	}

	let currentAnnouncement = $derived(announcements[currentAnnouncementIndex]);
</script>

{#if showModal && currentAnnouncement && !isLoading}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={closeModal}></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
			<!-- Close Button -->
			<button
				onclick={closeModal}
				class="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-600 hover:bg-white hover:text-gray-900"
				aria-label="Close"
			>
				<X class="h-5 w-5" />
			</button>

			<!-- Content -->
			<div class="max-h-[80vh] overflow-y-auto">
				<!-- Image (if exists) -->
				{#if currentAnnouncement.imageUrl}
					<div class="w-full">
						<img
							src={currentAnnouncement.imageUrl}
							alt={currentAnnouncement.title}
							class="w-full rounded-t-lg object-cover"
						/>
					</div>
				{/if}

				<!-- Text Content -->
				<div class="p-6">
					<!-- Title -->
					<h2 class="mb-4 text-2xl font-bold text-gray-900">
						{currentAnnouncement.title}
					</h2>

					<!-- Rich HTML Content -->
					<div class="prose prose-sm max-w-none">
						{@html currentAnnouncement.content}
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3 border-t p-4">
				<button
					onclick={dismissToday}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					오늘 하루<br />보지 않기
				</button>
				<button
					onclick={showNextAnnouncement}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					{currentAnnouncementIndex < announcements.length - 1 ? '다음' : '닫기'}
				</button>
			</div>

			<!-- Pagination indicator (if multiple announcements) -->
			{#if announcements.length > 1}
				<div class="flex justify-center gap-2 pb-4">
					{#each announcements as _, index}
						<div
							class="h-2 w-2 rounded-full {index === currentAnnouncementIndex
								? 'bg-blue-600'
								: 'bg-gray-300'}"
						></div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Style the rich content */
	.prose :global(h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.prose :global(h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.prose :global(p) {
		margin-bottom: 0.5rem;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.prose :global(img) {
		max-width: 100%;
		height: auto;
		margin: 1rem 0;
		border-radius: 0.5rem;
	}

	.prose :global(a) {
		color: #1095f4;
		text-decoration: underline;
	}

	.prose :global(strong),
	.prose :global(b) {
		font-weight: 600;
	}

	.prose :global(em),
	.prose :global(i) {
		font-style: italic;
	}

	.prose :global(u) {
		text-decoration: underline;
	}
</style>
