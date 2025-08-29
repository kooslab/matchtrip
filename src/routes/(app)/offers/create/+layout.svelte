<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { offerFormStore } from '$lib/stores/offerForm';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import logoUrl from '$lib/images/Matchtrip.svg';
	import { colors } from '$lib/constants/colors';

	let { children } = $props();

	// Define the steps in order
	const steps = [
		{ path: 'trip-info', name: '여행 정보', number: 1 },
		{ path: 'price', name: '가격 입력', number: 2 },
		{ path: 'description', name: '제안 내용', number: 3 },
		{ path: 'files', name: '파일 업로드', number: 4 },
		{ path: 'review', name: '검토', number: 5 },
		{ path: 'success', name: '완료', number: 6 }
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
	const showHeader = $derived(
		(() => {
			const pathSegments = $page.url.pathname.split('/');
			const currentPath = pathSegments[pathSegments.length - 1];
			return currentPath !== 'success';
		})()
	);

	function handleBack() {
		const current = currentStepInfo();
		const currentIndex = steps.findIndex((s) => s.path === current.path);

		if (currentIndex > 0) {
			// Go to previous step
			const prevStep = steps[currentIndex - 1];
			const tripId = $page.url.searchParams.get('tripId') || $offerFormStore.tripId;
			goto(`/offers/create/${prevStep.path}${tripId ? `?tripId=${tripId}` : ''}`);
		} else {
			// Go back to trips page
			const tripId = $page.url.searchParams.get('tripId') || $offerFormStore.tripId;
			if (tripId) {
				goto(`/trips/${tripId}`);
			} else {
				goto('/trips');
			}
		}
	}

	// Check if skip button should be shown
	const showSkip = $derived(
		(() => {
			const pathSegments = $page.url.pathname.split('/');
			const currentPath = pathSegments[pathSegments.length - 1];
			return currentPath === 'files';
		})()
	);

	function handleSkip() {
		const current = currentStepInfo();
		const currentIndex = steps.findIndex((s) => s.path === current.path);

		if (currentIndex < steps.length - 1) {
			const nextStep = steps[currentIndex + 1];
			const tripId = $page.url.searchParams.get('tripId') || $offerFormStore.tripId;
			goto(`/offers/create/${nextStep.path}${tripId ? `?tripId=${tripId}` : ''}`);
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
				<a href="/" class="flex items-center">
					<img src={logoUrl} alt="Matchtrip" class="h-5" />
				</a>
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
		</header>
	{/if}

	<!-- Content -->
	{@render children()}
</div>
