<script lang="ts">
	import { browser } from '$app/environment';

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
	<div class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
		<div class="relative flex items-center justify-center h-full">
			<!-- Scale container to fit viewport height -->
			<div class="relative" style="height: 100vh; width: calc(100vh * 393 / 852);">
				<!-- Phone frame as background -->
				<img
					src="/layout.png"
					alt="Phone frame"
					class="absolute inset-0 w-full h-full pointer-events-none z-50"
					style="object-fit: fill;"
				/>
				
				<!-- Content wrapper with scale transform to fit inside phone -->
				<div class="absolute inset-0 flex items-center justify-center">
					<div 
						class="bg-white overflow-hidden"
						style="
							width: 90%;
							height: 88%;
							border-radius: 38px;
							transform: translateY(-1%);
						"
					>
						<!-- Status bar -->
						<div class="sticky top-0 h-11 bg-white z-40 flex items-center justify-end px-6 pt-2">
							<div class="flex items-center gap-1.5">
								<img src="/signal.svg" alt="Signal" class="h-3.5 w-3.5" />
								<img src="/wifi.svg" alt="WiFi" class="h-3.5 w-3.5" />
								<img src="/battery.svg" alt="Battery" class="h-3.5 w-6" />
							</div>
						</div>

						<!-- App content container -->
						<div class="h-full w-full overflow-y-auto overflow-x-hidden" style="padding-bottom: 50px;">
							{@render children()}
						</div>

						<!-- Home indicator -->
						<div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
