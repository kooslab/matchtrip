<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	const { data } = $props();
	const user = $derived(data?.user);

	let formData = $state({
		name: user?.name || '',
		email: user?.email || '',
		phone: user?.phone || ''
	});

	let isSubmitting = $state(false);
	let message = $state('');

	async function handleSubmit() {
		isSubmitting = true;
		message = '';

		try {
			const response = await fetch('/api/profile/update-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			const result = await response.json();

			if (response.ok) {
				message = '회원 정보가 성공적으로 업데이트되었습니다.';
				setTimeout(() => {
					goto('/profile/guide');
				}, 1500);
			} else {
				message = result.error || '업데이트에 실패했습니다.';
			}
		} catch (error) {
			message = '오류가 발생했습니다. 다시 시도해주세요.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between px-4 py-3">
			<button onclick={() => goto('/profile/guide')} class="p-1">
				<ChevronLeft class="h-6 w-6" />
			</button>
			<h1 class="text-lg font-semibold">회원 정보 수정</h1>
			<div class="w-8"></div>
		</div>
	</header>

	<div class="mx-auto max-w-md">
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-4 space-y-4">
			<!-- Name Field -->
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					이름
				</label>
				<input
					type="text"
					id="name"
					bind:value={formData.name}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
					required
				/>
			</div>

			<!-- Email Field -->
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					이메일
				</label>
				<input
					type="email"
					id="email"
					bind:value={formData.email}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
					readonly
					disabled
				/>
				<p class="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
			</div>

			<!-- Phone Field -->
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
					전화번호
				</label>
				<input
					type="tel"
					id="phone"
					bind:value={formData.phone}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
					required
				/>
			</div>

			{#if message}
				<div class="p-3 rounded-lg {message.includes('성공') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
					{message}
				</div>
			{/if}

			<!-- Submit Button -->
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? '처리중...' : '정보 수정'}
			</button>
		</form>

		<!-- Additional Options -->
		<div class="p-4 border-t border-gray-200">
			<button
				onclick={() => goto('/profile/guide/edit')}
				class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
			>
				가이드 프로필 수정
			</button>
		</div>
	</div>
</div>