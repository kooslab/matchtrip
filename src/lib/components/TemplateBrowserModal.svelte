<script lang="ts">
	import { colors } from '$lib/constants/colors';
	import binIconUrl from '$lib/icons/icon-bin-mono 1.svg';

	interface Template {
		id: string;
		title: string;
		description: string;
		usageCount: number;
		createdAt: string;
	}

	interface Props {
		showModal: boolean;
		onclose: () => void;
		onselect: (template: Template) => void;
	}

	let { showModal = $bindable(), onclose, onselect }: Props = $props();

	let templates = $state<Template[]>([]);
	let loading = $state(true);
	let selectedTemplate = $state<Template | null>(null);
	let deleteConfirmTemplate = $state<Template | null>(null);

	$effect(() => {
		if (showModal) {
			fetchTemplates();
			selectedTemplate = null;
		}
	});

	async function fetchTemplates() {
		loading = true;
		try {
			const response = await fetch('/api/offer-templates');
			if (response.ok) {
				const data = await response.json();
				templates = data.templates;
			}
		} catch (error) {
			console.error('Error fetching templates:', error);
		} finally {
			loading = false;
		}
	}

	function handleSelectTemplate(template: Template) {
		selectedTemplate = template;
	}

	function handleUseTemplate() {
		if (selectedTemplate) {
			// Update usage count
			fetch(`/api/offer-templates/${selectedTemplate.id}`, {
				method: 'PATCH'
			}).catch(console.error);

			onselect(selectedTemplate);
			onclose();
		}
	}

	function confirmDelete(template: Template) {
		deleteConfirmTemplate = template;
	}

	async function handleDeleteTemplate() {
		if (!deleteConfirmTemplate) return;

		try {
			const response = await fetch(`/api/offer-templates/${deleteConfirmTemplate.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				templates = templates.filter((t) => t.id !== deleteConfirmTemplate.id);
				if (selectedTemplate?.id === deleteConfirmTemplate.id) {
					selectedTemplate = null;
				}
			}
		} catch (error) {
			console.error('Error deleting template:', error);
		} finally {
			deleteConfirmTemplate = null;
		}
	}

	function stripHtml(html: string) {
		const div = document.createElement('div');
		div.innerHTML = html;
		return div.textContent || div.innerText || '';
	}

	function truncateText(text: string, maxLength: number = 100) {
		const stripped = stripHtml(text);
		if (stripped.length <= maxLength) return stripped;
		return stripped.substring(0, maxLength) + '...';
	}
</script>

{#if showModal}
	<!-- Backdrop -->
	<div class="fixed inset-0 bg-black/50 z-40" onclick={onclose}></div>

	<!-- Modal -->
	<div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-w-md mx-auto z-50">
		<div class="flex flex-col max-h-[80vh]">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-lg font-semibold">양식</h2>
				<button onclick={onclose} class="p-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex justify-center py-8">
						<div class="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
					</div>
				{:else if templates.length === 0}
					<!-- No templates -->
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<div class="mb-4 p-4 bg-gray-100 rounded-full">
							<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
							</svg>
						</div>
						<p class="text-gray-600 mb-2">아직 저장된 템플릿이 없습니다</p>
						<p class="text-sm text-gray-500">제안 내용을 작성한 후 템플릿으로 저장해보세요</p>
					</div>
				{:else}
					<!-- Template list -->
					<div class="space-y-3">
						{#each templates as template}
							<div
								class="border rounded-lg p-4 cursor-pointer transition-all
									{selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
								onclick={() => handleSelectTemplate(template)}
							>
								<div class="flex items-start justify-between">
									<div class="flex-1 min-w-0">
										<h3 class="font-medium text-gray-900 mb-1">{template.title}</h3>
										<p class="text-sm text-gray-600 line-clamp-2">
											{truncateText(template.description)}
										</p>
										<div class="flex items-center gap-3 mt-2">
											<span class="text-xs text-gray-500">
												사용 횟수: {template.usageCount}회
											</span>
											<span class="text-xs text-gray-500">
												{new Date(template.createdAt).toLocaleDateString('ko-KR')}
											</span>
										</div>
									</div>
									<button
										onclick={(e) => {
											e.stopPropagation();
											confirmDelete(template);
										}}
										class="ml-3 p-2 text-gray-400 hover:text-red-500 transition-colors"
									>
										<img src={binIconUrl} alt="삭제" class="w-4 h-4" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			{#if templates.length > 0}
				<div class="p-4 border-t">
					<button
						onclick={handleUseTemplate}
						disabled={!selectedTemplate}
						class="w-full py-3 rounded-lg font-medium text-white transition-all
							{selectedTemplate 
								? 'bg-blue-500 hover:bg-blue-600' 
								: 'bg-gray-300 cursor-not-allowed'}"
						style="background-color: {selectedTemplate ? colors.primary : '#CBD5E1'}"
					>
						선택
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteConfirmTemplate}
	<div class="fixed inset-0 bg-black/50 z-[60]" onclick={() => deleteConfirmTemplate = null}></div>
	<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 max-w-sm w-full mx-4 z-[70]">
		<h3 class="text-lg font-semibold mb-2">템플릿 삭제</h3>
		<p class="text-gray-600 mb-6">
			"{deleteConfirmTemplate.title}" 템플릿을 삭제하시겠습니까?
		</p>
		<div class="flex gap-3">
			<button
				onclick={() => deleteConfirmTemplate = null}
				class="flex-1 py-3 rounded-lg border border-gray-300 font-medium"
			>
				취소
			</button>
			<button
				onclick={handleDeleteTemplate}
				class="flex-1 py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600"
			>
				삭제
			</button>
		</div>
	</div>
{/if}