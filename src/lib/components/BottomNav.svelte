<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Plus } from 'lucide-svelte';

	// Import icons from local icons folder
	import HomeIcon from '$lib/icons/house-with-chimney.svg?raw';
	import FlagMapIcon from '$lib/icons/flag-map.svg?raw';
	import DirectionsIcon from '$lib/icons/directions-sign.svg?raw';
	import ChatIcon from '$lib/icons/bubble-chat.svg?raw';
	import UserIcon from '$lib/icons/icon-user-mono.svg?raw';

	const navItems = [
		{ href: '/', icon: HomeIcon, label: '홈' },
		{ href: '/my-trips', icon: FlagMapIcon, label: '나의 여행' },
		{ href: '/order-history', icon: DirectionsIcon, label: '주문 내역' },
		{ href: '/chat', icon: ChatIcon, label: '대 화' },
		{ href: '/profile/traveler', icon: UserIcon, label: '내 프로필' }
	];

	$: currentPath = $page.url.pathname;
	$: showCreateButton = currentPath === '/my-trips';
</script>

<div class="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2">
		<!-- Floating Create Trip Button - Only visible on /my-trips page -->
		{#if showCreateButton}
			<button
				class="absolute -top-12 right-4 flex items-center gap-1 rounded-[20px] bg-[#1095f4] px-3.5 py-3 text-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-lg"
				onclick={() => goto('/my-trips/create')}
			>
				<span class="text-xs font-bold whitespace-nowrap">새 여행 만들기</span>
				<Plus class="h-3 w-3 opacity-80" />
			</button>
		{/if}

		<!-- Bottom Navigation -->
		<nav
			class="safe-area-bottom relative rounded-t-[20px] border-t border-[#f1f1f1] bg-white/95 shadow-[0px_-4px_12px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm"
		>
		<div class="flex items-end justify-between px-4 pt-0 pb-1">
			{#each navItems as item}
				{@const isActive =
					currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))}
				{#if isActive}
					<!-- Active state -->
					<div class="flex flex-1 justify-center">
						<div class="flex flex-col items-center gap-1 pt-1 pb-0">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-[20px] bg-[#1095f4] shadow-[0px_12px_12px_0px_rgba(98,120,246,0.12)]"
								style="background-image: linear-gradient(157.454deg, rgba(54, 41, 241, 0) 0%, rgba(220, 220, 220, 0.4) 100%)"
							>
								<div class="h-4 w-4 text-white">
									{@html item.icon}
								</div>
							</div>
							<span class="text-center text-[10px] leading-3 font-semibold text-[#1095f4]"
								>{item.label}</span
							>
						</div>
					</div>
				{:else}
					<!-- Inactive state -->
					<a
						href={item.href}
						class="flex flex-1 flex-col items-center gap-1 py-0 opacity-60 transition-all hover:opacity-80"
					>
						<div class="p-1">
							<div class="h-4 w-4 text-[#536b7c]">
								{@html item.icon}
							</div>
						</div>
						<span class="text-center text-[10px] leading-3 font-medium text-[#536b7c]"
							>{item.label}</span
						>
					</a>
				{/if}
			{/each}
		</div>

		<!-- iOS home indicator space -->
		<div class="h-safe-area-inset-bottom bg-transparent"></div>
	</nav>
</div>

<style>
	/* Ensure SVG icons fill their container and inherit color */
	:global(nav svg) {
		width: 100%;
		height: 100%;
		fill: currentColor;
	}

	/* Force white color for active state icons */
	:global(nav .text-white svg) {
		fill: white !important;
	}

	:global(nav .text-white svg path) {
		fill: white !important;
	}

	/* Safe area padding for iOS */
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}

	.h-safe-area-inset-bottom {
		height: env(safe-area-inset-bottom);
	}
</style>
