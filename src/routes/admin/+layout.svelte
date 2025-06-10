<script lang="ts">
	import { page } from '$app/stores';
	import { Home, MapPin, Users, Settings, LogOut } from 'lucide-svelte';

	const navigation = [
		{ name: 'Dashboard', href: '/admin', icon: Home },
		{ name: 'Destinations', href: '/admin/destinations', icon: MapPin },
		{ name: 'Users', href: '/admin/users', icon: Users },
		{ name: 'Settings', href: '/admin/settings', icon: Settings }
	];
</script>

<div class="flex h-screen bg-gray-100">
	<!-- Sidebar -->
	<div class="w-64 bg-white shadow-md">
		<div class="p-6">
			<h2 class="text-2xl font-bold text-gray-800">Admin Panel</h2>
		</div>
		<nav class="mt-6">
			{#each navigation as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-pink-600 {$page.url
						.pathname === item.href
						? 'bg-pink-50 text-pink-600 border-r-4 border-pink-600'
						: ''}"
				>
					<svelte:component this={item.icon} class="h-5 w-5" />
					{item.name}
				</a>
			{/each}
		</nav>
		<div class="absolute bottom-0 w-64 p-6">
			<a
				href="/api/auth/signout"
				class="flex items-center gap-3 text-gray-700 hover:text-red-600"
			>
				<LogOut class="h-5 w-5" />
				Sign Out
			</a>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 overflow-auto">
		<slot />
	</div>
</div>