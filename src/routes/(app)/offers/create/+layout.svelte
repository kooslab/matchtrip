<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { offerFormStore } from '$lib/stores/offerForm';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import { colors } from '$lib/constants/colors';

	let { children } = $props();

	// Define the steps in order
	const steps = [
		{ path: 'trip-info', name: '여행 정보', number: 1 },
		{ path: 'price', name: '가격 입력', number: 2 },
		{ path: 'description', name: '제안 내용', number: 3 },
		{ path: 'itinerary', name: '일정', number: 4 },
		{ path: 'files', name: '파일 업로드', number: 5 },
		{ path: 'review', name: '검토', number: 6 },
		{ path: 'success', name: '완료', number: 7 }
	];

	// Get current step from URL
	$effect(() => {
		const pathSegments = $page.url.pathname.split('/');
		const currentPath = pathSegments[pathSegments.length - 1];
		const currentStep = steps.find((s) => s.path === currentPath);

		// If we're on the success page, clear the form data
		if (currentPath === 'success') {
			// Don't clear immediately to allow success page to read the data
			setTimeout(() => {
				offerFormStore.reset();
			}, 100);
		}
	});

	// Derive current step info
	const currentStepInfo = $derived(() => {
		const pathSegments = $page.url.pathname.split('/');
		const currentPath = pathSegments[pathSegments.length - 1];
		return steps.find((s) => s.path === currentPath) || steps[0];
	});

	// Check if we should show header (not on success page)
	const showHeader = $derived(() => {
		const pathSegments = $page.url.pathname.split('/');
		const currentPath = pathSegments[pathSegments.length - 1];
		return currentPath !== 'success';
	});

	function handleBack() {
		const current = currentStepInfo();
		const currentIndex = steps.findIndex((s) => s.path === current.path);

		if (currentIndex > 0) {
			// Go to previous step
			const prevStep = steps[currentIndex - 1];
			goto(`/offers/create/${prevStep.path}`);
		} else {
			// Go back to trips page
			const tripId = $offerFormStore.tripId;
			if (tripId) {
				goto(`/trips/${tripId}`);
			} else {
				goto('/trips');
			}
		}
	}

	// Check if skip button should be shown
	const showSkip = $derived(() => {
		const current = currentStepInfo();
		return current.path === 'itinerary' || current.path === 'files';
	});

	function handleSkip() {
		const current = currentStepInfo();
		const currentIndex = steps.findIndex((s) => s.path === current.path);

		if (currentIndex < steps.length - 1) {
			const nextStep = steps[currentIndex + 1];
			goto(`/offers/create/${nextStep.path}`);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	{#if showHeader}
		<!-- Header -->
		<header class="sticky top-0 z-10 bg-white shadow-sm">
			<div class="flex h-14 items-center justify-between px-4">
				<button onclick={handleBack} class="-ml-2 p-2">
					<img src={arrowLeftUrl} alt="뒤로" class="h-6 w-6" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">나의 제안</h1>
				{#if showSkip}
					<button
						onclick={handleSkip}
						class="text-base font-medium"
						style="color: {colors.primary}"
					>
						건너뛰기
					</button>
				{:else}
					<div class="w-6"></div>
				{/if}
			</div>

			<!-- Progress indicator -->
			<div class="bg-gray-100 px-4 py-2">
				<div class="flex items-center justify-between">
					{#each steps.slice(0, -1) as step}
						{@const isCurrent = currentStepInfo().number === step.number}
						{@const isPast = currentStepInfo().number > step.number}
						<div class="flex items-center">
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors
									{isCurrent ? 'text-white' : isPast ? 'bg-gray-300 text-white' : 'bg-gray-200 text-gray-500'}"
								style={isCurrent ? `background-color: ${colors.primary}` : ''}
							>
								{step.number}
							</div>
							{#if step.number < steps.length - 1}
								<div class="mx-1 h-0.5 w-8 bg-gray-200"></div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</header>
	{/if}

	<!-- Content -->
	{@render children()}
</div>
