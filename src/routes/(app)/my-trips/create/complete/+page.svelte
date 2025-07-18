<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import completeImage from '$lib/images/complete.png';

	let isSubmitting = $state(false);
	let isSubmitted = $state(false);
	let isSubmittingStarted = $state(false);

	// Handle submission
	async function handleSubmit() {
		// Prevent multiple submissions
		if (isSubmittingStarted || isSubmitting || isSubmitted) {
			console.log('Submission already in progress or completed, skipping...');
			return;
		}

		isSubmittingStarted = true;
		isSubmitting = true;

		try {
			const formData = tripCreateForm.getData();

			// Debug log
			console.log('Form data before submission:', formData);
			console.log('Start date type:', typeof formData.startDate, formData.startDate);
			console.log('End date type:', typeof formData.endDate, formData.endDate);

			// Prepare the data for API
			// Handle different date formats
			let startDate = formData.startDate;
			let endDate = formData.endDate;

			// Convert calendar objects to ISO strings if needed
			if (
				startDate &&
				typeof startDate === 'object' &&
				'year' in startDate &&
				'month' in startDate &&
				'day' in startDate
			) {
				const jsDate = new Date(startDate.year, startDate.month - 1, startDate.day);
				startDate = jsDate.toISOString();
			} else if (startDate instanceof Date) {
				startDate = startDate.toISOString();
			}

			if (
				endDate &&
				typeof endDate === 'object' &&
				'year' in endDate &&
				'month' in endDate &&
				'day' in endDate
			) {
				const jsDate = new Date(endDate.year, endDate.month - 1, endDate.day);
				endDate = jsDate.toISOString();
			} else if (endDate instanceof Date) {
				endDate = endDate.toISOString();
			}

			// Validate dates
			if (!startDate || !endDate) {
				throw new Error('여행 날짜를 선택해주세요.');
			}

			const tripPayload = {
				destinationId: formData.destinationId,
				startDate,
				endDate,
				adultsCount: formData.adultsCount,
				childrenCount: formData.childrenCount,
				babiesCount: formData.babiesCount,
				budget: formData.budget,
				travelStyle: formData.travelStyle,
				activities: formData.activities,
				additionalRequest: formData.additionalRequest
			};

			// Submit to API
			const response = await fetch('/api/trips', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tripPayload)
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || '여행 등록에 실패했습니다.');
			}

			// Handle file upload if present
			if (formData.file) {
				// TODO: Implement file upload
				console.log('File upload pending:', formData.file.name);
			}

			// Clear form data
			tripCreateForm.reset();

			isSubmitted = true;
		} catch (error) {
			console.error('Error submitting trip:', error);
			alert(error.message || '여행 등록에 실패했습니다. 다시 시도해주세요.');
		} finally {
			isSubmitting = false;
		}
	}

	// Auto-submit when page loads
	$effect(() => {
		// Only submit once when component mounts
		if (!isSubmittingStarted && !isSubmitting && !isSubmitted) {
			handleSubmit();
		}
	});

	// Navigate to home
	function goToHome() {
		goto('/my-trips');
	}
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Content -->
	<div class="flex flex-1 flex-col items-center justify-center px-4">
		<!-- Complete image -->
		<div class="mb-8">
			<img src={completeImage} alt="여행 등록 완료" class="h-48 w-48 object-contain" />
		</div>

		<!-- Success message -->
		<h1 class="mb-3 text-2xl font-bold text-gray-900">여행 등록이 완료되었습니다!</h1>
		<p class="text-center text-gray-600">곧 가이드님들의 제안을 받아보실 수 있어요.</p>

		<!-- Loading indicator -->
		{#if isSubmitting}
			<div class="mt-8 flex items-center gap-2 text-gray-500">
				<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span class="text-sm">처리 중...</span>
			</div>
		{/if}
	</div>

	<!-- Bottom button -->
	<div class="p-4 pb-24">
		<button
			onclick={goToHome}
			disabled={!isSubmitted}
			class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			홈으로 이동
		</button>
	</div>
</div>
