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

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div class="w-full max-w-md text-center">
		<!-- Checkmark Icon -->
		<div class="mb-8 flex justify-center">
			<div class="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
				<svg class="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"
					></path>
				</svg>
			</div>
		</div>

		<!-- Message -->
		<h1 class="mb-3 text-2xl font-bold text-gray-900">가입이 완료되었습니다!</h1>

		<p class="mb-12 text-lg text-gray-600">
			매치트립과 함께 특별한 여행을<br />시작해보세요
		</p>

		<!-- Start Button -->
		<button
			onclick={handleStart}
			class="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
		>
			시작하기
		</button>
	</div>
</div>
