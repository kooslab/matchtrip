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
	<div class="fixed inset-0 z-40 bg-black/50" onclick={onclose}></div>

	<!-- Modal -->
	<div class="fixed right-0 bottom-0 left-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white">
		<div class="flex max-h-[80vh] flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between border-b p-4">
				<h2 class="text-lg font-semibold">양식</h2>
				<button onclick={onclose} class="p-2">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex justify-center py-8">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"
						></div>
					</div>
				{:else if templates.length === 0}
					<!-- No templates -->
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<div class="mb-4 rounded-full bg-gray-100 p-4">
							<svg
								class="h-12 w-12 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								></path>
							</svg>
						</div>
						<p class="mb-2 text-gray-600">아직 저장된 템플릿이 없습니다</p>
						<p class="text-sm text-gray-500">제안 내용을 작성한 후 템플릿으로 저장해보세요</p>
					</div>
				{:else}
					<!-- Template list -->
					<div class="space-y-3">
						{#each templates as template}
							<div
								class="cursor-pointer rounded-lg border p-4 transition-all
									{selectedTemplate?.id === template.id
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:border-gray-300'}"
								onclick={() => handleSelectTemplate(template)}
							>
								<div class="flex items-start justify-between">
									<div class="min-w-0 flex-1">
										<h3 class="mb-1 font-medium text-gray-900">{template.title}</h3>
										<p class="line-clamp-2 text-sm text-gray-600">
											{truncateText(template.description)}
										</p>
										<div class="mt-2 flex items-center gap-3">
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
										class="ml-3 p-2 text-gray-400 transition-colors hover:text-red-500"
									>
										<img src={binIconUrl} alt="삭제" class="h-4 w-4" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			{#if templates.length > 0}
				<div class="border-t p-4">
					<button
						onclick={handleUseTemplate}
						disabled={!selectedTemplate}
						class="w-full rounded-lg py-3 font-medium text-white transition-all
							{selectedTemplate ? 'bg-blue-500 hover:bg-blue-600' : 'cursor-not-allowed bg-gray-300'}"
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
	<div
		class="fixed inset-0 z-[60] bg-black/50"
		onclick={() => (deleteConfirmTemplate = null)}
	></div>
	<div
		class="fixed top-1/2 left-1/2 z-[70] mx-4 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6"
	>
		<h3 class="mb-2 text-lg font-semibold">템플릿 삭제</h3>
		<p class="mb-6 text-gray-600">
			"{deleteConfirmTemplate.title}" 템플릿을 삭제하시겠습니까?
		</p>
		<div class="flex gap-3">
			<button
				onclick={() => (deleteConfirmTemplate = null)}
				class="flex-1 rounded-lg border border-gray-300 py-3 font-medium"
			>
				취소
			</button>
			<button
				onclick={handleDeleteTemplate}
				class="flex-1 rounded-lg bg-red-500 py-3 font-medium text-white hover:bg-red-600"
			>
				삭제
			</button>
		</div>
	</div>
{/if}
