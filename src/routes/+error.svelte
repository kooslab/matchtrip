<script>
	import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				오류가 발생했습니다
			</h2>
			<div class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
				<p class="text-sm text-red-800">
					{$page.error?.message || '알 수 없는 오류가 발생했습니다.'}
				</p>
			</div>
			{#if $page.status}
				<p class="mt-2 text-center text-sm text-gray-600">
					상태 코드: {$page.status}
				</p>
			{/if}
			<div class="mt-6">
				<a
					href="/"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
				>
					홈으로 돌아가기
				</a>
			</div>
		</div>
	</div>
</div>