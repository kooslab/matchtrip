<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft } from 'lucide-svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';

	const { data } = $props();

	let isSubmitting = $state(false);

	async function handleSubmit(formData: any) {
		isSubmitting = true;

		try {
			const response = await fetch('/api/products/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Creation failed');
			}

			const result = await response.json();

			// Clear cookies and redirect to success page
			await fetch('/api/products/create/save-step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ step: 'clear' })
			});

			await goto(`/products/create/success?id=${result.productId}`);
		} catch (error) {
			console.error('Error creating product:', error);
			window.alert(error.message || '상품 등록에 실패했습니다');
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
				<h1 class="flex-1 text-center text-lg font-semibold">상품 등록</h1>
				<div class="w-8"></div>
				<!-- Spacer for centering -->
			</div>
		</header>

		<!-- Form -->
		<ProductForm
			destinations={data.destinations}
			initialData={data.productData}
			mode="create"
			{isSubmitting}
			onSubmit={handleSubmit}
		/>
	</div>
</div>
