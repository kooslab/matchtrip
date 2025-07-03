<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Import icons from local icons folder
	import HomeIcon from '$lib/icons/house-with-chimney.svg?raw';
	import FlagMapIcon from '$lib/icons/flag-map.svg?raw';
	import BookIcon from '$lib/icons/close-book.svg?raw';
	import ChatIcon from '$lib/icons/bubble-chat.svg?raw';
	import UserIcon from '$lib/icons/icon-user-mono.svg?raw';

	const navItems = [
		{ href: '/', icon: HomeIcon, label: '홈' },
		{ href: '/trips', icon: FlagMapIcon, label: '여행 찾기' },
		{ href: '/my-offers', icon: BookIcon, label: '나의 제안' },
		{ href: '/conversations', icon: ChatIcon, label: '대 화' },
		{ href: '/profile/guide', icon: UserIcon, label: '내 프로필' }
	];

	$: currentPath = $page.url.pathname;
</script>

<div class="fixed right-0 bottom-0 left-0 z-40">
	<!-- Bottom Navigation -->
	<nav
		class="safe-area-bottom relative rounded-t-[20px] border-t border-[#f1f1f1] bg-white/95 shadow-[0px_-4px_12px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm"
	>
		<div class="flex items-end justify-between px-4 pt-0 pb-1">
			{#each navItems as item}
				{#if currentPath === item.href}
					<!-- Active state -->
					<div class="flex flex-1 justify-center">
						<div class="flex flex-col items-center gap-1 pt-0 pb-1">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-[20px] bg-[#1095f4] shadow-[0px_12px_12px_0px_rgba(98,120,246,0.12)]"
								style="background-image: linear-gradient(157.454deg, rgba(54, 41, 241, 0) 0%, rgba(220, 220, 220, 0.4) 100%)"
							>
								<div class="h-4 w-4 text-white">
									{@html item.icon}
								</div>
							</div>
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

	/* Safe area padding for iOS */
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}

	.h-safe-area-inset-bottom {
		height: env(safe-area-inset-bottom);
	}
</style>
