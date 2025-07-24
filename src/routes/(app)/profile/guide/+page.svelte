<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronRight } from 'lucide-svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';

	const { data } = $props();
	
	// Get user data
	const user = $derived(data?.user);
	const guideProfile = $derived(data?.guideProfile);
	const userName = $derived(user?.name || '사용자');
	const profileImageUrl = $derived(guideProfile?.profileImageUrl || '');
	
	// Stats
	const completedTrips = $derived(guideProfile?.completedTrips || 3);
	const acceptedOffers = $derived(guideProfile?.acceptedOffers || 0);
	const rating = $derived(guideProfile?.rating || 4.9);
	
	// Generate avatar placeholder
	function getAvatarUrl(name: string) {
		const initials = name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1095f4&color=fff&size=200&font-size=0.4&bold=true`;
	}

	// Logout handler
	async function handleLogout() {
		try {
			const response = await fetch('/api/auth/sign-out', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				// Redirect to home page after logout
				await goto('/');
			} else {
				console.error('Logout failed:', response.status);
			}
		} catch (error) {
			console.error('Logout error:', error);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-lg font-bold">Matchtrip</h1>
			<button class="p-2" onclick={() => window.window.alert('알림 기능 준비중')}>
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
				</svg>
			</button>
		</div>
	</header>

	<!-- Profile Section -->
	<section class="bg-white p-4">
		<div class="text-gray-600 text-sm mb-2">Match Your Trip, Make It Yours</div>
		<div class="flex items-center gap-3 mb-4">
			<img
				src={profileImageUrl || getAvatarUrl(userName)}
				alt={userName}
				class="h-12 w-12 rounded-full object-cover"
			/>
			<div class="flex-1">
				<h2 class="text-lg font-semibold">안녕하세요! {userName} 님</h2>
			</div>
			<button class="text-sm text-blue-600" onclick={() => window.window.alert('프로필 수정 준비중')}>
				프로필 수정
			</button>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
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
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('매출/정산 내역 준비중')}
			>
				<span class="text-gray-700">매출/정산 내역</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('결제/취소 내역 준비중')}
			>
				<span class="text-gray-700">결제/취소 내역</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('관심 여행 준비중')}
			>
				<span class="text-gray-700">관심 여행</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
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
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('회원 정보 수정 준비중')}
			>
				<span class="text-gray-700">회원 정보 수정</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
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
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('공지사항 준비중')}
			>
				<span class="text-gray-700">공지사항</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('1:1문의 준비중')}
			>
				<span class="text-gray-700">1:1문의</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
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
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('개인정보처리방침 준비중')}
			>
				<span class="text-gray-700">개인정보처리방침</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('이용약관 준비중')}
			>
				<span class="text-gray-700">이용약관</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button 
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => window.alert('탈퇴하기 준비중')}
			>
				<span class="text-gray-700">탈퇴하기</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<div class="flex items-center justify-between px-4 py-3">
				<span class="text-gray-700">알림(PUSH) 설정</span>
				<label class="relative inline-flex items-center cursor-pointer">
					<input type="checkbox" checked class="sr-only peer" />
					<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
				</label>
			</div>
		</div>
	</section>

	<!-- Logout -->
	<section class="mt-2 mb-24 bg-white">
		<button 
			onclick={handleLogout}
			class="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50"
		>
			로그아웃
		</button>
	</section>

	<!-- Bottom Navigation -->
	<GuideBottomNav />
</div>