<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PaymentModal from '$lib/components/PaymentModal.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import bookmarkUrl from '$lib/icons/icon-bookmark-mono.svg';
	import chatBubbleUrl from '$lib/icons/icon-chat-bubble-dots-mono.svg';
	import downloadUrl from '$lib/icons/icon-download-mono.svg';
	import arrowRightUrl from '$lib/icons/icon-arrow-right-small-mono.svg';
	import pdfIconUrl from '$lib/icons/icon-document-mono.svg';
	import dotsIconUrl from '$lib/icons/icon-dots-four-horizontal-mono.svg';
	import { ChevronDown } from 'lucide-svelte';

	let { data } = $props();
	let offer = $derived(data.offer);
	let trip = $derived(data.trip);

	// Debug destination data
	$effect(() => {
		console.log('Trip data:', trip);
		console.log('Destination:', trip?.destination);
	});

	let showPaymentModal = $state(false);
	let processingAction = $state(false);
	let expandedSections = $state({
		content: false,
		files: false,
		cancellation: false,
		seller: false
	});

	function getOfferStatusText(status: string) {
		const statusMap: Record<string, string> = {
			pending: '검토중',
			accepted: '수락됨',
			rejected: '거절됨',
			withdrawn: '철회됨'
		};
		return statusMap[status] || status;
	}

	function getOfferStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			pending: '#19b989',
			accepted: '#1095f4',
			rejected: '#f72b2b',
			withdrawn: '#8ea0ac'
		};
		return colorMap[status] || '#8ea0ac';
	}

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj
			.toLocaleDateString('ko-KR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			})
			.replace(/\. /g, '. ')
			.replace(/\.$/, '');
	}

	function calculateRemainingDays() {
		const created = new Date(offer.createdAt);
		const now = new Date();
		const diffTime = now.getTime() - created.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		const remaining = 30 - diffDays; // Assuming 30 days validity
		return Math.max(0, remaining);
	}

	function calculateNightsAndDays(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const days = nights + 1;
		return `${nights}박 ${days}일`;
	}

	async function startConversation() {
		try {
			const response = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ offerId: offer.id })
			});

			if (response.ok) {
				const data = await response.json();
				goto(`/chat/${data.conversation.id}`);
			} else {
				console.error('Failed to create conversation');
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
		}
	}

	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
	}
</script>

