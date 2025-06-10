<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import { resetPassword } from '$lib/authClient';
	import { onMount } from 'svelte';
	
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;
	let token = '';
	
	onMount(() => {
		token = $page.url.searchParams.get('token') || '';
		if (!token) {
			error = '유효하지 않은 비밀번호 재설정 링크입니다.';
		}
	});
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		
		if (password !== confirmPassword) {
			error = '비밀번호가 일치하지 않습니다.';
			return;
		}
		
		loading = true;
		
		try {
			const response = await resetPassword({
				token,
				newPassword: password
			});
			
			if (response.error) {
				error = '비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.';
			} else {
				success = true;
				setTimeout(() => {
					goto('/signin?reset=true');
				}, 3000);
			}
		} catch (err) {
			error = '오류가 발생했습니다. 다시 시도해 주세요.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				새 비밀번호 설정
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				새로운 비밀번호를 입력해 주세요.
			</p>
		</div>
		
		{#if success}
			<div class="rounded-md bg-green-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800">
							비밀번호가 성공적으로 변경되었습니다
						</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>잠시 후 로그인 페이지로 이동합니다...</p>
						</div>
					</div>
				</div>
			</div>
		{:else if !token}
			<div class="rounded-md bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">{error}</h3>
						<div class="mt-4">
							<Button href="/forgot-password" variant="primary">
								비밀번호 재설정 요청하기
							</Button>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<form class="mt-8 space-y-6" on:submit={handleSubmit}>
				{#if error}
					<div class="rounded-md bg-red-50 p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-red-800">{error}</p>
							</div>
						</div>
					</div>
				{/if}
				
				<div class="space-y-4">
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">
							새 비밀번호
						</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							bind:value={password}
							class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
							placeholder="8-20자, 숫자와 특수문자 포함"
						/>
					</div>
					
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
							새 비밀번호 확인
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							required
							bind:value={confirmPassword}
							class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
							placeholder="비밀번호를 다시 입력하세요"
						/>
					</div>
				</div>
				
				<div class="flex flex-col space-y-4">
					<Button
						type="submit"
						variant="primary"
						loading={loading}
						disabled={loading || !password || !confirmPassword}
						class="w-full"
					>
						비밀번호 변경
					</Button>
					
					<Button href="/signin" variant="secondary" class="w-full">
						로그인 페이지로 돌아가기
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>