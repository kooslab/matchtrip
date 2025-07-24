<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Bell } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	const profileImageUrl = $derived(
		data.user?.profileImageUrl || 'https://via.placeholder.com/150'
	);

	const handleLogout = async () => {
		try {
			await authClient.signOut({
				fetchOptions: {
					method: 'POST'
				}
			});
			goto('/');
		} catch (error) {
			console.error('로그아웃 실패:', error);
		}
	};

	onMount(() => {
		console.log('User data:', data.user);
	});
</script>

<svelte:head>
	<title>내 프로필 | Matchtrip</title>
</svelte:head>

<div class="flex flex-col min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="bg-white shadow-sm sticky top-0 z-10">
		<div class="flex items-center justify-between px-4 py-4">
			<h1 class="text-xl font-bold text-primary">Matchtrip</h1>
			<button class="relative p-2">
				<Bell class="h-6 w-6 text-gray-600" />
				<span
					class="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"
				></span>
			</button>
		</div>
	</header>

	<!-- Profile Content -->
	<div class="flex-1 overflow-y-auto">
		<!-- Profile Section -->
		<div class="bg-white px-4 py-6 border-b border-gray-200">
			<div class="text-gray-500 text-sm mb-2">Match Your Trip, Make It Yours</div>
			<div class="flex items-center space-x-4">
				<img
					src={profileImageUrl}
					alt="프로필 이미지"
					class="w-20 h-20 rounded-full object-cover"
				/>
				<div class="flex-1">
					<h2 class="text-lg font-semibold">
						{data.user?.nickname || data.user?.name || '홍길동'} 님
					</h2>
					<button
						onclick={() => goto('/profile/traveler/edit')}
						class="text-blue-500 text-sm mt-1 hover:underline"
					>
						프로필 수정
					</button>
				</div>
			</div>

			<!-- Stats -->
			<div class="grid grid-cols-3 gap-4 mt-6 text-center">
				<div>
					<div class="text-2xl font-bold text-blue-500">3</div>
					<div class="text-sm text-gray-500 mt-1">내 여행</div>
				</div>
				<div>
					<div class="text-2xl font-bold">0</div>
					<div class="text-sm text-gray-500 mt-1">완료한 여행</div>
				</div>
				<div>
					<div class="text-2xl font-bold">0</div>
					<div class="text-sm text-gray-500 mt-1">관심 가이드</div>
				</div>
			</div>
		</div>

		<!-- Menu Sections -->
		<div class="space-y-2 mt-2">
			<!-- 서비스 Section -->
			<div class="bg-white">
				<h3 class="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
					서비스
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/my-trips"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">주문 내역</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/my-trips"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">여행 리뷰</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 계정 정보 Section -->
			<div class="bg-white">
				<h3 class="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
					계정 정보
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/profile/traveler/edit"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">회원 정보 수정</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 고객센터 Section -->
			<div class="bg-white">
				<h3 class="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
					고객센터
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/support"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">공지사항</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/support"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">1:1문의</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/faq"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">FAQ</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 설정 Section -->
			<div class="bg-white">
				<h3 class="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">
					설정
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/settings/app-version"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">앱제 버전</span>
						<div class="flex items-center space-x-2">
							<span class="text-sm text-gray-500">v 0.1</span>
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>
					<a
						href="/settings/privacy"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">개인정보처리방침</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/settings/terms"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">이용약관</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/settings/deactivate"
						class="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
					>
						<span class="text-gray-800">탈퇴하기</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<div class="flex items-center justify-between px-4 py-4">
						<span class="text-gray-800">알람(PUSH) 설정</span>
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" class="sr-only peer" checked />
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
						</label>
					</div>
				</div>
			</div>

			<!-- Logout Button -->
			<div class="bg-white mt-6 mb-4">
				<button
					onclick={handleLogout}
					class="w-full px-4 py-4 text-center text-gray-600 hover:bg-gray-50 transition-colors"
				>
					로그아웃
				</button>
			</div>
		</div>
	</div>
</div>