<svelte:head>
	<title>{trip.destination?.city || '여행'} 제안 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-[rgba(255,255,255,0.92)] backdrop-blur-sm backdrop-filter">
		<div class="relative h-14 w-full shrink-0">
			<div
				class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
			/>
			<div class="relative flex size-full flex-col items-center justify-center">
				<div
					class="relative box-border flex h-14 w-full flex-col content-stretch items-center justify-center gap-2.5 px-4 py-2.5"
				>
					<div
						class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
					>
						<BackButton href="/my-trips/{trip.id}" />
						<div
							class="absolute left-1/2 translate-x-[-50%] text-center text-[16px] leading-[0] font-bold text-nowrap text-[#052236] not-italic"
							style="top: calc(50% - 12px)"
						>
							<p class="block leading-[24px] whitespace-pre">
								{trip.destination
									? `${trip.destination.city} ${trip.destination.country}`
									: '목적지'}
							</p>
						</div>
						<button class="relative size-5 shrink-0 overflow-clip">
							<img alt="" class="block size-full max-w-none" src={bookmarkUrl} />
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div
		class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-3 px-0 pt-2 pb-20"
	>
		<div
			class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 p-0"
		>
			<!-- Price and Status Section -->
			<div class="relative w-full shrink-0">
				<div
					class="pointer-events-none absolute top-0 right-0 bottom-[-4px] left-0 border-[0px_0px_4px] border-solid border-[#f7f9fa]"
				/>
				<div class="relative size-full">
					<div
						class="relative box-border flex w-full flex-col content-stretch items-start justify-start gap-3 p-[16px]"
					>
						<div
							class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-3 p-0"
						>
							<div class="flex items-baseline gap-1 text-[18px] leading-[28px]">
								<span class="font-extrabold text-[#052236]">{offer.price.toLocaleString()}원</span>
								<span class="text-[12px] font-normal text-[#c9ccce]">/ </span>
								<span class="text-[12px] font-normal text-[#8ea0ac]">제안 금액</span>
							</div>
						</div>
						<div
							class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-2 p-0"
						>
							<div
								class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 px-0 pt-0 pb-1"
							>
								<div
									class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
								/>
								<div
									class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
								>
									<div
										class="relative shrink-0 overflow-hidden text-left text-[13px] leading-[0] font-normal text-nowrap overflow-ellipsis text-[#8ea0ac] not-italic"
									>
										<p
											class="overflow-inherit block leading-[20px] [text-overflow:inherit] whitespace-pre"
										>
											현재 상태
										</p>
									</div>
									<div
										class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-center gap-2.5 rounded px-2 py-1"
										style="background-color: {getOfferStatusColor(offer.status)};"
									>
										<div
											class="pointer-events-none absolute inset-0 rounded border border-solid"
											style="border-color: {getOfferStatusColor(offer.status)};"
										/>
										<div
											class="relative shrink-0 text-left text-[11px] leading-[0] font-medium text-nowrap text-[#ffffff] not-italic"
										>
											<p class="block leading-[12px] whitespace-pre">
												{getOfferStatusText(offer.status)}
											</p>
										</div>
									</div>
								</div>
							</div>
							<div
								class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 px-0 pt-0 pb-1"
							>
								<div
									class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
								/>
								<div
									class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
								>
									<div
										class="relative shrink-0 overflow-hidden text-left text-[13px] leading-[0] font-normal text-nowrap overflow-ellipsis text-[#8ea0ac] not-italic"
									>
										<p
											class="overflow-inherit block leading-[20px] [text-overflow:inherit] whitespace-pre"
										>
											여행 일정
										</p>
									</div>
									<div
										class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0 text-left text-[13px] leading-[0] text-nowrap not-italic"
									>
										<div
											class="relative shrink-0 overflow-hidden font-normal overflow-ellipsis text-[#536b7c]"
										>
											<p
												class="overflow-inherit block leading-[20px] text-nowrap [text-overflow:inherit] whitespace-pre"
											>
												{formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
											</p>
										</div>
										<div
											class="relative shrink-0 overflow-hidden font-semibold overflow-ellipsis text-[#1095f4]"
										>
											<p
												class="overflow-inherit block text-[13px] leading-[20px] text-nowrap [text-overflow:inherit] whitespace-pre"
											>
												{calculateNightsAndDays(trip.startDate, trip.endDate)}
											</p>
										</div>
									</div>
								</div>
							</div>
							<div
								class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 px-0 pt-0 pb-1"
							>
								<div
									class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
								/>
								<div
									class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
								>
									<div
										class="relative shrink-0 overflow-hidden text-left text-[13px] leading-[0] font-normal text-nowrap overflow-ellipsis text-[#8ea0ac] not-italic"
									>
										<p
											class="overflow-inherit block leading-[20px] [text-overflow:inherit] whitespace-pre"
										>
											인원
										</p>
									</div>
									<div
										class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0"
									>
										<div
											class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start p-0 text-left text-[13px] leading-[0] font-normal text-nowrap not-italic"
										>
											<div class="relative shrink-0 text-[#536b7c]">
												<p class="block leading-[20px] text-nowrap whitespace-pre">
													성인 {trip.adultsCount}명
												</p>
											</div>
											{#if trip.childrenCount > 0}
												<div class="relative shrink-0 text-[#c1c1c1]">
													<p class="block leading-[20px] text-nowrap whitespace-pre">・</p>
												</div>
												<div class="relative shrink-0 text-[#536b7c]">
													<p class="block leading-[20px] text-nowrap whitespace-pre">
														아동 {trip.childrenCount}명
													</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
							<div
								class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 px-0 pt-0 pb-1"
							>
								<div
									class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f7f9fa]"
								/>
								<div
									class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0 text-left text-[13px] leading-[0] font-normal text-nowrap not-italic"
								>
									<div class="relative shrink-0 overflow-hidden overflow-ellipsis text-[#8ea0ac]">
										<p
											class="overflow-inherit block leading-[20px] text-nowrap [text-overflow:inherit] whitespace-pre"
										>
											선호 스타일
										</p>
									</div>
									<div class="relative shrink-0 text-[#536b7c]">
										<p class="block leading-[20px] text-nowrap whitespace-pre">
											{trip.travelStyle || '모험적인 여행'}
										</p>
									</div>
								</div>
							</div>
							<div
								class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 px-0 pt-0 pb-1"
							>
								<div
									class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0 text-left text-[13px] leading-[0] font-normal text-nowrap not-italic"
								>
									<div class="relative shrink-0 overflow-hidden overflow-ellipsis text-[#8ea0ac]">
										<p
											class="overflow-inherit block leading-[20px] text-nowrap [text-overflow:inherit] whitespace-pre"
										>
											관심 활동
										</p>
									</div>
									<div class="relative shrink-0 text-[#536b7c]">
										<p class="block leading-[20px] text-nowrap whitespace-pre">
											{trip.activities || '자연 / 아웃도어'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Offer Content Section -->
			<div class="relative w-full shrink-0">
				<div
					class="pointer-events-none absolute inset-[-4px] border-4 border-solid border-[#f7f9fa]"
				/>
				<div class="relative size-full">
					<div
						class="relative box-border flex w-full flex-col content-stretch items-start justify-start gap-2 p-[16px]"
					>
						<div
							class="relative box-border flex w-full shrink-0 flex-row content-stretch items-end justify-between p-0"
						>
							<div
								class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-1 p-0"
							>
								<div
									class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start p-0"
								>
									<button
										onclick={() => toggleSection('content')}
										class="relative box-border flex h-7 w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
									>
										<div
											class="relative min-h-px min-w-px shrink-0 grow basis-0 text-left text-[16px] leading-[0] font-bold text-[#052236] not-italic"
										>
											<p class="block leading-[24px] whitespace-pre-wrap">제안 내용</p>
										</div>
										<div class="relative flex h-[0px] w-[0px] shrink-0 items-center justify-center">
											<div class={expandedSections.content ? 'flex-none' : 'flex-none -rotate-270'}>
												<ChevronDown class="h-4 w-4" />
											</div>
										</div>
									</button>
								</div>
							</div>
						</div>
						<div class="relative w-full pt-2">
							{#if !expandedSections.content}
								<!-- Truncated content with gradient overlay -->
								<div class="relative">
									<div
										class="relative max-h-[100px] w-full overflow-hidden text-left text-[13px] leading-[20px] font-normal text-[#536b7c] not-italic"
									>
										{@html offer.itinerary || ''}
									</div>
									<!-- Gradient overlay -->
									<div
										class="pointer-events-none absolute right-0 bottom-0 left-0 h-12 bg-gradient-to-t from-white to-transparent"
									/>
								</div>

								<!-- Button container -->
								<div class="relative mt-4 w-full">
									<button
										onclick={() => (expandedSections.content = true)}
										class="flex w-full items-center justify-center rounded-lg border border-[#e8e8e8] bg-white px-6 py-3 transition-colors hover:bg-gray-50"
									>
										<span class="text-[12px] leading-[16px] font-semibold text-[#536b7c]"
											>자세히 보기</span
										>
									</button>
								</div>
							{:else}
								<!-- Full content -->
								<div
									class="w-full text-left text-[13px] leading-[20px] font-normal text-[#536b7c] not-italic"
								>
									{@html offer.itinerary || ''}
								</div>
								<div class="relative mt-4 w-full">
									<button
										onclick={() => (expandedSections.content = false)}
										class="flex w-full items-center justify-center rounded-lg border border-[#e8e8e8] bg-white px-6 py-3 transition-colors hover:bg-gray-50"
									>
										<span class="text-[12px] leading-[16px] font-semibold text-[#536b7c]">접기</span
										>
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Attached Files Section -->
			{#if offer.attachments && offer.attachments.length > 0}
				<div class="relative w-full shrink-0">
					<div
						class="pointer-events-none absolute top-0 right-0 bottom-[-4px] left-0 border-[0px_0px_4px] border-solid border-[#f7f9fa]"
					/>
					<div class="relative size-full">
						<div
							class="relative box-border flex w-full flex-col content-stretch items-start justify-start gap-2 p-[16px]"
						>
							<div
								class="relative box-border flex w-full shrink-0 flex-row content-stretch items-end justify-between p-0"
							>
								<div
									class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-1 p-0"
								>
									<div
										class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start p-0"
									>
										<button
											onclick={() => toggleSection('files')}
											class="relative box-border flex h-7 w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
										>
											<div
												class="relative min-h-px min-w-px shrink-0 grow basis-0 text-left text-[16px] leading-[0] font-bold text-[#052236] not-italic"
											>
												<p class="block leading-[24px]">첨부 파일</p>
											</div>
											<div
												class="relative flex h-[0px] w-[0px] shrink-0 items-center justify-center"
											>
												<div
													class={expandedSections.files ? 'flex-none' : 'flex-none rotate-[90deg]'}
												>
													<ChevronDown class="h-4 w-4" />
												</div>
											</div>
										</button>
									</div>
								</div>
							</div>
							{#if expandedSections.files}
								<div
									class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-2 px-0 py-3"
								>
									<div class="relative w-full shrink-0 rounded-xl bg-[rgba(0,62,129,0.02)]">
										<div class="relative flex size-full flex-col justify-center overflow-clip">
											<div
												class="relative box-border flex w-full flex-col content-stretch items-start justify-center gap-3 p-[12px]"
											>
												<div
													class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
												>
													<div
														class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-3 p-0"
													>
														<div
															class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-2.5 rounded-lg bg-[rgba(247,43,43,0.04)] p-[8px]"
														>
															<div class="relative size-6 shrink-0">
																<img
																	alt=""
																	class="block size-full max-w-none"
																	loading="lazy"
																	src={pdfIconUrl}
																/>
															</div>
														</div>
														<div
															class="relative box-border flex shrink-0 flex-col content-stretch items-start justify-center gap-1 p-0 leading-[0] text-nowrap not-italic"
														>
															<div
																class="relative shrink-0 text-center text-[13px] font-semibold text-[#052236]"
															>
																<p class="block leading-[20px] text-nowrap whitespace-pre">
																	여행제안.pdf
																</p>
															</div>
															<div
																class="relative shrink-0 text-left text-[11px] font-medium text-[#8ea0ac]"
															>
																<p class="block leading-[16px] text-nowrap whitespace-pre">3MB</p>
															</div>
														</div>
													</div>
													<button class="relative size-4 shrink-0 overflow-clip">
														<div
															class="absolute top-[7%] right-[6.333%] bottom-[8.75%] left-[6.25%]"
														>
															<img alt="" class="block size-full max-w-none" src={downloadUrl} />
														</div>
													</button>
												</div>
											</div>
										</div>
										<div
											class="pointer-events-none absolute inset-0 rounded-xl border border-solid border-[rgba(0,62,129,0)]"
										/>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- FAQ Sections -->
			<div class="relative w-full shrink-0 bg-[#ffffff]">
				<div
					class="pointer-events-none absolute top-0 right-0 bottom-[-4px] left-0 border-[0px_0px_4px] border-solid border-[#f7f9fa]"
				/>
				<div class="relative size-full">
					<div
						class="relative box-border flex w-full flex-col content-stretch items-start justify-start px-4 py-3"
					>
						<button
							onclick={() => toggleSection('cancellation')}
							class="relative box-border flex w-full shrink-0 flex-row content-stretch items-start justify-start gap-2 px-0 py-3"
						>
							<div
								class="pointer-events-none absolute inset-0 border-[0px_0px_1px] border-solid border-[#f1f1f1]"
							/>
							<div
								class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-row content-stretch items-end justify-between p-0"
							>
								<div
									class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-1 p-0"
								>
									<div
										class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start p-0"
									>
										<div
											class="relative box-border flex h-7 w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
										>
											<div
												class="relative min-h-px min-w-px shrink-0 grow basis-0 text-left text-[16px] leading-[0] font-bold text-[#052236] not-italic"
											>
												<p class="block leading-[24px]">취소 / 환불 안내</p>
											</div>
											<div class="relative size-4 shrink-0 overflow-clip">
												<div
													class="absolute top-[16.299%] right-[30.361%] bottom-[16.25%] left-[30.299%]"
												>
													<img alt="" class="block size-full max-w-none" src={arrowRightUrl} />
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</button>
						<button
							onclick={() => toggleSection('seller')}
							class="relative box-border flex w-full shrink-0 flex-row content-stretch items-start justify-start gap-2 px-0 py-3"
						>
							<div
								class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-row content-stretch items-end justify-between p-0"
							>
								<div
									class="relative box-border flex min-h-px min-w-px shrink-0 grow basis-0 flex-col content-stretch items-start justify-start gap-1 p-0"
								>
									<div
										class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start p-0"
									>
										<div
											class="relative box-border flex h-7 w-full shrink-0 flex-row content-stretch items-center justify-between p-0"
										>
											<div
												class="relative min-h-px min-w-px shrink-0 grow basis-0 text-left text-[16px] leading-[0] font-bold text-[#052236] not-italic"
											>
												<p class="block leading-[24px]">판매자 정보 고시</p>
											</div>
											<div class="relative size-4 shrink-0 overflow-clip">
												<div
													class="absolute top-[16.299%] right-[30.361%] bottom-[16.25%] left-[30.299%]"
												>
													<img alt="" class="block size-full max-w-none" src={arrowRightUrl} />
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Fixed Section -->
	<div class="fixed right-0 bottom-0 left-0 z-50 bg-white">
		<div class="mx-auto max-w-[430px]">
			<div
				class="box-border flex w-full flex-row content-stretch items-center justify-start gap-4 py-4 pr-4 pl-5 shadow-[0px_-4px_6px_-1px_rgba(0,0,0,0.1)]"
			>
				<button
					class="relative size-5 shrink-0 -rotate-90 overflow-clip opacity-40"
					onclick={() => {
						/* Handle dots menu */
					}}
				>
					<div class="absolute top-[13.454%] right-[13.454%] bottom-[13.454%] left-[13.454%]">
						<img alt="" class="block size-full max-w-none" src={dotsIconUrl} />
					</div>
				</button>
				<button
					onclick={startConversation}
					class="relative h-12 min-h-px min-w-px shrink-0 grow basis-0 rounded-[9px] bg-[#1095f4]"
				>
					<div class="relative flex size-full flex-row items-center justify-center">
						<div
							class="relative box-border flex h-12 w-full flex-row content-stretch items-center justify-center gap-2.5 px-6 py-3.5"
						>
							<div
								class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0"
							>
								<div class="relative size-4 shrink-0 overflow-clip">
									<div class="absolute top-[6.25%] right-[5.921%] bottom-[6.245%] left-[5.921%]">
										<svg
											width="24"
											height="24"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											class="block size-full max-w-none"
										>
											<path
												fill-rule="evenodd"
												clip-rule="evenodd"
												d="M16.98 12.747C16.7748 12.7522 16.5706 12.7162 16.3795 12.6412C16.1884 12.5662 16.0143 12.4538 15.8674 12.3104C15.7204 12.1671 15.6037 11.9958 15.524 11.8066C15.4443 11.6175 15.4032 11.4143 15.4033 11.209C15.4034 11.0037 15.4445 10.8005 15.5243 10.6114C15.6042 10.4223 15.721 10.2511 15.8681 10.1078C16.0151 9.96459 16.1893 9.85223 16.3805 9.77738C16.5716 9.70253 16.7758 9.6667 16.981 9.672C17.382 9.68236 17.763 9.84895 18.0429 10.1363C18.3228 10.4236 18.4794 10.8089 18.4793 11.21C18.4792 11.6111 18.3223 11.9963 18.0422 12.2834C17.7622 12.5706 17.381 12.7369 16.98 12.747ZM12.066 12.747C11.8607 12.7522 11.6564 12.7162 11.4651 12.6412C11.2739 12.5661 11.0997 12.4536 10.9526 12.3102C10.8056 12.1667 10.6888 11.9953 10.609 11.806C10.5293 11.6167 10.4882 11.4134 10.4883 11.208C10.4883 11.0026 10.5295 10.7993 10.6094 10.61C10.6893 10.4208 10.8062 10.2495 10.9534 10.1061C11.1005 9.96279 11.2748 9.85036 11.4661 9.77546C11.6573 9.70055 11.8617 9.6647 12.067 9.67C12.4682 9.68036 12.8496 9.84706 13.1296 10.1346C13.4097 10.4221 13.5664 10.8076 13.5663 11.209C13.5661 11.6104 13.4092 11.9958 13.1289 12.2831C12.8487 12.5704 12.4673 12.7369 12.066 12.747ZM7.151 12.747C6.94579 12.7522 6.74163 12.7162 6.55054 12.6412C6.35945 12.5662 6.1853 12.4538 6.03835 12.3104C5.89141 12.1671 5.77465 11.9958 5.69495 11.8066C5.61525 11.6175 5.57422 11.4143 5.57429 11.209C5.57436 11.0037 5.61552 10.8005 5.69534 10.6114C5.77516 10.4223 5.89204 10.2511 6.03907 10.1078C6.18611 9.96459 6.36033 9.85223 6.55147 9.77738C6.74261 9.70253 6.9468 9.6667 7.152 9.672C7.55298 9.68236 7.93405 9.84895 8.21395 10.1363C8.49384 10.4236 8.65042 10.8089 8.65029 11.21C8.65016 11.6111 8.49333 11.9963 8.21325 12.2834C7.93316 12.5706 7.55199 12.7369 7.151 12.747ZM12 1.5C6.167 1.5 1.421 5.814 1.421 11.117C1.421 13.387 2.381 16.476 5.055 18.47L4.74 21.764C4.72817 21.8854 4.7496 22.0077 4.80199 22.1178C4.85438 22.228 4.93575 22.3218 5.03738 22.3892C5.13902 22.4566 5.25708 22.4951 5.37892 22.5005C5.50076 22.5059 5.62177 22.4781 5.729 22.42L9.16 20.574C9.587 20.618 10.841 20.734 12 20.734C17.833 20.734 22.579 16.42 22.579 11.117C22.579 5.814 17.833 1.5 12 1.5Z"
												fill="#FFFFFF"
											/>
										</svg>
									</div>
								</div>
								<div
									class="relative shrink-0 text-center text-[14px] leading-[0] font-semibold tracking-[0.14px] text-nowrap text-[#ffffff] not-italic"
								>
									<p class="adjustLetterSpacing block leading-[20px] whitespace-pre">대화하기</p>
								</div>
							</div>
						</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</div>

{#if offer.status === 'pending' && showPaymentModal}
	<PaymentModal
		bind:isOpen={showPaymentModal}
		onClose={() => {
			showPaymentModal = false;
		}}
		{offer}
		{trip}
	/>
{/if}
