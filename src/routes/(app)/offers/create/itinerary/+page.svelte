<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import DatePickerModal from '$lib/components/DatePickerModal.svelte';
	import cameraUrl from '$lib/icons/icon-camera-mono.svg';
	import plusUrl from '$lib/icons/icon-plus-mono.svg';
	import closeUrl from '$lib/icons/icon-x-mono.svg';

	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Get itinerary from store
	let itinerary = $state($offerFormStore.itinerary);
	let selectedDay = $state(0); // Index of selected day

	// Date picker modal state
	let showDatePicker = $state(false);
	let selectedTimeSlotIndex = $state<number | null>(null);

	// Update store when itinerary changes
	$effect(() => {
		// Only update if there's a change to avoid infinite loop
		const currentItinerary = $offerFormStore.itinerary;
		if (JSON.stringify(currentItinerary) !== JSON.stringify(itinerary)) {
			itinerary.forEach((day, index) => {
				offerFormStore.updateItineraryDay(index, day);
			});
		}
	});

	function handleNext() {
		goto(`/offers/create/files?tripId=${tripId}`);
	}

	function addDay() {
		offerFormStore.addItineraryDay();
		itinerary = $offerFormStore.itinerary;
		selectedDay = itinerary.length - 1;
	}

	function removeDay() {
		if (itinerary.length > 1) {
			offerFormStore.removeItineraryDay(selectedDay);
			itinerary = $offerFormStore.itinerary;
			if (selectedDay >= itinerary.length) {
				selectedDay = itinerary.length - 1;
			}
		}
	}

	function addTimeSlot() {
		const newTimeSlot = {
			time: '',
			title: '',
			description: ''
		};
		itinerary[selectedDay].timeSlots = [...itinerary[selectedDay].timeSlots, newTimeSlot];
	}

	function removeTimeSlot(index: number) {
		itinerary[selectedDay].timeSlots = itinerary[selectedDay].timeSlots.filter(
			(_, i) => i !== index
		);
	}

	function openDatePicker(slotIndex: number) {
		selectedTimeSlotIndex = slotIndex;
		showDatePicker = true;
	}

	function handleDateSelect(date: Date) {
		if (selectedTimeSlotIndex !== null) {
			// Format time as HH:mm
			const hours = date.getHours().toString().padStart(2, '0');
			const minutes = date.getMinutes().toString().padStart(2, '0');
			itinerary[selectedDay].timeSlots[selectedTimeSlotIndex].time = `${hours}:${minutes}`;
		}
		showDatePicker = false;
		selectedTimeSlotIndex = null;
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			// In a real app, you would upload this to a server
			// For now, we'll create a local URL
			const url = URL.createObjectURL(file);
			itinerary[selectedDay].imageUrl = url;
		}
	}
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">시간별 여행일정을 입력해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				구체적인 일정을 작성하면 여행자의 선택 확률이 높아집니다.
			</p>
		</div>

		<!-- Day Tabs -->
		<div class="flex items-center gap-2 overflow-x-auto pb-2">
			{#each itinerary as day, index}
				<button
					onclick={() => (selectedDay = index)}
					class="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors
						{selectedDay === index ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					style={selectedDay === index ? `background-color: ${colors.primary}` : ''}
				>
					Day {day.day}
				</button>
			{/each}
			<button
				onclick={addDay}
				class="flex-shrink-0 rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200"
				title="일정 추가"
			>
				<img src={plusUrl} alt="추가" class="h-5 w-5" />
			</button>
			{#if itinerary.length > 1}
				<button
					onclick={removeDay}
					class="flex-shrink-0 rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200"
					title="일정 삭제"
				>
					<img src={closeUrl} alt="삭제" class="h-5 w-5" />
				</button>
			{/if}
		</div>

		<!-- Day Content -->
		{#each itinerary as day, dayIndex}
			{#if dayIndex === selectedDay}
				<div class="space-y-4">
					<!-- Image Upload -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700"> 대표 사진 </label>
						<label class="block cursor-pointer">
							<input type="file" accept="image/*" onchange={handleImageUpload} class="hidden" />
							{#if day.imageUrl}
								<div class="relative overflow-hidden rounded-lg">
									<img src={day.imageUrl} alt="일정 대표 이미지" class="h-48 w-full object-cover" />
									<div
										class="bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity hover:opacity-100"
									>
										<p class="text-sm font-medium text-white">사진 변경</p>
									</div>
								</div>
							{:else}
								<div
									class="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
								>
									<div class="text-center">
										<img src={cameraUrl} alt="카메라" class="mx-auto mb-2 h-8 w-8 text-gray-400" />
										<p class="text-sm font-medium text-gray-600">
											일정을 대표하는 사진을 업로드해 주세요
										</p>
									</div>
								</div>
							{/if}
						</label>
					</div>

					<!-- Time Slots -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="text-sm font-medium text-gray-700"> 시간별 일정 </label>
							<button
								onclick={addTimeSlot}
								class="flex items-center gap-1 text-sm font-medium transition-colors"
								style="color: {colors.primary}"
							>
								<img
									src={plusUrl}
									alt="추가"
									class="h-4 w-4"
									style="filter: brightness(0) saturate(100%) invert(44%) sepia(93%) saturate(1494%) hue-rotate(183deg) brightness(97%) contrast(97%);"
								/>
								일정 추가
							</button>
						</div>

						{#if day.timeSlots.length === 0}
							<div class="rounded-lg border border-dashed border-gray-300 p-8 text-center">
								<p class="text-sm text-gray-500">
									아직 추가된 일정이 없습니다.<br />
									상단의 "일정 추가" 버튼을 눌러 시작하세요.
								</p>
							</div>
						{/if}

						{#each day.timeSlots as slot, slotIndex}
							<div class="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
								<div class="flex items-start justify-between">
									<div class="flex-1 space-y-3">
										<!-- Time -->
										<div>
											<label class="mb-1 block text-xs font-medium text-gray-600"> 시간 </label>
											<button
												onclick={() => openDatePicker(slotIndex)}
												class="focus:border-opacity-100 w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm transition-colors hover:border-gray-400 focus:ring-1 focus:outline-none"
												style="--tw-ring-color: {colors.primary}"
											>
												{slot.time || '시간을 선택해주세요'}
											</button>
										</div>

										<!-- Title -->
										<div>
											<label class="mb-1 block text-xs font-medium text-gray-600">
												일정 제목
											</label>
											<input
												type="text"
												bind:value={slot.title}
												placeholder="예: 남산타워 방문"
												class="focus:border-opacity-100 w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:ring-1 focus:outline-none"
												style="--tw-ring-color: {colors.primary}"
												onfocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
												onblur={(e) => (e.currentTarget.style.borderColor = '')}
											/>
										</div>

										<!-- Description -->
										<div>
											<label class="mb-1 block text-xs font-medium text-gray-600">
												일정 내용
											</label>
											<textarea
												bind:value={slot.description}
												placeholder="구체적인 활동 내용을 입력해주세요"
												rows="2"
												class="focus:border-opacity-100 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:ring-1 focus:outline-none"
												style="--tw-ring-color: {colors.primary}"
												onfocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
												onblur={(e) => (e.currentTarget.style.borderColor = '')}
											></textarea>
										</div>
									</div>

									<!-- Remove button -->
									<button
										onclick={() => removeTimeSlot(slotIndex)}
										class="ml-2 flex-shrink-0 p-1 text-gray-400 transition-colors hover:text-gray-600"
									>
										<img src={closeUrl} alt="삭제" class="h-5 w-5" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<button
		onclick={handleNext}
		class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
		style="background-color: {colors.primary}"
	>
		다음
	</button>
</div>

<!-- Date Picker Modal -->
{#if showDatePicker}
	<DatePickerModal
		onClose={() => {
			showDatePicker = false;
			selectedTimeSlotIndex = null;
		}}
		onSelect={handleDateSelect}
		mode="time"
		title="시간 선택"
	/>
{/if}
