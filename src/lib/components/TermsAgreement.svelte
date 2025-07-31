<script lang="ts" context="module">
	// Type for the component's public API
	export type TermsAgreementType = {
		validateTerms: () => boolean;
		getAgreementState: () => {
			termsAgreed: boolean;
			privacyAgreed: boolean;
			marketingAgreed: boolean;
		};
	};
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Initialize state for checkboxes
	let allChecked = $state(false);
	let termsChecked = $state(false);
	let privacyChecked = $state(false);
	let marketingChecked = $state(false);

	// Props from parent
	const props = $props<{
		isLoading: boolean;
	}>();

	// Create event dispatcher
	const dispatch = createEventDispatcher();

	// Computed values
	let requiredChecked = $derived(termsChecked && privacyChecked);

	// Toggle all checkboxes
	function toggleAll() {
		allChecked = !allChecked;
		termsChecked = allChecked;
		privacyChecked = allChecked;
		marketingChecked = allChecked;
		dispatch('change');
	}

	// Update "all" checkbox when individual checkboxes change
	$effect(() => {
		if (termsChecked && privacyChecked && marketingChecked) {
			allChecked = true;
		} else {
			allChecked = false;
		}
		dispatch('change');
	});

	// Update checkbox handlers
	function handleTermsChange() {
		dispatch('change');
	}

	function handlePrivacyChange() {
		dispatch('change');
	}

	function handleMarketingChange() {
		dispatch('change');
	}

	// Validate terms - exposed to parent components
	export function validateTerms(): boolean {
		return termsChecked && privacyChecked;
	}

	// Get agreement state - exposed to parent components
	export function getAgreementState() {
		return {
			termsAgreed: termsChecked,
			privacyAgreed: privacyChecked,
			marketingAgreed: marketingChecked
		};
	}
</script>

<div class="mt-4 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
	<div class="flex items-center">
		<input
			type="checkbox"
			id="check-all"
			class="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-200"
			bind:checked={allChecked}
			onclick={toggleAll}
			disabled={props.isLoading}
		/>
		<label for="check-all" class="ml-2 font-medium text-gray-700">이용약관 전체동의</label>
	</div>

	<hr class="border-gray-200" />

	<div class="flex items-center">
		<input
			type="checkbox"
			id="check-terms"
			class="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-200"
			bind:checked={termsChecked}
			onchange={handleTermsChange}
			disabled={props.isLoading}
			required
		/>
		<label for="check-terms" class="ml-2 text-gray-700">
			이용약관 동의 <span class="text-red-500">(필수)</span>
		</label>
		<a href="/terms/service" target="_blank" class="ml-auto text-sm text-blue-500 hover:underline"
			>내용보기</a
		>
	</div>

	<div class="flex items-center">
		<input
			type="checkbox"
			id="check-privacy"
			class="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-200"
			bind:checked={privacyChecked}
			onchange={handlePrivacyChange}
			disabled={props.isLoading}
			required
		/>
		<label for="check-privacy" class="ml-2 text-gray-700">
			개인정보 수집 및 이용동의 <span class="text-red-500">(필수)</span>
		</label>
		<a href="/terms/privacy" target="_blank" class="ml-auto text-sm text-blue-500 hover:underline"
			>내용보기</a
		>
	</div>

	<div class="flex items-center">
		<input
			type="checkbox"
			id="check-marketing"
			class="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-200"
			bind:checked={marketingChecked}
			onchange={handleMarketingChange}
			disabled={props.isLoading}
		/>
		<label for="check-marketing" class="ml-2 text-gray-700">
			마케팅 동의 <span class="text-gray-400">(선택)</span>
		</label>
		<a href="/terms/marketing" target="_blank" class="ml-auto text-sm text-blue-500 hover:underline"
			>내용보기</a
		>
	</div>

	{#if !requiredChecked}
		<p class="mt-1 text-sm text-red-500">필수 약관에 동의해주세요.</p>
	{/if}
</div>
