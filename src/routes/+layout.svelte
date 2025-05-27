<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';

	let isOpen = false;
	function openMenu() {
		isOpen = true;
	}
	function closeMenu() {
		isOpen = false;
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
			<li>
				<a
					href="/my-trips"
					class="block py-2 font-medium text-gray-800 hover:text-blue-600"
					onclick={closeMenu}>나의 여행</a>
			</li>
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
		</ul>
	</div>
</nav>

<!-- Desktop Navbar (optional, simple) -->
<nav class="hidden items-center justify-between bg-white/90 px-8 py-4 shadow md:flex">
	<a href="/" class="text-lg font-bold text-blue-600">MatchTrip</a>
	<ul class="flex gap-6">
		<li><a href="/" class="font-medium text-gray-800 hover:text-blue-600">홈</a></li>
		<li><a href="/my-trips" class="font-medium text-gray-800 hover:text-blue-600">나의 여행</a></li>
		<li><a href="/signin" class="font-medium text-gray-800 hover:text-blue-600">로그인</a></li>
		<li><a href="/signup" class="font-medium text-gray-800 hover:text-blue-600">회원가입</a></li>
	</ul>
</nav>

<div class="flex min-h-screen flex-col pt-16 md:pt-20">
	<slot />
	<Footer />
</div>
