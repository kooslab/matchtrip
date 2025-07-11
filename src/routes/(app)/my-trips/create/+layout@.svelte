<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import BackButton from '$lib/components/BackButton.svelte';
	
	let { children } = $props();
	
	// Define the steps - matching actual implemented routes
	const steps = [
		{ path: 'destination', label: '목적지', number: 1 },
		{ path: 'dates', label: '여행 날짜', number: 2 },
		{ path: 'travelers', label: '여행자', number: 3 },
		{ path: 'travel-style', label: '여행 스타일', number: 4 },
		{ path: 'budget', label: '예산', number: 5 },
		{ path: 'activity', label: '활동', number: 6 },
		{ path: 'additional-request', label: '추가 요청', number: 7 },
		{ path: 'files', label: '파일 첨부', number: 8 }
	];
	
	// Get current step from URL
	let currentPath = $derived($page.url.pathname.split('/').pop());
	let currentStep = $derived(steps.find(s => s.path === currentPath));
	// For 'complete' page, show full progress
	let currentStepIndex = $derived(
		currentPath === 'complete' 
			? steps.length - 1 
			: currentStep 
				? currentStep.number - 1 
				: 0
	);
	
	function handleBack() {
		// Special handling for complete page
		if (currentPath === 'complete') {
			// Go back to the last step (files)
			goto(`/my-trips/create/${steps[steps.length - 1].path}`);
		} else if (currentStepIndex > 0) {
			// Go to previous step
			const prevStep = steps[currentStepIndex - 1];
			goto(`/my-trips/create/${prevStep.path}`);
		} else {
			// Go back to my trips
			goto('/my-trips');
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-14 items-center px-4">
			<BackButton onclick={handleBack} class="mr-4" />
		</div>
		
		<!-- Progress bar -->
		<div class="h-1 bg-gray-100">
			<div 
				class="h-full bg-blue-500 transition-all duration-300"
				style="width: {((currentStepIndex + 1) / steps.length) * 100}%"
			></div>
		</div>
	</header>
	
	<!-- Content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>