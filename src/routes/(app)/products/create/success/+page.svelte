<script lang="ts">
	import { goto } from '$app/navigation';
	import airplaneImg from '$lib/images/airplane.png';
	import infoIcon from '$lib/icons/icon-info-circle-mono.svg';
	import logoUrl from '$lib/images/Matchtrip.svg';
	
	const { data } = $props();
	
	const productId = $derived(data.productId);
	
	function goToHome() {
		goto('/');
	}
	
	function handleConfirm() {
		// Just close/dismiss the info box or do nothing for now
	}
</script>

<div class="h-screen bg-gray-50 overflow-hidden">
	<div class="mx-auto max-w-md h-full flex flex-col bg-white">
		<!-- Header without border - Fixed height -->
		<div class="flex justify-center py-4 flex-shrink-0">
			<img src={logoUrl} alt="Matchtrip" class="h-5" />
		</div>
		
		<!-- Main Content - Flexible center -->
		<div class="flex-1 flex flex-col items-center justify-center px-5 min-h-0">
			<!-- Airplane Image - Responsive size -->
			<div class="mb-6">
				<img 
					src={airplaneImg} 
					alt="상품 등록 완료" 
					class="h-32 sm:h-36 w-auto"
				/>
			</div>
			
			<!-- Success Message -->
			<div class="text-center">
				<h2 class="text-xl font-bold text-gray-900 mb-2">
					여행제안이 완료되었습니다.
				</h2>
				<p class="text-sm text-gray-500">
					Match Your Trip, Make It Yours
				</p>
			</div>
		</div>
		
		<!-- Bottom Section - Fixed height -->
		<div class="px-5 pb-6 flex-shrink-0">
			<!-- Info Box -->
			<div class="mb-4">
				<div class="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
					<img 
						src={infoIcon}
						alt="정보"
						class="w-6 h-6 flex-shrink-0"
					/>
					<p class="text-sm text-gray-700 flex-1">
						여행 제안이 수락되면 알림으로 안내해드려요
					</p>
					<button 
						onclick={handleConfirm}
						class="text-xs text-gray-400"
					>
						확인
					</button>
				</div>
			</div>
			
			<!-- Bottom Button -->
			<button
				onclick={goToHome}
				class="w-full rounded-xl bg-blue-500 py-3.5 text-white font-medium"
			>
				돌아가기
			</button>
		</div>
	</div>
</div>