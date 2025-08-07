<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatRelativeTime, formatDate } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';

	interface Conversation {
		id: string;
		type: 'trip' | 'product';
		status: string;
		lastMessageAt: string | null;
		lastMessageContent: string | null;
		unreadCount: number;
		hasUnread: boolean;
		otherUser: {
			id: string;
			name: string;
			email: string;
			role: string;
			image: string | null;
		};
		title: string;
		subtitle: string;
		productImage?: string;
		offer?: {
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
		// Set up polling for new messages every 30 seconds
		const interval = setInterval(loadConversations, 30000);
		return () => clearInterval(interval);
	});

	async function loadConversations() {
		try {
			const response = await fetch('/api/conversations/all');
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
	
	function navigateToChat(conversation: Conversation) {
		if (conversation.type === 'product') {
			goto(`/chat/product/${conversation.id}`);
		} else {
			goto(`/chat/${conversation.id}`);
		}
	}

	function formatMessageTime(dateString: string | null) {
		if (!dateString) return '메시지 없음';
		return formatRelativeTime(dateString, $userLocale);
	}

	function getOfferStatusText(status: string) {
		switch (status) {
			case 'pending':
				return '검토중';
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
				return 'bg-color-success text-white';
			case 'accepted':
				return 'bg-color-success text-white';
			case 'rejected':
				return 'bg-gray-500 text-white';
			case 'withdrawn':
				return 'bg-gray-500 text-white';
			default:
				return 'bg-gray-500 text-white';
		}
	}

	function truncateMessage(message: string | null, maxLength: number = 50) {
		if (!message) return '';
		return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
	}
</script>

<svelte:head>
	<title>채팅 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50/50">
	{#if loading}
		<!-- Loading skeleton -->
		<div class="space-y-0">
			{#each [1, 2, 3] as _, index}
				<div
					class="border-b border-gray-200/50 px-4 py-4 {index % 2 === 0
						? 'bg-white'
						: 'bg-gray-50'}"
				>
					<div class="flex items-start gap-3">
						<div class="h-14 w-14 animate-pulse rounded-full bg-gray-200"></div>
						<div class="flex-1">
							<div class="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
							<div class="mt-2 h-4 w-full animate-pulse rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="flex items-center justify-center p-8">
			<div class="text-color-error text-center">
				{error}
			</div>
		</div>
	{:else if conversations.length === 0}
		<div class="flex flex-1 items-center justify-center p-12">
			<div class="text-center">
				<div class="mx-auto mb-4 h-16 w-16 text-gray-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 21l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
						/>
					</svg>
				</div>
				<h3 class="text-primary text-lg font-semibold">아직 대화가 없습니다</h3>
				<p class="text-secondary mt-2">가이드 제안을 받거나 보내면 여기에 대화가 표시됩니다.</p>
			</div>
		</div>
	{:else}
		<!-- Chat list -->
		<div class="space-y-0">
			{#each conversations as conversation, index}
				<div
					class="border-b border-gray-200/50 transition-colors hover:bg-gray-100/50 {index % 2 === 0
						? 'bg-white'
						: 'bg-gray-50'} {conversation.hasUnread || conversation.unreadCount > 0
						? 'bg-blue-50/30'
						: ''}"
				>
					<button
						onclick={() => navigateToChat(conversation)}
						class="w-full px-4 py-4 text-left"
					>
						<div class="flex items-start gap-3">
							<!-- User avatar -->
							<div class="relative shrink-0">
								{#if conversation.otherUser.image}
									<img
										src={conversation.otherUser.image}
										alt={conversation.otherUser.name}
										class="h-14 w-14 rounded-full object-cover"
									/>
								{:else}
									<div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
										<span class="text-lg font-medium text-gray-600">
											{conversation.otherUser.name.charAt(0)}
										</span>
									</div>
								{/if}
								<!-- Online indicator (currently hidden) -->
								<div
									class="bg-color-success absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white opacity-0"
								></div>
							</div>

							<!-- Chat content -->
							<div class="min-w-0 flex-1">
								<!-- User name and status -->
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-1">
										<h3 class="text-primary text-sm font-semibold">
											{conversation.otherUser.name}
										</h3>
										{#if conversation.type === 'product'}
											<span class="bg-green-100 text-green-700 px-1.5 py-0.5 text-xs rounded">
												상품
											</span>
										{:else if conversation.offer?.status === 'pending'}
											<span
												class="bg-color-success inline-flex rounded px-2 py-0.5 text-xs font-medium text-white"
											>
												{getOfferStatusText(conversation.offer.status)}
											</span>
										{/if}
									</div>
									<div class="text-gray-500 text-xs font-medium">
										{formatMessageTime(conversation.lastMessageAt)}
									</div>
								</div>

								<!-- Last message -->
								<div class="mt-1 flex items-end justify-between">
									<div class="min-w-0 flex-1">
										<p class="text-gray-500 line-clamp-2 text-sm leading-5">
											{#if conversation.lastMessageContent}
												{truncateMessage(conversation.lastMessageContent, 60)}
											{:else}
												새로운 대화를 시작해보세요
											{/if}
										</p>
									</div>
									<!-- Unread badge -->
									{#if conversation.unreadCount > 0}
										<div class="ml-2 shrink-0">
											<div
												class="bg-color-error flex h-5 w-5 items-center justify-center rounded-full"
											>
												<span class="text-xs leading-3 font-semibold text-white">
													{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
												</span>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
