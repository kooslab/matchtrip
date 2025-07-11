<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';

	let { data } = $props();

	let user = $derived(data?.user);
	let isLoggedIn = $derived(!!user);

	// Preload common routes for logged in users
	$effect(() => {
		if (isLoggedIn) {
			preloadCommonRoutes();
		}
	});
</script>

<!-- Global Loading Bar -->
{#if typeof window !== 'undefined' && $navigating}
	<div class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-200">
		<div class="h-full animate-pulse bg-gradient-to-r from-blue-500 to-pink-500"></div>
	</div>
{/if}

<!-- Mobile Navbar - Don't show on admin pages -->
<!-- 
{#if !$page.url.pathname.startsWith('/admin')}
<nav class="fixed top-0 left-0 z-40 w-full bg-white shadow md:hidden">
	<div class="flex items-center justify-between px-4 py-3">
		<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
		<button
			type="button"
			onclick={() => openMenu()}
			aria-label="Open menu"
			class="relative z-50 flex h-10 w-10 touch-manipulation items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</div>
	{#if isOpen}
		<div class="fixed inset-0 z-40 bg-black/30" onclick={() => closeMenu()}></div>
	{/if}
	<div
		class="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out {isOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
		style="transform: {isOpen ? 'translateX(0)' : 'translateX(-100%)'}">
		<div class="flex items-center justify-between border-b px-4 py-4">
			<span class="text-lg font-bold text-blue-600">MatchTrip</span>
			<button
				type="button"
				onclick={() => closeMenu()}
				aria-label="Close menu"
				class="relative z-50 flex h-10 w-10 touch-manipulation items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<ul class="space-y-2 px-4 py-6">
			<li>
				<a
					href="/"
					onclick={() => closeMenu()}
					class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
					홈
				</a>
			</li>

			{#if isLoggedIn}
				{#if !isGuide}
					<li>
						<a
							href="/my-trips"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							나의 여행
						</a>
					</li>
					<li>
						<a
							href="/order-history"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							주문 내역
						</a>
					</li>
					{#if isTraveler}
						<li>
							<a
								href="/profile/traveler"
								onclick={() => closeMenu()}
								class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
								내 프로필
							</a>
						</li>
					{/if}
				{/if}
				{#if isGuide}
					<li>
						<a
							href="/trips"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							여행찾기
						</a>
					</li>
					<li>
						<a
							href="/my-offers"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							나의 제안
						</a>
					</li>
					<li>
						<a
							href="/profile/guide"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							내 프로필
						</a>
					</li>
				{/if}

				{#if isAdmin}
					<li>
						<a
							href="/admin"
							onclick={() => closeMenu()}
							class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
								관리자 대시보드
							</div>
						</a>
					</li>
				{/if}

				<li class="mt-6 border-t pt-6">
					<div class="px-3">
						<div class="mb-4 text-sm text-gray-600">안녕하세요, {user?.name || '사용자'}님</div>
						<button
							onclick={handleLogout}
							class="flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
							로그아웃
						</button>
					</div>
				</li>
			{:else}
				<li>
					<a
						href="/signin"
						onclick={() => closeMenu()}
						class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
						로그인
					</a>
				</li>
				<li>
					<a
						href="/signup"
						onclick={() => closeMenu()}
						class="block rounded-md px-3 py-2 font-medium text-gray-800 hover:bg-gray-100 hover:text-blue-600">
						회원가입
					</a>
				</li>
			{/if}
		</ul>
	</div>
</nav>
{/if}
-->

<!-- Desktop Navbar - Don't show on admin pages -->
<!-- 
{#if !$page.url.pathname.startsWith('/admin')}
<nav class="hidden items-center justify-between bg-white/90 px-8 py-4 shadow md:flex">
	<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
	<ul class="flex items-center gap-6">
		<li>
			<NavigationLink href="/" class="font-medium text-gray-800 hover:text-blue-600"
				>홈</NavigationLink>
		</li>

		{#if isLoggedIn}
			{#if !isGuide}
				<li>
					<NavigationLink href="/my-trips" class="font-medium text-gray-800 hover:text-blue-600"
						>나의 여행</NavigationLink>
				</li>
				<li>
					<NavigationLink href="/order-history" class="font-medium text-gray-800 hover:text-blue-600"
						>주문 내역</NavigationLink>
				</li>
				{#if isTraveler}
					<li>
						<NavigationLink href="/profile/traveler" class="font-medium text-gray-800 hover:text-blue-600"
							>내 프로필</NavigationLink>
					</li>
				{/if}
			{/if}
			{#if isGuide}
				<li>
					<NavigationLink href="/trips" class="font-medium text-gray-800 hover:text-blue-600"
						>여행찾기</NavigationLink>
				</li>
				<li>
					<NavigationLink href="/my-offers" class="font-medium text-gray-800 hover:text-blue-600"
						>나의 제안</NavigationLink>
				</li>
				<li>
					<NavigationLink
						href="/profile/guide"
						class="font-medium text-gray-800 hover:text-blue-600">내 프로필</NavigationLink>
				</li>
			{/if}

			{#if isAdmin}
				<li>
					<NavigationLink href="/admin" class="flex items-center gap-2 font-medium text-gray-800 hover:text-blue-600">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						관리자 대시보드
					</NavigationLink>
				</li>
			{/if}

			<li>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">안녕하세요, {user?.name || '사용자'}님</span>
					<button onclick={handleLogout} class="font-medium text-red-600 hover:text-red-700">
						로그아웃
					</button>
				</div>
			</li>
		{:else}
			<li>
				<NavigationLink href="/signin" class="font-medium text-gray-800 hover:text-blue-600"
					>로그인</NavigationLink>
			</li>
			<li>
				<NavigationLink href="/signup" class="font-medium text-gray-800 hover:text-blue-600"
					>회원가입</NavigationLink>
			</li>
		{/if}
	</ul>
</nav>
{/if}
-->

<slot />
