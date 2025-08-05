<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronRight } from 'lucide-svelte';
	
	const { data } = $props();
	
	// Get data from server
	const productData = $derived(data.productData);
	const destination = $derived(data.destination);
	const languageNames = $derived(data.languageNames);
	
	let isSubmitting = $state(false);
	
	// Format price with commas
	function formatPrice(price: number) {
		return new Intl.NumberFormat('ko-KR').format(price);
	}
	
	// Strip HTML tags for preview
	function stripHtml(html: string) {
		const div = document.createElement('div');
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	}
	
	// Edit functions
	function editDestination() {
		goto('/products/create');
	}
	
	function editPrice() {
		goto('/products/create/price');
	}
	
	function editDescription() {
		goto('/products/create/description');
	}
	
	function editDuration() {
		goto('/products/create/duration');
	}
	
	function editLanguages() {
		goto('/products/create/languages');
	}
	
	function editAttachments() {
		goto('/products/create/attachments');
	}
</script>

<div class="flex-1 bg-white">
	<!-- Title -->
	<div class="px-4 pt-6 pb-4">
		<h2 class="text-2xl font-bold text-gray-900">등록 내용 확인</h2>
		<p class="mt-2 text-sm text-gray-600">입력하신 정보를 확인해주세요</p>
	</div>
	
	<!-- Review sections -->
	<div class="divide-y divide-gray-100">
		<!-- Destination -->
		<button
			onclick={editDestination}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left">
				<p class="text-sm text-gray-500">목적지</p>
				<p class="mt-1 font-medium text-gray-900">
					{destination ? `${destination.city}, ${destination.country?.name}` : '미선택'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400" />
		</button>
		
		<!-- Price -->
		<button
			onclick={editPrice}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left">
				<p class="text-sm text-gray-500">1인당 가격</p>
				<p class="mt-1 font-medium text-gray-900">
					{productData.price ? `${formatPrice(productData.price)}원` : '미입력'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400" />
		</button>
		
		<!-- Description -->
		<button
			onclick={editDescription}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left flex-1">
				<p class="text-sm text-gray-500">상품 설명</p>
				<p class="mt-1 text-gray-900 line-clamp-2">
					{productData.description ? stripHtml(productData.description) : '미입력'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
		</button>
		
		<!-- Duration -->
		<button
			onclick={editDuration}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left">
				<p class="text-sm text-gray-500">투어 시간</p>
				<p class="mt-1 font-medium text-gray-900">
					{productData.duration ? `${productData.duration}시간` : '상담 필요'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400" />
		</button>
		
		<!-- Languages -->
		<button
			onclick={editLanguages}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left flex-1">
				<p class="text-sm text-gray-500">사용 가능 언어</p>
				<p class="mt-1 font-medium text-gray-900">
					{languageNames.length > 0 ? languageNames.join(', ') : '미선택'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
		</button>
		
		<!-- Attachments -->
		<button
			onclick={editAttachments}
			class="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
		>
			<div class="text-left">
				<p class="text-sm text-gray-500">첨부 파일</p>
				<p class="mt-1 font-medium text-gray-900">
					{productData.fileIds?.length > 0 ? `${productData.fileIds.length}개 파일` : '없음'}
				</p>
			</div>
			<ChevronRight class="h-5 w-5 text-gray-400" />
		</button>
	</div>
	
	<!-- Submit form -->
	<form method="POST" action="?/submit" class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
		<div class="mx-auto max-w-[430px]">
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? '등록 중...' : '상품 등록하기'}
			</button>
		</div>
	</form>
</div>