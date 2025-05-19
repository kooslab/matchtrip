<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);

	function togglePassword() {
		showPassword = !showPassword;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isLoading = true;
		error = '';
		try {
			const res = await fetch('/api/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name: email, role: 'guide' })
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error || '알 수 없는 오류가 발생했습니다.';
			} else {
				window.location.href = '/app';
			}
		} catch (e) {
			error = '서버 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
	<img src="/logo.jpg" alt="MatchTrip Logo" class="mb-8 h-48 w-auto object-contain shadow" />
	<h2 class="mb-1 text-center text-2xl font-bold text-gray-800">가이드 회원가입</h2>
	<p class="mb-6 text-center text-sm text-gray-500">여행 가이드로 새로운 여정을 시작하세요!</p>
	<form class="flex w-full max-w-xs flex-col gap-4" onsubmit={handleSubmit}>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-gray-700">이메일</span>
			<input
				type="email"
				placeholder="Email"
				class="rounded-md border border-gray-300 p-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				bind:value={email}
				disabled={isLoading}
				required />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-gray-700">비밀번호</span>
			<div class="relative">
				<input
					type={showPassword ? 'text' : 'password'}
					placeholder="Password"
					class="w-full rounded-md border border-gray-300 p-2 pr-10 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
					bind:value={password}
					disabled={isLoading}
					required />
				<button
					type="button"
					tabindex="-1"
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
					onclick={togglePassword}
					aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
					{#if showPassword}
						<!-- Eye Off Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
					{:else}
						<!-- Eye Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
					{/if}
				</button>
			</div>
		</label>
		<Button type="submit" loading={isLoading} loadingText="회원가입 중..." class="mt-2 w-full"
			>회원가입</Button>
		{#if error}
			<p class="mt-2 text-center text-sm text-red-500">{error}</p>
		{/if}
		<p class="mt-6 text-center text-sm text-gray-500">
			이미 계정이 있으신가요?
			<a href="/signin" class="ml-1 text-blue-500 hover:underline">로그인</a>
		</p>
	</form>
</div>
