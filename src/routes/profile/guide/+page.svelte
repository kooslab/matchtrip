<script lang="ts">
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	export let data: { userName: string; userRole: string; guideProfile: any };
	// ... existing code ...
	// Import necessary Svelte and Tiptap components
	// Placeholder: import Tiptap editor for Svelte 5 (to be implemented)
	// Import any auth/user context to determine if the user is the guide
	type GuideProfile = { introduction: any };
	let isGuide = data.userRole === 'guide';
	let profile: GuideProfile | null = data.guideProfile
		? { introduction: data.guideProfile.introduction }
		: null;
	let editMode = false;
	let editorContent: any = profile?.introduction || '';

	function handleSave() {
		// TODO: Save editorContent as JSON to backend
		profile = { introduction: editorContent };
		editMode = false;
	}
	function handleEdit() {
		editMode = true;
		editorContent = profile?.introduction || '';
	}
	function handleCancel() {
		editMode = false;
	}
	async function handleImageUpload(file: File) {
		// TODO: Upload image to R2, return URL
		// For now, return a placeholder image URL
		return 'https://placehold.co/600x400/png';
	}
	// For preview: convert Tiptap JSON to HTML (basic, for demo)
	function renderBioPreview(json: any) {
		// This is a simple example. For production, use Tiptap's HTML renderer or a safe HTML renderer.
		if (!json || !json.content) return '';
		return json.content
			.map((block: any) => {
				if (block.type === 'heading') {
					return `<h${block.attrs.level} class='font-bold text-xl mt-4 mb-2'>${block.content?.map((c: any) => c.text).join('') || ''}</h${block.attrs.level}>`;
				}
				if (block.type === 'paragraph') {
					return `<p class='mb-2'>${block.content?.map((c: any) => c.text).join('') || ''}</p>`;
				}
				if (block.type === 'bulletList') {
					return `<ul class='list-disc ml-6'>${block.content?.map((li: any) => `<li>${li.content?.map((c: any) => c.text).join('') || ''}</li>`).join('')}</ul>`;
				}
				return '';
			})
			.join('');
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center bg-gray-50 py-10">
	<div class="w-full max-w-2xl">
		<h1 class="mb-6 text-center text-4xl font-extrabold">Guide Profile</h1>
		<div class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
			<div class="mb-4">
				<span class="font-semibold">Name:</span>
				{data.userName}
			</div>
			<div class="mb-4">
				<span class="font-semibold">Bio:</span>
				{#if profile && profile.introduction}
					<div class="prose prose-neutral mt-2 max-w-none">
						<!-- Render the introduction as HTML using Tiptap's output, or fallback to plain text -->
						<!-- You may want to use a Tiptap renderer here in the future -->
					</div>
				{:else}
					<div class="text-gray-400">No guide bio available.</div>
				{/if}
			</div>
			{#if isGuide && !editMode}
				<button class="btn btn-primary mt-2 w-full" onclick={handleEdit}>수정</button>
			{/if}
		</div>

		{#if isGuide && editMode}
			<div class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
				<h2 class="mb-4 text-center text-2xl font-bold">Edit Your Guide Bio</h2>
				<div class="mb-4">
					<div class="block-based-editor">
						<TiptapEditor
							content={editorContent}
							editable={true}
							onImageUpload={handleImageUpload}
							on:update={(e) => (editorContent = e.detail)} />
					</div>
				</div>
				<div class="flex justify-end gap-2">
					<button class="btn btn-primary" onclick={handleSave}>Save</button>
					<button class="btn btn-secondary" onclick={handleCancel}>Cancel</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.block-based-editor {
		border: 1px solid #e5e7eb; /* Tailwind gray-200 */
		border-radius: 0.75rem;
		min-height: 200px;
		padding: 1rem;
		background: #fff;
		outline: none;
		font-size: 1.1rem;
		transition: border 0.2s;
	}
	.block-based-editor:focus-within {
		border-color: #2563eb; /* Tailwind blue-600 */
		box-shadow: 0 0 0 2px #2563eb22;
	}
	/* Ensure cursor is visible and blinking */
	.block-based-editor [contenteditable='true']:focus {
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
</style>
