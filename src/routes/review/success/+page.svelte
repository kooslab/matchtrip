<script lang="ts">
	import { page } from '$app/stores';
	import { CheckCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let guideId = $state('');

	onMount(() => {
		guideId = $page.url.searchParams.get('guideId') || '';
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
		<div class="mb-6 flex justify-center">
			<CheckCircle class="h-16 w-16 text-green-500" />
		</div>

		<h1 class="mb-4 text-2xl font-bold text-gray-800">리뷰가 제출되었습니다!</h1>

		<p class="mb-8 text-gray-600">
			소중한 후기를 남겨주셔서 감사합니다. 다른 여행자들에게 큰 도움이 될 거예요.
		</p>

		<div class="space-y-3">
			{#if guideId}
				<a
					href="/guide/{guideId}"
					class="block w-full rounded-lg bg-pink-500 py-3 font-medium text-white transition hover:bg-pink-600"
				>
					가이드 프로필 보기
				</a>
			{/if}

			<a
				href="/"
				class="block w-full rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50"
			>
				홈으로 돌아가기
			</a>
		</div>
	</div>
</div>
