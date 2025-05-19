<script lang="ts">
	import { signUp } from '$lib/authClient';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit() {
		isLoading = true;
		try {
			const result = await signUp.email({
				email,
				password,
				name: email,
				role: 'guide'
			});
			if (result.error) {
				error = result.error.message ?? '알 수 없는 오류가 발생했습니다.';
			} else {
				goto('/app');
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
	<img src="/logo.jpg" alt="MatchTrip Logo" class="mb-8 h-24 w-auto object-contain shadow" />
	<h2 class="mb-1 text-center text-2xl font-bold text-gray-800">가이드 회원가입</h2>
	<p class="mb-6 text-center text-sm text-gray-500">여행 가이드로 새로운 여정을 시작하세요!</p>
	<form class="flex w-full max-w-xs flex-col gap-4" on:submit|preventDefault={handleSubmit}>
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
			<input
				type="password"
				placeholder="Password"
				class="rounded-md border border-gray-300 p-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				bind:value={password}
				disabled={isLoading}
				required />
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
