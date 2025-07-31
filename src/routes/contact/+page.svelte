<script lang="ts">
	// Add navigation
	import { goto } from '$app/navigation';

	function goBack() {
		window.history.back();
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-12">
	<button onclick={goBack} class="mb-6 flex items-center text-blue-500 hover:text-blue-700">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mr-2 h-5 w-5"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd"
			/>
		</svg>
		뒤로 가기
	</button>

	<h1 class="mb-8 text-3xl font-bold text-gray-900">문의하기</h1>

	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
		<h2 class="mb-6 text-xl font-semibold text-gray-800">연락처 정보</h2>

		<div class="space-y-6">
			<div class="flex items-start">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<h3 class="text-sm font-medium text-gray-500">이메일</h3>
					<p class="mt-1 text-base text-gray-900">help@agentt.kr</p>
				</div>
			</div>

			<div class="flex items-start">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<h3 class="text-sm font-medium text-gray-500">전화</h3>
					<p class="mt-1 text-base text-gray-900">한국 🇰🇷 1661-0213</p>
					<p class="text-sm text-gray-600">(평일 10:00 - 18:00)</p>
				</div>
			</div>

			<div class="flex items-start">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<h3 class="text-sm font-medium text-gray-500">주소</h3>
					<p class="mt-1 text-base text-gray-900">
						경기도 화성시 메타폴리스로 42 9층 901호 A13호<br />
						(반송동, 디앤씨빌딩)
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="rounded-lg bg-gray-50 p-8">
		<h3 class="mb-4 text-lg font-semibold text-gray-800">빠른 응답을 위한 팁</h3>
		<ul class="space-y-3 text-sm text-gray-600">
			<li class="flex items-start">
				<svg class="mt-0.5 mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>구체적인 정보를 포함해 주세요</span>
			</li>
			<li class="flex items-start">
				<svg class="mt-0.5 mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>예약 번호가 있다면 함께 기재해 주세요</span>
			</li>
			<li class="flex items-start">
				<svg class="mt-0.5 mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>영업시간 내 연락을 권장합니다</span>
			</li>
		</ul>
	</div>
</div>