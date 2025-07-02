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

			// Redirect to name collection page
			await goto('/onboarding/name');
		} catch (err) {
			error = err instanceof Error ? err.message : '역할 선택 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">어떤 역할로 시작하시겠어요?</h1>
			<p class="text-gray-600">언제든지 변경할 수 있어요</p>
		</div>

		<div class="space-y-4">
			<!-- Traveler Option -->
			<button
				onclick={() => selectedRole = 'traveler'}
				class="w-full p-6 bg-white rounded-xl border-2 transition-all {selectedRole === 'traveler' ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}"
				disabled={isLoading}
			>
				<div class="flex items-start gap-4">
					<!-- Placeholder for traveler image -->
					<div class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
						<span class="text-gray-400 text-xs">Image</span>
					</div>
					
					<div class="flex-1 text-left">
						<h3 class="text-lg font-semibold mb-1">여행자로 시작하기</h3>
						<p class="text-sm text-gray-600">
							현지 가이드와 함께 특별한 여행을 계획하고 경험해보세요
						</p>
					</div>

					<!-- Radio button indicator -->
					<div class="flex-shrink-0 mt-6">
						<div class="w-5 h-5 rounded-full border-2 {selectedRole === 'traveler' ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center">
							{#if selectedRole === 'traveler'}
								<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
							{/if}
						</div>
					</div>
				</div>
			</button>

			<!-- Guide Option -->
			<button
				onclick={() => selectedRole = 'guide'}
				class="w-full p-6 bg-white rounded-xl border-2 transition-all {selectedRole === 'guide' ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}"
				disabled={isLoading}
			>
				<div class="flex items-start gap-4">
					<!-- Placeholder for guide image -->
					<div class="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
						<span class="text-gray-400 text-xs">Image</span>
					</div>
					
					<div class="flex-1 text-left">
						<h3 class="text-lg font-semibold mb-1">가이드로 시작하기</h3>
						<p class="text-sm text-gray-600">
							여행자에게 특별한 경험을 제공하고 수익을 창출하세요
						</p>
					</div>

					<!-- Radio button indicator -->
					<div class="flex-shrink-0 mt-6">
						<div class="w-5 h-5 rounded-full border-2 {selectedRole === 'guide' ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center">
							{#if selectedRole === 'guide'}
								<div class="w-3 h-3 bg-blue-500 rounded-full"></div>
							{/if}
						</div>
					</div>
				</div>
			</button>
		</div>

		{#if error}
			<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
				<p class="text-sm text-red-600 text-center">{error}</p>
			</div>
		{/if}

		<button
			onclick={handleRoleSelection}
			disabled={!selectedRole || isLoading}
			class="w-full mt-8 py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
		>
			{#if isLoading}
				처리 중...
			{:else}
				계속하기
			{/if}
		</button>
	</div>
</div>