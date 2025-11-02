<script lang="ts">
	import { onMount } from 'svelte';
	import { ChevronDown, X } from 'lucide-svelte';

	type Props = {
		isOpen: boolean;
		onClose: () => void;
		userRole: 'guide' | 'traveler';
	};

	const { isOpen, onClose, userRole }: Props = $props();

	type FaqItem = {
		id: string;
		title: string;
		content: string;
		targetRole: 'guide' | 'traveler' | 'both';
		displayOrder: number;
	};

	let faqs = $state<FaqItem[]>([]);
	let loading = $state(true);
	let openFaqId = $state<string | null>(null);

	async function loadFaqs() {
		try {
			loading = true;
			const response = await fetch(`/api/faqs?role=${userRole}`);
			if (response.ok) {
				faqs = await response.json();
			}
		} catch (error) {
			console.error('Failed to load FAQs:', error);
		} finally {
			loading = false;
		}
	}

	function toggleFaq(faqId: string) {
		openFaqId = openFaqId === faqId ? null : faqId;
	}

	onMount(() => {
		if (isOpen) {
			loadFaqs();
		}
	});

	$effect(() => {
		if (isOpen) {
			loadFaqs();
		}
	});
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black/50" onclick={onClose}></div>

	<!-- Modal Container -->
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<!-- Modal Content -->
		<div class="animate-slide-up relative w-full max-w-lg rounded-t-3xl bg-white">
			<!-- Header -->
			<div class="sticky top-0 z-10 bg-white px-6 pb-4 pt-6">
				<div class="mb-6 flex items-start justify-between">
					<div>
						<h2 class="text-2xl font-bold text-[#052236]">FAQ</h2>
						<p class="mt-2 text-sm text-[#999999]">자주 묻는 질문들을 정리했습니다</p>
					</div>
					<button
						onclick={onClose}
						class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
					>
						<X class="h-5 w-5 text-gray-400" />
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="max-h-[60vh] overflow-y-auto px-6">
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<div class="text-[#999999]">로딩 중...</div>
					</div>
				{:else if faqs.length === 0}
					<div class="flex items-center justify-center py-12">
						<div class="text-[#999999]">등록된 FAQ가 없습니다.</div>
					</div>
				{:else}
					<div class="space-y-4 pb-6">
						{#each faqs as faq (faq.id)}
							<div class="border-b border-gray-100 pb-4 last:border-0">
								<!-- Question -->
								<button
									onclick={() => toggleFaq(faq.id)}
									class="flex w-full items-start justify-between gap-3 text-left"
								>
									<div class="flex gap-2">
										<span class="font-semibold text-[#1E90FF]">Q.</span>
										<span class="text-[15px] font-medium text-[#052236]">{faq.title}</span>
									</div>
									<ChevronDown
										class="mt-0.5 h-5 w-5 flex-shrink-0 transition-all {openFaqId === faq.id
											? 'rotate-180 text-[#1E90FF]'
											: 'text-gray-300'}"
									/>
								</button>

								<!-- Answer -->
								{#if openFaqId === faq.id}
									<div class="mt-4 rounded-lg bg-gray-50 px-4 py-4">
										<div class="flex gap-2">
											<span class="font-semibold text-[#1E90FF]">A.</span>
											<p class="whitespace-pre-wrap text-[14px] leading-relaxed text-[#666666]">
												{faq.content}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Bottom Button -->
			<div class="sticky bottom-0 bg-white px-6 pb-6 pt-4">
				<a
					href="http://pf.kakao.com/_Rxcxfxin/chat"
					target="_blank"
					rel="noopener noreferrer"
					class="block w-full rounded-xl bg-[#1E90FF] py-4 text-center text-[16px] font-semibold text-white transition-colors hover:bg-[#1c7ed6]"
				>
					1:1 문의하기
				</a>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
