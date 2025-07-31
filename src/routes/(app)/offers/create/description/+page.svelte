<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore, offerFormValidation } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';

	let tripId = $derived($page.url.searchParams.get('tripId'));
	let element: HTMLDivElement;
	let editor: Editor;
	let isUploading = $state(false);

	// Bind to store value
	let description = $state($offerFormStore.description || '');

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit,
				Image.configure({
					inline: true,
					allowBase64: true
				}),
				Link.configure({
					openOnClick: false
				}),
				Placeholder.configure({
					placeholder: '제안 내용을 작성해주세요...'
				})
			],
			content: description,
			onUpdate: ({ editor }) => {
				description = editor.getHTML();
				offerFormStore.setDescription(description);
			},
			editorProps: {
				attributes: {
					class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3'
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	async function handleImageUpload() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';

		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;

			// Validate file size (5MB)
			const maxSize = 5 * 1024 * 1024; // 5MB
			if (file.size > maxSize) {
				const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
				alert(
					`이미지 크기가 너무 큽니다.\n\n현재 크기: ${fileSizeMB}MB\n최대 허용 크기: 5MB\n\n더 작은 크기의 이미지를 선택해주세요.`
				);
				return;
			}

			isUploading = true;

			try {
				// Insert placeholder while uploading
				const placeholderSrc = '/src/lib/icons/icon-picture-mono.svg';
				const selection = editor.state.selection;
				const from = selection.$from;
				const placeholderNode = editor.schema.nodes.image.create({
					src: placeholderSrc,
					alt: '업로드 중...',
					class: 'opacity-50 animate-pulse w-32 h-32'
				});

				const tr = editor.state.tr.insert(from.pos, placeholderNode);
				editor.view.dispatch(tr);
				const placeholderPos = from.pos;

				// Upload image
				const formData = new FormData();
				formData.append('file', file);
				formData.append('type', 'offer-description');

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) throw new Error('Upload failed');

				const data = await response.json();

				// Replace placeholder with actual image
				const imageNode = editor.schema.nodes.image.create({
					src: data.url,
					alt: file.name
				});

				const transaction = editor.state.tr.replaceWith(
					placeholderPos,
					placeholderPos + 1,
					imageNode
				);

				editor.view.dispatch(transaction);
			} catch (error) {
				console.error('Upload error:', error);
				alert('이미지 업로드에 실패했습니다.');
				// Remove placeholder on error
				editor.commands.undo();
			} finally {
				isUploading = false;
			}
		};

		input.click();
	}

	function handleNext() {
		if ($offerFormValidation.isDescriptionValid) {
			goto(`/offers/create/files?tripId=${tripId}`);
		}
	}
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">제안 내용을 편하게 작성해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				여행자에게 어필할 수 있는 매력적인 제안을 작성해주세요.
			</p>
		</div>

		<!-- Tiptap Editor -->
		<div class="space-y-2">
			<label for="description" class="block text-sm font-medium text-gray-700"> 제안 내용 </label>

			<!-- Editor Toolbar -->
			{#if browser}
				<div
					class="flex flex-wrap items-center gap-1 rounded-t-lg border border-gray-300 bg-gray-50 p-2"
				>
					<button
						type="button"
						onclick={() => editor?.chain().focus().toggleBold().run()}
						class="rounded p-2 hover:bg-gray-200 {editor?.isActive('bold') ? 'bg-gray-200' : ''}"
						disabled={!editor || !editor.can().chain().focus().toggleBold().run()}
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
							<path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
						</svg>
					</button>

					<button
						type="button"
						onclick={() => editor?.chain().focus().toggleItalic().run()}
						class="rounded p-2 hover:bg-gray-200 {editor?.isActive('italic') ? 'bg-gray-200' : ''}"
						disabled={!editor || !editor.can().chain().focus().toggleItalic().run()}
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="19" y1="4" x2="10" y2="4"></line>
							<line x1="14" y1="20" x2="5" y2="20"></line>
							<line x1="15" y1="4" x2="9" y2="20"></line>
						</svg>
					</button>

					<div class="mx-1 h-6 w-px self-center bg-gray-300"></div>

					<button
						type="button"
						onclick={() => editor?.chain().focus().toggleBulletList().run()}
						class="rounded p-2 hover:bg-gray-200 {editor?.isActive('bulletList')
							? 'bg-gray-200'
							: ''}"
						disabled={!editor}
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="8" y1="6" x2="21" y2="6"></line>
							<line x1="8" y1="12" x2="21" y2="12"></line>
							<line x1="8" y1="18" x2="21" y2="18"></line>
							<line x1="3" y1="6" x2="3.01" y2="6"></line>
							<line x1="3" y1="12" x2="3.01" y2="12"></line>
							<line x1="3" y1="18" x2="3.01" y2="18"></line>
						</svg>
					</button>

					<button
						type="button"
						onclick={() => editor?.chain().focus().toggleOrderedList().run()}
						class="rounded p-2 hover:bg-gray-200 {editor?.isActive('orderedList')
							? 'bg-gray-200'
							: ''}"
						disabled={!editor}
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="10" y1="6" x2="21" y2="6"></line>
							<line x1="10" y1="12" x2="21" y2="12"></line>
							<line x1="10" y1="18" x2="21" y2="18"></line>
							<path d="M4 6h1v4"></path>
							<path d="M4 10h2"></path>
							<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
						</svg>
					</button>

					<div class="mx-1 h-6 w-px self-center bg-gray-300"></div>

					<button
						type="button"
						onclick={handleImageUpload}
						disabled={isUploading}
						class="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 hover:bg-gray-200"
						title="이미지 업로드 (최대 5MB)"
					>
						{#if isUploading}
							<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-800"></div>
						{:else}
							<img src="/src/lib/icons/icon-picture-mono.svg" alt="사진" class="h-4 w-4" />
						{/if}
						<span class="text-sm font-medium">사진</span>
					</button>
					<span class="ml-2 self-center text-xs text-gray-500">최대 5MB</span>
				</div>
			{/if}

			<!-- Editor Content -->
			<div
				bind:this={element}
				class="focus-within:border-primary rounded-b-lg border border-gray-300 focus-within:ring-1"
				style="--tw-ring-color: {colors.primary};"
			></div>
		</div>

		<!-- Writing Tips -->
		<div class="rounded-lg bg-blue-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-blue-900">작성 가이드</h3>
			<ul class="space-y-1 text-sm text-blue-800">
				<li>• 여행자의 관심사와 목적에 맞춘 제안을 작성하세요</li>
				<li>• 구체적인 장소와 활동을 포함하면 신뢰도가 높아집니다</li>
				<li>• 본인만의 특별한 경험이나 노하우를 어필하세요</li>
				<li>• 포함/불포함 사항을 명확히 구분해주세요</li>
				<li>
					• 텍스트 중간에 이미지를 추가하려면 원하는 위치에 커서를 놓고 사진 버튼을 클릭하세요
				</li>
				<li>• 이미지는 5MB 이하만 업로드 가능합니다</li>
			</ul>
		</div>

		<!-- Example Template -->
		<details class="rounded-lg border border-gray-200 bg-white">
			<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
				예시 템플릿 보기
			</summary>
			<div class="border-t border-gray-200 p-4">
				<p class="text-sm text-gray-600">
					안녕하세요! [여행지]를 사랑하는 현지 가이드 [이름]입니다.<br /><br />

					[여행자님의 관심사]에 맞춰 특별한 여행을 준비했습니다.<br /><br />

					<strong>주요 일정:</strong><br />
					• 첫째 날: [주요 명소] 방문 및 [특별 활동]<br />
					• 둘째 날: [숨은 명소] 탐방 및 [현지 체험]<br /><br />

					<strong>포함 사항:</strong><br />
					• 전 일정 가이드 동행<br />
					• 차량 및 기사<br />
					• 입장료<br /><br />

					<strong>불포함 사항:</strong><br />
					• 식사비<br />
					• 개인 경비<br /><br />

					[특별한 경험이나 차별점]<br />
					편안하고 즐거운 여행이 되도록 최선을 다하겠습니다!
				</p>
			</div>
		</details>
	</div>
</div>

<!-- Bottom Buttons -->
<div
	class="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<div class="px-4 py-4 pb-4">
		<button
			onclick={handleNext}
			disabled={!$offerFormValidation.isDescriptionValid || isUploading}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
				{$offerFormValidation.isDescriptionValid && !isUploading
				? 'hover:opacity-90'
				: 'cursor-not-allowed opacity-50'}"
			style="background-color: {$offerFormValidation.isDescriptionValid && !isUploading
				? colors.primary
				: '#CBD5E1'}"
		>
			다음
		</button>
	</div>
</div>

<style>
	/* Tiptap editor styles */
	:global(.ProseMirror) {
		min-height: 300px;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #adb5bd;
		pointer-events: none;
		height: 0;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		margin: 1rem 0;
		border-radius: 0.5rem;
	}

	:global(.ProseMirror:focus) {
		outline: none;
	}
</style>
