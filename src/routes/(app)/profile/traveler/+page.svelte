<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Bell } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	const profileImageUrl = $derived(data.user?.profileImageUrl || 'https://via.placeholder.com/150');

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

<div class="flex min-h-screen flex-col bg-gray-50 pb-20">
	<!-- Profile Content -->
	<div class="flex-1 overflow-y-auto">
		<!-- Profile Section -->
		<div class="border-b border-gray-200 bg-white px-4 py-6">
			<div class="mb-2 text-sm text-gray-500">Match Your Trip, Make It Yours</div>
			<div class="flex items-center space-x-4">
				<img
					src={profileImageUrl}
					alt="프로필 이미지"
					class="h-20 w-20 rounded-full object-cover" />
				<div class="flex-1">
					<h2 class="text-lg font-semibold">
						{data.user?.nickname || data.user?.name || '홍길동'} 님
					</h2>
					<button
						onclick={() => goto('/profile/traveler/edit')}
						class="mt-1 text-sm text-blue-500 hover:underline">
						프로필 수정
					</button>
				</div>
			</div>

			<!-- Stats -->
			<div class="mt-6 grid grid-cols-3 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold text-blue-500">3</div>
					<div class="mt-1 text-sm text-gray-500">내 여행</div>
				</div>
				<div>
					<div class="text-2xl font-bold">0</div>
					<div class="mt-1 text-sm text-gray-500">완료한 여행</div>
				</div>
				<div>
					<div class="text-2xl font-bold">0</div>
					<div class="mt-1 text-sm text-gray-500">관심 가이드</div>
				</div>
			</div>
		</div>

		<!-- Menu Sections -->
		<div class="mt-2 space-y-2">
			<!-- 서비스 Section -->
			<div class="bg-white">
				<h3 class="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
					서비스
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/my-trips"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">주문 내역</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/my-trips"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">여행 리뷰</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 계정 정보 Section -->
			<div class="bg-white">
				<h3 class="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
					계정 정보
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/profile/traveler/edit"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">회원 정보 수정</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 고객센터 Section -->
			<div class="bg-white">
				<h3 class="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
					고객센터
				</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/support"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">공지사항</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/support"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">1:1문의</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/faq"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">FAQ</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>

			<!-- 설정 Section -->
			<div class="bg-white">
				<h3 class="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">설정</h3>
				<div class="divide-y divide-gray-100">
					<a
						href="/settings/app-version"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">앱제 버전</span>
						<div class="flex items-center space-x-2">
							<span class="text-sm text-gray-500">v 0.1</span>
							<svg
								class="h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</a>
					<a
						href="/settings/privacy"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">개인정보처리방침</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/settings/terms"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">이용약관</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<a
						href="/settings/deactivate"
						class="flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50">
						<span class="text-gray-800">탈퇴하기</span>
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<div class="flex items-center justify-between px-4 py-4">
						<span class="text-gray-800">알람(PUSH) 설정</span>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" class="peer sr-only" checked />
							<div
								class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white">
							</div>
						</label>
					</div>
				</div>
			</div>

			<!-- Logout Button -->
			<div class="mt-6 mb-4 bg-white">
				<button
					onclick={handleLogout}
					class="w-full px-4 py-4 text-center text-gray-600 transition-colors hover:bg-gray-50">
					로그아웃
				</button>
			</div>
		</div>
	</div>
</div>
