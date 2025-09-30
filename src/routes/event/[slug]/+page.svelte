<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { X } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const event = data.event;

	function formatDate(date: Date | null) {
		if (!date) return null;
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function handleImageClick() {
		if (event.linkUrl) {
			window.open(event.linkUrl, '_blank');
		}
	}

	function handleClose() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-white">
	<div class="relative mx-auto max-w-md">
		<!-- Header -->
		<div class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
			<h1 class="text-lg font-semibold">{event.title}</h1>
			<button onclick={handleClose} class="text-gray-500 hover:text-gray-700">
				<X class="h-6 w-6" />
			</button>
		</div>

		<!-- Content -->
		<div class="p-4">
			<!-- Subtitle -->
			<p class="mb-4 text-sm text-gray-600">{event.subtitle}</p>

			<!-- Full Image -->
			<button
				onclick={handleImageClick}
				class="mb-4 w-full overflow-hidden rounded-lg"
				class:cursor-pointer={event.linkUrl}
			>
				<img
					src={event.fullImageUrl}
					alt={event.title}
					class="w-full object-cover"
					class:hover:opacity-90={event.linkUrl}
				/>
			</button>

			<!-- Event Period -->
			{#if event.startDate || event.endDate}
				<div class="mb-4 rounded-lg bg-gray-50 p-3">
					<p class="text-xs font-medium text-gray-500">이벤트 기간</p>
					<p class="text-sm text-gray-900">
						{formatDate(event.startDate) || '-'} ~ {formatDate(event.endDate) || '-'}
					</p>
				</div>
			{/if}

			<!-- Description -->
			<div class="mb-4">
				<h2 class="mb-2 text-sm font-semibold">이벤트 안내</h2>
				<p class="whitespace-pre-line text-sm text-gray-700">{event.description}</p>
			</div>

			<!-- Gift -->
			{#if event.gift}
				<div class="mb-4 rounded-lg bg-blue-50 p-3">
					<p class="text-xs font-medium text-blue-700">🎁 경품/혜택</p>
					<p class="text-sm text-blue-900">{event.gift}</p>
				</div>
			{/if}

			<!-- Reference Text -->
			{#if event.referenceText}
				<div class="rounded-lg bg-gray-50 p-3">
					<p class="mb-1 text-xs font-medium text-gray-500">참고하세요</p>
					<p class="whitespace-pre-line text-xs text-gray-700">{event.referenceText}</p>
				</div>
			{/if}

			<!-- External Link Button -->
			{#if event.linkUrl}
				<a
					href={event.linkUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-4 block w-full rounded-lg bg-blue-600 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
				>
					자세히 보기
				</a>
			{/if}
		</div>
	</div>
</div>