<script lang="ts">
	import { countryCodes, type CountryCode } from '$lib/data/countryCodes';
	import { ChevronDown } from 'lucide-svelte';

	interface Props {
		value: CountryCode;
		onchange?: (country: CountryCode) => void;
		disabled?: boolean;
		class?: string;
	}

	let { value = $bindable(), onchange, disabled = false, class: className = '' }: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	function handleSelect(country: CountryCode) {
		value = country;
		isOpen = false;
		onchange?.(country);
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative" bind:this={dropdownRef}>
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		{disabled}
		class="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-3 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 {className}"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="text-lg">{value.flag}</span>
		<span class="text-sm font-medium">{value.dialCode}</span>
		<ChevronDown class="h-4 w-4 text-gray-500" />
	</button>

	{#if isOpen}
		<div class="absolute z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
			<ul class="max-h-80 overflow-y-auto" role="listbox">
				{#each countryCodes as country}
					<li>
						<button
							type="button"
							onclick={() => handleSelect(country)}
							class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
							role="option"
							aria-selected={value.code === country.code}
						>
							<span class="text-lg">{country.flag}</span>
							<span class="flex-1 text-sm">{country.country}</span>
							<span class="text-sm text-gray-500">{country.dialCode}</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
