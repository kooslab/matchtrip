<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import IconCheckCircle from '$lib/icons/icon-check-circle-mono.svg?raw';
	import IconArrowLeft from '$lib/icons/icon-arrow-left.svg?raw';
	import passportImage from '$lib/images/passport.png';
	import scopeImage from '$lib/images/scope.png';

	let selectedRole: 'traveler' | 'guide' | null = $state(null);
	let isLoading = $state(false);

	async function selectRole(role: 'traveler' | 'guide') {
		if (isLoading) return;
		
		selectedRole = role;
	}

	async function proceedWithRole() {
		if (!selectedRole || isLoading) return;
		
		isLoading = true;

		try {
			// Update user role in database
			const response = await fetch('/api/user/role', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: selectedRole })
			});

			if (response.ok) {
				// Navigate to role-specific onboarding
				if (selectedRole === 'traveler') {
					goto('/onboarding/traveler');
				} else {
					goto('/onboarding/guide');
				}
			} else {
				alert('역할 선택에 실패했습니다. 다시 시도해주세요.');
				selectedRole = null;
				isLoading = false;
			}
		} catch (error) {
			console.error('Error selecting role:', error);
			alert('오류가 발생했습니다. 다시 시도해주세요.');
			selectedRole = null;
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-[430px] bg-white min-h-screen flex flex-col">
		<!-- Header -->
		<div class="flex flex-col">
			<div class="flex items-center px-4 py-3">
				<button 
					onclick={() => window.history.back()}
					class="h-6 w-6 flex items-center justify-center text-blue-500"
				>
					{@html IconArrowLeft}
				</button>
			</div>
			<div class="relative">
				<div class="h-0.5 bg-gray-200"></div>
				<div class="absolute left-0 top-0 h-0.5 w-1/3 bg-blue-500"></div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 px-6 py-8">
			<h1 class="mb-2 text-2xl font-bold text-gray-900">회원 유형 선택</h1>
			<p class="mb-8 text-base text-gray-500">회원 유형을 선택해주세요</p>

			<!-- Role Selection Cards -->
			<div class="space-y-4">
				<!-- Traveler Card -->
				<button
					onclick={() => selectRole('traveler')}
					class="relative w-full rounded-2xl border-2 p-6 transition-all {selectedRole === 'traveler' ? 'border-blue-500 bg-gray-50' : 'border-gray-200 bg-gray-50'}"
				>
					{#if selectedRole === 'traveler'}
						<div class="absolute left-4 top-4 h-6 w-6 text-blue-500">
							{@html IconCheckCircle}
						</div>
					{:else}
						<div class="absolute left-4 top-4 h-6 w-6 rounded-full border-2 border-gray-300"></div>
					{/if}
					
					<div class="flex flex-col items-center pt-4">
						<img src={passportImage} alt="여행자" class="h-24 w-24 object-contain mb-4" />
						<h3 class="text-lg font-semibold text-gray-900 mb-2">여행자</h3>
						<p class="text-sm text-gray-500 text-center">고민 없이, 나만을 위한 여행 플랜을 받아보세요</p>
					</div>
				</button>

				<!-- Guide Card -->
				<button
					onclick={() => selectRole('guide')}
					class="relative w-full rounded-2xl border-2 p-6 transition-all {selectedRole === 'guide' ? 'border-blue-500 bg-gray-50' : 'border-gray-200 bg-gray-50'}"
				>
					{#if selectedRole === 'guide'}
						<div class="absolute left-4 top-4 h-6 w-6 text-blue-500">
							{@html IconCheckCircle}
						</div>
					{:else}
						<div class="absolute left-4 top-4 h-6 w-6 rounded-full border-2 border-gray-300"></div>
					{/if}
					
					<div class="flex flex-col items-center pt-4">
						<img src={scopeImage} alt="가이드" class="h-24 w-24 object-contain mb-4" />
						<h3 class="text-lg font-semibold text-gray-900 mb-2">가이드</h3>
						<p class="text-sm text-gray-500 text-center">나의 여행 노하우로 새로운 수익을 만들어보세요</p>
					</div>
				</button>
			</div>
		</div>

		<!-- Bottom Button -->
		<div class="p-6 pb-8">
			<button
				onclick={proceedWithRole}
				disabled={!selectedRole || isLoading}
				class="w-full rounded-xl py-4 text-base font-medium text-white transition-all {selectedRole ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}"
			>
				{#if isLoading}
					<div class="flex items-center justify-center gap-2">
						<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						<span>처리 중...</span>
					</div>
				{:else}
					선택하기
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	/* Arrow icon styling */
	.text-blue-500 :global(svg path) {
		fill: #3B82F6;
	}

	/* Spinner animation */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
