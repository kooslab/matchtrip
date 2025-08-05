<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ChevronDown, ChevronUp, Bell } from 'lucide-svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import AgreementModal from '$lib/components/AgreementModal.svelte';
	import logo from '$lib/images/Matchtrip.png';
	import logoHQ from '$lib/images/Matchtrip-hq.jpg';
	import bgImage from '$lib/images/bg.png';
	import beachImage from '$lib/images/beach.png';

	// Props from load function
	const { data } = $props();

	// Get user data from props
	const user = $derived(data?.user);
	const userRole = $derived(data?.userRole);
	const isGuide = $derived(userRole === 'guide');
	const isTraveler = $derived(userRole === 'traveler');

	// Agreement modal state
	let showAgreementModal = $state(false);

	// Loading states for social login
	let loadingProvider = $state<'kakao' | 'google' | null>(null);

	// Check if user needs to agree to terms when user data changes
	$effect(() => {
		if (user && !data?.hasAgreedToTerms) {
			showAgreementModal = true;
		}
	});

	// Random recommendation messages
	const recommendationMessages = [
		'가족과 함께 하기 좋은',
		'혼자 여행하기 좋은',
		'커플이 가기 좋은',
		'친구들과 함께하기 좋은',
		'모험을 즐기기 좋은',
		'휴식을 취하기 좋은',
		'문화를 체험하기 좋은',
		'음식을 즐기기 좋은',
		'자연을 만끽하기 좋은',
		'액티비티가 많은'
	];

	// Get random recommendation
	const randomMessage = $derived(
		recommendationMessages[Math.floor(Math.random() * recommendationMessages.length)]
	);
	const randomDestination = $derived(
		data.displayDestinations?.length > 0
			? data.displayDestinations[Math.floor(Math.random() * data.displayDestinations.length)]
			: null
	);

	// Collapsible states
	let supportOpen = $state(false);
	let partnershipOpen = $state(false);
	let businessInfoOpen = $state(false);

</script>

