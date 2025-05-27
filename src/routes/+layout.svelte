<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data;

	$: user = data?.user;
	$: isLoggedIn = !!user;

	let isOpen = false;
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
				goto('/');
				// Force a page reload to clear any cached data
				window.location.reload();
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
</script>

<!-- Mobile Navbar -->
<nav class="fixed top-0 left-0 z-30 w-full bg-white/90 shadow md:hidden">
	<div class="flex items-center justify-between px-4 py-3">
		<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
		<button onclick={openMenu} aria-label="Open menu">
			<svg class="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
		<div class="fixed inset-0 z-40 bg-black/30" onclick={closeMenu}></div>
	{/if}
	<!-- Sidebar -->
	<div
		class="fixed top-0 left-0 z-50 h-full w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out"
		class:translate-x-0={isOpen}
		class:-translate-x-full={!isOpen}>
		<div class="flex items-center justify-between border-b px-4 py-4">
			<span class="text-lg font-bold text-blue-600">MatchTrip</span>
			<button onclick={closeMenu} aria-label="Close menu">
				<svg class="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
				<a
					href="/"
					class="block py-2 font-medium text-gray-800 hover:text-blue-600"
					onclick={closeMenu}>홈</a>
			</li>

			{#if isLoggedIn}
				<!-- Logged in menu items -->
				<li>
					<a
						href="/my-trips"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={closeMenu}>나의 여행</a>
				</li>
				<li>
					<a
						href="/app"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={closeMenu}>대시보드</a>
				</li>
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
						onclick={handleLogout}
						class="block w-full py-2 text-left font-medium text-red-600 hover:text-red-700">
						로그아웃
					</button>
				</li>
			{:else}
				<!-- Not logged in menu items -->
				<li>
					<a
						href="/signin"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={closeMenu}>로그인</a>
				</li>
				<li>
					<a
						href="/signup"
						class="block py-2 font-medium text-gray-800 hover:text-blue-600"
						onclick={closeMenu}>회원가입</a>
				</li>
			{/if}
		</ul>
	</div>
</nav>

<!-- Desktop Navbar -->
<nav class="hidden items-center justify-between bg-white/90 px-8 py-4 shadow md:flex">
	<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
	<ul class="flex items-center gap-6">
		<li><a href="/" class="font-medium text-gray-800 hover:text-blue-600">홈</a></li>

		{#if isLoggedIn}
			<!-- Logged in desktop menu -->
			<li>
				<a href="/my-trips" class="font-medium text-gray-800 hover:text-blue-600">나의 여행</a>
			</li>
			<li><a href="/app" class="font-medium text-gray-800 hover:text-blue-600">대시보드</a></li>
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
			<li><a href="/signin" class="font-medium text-gray-800 hover:text-blue-600">로그인</a></li>
			<li><a href="/signup" class="font-medium text-gray-800 hover:text-blue-600">회원가입</a></li>
		{/if}
	</ul>
</nav>

<div class="flex min-h-screen flex-col pt-16 md:pt-20">
	<slot />
	<Footer />
</div>
