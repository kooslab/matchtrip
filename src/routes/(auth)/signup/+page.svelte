<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	// No form logic here, just navigation
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
	<h1 class="mb-8 text-2xl font-bold text-gray-800">Sign up as...</h1>
	<div class="flex w-full max-w-xs flex-col gap-4">
		<a href="/signup/traveler">
			<Button class="w-full bg-blue-500 hover:bg-blue-600">Traveler</Button>
		</a>
		<a href="/signup/guide">
			<Button class="w-full bg-green-500 hover:bg-green-600">Guide</Button>
		</a>
	</div>
	<p class="mt-8 text-sm text-gray-500">
		Already have an account?
		<a href="/signin" class="text-blue-500">Login</a>
	</p>
</div>
