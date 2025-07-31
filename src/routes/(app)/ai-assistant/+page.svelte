<script lang="ts">
	import AiAssistant from '$lib/components/AiAssistant.svelte';
</script>

<svelte:head>
	<title>AI 여행 도우미 - MatchTrip</title>
</svelte:head>

<div class="bg-gray-f7 min-h-screen">
	<div class="mx-auto flex h-screen max-w-4xl flex-col">
		<AiAssistant className="h-full" />
	</div>
</div>
