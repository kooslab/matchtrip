<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { MessageSquare, ChevronRight, Clock } from 'lucide-svelte';
	import { formatRelativeTime, formatDate } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';

	interface Conversation {
		id: string;
		offerId: string;
		status: string;
		lastMessageAt: string | null;
		unreadCount: number;
		otherUser: {
			id: string;
			name: string;
			email: string;
			role: string;
			image: string | null;
		};
		offer: {
			id: string;
			title: string;
			price: number;
			status: string;
		};
	}

	let conversations: Conversation[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadConversations();
	});

	async function loadConversations() {
		try {
			const response = await fetch('/api/conversations');
			if (response.ok) {
				const data = await response.json();
				conversations = data.conversations;
			} else {
				error = '대화 목록을 불러오는데 실패했습니다.';
			}
		} catch (err) {
			error = '대화 목록을 불러오는데 실패했습니다.';
		} finally {
			loading = false;
		}
	}

	function formatMessageTime(dateString: string | null) {
		if (!dateString) return $userLocale.startsWith('ko') ? '메시지 없음' : 'No messages';
		return formatRelativeTime(dateString, $userLocale);
	}

	function getOfferStatusText(status: string) {
		switch (status) {
			case 'pending':
				return '대기중';
			case 'accepted':
				return '수락됨';
			case 'rejected':
				return '거절됨';
			case 'withdrawn':
				return '철회됨';
			default:
				return status;
		}
	}

	function getOfferStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'text-yellow-600 bg-yellow-50';
			case 'accepted':
				return 'text-green-600 bg-green-50';
			case 'rejected':
				return 'text-red-600 bg-red-50';
			case 'withdrawn':
				return 'text-gray-600 bg-gray-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">대화 목록</h1>
		<p class="mt-2 text-gray-600">가이드 제안에 대한 대화를 확인하세요.</p>
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each [1, 2, 3] as _}
				<div class="animate-pulse rounded-lg bg-white p-6 shadow">
					<div class="flex items-center space-x-4">
						<div class="h-12 w-12 rounded-full bg-gray-200"></div>
						<div class="flex-1">
							<div class="h-4 w-1/3 rounded bg-gray-200"></div>
							<div class="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-center text-red-600">
			{error}
		</div>
	{:else if conversations.length === 0}
		<div class="rounded-lg bg-gray-50 p-12 text-center">
			<MessageSquare class="mx-auto h-12 w-12 text-gray-400" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">아직 대화가 없습니다</h3>
			<p class="mt-2 text-gray-500">가이드 제안을 받거나 보내면 여기에 대화가 표시됩니다.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each conversations as conversation}
				<button
					onclick={() => goto(`/conversations/${conversation.id}`)}
					class="w-full rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex items-start space-x-4">
							{#if conversation.otherUser.image}
								<img
									src={conversation.otherUser.image}
									alt={conversation.otherUser.name}
									class="h-12 w-12 rounded-full object-cover"
								/>
							{:else}
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
									<span class="text-lg font-medium text-gray-600">
										{conversation.otherUser.name.charAt(0)}
									</span>
								</div>
							{/if}

							<div class="text-left">
								<div class="flex items-center gap-2">
									<h3 class="font-medium text-gray-900">
										{conversation.otherUser.name}
									</h3>
									<span class="text-sm text-gray-500">
										({conversation.otherUser.role === 'guide' ? '가이드' : '여행자'})
									</span>
								</div>

								<p class="mt-1 text-sm text-gray-600">
									{conversation.offer.title}
								</p>

								<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
									<span
										class={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getOfferStatusColor(conversation.offer.status)}`}
									>
										{getOfferStatusText(conversation.offer.status)}
									</span>
									<span class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										{formatMessageTime(conversation.lastMessageAt)}
									</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-2">
							{#if conversation.unreadCount > 0}
								<span
									class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
								>
									{conversation.unreadCount}
								</span>
							{/if}
							<ChevronRight class="h-5 w-5 text-gray-400" />
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
