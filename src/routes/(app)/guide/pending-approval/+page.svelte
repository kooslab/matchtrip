<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import image01 from '$lib/images/after_onboarding_guide_01.png';
	import image02 from '$lib/images/after_onboarding_guide_02.png';
	import image03 from '$lib/images/after_onboarding_guide_03.png';
	import penImage from '$lib/images/pen.png';
	import magnifyGlassImage from '$lib/images/magnify_glass.png';
	import moneyImage from '$lib/images/money.png';

	interface Props {
		data: {
			user: {
				name: string;
				email: string;
				phone?: string;
			};
			guideProfile: {
				isVerified: boolean;
				createdAt: string;
			};
		};
	}

	let { data }: Props = $props();
	let currentSlide = $state(0);

	const slides = [
		{
			bgImage: image01,
			overlayImage: penImage,
			title: '가이드 등록 전에,\n먼저 자격을 확인해요',
			description: '서류에 문제가 없는지 검토가 필요하며,\n영업일 기준 3일 정도 소요될 수 있어요.'
		},
		{
			bgImage: image02,
			overlayImage: magnifyGlassImage,
			title: '나에게 맞는 여행을 찾아\n일정을 제안해 보세요',
			description:
				'활동 지역과 가능한 일정, 관심 분야에 따라\n딱 맞는 여행 제안만 선별해서 확인할 수 있어요.'
		},
		{
			bgImage: image03,
			overlayImage: moneyImage,
			title: '복잡한 서류 없이,\n간편하게!',
			description:
				'정산에 필요한 정보는 미리 등록해두면 편!\n매번 서류를 제출할 필요 없이 간편하게 받을 수 있어요.'
		}
	];

	const nextSlide = () => {
		if (currentSlide < slides.length - 1) {
			currentSlide++;
		}
	};

	const prevSlide = () => {
		if (currentSlide > 0) {
			currentSlide--;
		}
	};

	const goToSlide = (index: number) => {
		currentSlide = index;
	};

	// Check verification status every 30 seconds
	onMount(() => {
		const interval = setInterval(() => {
			invalidate('app:guide-verification');
		}, 30000);

		return () => clearInterval(interval);
	});
</script>

<div class="fixed inset-0 z-50 bg-white">
	<div class="relative h-full w-full max-w-md mx-auto">
		<!-- Carousel Container -->
		<div class="h-full">
			<div class="relative h-full overflow-hidden">
				{#each slides as slide, index}
					<div
						class="absolute inset-0 transition-all duration-300 ease-in-out"
						style="transform: translateX({(index - currentSlide) * 100}%); opacity: {index === currentSlide ? 1 : 0};"
					>
						<div class="flex h-full flex-col">
							<!-- Top 60% - Background Image Area -->
							<div class="relative h-[60%] flex items-end justify-center overflow-hidden px-2 pt-8">
								<!-- Background Image - show 3/4 of height -->
								<img src={slide.bgImage} alt="" class="w-full object-contain" style="height: 75%; object-position: bottom;" />
								<!-- Overlay Image (pen, magnifying glass, money) - z-50 to be on top -->
								<img
									src={slide.overlayImage}
									alt=""
									class="absolute w-16 h-auto object-contain z-50"
									style="bottom: -5%; right: 10%;"
								/>
							</div>

							<!-- Bottom 40% - White Background with Text -->
							<div class="flex-1 bg-white flex flex-col items-center justify-start px-8 pt-12 pb-32">
								<!-- Title -->
								<h2 class="mb-4 whitespace-pre-line text-center text-2xl font-bold text-gray-900 leading-tight">
									{slide.title}
								</h2>

								<!-- Description -->
								<p class="whitespace-pre-line text-center text-base text-gray-600 leading-relaxed">
									{slide.description}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Navigation Dots and Buttons -->
		<div class="absolute bottom-8 left-0 right-0 px-6">
			<!-- Dots Indicator -->
			<div class="mb-8 flex items-center justify-center gap-2">
				{#each slides as _, index}
					<button
						onclick={() => goToSlide(index)}
						class="h-2 rounded-full transition-all duration-300 {index === currentSlide
							? 'w-8 bg-blue-500'
							: 'w-2 bg-gray-300'}"
						aria-label={`Go to slide ${index + 1}`}
					></button>
				{/each}
			</div>

			<!-- Navigation Buttons -->
			<div class="flex items-center justify-between">
				<!-- Previous Button -->
				{#if currentSlide > 0}
					<button
						onclick={prevSlide}
						class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
						aria-label="Previous slide"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
				{:else}
					<div class="h-14 w-14"></div>
				{/if}

				<!-- Spacer -->
				<div class="flex-1"></div>

				<!-- Next Button -->
				{#if currentSlide < slides.length - 1}
					<button
						onclick={nextSlide}
						class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
						aria-label="Next slide"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				{:else}
					<div class="h-14 w-14"></div>
				{/if}
			</div>
		</div>
	</div>
</div>
