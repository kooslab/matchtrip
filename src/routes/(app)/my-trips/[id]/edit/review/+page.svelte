<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	import { formatKoreanDateRange } from '$lib/utils/dateFormatter';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Form state
	let customRequest = $state('');
	let formData = $state<any>({});
	let isSubmitting = $state(false);

	// Initialize form on mount
	onMount(() => {
		formData = tripEditForm.getData();
		customRequest = formData.customRequest || trip.customRequest || '';
	});

	// Get display values
	function getTravelMethodDisplay(method: string) {
		const methodMap: Record<string, string> = {
			walking: '도보',
			driving: '자동차',
			public_transport: '대중교통',
			bike: '자전거'
		};
		return method
			.split('+')
			.map((m) => methodMap[m] || m)
			.join(' + ');
	}

	function getTravelStyleDisplay(style: string) {
		const styleMap: Record<string, string> = {
			relaxation: '휴양/힐링',
			adventure: '모험/액티비티',
			culture: '문화/역사',
			food: '미식/요리',
			shopping: '쇼핑',
			nature: '자연/생태',
			city: '도시 탐방',
			family: '가족 여행'
		};
		return styleMap[style] || style;
	}

	function getAccommodationDisplay(type: string) {
		const typeMap: Record<string, string> = {
			hotel: '호텔',
			resort: '리조트',
			guesthouse: '게스트하우스',
			hostel: '호스텔',
			airbnb: '에어비앤비',
			traditional: '전통 숙소',
			camping: '캠핑',
			no_preference: '상관없음'
		};
		return typeMap[type] || type;
	}

	// Navigation
	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/activities`);
	}

	// Submit the updated trip
	async function handleSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;
		tripEditForm.updateStep('customRequest', customRequest);

		try {
			const updateData = tripEditForm.getData();

			// Prepare the update payload
			const payload = {
				destinationId: updateData.destination?.id,
				startDate: updateData.startDate?.toISOString(),
				endDate: updateData.endDate?.toISOString(),
				adultsCount: updateData.adultsCount,
				childrenCount: updateData.childrenCount,
				tourType: updateData.tourType,
				minBudget: updateData.minBudget,
				maxBudget: updateData.maxBudget,
				travelMethod: updateData.travelMethod,
				needsDriver: updateData.needsDriver,
				accommodationType: updateData.accommodationType,
				accommodationPreferences: updateData.accommodationPreferences,
				activities: updateData.activities,
				interests: updateData.interests,
				customRequest: customRequest
			};

			const response = await fetch(`/api/trips/${trip.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				// Clear the form store
				tripEditForm.set({
					destination: null,
					startDate: null,
					endDate: null,
					adultsCount: 1,
					childrenCount: 0,
					tourType: '',
					minBudget: null,
					maxBudget: null,
					travelMethod: '',
					needsDriver: false,
					customRequest: ''
				});

				await goto(`/my-trips/${trip.id}`);
			} else {
				const error = await response.json();
				alert(error.message || '수정 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error updating trip:', error);
			alert('서버 오류가 발생했습니다.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="px-4 py-6 pb-24">
	<div class="space-y-4">
		<!-- Review sections -->
		<div class="rounded-lg bg-white p-4">
			<h2 class="mb-4 text-lg font-semibold text-gray-900">여행 정보 확인</h2>

			<div class="space-y-3 text-sm">
				<!-- Destination -->
				<div class="flex justify-between">
					<span class="text-gray-600">목적지</span>
					<span class="font-medium text-gray-900">
						{formData.destination?.city || trip.destination?.city},
						{formData.destination?.country || trip.destination?.country}
					</span>
				</div>

				<!-- Dates -->
				<div class="flex justify-between">
					<span class="text-gray-600">여행 일정</span>
					<span class="font-medium text-gray-900">
						{formatKoreanDateRange(
							formData.startDate || trip.startDate,
							formData.endDate || trip.endDate
						)}
					</span>
				</div>

				<!-- Travelers -->
				<div class="flex justify-between">
					<span class="text-gray-600">인원</span>
					<span class="font-medium text-gray-900">
						성인 {formData.adultsCount || trip.adultsCount}명
						{#if (formData.childrenCount || trip.childrenCount) > 0}
							, 아동 {formData.childrenCount || trip.childrenCount}명
						{/if}
					</span>
				</div>

				<!-- Travel style -->
				<div class="flex justify-between">
					<span class="text-gray-600">여행 스타일</span>
					<span class="font-medium text-gray-900">
						{getTravelStyleDisplay(formData.tourType || trip.tourType)}
					</span>
				</div>

				<!-- Budget -->
				<div class="flex justify-between">
					<span class="text-gray-600">예산</span>
					<span class="font-medium text-gray-900">
						{#if formData.minBudget}
							{formData.minBudget}-{formData.maxBudget}만원
						{:else}
							예산 미정
						{/if}
					</span>
				</div>

				<!-- Transportation -->
				<div class="flex justify-between">
					<span class="text-gray-600">교통수단</span>
					<span class="font-medium text-gray-900">
						{getTravelMethodDisplay(formData.travelMethod || trip.travelMethod)}
						{#if formData.needsDriver}
							(운전기사 포함)
						{/if}
					</span>
				</div>

				<!-- Accommodation -->
				{#if formData.accommodationType}
					<div class="flex justify-between">
						<span class="text-gray-600">숙박</span>
						<span class="font-medium text-gray-900">
							{getAccommodationDisplay(formData.accommodationType)}
						</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Special requests -->
		<div class="rounded-lg bg-white p-4">
			<h3 class="mb-3 text-base font-semibold text-gray-900">특별 요청사항</h3>
			<textarea
				bind:value={customRequest}
				rows="4"
				placeholder="가이드에게 전달하고 싶은 특별한 요청사항이 있다면 적어주세요..."
				class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			></textarea>
		</div>
	</div>

	<!-- Action buttons -->
	<div class="fixed right-0 bottom-0 left-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
		<button
			onclick={handleBack}
			class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
		>
			이전
		</button>
		<button
			onclick={handleSubmit}
			disabled={isSubmitting}
			class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
		>
			{isSubmitting ? '저장 중...' : '수정 완료'}
		</button>
	</div>
</div>
