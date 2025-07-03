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
			// Guides go to a different phone page (no verification)
			if ($page.data.user?.role === 'guide') {
				await goto('/onboarding/guide-phone');
			} else {
				await goto('/onboarding/phone');
			}
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

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-gray-600">1/4</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-blue-600 transition-all duration-300"
					style="width: 25%"
				></div>
			</div>
		</div>

		<div class="rounded-xl bg-white p-8 shadow-md">
			<h1 class="mb-2 text-2xl font-bold text-gray-900">이름을 알려주세요</h1>
			<p class="mb-8 text-gray-600">매치트립에서 사용할 이름을 입력해주세요</p>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-6"
			>
				<div>
					<label for="firstName" class="mb-2 block text-sm font-medium text-gray-700">
						이름 (First name)
					</label>
					<input
						id="firstName"
						type="text"
						bind:value={firstName}
						onkeydown={handleKeydown}
						placeholder="길동"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
						disabled={isLoading}
					/>
				</div>

				<div>
					<label for="lastName" class="mb-2 block text-sm font-medium text-gray-700">
						성 (Last name)
					</label>
					<input
						id="lastName"
						type="text"
						bind:value={lastName}
						onkeydown={handleKeydown}
						placeholder="홍"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
						disabled={isLoading}
					/>
				</div>

				{#if error}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="text-sm text-red-600">{error}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={!canSubmit || isLoading}
					class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					{#if isLoading}
						저장 중...
					{:else}
						계속하기
					{/if}
				</button>
			</form>

			<p class="mt-6 text-center text-sm text-gray-500">실명을 입력해주세요. 예약 시 필요합니다.</p>
		</div>
	</div>
</div>
