<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';

	let { children, data } = $props();

	// Define the steps for product creation
	const steps = [
		{ path: '', label: '목적지', number: 1 }, // Root path for destination
		{ path: 'price', label: '가격', number: 2 },
		{ path: 'description', label: '상품 설명', number: 3 },
		{ path: 'duration', label: '투어 시간', number: 4 },
		{ path: 'languages', label: '사용 언어', number: 5 },
		{ path: 'attachments', label: '첨부 파일', number: 6 },
		{ path: 'review', label: '검토', number: 7 }
	];

	// Get current step from URL
	let currentPath = $derived(
		$page.url.pathname.split('/').pop() === 'create' ? '' : $page.url.pathname.split('/').pop()
	);
	let currentStep = $derived(steps.find((s) => s.path === currentPath));
	let currentStepIndex = $derived(
		currentPath === 'success' ? steps.length - 1 : currentStep ? currentStep.number - 1 : 0
	);

	// Hide header on success page
	let isSuccessPage = $derived(currentPath === 'success');

	function handleBack() {
		if (currentPath === 'success') {
			// From success page, go to profile
			goto('/profile/guide');
		} else if (currentStepIndex > 0) {
			// Go to previous step
			const prevStep = steps[currentStepIndex - 1];
			const prevPath = prevStep.path ? `/products/create/${prevStep.path}` : '/products/create';
			goto(prevPath);
		} else {
			// From first step, go back to profile
			goto('/profile/guide');
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header - Hidden on success page -->
		{#if !isSuccessPage}
			<header class="sticky top-0 z-50 border-b bg-white">
				<div class="flex items-center px-4 py-4">
					<button onclick={handleBack} class="p-1">
						<ArrowLeft class="h-6 w-6 text-blue-500" />
					</button>
					<h1 class="flex-1 text-center text-lg font-semibold">내 상품 등록</h1>
					<div class="w-8"></div>
				</div>

				<!-- Progress bar -->
				<div class="h-1 bg-gray-100">
					<div
						class="h-full bg-blue-500 transition-all duration-300"
						style="width: {((currentStepIndex + 1) / steps.length) * 100}%"
					></div>
				</div>
			</header>
		{/if}

		<!-- Content -->
		<main>
			{@render children()}
		</main>
	</div>
</div>
