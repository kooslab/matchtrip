<script lang="ts">
	import cameraUrl from '$lib/icons/icon-camera-mono.svg';
	import xIconUrl from '$lib/icons/icon-x-mono.svg';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
		placeholder?: string;
		minHeight?: string;
		showImageButton?: boolean;
		showHelperText?: boolean;
		helperTitle?: string;
		helperItems?: string[];
	}

	let {
		value = '',
		onchange,
		placeholder = '내용을 입력해주세요',
		minHeight = '300px',
		showImageButton = true,
		showHelperText = true,
		helperTitle = '작성 팁',
		helperItems = [
			'• 구체적인 내용을 작성해주세요',
			'• 이미지를 추가하면 더 좋습니다',
			'• 텍스트 중간에 이미지를 추가하려면 원하는 위치에 커서를 놓고 카메라 버튼을 클릭하세요'
		]
	}: Props = $props();

	let editorRef: HTMLDivElement;
	let fileInput = $state<HTMLInputElement>();
	let updateTimer: ReturnType<typeof setTimeout>;
	let isInitialLoad = true;
	let hasPlaceholder = $state(true);
	let lastKnownRange: Range | null = null;

	// Add delete buttons to existing images in the editor
	function addDeleteButtonsToImages() {
		if (!editorRef) return;

		// Find all images that don't already have a delete button
		const images = editorRef.querySelectorAll('img');
		images.forEach((img) => {
			// Skip if this is an icon image (like the X icon itself)
			if (img.classList.contains('w-4') || img.classList.contains('h-4')) return;

			// Check if image already has a container with delete button
			const container = img.closest('.image-container');
			if (container && container.querySelector('.image-delete-button')) return;

			// If image is not in a container, wrap it
			if (!container) {
				const newContainer = document.createElement('div');
				newContainer.className = 'image-container relative inline-block';
				img.parentNode?.insertBefore(newContainer, img);
				newContainer.appendChild(img);
			}

			// Add delete button to the container
			const containerToUse = img.closest('.image-container');
			if (containerToUse && !containerToUse.querySelector('.image-delete-button')) {
				const deleteButton = document.createElement('button');
				deleteButton.className = 'image-delete-button';
				deleteButton.innerHTML = `<img src="${xIconUrl}" alt="삭제" class="w-4 h-4" />`;
				deleteButton.onclick = handleImageDelete;
				deleteButton.type = 'button';
				containerToUse.insertBefore(deleteButton, containerToUse.firstChild);
			}
		});
	}

	// Initialize editor with existing value
	$effect(() => {
		if (editorRef && value && isInitialLoad) {
			editorRef.innerHTML = value;
			hasPlaceholder = !value.trim();
			isInitialLoad = false;

			// Add delete buttons to any existing images
			// Use a small delay to ensure DOM is ready
			setTimeout(() => {
				addDeleteButtonsToImages();
			}, 10);
		}
	});

	// Clean HTML by removing editor-only elements (like delete buttons)
	function cleanHtmlForSaving(html: string): string {
		// Create a temporary element to manipulate HTML
		const temp = document.createElement('div');
		temp.innerHTML = html;

		// Remove all delete buttons (they're only for editor UI)
		temp.querySelectorAll('.image-delete-button').forEach((button) => {
			button.remove();
		});

		// Remove any loading overlays that might still be present
		temp.querySelectorAll('.image-loading-overlay').forEach((overlay) => {
			overlay.remove();
		});

		// Remove data-loading attributes
		temp.querySelectorAll('[data-loading]').forEach((element) => {
			element.removeAttribute('data-loading');
		});

		return temp.innerHTML;
	}

	// Handle content changes with debouncing
	function handleInput() {
		if (editorRef) {
			const content = editorRef.innerHTML;
			hasPlaceholder = !content.trim();

			// Clear existing timer
			clearTimeout(updateTimer);

			// Set new timer to update parent after 300ms of no typing
			updateTimer = setTimeout(() => {
				// Clean the HTML before sending to parent
				const cleanedContent = cleanHtmlForSaving(content);
				onchange?.(cleanedContent);
			}, 300);
		}
	}

	// Handle paste to maintain formatting but prevent unwanted styles
	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const html = e.clipboardData?.getData('text/html');
		const text = e.clipboardData?.getData('text/plain');

		if (html) {
			// Create a temporary element to clean the HTML
			const temp = document.createElement('div');
			temp.innerHTML = html;

			// Remove script tags and unwanted attributes
			temp.querySelectorAll('script, style').forEach((el) => el.remove());
			temp.querySelectorAll('*').forEach((el) => {
				// Keep only specific attributes
				const allowedAttrs = ['href', 'src', 'alt'];
				Array.from(el.attributes).forEach((attr) => {
					if (!allowedAttrs.includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			});

			document.execCommand('insertHTML', false, temp.innerHTML);
		} else if (text) {
			document.execCommand('insertText', false, text);
		}
	}

	// Handle image deletion
	function handleImageDelete(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const button = event.currentTarget as HTMLElement;
		const container = button.closest('.image-container');

		if (container) {
			container.remove();
			handleInput();
		}
	}

	// Insert image at cursor position with optional loading state
	function insertImageAtCursor(imageUrl: string, isLoading: boolean = false) {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			// If no selection, append at the end
			if (editorRef) {
				const container = document.createElement('div');
				container.className = 'image-container relative inline-block';

				const img = document.createElement('img');
				img.src = imageUrl;
				img.className = 'my-4 max-w-full rounded-lg';
				img.alt = '업로드된 이미지';

				// Add delete button
				if (!isLoading) {
					const deleteButton = document.createElement('button');
					deleteButton.className = 'image-delete-button';
					deleteButton.innerHTML = `<img src="${xIconUrl}" alt="삭제" class="w-4 h-4" />`;
					deleteButton.onclick = handleImageDelete;
					deleteButton.type = 'button';
					container.appendChild(deleteButton);
				}

				if (isLoading) {
					img.style.opacity = '0.5';
					container.setAttribute('data-loading', 'true');

					// Add loading overlay
					const loadingOverlay = document.createElement('div');
					loadingOverlay.className =
						'image-loading-overlay absolute inset-0 flex items-center justify-center';
					loadingOverlay.innerHTML = `
						<div class="bg-white rounded-full p-2 shadow-lg">
							<svg class="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>
					`;
					container.appendChild(loadingOverlay);
				}

				container.appendChild(img);

				// Add a new paragraph after image
				const p = document.createElement('p');
				p.innerHTML = '<br>';

				editorRef.appendChild(container);
				editorRef.appendChild(p);

				// Move cursor to the new paragraph
				const range = document.createRange();
				range.selectNodeContents(p);
				range.collapse(true);
				selection?.removeAllRanges();
				selection?.addRange(range);

				// Focus the editor
				editorRef.focus();
			}
			return;
		}

		const range = selection.getRangeAt(0);

		// Create container for image with loading state
		const container = document.createElement('div');
		container.className = 'image-container relative inline-block';

		// Create image element
		const img = document.createElement('img');
		img.src = imageUrl;
		img.className = 'my-4 max-w-full rounded-lg';
		img.alt = '업로드된 이미지';

		// Add delete button
		if (!isLoading) {
			const deleteButton = document.createElement('button');
			deleteButton.className = 'image-delete-button';
			deleteButton.innerHTML = `<img src="${xIconUrl}" alt="삭제" class="w-4 h-4" />`;
			deleteButton.onclick = handleImageDelete;
			deleteButton.type = 'button';
			container.appendChild(deleteButton);
		}

		if (isLoading) {
			img.style.opacity = '0.5';
			container.setAttribute('data-loading', 'true');

			// Add loading spinner positioned at center of image
			const loadingOverlay = document.createElement('div');
			loadingOverlay.className = 'image-loading-overlay';
			loadingOverlay.innerHTML = `
				<svg class="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="white" stroke-width="4"></circle>
					<path class="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			`;
			container.appendChild(loadingOverlay);
		}

		container.appendChild(img);

		// Create a text node with zero-width space for cursor positioning
		const spaceAfter = document.createTextNode('\u200B');

		// Insert at cursor position
		range.deleteContents();
		range.insertNode(spaceAfter);
		range.insertNode(container);

		// Move cursor after the image
		range.setStartAfter(spaceAfter);
		range.setEndAfter(spaceAfter);
		selection.removeAllRanges();
		selection.addRange(range);

		// Focus the editor to ensure cursor is visible
		editorRef.focus();

		// Update content
		handleInput();
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];

			try {
				// Show loading state with temporary URL
				const tempUrl = URL.createObjectURL(file);

				// Focus editor to ensure we have a cursor position
				editorRef?.focus();

				// Restore the saved range if available
				if (lastKnownRange) {
					const selection = window.getSelection();
					if (selection) {
						selection.removeAllRanges();
						selection.addRange(lastKnownRange);
					}
				}

				// Insert temporary image with loading state
				insertImageAtCursor(tempUrl, true);

				// Clear the saved range
				lastKnownRange = null;

				// Upload to server
				const formData = new FormData();
				formData.append('file', file);
				formData.append('type', 'content');

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					const data = await response.json();
					console.log('Upload success, received URL:', data.url);

					// Replace temporary image with final URL and remove loading state
					if (editorRef) {
						const containers = editorRef.querySelectorAll('div[data-loading="true"]');
						containers.forEach((container) => {
							const img = container.querySelector('img');
							if (img && (img.src === tempUrl || img.src.includes(tempUrl))) {
								// Update image URL
								img.src = data.url;
								img.style.opacity = '1';

								// Remove loading overlay
								const overlay = container.querySelector('.image-loading-overlay');
								if (overlay) {
									overlay.remove();
								}

								// Remove loading attribute
								container.removeAttribute('data-loading');

								// Add delete button after successful upload
								const deleteButton = document.createElement('button');
								deleteButton.className = 'image-delete-button';
								deleteButton.innerHTML = `<img src="${xIconUrl}" alt="삭제" class="w-4 h-4" />`;
								deleteButton.onclick = handleImageDelete;
								deleteButton.type = 'button';
								container.insertBefore(deleteButton, container.firstChild);
							}
						});

						// Also check for any images not in containers (fallback)
						const imgs = editorRef.querySelectorAll('img');
						imgs.forEach((img) => {
							if (img.src === tempUrl || img.src.includes(tempUrl)) {
								img.src = data.url;
								img.style.opacity = '1';
							}
						});

						// Update content after replacing URL
						handleInput();
					}
					// Clean up temp URL
					URL.revokeObjectURL(tempUrl);
				} else {
					// Get error details
					let errorMessage = '이미지 업로드에 실패했습니다.';
					try {
						const errorData = await response.json();
						if (errorData.error) {
							errorMessage = errorData.error;
						}
					} catch (e) {
						// If response is not JSON, keep default message
					}

					// Remove the temporary image and container on error
					if (editorRef) {
						// Remove loading containers
						const containers = editorRef.querySelectorAll('div[data-loading="true"]');
						containers.forEach((container) => {
							const img = container.querySelector('img');
							if (img && (img.src === tempUrl || img.src.includes(tempUrl))) {
								container.remove();
							}
						});

						// Also remove any standalone images (fallback)
						const imgs = editorRef.querySelectorAll('img');
						imgs.forEach((img) => {
							if (img.src === tempUrl || img.src.includes(tempUrl)) {
								img.remove();
							}
						});
						handleInput();
					}
					URL.revokeObjectURL(tempUrl);
					alert(errorMessage);
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
		// Focus the editor first if it's not focused
		if (editorRef && document.activeElement !== editorRef) {
			editorRef.focus();

			// Place cursor at the end if no selection
			const selection = window.getSelection();
			if (selection && (!selection.rangeCount || selection.rangeCount === 0)) {
				const range = document.createRange();
				range.selectNodeContents(editorRef);
				range.collapse(false); // Collapse to end
				selection.removeAllRanges();
				selection.addRange(range);
			}
		}

		// Save current selection before file dialog opens
		const selection = window.getSelection();
		let range = null;

		// Check if there's a selection range
		if (selection && selection.rangeCount > 0) {
			range = selection.getRangeAt(0);
		} else if (editorRef) {
			// If no selection, create a range at the end of the content
			range = document.createRange();
			range.selectNodeContents(editorRef);
			range.collapse(false); // Collapse to end
		}

		// Store the range for use after file selection
		lastKnownRange = range;

		fileInput?.click();
	}

	// Clear placeholder on focus
	function handleFocus() {
		if (editorRef && hasPlaceholder) {
			editorRef.innerHTML = '';
			hasPlaceholder = false;
		}
	}

	// Add placeholder on blur if empty
	function handleBlur() {
		if (editorRef && !editorRef.innerHTML.trim()) {
			hasPlaceholder = true;
		}
	}

	// Export function to get current content
	export function getContent(): string {
		return editorRef?.innerHTML || '';
	}

	// Export function to set content
	export function setContent(content: string) {
		if (editorRef) {
			editorRef.innerHTML = content;
			hasPlaceholder = !content.trim();

			// Add delete buttons to any existing images
			setTimeout(() => {
				addDeleteButtonsToImages();
			}, 10);

			handleInput();
		}
	}

	// Export function to clear content
	export function clear() {
		if (editorRef) {
			editorRef.innerHTML = '';
			hasPlaceholder = true;
			handleInput();
		}
	}
</script>

<div class="rich-text-editor-container">
	<!-- Editor -->
	<div class="relative">
		<div
			bind:this={editorRef}
			contenteditable="true"
			oninput={handleInput}
			onpaste={handlePaste}
			onfocus={handleFocus}
			onblur={handleBlur}
			class="rich-text-editor w-full rounded-lg border border-gray-300 px-4 py-3 text-base leading-relaxed transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			style="min-height: {minHeight}"
			data-placeholder={placeholder}
			class:has-placeholder={hasPlaceholder}
		></div>

		{#if showImageButton}
			<!-- Image Upload Button -->
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				onchange={handleImageUpload}
				class="hidden"
			/>
			<button
				onclick={handleImageButtonClick}
				class="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:border-gray-400 hover:bg-gray-50"
				title="이미지 추가"
				type="button"
			>
				<img src={cameraUrl} alt="이미지 추가" class="h-5 w-5 opacity-60" />
			</button>
		{/if}
	</div>

	{#if showHelperText && helperItems.length > 0}
		<!-- Helper Text -->
		<div class="mt-4 rounded-lg bg-gray-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-gray-700">{helperTitle}</h3>
			<ul class="space-y-1 text-sm text-gray-600">
				{#each helperItems as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	/* Style for the contenteditable div */
	.rich-text-editor {
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	/* Placeholder styling */
	.rich-text-editor.has-placeholder:before {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
		position: absolute;
		opacity: 1;
	}

	.rich-text-editor:focus.has-placeholder:before {
		opacity: 0.5;
	}

	/* Ensure images in the editor are responsive */
	.rich-text-editor :global(img:not(.w-4)) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 1rem 0;
		border-radius: 0.5rem;
		cursor: default;
	}

	/* Images inside containers should not have margin */
	.rich-text-editor :global(.image-container img:not(.w-4)) {
		margin: 0;
	}

	/* Image container styles */
	.rich-text-editor :global(.image-container) {
		position: relative;
		display: block;
		margin: 1rem 0;
		width: fit-content;
	}

	/* Image delete button styles */
	.rich-text-editor :global(.image-delete-button) {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.7);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
		z-index: 10;
		padding: 0;
	}

	.rich-text-editor :global(.image-delete-button:hover) {
		background-color: rgba(0, 0, 0, 0.9);
	}

	.rich-text-editor :global(.image-delete-button img) {
		filter: brightness(0) invert(1);
		margin: 0;
	}

	/* Loading container styles */
	.rich-text-editor :global(div[data-loading='true']) {
		position: relative;
		display: inline-block;
		margin: 1rem 0;
	}

	.rich-text-editor :global(div[data-loading='true'] img) {
		display: block;
	}

	/* Loading overlay positioning */
	.rich-text-editor :global(.image-loading-overlay) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 10;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
	}

	.rich-text-editor :global(.image-loading-overlay svg) {
		display: block;
	}

	/* Basic text formatting */
	.rich-text-editor :global(p) {
		margin: 0.5rem 0;
	}

	.rich-text-editor :global(ul),
	.rich-text-editor :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.rich-text-editor :global(li) {
		margin: 0.25rem 0;
	}

	.rich-text-editor :global(h1),
	.rich-text-editor :global(h2),
	.rich-text-editor :global(h3),
	.rich-text-editor :global(h4),
	.rich-text-editor :global(h5),
	.rich-text-editor :global(h6) {
		font-weight: 600;
		margin: 0.75rem 0;
	}

	.rich-text-editor :global(h1) {
		font-size: 1.5rem;
	}
	.rich-text-editor :global(h2) {
		font-size: 1.25rem;
	}
	.rich-text-editor :global(h3) {
		font-size: 1.125rem;
	}

	.rich-text-editor :global(blockquote) {
		border-left: 3px solid #e5e7eb;
		padding-left: 1rem;
		margin: 0.5rem 0;
		color: #6b7280;
	}

	.rich-text-editor :global(code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: monospace;
	}

	.rich-text-editor :global(a) {
		color: #3b82f6;
		text-decoration: underline;
	}

	.rich-text-editor :global(a:hover) {
		color: #2563eb;
	}
</style>
