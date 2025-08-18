<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft } from 'lucide-svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';

	const { data } = $props();

	let isSubmitting = $state(false);
	let restrictions = $state<any>(null);

	// Check restrictions on load
	$effect(async () => {
		try {
			const response = await fetch(`/api/products/${data.product.id}/restrictions`);
			if (response.ok) {
				restrictions = await response.json();
			}
		} catch (error) {
			console.error('Error checking restrictions:', error);
		}
	});

	async function handleSubmit(formData: any) {
		isSubmitting = true;

		try {
			const response = await fetch(`/api/products/${data.product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Update failed');
			}

			// Success - redirect to product list
			await goto('/profile/guide/products');
		} catch (error) {
			console.error('Error updating product:', error);
			window.alert(error.message || '상품 수정에 실패했습니다');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b bg-white">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/profile/guide/products')} class="p-1">
					<ChevronLeft class="h-6 w-6" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">상품 수정</h1>
				<div class="w-8"></div>
				<!-- Spacer for centering -->
			</div>
		</header>

		<!-- Restriction Notice -->
		{#if restrictions && !restrictions.canEdit}
			<div class="border-l-4 border-yellow-400 bg-yellow-50 p-4">
				<div class="flex">
					<div class="ml-3">
						<p class="text-sm text-yellow-700">
							<strong>수정 제한:</strong>
							{restrictions.reason}
						</p>
						<p class="mt-1 text-xs text-yellow-600">
							{#if restrictions.restrictions.hasCompletedPayments}
								완료된 결제가 있는 상품은 수정할 수 없습니다.
							{:else if restrictions.restrictions.hasActiveConversations}
								활성 대화가 있는 상품은 수정할 수 없습니다.
							{/if}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Form -->
		{#if restrictions === null}
			<!-- Skeleton Loading -->
			<div class="animate-pulse space-y-6 p-4">
				<!-- Destination Section Skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-20 rounded bg-gray-200"></div>
					<div class="rounded-lg border border-gray-200 bg-gray-100 p-4">
						<div class="mb-2 h-5 w-32 rounded bg-gray-200"></div>
						<div class="h-4 w-24 rounded bg-gray-200"></div>
					</div>
				</div>

				<!-- Basic Info Section Skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-24 rounded bg-gray-200"></div>
					<div class="space-y-3">
						<div>
							<div class="mb-2 h-4 w-12 rounded bg-gray-200"></div>
							<div class="h-10 rounded-lg bg-gray-100"></div>
						</div>
						<div>
							<div class="mb-2 h-4 w-20 rounded bg-gray-200"></div>
							<div class="h-10 rounded-lg bg-gray-100"></div>
						</div>
						<div>
							<div class="mb-2 h-4 w-16 rounded bg-gray-200"></div>
							<div class="h-10 rounded-lg bg-gray-100"></div>
						</div>
					</div>
				</div>

				<!-- Description Section Skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-20 rounded bg-gray-200"></div>
					<div class="h-48 rounded-lg bg-gray-100"></div>
				</div>

				<!-- Languages Section Skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-20 rounded bg-gray-200"></div>
					<div class="grid grid-cols-2 gap-2">
						{#each Array(6) as _}
							<div class="h-10 rounded-lg bg-gray-100"></div>
						{/each}
					</div>
				</div>

				<!-- Files Section Skeleton -->
				<div class="space-y-4">
					<div class="h-6 w-20 rounded bg-gray-200"></div>
					<div class="h-32 rounded-lg border-2 border-dashed border-gray-200"></div>
				</div>
			</div>
		{:else if !restrictions.canEdit}
			<div class="p-4 text-center">
				<p class="text-gray-500">이 상품은 수정할 수 없습니다.</p>
				<button
					onclick={() => goto('/profile/guide/products')}
					class="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
				>
					상품 목록으로 돌아가기
				</button>
			</div>
		{:else}
			<ProductForm
				destinations={data.destinations}
				initialData={data.product}
				mode="edit"
				{isSubmitting}
				onSubmit={handleSubmit}
			/>
		{/if}
	</div>
</div>
