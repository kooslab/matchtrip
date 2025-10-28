<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import AgreementModal from '$lib/components/AgreementModal.svelte';
	import AnnouncementModal from '$lib/components/AnnouncementModal.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import EventSection from '$lib/components/EventSection.svelte';

	// Props from load function
	const { data } = $props();

	// Get user data from props
	const user = $derived(data?.user);
	const fullUser = $derived(data?.fullUser);
	const userRole = $derived(data?.userRole);
	const isGuide = $derived(userRole === 'guide');
	const isTraveler = $derived(userRole === 'traveler');

	// Agreement modal state
	let showAgreementModal = $state(false);

	// Check if user needs to agree to terms when user data changes
	$effect(() => {
		// Only show agreement modal if we have a valid user with an ID
		if (user && user.id && !data?.hasAgreedToTerms) {
			console.log('[Main Page] Showing agreement modal for user:', user.id);
			showAgreementModal = true;
		} else if (user && !user.id) {
			console.warn('[Main Page] Invalid user object detected, clearing session');
			// Invalid user object - might be a stale session
			showAgreementModal = false;
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

	// Handle navigation to products
	function handleNavigateToProducts() {
		goto('/products');
	}
</script>

<!-- Main layout - accessible to all users -->
<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header - Hidden on desktop since MobileContainer handles it -->
		<header class="sticky top-0 z-50 bg-white shadow-sm lg:hidden">
			<div class="flex items-center px-4 py-4">
				<Logo />
			</div>
		</header>

		<!-- Main Content -->
		<main class="pb-24">
			{#if user && isGuide}
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
							안녕하세요 <span class="text-blue-500">{fullUser?.name || '가이드'}님</span>,
						</h2>
						<h3 class="mt-1 text-xl leading-tight font-bold text-gray-900">
							새로운 여행이 기다리고 있어요.
						</h3>

						<!-- Search Bar -->
						<div class="relative mt-5">
							<input
								type="text"
								placeholder="지금 가이드 활동을 시작해 보세요!"
								class="w-full cursor-pointer rounded-full bg-gray-50 py-3.5 pr-14 pl-5 text-base text-gray-700 placeholder-gray-400"
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

					<!-- Event Section -->
					<EventSection />

					<!-- Guide Banner Section -->
					<!-- <section class="mt-3 bg-white p-4">
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
					</section> -->
				{:else}
				<!-- Traveler & Non-authenticated Content (treat non-logged users as travelers) -->
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
									class="w-full cursor-pointer rounded-full bg-gray-50 py-3.5 pr-14 pl-5 text-base text-gray-700 placeholder-gray-400"
									readonly
									onclick={() => user ? goto('/my-trips/create/destination') : goto('/login')}
								/>
								<button
									onclick={() => user ? goto('/my-trips/create/destination') : goto('/login')}
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

						<!-- Event Section -->
						<EventSection />
					{/if}
				{/if}

				<!-- Sample Destinations -->
				<section class="mt-4 bg-white p-4">
					{#if user && isGuide}
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
						<button
							onclick={() => handleNavigateToProducts()}
							class="mb-4 flex w-full items-center justify-between text-lg font-bold text-gray-900 transition-colors hover:text-blue-600"
						>
							<span>매치트립 나라별 가이드</span>
							<ChevronDown class="h-5 w-5 text-blue-500" />
						</button>
					{/if}
					<div class="grid grid-cols-3 gap-3">
						{#each data.displayDestinations || [] as destination (destination.id)}
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
											loading="lazy"
											onerror={(e) => {
												// Show fallback if image fails to load
												const target = e.target as HTMLImageElement;
												target.style.display = 'none';
												const fallback = target.nextElementSibling as HTMLElement;
												if (fallback) fallback.style.display = 'flex';
											}}
										/>
										<div
											class="hidden h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500"
										>
											<svg
												class="h-12 w-12 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
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
										</div>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500"
										>
											<svg
												class="h-12 w-12 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
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
						<div class="flex justify-center gap-x-1.5 text-xs text-gray-500">
							<a href="/terms/service" class="whitespace-nowrap hover:text-gray-700">이용약관</a>
							<span>|</span>
							<a href="/terms/privacy" class="whitespace-nowrap hover:text-gray-700">개인정보처리방침</a>
							<span>|</span>
							<a href="/terms/refund-policy" class="whitespace-nowrap hover:text-gray-700">취소 및 환불 정책</a>
							<span>|</span>
							<a href="/terms/service-guide" class="whitespace-nowrap hover:text-gray-700">가이드 이용약관</a>
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
								<div>상호명 : 에이전트티　대표 : 진민수　개인정보책임자 : 진민수</div>
								<div>사업자 등록번호 : 126-56-00745</div>
								<div>통신판매업신고번호 : 제2024-화성동탄-1329호</div>
								<div>
									관광사업등록번호 : 제20244-00003호　이메일 : <a
										href="mailto:help@agentt.kr"
										class="text-gray-500 underline">help@agentt.kr</a
									>
								</div>
								<div>주소 : 경기도 화성시 메타폴리스로 42, 9층 901호 (반송동,디앤씨빌딩)</div>
							</div>
						{/if}

						<p class="text-xs text-gray-400">
							매치트립은 통신판매중개자이며, 통신판매의 당사자가 아닙니다.<br />
							상품, 상품정보, 거래에 관한 의무와 책임은 판매자에게 있습니다.
						</p>
						<p class="mt-3 text-xs text-gray-400">
							매치트립이 소유,운영,관리하는 웹사이트내의 상품, 판매자의정보, 사진, 디자인<br />
							등을 포함한 일체의 컨텐츠의 대한 무단복제, 배포,스크랩 등의 행위는 저작권법<br />
							등 관련 법령에 의해 엄격하게 금지합니다.<br />
							매치트립은 서울보증보험의 인허가보증보험에 가입되어 있습니다.<br />
							인허가 보증보험 : 3천만원
						</p>
						<p class="mt-4 text-xs text-gray-500">© 2025 MatchTrip. All rights reserved.</p>
					</div>
				</footer>
			</main>

		<!-- Bottom Navigation -->
		{#if user && isGuide}
			<GuideBottomNav />
		{:else}
			<!-- Traveler bottom nav for both logged-in travelers and non-logged users -->
			<BottomNav />
		{/if}
	</div>
</div>

<!-- Agreement Modal -->
<AgreementModal isOpen={showAgreementModal} {user} />

<!-- Announcement Modal -->
<AnnouncementModal />
