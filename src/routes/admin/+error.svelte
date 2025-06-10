<script>
	import { page } from '$app/stores';
</script>

<div class="flex items-center justify-center h-full bg-gray-50">
	<div class="max-w-md w-full space-y-8 p-8">
		<div>
			<h2 class="text-center text-3xl font-extrabold text-gray-900">
				관리자 페이지 오류
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
			<div class="mt-6 space-y-3">
				<a
					href="/admin"
					class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
				>
					관리자 대시보드로 돌아가기
				</a>
				<a
					href="/"
					class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
				>
					홈페이지로 가기
				</a>
			</div>
		</div>
	</div>
</div>