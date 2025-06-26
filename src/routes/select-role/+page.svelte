<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { MapPin, Users } from 'lucide-svelte';

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

			// Redirect based on selected role
			// TODO: Later redirect to onboarding pages
			if (selectedRole === 'guide') {
				await goto('/my-offers');
			} else {
				await goto('/my-trips');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : '역할 선택 중 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-4xl w-full">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">MatchTrip에 오신 것을 환영합니다!</h1>
			<p class="text-lg text-gray-600">여행자와 가이드를 연결하는 플랫폼입니다.</p>
		</div>

		<div class="bg-white rounded-lg shadow-lg p-8">
			<h2 class="text-2xl font-semibold text-center mb-6">어떤 역할로 시작하시겠습니까?</h2>
			
			<div class="grid md:grid-cols-2 gap-6 mb-8">
				<!-- Traveler Option -->
				<button
					onclick={() => selectedRole = 'traveler'}
					class="p-6 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md {selectedRole === 'traveler' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
					disabled={isLoading}
				>
					<div class="flex flex-col items-center text-center">
						<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
							<MapPin class="w-8 h-8 text-blue-600" />
						</div>
						<h3 class="text-xl font-semibold mb-2">여행자</h3>
						<p class="text-gray-600">
							현지 가이드와 함께 특별한 여행 경험을 만들어보세요.
						</p>
						<ul class="mt-4 text-sm text-gray-500 text-left">
							<li class="flex items-start gap-2 mb-1">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>검증된 현지 가이드 매칭</span>
							</li>
							<li class="flex items-start gap-2 mb-1">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>맞춤형 여행 일정 제안</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>안전한 결제 시스템</span>
							</li>
						</ul>
					</div>
				</button>

				<!-- Guide Option -->
				<button
					onclick={() => selectedRole = 'guide'}
					class="p-6 border-2 rounded-lg transition-all cursor-pointer hover:shadow-md {selectedRole === 'guide' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}"
					disabled={isLoading}
				>
					<div class="flex flex-col items-center text-center">
						<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
							<Users class="w-8 h-8 text-green-600" />
						</div>
						<h3 class="text-xl font-semibold mb-2">가이드</h3>
						<p class="text-gray-600">
							여행자에게 특별한 경험을 제공하고 수익을 창출하세요.
						</p>
						<ul class="mt-4 text-sm text-gray-500 text-left">
							<li class="flex items-start gap-2 mb-1">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>자유로운 일정 관리</span>
							</li>
							<li class="flex items-start gap-2 mb-1">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>여행자와 직접 소통</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="text-green-500 mt-0.5">✓</span>
								<span>투명한 수수료 정책</span>
							</li>
						</ul>
					</div>
				</button>
			</div>

			{#if error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<div class="flex justify-center">
				<Button
					onclick={handleRoleSelection}
					disabled={!selectedRole || isLoading}
					loading={isLoading}
					loadingText="처리 중..."
					class="px-8"
				>
					{selectedRole === 'guide' ? '가이드로 시작하기' : selectedRole === 'traveler' ? '여행자로 시작하기' : '역할을 선택해주세요'}
				</Button>
			</div>

			<p class="text-center text-sm text-gray-500 mt-6">
				나중에 설정에서 역할을 변경할 수 있습니다.
			</p>
		</div>
	</div>
</div>