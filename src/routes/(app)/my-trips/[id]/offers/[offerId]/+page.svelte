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
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).replace(/\. /g, '. ').replace(/\.$/, '');
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
	<header class="sticky top-0 z-10 backdrop-blur-sm backdrop-filter bg-[rgba(255,255,255,0.92)]">
		<div class="h-14 relative shrink-0 w-full">
			<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
			<div class="flex flex-col items-center justify-center relative size-full">
				<div class="box-border content-stretch flex flex-col gap-2.5 h-14 items-center justify-center px-4 py-2.5 relative w-full">
					<div class="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
						<BackButton href="/my-trips/{trip.id}" />
						<div class="absolute font-bold leading-[0] left-1/2 not-italic text-[#052236] text-[16px] text-center text-nowrap translate-x-[-50%]" style="top: calc(50% - 12px)">
							<p class="block leading-[24px] whitespace-pre">{trip.destination ? `${trip.destination.city} ${trip.destination.country}` : '목적지'}</p>
						</div>
						<button class="overflow-clip relative shrink-0 size-5">
							<img alt="" class="block max-w-none size-full" src={bookmarkUrl} />
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="box-border content-stretch flex flex-col gap-3 items-start justify-start pb-20 pt-2 px-0 relative shrink-0 w-full">
		<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative shrink-0 w-full">
			<!-- Price and Status Section -->
			<div class="relative shrink-0 w-full">
				<div class="absolute border-[#f7f9fa] border-[0px_0px_4px] border-solid bottom-[-4px] left-0 pointer-events-none right-0 top-0" />
				<div class="relative size-full">
					<div class="box-border content-stretch flex flex-col gap-3 items-start justify-start p-[16px] relative w-full">
						<div class="box-border content-stretch flex flex-col gap-3 items-start justify-start p-0 relative shrink-0 w-full">
							<div class="flex items-baseline gap-1 text-[18px] leading-[28px]">
								<span class="font-extrabold text-[#052236]">{offer.price.toLocaleString()}원</span>
								<span class="font-normal text-[#c9ccce] text-[12px]">/ </span>
								<span class="font-normal text-[#8ea0ac] text-[12px]">제안 금액</span>
							</div>
						</div>
						<div class="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full">
							<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
								<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
								<div class="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
									<div class="font-normal leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#8ea0ac] text-[13px] text-left text-nowrap">
										<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit whitespace-pre">현재 상태</p>
									</div>
									<div 
										class="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-2 py-1 relative rounded shrink-0"
										style="background-color: {getOfferStatusColor(offer.status)};"
									>
										<div class="absolute border border-solid inset-0 pointer-events-none rounded" style="border-color: {getOfferStatusColor(offer.status)};" />
										<div class="font-medium leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[11px] text-left text-nowrap">
											<p class="block leading-[12px] whitespace-pre">{getOfferStatusText(offer.status)}</p>
										</div>
									</div>
								</div>
							</div>
							<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
								<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
								<div class="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
									<div class="font-normal leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#8ea0ac] text-[13px] text-left text-nowrap">
										<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit whitespace-pre">여행 일정</p>
									</div>
									<div class="box-border content-stretch flex flex-row gap-1 items-center justify-start leading-[0] not-italic p-0 relative shrink-0 text-[13px] text-left text-nowrap">
										<div class="font-normal overflow-ellipsis overflow-hidden relative shrink-0 text-[#536b7c]">
											<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit text-nowrap whitespace-pre">{formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</p>
										</div>
										<div class="font-semibold overflow-ellipsis overflow-hidden relative shrink-0 text-[#1095f4]">
											<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit text-[13px] text-nowrap whitespace-pre">{calculateNightsAndDays(trip.startDate, trip.endDate)}</p>
										</div>
									</div>
								</div>
							</div>
							<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
								<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
								<div class="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
									<div class="font-normal leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#8ea0ac] text-[13px] text-left text-nowrap">
										<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit whitespace-pre">인원</p>
									</div>
									<div class="box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 relative shrink-0">
										<div class="box-border content-stretch flex flex-row font-normal items-center justify-start leading-[0] not-italic p-0 relative shrink-0 text-[13px] text-left text-nowrap">
											<div class="relative shrink-0 text-[#536b7c]">
												<p class="block leading-[20px] text-nowrap whitespace-pre">성인 {trip.adultsCount}명</p>
											</div>
											{#if trip.childrenCount > 0}
												<div class="relative shrink-0 text-[#c1c1c1]">
													<p class="block leading-[20px] text-nowrap whitespace-pre">・</p>
												</div>
												<div class="relative shrink-0 text-[#536b7c]">
													<p class="block leading-[20px] text-nowrap whitespace-pre">아동 {trip.childrenCount}명</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
							<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
								<div class="absolute border-[#f7f9fa] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
								<div class="box-border content-stretch flex flex-row font-normal items-center justify-between leading-[0] not-italic p-0 relative shrink-0 text-[13px] text-left text-nowrap w-full">
									<div class="overflow-ellipsis overflow-hidden relative shrink-0 text-[#8ea0ac]">
										<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit text-nowrap whitespace-pre">선호 스타일</p>
									</div>
									<div class="relative shrink-0 text-[#536b7c]">
										<p class="block leading-[20px] text-nowrap whitespace-pre">{trip.travelStyle || '모험적인 여행'}</p>
									</div>
								</div>
							</div>
							<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start pb-1 pt-0 px-0 relative shrink-0 w-full">
								<div class="box-border content-stretch flex flex-row font-normal items-center justify-between leading-[0] not-italic p-0 relative shrink-0 text-[13px] text-left text-nowrap w-full">
									<div class="overflow-ellipsis overflow-hidden relative shrink-0 text-[#8ea0ac]">
										<p class="[text-overflow:inherit] block leading-[20px] overflow-inherit text-nowrap whitespace-pre">관심 활동</p>
									</div>
									<div class="relative shrink-0 text-[#536b7c]">
										<p class="block leading-[20px] text-nowrap whitespace-pre">{trip.activities || '자연 / 아웃도어'}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Offer Content Section -->
			<div class="relative shrink-0 w-full">
				<div class="absolute border-4 border-[#f7f9fa] border-solid inset-[-4px] pointer-events-none" />
				<div class="relative size-full">
					<div class="box-border content-stretch flex flex-col gap-2 items-start justify-start p-[16px] relative w-full">
						<div class="box-border content-stretch flex flex-row items-end justify-between p-0 relative shrink-0 w-full">
							<div class="basis-0 box-border content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
								<div class="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
									<button 
										onclick={() => toggleSection('content')}
										class="box-border content-stretch flex flex-row h-7 items-center justify-between p-0 relative shrink-0 w-full"
									>
										<div class="basis-0 font-bold grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#052236] text-[16px] text-left">
											<p class="block leading-[24px] whitespace-pre-wrap">제안 내용</p>
										</div>
										<div class="flex h-[0px] items-center justify-center relative shrink-0 w-[0px]">
											<div class={expandedSections.content ? "flex-none" : "flex-none -rotate-270"}>
												<ChevronDown class="h-4 w-4" />
											</div>
										</div>
									</button>
								</div>
							</div>
						</div>
						<div class="relative pt-2 w-full">
							{#if !expandedSections.content}
								<!-- Truncated content with gradient overlay -->
								<div class="relative">
									<div class="font-normal max-h-[100px] leading-[20px] not-italic overflow-hidden relative text-[#536b7c] text-[13px] text-left w-full">
										{@html offer.itinerary || ''}
									</div>
									<!-- Gradient overlay -->
									<div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
								</div>
								
								<!-- Button container -->
								<div class="relative mt-4 w-full">
									<button 
										onclick={() => expandedSections.content = true}
										class="bg-white border border-[#e8e8e8] rounded-lg w-full py-3 px-6 flex items-center justify-center hover:bg-gray-50 transition-colors"
									>
										<span class="font-semibold text-[#536b7c] text-[12px] leading-[16px]">자세히 보기</span>
									</button>
								</div>
							{:else}
								<!-- Full content -->
								<div class="font-normal leading-[20px] not-italic text-[#536b7c] text-[13px] text-left w-full">
									{@html offer.itinerary || ''}
								</div>
								<div class="relative mt-4 w-full">
									<button 
										onclick={() => expandedSections.content = false}
										class="bg-white border border-[#e8e8e8] rounded-lg w-full py-3 px-6 flex items-center justify-center hover:bg-gray-50 transition-colors"
									>
										<span class="font-semibold text-[#536b7c] text-[12px] leading-[16px]">접기</span>
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Attached Files Section -->
			{#if offer.attachments && offer.attachments.length > 0}
				<div class="relative shrink-0 w-full">
					<div class="absolute border-[#f7f9fa] border-[0px_0px_4px] border-solid bottom-[-4px] left-0 pointer-events-none right-0 top-0" />
					<div class="relative size-full">
						<div class="box-border content-stretch flex flex-col gap-2 items-start justify-start p-[16px] relative w-full">
							<div class="box-border content-stretch flex flex-row items-end justify-between p-0 relative shrink-0 w-full">
								<div class="basis-0 box-border content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
									<div class="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
										<button 
											onclick={() => toggleSection('files')}
											class="box-border content-stretch flex flex-row h-7 items-center justify-between p-0 relative shrink-0 w-full"
										>
											<div class="basis-0 font-bold grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#052236] text-[16px] text-left">
												<p class="block leading-[24px]">첨부 파일</p>
											</div>
											<div class="flex h-[0px] items-center justify-center relative shrink-0 w-[0px]">
												<div class={expandedSections.files ? "flex-none" : "flex-none rotate-[90deg]"}>
													<ChevronDown class="h-4 w-4" />
												</div>
											</div>
										</button>
									</div>
								</div>
							</div>
							{#if expandedSections.files}
								<div class="box-border content-stretch flex flex-col gap-2 items-start justify-start px-0 py-3 relative shrink-0 w-full">
									<div class="bg-[rgba(0,62,129,0.02)] relative rounded-xl shrink-0 w-full">
										<div class="flex flex-col justify-center overflow-clip relative size-full">
											<div class="box-border content-stretch flex flex-col gap-3 items-start justify-center p-[12px] relative w-full">
												<div class="box-border content-stretch flex flex-row items-center justify-between p-0 relative shrink-0 w-full">
													<div class="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative shrink-0">
														<div class="bg-[rgba(247,43,43,0.04)] box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[8px] relative rounded-lg shrink-0">
															<div class="relative shrink-0 size-6">
																<img alt="" class="block max-w-none size-full" loading="lazy" src={pdfIconUrl} />
															</div>
														</div>
														<div class="box-border content-stretch flex flex-col gap-1 items-start justify-center leading-[0] not-italic p-0 relative shrink-0 text-nowrap">
															<div class="font-semibold relative shrink-0 text-[#052236] text-[13px] text-center">
																<p class="block leading-[20px] text-nowrap whitespace-pre">여행제안.pdf</p>
															</div>
															<div class="font-medium relative shrink-0 text-[#8ea0ac] text-[11px] text-left">
																<p class="block leading-[16px] text-nowrap whitespace-pre">3MB</p>
															</div>
														</div>
													</div>
													<button class="overflow-clip relative shrink-0 size-4">
														<div class="absolute bottom-[8.75%] left-[6.25%] right-[6.333%] top-[7%]">
															<img alt="" class="block max-w-none size-full" src={downloadUrl} />
														</div>
													</button>
												</div>
											</div>
										</div>
										<div class="absolute border border-[rgba(0,62,129,0)] border-solid inset-0 pointer-events-none rounded-xl" />
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- FAQ Sections -->
			<div class="bg-[#ffffff] relative shrink-0 w-full">
				<div class="absolute border-[#f7f9fa] border-[0px_0px_4px] border-solid bottom-[-4px] left-0 pointer-events-none right-0 top-0" />
				<div class="relative size-full">
					<div class="box-border content-stretch flex flex-col items-start justify-start px-4 py-3 relative w-full">
						<button 
							onclick={() => toggleSection('cancellation')}
							class="box-border content-stretch flex flex-row gap-2 items-start justify-start px-0 py-3 relative shrink-0 w-full"
						>
							<div class="absolute border-[#f1f1f1] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
							<div class="basis-0 box-border content-stretch flex flex-row grow items-end justify-between min-h-px min-w-px p-0 relative shrink-0">
								<div class="basis-0 box-border content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
									<div class="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
										<div class="box-border content-stretch flex flex-row h-7 items-center justify-between p-0 relative shrink-0 w-full">
											<div class="basis-0 font-bold grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#052236] text-[16px] text-left">
												<p class="block leading-[24px]">취소 / 환불 안내</p>
											</div>
											<div class="overflow-clip relative shrink-0 size-4">
												<div class="absolute bottom-[16.25%] left-[30.299%] right-[30.361%] top-[16.299%]">
													<img alt="" class="block max-w-none size-full" src={arrowRightUrl} />
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</button>
						<button 
							onclick={() => toggleSection('seller')}
							class="box-border content-stretch flex flex-row gap-2 items-start justify-start px-0 py-3 relative shrink-0 w-full"
						>
							<div class="basis-0 box-border content-stretch flex flex-row grow items-end justify-between min-h-px min-w-px p-0 relative shrink-0">
								<div class="basis-0 box-border content-stretch flex flex-col gap-1 grow items-start justify-start min-h-px min-w-px p-0 relative shrink-0">
									<div class="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0 w-full">
										<div class="box-border content-stretch flex flex-row h-7 items-center justify-between p-0 relative shrink-0 w-full">
											<div class="basis-0 font-bold grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#052236] text-[16px] text-left">
												<p class="block leading-[24px]">판매자 정보 고시</p>
											</div>
											<div class="overflow-clip relative shrink-0 size-4">
												<div class="absolute bottom-[16.25%] left-[30.299%] right-[30.361%] top-[16.299%]">
													<img alt="" class="block max-w-none size-full" src={arrowRightUrl} />
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
	<div class="fixed bottom-0 left-0 right-0 bg-white z-50">
		<div class="box-border content-stretch flex flex-row gap-4 items-center justify-start pl-5 pr-4 py-4 w-full shadow-[0px_-4px_6px_-1px_rgba(0,0,0,0.1)]">
			<button 
				class="opacity-40 overflow-clip relative shrink-0 size-5 -rotate-90"
				onclick={() => {/* Handle dots menu */}}
			>
				<div class="absolute bottom-[13.454%] left-[13.454%] right-[13.454%] top-[13.454%]">
					<img
						alt=""
						class="block max-w-none size-full"
						src={dotsIconUrl}
					/>
				</div>
			</button>
			<button 
				onclick={startConversation}
				class="basis-0 bg-[#1095f4] grow h-12 min-h-px min-w-px relative rounded-[9px] shrink-0"
			>
				<div class="flex flex-row items-center justify-center relative size-full">
					<div class="box-border content-stretch flex flex-row gap-2.5 h-12 items-center justify-center px-6 py-3.5 relative w-full">
						<div class="box-border content-stretch flex flex-row gap-1 items-center justify-start p-0 relative shrink-0">
							<div class="overflow-clip relative shrink-0 size-4">
								<div class="absolute bottom-[6.245%] left-[5.921%] right-[5.921%] top-[6.25%]">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="block max-w-none size-full">
										<path fill-rule="evenodd" clip-rule="evenodd" d="M16.98 12.747C16.7748 12.7522 16.5706 12.7162 16.3795 12.6412C16.1884 12.5662 16.0143 12.4538 15.8674 12.3104C15.7204 12.1671 15.6037 11.9958 15.524 11.8066C15.4443 11.6175 15.4032 11.4143 15.4033 11.209C15.4034 11.0037 15.4445 10.8005 15.5243 10.6114C15.6042 10.4223 15.721 10.2511 15.8681 10.1078C16.0151 9.96459 16.1893 9.85223 16.3805 9.77738C16.5716 9.70253 16.7758 9.6667 16.981 9.672C17.382 9.68236 17.763 9.84895 18.0429 10.1363C18.3228 10.4236 18.4794 10.8089 18.4793 11.21C18.4792 11.6111 18.3223 11.9963 18.0422 12.2834C17.7622 12.5706 17.381 12.7369 16.98 12.747ZM12.066 12.747C11.8607 12.7522 11.6564 12.7162 11.4651 12.6412C11.2739 12.5661 11.0997 12.4536 10.9526 12.3102C10.8056 12.1667 10.6888 11.9953 10.609 11.806C10.5293 11.6167 10.4882 11.4134 10.4883 11.208C10.4883 11.0026 10.5295 10.7993 10.6094 10.61C10.6893 10.4208 10.8062 10.2495 10.9534 10.1061C11.1005 9.96279 11.2748 9.85036 11.4661 9.77546C11.6573 9.70055 11.8617 9.6647 12.067 9.67C12.4682 9.68036 12.8496 9.84706 13.1296 10.1346C13.4097 10.4221 13.5664 10.8076 13.5663 11.209C13.5661 11.6104 13.4092 11.9958 13.1289 12.2831C12.8487 12.5704 12.4673 12.7369 12.066 12.747ZM7.151 12.747C6.94579 12.7522 6.74163 12.7162 6.55054 12.6412C6.35945 12.5662 6.1853 12.4538 6.03835 12.3104C5.89141 12.1671 5.77465 11.9958 5.69495 11.8066C5.61525 11.6175 5.57422 11.4143 5.57429 11.209C5.57436 11.0037 5.61552 10.8005 5.69534 10.6114C5.77516 10.4223 5.89204 10.2511 6.03907 10.1078C6.18611 9.96459 6.36033 9.85223 6.55147 9.77738C6.74261 9.70253 6.9468 9.6667 7.152 9.672C7.55298 9.68236 7.93405 9.84895 8.21395 10.1363C8.49384 10.4236 8.65042 10.8089 8.65029 11.21C8.65016 11.6111 8.49333 11.9963 8.21325 12.2834C7.93316 12.5706 7.55199 12.7369 7.151 12.747ZM12 1.5C6.167 1.5 1.421 5.814 1.421 11.117C1.421 13.387 2.381 16.476 5.055 18.47L4.74 21.764C4.72817 21.8854 4.7496 22.0077 4.80199 22.1178C4.85438 22.228 4.93575 22.3218 5.03738 22.3892C5.13902 22.4566 5.25708 22.4951 5.37892 22.5005C5.50076 22.5059 5.62177 22.4781 5.729 22.42L9.16 20.574C9.587 20.618 10.841 20.734 12 20.734C17.833 20.734 22.579 16.42 22.579 11.117C22.579 5.814 17.833 1.5 12 1.5Z" fill="#FFFFFF"/>
									</svg>
								</div>
							</div>
							<div class="font-semibold leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-center text-nowrap tracking-[0.14px]">
								<p class="adjustLetterSpacing block leading-[20px] whitespace-pre">대화하기</p>
							</div>
						</div>
					</div>
				</div>
			</button>
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