<script lang="ts">
	import { onMount } from 'svelte';
	import IconOutMono from '$lib/icons/icon-out-mono.svg?raw';
	import IconWarningTriangleMono from '$lib/icons/icon-warning-triangle-mono.svg?raw';

	interface Props {
		onExit: () => void;
		onReport: () => void;
	}

	let { onExit, onReport }: Props = $props();

	let showMenu = $state(false);
	let menuElement: HTMLDivElement;

	function toggleMenu() {
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
		if (typeof document !== 'undefined' && showMenu) {
			document.addEventListener('click', handleClickOutside);
		}
		
		return () => {
			if (typeof document !== 'undefined') {
				document.removeEventListener('click', handleClickOutside);
			}
		};
	});

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (showMenu) {
				document.addEventListener('click', handleClickOutside);
			} else {
				document.removeEventListener('click', handleClickOutside);
			}
		}
		
		return () => {
			if (typeof document !== 'undefined') {
				document.removeEventListener('click', handleClickOutside);
			}
		};
	});
</script>

<div class="relative">
	<!-- Plus button to trigger menu -->
	<button
		onclick={toggleMenu}
		class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
		aria-label="더보기 메뉴"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="text-gray-600"
		>
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	</button>

	<!-- Dropdown menu -->
	{#if showMenu}
		<div
			bind:this={menuElement}
			class="absolute right-0 top-10 z-50 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
		>
			<div class="py-1">
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
			</div>
		</div>
	{/if}
</div>