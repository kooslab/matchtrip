<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, MapPin, Clock, Users, Globe, Star, MessageCircle } from 'lucide-svelte';
	
	const { data } = $props();
	
	const product = $derived(data.product);
	const user = $derived(data.user);
	
	// Handle booking - redirect to login if not authenticated
	const handleBook = () => {
		if (!user) {
			// Store the intended destination in sessionStorage
			sessionStorage.setItem('redirectAfterLogin', `/products/${product.id}`);
			goto('/login');
		} else {
			// Proceed with booking flow
			goto(`/chat/product/${product.id}`);
		}
	};
	
	// Handle contact guide - redirect to login if not authenticated
	const handleContactGuide = () => {
		if (!user) {
			sessionStorage.setItem('redirectAfterLogin', `/products/${product.id}`);
			goto('/login');
		} else {
			goto(`/chat/product/${product.id}`);
		}
	};
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b bg-white">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => goto('/products')} class="p-1">
					<ArrowLeft class="h-6 w-6 text-blue-500" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">상품 상세</h1>
				<div class="w-8"></div>
			</div>
		</header>

		<!-- Main Content -->
		<main class="pb-24">
			<!-- Product Image -->
			{#if product.imageUrl}
				<div class="relative aspect-video w-full">
					<img 
						src={product.imageUrl} 
						alt={product.title}
						class="h-full w-full object-cover"
					/>
				</div>
			{/if}

			<!-- Product Info -->
			<div class="p-4">
				<!-- Title and Price -->
				<div class="mb-4">
					<h1 class="mb-2 text-xl font-bold text-gray-900">{product.title}</h1>
					<div class="flex items-center justify-between">
						<span class="text-2xl font-bold text-blue-600">
							₩{product.price.toLocaleString()}
						</span>
						{#if product.rating}
							<div class="flex items-center gap-1">
								<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
								<span class="text-sm font-medium">{product.rating.toFixed(1)}</span>
								<span class="text-sm text-gray-500">({product.reviewCount})</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Location and Duration -->
				<div class="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
					<div class="flex items-center gap-1">
						<MapPin class="h-4 w-4" />
						<span>{product.destination.city}, {product.destination.country.name}</span>
					</div>
					<div class="flex items-center gap-1">
						<Clock class="h-4 w-4" />
						<span>{product.duration}</span>
					</div>
					{#if product.maxParticipants}
						<div class="flex items-center gap-1">
							<Users class="h-4 w-4" />
							<span>최대 {product.maxParticipants}명</span>
						</div>
					{/if}
					{#if product.languages?.length > 0}
						<div class="flex items-center gap-1">
							<Globe class="h-4 w-4" />
							<span>{product.languages.join(', ')}</span>
						</div>
					{/if}
				</div>

				<!-- Guide Info -->
				{#if product.guide}
					<div class="mb-6 rounded-lg border p-4">
						<div class="mb-2 text-sm font-semibold text-gray-700">가이드</div>
						<div class="flex items-center gap-3">
							{#if product.guideProfile?.profileImageUrl || product.guide.image}
								<img 
									src={product.guideProfile?.profileImageUrl || product.guide.image}
									alt={product.guide.name}
									class="h-12 w-12 rounded-full object-cover"
								/>
							{:else}
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
									<span class="text-lg font-semibold text-gray-600">
										{product.guide.name?.charAt(0) || '?'}
									</span>
								</div>
							{/if}
							<div>
								<div class="font-semibold">{product.guide.name}</div>
								{#if product.guideProfile?.yearsOfExperience}
									<div class="text-sm text-gray-600">
										경력 {product.guideProfile.yearsOfExperience}년
									</div>
								{/if}
							</div>
							<button
								onclick={() => goto(`/guide/${product.guide.id}`)}
								class="ml-auto text-sm text-blue-600 hover:underline"
							>
								프로필 보기
							</button>
						</div>
						{#if product.guideProfile?.bio}
							<p class="mt-3 text-sm text-gray-600">{product.guideProfile.bio}</p>
						{/if}
					</div>
				{/if}

				<!-- Description -->
				<div class="mb-6">
					<h2 class="mb-3 text-lg font-semibold">상품 소개</h2>
					<div class="whitespace-pre-wrap text-gray-700">
						{@html product.description}
					</div>
				</div>

				<!-- Attachments -->
				{#if product.attachments?.length > 0}
					<div class="mb-6">
						<h2 class="mb-3 text-lg font-semibold">추가 이미지</h2>
						<div class="grid grid-cols-2 gap-2">
							{#each product.attachments as attachment}
								<img 
									src={attachment.fileUrl}
									alt={attachment.fileName}
									class="aspect-square w-full rounded-lg object-cover"
								/>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Reviews -->
				{#if product.reviews?.length > 0}
					<div class="mb-6">
						<h2 class="mb-3 text-lg font-semibold">최근 리뷰</h2>
						<div class="space-y-3">
							{#each product.reviews as review}
								<div class="rounded-lg border p-3">
									<div class="mb-2 flex items-center justify-between">
										<div class="flex items-center gap-1">
											{#each Array(5) as _, i}
												<Star 
													class="h-4 w-4 {i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}"
												/>
											{/each}
										</div>
										<span class="text-xs text-gray-500">
											{new Date(review.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p class="text-sm text-gray-700">{review.content}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</main>

		<!-- Bottom Action Buttons -->
		<div class="fixed bottom-0 left-0 right-0 border-t bg-white">
			<div class="mx-auto max-w-[430px]">
				<div class="flex gap-2 p-4">
					<button
						onclick={handleContactGuide}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
					>
						<MessageCircle class="h-5 w-5" />
						문의하기
					</button>
					<button
						onclick={handleBook}
						class="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
					>
						{user ? '예약하기' : '로그인하고 예약'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>