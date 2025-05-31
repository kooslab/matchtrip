<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';

	export let content: any = {};
	export let editable: boolean = true;
	export let onImageUpload: (file: File) => Promise<string>;

	const dispatch = createEventDispatcher();
	let element: HTMLDivElement;
	let editor: Editor;

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Image.configure({
					inline: false,
					allowBase64: false,
					HTMLAttributes: {
						class: 'my-2 rounded shadow'
					}
				})
			],
			content: content || '<p></p>',
			editable,
			onUpdate: ({ editor }) => {
				dispatch('update', editor.getJSON());
			},
			editorProps: {
				handlePaste(view, event) {
					const items = event.clipboardData?.items;
					if (items) {
						for (const item of items) {
							if (item.type.indexOf('image') !== -1) {
								const file = item.getAsFile();
								if (file && onImageUpload) {
									onImageUpload(file).then((url) => {
										editor.chain().focus().setImage({ src: url }).run();
									});
									event.preventDefault();
									return true;
								}
							}
						}
					}
					return false;
				},
				handleDrop(view, event, _slice, _moved) {
					const files = event.dataTransfer?.files;
					if (files && files.length > 0 && onImageUpload) {
						for (const file of files) {
							if (file.type.startsWith('image/')) {
								onImageUpload(file).then((url) => {
									editor.chain().focus().setImage({ src: url }).run();
								});
								event.preventDefault();
								return true;
							}
						}
					}
					return false;
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});
</script>

<div class="min-h-[200px] rounded border p-2" bind:this={element}></div>

<style>
	/* TailwindCSS is used, but you can add custom styles here if needed */
</style>
