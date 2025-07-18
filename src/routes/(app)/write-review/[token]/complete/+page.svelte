<script lang="ts">
	import { goto } from '$app/navigation';
	import checkIcon from '$lib/icons/icon-check-mono.svg';
	
	let { data } = $props();
</script>

<svelte:head>
	<title>리뷰 작성 완료 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white flex flex-col">
	<!-- Content -->
	<div class="flex-1 flex flex-col items-center justify-center px-4">
		<!-- Success Icon -->
		<div class="w-20 h-20 rounded-full bg-[#19b989] flex items-center justify-center mb-6">
			<img src={checkIcon} alt="완료" class="w-10 h-10 brightness-0 invert" />
		</div>
		
		<!-- Title -->
		<h1 class="text-2xl font-bold text-gray-900 mb-3">
			리뷰 작성 완료!
		</h1>
		
		<!-- Description -->
		<p class="text-base text-gray-600 text-center mb-8 max-w-sm">
			소중한 리뷰 감사합니다.<br/>
			작성하신 리뷰는 다른 여행자들에게<br/>
			큰 도움이 될 거예요.
		</p>
		
		<!-- Guide Info Card -->
		<div class="w-full max-w-sm bg-gray-50 rounded-xl p-4 mb-8">
			<div class="flex items-center gap-3">
				{#if data.guideProfile?.profileImageUrl}
					<img 
						src={data.guideProfile.profileImageUrl} 
						alt={data.guide.name}
						class="w-12 h-12 rounded-full object-cover"
					/>
				{:else}
					<div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
						<span class="text-lg font-semibold text-gray-600">
							{data.guide.name.charAt(0)}
						</span>
					</div>
				{/if}
				<div class="flex-1">
					<h3 class="font-semibold text-gray-900">{data.guide.name}</h3>
					<div class="flex items-center gap-1 mt-1">
						<div class="flex">
							{#each Array(5) as _, i}
								<svg class="w-4 h-4 {i < data.review.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							{/each}
						</div>
						<span class="text-sm text-gray-600">({data.review.rating}.0)</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Buttons -->
		<div class="w-full max-w-sm space-y-3">
			<button
				onclick={() => goto('/my-trips')}
				class="w-full py-3.5 rounded-xl bg-[#1095f4] text-white font-semibold hover:bg-blue-600 transition-colors"
			>
				내 여행 목록으로
			</button>
			<button
				onclick={() => goto('/')}
				class="w-full py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
			>
				홈으로 가기
			</button>
		</div>
	</div>
</div>