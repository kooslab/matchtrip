<script lang="ts">
	import Editor from '@tinymce/tinymce-svelte';
	export let data: { userName: string; userRole: string; guideProfile: any };

	console.log('data', data);

	// Import any auth/user context to determine if the user is the guide
	type GuideProfile = { introduction: any };
	let isGuide = data.userRole === 'guide';
	let profile: GuideProfile | null = data.guideProfile
		? { introduction: data.guideProfile.introduction }
		: null;
	let editMode = false;
	let bio = profile?.introduction || '';

	let isMobile = false;
	let saving = false;
	let saveError = '';

	// TinyMCE config (copy from /offers)
	const editorConfig = {
		height: isMobile ? 300 : 400,
		menubar: false,
		mobile: {
			theme: 'silver',
			plugins: ['lists', 'autolink', 'link'],
			toolbar_mode: 'wrap'
		},
		plugins: ['lists', 'autolink', 'link', 'preview', 'visualblocks', 'wordcount'],
		toolbar_mode: 'wrap',
		toolbar: isMobile
			? [
					'undo redo | bold italic underline',
					'bullist numlist | outdent indent',
					'link | removeformat | preview'
				].join(' | ')
			: 'undo redo | blocks | bold italic underline | bullist numlist outdent indent | link removeformat | preview',
		content_style:
			'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; padding: 8px; }',
		branding: false,
		resize: false,
		statusbar: false,
		toolbar_sticky: false,
		setup: (editor: any) => {
			editor.on('init', () => {
				if (isMobile) {
					editor.getBody().style.fontSize = '16px';
					editor.getBody().style.minHeight = '200px';
				}
			});
		}
	};

	async function handleSave() {
		saving = true;
		saveError = '';
		try {
			const res = await fetch('/api/profile/guide', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ introduction: bio })
			});
			const data = await res.json();
			if (data.success) {
				profile = { introduction: bio };
				editMode = false;
			} else {
				saveError = data.error || 'Failed to save.';
			}
		} catch (err) {
			saveError = 'Server error.';
		} finally {
			saving = false;
		}
	}
	function handleEdit() {
		editMode = true;
	}
	function handleCancel() {
		editMode = false;
	}
	async function handleImageUpload(file: File) {
		// TODO: Upload image to R2, return URL
		// For now, return a placeholder image URL
		return 'https://placehold.co/600x400/png';
	}
	function renderBioPreview(json: any) {
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
					<div class="prose prose-neutral mt-2 max-w-none">{@html bio}</div>
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
					<Editor
						apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
						conf={editorConfig}
						bind:value={bio} />
				</div>
				<div class="flex justify-end gap-2">
					<button class="btn btn-primary" onclick={handleSave} disabled={saving}
						>{saving ? 'Saving...' : 'Save'}</button>
					<button class="btn btn-secondary" onclick={handleCancel}>Cancel</button>
				</div>
				{#if saveError}<div class="mt-2 text-red-500">{saveError}</div>{/if}
			</div>
		{/if}
	</div>
</div>
