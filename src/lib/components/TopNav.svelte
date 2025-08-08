<script lang="ts">
	import searchIconUrl from '$lib/icons/icon-search-mono.svg';
	import notificationIconUrl from '$lib/icons/icon-loudspeaker-mono.svg';
</script>

<header
	class="fixed top-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-b border-gray-200 bg-white"
>
	<div class="flex h-14 items-center justify-between px-4">
		<a href="/" class="text-xl font-bold text-gray-900">Matchtrip</a>

		<div class="flex items-center gap-4">
			<button class="text-gray-600 hover:text-gray-900">
				<img src={searchIconUrl} alt="Search" class="h-6 w-6" />
			</button>

			<button class="relative text-gray-600 hover:text-gray-900">
				<img src={notificationIconUrl} alt="Notifications" class="h-6 w-6" />
				<span class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
			</button>
		</div>
	</div>
</header>

<!-- Spacer to push content down -->
<div class="h-14"></div>
