<script lang="ts">
	import { CheckCircle, Clock, Mail, Phone } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';

	interface Props {
		data: {
			user: {
				name: string;
				email: string;
				phone?: string;
			};
			guideProfile: {
				isVerified: boolean;
				createdAt: string;
			};
		};
	}

	let { data }: Props = $props();

	// Check verification status every 30 seconds
	onMount(() => {
		const interval = setInterval(() => {
			invalidate('app:guide-verification');
		}, 30000);

		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-3xl">
		<div class="overflow-hidden rounded-lg bg-white shadow-lg">
			<!-- Header -->
			<div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
				<div class="mb-4 flex items-center justify-center">
					<Clock class="h-16 w-16" />
				</div>
				<h1 class="text-center text-3xl font-bold">가이드 승인 대기 중</h1>
				<p class="mt-2 text-center text-blue-100">가이드 신청이 성공적으로 접수되었습니다</p>
			</div>

			<!-- Content -->
			<div class="p-6 sm:p-8">
				<div class="mb-8 text-center">
					<p class="mb-4 text-lg text-gray-700">
						안녕하세요, <span class="font-semibold">{data.user.name}</span>님!
					</p>
					<p class="text-gray-600">
						가이드 프로필이 검토 중입니다. 보통 24-48시간 내에 승인 여부가 결정됩니다.
					</p>
				</div>

				<!-- Status Timeline -->
				<div class="mb-8">
					<div class="relative">
						<div class="mb-4 flex items-center">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
								<CheckCircle class="h-6 w-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-900">프로필 제출 완료</p>
								<p class="text-sm text-gray-500">
									{new Date(data.guideProfile.createdAt).toLocaleDateString('ko-KR')}
								</p>
							</div>
						</div>

						<div class="mb-4 ml-5 flex items-center border-l-2 border-gray-300 pb-4 pl-5">
							<div
								class="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-yellow-500"
							>
								<Clock class="h-6 w-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-900">관리자 검토 중</p>
								<p class="text-sm text-gray-500">현재 진행 중</p>
							</div>
						</div>

						<div class="ml-5 flex items-center opacity-50">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
								<CheckCircle class="h-6 w-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-500">승인 완료</p>
								<p class="text-sm text-gray-400">대기 중</p>
							</div>
						</div>
					</div>
				</div>

				<!-- What happens next -->
				<div class="mb-8 rounded-lg bg-blue-50 p-6">
					<h2 class="mb-3 text-lg font-semibold text-gray-900">승인 후 가능한 활동</h2>
					<ul class="space-y-2 text-gray-700">
						<li class="flex items-start">
							<span class="mr-2 text-blue-500">•</span>
							<span>여행자들의 여행 요청 확인 및 제안서 작성</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-blue-500">•</span>
							<span>여행자와의 메시지 교환</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-blue-500">•</span>
							<span>가이드 투어 진행 및 수익 창출</span>
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-blue-500">•</span>
							<span>프로필에 인증 마크 표시</span>
						</li>
					</ul>
				</div>

				<!-- Contact Information -->
				<div class="border-t pt-6">
					<h3 class="mb-3 text-sm font-semibold text-gray-900">승인 알림을 받을 연락처</h3>
					<div class="space-y-2">
						<div class="flex items-center text-gray-600">
							<Mail class="mr-2 h-4 w-4" />
							<span class="text-sm">{data.user.email}</span>
						</div>
						{#if data.user.phone}
							<div class="flex items-center text-gray-600">
								<Phone class="mr-2 h-4 w-4" />
								<span class="text-sm">{data.user.phone}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Support -->
				<div class="mt-8 text-center">
					<p class="text-sm text-gray-500">
						문의사항이 있으신가요?
						<a href="/support" class="font-medium text-blue-600 hover:text-blue-700">
							고객센터 문의하기
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
