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

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-3xl mx-auto">
		<div class="bg-white shadow-lg rounded-lg overflow-hidden">
			<!-- Header -->
			<div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
				<div class="flex items-center justify-center mb-4">
					<Clock class="h-16 w-16" />
				</div>
				<h1 class="text-3xl font-bold text-center">가이드 승인 대기 중</h1>
				<p class="text-center mt-2 text-blue-100">
					가이드 신청이 성공적으로 접수되었습니다
				</p>
			</div>
			
			<!-- Content -->
			<div class="p-6 sm:p-8">
				<div class="text-center mb-8">
					<p class="text-lg text-gray-700 mb-4">
						안녕하세요, <span class="font-semibold">{data.user.name}</span>님!
					</p>
					<p class="text-gray-600">
						가이드 프로필이 검토 중입니다. 보통 24-48시간 내에 승인 여부가 결정됩니다.
					</p>
				</div>
				
				<!-- Status Timeline -->
				<div class="mb-8">
					<div class="relative">
						<div class="flex items-center mb-4">
							<div class="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full">
								<CheckCircle class="w-6 h-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-900">프로필 제출 완료</p>
								<p class="text-sm text-gray-500">
									{new Date(data.guideProfile.createdAt).toLocaleDateString('ko-KR')}
								</p>
							</div>
						</div>
						
						<div class="flex items-center mb-4 ml-5 border-l-2 border-gray-300 pl-5 pb-4">
							<div class="flex items-center justify-center w-10 h-10 bg-yellow-500 rounded-full animate-pulse">
								<Clock class="w-6 h-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-900">관리자 검토 중</p>
								<p class="text-sm text-gray-500">현재 진행 중</p>
							</div>
						</div>
						
						<div class="flex items-center ml-5 opacity-50">
							<div class="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
								<CheckCircle class="w-6 h-6 text-white" />
							</div>
							<div class="ml-4">
								<p class="font-semibold text-gray-500">승인 완료</p>
								<p class="text-sm text-gray-400">대기 중</p>
							</div>
						</div>
					</div>
				</div>
				
				<!-- What happens next -->
				<div class="bg-blue-50 rounded-lg p-6 mb-8">
					<h2 class="text-lg font-semibold text-gray-900 mb-3">승인 후 가능한 활동</h2>
					<ul class="space-y-2 text-gray-700">
						<li class="flex items-start">
							<span class="text-blue-500 mr-2">•</span>
							<span>여행자들의 여행 요청 확인 및 제안서 작성</span>
						</li>
						<li class="flex items-start">
							<span class="text-blue-500 mr-2">•</span>
							<span>여행자와의 메시지 교환</span>
						</li>
						<li class="flex items-start">
							<span class="text-blue-500 mr-2">•</span>
							<span>가이드 투어 진행 및 수익 창출</span>
						</li>
						<li class="flex items-start">
							<span class="text-blue-500 mr-2">•</span>
							<span>프로필에 인증 마크 표시</span>
						</li>
					</ul>
				</div>
				
				<!-- Contact Information -->
				<div class="border-t pt-6">
					<h3 class="text-sm font-semibold text-gray-900 mb-3">승인 알림을 받을 연락처</h3>
					<div class="space-y-2">
						<div class="flex items-center text-gray-600">
							<Mail class="w-4 h-4 mr-2" />
							<span class="text-sm">{data.user.email}</span>
						</div>
						{#if data.user.phone}
							<div class="flex items-center text-gray-600">
								<Phone class="w-4 h-4 mr-2" />
								<span class="text-sm">{data.user.phone}</span>
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Support -->
				<div class="mt-8 text-center">
					<p class="text-sm text-gray-500">
						문의사항이 있으신가요?
						<a href="/support" class="text-blue-600 hover:text-blue-700 font-medium">
							고객센터 문의하기
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>