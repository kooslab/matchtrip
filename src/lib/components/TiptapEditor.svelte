<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import ListItem from '@tiptap/extension-list-item';
	import TextStyle from '@tiptap/extension-text-style';
	import { Color } from '@tiptap/extension-color';

	export let content: any = '';
	export let editable: boolean = true;
	export let onImageUpload: (file: File) => Promise<string>;

	let element: HTMLDivElement;
	let editor: Editor;

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				Color.configure({ types: [TextStyle.name, ListItem.name] }),
				TextStyle,
				StarterKit
			],
			content: content || '',
			editable,
			onUpdate: ({ editor }) => {
				const event = new CustomEvent('update', { detail: editor.getJSON() });
				element.dispatchEvent(event);
			}
		});
	});

	onDestroy(() => {
		if (editor) editor.destroy();
	});
</script>

{#if editor}
	<div class="control-group mb-2">
		<div class="button-group flex flex-wrap gap-1">
			<button
				onclick={() => editor.chain().focus().toggleBold().run()}
				class:active={editor.isActive('bold')}>Bold</button
			>
			<button
				onclick={() => editor.chain().focus().toggleItalic().run()}
				class:active={editor.isActive('italic')}>Italic</button
			>
			<button
				onclick={() => editor.chain().focus().toggleStrike().run()}
				class:active={editor.isActive('strike')}>Strike</button
			>
			<button
				onclick={() => editor.chain().focus().toggleCode().run()}
				class:active={editor.isActive('code')}>Code</button
			>
			<button onclick={() => editor.chain().focus().unsetAllMarks().run()}>Clear marks</button>
			<button onclick={() => editor.chain().focus().clearNodes().run()}>Clear nodes</button>
			<button
				onclick={() => editor.chain().focus().setParagraph().run()}
				class:active={editor.isActive('paragraph')}>Paragraph</button
			>
			<button
				onclick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				class:active={editor.isActive('heading', { level: 1 })}>H1</button
			>
			<button
				onclick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				class:active={editor.isActive('heading', { level: 2 })}>H2</button
			>
			<button
				onclick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				class:active={editor.isActive('heading', { level: 3 })}>H3</button
			>
			<button
				onclick={() => editor.chain().focus().toggleBulletList().run()}
				class:active={editor.isActive('bulletList')}>Bullet list</button
			>
			<button
				onclick={() => editor.chain().focus().toggleOrderedList().run()}
				class:active={editor.isActive('orderedList')}>Ordered list</button
			>
			<button
				onclick={() => editor.chain().focus().toggleCodeBlock().run()}
				class:active={editor.isActive('codeBlock')}>Code block</button
			>
			<button
				onclick={() => editor.chain().focus().toggleBlockquote().run()}
				class:active={editor.isActive('blockquote')}>Blockquote</button
			>
			<button onclick={() => editor.chain().focus().setHorizontalRule().run()}
				>Horizontal rule</button
			>
			<button onclick={() => editor.chain().focus().setHardBreak().run()}>Hard break</button>
			<button onclick={() => editor.chain().focus().undo().run()}>Undo</button>
			<button onclick={() => editor.chain().focus().redo().run()}>Redo</button>
			<button
				onclick={() => editor.chain().focus().setColor('#958DF1').run()}
				class:active={editor.isActive('textStyle', { color: '#958DF1' })}>Purple</button
			>
		</div>
	</div>
{/if}
<div class="tiptap" bind:this={element} />

<style>
	.tiptap {
		min-height: 200px;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1rem;
		background: #fff;
		outline: none;
		font-size: 1.1rem;
		transition: border 0.2s;
	}
	.tiptap:focus-within {
		border-color: #2563eb;
		box-shadow: 0 0 0 2px #2563eb22;
	}
	.tiptap [contenteditable='true']:focus {
		caret-color: #2563eb;
		animation: blink-caret 1s step-end infinite;
	}
	@keyframes blink-caret {
		0%,
		100% {
			border-right-color: #2563eb;
		}
		50% {
			border-right-color: transparent;
		}
	}
	.tiptap :first-child {
		margin-top: 0;
	}
	.tiptap ul,
	.tiptap ol {
		padding: 0 1rem;
		margin: 1.25rem 1rem 1.25rem 0.4rem;
	}
	.tiptap ul li p,
	.tiptap ol li p {
		margin-top: 0.25em;
		margin-bottom: 0.25em;
	}
	.tiptap h1,
	.tiptap h2,
	.tiptap h3,
	.tiptap h4,
	.tiptap h5,
	.tiptap h6 {
		line-height: 1.1;
		margin-top: 2.5rem;
		text-wrap: pretty;
	}
	.tiptap h1,
	.tiptap h2 {
		margin-top: 3.5rem;
		margin-bottom: 1.5rem;
	}
	.tiptap h1 {
		font-size: 1.4rem;
	}
	.tiptap h2 {
		font-size: 1.2rem;
	}
	.tiptap h3 {
		font-size: 1.1rem;
	}
	.tiptap h4,
	.tiptap h5,
	.tiptap h6 {
		font-size: 1rem;
	}
	.tiptap code {
		background-color: #f3e8ff;
		border-radius: 0.4rem;
		color: #222;
		font-size: 0.85rem;
		padding: 0.25em 0.3em;
	}
	.tiptap pre {
		background: #222;
		border-radius: 0.5rem;
		color: #fff;
		font-family: 'JetBrainsMono', monospace;
		margin: 1.5rem 0;
		padding: 0.75rem 1rem;
	}
	.tiptap pre code {
		background: none;
		color: inherit;
		font-size: 0.8rem;
		padding: 0;
	}
	.tiptap blockquote {
		border-left: 3px solid #e5e7eb;
		margin: 1.5rem 0;
		padding-left: 1rem;
		color: #555;
		font-style: italic;
	}
	.tiptap hr {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 2rem 0;
	}
	.tiptap .is-active {
		background: #2563eb;
		color: #fff;
	}
</style>
