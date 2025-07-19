<script lang="ts">
	interface Props {
		onBack?: () => void;
		onNext?: () => void;
		onCancel?: () => void;
		onSubmit?: () => void;
		backLabel?: string;
		nextLabel?: string;
		cancelLabel?: string;
		submitLabel?: string;
		isSubmitting?: boolean;
		showBack?: boolean;
		hasBottomNav?: boolean;
	}

	let {
		onBack,
		onNext,
		onCancel,
		onSubmit,
		backLabel = '이전',
		nextLabel = '다음',
		cancelLabel = '취소',
		submitLabel = '완료',
		isSubmitting = false,
		showBack = true,
		hasBottomNav = true
	}: Props = $props();
</script>

<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white">
	<div class="mx-auto max-w-[430px] p-4 {hasBottomNav ? 'pb-24' : ''}">
	{#if showBack && onBack}
		<div class="flex gap-3">
			<button
				onclick={onBack}
				class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
			>
				{backLabel}
			</button>
			{#if onNext}
				<button
					onclick={onNext}
					class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
				>
					{nextLabel}
				</button>
			{/if}
		</div>
	{:else if onCancel}
		<div class="flex gap-3">
			<button
				onclick={onCancel}
				class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
			>
				{cancelLabel}
			</button>
			{#if onNext}
				<button
					onclick={onNext}
					class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
				>
					{nextLabel}
				</button>
			{/if}
		</div>
	{:else if onNext}
		<button
			onclick={onNext}
			class="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
		>
			{nextLabel}
		</button>
	{:else if onSubmit}
		<button
			onclick={onSubmit}
			disabled={isSubmitting}
			class="w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
		>
			{isSubmitting ? '처리 중...' : submitLabel}
		</button>
	{/if}
	</div>
</div>
