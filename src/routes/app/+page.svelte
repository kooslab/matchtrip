<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession, signOut } from '$lib/authClient';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	const session = useSession();
	let isLoading = $state(false);

	// Get role from layout data
	let userRole = $derived(data?.userRole);

	// 사용자 역할에 따른 처리
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');

	// 세션 로딩 상태
	let isSessionLoading = $derived($session.isPending || $session.isRefetching);

	async function handleSignOut() {
		isLoading = true;
		try {
			await signOut({
				fetchOptions: {
					onSuccess: () => {
						goto('/signin', { invalidateAll: true });
					}
				}
			});
		} finally {
			isLoading = false;
		}
	}
</script>

<!-- 로딩 중이면 로딩 UI 표시 -->
{#if isSessionLoading}
	<div class="flex min-h-screen items-center justify-center">
		<p>로딩 중...</p>
	</div>
{:else if !$session.data}
	<div class="flex min-h-screen items-center justify-center">
		<p>세션이 없습니다. <a href="/signin" class="text-blue-500">로그인</a>해주세요.</p>
	</div>
{:else}
	<div
		class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
		<div class="w-full max-w-4xl">
			{#if isGuide}
				<!-- 가이드용 UI -->
				<div class="rounded-2xl bg-white/90 p-8 shadow-xl">
					<h1 class="mb-6 text-3xl font-bold text-blue-700">가이드 대시보드</h1>
					<p class="mb-4 text-lg text-gray-600">
						안녕하세요, <span class="font-bold"
							>{$session.data?.user?.name || $session.data?.user?.email}</span
						>님!
					</p>
					<p class="mb-6 text-gray-600">
						가이드로 로그인되었습니다. 여행자들의 매칭 요청을 관리하고 일정을 계획하세요.
					</p>

					<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="rounded-lg bg-blue-50 p-4 shadow">
							<h2 class="mb-2 text-xl font-semibold text-blue-700">신규 요청</h2>
							<p>아직 신규 요청이 없습니다.</p>
						</div>
						<div class="rounded-lg bg-blue-50 p-4 shadow">
							<h2 class="mb-2 text-xl font-semibold text-blue-700">예정된 여행</h2>
							<p>예정된 여행이 없습니다.</p>
						</div>
					</div>

					<Button
						onclick={handleSignOut}
						loading={isLoading}
						loadingText="로그아웃 중..."
						class="mt-4">
						로그아웃
					</Button>
				</div>
			{:else if isTraveler}
				<!-- 여행자용 UI -->
				<div class="rounded-2xl bg-white/90 p-8 shadow-xl">
					<h1 class="mb-6 text-3xl font-bold text-green-700">여행자 대시보드</h1>
					<p class="mb-4 text-lg text-gray-600">
						안녕하세요, <span class="font-bold"
							>{$session.data?.user?.name || $session.data?.user?.email}</span
						>님!
					</p>
					<p class="mb-6 text-gray-600">
						여행자로 로그인되었습니다. 가이드를 찾고 여행을 계획하세요.
					</p>

					<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="rounded-lg bg-green-50 p-4 shadow">
							<h2 class="mb-2 text-xl font-semibold text-green-700">추천 가이드</h2>
							<p>아직 추천 가이드가 없습니다.</p>
						</div>
						<div class="rounded-lg bg-green-50 p-4 shadow">
							<h2 class="mb-2 text-xl font-semibold text-green-700">예정된 여행</h2>
							<p>예정된 여행이 없습니다.</p>
						</div>
					</div>

					<Button
						onclick={handleSignOut}
						loading={isLoading}
						loadingText="로그아웃 중..."
						class="mt-4">
						로그아웃
					</Button>
				</div>
			{:else}
				<!-- 역할이 없는 경우 (오류 상태) -->
				<div class="rounded-2xl bg-white/90 p-8 shadow-xl">
					<h1 class="mb-6 text-3xl font-bold text-gray-700">접근 오류</h1>
					<p class="mb-4 text-red-500">사용자 역할이 설정되지 않았습니다.</p>
					<p class="mb-2">
						현재 로그인: <span class="font-bold">{$session.data?.user?.email}</span>
					</p>
					<p class="mb-6">역할: <span class="italic">{userRole}</span></p>

					<Button
						onclick={handleSignOut}
						loading={isLoading}
						loadingText="로그아웃 중..."
						class="mt-4">
						로그아웃
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
