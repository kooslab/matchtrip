<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import BackButton from '$lib/components/BackButton.svelte';
	
	let { children } = $props();
	
	// Define the steps
	const steps = [
		{ path: 'destination', label: '목적지', number: 1 },
		{ path: 'dates', label: '여행 날짜', number: 2 },
		{ path: 'travelers', label: '여행자', number: 3 },
		{ path: 'travel-style', label: '여행 스타일', number: 4 },
		{ path: 'budget', label: '예산', number: 5 },
		{ path: 'transportation', label: '교통수단', number: 6 },
		{ path: 'accommodation', label: '숙박', number: 7 },
		{ path: 'activities', label: '활동', number: 8 },
		{ path: 'review', label: '검토', number: 9 }
	];
	
	// Get current step from URL
	let currentPath = $derived($page.url.pathname.split('/').pop());
	let currentStep = $derived(steps.find(s => s.path === currentPath));
	let currentStepIndex = $derived(currentStep ? currentStep.number - 1 : 0);
	
	function handleBack() {
		if (currentStepIndex > 0) {
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