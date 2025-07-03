<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { colors } from '$lib/constants/colors';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);
	
	// Get tripId from query params
	let tripId = $derived($page.url.searchParams.get('tripId'));
	
	// Step management
	let currentStep = $state(1);
	const totalSteps = 5;
	
	// Form data
	let offerData = $state({
		pricePerPerson: '',
		title: '',
		description: '',
		itinerary: [
			{ 
				day: 1, 
				title: '', 
				morning: '',
				afternoon: '',
				evening: '',
				night: ''
			}
		],
		additionalFiles: [] as File[]
	});
	
	// For step 3 - itinerary
	let selectedDay = $state(1);
	
	function handleBack() {
		if (currentStep > 1) {
			currentStep--;
		} else {
			goto(`/trips/${tripId}`);
		}
	}
	
	function handleNext() {
		if (currentStep < totalSteps) {
			currentStep++;
		} else {
			// This shouldn't happen as step 5 has different button
			handleSubmit();
		}
	}
	
	function handleSkip() {
		if (currentStep === 4) { // Skip file upload
			currentStep++;
		}
	}
	
	async function handleSubmit() {
		try {
			const response = await fetch('/api/offers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tripId: tripId,
					title: `${offerData.pricePerPerson}원 제안`,
					description: offerData.description,
					price: parseInt(offerData.pricePerPerson) * (trip.adultsCount + trip.childrenCount),
					itinerary: JSON.stringify(offerData.itinerary),
					includes: [],
					excludes: []
				})
			});

			if (response.ok) {
				// Show success screen
				currentStep = 5;
			} else {
				const error = await response.json();
				alert(error.message || '제안서 작성에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error submitting offer:', error);
			alert('제안서 작성 중 오류가 발생했습니다.');
		}
	}
	
	function goToHome() {
		goto('/');
	}
	
	function canProceed() {
		switch(currentStep) {
			case 1: return offerData.pricePerPerson.trim() !== '';
			case 2: return offerData.description.trim() !== '';
			case 3: return true; // Itinerary is optional
			case 4: return true; // Files are optional
			default: return false;
		}
	}
	
	// Add a new day to itinerary
	function addDay() {
		offerData.itinerary = [...offerData.itinerary, {
			day: offerData.itinerary.length + 1,
			title: '',
			morning: '',
			afternoon: '',
			evening: '',
			night: ''
		}];
	}
	
	// Remove a day from itinerary
	function removeDay(index: number) {
		if (offerData.itinerary.length > 1) {
			offerData.itinerary = offerData.itinerary.filter((_, i) => i !== index);
			// Renumber days
			offerData.itinerary.forEach((day, i) => {
				day.day = i + 1;
			});
			if (selectedDay > offerData.itinerary.length) {
				selectedDay = offerData.itinerary.length;
			}
		}
	}
	
	// Handle file upload
	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			offerData.additionalFiles = [...offerData.additionalFiles, ...Array.from(input.files)];
		}
	}
	
	function removeFile(index: number) {
		offerData.additionalFiles = offerData.additionalFiles.filter((_, i) => i !== index);
	}
</script>

