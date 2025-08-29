<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';

	let termsAgreed = $state(false);
	let privacyAgreed = $state(false);
	let marketingAgreed = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		// If user is not logged in, redirect to signin
		if (!$page.data.user) {
			goto('/');
		}
	});

	const allRequiredAgreed = $derived(termsAgreed && privacyAgreed);

	async function handleSubmit() {
		if (!allRequiredAgreed || isSubmitting) return;

		isSubmitting = true;

		try {
			console.log('Submitting agreements...');
			const response = await fetch('/api/user/agreements', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					termsAgreed,
					privacyAgreed,
					marketingAgreed
				})
			});

			console.log('Response status:', response.status);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				console.error('Agreement API error:', errorData);
				throw new Error(errorData.error || `Failed to save agreements (${response.status})`);
			}

			// Ensure the response is fully consumed before navigating
			const data = await response.json();
			console.log('Response data:', data);

			// Redirect to role selection or appropriate page
			console.log('Navigating to /select-role...');
			await goto('/select-role', { replaceState: true });
			console.log('Navigation complete');
		} catch (error) {
			console.error('Error saving agreements:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// Show more detailed error in development
			if (window.location.hostname === 'localhost') {
				alert(`Error: ${errorMessage}\n\nCheck the browser console for more details.`);
			} else {
				alert('약관 동의 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
			}
			isSubmitting = false;
		}
	}

	function toggleAllAgreements() {
		if (termsAgreed && privacyAgreed && marketingAgreed) {
			// If all are checked, uncheck all
			termsAgreed = false;
			privacyAgreed = false;
			marketingAgreed = false;
		} else {
			// Otherwise, check all
			termsAgreed = true;
			privacyAgreed = true;
			marketingAgreed = true;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
		<h1 class="mb-2 text-center text-2xl font-bold">약관 동의</h1>
		<p class="mb-8 text-center text-gray-600">서비스 이용을 위해 약관에 동의해주세요</p>

		<div class="mb-6 space-y-4">
			<!-- All agreements checkbox -->
			<label
				class="flex cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-gray-50"
			>
				<input
					type="checkbox"
					checked={termsAgreed && privacyAgreed && marketingAgreed}
					onchange={toggleAllAgreements}
					class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<div class="ml-3 flex-1">
					<span class="text-base font-medium text-gray-900">전체 동의</span>
					<p class="mt-1 text-sm text-gray-500">
						서비스 이용을 위한 필수 및 선택 약관에 모두 동의합니다
					</p>
				</div>
			</label>

			<div class="space-y-4 border-t pt-4">
				<!-- Terms agreement -->
				<label
					class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50"
				>
					<input
						type="checkbox"
						bind:checked={termsAgreed}
						class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<div class="ml-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">이용약관 동의</span>
							<span class="text-xs font-medium text-red-500">(필수)</span>
						</div>
						<a
							href="/terms/service"
							target="_blank"
							class="mt-1 inline-block text-xs text-blue-600 hover:underline"
						>
							약관 보기
						</a>
					</div>
				</label>

				<!-- Privacy agreement -->
				<label
					class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50"
				>
					<input
						type="checkbox"
						bind:checked={privacyAgreed}
						class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<div class="ml-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">개인정보 처리방침 동의</span>
							<span class="text-xs font-medium text-red-500">(필수)</span>
						</div>
						<a
							href="/terms/privacy"
							target="_blank"
							class="mt-1 inline-block text-xs text-blue-600 hover:underline"
						>
							개인정보 처리방침 보기
						</a>
					</div>
				</label>

				<!-- Marketing agreement -->
				<label
					class="flex cursor-pointer items-start rounded-lg p-3 transition-colors hover:bg-gray-50"
				>
					<input
						type="checkbox"
						bind:checked={marketingAgreed}
						class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<div class="ml-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-sm font-medium text-gray-900">마케팅 정보 수신 동의</span>
							<span class="text-xs font-medium text-gray-500">(선택)</span>
						</div>
						<p class="mt-1 text-xs text-gray-500">
							이벤트, 할인 및 유용한 정보를 받아보실 수 있습니다
						</p>
					</div>
				</label>
			</div>
		</div>

		<Button onclick={handleSubmit} disabled={!allRequiredAgreed || isSubmitting} class="w-full">
			{isSubmitting ? '처리 중...' : '동의하고 시작하기'}
		</Button>

		<!-- Add sign out option for edge cases -->
		<button
			onclick={async () => {
				if (confirm('로그아웃 하시겠습니까?')) {
					window.location.href = '/api/auth/sign-out';
				}
			}}
			class="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
		>
			문제가 있으신가요? 로그아웃
		</button>
	</div>
</div>
