<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import NavigationLink from '$lib/components/NavigationLink.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { preloadCommonRoutes } from '$lib/utils/preloader';

	let { data } = $props();

	let user = $derived(data?.user);
	let userRole = $derived(data?.userRole);
	let isLoggedIn = $derived(!!user);
	let isGuide = $derived(userRole === 'guide');
	let isTraveler = $derived(userRole === 'traveler');

	// Preload common routes for logged in users
	$effect(() => {
		if (isLoggedIn) {
			preloadCommonRoutes();
		}
	});

	let isOpen = $state(false);
	function openMenu() {
		isOpen = true;
	}
	function closeMenu() {
		isOpen = false;
	}

	async function handleLogout() {
		try {
			const response = await fetch('/api/auth/sign-out', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				closeMenu();
				goto('/signin');
				// Force a page reload to clear any cached data
				window.location.reload();
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
</script>

<!-- Global Loading Bar -->
{#if $navigating}
	<div class="fixed top-0 left-0 z-50 h-1 w-full bg-gray-200">
		<div class="h-full animate-pulse bg-gradient-to-r from-blue-500 to-pink-500"></div>
	</div>
{/if}

<!-- Mobile Navbar -->
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
	<!-- Sidebar Overlay -->
	{#if isOpen}
		<div class="fixed inset-0 z-40 bg-black/30" onclick={() => closeMenu()}></div>
	{/if}
	<!-- Sidebar -->
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
				class="flex h-10 w-10 touch-manipulation items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none">
				<svg
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<ul class="flex flex-col gap-2 px-6 py-6">
			<li>
				<NavigationLink
					href="/"
					class="block py-2 font-medium text-gray-800 hover:text-blue-600"
					onclick={() => closeMenu()}>홈</NavigationLink>
			</li>

			{#if isLoggedIn}
				<!-- Logged in menu items -->
				{#if !isGuide}
					<li>
						<NavigationLink
							href="/my-trips"
							class="block py-2 font-medium text-gray-800 hover:text-blue-600"
							onclick={() => closeMenu()}>나의 여행</NavigationLink>
					</li>
				{/if}
				{#if isGuide}
					<li>
						<NavigationLink
							href="/trips"
							class="block py-2 font-medium text-gray-800 hover:text-blue-600"
							onclick={() => closeMenu()}>여행찾기</NavigationLink>
					</li>
					<li>
						<NavigationLink
							href="/my-offers"
							class="block py-2 font-medium text-gray-800 hover:text-blue-600"
							onclick={() => closeMenu()}>나의 제안</NavigationLink>
					</li>
					<li>
						<NavigationLink
							href="/profile/guide"
							class="block py-2 font-medium text-gray-800 hover:text-blue-600"
							onclick={() => closeMenu()}>내 프로필</NavigationLink>
					</li>
				{/if}

				<!-- Conversations link for both travelers and guides -->
				{#if isTraveler || isGuide}
					<li>
						<NavigationLink
							href="/conversations"
							class="block py-2 font-medium text-gray-800 hover:text-blue-600"
							onclick={() => closeMenu()}>대화 목록</NavigationLink>
					</li>
				{/if}

				<li>
					<div class="my-2 border-t border-gray-200"></div>
				</li>
				<li>
					<div class="px-2 py-1 text-sm text-gray-500">
						안녕하세요, {user?.name || '사용자'}님
					</div>
				</li>
				<li>
					<button
						type="button"
						onclick={() => handleLogout()}
						class="block w-full py-2 text-left font-medium text-red-600 hover:text-red-700">
						로그아웃
					</button>
				</li>
			{:else}
				<!-- Not logged in menu items -->
				<li>
					<NavigationLink
						href="/signin"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={() => closeMenu()}>로그인</NavigationLink>
				</li>
				<li>
					<NavigationLink
						href="/signup"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={closeMenu}>회원가입</NavigationLink>
				</li>
			{/if}
		</ul>
	</div>
</nav>

<!-- Desktop Navbar -->
<nav class="hidden items-center justify-between bg-white/90 px-8 py-4 shadow md:flex">
	<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
	<ul class="flex items-center gap-6">
		<li>
			<NavigationLink href="/" class="font-medium text-gray-800 hover:text-blue-600"
				>홈</NavigationLink>
		</li>

		{#if isLoggedIn}
			<!-- Logged in desktop menu -->
			{#if !isGuide}
				<li>
					<NavigationLink href="/my-trips" class="font-medium text-gray-800 hover:text-blue-600"
						>나의 여행</NavigationLink>
				</li>
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

			<li>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">안녕하세요, {user?.name || '사용자'}님</span>
					<button onclick={handleLogout} class="font-medium text-red-600 hover:text-red-700">
						로그아웃
					</button>
				</div>
			</li>
		{:else}
			<!-- Not logged in desktop menu -->
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

<div class="flex min-h-screen flex-col pt-16 md:pt-20">
	<slot />
	<Footer />
</div>
