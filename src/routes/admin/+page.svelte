<script lang="ts">
	import type { PageData } from './$types';
	import { MapPin, Users, DollarSign, TrendingUp, Settings } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
		<p class="mt-2 text-gray-600">Welcome back, {data.user.name}!</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Total Users</p>
					<p class="text-2xl font-bold text-gray-900">0</p>
				</div>
				<Users class="h-10 w-10 text-blue-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Destinations</p>
					<p class="text-2xl font-bold text-gray-900">0</p>
				</div>
				<MapPin class="h-10 w-10 text-green-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Total Revenue</p>
					<p class="text-2xl font-bold text-gray-900">₩0</p>
				</div>
				<DollarSign class="h-10 w-10 text-yellow-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">Active Trips</p>
					<p class="text-2xl font-bold text-gray-900">0</p>
				</div>
				<TrendingUp class="h-10 w-10 text-purple-500" />
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
		<div class="grid gap-4 md:grid-cols-3">
			<a
				href="/admin/destinations"
				class="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
			>
				<MapPin class="mb-3 h-8 w-8 text-green-500" />
				<h3 class="font-semibold text-gray-900">Manage Destinations</h3>
				<p class="mt-1 text-sm text-gray-600">Add, edit, or remove travel destinations</p>
			</a>

			<a href="/admin/users" class="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
				<Users class="mb-3 h-8 w-8 text-blue-500" />
				<h3 class="font-semibold text-gray-900">Manage Users</h3>
				<p class="mt-1 text-sm text-gray-600">View and manage user accounts</p>
			</a>

			<a
				href="/admin/settings"
				class="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
			>
				<Settings class="mb-3 h-8 w-8 text-purple-500" />
				<h3 class="font-semibold text-gray-900">System Settings</h3>
				<p class="mt-1 text-sm text-gray-600">Configure platform settings</p>
			</a>
		</div>
	</div>
</div>