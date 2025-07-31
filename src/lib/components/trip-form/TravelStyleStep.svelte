<script lang="ts">
	import CaretDown from 'phosphor-svelte/lib/CaretDown';
	import { TRAVEL_STYLE_OPTIONS } from '$lib/constants/travel';

	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Travel style options
	const travelStyles = TRAVEL_STYLE_OPTIONS;

	// Initialize selected style - handle both string ID and object
	function getInitialStyle() {
		if (!formData.travelStyle) return null;

		// If it's already an object, use it
		if (typeof formData.travelStyle === 'object' && formData.travelStyle.id) {
			return formData.travelStyle;
		}

		// If it's a string ID, find the matching object
		if (typeof formData.travelStyle === 'string') {
			return travelStyles.find((style) => style.id === formData.travelStyle) || null;
		}

		return null;
	}

	// Local state
	let selectedStyle = $state(getInitialStyle());
	let showModal = $state(false);

	// Update selected style when formData changes
	$effect(() => {
		const newStyle = getInitialStyle();
		if (newStyle?.id !== selectedStyle?.id) {
			selectedStyle = newStyle;
		}
	});

	// Select style
	function selectStyle(style: any) {
		selectedStyle = style;
		onUpdate('travelStyle', style.id); // Save just the ID string
		showModal = false;
	}

	// Validation
	export function validate() {
		if (!selectedStyle) {
			alert('여행 스타일을 선택해주세요.');
			return false;
		}
		return true;
	}

	// Get display text
	let displayText = $derived(
		selectedStyle ? selectedStyle.name : '원하시는 여행 스타일을 알려주세요'
	);
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">여행 스타일</h1>
		<p class="mt-2 text-gray-600">어떤 분들과 함께 여행하시나요?</p>
	</div>

	<div class="px-4 pb-6">
		<label class="mb-2 block text-xs font-medium text-gray-700">여행 스타일</label>

		<!-- Style selector button -->
		<button
			onclick={() => (showModal = true)}
			class="flex w-full items-center justify-between rounded-lg bg-gray-50 px-5 py-4 transition-colors hover:bg-gray-100"
		>
			<span class={selectedStyle ? 'text-gray-900' : 'text-gray-500'}>
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
				<h3 class="text-lg font-semibold text-gray-900">여행 스타일 선택</h3>
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

			<!-- Style options -->
			<div class="max-h-[400px] overflow-y-auto">
				<div class="space-y-2">
					{#each travelStyles as style}
						<button
							onclick={() => selectStyle(style)}
							class="flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors {selectedStyle?.id ===
							style.id
								? 'bg-blue-50 text-blue-600'
								: 'hover:bg-gray-50'}"
						>
							<span class="font-medium">{style.name}</span>
							{#if selectedStyle?.id === style.id}
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
