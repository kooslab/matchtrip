<script lang="ts">
	// Carousel state
	let currentSlide = $state(0);
	let startX = $state(0);
	let isDragging = $state(false);

	const slides = [
		{
			title: '검색',
			description: '여행지,\n날짜,\n인원수를\n입력하세요',
			bgColor: 'bg-pink-100'
		},
		{
			title: '트립AI 추천',
			description: 'AI가 여행\n스케줄을\n만들어줘요',
			bgColor: 'bg-blue-100'
		},
		{
			title: '여행제안',
			description: '현지\n여행전문가\n들이 제안을\n해요',
			bgColor: 'bg-green-100'
		},
		{
			title: '여행 채팅',
			description: '나에게\n맞는\n여행전문가\n를 채팅하세요',
			bgColor: 'bg-yellow-100'
		},
		{
			title: '안전결제',
			description: '안전결제로\n안전하게\n결제하고\n예약을\n완료합니다',
			bgColor: 'bg-purple-100'
		},
		{
			title: '여행 및 리뷰',
			description: '여행전문가와\n함께\n프라이빗한\n여행을 즐기고\n리뷰도\n남겨보세요.',
			bgColor: 'bg-orange-100'
		}
	];

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + slides.length) % slides.length;
	}

	function goToSlide(index: number) {
		currentSlide = index;
	}

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		isDragging = true;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isDragging) return;

		const endX = e.changedTouches[0].clientX;
		const diffX = startX - endX;

		// Minimum swipe distance
		if (Math.abs(diffX) > 50) {
			if (diffX > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}

		isDragging = false;
	}

	function handleMouseDown(e: MouseEvent) {
		startX = e.clientX;
		isDragging = true;
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDragging) return;

		const endX = e.clientX;
		const diffX = startX - endX;

		// Minimum swipe distance
		if (Math.abs(diffX) > 50) {
			if (diffX > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}

		isDragging = false;
	}
</script>

<!-- Onboarding Section -->
<section class="border-b bg-white px-4 py-12 md:py-20">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 text-center">
			<h2 class="mb-4 text-3xl font-bold text-gray-900">🎯 Match Trip 사용방법</h2>
			<p class="text-lg text-gray-600">간단한 단계로 완벽한 여행을 계획하세요</p>
		</div>

		<!-- Carousel Container -->
		<div class="relative overflow-hidden">
			<!-- Mobile Screen Carousel -->
			<div
				class="flex cursor-grab transition-transform duration-300 ease-in-out active:cursor-grabbing"
				style="transform: translateX(-{currentSlide * 100}%)"
				ontouchstart={handleTouchStart}
				ontouchend={handleTouchEnd}
				onmousedown={handleMouseDown}
				onmouseup={handleMouseUp}
			>
				{#each slides as slide, index}
					<div class="flex w-full flex-shrink-0 justify-center">
						<div class="flex flex-col items-center">
							<div
								class="mb-4 h-96 w-56 rounded-3xl border-4 border-gray-800 bg-white p-4 shadow-xl"
							>
								<div class="mb-4 h-6 w-full rounded-full bg-gray-900"></div>
								<div class="space-y-4">
									<div class="text-center">
										<h3 class="text-lg font-bold text-gray-900">{slide.title}</h3>
										<p class="mt-2 text-sm whitespace-pre-line text-gray-600">
											{slide.description}
										</p>
									</div>
									<div class="mx-auto h-32 w-32 rounded-lg {slide.bgColor}"></div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Navigation Arrows -->
			<button
				class="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
				onclick={prevSlide}
				disabled={currentSlide === 0}
			>
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>

			<button
				class="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
				onclick={nextSlide}
				disabled={currentSlide === slides.length - 1}
			>
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Dots Indicator -->
		<div class="mt-8 text-center">
			<p class="mb-4 text-lg font-semibold text-gray-700">
				총 {slides.length}개 컷 (좌우로 스와이핑)
			</p>
			<div class="flex justify-center space-x-2">
				{#each slides as _, index}
					<button
						class="h-3 w-3 rounded-full transition-colors {currentSlide === index
							? 'bg-blue-600'
							: 'bg-gray-300'}"
						onclick={() => goToSlide(index)}
						aria-label="슬라이드 {index + 1}로 이동"
					>
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>
