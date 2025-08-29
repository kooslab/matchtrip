<script lang="ts">
	import { browser } from '$app/environment';
	import logoUrl from '$lib/images/Matchtrip.svg';

	let { children } = $props();

	let isDesktop = $state(false);

	$effect(() => {
		if (browser) {
			const checkDesktop = () => {
				isDesktop = window.innerWidth >= 1024;
			};

			checkDesktop();
			window.addEventListener('resize', checkDesktop);

			return () => {
				window.removeEventListener('resize', checkDesktop);
			};
		}
	});
</script>

{#if isDesktop}
	<div
		class="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
	>
		<div class="relative flex h-full items-center justify-center">
			<!-- Scale container to fit viewport height -->
			<div class="relative" style="height: 100vh; width: calc(100vh * 393 / 852);">
				<!-- Phone frame as background -->
				<img
					src="/layout.png"
					alt="Phone frame"
					class="pointer-events-none absolute inset-0 z-50 h-full w-full"
					style="object-fit: fill;"
				/>

				<!-- Content wrapper with scale transform to fit inside phone -->
				<div class="absolute inset-0 flex items-center justify-center">
					<div
						class="relative overflow-hidden bg-white"
						style="
							width: 90%;
							height: 88%;
							border-radius: 38px;
							transform: translateY(-1%);
						"
					>
						<!-- Status bar - positioned absolutely to always be visible -->
						<div
							class="absolute top-0 right-0 left-0 z-50 flex h-11 items-center justify-between bg-white px-6 pt-2"
							style="border-radius: 38px 38px 0 0;"
						>
							<!-- Matchtrip logo on the left -->
							<img src={logoUrl} alt="Matchtrip" class="h-5" />

							<!-- Status icons on the right -->
							<div class="flex items-center gap-1.5">
								<img src="/signal.svg" alt="Signal" class="h-3.5 w-3.5" />
								<img src="/wifi.svg" alt="WiFi" class="h-3.5 w-3.5" />
								<img src="/battery.svg" alt="Battery" class="h-3.5 w-6" />
							</div>
						</div>

						<!-- App content container - adjusted to account for fixed status bar -->
						<div
							class="h-full w-full overflow-x-hidden overflow-y-auto pt-11"
							style="padding-bottom: 50px;"
						>
							{@render children()}
						</div>

						<!-- Home indicator -->
						<div
							class="absolute bottom-3 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-black"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
