<script>
	import { page } from '$app/stores';

	// Check if we're in admin section
	$: isAdminError = $page.url?.pathname?.startsWith('/admin');
	$: backUrl = isAdminError ? '/admin' : '/';
	$: backText = isAdminError ? '관리자 대시보드로 돌아가기' : '홈으로 돌아가기';
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">오류가 발생했습니다</h2>
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
			<div class="mt-6">
				<a
					href={backUrl}
					class="flex w-full justify-center rounded-md border border-transparent bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none"
				>
					{backText}
				</a>
			</div>
		</div>
	</div>
</div>