{#if user}
	<!-- Logged in user layout -->
	<div class="min-h-screen bg-gray-50">
		<div class="mx-auto min-h-screen max-w-[430px] bg-white">
			<!-- Header -->
			<header class="sticky top-0 z-50 bg-white shadow-sm">
				<div class="flex items-center justify-between px-4 py-4">
					<button onclick={() => goto('/')} class="flex items-center">
						<img src={logo} alt="Matchtrip" class="h-4 w-auto" />
					</button>
					<button class="relative p-2">
						<Bell class="h-6 w-6 text-gray-600" />
						<span class="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
					</button>
				</div>
			</header>

			<!-- Main Content -->
			<main class="pb-24">
				{#if isGuide}
					<!-- Guide Specific Content -->
					<section class="bg-white p-4">
						<div class="flex items-center gap-2 text-xs text-gray-500">
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							<span>Berlin, Germany</span>
						</div>
						<h2 class="mt-3 text-xl leading-tight font-bold text-gray-900">
							안녕하세요 <span class="text-blue-500">{user?.name || '여행자'}님</span>,
						</h2>
						<h3 class="mt-1 text-xl leading-tight font-bold text-gray-900">
							새로운 여행이 기다리고 있어요.
						</h3>

						<!-- Search Bar -->
						<div class="relative mt-5">
							<input
								type="text"
								placeholder="지금 가이드 활동을 시작해 보세요!"
								class="w-full rounded-full bg-gray-50 py-3.5 pr-14 pl-5 text-base text-gray-700 placeholder-gray-400 cursor-pointer"
								readonly
								onclick={() => goto('/trips')}
							/>
							<button
								onclick={() => goto('/trips')}
								class="absolute top-1/2 right-1.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 shadow-sm transition-colors hover:bg-blue-600"
							>
								<svg
									class="h-5 w-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</button>
						</div>
					</section>

					<!-- Guide Banner Section -->
					<section class="mt-3 bg-white p-4">
						<div
							class="flex items-center justify-between overflow-hidden rounded-2xl bg-gray-50 p-5"
						>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-500">What is Lorem Ipsum</p>
								<h3 class="mt-0.5 text-lg font-bold text-gray-900">What is Lorem Ipsum</h3>
							</div>
							<div class="relative -mr-5 h-28 w-28">
								<img src={beachImage} alt="Beach umbrella" class="h-full w-full object-contain" />
							</div>
						</div>
						<div class="mt-3 flex justify-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full bg-gray-800"></span>
							<span class="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
							<span class="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
							<span class="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
						</div>
					</section>
				{:else if isTraveler}
					<!-- Traveler Specific Content (Original) -->
					<!-- Recommendation Section -->
					{#if randomDestination}
						<section class="bg-white p-4">
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<span
									>{randomDestination.city}, {randomDestination.country?.name ||
										randomDestination.country}</span
								>
							</div>
							<h2 class="mt-2 text-lg font-medium text-gray-900">
								{randomMessage} <span class="text-blue-600">{randomDestination.city}</span> 어때요?
							</h2>

							<!-- Search Bar -->
							<div class="relative mt-5">
								<input
									type="text"
									placeholder="어디로 가고 싶으신가요?"
									class="w-full rounded-full bg-gray-50 py-3.5 pr-14 pl-5 text-base text-gray-700 placeholder-gray-400 cursor-pointer"
									readonly
									onclick={() => goto('/my-trips/create/destination')}
								/>
								<button
									onclick={() => goto('/my-trips/create/destination')}
									class="absolute top-1/2 right-1.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 shadow-sm transition-colors hover:bg-blue-600"
								>
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2.5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</button>
							</div>
						</section>
					{/if}
				{/if}

				<!-- Sample Destinations -->
				<section class="mt-4 bg-white p-4">
					{#if isGuide}
						<h3 class="mb-3 text-sm text-gray-500">내가 필요한 여행자를 찾고 계신가요?</h3>
						<h2 class="mb-4 flex items-center justify-between text-lg font-bold text-gray-900">
							여행자 찾기
							<button onclick={() => goto('/trips')} class="text-blue-500">
								<svg
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</h2>
					{:else}
						<h3 class="mb-3 text-sm text-gray-500">나에게 맞는 가이드를 찾고 계신가요?</h3>
						<h2 class="mb-4 flex items-center justify-between text-lg font-bold text-gray-900">
							매치트립 나라별 가이드
							<button onclick={() => goto('/products')} class="text-blue-500">
								<ChevronDown class="h-5 w-5" />
							</button>
						</h2>
					{/if}
					<div class="grid grid-cols-3 gap-3">
						{#each data.displayDestinations || [] as destination}
							<button
								onclick={() =>
									goto(
										isGuide
											? `/trips?destinations=${destination.id}`
											: `/products?destination=${destination.id}`
									)}
								class="overflow-hidden rounded-lg"
							>
								<div class="relative aspect-square">
									{#if destination.imageUrl}
										<img
											src={destination.imageUrl}
											alt={destination.city}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-gray-200">
											<span class="text-gray-400">No image</span>
										</div>
									{/if}
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
									></div>
									<div class="absolute bottom-2 left-2 text-left">
										<h3 class="text-base font-semibold text-white">{destination.city}</h3>
										<p class="text-xs text-white/90">
											{destination.country?.name || destination.country}
										</p>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</section>

				<!-- Customer Support Center -->
				<section class="mt-4 bg-white">
					<button
						onclick={() => (supportOpen = !supportOpen)}
						class="flex w-full items-center justify-between p-4"
					>
						<span class="text-lg font-semibold text-gray-900">고객센터</span>
						{#if supportOpen}
							<ChevronUp class="h-5 w-5 text-blue-500" />
						{:else}
							<svg
								class="h-5 w-5 text-blue-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						{/if}
					</button>
					{#if supportOpen}
						<div class="border-t px-4 pb-4">
							<div class="space-y-3 pt-4">
								<a href="/contact" class="block text-sm text-gray-600 hover:text-blue-600">
									문의하기
								</a>
								<a href="/terms/service" class="block text-sm text-gray-600 hover:text-blue-600">
									이용약관
								</a>
								<a href="/terms/privacy" class="block text-sm text-gray-600 hover:text-blue-600">
									개인정보처리방침
								</a>
								<a
									href="/terms/refund-policy"
									class="block text-sm text-gray-600 hover:text-blue-600"
								>
									취소 및 환불 정책
								</a>
							</div>
						</div>
					{/if}
				</section>

				<!-- Affiliate Marketing Partnership -->
				<section class="mt-4 bg-white">
					<button
						onclick={() => (partnershipOpen = !partnershipOpen)}
						class="flex w-full items-center justify-between p-4"
					>
						<span class="text-lg font-semibold text-gray-900">제휴 문의</span>
						{#if partnershipOpen}
							<ChevronUp class="h-5 w-5 text-blue-500" />
						{:else}
							<svg
								class="h-5 w-5 text-blue-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						{/if}
					</button>
					{#if partnershipOpen}
						<div class="border-t px-4 pb-4">
							<div class="space-y-3 pt-4">
								<p class="text-sm text-gray-600">매치트립과 함께 성장하고 싶으신가요?</p>
								<a
									href="/terms/marketing"
									class="block text-sm font-medium text-blue-600 hover:text-blue-700"
								>
									제휴 안내 보기
								</a>
								<a
									href="mailto:help@agentt.kr"
									class="block text-sm font-medium text-blue-600 hover:text-blue-700"
								>
									이메일로 문의하기
								</a>
							</div>
						</div>
					{/if}
				</section>

				<!-- Footer -->
				<footer class="mt-8 bg-gray-100 p-4 text-center">
					<div class="space-y-4">
						<div class="flex justify-center gap-3 text-xs text-gray-500">
							<a href="/terms/service" class="hover:text-gray-700">이용약관</a>
							<span>|</span>
							<a href="/terms/privacy" class="hover:text-gray-700">개인정보처리방침</a>
							<span>|</span>
							<a href="/terms/refund-policy" class="hover:text-gray-700">취소 및 환불 정책</a>
							<span>|</span>
							<a href="/terms/marketing" class="hover:text-gray-700">제휴 안내</a>
						</div>
						<!-- Business Info with Chevron -->
						<button
							onclick={() => (businessInfoOpen = !businessInfoOpen)}
							class="mx-auto mb-3 flex items-center justify-center gap-2 text-xs text-gray-600 transition-colors hover:text-gray-800"
						>
							<span>에이전트티 사업자 정보</span>
							{#if businessInfoOpen}
								<ChevronUp class="h-3.5 w-3.5 text-blue-500" />
							{:else}
								<ChevronDown class="h-3.5 w-3.5 text-blue-500" />
							{/if}
						</button>

						{#if businessInfoOpen}
							<div class="mb-3 space-y-1 text-xs text-gray-500">
								<div>대표자 : 진민수 E-mail : j@agentt.kr</div>
								<div>전화 : 010-8200-4994 (독일 +49 174 4360256)</div>
								<div>주소 : 경기도 화성시 메타폴리스로 42 9층 901호 A13호 (반송동, 디앤씨빌딩)</div>
								<div>사업자등록번호 : 126-56-00745 통신판매번호 : 2024-화성동탄-1329호</div>
							</div>
						{/if}

						<p class="text-xs text-gray-400">
							매치트립은 통신판매중개자이며, 통신판매의 당사자가 아닙니다.<br />
							상품, 상품정보, 거래에 관한 의무와 책임은 판매자에게 있습니다.
						</p>
						<p class="text-xs text-gray-500">© 2025 Matchtrip. All rights reserved.</p>
					</div>
				</footer>
			</main>

			<!-- Bottom Navigation -->
			{#if isTraveler}
				<BottomNav />
			{:else if isGuide}
				<GuideBottomNav />
			{/if}
		</div>
	</div>
{:else}
	<!-- Non-logged in user layout -->
	<div class="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-cover bg-center bg-no-repeat"
			style="background-image: url({bgImage})"
		>
			<!-- Dark overlay -->
			<div class="absolute inset-0 bg-black/30"></div>
		</div>

		<!-- Content -->
		<div class="relative z-10 flex h-full flex-col">
			<!-- Main content -->
			<div class="flex flex-1 flex-col items-center justify-end px-8 pb-32 text-center text-white">
				<h1
					class="mb-4 text-5xl font-bold text-white"
					style="font-family: 'Pretendard', sans-serif;"
				>
					Matchtrip
				</h1>
				<p class="mb-8 text-lg text-gray-300">Match Your Trip, Make It Yours</p>
			</div>

			<!-- Bottom section -->
			<div class="px-6 pb-8">
				<p class="mb-6 text-center text-white">Sign in with Social Networks</p>

				<!-- Social login buttons -->
				<div class="mb-8 flex justify-center gap-4">
					<button
						onclick={async () => {
							if (loadingProvider) return;
							loadingProvider = 'kakao';
							try {
								const { signIn } = await import('$lib/authClient');
								await signIn.social({
									provider: 'kakao'
								});
							} catch (error) {
								console.error('Kakao login error:', error);
								window.alert('카카오 로그인에 실패했습니다.');
								loadingProvider = null;
							}
						}}
						class="relative flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={loadingProvider !== null}
					>
						{#if loadingProvider === 'kakao'}
							<div class="absolute inset-0 flex items-center justify-center">
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"
								></div>
							</div>
						{:else}
							<svg class="h-6 w-6" viewBox="0 0 24 24">
								<path
									fill="#000000"
									d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.939-.123.49.18.483.376.351.155-.103 2.466-1.675 3.464-2.353.541.08 1.1.12 1.67.12 4.97 0 9-3.186 9-7.116C21 6.185 16.97 3 12 3z"
								/>
							</svg>
						{/if}
					</button>
					<button
						onclick={async () => {
							if (loadingProvider) return;
							loadingProvider = 'google';
							try {
								const { signIn } = await import('$lib/authClient');
								await signIn.social({
									provider: 'google'
								});
							} catch (error) {
								console.error('Google login error:', error);
								window.alert('구글 로그인에 실패했습니다.');
								loadingProvider = null;
							}
						}}
						class="relative flex h-12 w-12 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={loadingProvider !== null}
					>
						{#if loadingProvider === 'google'}
							<div class="absolute inset-0 flex items-center justify-center">
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"
								></div>
							</div>
						{:else}
							<svg class="h-6 w-6" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
						{/if}
					</button>
				</div>

				<!-- Bottom text -->
				<p class="text-center text-sm text-white/80">@Matchtrip.corp.</p>
			</div>

			<!-- Bottom bar indicator -->
			<div class="flex justify-center pb-2">
				<div class="h-1 w-32 rounded-full bg-white"></div>
			</div>
		</div>
	</div>
{/if}

<!-- Agreement Modal -->
<AgreementModal isOpen={showAgreementModal} {user} />
