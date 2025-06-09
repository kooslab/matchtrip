<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { Send, ArrowLeft, Edit2, Trash2, Check, X } from 'lucide-svelte';
	
	let { data } = $props();

	interface Message {
		id: string;
		content: string;
		senderId: string;
		isEdited: boolean;
		editedAt: string | null;
		isDeleted: boolean;
		createdAt: string;
		sender: {
			id: string;
			name: string;
			email: string;
			role: string;
			image: string | null;
		};
	}

	interface Conversation {
		id: string;
		offerId: string;
		travelerId: string;
		guideId: string;
		status: string;
	}

	interface Offer {
		id: string;
		title: string;
		price: number;
		status: string;
		destination: {
			city: string;
			country: string;
		};
		trip: {
			startDate: string;
			endDate: string;
		};
	}

	let conversation = $state<Conversation | null>(null);
	let messages = $state<Message[]>([]);
	let offer = $state<Offer | null>(null);
	let newMessage = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let error = $state('');
	let currentUserId = $derived(data?.session?.user?.id || $page.data.session?.user?.id);
	let messagesContainer: HTMLDivElement;
	let editingMessageId = $state<string | null>(null);
	let editContent = $state('');
	let pollingInterval: ReturnType<typeof setInterval>;

	const conversationId = $page.params.id;

	onMount(async () => {
		console.log('Current user ID:', currentUserId);
		console.log('Session data:', data?.session);
		await loadConversation();
		// Poll for new messages every 5 seconds
		pollingInterval = setInterval(loadConversation, 5000);
	});

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	async function loadConversation() {
		try {
			console.log('Loading conversation:', conversationId);
			const response = await fetch(`/api/conversations/${conversationId}`);
			console.log('Response status:', response.status);
			
			if (response.ok) {
				const data = await response.json();
				console.log('Conversation data:', data);
				conversation = data.conversation;
				messages = data.messages || [];
				offer = data.offer || null;
				console.log('Messages set:', messages);
				console.log('Conversation set:', conversation);
				console.log('Offer set:', offer);
				await tick();
				scrollToBottom();
			} else if (response.status === 404) {
				error = '대화를 찾을 수 없습니다.';
			} else if (response.status === 401) {
				error = '로그인이 필요합니다.';
				goto('/signin');
			} else {
				const errorData = await response.json();
				console.error('Error response:', errorData);
				error = errorData.error || '대화를 불러오는데 실패했습니다.';
			}
		} catch (err) {
			console.error('Fetch error:', err);
			error = '대화를 불러오는데 실패했습니다.';
		} finally {
			loading = false;
			console.log('Loading set to false, loading state:', loading);
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || sending) return;

		sending = true;
		const messageContent = newMessage;
		newMessage = '';

		try {
			const response = await fetch(`/api/conversations/${conversationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: messageContent })
			});

			if (response.ok) {
				const data = await response.json();
				messages = [...messages, data.message];
				await tick();
				scrollToBottom();
			} else {
				error = '메시지 전송에 실패했습니다.';
				newMessage = messageContent; // Restore message on error
			}
		} catch (err) {
			error = '메시지 전송에 실패했습니다.';
			newMessage = messageContent;
		} finally {
			sending = false;
		}
	}

	async function startEdit(message: Message) {
		if (message.senderId !== currentUserId || message.isDeleted) return;
		editingMessageId = message.id;
		editContent = message.content;
	}

	async function saveEdit() {
		if (!editContent.trim() || !editingMessageId) return;

		try {
			const response = await fetch(`/api/conversations/${conversationId}/messages`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					messageId: editingMessageId, 
					content: editContent 
				})
			});

			if (response.ok) {
				const data = await response.json();
				messages = messages.map(msg => 
					msg.id === editingMessageId ? { ...msg, ...data.message } : msg
				);
				editingMessageId = null;
				editContent = '';
			} else {
				error = '메시지 수정에 실패했습니다.';
			}
		} catch (err) {
			error = '메시지 수정에 실패했습니다.';
		}
	}

	async function deleteMessage(messageId: string) {
		if (!confirm('메시지를 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/conversations/${conversationId}/messages`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId })
			});

			if (response.ok) {
				const data = await response.json();
				messages = messages.map(msg => 
					msg.id === messageId ? { ...msg, ...data.message } : msg
				);
			} else {
				error = '메시지 삭제에 실패했습니다.';
			}
		} catch (err) {
			error = '메시지 삭제에 실패했습니다.';
		}
	}

	function cancelEdit() {
		editingMessageId = null;
		editContent = '';
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function formatTime(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleTimeString('ko-KR', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function isNewDay(currentMsg: Message, prevMsg: Message | null) {
		if (!prevMsg) return true;
		const currentDate = new Date(currentMsg.createdAt).toDateString();
		const prevDate = new Date(prevMsg.createdAt).toDateString();
		return currentDate !== prevDate;
	}
</script>

<div class="flex h-screen flex-col bg-gray-50">
	<!-- Header -->
	<div class="border-b bg-white px-4 py-3">
		<div class="flex items-center gap-4">
			<button
				onclick={() => goto('/conversations')}
				class="rounded-lg p-2 hover:bg-gray-100"
			>
				<ArrowLeft class="h-5 w-5" />
			</button>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">대화</h1>
				{#if offer}
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<span>{offer.destination.city}, {offer.destination.country}</span>
						<span>•</span>
						<span>{offer.price.toLocaleString('ko-KR')}원</span>
						<span>•</span>
						<span class={`font-medium ${
							offer.status === 'accepted' ? 'text-green-600' : 
							offer.status === 'rejected' ? 'text-red-600' : 
							offer.status === 'pending' ? 'text-yellow-600' : 
							'text-gray-600'
						}`}>
							{offer.status === 'accepted' ? '수락됨' : 
							 offer.status === 'rejected' ? '거절됨' : 
							 offer.status === 'pending' ? '검토중' : 
							 offer.status}
						</span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-gray-500">로딩 중...</div>
		</div>
	{:else if error}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<p class="text-red-600">{error}</p>
				<button
					onclick={() => goto('/conversations')}
					class="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					목록으로 돌아가기
				</button>
			</div>
		</div>
	{:else if conversation}
		<!-- Messages -->
		<div
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto px-4 py-4"
		>
			{#each messages as message, i}
				{#if isNewDay(message, i > 0 ? messages[i - 1] : null)}
					<div class="my-4 text-center">
						<span class="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
							{formatDate(message.createdAt)}
						</span>
					</div>
				{/if}

				<div class={`mb-4 flex ${message.senderId === currentUserId ? 'justify-start' : 'justify-end'}`}>
					<div class={`max-w-[70%]`}>
						<div class="mb-1 flex items-center gap-2">
							<span class="text-xs font-medium text-gray-600">
								{message.sender.name}
							</span>
							<span class="text-xs text-gray-500">
								{formatTime(message.createdAt)}
							</span>
							{#if message.isEdited}
								<span class="text-xs text-gray-400">(수정됨)</span>
							{/if}
						</div>

						{#if editingMessageId === message.id}
							<div class="rounded-lg bg-white p-3 shadow">
								<textarea
									bind:value={editContent}
									class="w-full resize-none rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									rows="2"
								></textarea>
								<div class="mt-2 flex justify-end gap-2">
									<button
										onclick={cancelEdit}
										class="rounded p-1 hover:bg-gray-100"
									>
										<X class="h-4 w-4" />
									</button>
									<button
										onclick={saveEdit}
										class="rounded p-1 hover:bg-gray-100"
									>
										<Check class="h-4 w-4" />
									</button>
								</div>
							</div>
						{:else}
							<div
								class={`rounded-lg px-4 py-2 ${
									message.senderId === currentUserId
										? 'bg-gray-100 text-gray-900'
										: 'bg-blue-500 text-white'
								}`}
							>
								<p class="whitespace-pre-wrap text-sm">{message.content}</p>
							</div>

							{#if message.senderId === currentUserId && !message.isDeleted}
								<div class="mt-1 flex justify-start gap-1">
									<button
										onclick={() => startEdit(message)}
										class="rounded p-1 hover:bg-gray-100"
									>
										<Edit2 class="h-3 w-3 text-gray-500" />
									</button>
									<button
										onclick={() => deleteMessage(message.id)}
										class="rounded p-1 hover:bg-gray-100"
									>
										<Trash2 class="h-3 w-3 text-gray-500" />
									</button>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Input -->
		{#if conversation.status === 'active'}
			<div class="border-t bg-white p-4">
				<form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="flex gap-2">
					<input
						type="text"
						bind:value={newMessage}
						placeholder="메시지를 입력하세요..."
						disabled={sending}
						class="flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={!newMessage.trim() || sending}
						class="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
					>
						<Send class="h-5 w-5" />
					</button>
				</form>
			</div>
		{:else}
			<div class="border-t bg-gray-100 p-4 text-center text-sm text-gray-500">
				이 대화는 종료되었습니다.
			</div>
		{/if}
	{/if}
</div>