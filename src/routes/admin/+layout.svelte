<script lang="ts">
	import { page } from '$app/stores';
	import { preloadData } from '$app/navigation';
	import { Home, MapPin, Users, Settings, LogOut, Plane, FileText, CreditCard, MessageSquare } from 'lucide-svelte';

	const navigation = [
		{ name: '대시보드', href: '/admin', icon: Home },
		{ name: '여행지 관리', href: '/admin/destinations', icon: MapPin },
		{ name: '사용자 관리', href: '/admin/users', icon: Users },
		{ name: '여행 관리', href: '/admin/trips', icon: Plane },
		{ name: '제안 관리', href: '/admin/offers', icon: FileText },
		{ name: '결제 관리', href: '/admin/payments', icon: CreditCard },
		{ name: '대화 관리', href: '/admin/conversations', icon: MessageSquare },
		{ name: '설정', href: '/admin/settings', icon: Settings }
	];

	// Track preloaded routes to avoid duplicate preloading
	let preloadedRoutes = new Set<string>();

	// Preload on hover for better performance
	function handleMouseEnter(href: string) {
		// Don't preload the current page or already preloaded routes
		if ($page.url.pathname !== href && !preloadedRoutes.has(href)) {
			preloadedRoutes.add(href);
			preloadData(href).catch(err => {
				console.error('Failed to preload:', href, err);
				// Remove from set so it can be retried
				preloadedRoutes.delete(href);
			});
		}
	}

	// Clear preloaded routes cache periodically (every 5 minutes)
	setInterval(() => {
		preloadedRoutes.clear();
	}, 5 * 60 * 1000);
</script>

<div class="admin-layout flex h-screen bg-gray-100 overflow-hidden">
	<!-- Sidebar -->
	<div class="w-64 bg-white shadow-md flex flex-col">
		<div class="p-6">
			<h2 class="text-2xl font-bold text-gray-800">관리자 패널</h2>
		</div>
		<nav class="flex-1 overflow-y-auto">
			{#each navigation as item}
				<a
					href={item.href}
					onmouseenter={() => handleMouseEnter(item.href)}
					onmouseover={() => handleMouseEnter(item.href)}
					onfocus={() => handleMouseEnter(item.href)}
					class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-pink-600 transition-colors {$page.url
						.pathname === item.href
						? 'bg-pink-50 text-pink-600 border-r-4 border-pink-600'
						: ''}"
				>
					<svelte:component this={item.icon} class="h-5 w-5" />
					{item.name}
				</a>
			{/each}
		</nav>
		<div class="p-6 border-t space-y-3">
			<a
				href="/"
				class="flex items-center gap-3 text-gray-700 hover:text-blue-600"
			>
				<Home class="h-5 w-5" />
				홈페이지로 돌아가기
			</a>
			<button
				onclick={async () => {
					const response = await fetch('/api/auth/sign-out', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' }
					});
					if (response.ok) {
						window.location.href = '/signin';
					}
				}}
				class="flex items-center gap-3 text-gray-700 hover:text-red-600 w-full text-left"
			>
				<LogOut class="h-5 w-5" />
				로그아웃
			</button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 overflow-hidden">
		<slot />
	</div>
</div>

<style>
	:global(html:has(.admin-layout)) {
		overflow: hidden;
	}
	
	:global(body:has(.admin-layout)) {
		overflow: hidden;
		height: 100vh;
	}
</style>