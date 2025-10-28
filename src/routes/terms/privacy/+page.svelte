<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import PrivacyPolicyContent from '$lib/components/PrivacyPolicyContent.svelte';
</script>

<svelte:head>
	<title>개인정보처리방침 - 매치트립</title>
	<meta name="description" content="매치트립 개인정보처리방침" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl bg-white shadow-sm">
		<!-- Header -->
		<header class="sticky top-0 z-10 border-b bg-white px-4 py-4">
			<div class="flex items-center gap-4">
				<a href="/" class="rounded-full p-2 hover:bg-gray-100">
					<ArrowLeft class="h-5 w-5" />
				</a>
				<h1 class="text-lg font-semibold">개인정보처리방침</h1>
			</div>
		</header>

		<!-- Content -->
		<main class="px-6 py-8">
			<PrivacyPolicyContent />
		</main>
	</div>
</div>
