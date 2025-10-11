<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Get the attempted path from query params
	const attemptedPath = $page.url.searchParams.get('path') || '';
</script>

<div class="fixed inset-0 overflow-y-auto bg-white">
	<div class="relative mx-auto max-w-md">
		<div class="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div class="text-center">
				<!-- Error Icon -->
				<div class="mb-6 flex justify-center">
					<div class="rounded-full bg-red-100 p-6">
						<svg
							class="h-16 w-16 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
				</div>

				<!-- Error Message -->
				<h1 class="mb-4 text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
				<p class="mb-2 text-gray-600">요청하신 페이지에 접근할 권한이 없습니다.</p>
				<p class="mb-8 text-sm text-gray-500">다른 계정으로 로그인하거나 관리자에게 문의해주세요.</p>

				{#if attemptedPath}
					<div class="mb-8 rounded-lg bg-gray-50 p-4">
						<p class="text-xs text-gray-500">접근 시도한 페이지:</p>
						<p class="mt-1 font-mono text-sm text-gray-700">{attemptedPath}</p>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="space-y-3">
					<button
						onclick={() => goto('/')}
						class="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
					>
						홈으로 이동
					</button>

					<button
						onclick={() => goto('/login')}
						class="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
					>
						다른 계정으로 로그인
					</button>
				</div>

				<!-- Support Link -->
				<div class="mt-8">
					<a href="/contact" class="text-sm text-blue-600 underline">
						문제가 지속되면 고객센터로 문의하기
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
