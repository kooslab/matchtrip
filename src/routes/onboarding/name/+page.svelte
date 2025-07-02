<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let firstName = $state('');
	let lastName = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Pre-fill with existing name if available
	$effect(() => {
		if ($page.data.user?.name) {
			const nameParts = $page.data.user.name.split(' ');
			if (nameParts.length >= 2) {
				firstName = nameParts[0];
				lastName = nameParts.slice(1).join(' ');
			} else {
				firstName = nameParts[0];
			}
		}
	});

	const isValidName = (name: string) => {
		// Basic validation: at least 1 character, no numbers or special characters
		return name.length >= 1 && /^[a-zA-Z가-힣\s]+$/.test(name);
	};

	const canSubmit = $derived(
		firstName.trim().length > 0 && 
		lastName.trim().length > 0 && 
		isValidName(firstName) && 
		isValidName(lastName)
	);

	async function handleSubmit() {
		if (!canSubmit || isLoading) return;

		isLoading = true;
		error = '';

		try {
			const fullName = `${firstName.trim()} ${lastName.trim()}`;
			
			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: fullName })
			});

			if (!response.ok) {
				throw new Error('Failed to update name');
			}

			// Continue to phone verification
			await goto('/onboarding/phone');
		} catch (err) {
			error = err instanceof Error ? err.message : '이름 저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canSubmit) {
			handleSubmit();
		}
	}
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600">1/4</span>
			</div>
			<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
				<div class="h-full bg-blue-600 rounded-full transition-all duration-300" style="width: 25%"></div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-md p-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">이름을 알려주세요</h1>
			<p class="text-gray-600 mb-8">매치트립에서 사용할 이름을 입력해주세요</p>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
				<div>
					<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
						이름 (First name)
					</label>
					<input
						id="firstName"
						type="text"
						bind:value={firstName}
						onkeydown={handleKeydown}
						placeholder="길동"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
						성 (Last name)
					</label>
					<input
						id="lastName"
						type="text"
						bind:value={lastName}
						onkeydown={handleKeydown}
						placeholder="홍"
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
						disabled={isLoading}
					/>
				</div>

				{#if error}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-sm text-red-600">{error}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={!canSubmit || isLoading}
					class="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						저장 중...
					{:else}
						계속하기
					{/if}
				</button>
			</form>

			<p class="text-center text-sm text-gray-500 mt-6">
				실명을 입력해주세요. 예약 시 필요합니다.
			</p>
		</div>
	</div>
</div>