<script lang="ts">
	import UserIcon from '$lib/icons/icon-user-two-mono.svg';
	
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}
	
	let { formData, onUpdate }: Props = $props();
	
	// Local state
	let adultsCount = $state(formData.adultsCount || 1);
	let childrenCount = $state(formData.childrenCount || 0);
	let babiesCount = $state(formData.babiesCount || 0);
	
	// Update parent when counts change
	$effect(() => {
		onUpdate('adultsCount', adultsCount);
		onUpdate('childrenCount', childrenCount);
		onUpdate('babiesCount', babiesCount);
	});
	
	// Total travelers
	let totalTravelers = $derived(adultsCount + childrenCount + babiesCount);
	
	// Handle count changes
	function increaseAdults() {
		if (adultsCount < 20) adultsCount++;
	}
	
	function decreaseAdults() {
		if (adultsCount > 1) adultsCount--;
	}
	
	function increaseChildren() {
		if (childrenCount < 10) childrenCount++;
	}
	
	function decreaseChildren() {
		if (childrenCount > 0) childrenCount--;
	}
	
	function increaseBabies() {
		if (babiesCount < 10) babiesCount++;
	}
	
	function decreaseBabies() {
		if (babiesCount > 0) babiesCount--;
	}
	
	// Validation
	export function validate() {
		return true; // Always valid as we have minimum 1 adult
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">여행 인원</h1>
		<p class="mt-2 text-gray-600">여행을 함께할 인원을 선택해 주세요</p>
	</div>
	
	<!-- Traveler counts -->
	<div class="px-4 space-y-4">
		<!-- Adults -->
		<div class="flex items-center justify-between p-4">
			<div>
				<p class="font-medium text-gray-900">성인</p>
				<p class="text-sm text-gray-500">만 13세 이상</p>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={decreaseAdults}
					disabled={adultsCount <= 1}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">−</span>
				</button>
				<span class="w-8 text-center font-medium text-gray-900">{adultsCount}</span>
				<button
					onclick={increaseAdults}
					disabled={adultsCount >= 20}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">+</span>
				</button>
			</div>
		</div>
		
		<!-- Children -->
		<div class="flex items-center justify-between p-4">
			<div>
				<p class="font-medium text-gray-900">아동</p>
				<p class="text-sm text-gray-500">만 2-12세</p>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={decreaseChildren}
					disabled={childrenCount <= 0}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">−</span>
				</button>
				<span class="w-8 text-center font-medium text-gray-900">{childrenCount}</span>
				<button
					onclick={increaseChildren}
					disabled={childrenCount >= 10}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">+</span>
				</button>
			</div>
		</div>
		
		<!-- Babies -->
		<div class="flex items-center justify-between p-4">
			<div>
				<p class="font-medium text-gray-900">영아</p>
				<p class="text-sm text-gray-500">만 2세 미만</p>
			</div>
			<div class="flex items-center gap-3">
				<button
					onclick={decreaseBabies}
					disabled={babiesCount <= 0}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">−</span>
				</button>
				<span class="w-8 text-center font-medium text-gray-900">{babiesCount}</span>
				<button
					onclick={increaseBabies}
					disabled={babiesCount >= 10}
					class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="text-xl leading-none">+</span>
				</button>
			</div>
		</div>
	</div>
</div>