{#if currentStep < 5}
	<div class="min-h-screen bg-gray-50">
		<!-- Header -->
		<header class="sticky top-0 z-10 bg-white shadow-sm">
			<div class="flex h-14 items-center justify-between px-4">
				<button onclick={handleBack} class="p-2 -ml-2">
					<img src={arrowLeftUrl} alt="Back" class="h-6 w-6" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">나의 제안</h1>
				{#if currentStep === 3 || currentStep === 4}
					<button 
						onclick={currentStep === 4 ? handleSkip : handleNext}
						class="text-base font-medium"
						style="color: {colors.primary}"
					>
						건너뛰기
					</button>
				{:else}
					<div class="w-6"></div>
				{/if}
			</div>
		</header>

		<!-- Content -->
		<div class="flex-1 px-4 py-6 pb-24">
			{#if currentStep === 1}
				<!-- Step 1: Title -->
				<div class="space-y-6">
					<div>
						<h2 class="text-base text-gray-600">1인당 제안 금액을 입력해 주세요</h2>
					</div>
					
					<div class="space-y-3">
						<label class="block text-sm font-medium text-gray-700">
							1인당 가격
						</label>
						<input
							type="number"
							bind:value={offerData.pricePerPerson}
							placeholder="1인당 금액들을 입력해 주세요"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-1"
							style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
							onfocus={(e) => e.target.style.borderColor = colors.primary}
							onblur={(e) => e.target.style.borderColor = ''}
						/>
					</div>
				</div>
			{:else if currentStep === 2}
				<!-- Step 2: Price and Description -->
				<div class="space-y-6">
					<div>
						<h2 class="text-base text-gray-600">제안 내용을 편하게 작성해 주세요</h2>
					</div>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								제안 내용
							</label>
							<textarea
								bind:value={offerData.description}
								placeholder="제안 내용을 작성해주세요"
								rows="6"
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-1"
								style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
								onfocus={(e) => e.target.style.borderColor = colors.primary}
								onblur={(e) => e.target.style.borderColor = ''}
							></textarea>
							<p class="mt-2 text-xs text-gray-500">
								여행 일정을 구체적으로 작성해주세요.<br/>
								시간, 장소, 활동 등을 포함하면 더 좋습니다.
							</p>
						</div>
					</div>
				</div>
			{:else if currentStep === 3}
				<!-- Step 3: Itinerary -->
				<div class="space-y-6">
					<div>
						<h2 class="text-base text-gray-600">시간별 여행일정을 입력해 주세요</h2>
					</div>
					
					<!-- Day tabs -->
					<div class="flex items-center gap-2">
						{#each offerData.itinerary as day, index}
							<button
								onclick={() => selectedDay = day.day}
								class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
									{selectedDay === day.day 
										? 'text-white' 
										: 'bg-gray-100 text-gray-700'}"
								style={selectedDay === day.day ? `background-color: ${colors.primary}` : ''}
							>
								여행 일정 {day.day}
							</button>
						{/each}
						<button
							onclick={addDay}
							class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
						>
							<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
						</button>
						{#if offerData.itinerary.length > 1}
							<button
								onclick={() => removeDay(selectedDay - 1)}
								class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
							>
								<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
					
					<!-- Day content -->
					{#each offerData.itinerary as day}
						{#if day.day === selectedDay}
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										제목
									</label>
									<input
										type="text"
										bind:value={day.title}
										placeholder="일정을 대표하는 사진을 업로드해 주세요"
										class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1"
										style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
										onfocus={(e) => e.target.style.borderColor = colors.primary}
										onblur={(e) => e.target.style.borderColor = ''}
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										일정 시간
									</label>
									<input
										type="text"
										bind:value={day.morning}
										placeholder="일정 시간을 입력해 주세요"
										class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1"
										style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
										onfocus={(e) => e.target.style.borderColor = colors.primary}
										onblur={(e) => e.target.style.borderColor = ''}
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										일정 제목
									</label>
									<input
										type="text"
										bind:value={day.afternoon}
										placeholder="일정 제목을 입력해 주세요"
										class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1"
										style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
										onfocus={(e) => e.target.style.borderColor = colors.primary}
										onblur={(e) => e.target.style.borderColor = ''}
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										일정 내용
									</label>
									<input
										type="text"
										bind:value={day.evening}
										placeholder="일정 내용을 입력해 주세요"
										class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-1"
										style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
										onfocus={(e) => e.target.style.borderColor = colors.primary}
										onblur={(e) => e.target.style.borderColor = ''}
									/>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{:else if currentStep === 4}
				<!-- Step 4: File Upload -->
				<div class="space-y-6">
					<div>
						<h2 class="text-base text-gray-600">여행을 안내할 파일을 업로드해 주세요</h2>
					</div>
					
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								첨부 파일
							</label>
							
							<!-- File upload area -->
							<label class="block">
								<input
									type="file"
									multiple
									accept=".pdf,.pptx,.hwp,.docx"
									onchange={handleFileUpload}
									class="hidden"
								/>
								<div class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
									<svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									<p class="text-sm text-gray-600 font-medium">파일을 클릭하여 찾아보세요.</p>
									<p class="text-xs text-gray-500 mt-1">지원되는 파일 형식: pdf, pptx, hwp, docx</p>
								</div>
							</label>
							
							<!-- Uploaded files list -->
							{#if offerData.additionalFiles.length > 0}
								<div class="mt-4 space-y-2">
									{#each offerData.additionalFiles as file, index}
										<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div class="flex items-center gap-3">
												<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
												<div>
													<p class="text-sm font-medium text-gray-900">{file.name}</p>
													<p class="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
												</div>
											</div>
											<button
												onclick={() => removeFile(index)}
												class="text-gray-400 hover:text-gray-600"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Bottom Button -->
		<div class="fixed right-0 bottom-0 left-0 bg-white px-4 py-4">
			{#if currentStep === 4}
				<button
					onclick={handleSubmit}
					class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all"
					style="background-color: {colors.primary}"
				>
					최종 제안
				</button>
			{:else}
				<button
					onclick={handleNext}
					disabled={!canProceed()}
					class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
						{canProceed() ? '' : 'opacity-50 cursor-not-allowed'}"
					style="background-color: {canProceed() ? colors.primary : '#CBD5E1'}"
				>
					다음
				</button>
			{/if}
		</div>
	</div>
{:else}
	<!-- Step 5: Success -->
	<div class="min-h-screen bg-white flex flex-col items-center justify-center px-4">
		<div class="text-center max-w-sm">
			<!-- Airplane icon -->
			<div class="mb-8">
				<svg class="w-32 h-32 mx-auto text-gray-300" viewBox="0 0 128 128" fill="currentColor">
					<path d="M64 16c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm21.86 36.48l-8.16 8.16 1.44 14.88c.08.82-.2 1.64-.76 2.24-.56.6-1.36.94-2.18.94-.14 0-.28-.01-.42-.03l-13.38-2.88-13.38 2.88c-.14.03-.28.03-.42.03-.82 0-1.62-.34-2.18-.94-.56-.6-.84-1.42-.76-2.24l1.44-14.88-8.16-8.16c-.66-.66-.9-1.64-.62-2.54.28-.9 1.02-1.56 1.94-1.72l14.82-2.62 6.64-13.44c.82-1.66 3.54-1.66 4.36 0l6.64 13.44 14.82 2.62c.92.16 1.66.82 1.94 1.72.28.9.04 1.88-.62 2.54z"/>
				</svg>
			</div>
			
			<h1 class="text-2xl font-bold text-gray-900 mb-2">
				여행제안이 완료되었습니다.
			</h1>
			
			<p class="text-base text-gray-600 mb-8">
				Match Your Trip, Make It Yours
			</p>
			
			<!-- Success indicator -->
			<div class="flex items-center justify-center gap-2 mb-8">
				<div class="w-8 h-8 rounded-full flex items-center justify-center" style="background-color: {colors.primary}">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<p class="text-sm text-gray-600">여행 제안이 수락되면 알림으로 안내해드려요</p>
			</div>
			
			<button
				onclick={goToHome}
				class="text-base font-medium transition-colors"
				style="color: {colors.secondary}"
			>
				확인
			</button>
		</div>
		
		<!-- Bottom button -->
		<div class="fixed right-0 bottom-0 left-0 px-4 py-4">
			<button
				onclick={goToHome}
				class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all"
				style="background-color: {colors.primary}"
			>
				홈이가기
			</button>
		</div>
	</div>
{/if}