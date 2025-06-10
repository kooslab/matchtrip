<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { forgetPassword } from '$lib/authClient';
	
	let email = '';
	let loading = false;
	let error = '';
	let success = false;
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		
		try {
			const response = await forgetPassword({
				email,
				redirectTo: '/reset-password'
			});
			
			if (response.error) {
				error = '비밀번호 재설정 이메일 전송에 실패했습니다.';
			} else {
				success = true;
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
				비밀번호 재설정
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
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
							비밀번호 재설정 이메일을 전송했습니다
						</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.</p>
							<p class="mt-1">이메일이 도착하지 않으면 스팸 폴더를 확인해 주세요.</p>
						</div>
						<div class="mt-4">
							<Button href="/signin" variant="secondary">
								로그인 페이지로 돌아가기
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
				
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						이메일 주소
					</label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
							placeholder="your@email.com"
						/>
					</div>
				</div>
				
				<div class="flex flex-col space-y-4">
					<Button
						type="submit"
						variant="primary"
						loading={loading}
						disabled={loading || !email}
						class="w-full"
					>
						비밀번호 재설정 링크 보내기
					</Button>
					
					<Button href="/signin" variant="secondary" class="w-full">
						로그인 페이지로 돌아가기
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>