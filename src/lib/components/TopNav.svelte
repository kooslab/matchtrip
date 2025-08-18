<script lang="ts">
	import logoUrl from '$lib/images/Matchtrip.svg';
	import { page } from '$app/stores';
	
	// Pages that need special desktop margin to avoid fake mobile frame
	const pagesNeedingDesktopMargin = [
		'/chat',
		'/profile/guide'
	];
	
	// Check if current page needs special desktop styling
	let needsDesktopMargin = $derived(pagesNeedingDesktopMargin.includes($page.url.pathname));
</script>

<!-- Hide entire header on desktop (>=1024px) since MobileContainer handles it -->
<header
	class="fixed top-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-b border-gray-200 bg-white lg:hidden"
>
	<div class="flex h-14 items-center px-4">
		<a href="/" class="flex items-center {needsDesktopMargin ? 'md:ml-4' : ''}">
			<img src={logoUrl} alt="Matchtrip" class="h-5" />
		</a>
	</div>
</header>

<!-- Spacer to push content down (only on mobile/tablet) -->
<div class="h-14 lg:hidden"></div>
