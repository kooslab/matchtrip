<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import arrowBackIcon from '$lib/icons/icon-arrow-left-small-mono.svg';
	import starIcon from '$lib/icons/icon-star-mono.svg';
	import cameraIcon from '$lib/icons/icon-camera-mono.svg';
	import closeIcon from '$lib/icons/icon-x-mono.svg';

	let { data } = $props();

	let rating = $state(0);
	let hoveredRating = $state(0);
	let reviewText = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let uploadedImages = $state<{ file: File; preview: string }[]>([]);
	let selectedTags = $state<string[]>([]);

	const minCharacters = 10;
	let charactersCount = $derived(reviewText.length);
	let canSubmit = $derived(rating > 0 && reviewText.length >= minCharacters);

	// Predefined review tags with emojis
	const reviewTags = [
		{ emoji: '😊', text: '친절해요' },
		{ emoji: '👨‍💼', text: '전문적이에요' },
		{ emoji: '⏰', text: '시간 약속을 잘 지켜요' },
		{ emoji: '📝', text: '설명이 자세해요' },
		{ emoji: '🤸', text: '유연하게 대처해요' },
		{ emoji: '💬', text: '소통이 원활해요' },
		{ emoji: '📍', text: '추천 장소가 좋아요' },
		{ emoji: '💰', text: '가격이 합리적이에요' },
		{ emoji: '🛡️', text: '안전하게 인도해요' },
		{ emoji: '🎉', text: '재미있어요' }
	];

	function setRating(value: number) {
		rating = value;
	}

	function toggleTag(tagText: string) {
		if (selectedTags.includes(tagText)) {
			selectedTags = selectedTags.filter((t) => t !== tagText);
		} else {
			selectedTags = [...selectedTags, tagText];
		}
	}

	function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (files) {
			for (let i = 0; i < files.length && uploadedImages.length < 5; i++) {
				const file = files[i];
				const reader = new FileReader();

				reader.onload = (e) => {
					if (e.target?.result && uploadedImages.length < 5) {
						uploadedImages = [...uploadedImages, { file, preview: e.target.result as string }];
					}
				};

				reader.readAsDataURL(file);
			}
		}

		// Reset input
		input.value = '';
	}

	function removeImage(index: number) {
		uploadedImages = uploadedImages.filter((_, i) => i !== index);
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
	}

	function formatDateRange(startDate: Date | string, endDate: Date | string) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		return `${formatDate(start)} - ${formatDate(end)} ${nights}박 ${nights + 1}일`;
	}

	async function submitReview() {
		if (!(rating > 0 && reviewText.length >= minCharacters)) return;

		isSubmitting = true;
		error = '';

		try {
			// Upload images first
			const imageUrls: string[] = [];
			for (const image of uploadedImages) {
				const formData = new FormData();
				formData.append('file', image.file);
				formData.append('type', 'review');

				const uploadResponse = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (uploadResponse.ok) {
					const uploadData = await uploadResponse.json();
					imageUrls.push(uploadData.url);
				} else {
					console.error('Failed to upload image');
				}
			}

			// Submit review with images and tags
			const response = await fetch(`/api/reviews/${data.review.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					rating,
					content: reviewText,
					images: imageUrls,
					tags: selectedTags
				})
			});

			if (response.ok) {
				goto(`/write-review/${$page.params.token}/complete`);
			} else {
				const data = await response.json();
				error = data.error || '리뷰 저장 중 오류가 발생했습니다.';
			}
		} catch (err) {
			error = '네트워크 오류가 발생했습니다.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>리뷰 작성하기 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<div class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-[52px] items-center px-4">
			<button
				onclick={() => goto(data.reviewType === 'trip' ? '/my-trips' : '/order-history')}
				class="-ml-1 p-1"
			>
				<img src={arrowBackIcon} alt="뒤로가기" class="h-6 w-6" />
			</button>
			<h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">리뷰 작성하기</h1>
			<div class="w-6"></div>
		</div>
	</div>

	<!-- Content -->
	<div class="pb-24">
		<!-- Guide Info -->
		<div class="px-4 pt-6">
			<div class="flex items-center gap-4">
				{#if data.guideProfile?.profileImageUrl}
					<img
						src={data.guideProfile.profileImageUrl.startsWith('http')
							? data.guideProfile.profileImageUrl
							: data.guideProfile.profileImageUrl.startsWith('/api/images/')
								? data.guideProfile.profileImageUrl
								: `/api/images/${data.guideProfile.profileImageUrl}`}
						alt={data.guide.name}
						class="h-16 w-16 rounded-full object-cover"
					/>
				{:else}
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
						<span class="text-xl font-semibold text-gray-600">
							{data.guide.name.charAt(0)}
						</span>
					</div>
				{/if}
				<div class="flex-1">
					<h2 class="text-lg font-semibold text-gray-900">{data.guide.name}</h2>
					{#if data.reviewType === 'trip'}
						<p class="text-sm text-gray-600">
							{data.destination?.city || '알 수 없는 도시'}, {data.country?.name ||
								'알 수 없는 국가'}
						</p>
						<p class="mt-1 text-xs text-gray-500">
							{formatDateRange(data.trip.startDate, data.trip.endDate)}
						</p>
					{:else if data.reviewType === 'product'}
						<p class="text-sm text-gray-600">
							{data.product?.title || '상품'}
						</p>
						{#if data.productOffer}
							<p class="mt-1 text-xs text-gray-500">
								{data.productOffer.duration}일 일정
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>

		<!-- Rating Section -->
		<div class="px-4 pt-8">
			<h3 class="mb-4 text-base font-semibold text-gray-900">
				{data.reviewType === 'trip' ? '가이드는 어떠셨나요?' : '상품은 어떠셨나요?'}
			</h3>
			<div class="flex justify-center gap-3">
				{#each [1, 2, 3, 4, 5] as value}
					<button
						onclick={() => setRating(value)}
						onmouseenter={() => (hoveredRating = value)}
						onmouseleave={() => (hoveredRating = 0)}
						class="p-1 transition-transform hover:scale-110"
					>
						<svg
							class="h-10 w-10 transition-all {(hoveredRating || rating) >= value
								? 'fill-yellow-400'
								: 'fill-gray-300'}"
							viewBox="0 0 24 24"
						>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
							/>
						</svg>
					</button>
				{/each}
			</div>
			{#if rating > 0}
				<p class="mt-3 text-center text-sm text-gray-600">
					{rating === 5
						? '최고예요!'
						: rating === 4
							? '좋아요!'
							: rating === 3
								? '괜찮아요'
								: rating === 2
									? '별로예요'
									: '아쉬워요'}
				</p>
			{/if}
		</div>

		<!-- Review Text Section -->
		<div class="px-4 pt-8">
			<h3 class="mb-2 text-base font-semibold text-gray-900">어떤 점이 좋았나요?</h3>
			<p class="mb-4 text-sm text-gray-600">다른 여행자들에게 도움이 되도록 자세히 작성해주세요.</p>
			<div class="relative">
				<textarea
					bind:value={reviewText}
					placeholder={data.reviewType === 'trip'
						? '가이드와 함께한 여행은 어떠셨나요? 좋았던 점, 아쉬웠던 점을 자유롭게 작성해주세요.'
						: '상품은 어떠셨나요? 좋았던 점, 아쉬웠던 점을 자유롭게 작성해주세요.'}
					class="min-h-[200px] w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-[#1095f4] focus:outline-none"
				></textarea>
				<div
					class="absolute right-3 bottom-3 text-xs {reviewText.length < minCharacters
						? 'text-red-500'
						: 'text-gray-500'}"
				>
					{reviewText.length}자 {#if reviewText.length < minCharacters}(최소 {minCharacters}자){/if}
				</div>
			</div>
		</div>

		<!-- Quick Review Tags Section -->
		<div class="px-4 pt-8">
			<h3 class="mb-4 text-base font-semibold text-gray-900">어떤 점이 인상적이었나요?</h3>
			<div class="flex flex-wrap gap-2">
				{#each reviewTags as tag}
					<button
						onclick={() => toggleTag(tag.text)}
						class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all
							{selectedTags.includes(tag.text)
							? 'bg-[#1095f4] text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						<span class="text-base">{tag.emoji}</span>
						<span>{tag.text}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Image Upload Section -->
		<div class="px-4 pt-8">
			<h3 class="mb-4 text-base font-semibold text-gray-900">사진 추가 (선택사항)</h3>
			<div class="flex flex-wrap gap-2">
				{#each uploadedImages as image, index}
					<div class="relative h-20 w-20">
						<img
							src={image.preview}
							alt="Uploaded {index + 1}"
							class="h-full w-full rounded-lg object-cover"
						/>
						<button
							onclick={() => removeImage(index)}
							class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500"
						>
							<img src={closeIcon} alt="Remove" class="h-3 w-3 brightness-0 invert" />
						</button>
					</div>
				{/each}

				{#if uploadedImages.length < 5}
					<label
						class="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-50"
					>
						<img src={cameraIcon} alt="Add photo" class="h-6 w-6 opacity-50" />
						<span class="mt-1 text-xs text-gray-500">{uploadedImages.length}/5</span>
						<input
							type="file"
							accept=".jpg,.jpeg,.png"
							multiple
							class="hidden"
							onchange={handleImageUpload}
						/>
					</label>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="px-4 pt-4">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	</div>

	<!-- Fixed Bottom Button -->
	<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white">
		<div class="mx-auto max-w-[430px]">
			<div class="px-4 py-3 pb-8">
				<button
					onclick={submitReview}
					disabled={!(rating > 0 && reviewText.length >= minCharacters) || isSubmitting}
					class="w-full rounded-xl py-3.5 font-semibold text-white transition-colors {rating > 0 &&
					reviewText.length >= minCharacters &&
					!isSubmitting
						? 'bg-[#1095f4] hover:bg-blue-600'
						: 'bg-gray-300'}"
				>
					{#if isSubmitting}
						<span
							class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
					{:else}
						리뷰 등록하기
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
