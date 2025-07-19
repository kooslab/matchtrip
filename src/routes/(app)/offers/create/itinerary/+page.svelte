<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import cameraUrl from '$lib/icons/icon-camera-mono.svg';

	let tripId = $derived($page.url.searchParams.get('tripId'));
	let editorRef: HTMLDivElement;
	let fileInput: HTMLInputElement;

	// Store content as HTML for rich text with images
	let itineraryContent = $state('');
	let updateTimer: ReturnType<typeof setTimeout>;
	let isInitialLoad = true;

	// Load existing data if any
	$effect(() => {
		const currentItinerary = $offerFormStore.itinerary;
		if (
			currentItinerary &&
			currentItinerary[0] &&
			currentItinerary[0].timeSlots[0] &&
			isInitialLoad
		) {
			// Load existing content
			const existingContent = currentItinerary[0].timeSlots[0].title;
			if (existingContent && editorRef) {
				editorRef.innerHTML = existingContent;
				itineraryContent = existingContent;
				isInitialLoad = false;
			}
		} else if (editorRef && !editorRef.innerHTML.trim() && isInitialLoad) {
			// Initialize with placeholder if empty
			initEditor();
			isInitialLoad = false;
		}
	});

	// Debounced store update
	function updateStore() {
		if (itineraryContent) {
			offerFormStore.updateItineraryDay(0, {
				day: 1,
				imageUrl: '', // Not used anymore since images are inline
				timeSlots: [
					{
						time: '',
						title: itineraryContent, // Store HTML content
						description: ''
					}
				]
			});
		}
	}

	function handleNext() {
		// Save final content before navigating
		clearTimeout(updateTimer);
		updateStore();
		goto(`/offers/create/files?tripId=${tripId}`);
	}

	// Handle content changes with debouncing
	function handleInput() {
		if (editorRef) {
			itineraryContent = editorRef.innerHTML;

			// Clear existing timer
			clearTimeout(updateTimer);

			// Set new timer to update store after 300ms of no typing
			updateTimer = setTimeout(() => {
				updateStore();
			}, 300);
		}
	}

	// Handle paste to convert plain text
	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain');
		if (text) {
			document.execCommand('insertText', false, text);
		}
	}

	// Insert image at cursor position
	function insertImageAtCursor(imageUrl: string, isTemporary = false) {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			// If no selection, append at the end
			if (editorRef) {
				const img = document.createElement('img');
				img.src = imageUrl;
				img.className = 'my-4 max-w-full rounded-lg';
				img.alt = '일정 이미지';

				// Add a new paragraph after image
				const p = document.createElement('p');
				p.innerHTML = '<br>';

				editorRef.appendChild(img);
				editorRef.appendChild(p);

				// Move cursor to the new paragraph
				const range = document.createRange();
				range.selectNodeContents(p);
				range.collapse(false);
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
			return;
		}

		const range = selection.getRangeAt(0);

		// Create image element
		const img = document.createElement('img');
		img.src = imageUrl;
		img.className = 'my-4 max-w-full rounded-lg';
		img.alt = '일정 이미지';

		// Insert image at cursor position
		range.deleteContents();
		range.insertNode(img);

		// Add line breaks around image for better editing experience
		const br1 = document.createElement('br');
		const br2 = document.createElement('br');
		img.parentNode?.insertBefore(br1, img);
		img.parentNode?.insertBefore(br2, img.nextSibling);

		// Move cursor after the image
		range.setStartAfter(br2);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);

		// Update content
		handleInput();
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];

			try {
				// Show loading state (you could add a loading indicator)
				const tempUrl = URL.createObjectURL(file);

				// Focus editor to ensure we have a cursor position
				editorRef?.focus();

				// Insert temporary image immediately for better UX
				insertImageAtCursor(tempUrl, true);

				// Upload to server
				const formData = new FormData();
				formData.append('file', file);
				formData.append('type', 'itinerary');

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					const data = await response.json();
					// Replace temporary URL with permanent URL
					if (editorRef) {
						const imgs = editorRef.querySelectorAll('img');
						imgs.forEach((img) => {
							if (img.src === tempUrl) {
								img.src = data.url;
							}
						});
						// Update content after replacing URL
						handleInput();
					}
					// Clean up temp URL
					URL.revokeObjectURL(tempUrl);
				} else {
					// Remove the temporary image on error
					if (editorRef) {
						const imgs = editorRef.querySelectorAll('img');
						imgs.forEach((img) => {
							if (img.src === tempUrl) {
								img.remove();
							}
						});
						handleInput();
					}
					URL.revokeObjectURL(tempUrl);
					alert('이미지 업로드에 실패했습니다.');
				}
			} catch (error) {
				console.error('Image upload error:', error);
				alert('이미지 업로드 중 오류가 발생했습니다.');
			}

			// Clear the input so the same file can be selected again
			input.value = '';
		}
	}

	// Handle image button click
	function handleImageButtonClick() {
		// Save current selection before file dialog opens
		const selection = window.getSelection();
		const range = selection?.getRangeAt(0);

		fileInput?.click();

		// Restore selection after a brief delay
		setTimeout(() => {
			if (range && selection) {
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}, 10);
	}

	// Initialize editor with placeholder
	function initEditor() {
		if (editorRef && !editorRef.innerHTML.trim()) {
			editorRef.innerHTML = `<p class="text-gray-400">여행 일정을 자유롭게 작성해주세요.

예시:
오전 9:00 - 호텔에서 출발
오전 10:00 - 남산타워 도착 및 관람
오후 12:00 - 명동에서 점심 식사
오후 2:00 - 북촌 한옥마을 투어
오후 4:00 - 인사동 전통찻집 방문
오후 6:00 - 호텔 복귀</p>`;
		}
	}

	// Clear placeholder on focus
	function handleFocus() {
		if (editorRef && editorRef.querySelector('.text-gray-400')) {
			editorRef.innerHTML = '';
		}
	}

	// Add placeholder on blur if empty
	function handleBlur() {
		if (editorRef && !editorRef.innerHTML.trim()) {
			initEditor();
		}
	}
</script>

<div class="flex-1 px-4 py-6 pb-20">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">여행 일정을 입력해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				구체적인 일정을 작성하면 여행자의 선택 확률이 높아집니다.
			</p>
		</div>

		<!-- Rich Text Editor -->
		<div class="relative">
			<!-- Content Editable Div -->
			<div
				bind:this={editorRef}
				contenteditable="true"
				oninput={handleInput}
				onpaste={handlePaste}
				onfocus={handleFocus}
				onblur={handleBlur}
				class="focus:border-opacity-100 min-h-[300px] w-full rounded-lg border border-gray-300 px-4 py-3 text-base leading-relaxed transition-colors focus:ring-1 focus:outline-none [&>img]:my-4 [&>img]:max-w-full [&>img]:rounded-lg"
				style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
				onfocusin={(e) => (e.currentTarget.style.borderColor = colors.primary)}
				onfocusout={(e) => (e.currentTarget.style.borderColor = '')}
			></div>
		</div>

		<!-- Helper Text -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-gray-700">작성 팁</h3>
			<ul class="space-y-1 text-sm text-gray-600">
				<li>• 시간대별로 구체적인 일정을 작성해주세요</li>
				<li>• 이동 수단과 소요 시간을 포함하면 좋습니다</li>
				<li>
					• 텍스트 중간에 이미지를 추가하려면 원하는 위치에 커서를 놓고 카메라 버튼을 클릭하세요
				</li>
			</ul>
		</div>
	</div>
</div>

<!-- Fixed Image Upload Button -->
<div class="fixed left-0 right-0 bottom-24 z-50">
	<div class="mx-auto max-w-[430px] px-4">
		<div class="flex justify-end">
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				onchange={handleImageUpload}
				class="hidden"
			/>
			<button
				onclick={handleImageButtonClick}
				class="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg transition-all hover:border-gray-400 hover:bg-gray-50"
				title="이미지 추가"
				type="button"
			>
				<img
					src={cameraUrl}
					alt="이미지 추가"
					class="h-6 w-6"
					style="filter: brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(70%) contrast(100%);"
				/>
			</button>
		</div>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-0 left-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<div class="mx-auto max-w-[430px] px-4 py-4 pb-4">
		<button
			onclick={handleNext}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
			style="background-color: {colors.primary}"
			type="button"
		>
			다음
		</button>
	</div>
</div>

<style>
	/* Style for the contenteditable div to handle images properly */
	[contenteditable] {
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	/* Ensure images in the editor are responsive */
	[contenteditable] img {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 1rem 0;
		border-radius: 0.5rem;
		cursor: default;
	}

	/* Remove the outline on contenteditable focus (we're using border instead) */
	[contenteditable]:focus {
		outline: none;
	}

	/* Style placeholder text */
	[contenteditable]:empty:before {
		content: attr(placeholder);
		color: #9ca3af;
		pointer-events: none;
		position: absolute;
	}
</style>
