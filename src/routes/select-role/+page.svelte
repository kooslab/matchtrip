<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';

	let selectedRole: 'traveler' | 'guide' | null = $state(null);
	let isLoading = $state(false);
	let error = $state('');

	async function handleRoleSelection() {
		if (!selectedRole) {
			error = '역할을 선택해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/user/set-role', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: selectedRole })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || '역할 선택에 실패했습니다.');
			}

			// Invalidate all data to refresh user session
			await invalidateAll();

			// Redirect to role-specific onboarding page
			await goto(`/onboarding/${selectedRole}`);
		} catch (err) {
			error = err instanceof Error ? err.message : '역할 선택 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-2xl font-bold text-gray-900">어떤 역할로 시작하시겠어요?</h1>
			<p class="text-gray-600">언제든지 변경할 수 있어요</p>
		</div>

		<div class="space-y-4">
			<!-- Traveler Option -->
			<button
				onclick={() => (selectedRole = 'traveler')}
				class="w-full rounded-xl border-2 bg-white p-6 transition-all {selectedRole === 'traveler'
					? 'border-blue-500 shadow-lg'
					: 'border-gray-200 hover:border-gray-300 hover:shadow-md'}"
				disabled={isLoading}
			>
				<div class="flex items-start gap-4">
					<!-- Placeholder for traveler image -->
					<div
						class="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200"
					>
						<span class="text-xs text-gray-400">Image</span>
					</div>

					<div class="flex-1 text-left">
						<h3 class="mb-1 text-lg font-semibold">여행자로 시작하기</h3>
						<p class="text-sm text-gray-600">
							현지 가이드와 함께 특별한 여행을 계획하고 경험해보세요
						</p>
					</div>

					<!-- Radio button indicator -->
					<div class="mt-6 flex-shrink-0">
						<div
							class="h-5 w-5 rounded-full border-2 {selectedRole === 'traveler'
								? 'border-blue-500'
								: 'border-gray-300'} flex items-center justify-center"
						>
							{#if selectedRole === 'traveler'}
								<div class="h-3 w-3 rounded-full bg-blue-500"></div>
							{/if}
						</div>
					</div>
				</div>
			</button>

			<!-- Guide Option -->
			<button
				onclick={() => (selectedRole = 'guide')}
				class="w-full rounded-xl border-2 bg-white p-6 transition-all {selectedRole === 'guide'
					? 'border-blue-500 shadow-lg'
					: 'border-gray-200 hover:border-gray-300 hover:shadow-md'}"
				disabled={isLoading}
			>
				<div class="flex items-start gap-4">
					<!-- Placeholder for guide image -->
					<div
						class="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200"
					>
						<span class="text-xs text-gray-400">Image</span>
					</div>

					<div class="flex-1 text-left">
						<h3 class="mb-1 text-lg font-semibold">가이드로 시작하기</h3>
						<p class="text-sm text-gray-600">여행자에게 특별한 경험을 제공하고 수익을 창출하세요</p>
					</div>

					<!-- Radio button indicator -->
					<div class="mt-6 flex-shrink-0">
						<div
							class="h-5 w-5 rounded-full border-2 {selectedRole === 'guide'
								? 'border-blue-500'
								: 'border-gray-300'} flex items-center justify-center"
						>
							{#if selectedRole === 'guide'}
								<div class="h-3 w-3 rounded-full bg-blue-500"></div>
							{/if}
						</div>
					</div>
				</div>
			</button>
		</div>

		{#if error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
				<p class="text-center text-sm text-red-600">{error}</p>
			</div>
		{/if}

		<button
			onclick={handleRoleSelection}
			disabled={!selectedRole || isLoading}
			class="mt-8 w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
		>
			{#if isLoading}
				처리 중...
			{:else}
				계속하기
			{/if}
		</button>
	</div>
</div>
