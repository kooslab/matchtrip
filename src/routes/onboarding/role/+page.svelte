<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';

	async function selectRole(role: 'traveler' | 'guide') {
		try {
			// Update user role in database
			const response = await fetch('/api/user/role', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role })
			});

			if (response.ok) {
				// Navigate to role-specific onboarding
				if (role === 'traveler') {
					goto('/onboarding/traveler');
				} else {
					goto('/onboarding/guide');
				}
			} else {
				alert('역할 선택에 실패했습니다. 다시 시도해주세요.');
			}
		} catch (error) {
			console.error('Error selecting role:', error);
			alert('오류가 발생했습니다. 다시 시도해주세요.');
		}
	}
</script>

<div class="min-h-screen bg-white px-4 py-8">
	<div class="mx-auto max-w-sm">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-2 text-2xl font-bold text-gray-900">어떤 서비스를 이용하시나요?</h1>
			<p class="text-base text-gray-600">여행자와 가이드 중 선택해주세요</p>
		</div>

		<!-- Role Selection Cards -->
		<div class="space-y-4">
			<!-- Traveler Card -->
			<button
				onclick={() => selectRole('traveler')}
				class="w-full rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-gray-300 hover:shadow-md"
			>
				<div class="mb-4">
					<div
						class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
					>
						<svg
							class="h-6 w-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
					</div>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">여행자</h3>
				<p class="text-sm text-gray-600">현지 가이드와 함께하는 특별한 여행을 계획하고 있어요</p>
			</button>

			<!-- Guide Card -->
			<button
				onclick={() => selectRole('guide')}
				class="w-full rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-gray-300 hover:shadow-md"
			>
				<div class="mb-4">
					<div
						class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-6 w-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</div>
				</div>
				<h3 class="mb-2 text-lg font-semibold text-gray-900">가이드</h3>
				<p class="text-sm text-gray-600">현지 전문 지식으로 여행자에게 특별한 경험을 제공해요</p>
			</button>
		</div>

		<!-- Info -->
		<div class="mt-8 rounded-lg bg-gray-50 p-4">
			<p class="text-center text-xs text-gray-600">
				선택한 역할은 나중에 설정에서 변경할 수 있습니다
			</p>
		</div>
	</div>
</div>
