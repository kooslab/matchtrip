<script lang="ts">
	import { goto } from '$app/navigation';
	import airplaneImg from '$lib/images/airplane.png';
	
	const { data } = $props();
	
	const productId = $derived(data.productId);
	
	function goToHome() {
		goto('/');
	}
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Content -->
	<div class="flex flex-1 flex-col items-center justify-center px-4 text-center pt-20">
		<!-- Airplane Image -->
		<div class="mb-8">
			<img 
				src={airplaneImg} 
				alt="여행 제안 완료" 
				class="h-48 w-auto"
			/>
		</div>
		
		<!-- Success Message -->
		<h1 class="mb-3 text-2xl font-bold text-gray-900">
			여행제안이 완료되었습니다.
		</h1>
		<p class="text-base text-gray-500">
			Match Your Trip, Make It Yours
		</p>
		
		<!-- Info Box -->
		<div class="mt-auto mb-8 w-full max-w-[430px]">
			<div class="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3">
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs">
					i
				</div>
				<p class="text-sm text-gray-700">
					여행 제안이 수락되면 알림으로 안내해드려요
				</p>
				<button class="ml-auto text-xs text-gray-500">
					확인
				</button>
			</div>
		</div>
		
		<!-- Bottom Button -->
		<div class="w-full max-w-[430px] px-4 pb-8">
			<button
				onclick={goToHome}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium"
			>
				돌아가기
			</button>
		</div>
	</div>
</div>