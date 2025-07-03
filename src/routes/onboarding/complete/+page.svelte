<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	function handleStart() {
		const userRole = $page.data.user?.role;
		
		if (userRole === 'guide') {
			goto('/my-offers');
		} else if (userRole === 'traveler') {
			goto('/my-trips');
		} else {
			// Fallback to home
			goto('/');
		}
	}
</script>

<div class="min-h-screen bg-white flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full text-center">
		<!-- Checkmark Icon -->
		<div class="mb-8 flex justify-center">
			<div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
				<svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
		</div>

		<!-- Message -->
		<h1 class="text-2xl font-bold text-gray-900 mb-3">
			가입이 완료되었습니다!
		</h1>
		
		<p class="text-gray-600 mb-12 text-lg">
			매치트립과 함께 특별한 여행을<br/>시작해보세요
		</p>

		<!-- Start Button -->
		<button
			onclick={handleStart}
			class="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg"
		>
			시작하기
		</button>
	</div>
</div>