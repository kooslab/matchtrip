<script lang="ts">
	import CaretDown from 'phosphor-svelte/lib/CaretDown';

	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Budget options
	const budgetOptions = [
		{ id: 'budget', name: '10~50만원', min: 100000, max: 500000 },
		{ id: 'standard', name: '50만원~100만원', min: 500000, max: 1000000 },
		{ id: 'comfort', name: '100만원~200만원', min: 1000000, max: 2000000 },
		{ id: 'premium', name: '200만원 이상', min: 2000000, max: null }
	];

	// Initialize selected budget from minBudget/maxBudget
	function getInitialBudget() {
		// If formData.budget is already set as an object, use it
		if (formData.budget && typeof formData.budget === 'object') {
			return formData.budget;
		}

		// Otherwise, try to match based on minBudget/maxBudget
		if (formData.minBudget || formData.maxBudget) {
			const min = formData.minBudget ? formData.minBudget * 10000 : 0; // Convert from 만원 to won
			const max = formData.maxBudget ? formData.maxBudget * 10000 : null;

			// Find matching budget option
			return (
				budgetOptions.find((option) => {
					if (option.max === null) {
						// Premium option (200만원 이상)
						return min >= option.min;
					}
					// Check if the stored values match or are within the option range
					return (
						(min >= option.min && min <= option.max) ||
						(max && max >= option.min && max <= option.max)
					);
				}) || null
			);
		}

		return null;
	}

	// Local state
	let selectedBudget = $state(getInitialBudget());
	let showModal = $state(false);

	// Update selected budget when formData changes
	$effect(() => {
		const newBudget = getInitialBudget();
		if (newBudget?.id !== selectedBudget?.id) {
			selectedBudget = newBudget;
		}
	});

	// Select budget
	function selectBudget(budget: any) {
		selectedBudget = budget;
		onUpdate('budget', budget);
		// Also update minBudget and maxBudget in 만원 units
		onUpdate('minBudget', budget.min / 10000);
		onUpdate('maxBudget', budget.max ? budget.max / 10000 : null);
		showModal = false;
	}

	// Validation
	export function validate() {
		if (!selectedBudget) {
			alert('예산 범위를 선택해주세요.');
			return false;
		}
		return true;
	}

	// Get display text
	let displayText = $derived(selectedBudget ? selectedBudget.name : '예산 범위를 선택해주세요');
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">예산 범위</h1>
		<p class="mt-2 text-gray-600">여행 예산 범위를 선택해주세요.</p>
	</div>

	<div class="px-4 pb-6">
		<label class="mb-2 block text-xs font-medium text-gray-700">예산 범위</label>

		<!-- Budget selector button -->
		<button
			onclick={() => (showModal = true)}
			class="flex w-full items-center justify-between rounded-lg bg-gray-50 px-5 py-4 transition-colors hover:bg-gray-100"
		>
			<span class={selectedBudget ? 'text-gray-900' : 'text-gray-500'}>
				{displayText}
			</span>
			<CaretDown class="h-4 w-4 text-gray-400" />
		</button>
	</div>
</div>

<!-- Selection modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" onclick={() => (showModal = false)}></div>

		<!-- Modal content -->
		<div class="animate-slide-up relative w-full max-w-md rounded-t-2xl bg-white p-4">
			<!-- Modal header -->
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">예산 범위 선택</h3>
				<button onclick={() => (showModal = false)} class="text-gray-400 hover:text-gray-600">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Budget options -->
			<div class="max-h-[400px] overflow-y-auto">
				<div class="space-y-2">
					{#each budgetOptions as budget}
						<button
							onclick={() => selectBudget(budget)}
							class="flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors {selectedBudget?.id ===
							budget.id
								? 'bg-blue-50 text-blue-600'
								: 'hover:bg-gray-50'}"
						>
							<span class="font-medium">{budget.name}</span>
							{#if selectedBudget?.id === budget.id}
								<svg
									class="h-5 w-5 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
