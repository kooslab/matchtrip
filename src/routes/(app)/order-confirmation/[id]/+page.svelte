<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import BackButton from '$lib/components/BackButton.svelte';
	
	interface Props {
		data: {
			order: any;
			trip: any;
			offer: any;
			guide: any;
		};
	}
	
	let { data }: Props = $props();
	
	// Format date to Korean format
	function formatKoreanDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).replace(/\. /g, '.').replace(/\.$/, '');
	}
	
	function formatKoreanDateWithTime(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const dateStr = formatKoreanDate(dateObj);
		const timeStr = dateObj.toLocaleTimeString('ko-KR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		return `${dateStr} ${timeStr}`;
	}
	
	function calculateNightsAndDays(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const days = nights + 1;
		return `${nights}박 ${days}일`;
	}
</script>

<svelte:head>
	<title>주문 상세 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-14 items-center justify-between px-4">
			<BackButton href="/order-history" />
			<h1 class="text-lg font-semibold text-gray-900">주문 상세</h1>
			<div class="w-6"></div>
		</div>
	</header>
	
	<!-- Content -->
	<div class="px-4 py-6">
		<!-- Order Date -->
		<div class="mb-6">
			<p class="text-sm text-gray-600">{formatKoreanDate(data.order.createdAt)} 결제</p>
		</div>
		
		<!-- Success Status -->
		<div class="mb-8 flex items-center gap-2">
			<div class="inline-flex rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">
				결제 완료
			</div>
		</div>
		
		<!-- Trip Info -->
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-bold text-gray-900">
				{data.trip.destination?.city || '목적지'}, {data.trip.destination?.country || ''}
			</h2>
			
			<div class="space-y-3">
				<div class="flex items-center gap-2 text-sm">
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<span class="text-gray-900">
						{formatKoreanDate(data.trip.startDate)} ~ {formatKoreanDate(data.trip.endDate)}
					</span>
					<span class="font-medium text-[#1095f4]">
						{calculateNightsAndDays(data.trip.startDate, data.trip.endDate)}
					</span>
				</div>
				
				<div class="flex items-center gap-2 text-sm">
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<span class="text-gray-600">성인 {data.trip.adultsCount}명</span>
					{#if data.trip.childrenCount}
						<span class="text-gray-600">· 아동 {data.trip.childrenCount}명</span>
					{/if}
				</div>
			</div>
		</div>
		
		<!-- Guide Info Section -->
		<div class="mb-8">
			<h3 class="mb-4 text-base font-semibold text-gray-900">주문자 정보</h3>
			<div class="rounded-xl bg-gray-50 p-4">
				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-sm text-gray-600">주문자</span>
						<span class="text-sm font-medium text-gray-900">{data.guide.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm text-gray-600">휴대폰</span>
						<span class="text-sm font-medium text-gray-900">
							{data.guide.phone || '010-3567-1234'}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm text-gray-600">결제일시</span>
						<span class="text-sm font-medium text-gray-900">
							{formatKoreanDateWithTime(data.order.createdAt)}
						</span>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Payment Info Section -->
		<div class="mb-8">
			<h3 class="mb-4 text-base font-semibold text-gray-900">결제 정보</h3>
			<div class="space-y-3">
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">총 상품금액 (1개)</span>
					<span class="text-base font-medium text-gray-900">
						{data.offer.price.toLocaleString()}원
					</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">할인금액</span>
					<span class="text-base font-medium text-red-600">
						-4,000원
					</span>
				</div>
			</div>
			
			<div class="mt-4 border-t border-gray-200 pt-4">
				<div class="flex justify-between items-center">
					<span class="text-base font-semibold text-gray-900">총 결제금액</span>
					<span class="text-xl font-bold text-gray-900">
						{(data.offer.price - 4000).toLocaleString()}원
					</span>
				</div>
				<div class="mt-2 flex justify-end">
					<span class="text-sm text-gray-600">토스페이 / 체크카드</span>
				</div>
			</div>
		</div>
		
		<!-- Cancel Info -->
		<div class="rounded-xl bg-gray-50 p-4 text-center">
			<button class="text-sm text-gray-600 underline">
				결제 취소하기
			</button>
		</div>
	</div>
	
	<!-- Bottom CTA -->
	<div class="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 pb-24">
		<button
			onclick={() => goto(`/my-trips/${data.trip.id}`)}
			class="w-full rounded-xl bg-[#1095f4] px-4 py-3.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
		>
			여행 상세보기
		</button>
	</div>
</div>