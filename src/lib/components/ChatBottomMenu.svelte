<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Plus } from 'lucide-svelte';
	import IconOutMono from '$lib/icons/icon-out-mono.svg?raw';
	import IconWarningTriangleMono from '$lib/icons/icon-warning-triangle-mono.svg?raw';

	interface Props {
		onExit: () => void;
		onReport: () => void;
	}

	let { onExit, onReport }: Props = $props();

	let showMenu = $state(false);
	let menuElement: HTMLDivElement;

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		showMenu = !showMenu;
	}

	function handleClickOutside(event: MouseEvent) {
		if (menuElement && !menuElement.contains(event.target as Node)) {
			showMenu = false;
		}
	}

	function handleExit() {
		showMenu = false;
		onExit();
	}

	function handleReport() {
		showMenu = false;
		onReport();
	}

	onMount(() => {
		if (showMenu) {
			document.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	$effect(() => {
		if (showMenu) {
			// Add a small delay to prevent immediate closure
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 0);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="relative">
	<!-- Plus button to trigger menu -->
	<button
		type="button"
		onclick={(e) => toggleMenu(e)}
		class="flex items-center justify-center transition-all {showMenu ? 'rotate-45' : ''}"
		aria-label="메뉴 열기"
	>
		<Plus class="h-6 w-6" style="color: #1095f4;" />
	</button>

	<!-- Dropdown menu (opens upward) -->
	{#if showMenu}
		<div
			bind:this={menuElement}
			class="absolute bottom-10 left-0 z-50 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
		>
			<div class="py-1">
				<!-- Report -->
				<button
					onclick={handleReport}
					class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
				>
					<div class="h-5 w-5 text-gray-500">
						{@html IconWarningTriangleMono.replace(/fill="#8B95A1"/g, 'fill="currentColor"')}
					</div>
					<span>신고하기</span>
				</button>

				<!-- Exit Chat -->
				<button
					onclick={handleExit}
					class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
				>
					<div class="h-5 w-5 text-gray-500">
						{@html IconOutMono.replace(/fill="#8B95A1"/g, 'fill="currentColor"')}
					</div>
					<span>채팅방 나가기</span>
				</button>
			</div>
		</div>
	{/if}
</div>