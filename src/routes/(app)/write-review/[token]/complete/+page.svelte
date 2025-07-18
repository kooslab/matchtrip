<script lang="ts">
	import { goto } from '$app/navigation';
	import starImage from '$lib/images/star.png';
	import arrowBackIcon from '$lib/icons/icon-arrow-left-small-mono.svg';

	let { data } = $props();
</script>

<svelte:head>
	<title>리뷰 작성 완료 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow-sm">
		<div class="relative flex items-center px-4 py-4">
			<button onclick={() => goto('/my-trips')} class="-ml-1 p-1">
				<img src={arrowBackIcon} alt="뒤로가기" class="h-6 w-6" />
			</button>
			<h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">리뷰 작성 완료</h1>
			<div class="w-6"></div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex flex-col items-center px-4 pt-12">
		<!-- Star Image -->
		<img src={starImage} alt="Star" class="mb-8 h-32 w-32" />

		<!-- Title -->
		<h2 class="mb-3 text-2xl font-bold text-gray-900">리뷰 작성 완료!</h2>

		<!-- Description -->
		<p class="mb-12 text-center text-base leading-relaxed text-gray-600">
			소중한 리뷰 감사합니다.<br />
			작성하신 리뷰는 다른 여행자들에게<br />
			큰 도움이 될 거예요.
		</p>

		<!-- Bottom Button -->
		<div class="w-full max-w-sm">
			<button
				onclick={() => goto('/my-trips')}
				class="w-full rounded-xl bg-[#1095f4] py-4 text-base font-semibold text-white transition-colors hover:bg-blue-600"
			>
				여행 페이지로 이동
			</button>
		</div>
	</div>
</div>
