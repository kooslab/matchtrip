<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore, offerFormValidation } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import checkUrl from '$lib/icons/icon-check-circle-mono.svg';

	let { data } = $props();
	let trip = $derived(data.trip);
	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Get form data from store
	const formData = $derived($offerFormStore);

	// Calculate total price
	const totalTravelers = $derived((trip.adultsCount || 0) + (trip.childrenCount || 0));
	const totalPrice = $derived(() => {
		const pricePerPerson = parseInt(formData.pricePerPerson) || 0;
		return pricePerPerson * totalTravelers;
	});

	// Format price for display
	function formatPrice(price: number): string {
		return new Intl.NumberFormat('ko-KR').format(price);
	}

	// Format date
	function formatDate(date: string | Date): string {
		const d = new Date(date);
		return d.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	// Submit offer
	async function handleSubmit() {
		if (!$offerFormValidation.canSubmit) return;

		try {
			// Prepare itinerary data
			const itineraryData = formData.itinerary.map((day) => ({
				day: day.day,
				imageUrl: day.imageUrl || null,
				timeSlots: day.timeSlots
			}));

			const response = await fetch('/api/offers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tripId: formData.tripId,
					title: `${formatPrice(parseInt(formData.pricePerPerson))}원 제안`,
					description: formData.description,
					price: totalPrice,
					itinerary: JSON.stringify(itineraryData),
					includes: [],
					excludes: []
				})
			});

			if (response.ok) {
				// Navigate to success page
				goto('/offers/create/success');
			} else {
				const error = await response.json();
				alert(error.message || '제안서 작성에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error submitting offer:', error);
			alert('제안서 작성 중 오류가 발생했습니다.');
		}
	}

	function handleEdit(step: string) {
		goto(`/offers/create/${step}?tripId=${tripId}`);
	}
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">제안 내용을 확인해주세요</h2>
			<p class="mt-2 text-sm text-gray-500">작성하신 내용을 검토하고 제출해주세요.</p>
		</div>

		<!-- Review Sections -->
		<div class="space-y-4">
			<!-- Trip Info -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-medium text-gray-900">여행 정보</h3>
				</div>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">목적지</span>
						<span class="font-medium text-gray-900">{trip.destination}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">여행 기간</span>
						<span class="font-medium text-gray-900">
							{formatDate(trip.departureDate)} - {formatDate(trip.returnDate)}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">인원</span>
						<span class="font-medium text-gray-900">{totalTravelers}명</span>
					</div>
				</div>
			</div>

			<!-- Price -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-medium text-gray-900">가격</h3>
					<button
						onclick={() => handleEdit('price')}
						class="text-sm font-medium transition-colors"
						style="color: {colors.primary}"
					>
						수정
					</button>
				</div>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">1인당 가격</span>
						<span class="font-medium text-gray-900"
							>{formatPrice(parseInt(formData.pricePerPerson))}원</span
						>
					</div>
					<div class="flex justify-between border-t border-gray-100 pt-2">
						<span class="text-gray-900">총 금액</span>
						<span class="font-semibold text-gray-900">{formatPrice(totalPrice)}원</span>
					</div>
				</div>
			</div>

			<!-- Description -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-medium text-gray-900">제안 내용</h3>
					<button
						onclick={() => handleEdit('description')}
						class="text-sm font-medium transition-colors"
						style="color: {colors.primary}"
					>
						수정
					</button>
				</div>
				<p class="text-sm whitespace-pre-wrap text-gray-700">{formData.description}</p>
			</div>

			<!-- Itinerary -->
			{#if formData.itinerary.some((day) => day.timeSlots.length > 0)}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="font-medium text-gray-900">일정</h3>
						<button
							onclick={() => handleEdit('itinerary')}
							class="text-sm font-medium transition-colors"
							style="color: {colors.primary}"
						>
							수정
						</button>
					</div>
					<div class="space-y-3">
						{#each formData.itinerary as day}
							{#if day.timeSlots.length > 0}
								<div class="text-sm">
									<p class="mb-2 font-medium text-gray-900">Day {day.day}</p>
									<div class="space-y-1">
										{#each day.timeSlots as slot}
											<div class="flex gap-2 text-gray-600">
												<span class="font-medium">{slot.time}</span>
												<span>{slot.title}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Files -->
			{#if formData.additionalFiles.length > 0}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="font-medium text-gray-900">첨부 파일</h3>
						<button
							onclick={() => handleEdit('files')}
							class="text-sm font-medium transition-colors"
							style="color: {colors.primary}"
						>
							수정
						</button>
					</div>
					<div class="space-y-2">
						{#each formData.additionalFiles as file}
							<p class="text-sm text-gray-600">• {file.name}</p>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Terms -->
		<div class="rounded-lg bg-blue-50 p-4">
			<div class="flex items-start gap-2">
				<img
					src={checkUrl}
					alt="체크"
					class="mt-0.5 h-4 w-4 flex-shrink-0"
					style="filter: brightness(0) saturate(100%) invert(44%) sepia(93%) saturate(1494%) hue-rotate(183deg) brightness(97%) contrast(97%);"
				/>
				<p class="text-sm text-blue-800">
					제안서를 제출하면 여행자가 검토 후 수락/거절을 결정합니다. 수락 시 알림을 받게 되며,
					대화를 통해 세부 사항을 조율할 수 있습니다.
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<button
		onclick={handleSubmit}
		disabled={!$offerFormValidation.canSubmit}
		class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
			{$offerFormValidation.canSubmit ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50'}"
		style="background-color: {$offerFormValidation.canSubmit ? colors.primary : '#CBD5E1'}"
	>
		최종 제안
	</button>
</div>
