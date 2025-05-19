<script lang="ts">
	// Add navigation
	import { goto } from '$app/navigation';

	function goBack() {
		window.history.back();
	}

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let isSubmitSuccess = $state(false);

	function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		// Simulate a form submission
		setTimeout(() => {
			isSubmitting = false;
			isSubmitSuccess = true;
			name = '';
			email = '';
			subject = '';
			message = '';

			// Reset success message after a few seconds
			setTimeout(() => {
				isSubmitSuccess = false;
			}, 5000);
		}, 1500);
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-12">
	<button onclick={goBack} class="mb-6 flex items-center text-blue-500 hover:text-blue-700">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mr-2 h-5 w-5"
			viewBox="0 0 20 20"
			fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd" />
		</svg>
		뒤로 가기
	</button>

	<h1 class="mb-6 text-2xl font-bold text-gray-800">문의하기</h1>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
		<div>
			<div class="prose max-w-none rounded-md border border-gray-200 bg-white p-6 shadow-sm">
				<h2>연락처 정보</h2>
				<div class="mb-4 flex items-start">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-3 h-6 w-6 text-blue-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					<div>
						<h3 class="text-base font-medium text-gray-900">이메일</h3>
						<p class="text-gray-700">help@matchtrip.com</p>
					</div>
				</div>

				<div class="mb-4 flex items-start">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-3 h-6 w-6 text-blue-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
					</svg>
					<div>
						<h3 class="text-base font-medium text-gray-900">전화</h3>
						<p class="text-gray-700">02-123-4567</p>
						<p class="text-sm text-gray-500">(평일 10:00 - 18:00)</p>
					</div>
				</div>

				<div class="flex items-start">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-3 h-6 w-6 text-blue-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					<div>
						<h3 class="text-base font-medium text-gray-900">주소</h3>
						<p class="text-gray-700">서울특별시 강남구 테헤란로 123<br />매치트립 빌딩 4층</p>
					</div>
				</div>
			</div>
		</div>

		<div>
			<div class="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-xl font-semibold text-gray-800">문의 양식</h2>
				{#if isSubmitSuccess}
					<div class="mb-4 rounded-md bg-green-50 p-4 text-green-700">
						문의가 성공적으로 전송되었습니다. 빠른 시일 내에 답변 드리겠습니다.
					</div>
				{/if}
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700">이름</label>
						<input
							type="text"
							id="name"
							bind:value={name}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							required
							disabled={isSubmitting} />
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">이메일</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							required
							disabled={isSubmitting} />
					</div>

					<div>
						<label for="subject" class="block text-sm font-medium text-gray-700">제목</label>
						<input
							type="text"
							id="subject"
							bind:value={subject}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							required
							disabled={isSubmitting} />
					</div>

					<div>
						<label for="message" class="block text-sm font-medium text-gray-700">메시지</label>
						<textarea
							id="message"
							bind:value={message}
							rows="4"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							required
							disabled={isSubmitting}></textarea>
					</div>

					<div>
						<button
							type="submit"
							class="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
							disabled={isSubmitting}>
							{isSubmitting ? '전송 중...' : '문의 보내기'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
