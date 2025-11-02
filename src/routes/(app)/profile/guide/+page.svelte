<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ChevronRight } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import TermsModal from '$lib/components/TermsModal.svelte';
	import FaqModal from '$lib/components/FaqModal.svelte';
	import DeleteAccountModal from '$lib/components/DeleteAccountModal.svelte';
	import { authClient } from '$lib/authClient';

	const { data } = $props();

	// Get user data
	const user = $derived(data?.user);
	const userName = $derived(user?.name || '사용자');
	const myProducts = $derived(data?.myProducts || []);

	// Stats state
	let stats = $state({
		completedTrips: 0,
		activeProducts: 0,
		rating: 0,
		reviewCount: 0
	});

	// Terms modal state
	let showTermsModal = $state(false);
	let termsModalType: 'terms' | 'privacy' | 'marketing' = $state('terms');
	let termsModalTitle = $state('');

	// FAQ modal state
	let showFaqModal = $state(false);

	// Delete account modal state
	let showDeleteModal = $state(false);

	// Fetch dynamic stats on mount
	onMount(async () => {
		if (user?.id) {
			try {
				const response = await fetch(`/api/guide/${user.id}/stats`);
				if (response.ok) {
					stats = await response.json();
				}
			} catch (err) {
				console.error('Failed to fetch stats:', err);
			}
		}
	});

	// Derived stats values
	const completedTrips = $derived(stats.completedTrips);
	const activeProducts = $derived(stats.activeProducts);
	const rating = $derived(stats.rating);
	const reviewCount = $derived(stats.reviewCount);

	// Open terms modal
	function openTermsModal(type: 'terms' | 'privacy' | 'marketing', title: string) {
		termsModalType = type;
		termsModalTitle = title;
		showTermsModal = true;
	}

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
				onclick={() => goto('/profile/guide/edit')}
			>
				프로필 수정
			</button>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4 border-t border-gray-100 py-4">
			<div class="text-center">
				<div class="text-2xl font-bold text-blue-600">{activeProducts}</div>
				<div class="text-xs text-gray-500">여행상품</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold">{completedTrips}</div>
				<div class="text-xs text-gray-500">완료한 여행</div>
			</div>
			<div class="text-center">
				<div class="text-2xl font-bold">{rating || '-'}</div>
				<div class="text-xs text-gray-500">평점 {reviewCount > 0 ? `(${reviewCount})` : ''}</div>
			</div>
		</div>
	</section>

	<!-- Service Section -->
	<section class="mt-2 bg-white">
		<h3 class="px-4 py-3 font-semibold text-gray-900">서비스</h3>
		<div class="divide-y divide-gray-100">
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto('/products/create')}
			>
				<span class="text-gray-700">여행 상품 만들기</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto('/profile/guide/products')}
			>
				<span class="text-gray-700">내 상품 목록</span>
				<span class="flex items-center gap-2">
					{#if myProducts.length > 0}
						<span class="text-sm text-blue-600">{myProducts.length}</span>
					{/if}
					<ChevronRight class="h-5 w-5 text-gray-400" />
				</span>
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto('/profile/guide/revenue')}
			>
				<span class="text-gray-700">매출/정산 내역</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto('/profile/guide/orders')}
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
				onclick={() => goto('/profile/guide/reviews')}
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
				onclick={() => goto('/profile/guide/account-edit')}
			>
				<span class="text-gray-700">회원 정보 수정</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => goto(`/guide/${user?.id}`)}
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
			<a
				href="http://pf.kakao.com/_Rxcxfxin/chat"
				target="_blank"
				rel="noopener noreferrer"
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
			>
				<span class="text-gray-700">1:1 상담</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</a>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => (showFaqModal = true)}
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
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => openTermsModal('privacy', '개인정보처리방침')}
			>
				<span class="text-gray-700">개인정보처리방침</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => openTermsModal('terms', '이용약관')}
			>
				<span class="text-gray-700">이용약관</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
			<button
				class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
				onclick={() => (showDeleteModal = true)}
			>
				<span class="text-gray-700">탈퇴하기</span>
				<ChevronRight class="h-5 w-5 text-gray-400" />
			</button>
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

<!-- Terms Modal -->
<TermsModal
	isOpen={showTermsModal}
	onClose={() => (showTermsModal = false)}
	title={termsModalTitle}
	type={termsModalType}
/>

<!-- FAQ Modal -->
<FaqModal isOpen={showFaqModal} onClose={() => (showFaqModal = false)} userRole="guide" />

<!-- Delete Account Modal -->
<DeleteAccountModal
	isOpen={showDeleteModal}
	onClose={() => (showDeleteModal = false)}
	userRole="guide"
/>

