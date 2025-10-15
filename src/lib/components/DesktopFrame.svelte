<script lang="ts">
	import IconWifiMono from '$lib/icons/icon-wifi-mono.svg?raw';
	import IconMobileSignal from '$lib/icons/icon-mobile-signal.svg?raw';
	import IconBattery from '$lib/icons/icon-battery.svg?raw';
	import MatchTripLogo from '$lib/images/Matchtrip.svg';
	import { afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';

	let { children } = $props();
	let phoneContentWrapper: HTMLDivElement;

	// Reset scroll position on navigation
	afterNavigate(() => {
		if (browser && phoneContentWrapper) {
			phoneContentWrapper.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}
	});
</script>

<div class="desktop-container">
	<!-- Left side content -->
	<div class="left-content">
		<div class="logo-text">
			<svg width="180" height="40" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<text x="0" y="30" fill="#052236" font-family="Pretendard" font-size="24" font-weight="700">MatchTrip</text>
			</svg>
		</div>
		
		<div class="hero-content">
			<h1 class="hero-title">
				<span class="font-light">가이드와 여행자를 연결하는</span><br/>
				<span class="font-bold">가장 스마트한 방법</span>
			</h1>
			
			<div class="app-download">
				<div class="qr-container">
					<img src="/qr.jpg" alt="Download QR" class="qr-code" />
				</div>
			</div>
		</div>
		
		<div class="copyright">
			© Matchtrip.corp.
		</div>
	</div>
	
	<!-- Mobile phone frame -->
	<div class="phone-wrapper">
		<div class="phone-frame">
			<div class="phone-container">
				<div class="phone-screen">
					<!-- Status bar -->
					<div class="flex h-11 w-full items-center justify-between bg-white px-5 flex-shrink-0 pt-2 rounded-t-[38px]">
						<!-- Left side - Logo -->
						<a href="/" class="flex items-center relative z-10">
							<img src={MatchTripLogo} alt="Matchtrip" class="h-5 w-auto" />
						</a>
						
						<!-- Right side - Status icons -->
						<div class="flex items-center gap-1.5">
							<!-- Mobile signal icon -->
							<div class="h-[15px] w-auto [&>svg]:h-full [&>svg]:w-auto">
								{@html IconMobileSignal}
							</div>
							
							<!-- Wifi icon -->
							<div class="h-5 w-5 [&>svg]:h-full [&>svg]:w-full">
								{@html IconWifiMono}
							</div>
							
							<!-- Battery icon -->
							<div class="h-4 w-auto [&>svg]:h-full [&>svg]:w-auto">
								{@html IconBattery}
							</div>
						</div>
					</div>
					
					<!-- Content -->
					<div class="phone-content-wrapper" bind:this={phoneContentWrapper}>
						{@render children()}
					</div>
				</div>
				<!-- Home indicator -->
				<div class="phone-home-indicator"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.desktop-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		overflow: hidden;
		background: #f8f9fa;
	}
	
	/* Left content */
	.left-content {
		position: absolute;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 375px;
		height: calc(100vh - 120px);
		left: 140px;
		top: 60px;
		bottom: 60px;
		z-index: 10;
	}
	
	.logo-text {
		margin-bottom: 2rem;
	}
	
	.hero-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	
	.hero-title {
		margin-bottom: 2.5rem;
		color: var(--color-text-primary);
		font-size: 48px;
		line-height: 72px;
		font-family: Pretendard, sans-serif;
	}
	
	.hero-title .font-light {
		font-weight: 300;
	}
	
	.hero-title .font-bold {
		font-weight: 700;
	}
	
	.app-download {
		display: inline-block;
	}
	
	.qr-container {
		padding: 8px;
		display: inline-block;
		background: rgba(0, 62, 129, 0.08);
		border-radius: 28px;
	}
	
	.qr-code {
		display: block;
		width: 140px;
		height: 140px;
		background: white;
		border-radius: 20px;
		object-fit: contain;
	}
	
	.copyright {
		color: #C1C1C1;
		font-size: 20px;
		font-family: Pretendard, sans-serif;
		font-weight: 700;
		line-height: 32px;
	}
	
	/* Phone frame */
	.phone-wrapper {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 50;
		height: 100vh;
		width: calc(100vh * 393 / 852);
	}
	
	.phone-frame {
		position: relative;
		width: 100%;
		height: 100%;
	}
	
	.phone-shadow {
		display: none;
	}
	
	.phone-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.phone-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: url('/layout.png');
		background-size: cover;
		background-position: center;
		z-index: 1;
		pointer-events: none;
	}
	
	.phone-screen {
		position: relative;
		width: 90%;
		height: 88%;
		background: white;
		border-radius: 38px;
		overflow: hidden;
		transform: translateY(-1%);
		display: flex;
		flex-direction: column;
		z-index: 0;
	}
	
	.phone-content-wrapper {
		width: 100%;
		flex: 1;
		overflow-x: hidden;
		overflow-y: auto;
		padding-bottom: 50px;
	}
	
	/* Ensure proper layout */
	.phone-content-wrapper :global(.max-w-\[430px\]) {
		max-width: 100% !important;
	}
	
	.phone-notch {
		display: none;
	}
	
	.phone-home-indicator {
		position: absolute;
		width: 134px;
		height: 5px;
		background: #000;
		border-radius: 100px;
		bottom: 12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
	}
	
	/* Responsive adjustments */
	@media (max-width: 1440px) {
		.left-content {
			left: 60px;
		}
	}
	
	@media (max-width: 1280px) {
		.desktop-container {
			display: none;
		}
	}
</style>