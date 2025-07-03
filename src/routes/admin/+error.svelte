<script>
	import { page } from '$app/stores';
</script>

<div class="flex h-full items-center justify-center bg-gray-50">
	<div class="w-full max-w-md space-y-8 p-8">
		<div>
			<h2 class="text-center text-3xl font-extrabold text-gray-900">관리자 페이지 오류</h2>
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
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
					class="flex w-full justify-center rounded-md border border-transparent bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none"
				>
					관리자 대시보드로 돌아가기
				</a>
				<a
					href="/"
					class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none"
				>
					홈페이지로 가기
				</a>
			</div>
		</div>
	</div>
</div>
