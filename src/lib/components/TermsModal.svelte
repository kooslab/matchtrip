<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import IconArrowLeft from '$lib/icons/icon-arrow-left-small-mono.svg?raw';
	import PrivacyPolicyContent from './PrivacyPolicyContent.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		title: string;
		type: 'terms' | 'privacy' | 'marketing';
	}

	let { isOpen, onClose, title, type }: Props = $props();

	// Prevent modal from closing when clicking inside
	function handleModalClick(e: MouseEvent) {
		e.stopPropagation();
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 z-[60] bg-black/50"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
		aria-label="Close modal"
	>
		<!-- Modal Container -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<!-- Modal Content -->
			<div
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				class="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
				transition:fly={{ y: 50, duration: 300 }}
				onclick={handleModalClick}
				onkeydown={(e) => e.key === 'Escape' && onClose()}
			>
				<!-- Header -->
				<div class="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
					<button onclick={onClose} class="h-6 w-6 text-gray-600 hover:text-gray-800">
						{@html IconArrowLeft}
					</button>
					<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
				</div>

				<!-- Content -->
				<div class="flex-1 overflow-y-auto px-6 py-4">
					{#if type === 'terms'}
						<div class="space-y-4 text-sm text-gray-700">
							<h3 class="font-bold">제1조 (목적)</h3>
							<p>
								이 약관은 매치트립(이하 "회사")이 운영하는 매치트립 서비스(이하 "서비스")를 이용함에
								있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
							</p>

							<h3 class="font-bold">제2조 (정의)</h3>
							<p>
								1. "서비스"란 회사가 제공하는 여행자와 현지 가이드를 연결하는 플랫폼 서비스를
								의미합니다.<br />
								2. "회원"이란 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는
								고객을 말합니다.<br />
								3. "여행자"란 서비스를 통해 여행 가이드를 찾는 회원을 말합니다.<br />
								4. "가이드"란 서비스를 통해 여행 가이드 서비스를 제공하는 회원을 말합니다.
							</p>

							<h3 class="font-bold">제3조 (약관의 게시와 개정)</h3>
							<p>
								1. 회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br
								/>
								2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
							</p>

							<h3 class="font-bold">제4조 (서비스의 제공)</h3>
							<p>
								회사는 다음과 같은 서비스를 제공합니다:<br />
								1. 여행자와 가이드 매칭 서비스<br />
								2. 여행 일정 관리 서비스<br />
								3. 결제 대행 서비스<br />
								4. 기타 회사가 정하는 서비스
							</p>

							<h3 class="font-bold">제5조 (회원가입)</h3>
							<p>
								1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는
								의사표시를 함으로써 회원가입을 신청합니다.<br />
								2. 회사는 이용자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다.
							</p>
						</div>
					{:else if type === 'privacy'}
						<PrivacyPolicyContent />
					{:else if type === 'marketing'}
						<div class="space-y-4 text-sm text-gray-700">
							<h3 class="font-bold">마케팅 정보 수신 동의</h3>
							<p>
								매치트립은 회원님께 보다 나은 서비스를 제공하기 위해 다음과 같은 정보를
								전달해드리고자 합니다.
							</p>

							<h3 class="font-bold">1. 수신 정보의 내용</h3>
							<ul class="list-disc space-y-1 pl-5">
								<li>신규 서비스 및 기능 안내</li>
								<li>이벤트 및 프로모션 정보</li>
								<li>여행 관련 유용한 정보 및 팁</li>
								<li>맞춤형 여행 추천 정보</li>
								<li>설문조사 및 서비스 개선 요청</li>
							</ul>

							<h3 class="font-bold">2. 전송 방법</h3>
							<p>이메일, SMS, 앱 푸시 알림 등을 통해 정보를 전달합니다.</p>

							<h3 class="font-bold">3. 수신 동의 철회</h3>
							<p>
								마케팅 정보 수신에 동의하신 후에도 언제든지 수신을 거부하실 수 있습니다. 수신 거부는
								서비스 내 설정 메뉴 또는 수신한 마케팅 정보 내 수신거부 링크를 통해 가능합니다.
							</p>

							<h3 class="font-bold">4. 개인정보 보호</h3>
							<p>
								회사는 회원님의 개인정보를 소중히 다루며, 마케팅 정보 발송 외의 목적으로는 사용하지
								않습니다. 자세한 내용은 개인정보처리방침을 참고해주세요.
							</p>

							<h3 class="font-bold">5. 혜택</h3>
							<p>마케팅 정보 수신에 동의하시면 다음과 같은 혜택을 받으실 수 있습니다:</p>
							<ul class="list-disc space-y-1 pl-5">
								<li>회원 전용 할인 쿠폰 제공</li>
								<li>신규 기능 우선 체험 기회</li>
								<li>특별 이벤트 초대</li>
							</ul>
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-100 p-6">
					<button
						onclick={onClose}
						class="w-full rounded-xl bg-blue-500 py-4 text-base font-medium text-white transition-colors hover:bg-blue-600"
					>
						확인
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Ensure icons maintain their aspect ratio */
	:global(.h-6.w-6 svg) {
		width: 100%;
		height: 100%;
	}
</style>
