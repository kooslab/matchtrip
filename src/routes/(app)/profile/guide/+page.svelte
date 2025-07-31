<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ChevronRight } from 'lucide-svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import { authClient } from '$lib/authClient';

	const { data } = $props();

	// Get user data
	const user = $derived(data?.user);
	const guideProfile = $derived(data?.guideProfile);
	const userName = $derived(user?.name || '사용자');

	// Stats
	const completedTrips = $derived(guideProfile?.completedTrips || 3);
	const acceptedOffers = $derived(guideProfile?.acceptedOffers || 0);
	const rating = $derived(guideProfile?.rating || 4.9);

	// Logout handler
	async function handleLogout() {
		try {
			await authClient.signOut({
				fetchOptions: {
					method: 'POST'
				}
			});
			// Invalidate all data and navigate to home
			await invalidateAll();
			await goto('/', { invalidateAll: true });
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Profile Section -->
	<section class="bg-white p-4">
		<div class="mb-2 text-sm text-gray-600">Match Your Trip, Make It Yours</div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">안녕하세요! {userName} 님</h2>
			<button
				class="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-300"
				onclick={() => window.window.alert('프로필 수정 준비중')}
			>
				프로필 수정
			</button>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4 border-t border-gray-100 py-4">
			<div class="text-center">
				<div class="text-2xl font-bold text-blue-600">{completedTrips}</div>
				<div class="text-xs text-gray-500">진행중인 여행</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold">{acceptedOffers}</div>
				<div class="text-xs text-gray-500">완료한 여행</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold">{rating}</div>
				<div class="text-xs text-gray-500">나의 리뷰</div>
			</div>
		</div>
	</section>

	<!-- Service Section -->
	<section class="mt-2 bg-white">
		<h3 class="px-4 py-3 font-semibold text-gray-900">서비스</h3>
		<div class="divide-y divide-gray-100">
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto('/profile/guide/orders')}
			>
				<span class="text-gray-700">매출/정산 내역</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('결제/취소 내역 준비중')}
			>
				<span class="text-gray-700">결제/취소 내역</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('관심 여행 준비중')}
			>
				<span class="text-gray-700">관심 여행</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('여행 리뷰 준비중')}
			>
				<span class="text-gray-700">여행 리뷰</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
		</div>
	</section>

	<!-- Account Info Section -->
	<section class="mt-2 bg-white">
		<h3 class="px-4 py-3 font-semibold text-gray-900">계정 정보</h3>
		<div class="divide-y divide-gray-100">
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('회원 정보 수정 준비중')}
			>
				<span class="text-gray-700">회원 정보 수정</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('가이드 소개 준비중')}
			>
				<span class="text-gray-700">가이드 소개</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
		</div>
	</section>

	<!-- Customer Center Section -->
	<section class="mt-2 bg-white">
		<h3 class="px-4 py-3 font-semibold text-gray-900">고객센터</h3>
		<div class="divide-y divide-gray-100">
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('공지사항 준비중')}
			>
				<span class="text-gray-700">공지사항</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('1:1문의 준비중')}
			>
				<span class="text-gray-700">1:1문의</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('FAQ 준비중')}
			>
				<span class="text-gray-700">FAQ</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
		</div>
	</section>

	<!-- Settings Section -->
	<section class="mt-2 bg-white">
		<h3 class="px-4 py-3 font-semibold text-gray-900">설정</h3>
		<div class="divide-y divide-gray-100">
			<div class="flex items-center justify-between px-4 py-3">
				<span class="text-gray-700">현재 버전</span>
				<span class="text-blue-600">v 0.1</span>
			</div>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('개인정보처리방침 준비중')}
			>
				<span class="text-gray-700">개인정보처리방침</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('이용약관 준비중')}
			>
				<span class="text-gray-700">이용약관</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('탈퇴하기 준비중')}
			>
				<span class="text-gray-700">탈퇴하기</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<div class="flex items-center justify-between px-4 py-3">
				<span class="text-gray-700">알림(PUSH) 설정</span>
				<label class="relative inline-flex cursor-pointer items-center">
					<input type="checkbox" checked class="peer sr-only" />
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>
		</div>
	</section>

	<!-- Logout -->
	<section class="mt-2 mb-24 bg-white">
		<button
			onclick={handleLogout}
			class="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
		>
			로그아웃
		</button>
	</section>

	<!-- Bottom Navigation -->
	<GuideBottomNav />
</div>
