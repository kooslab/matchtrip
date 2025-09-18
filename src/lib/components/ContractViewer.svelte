<script lang="ts">
	import { onMount } from 'svelte';
	import { contractTerms } from '$lib/constants/contractTerms';

	interface Props {
		onScrollComplete?: () => void;
		onProgressUpdate?: (progress: number) => void;
		userName?: string;
		userBirthDate?: string;
		userAddress?: string;
		contractDate?: string;
	}

	let { onScrollComplete, onProgressUpdate, userName, userBirthDate, userAddress, contractDate }: Props = $props();
	
	// Format birthdate for display
	let formattedBirthDate = $derived(() => {
		if (!userBirthDate) return null;
		const parts = userBirthDate.split('-');
		if (parts.length === 3) {
			return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
		}
		return userBirthDate;
	});

	let containerRef: HTMLDivElement;
	let scrollProgress = $state(0);
	let hasReachedBottom = $state(false);
	let viewedSections = $state(new Set<string>());

	onMount(() => {
		if (!containerRef) return;

		// Create intersection observer for tracking viewed sections
		const sections = containerRef.querySelectorAll('.contract-section');
		const totalSections = sections.length;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const sectionId = entry.target.getAttribute('data-section-id');
						if (sectionId) {
							viewedSections.add(sectionId);
							const progress = Math.round((viewedSections.size / totalSections) * 100);
							scrollProgress = progress;
							onProgressUpdate?.(progress);

							// Check if all sections have been viewed
							if (viewedSections.size === totalSections && !hasReachedBottom) {
								hasReachedBottom = true;
								onScrollComplete?.();
							}
						}
					}
				});
			},
			{
				root: containerRef,
				threshold: 0.8 // Section is considered viewed when 80% is visible
			}
		);

		// Observe all sections
		sections.forEach((section) => observer.observe(section));

		// Also track manual scroll to bottom
		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = containerRef;
			const scrollPercentage = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);

			// Consider reached bottom when scrolled to 98% (to account for rounding)
			if (scrollPercentage >= 98 && !hasReachedBottom) {
				hasReachedBottom = true;
				scrollProgress = 100;
				onProgressUpdate?.(100);
				onScrollComplete?.();
			}
		};

		containerRef.addEventListener('scroll', handleScroll);

		return () => {
			observer.disconnect();
			containerRef?.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="contract-viewer">
	<!-- Progress Bar -->
	<div class="sticky top-0 z-10 bg-white border-b border-gray-200">
		<div class="px-4 py-2">
			<div class="flex items-center justify-between mb-1">
				<span class="text-xs font-medium text-gray-600">읽은 부분</span>
				<span class="text-xs font-bold text-blue-600">{scrollProgress}%</span>
			</div>
			<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
				<div
					class="h-full bg-blue-500 transition-all duration-300 ease-out"
					style="width: {scrollProgress}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Contract Content -->
	<div
		bind:this={containerRef}
		class="contract-content overflow-y-auto"
		style="height: calc(100vh - 200px); max-height: 600px;"
	>
		<div class="px-4 py-6 space-y-6">
			<!-- Title -->
			<div class="contract-section" data-section-id="title">
				<h1 class="text-xl font-bold text-center text-gray-900 mb-6">{contractTerms.title}</h1>

				<!-- Parties Information -->
				<div class="space-y-4 text-sm text-gray-700">
					<div>
						<p class="font-semibold">{contractTerms.parties.company.name}</p>
						<p class="text-xs">주소: {contractTerms.parties.company.address}</p>
						<p class="text-xs">사업자등록번호: {contractTerms.parties.company.businessNumber}</p>
					</div>

					<div>
						<p class="font-semibold">제휴자 (갑)</p>
						<p class="text-xs">{contractTerms.parties.affiliate.nameLabel}: <span class="font-semibold text-blue-600">{userName || '[이름 입력 필요]'}</span></p>
						<p class="text-xs">{contractTerms.parties.affiliate.addressLabel}: <span class="font-semibold text-blue-600">{userAddress || '[주소 입력 필요]'}</span></p>
						<p class="text-xs">
							{contractTerms.parties.affiliate.identifierLabel}: <span class="font-semibold text-blue-600">{formattedBirthDate() || '[생년월일 입력 필요]'}</span>
						</p>
					</div>
				</div>
			</div>

			<!-- Contract Sections -->
			{#each contractTerms.sections as section}
				<div class="contract-section" data-section-id={section.id}>
					<h2 class="text-lg font-bold text-gray-900 mb-3">
						[{section.title}]
					</h2>

					{#if section.content}
						<p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
							{section.content}
						</p>
					{/if}

					{#if section.subsections}
						<div class="space-y-3 mt-3">
							{#each section.subsections as subsection}
								<div class="ml-2">
									<div class="flex items-start">
										{#if subsection.number}
											<span class="font-semibold text-sm text-gray-700 mr-2">
												{subsection.number}.
											</span>
										{/if}
										<div class="flex-1">
											{#if subsection.title}
												<p class="font-semibold text-sm text-gray-700 mb-1">
													{subsection.title}
												</p>
											{/if}
											<p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
												{subsection.content}
											</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			<!-- Signature Section -->
			<div class="contract-section" data-section-id="signature">
				<div class="border-t pt-6 mt-8">
					{#if contractDate}
						<p class="text-sm text-gray-700 font-semibold mb-4">계약일: {contractDate}</p>
					{/if}
					<p class="text-sm text-gray-700">
						에이전트티(서비스명: 매치트립)<br/>
						대표 진민수 
						<span class="relative inline-block">
							(인)
							<!-- Seal image overlay on (인) -->
							<img 
								src="/api/seal?context=contract" 
								alt=""
								class="absolute w-auto h-8 opacity-80"
								style="top: -12px; left: -5px; pointer-events: none; max-width: none;"
								oncontextmenu={(e) => e.preventDefault()}
								ondragstart={(e) => e.preventDefault()}
								onerror={(e) => {
									// Hide image if it fails to load
									e.currentTarget.style.display = 'none';
								}}
							/>
						</span>
					</p>
					<p class="text-sm text-gray-700 mt-4">
						제휴자: <span class="font-semibold text-blue-600">{userName || '[이름]'}</span> (인)
					</p>
				</div>
			</div>

			<!-- Bottom Padding for scroll -->
			<div class="h-20"></div>
		</div>
	</div>

	<!-- Scroll Indicator for Mobile -->
	{#if !hasReachedBottom}
		<div class="absolute bottom-4 right-4 animate-bounce">
			<div class="bg-blue-500 text-white rounded-full p-2 shadow-lg">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
					/>
				</svg>
			</div>
		</div>
	{/if}
</div>

<style>
	.contract-viewer {
		position: relative;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.contract-content {
		scrollbar-width: thin;
		scrollbar-color: #cbd5e0 #f7fafc;
	}

	.contract-content::-webkit-scrollbar {
		width: 8px;
	}

	.contract-content::-webkit-scrollbar-track {
		background: #f7fafc;
	}

	.contract-content::-webkit-scrollbar-thumb {
		background-color: #cbd5e0;
		border-radius: 4px;
	}

	.contract-section {
		scroll-margin-top: 60px;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.animate-bounce {
		animation: bounce 2s infinite;
	}
</style>