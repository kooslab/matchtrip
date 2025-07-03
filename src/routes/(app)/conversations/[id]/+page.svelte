<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { Send, ArrowLeft, ExternalLink } from 'lucide-svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { formatDate, formatTime, isToday, isYesterday } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';

	let { data = $page.data } = $props();

	// Debug logging
	console.log('Conversation component mounted');
	console.log('Props data:', data);
	console.log('Page data:', $page.data);
	console.log('Session from props:', data?.session);
	console.log('Session from page:', $page.data?.session);

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
		tripId: string;
		destination: {
			city: string;
			country: string;
		};
		trip: {
			id: string;
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
	let warningMessage = $state('');
	let currentUserId = $derived(data?.session?.user?.id || $page.data.session?.user?.id);
	let messagesContainer: HTMLDivElement;
	let pollingInterval: ReturnType<typeof setInterval>;

	const conversationId = $page.params.id;

	// Pattern to detect email addresses
	const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

	// Pattern to detect Korean phone numbers (010-xxxx-xxxx, 010xxxxxxxx, etc.)
	const phonePattern = /010[-\s]?\d{3,4}[-\s]?\d{4}/g;

	function containsSensitiveInfo(text: string): boolean {
		return emailPattern.test(text) || phonePattern.test(text);
	}

	function getSensitiveInfoWarning(text: string): string {
		const hasEmail = emailPattern.test(text);
		const hasPhone = phonePattern.test(text);

		if (hasEmail && hasPhone) {
			return '이메일과 전화번호는 보안상의 이유로 대화에서 공유할 수 없습니다.';
		} else if (hasEmail) {
			return '이메일 주소는 보안상의 이유로 대화에서 공유할 수 없습니다.';
		} else if (hasPhone) {
			return '전화번호는 보안상의 이유로 대화에서 공유할 수 없습니다.';
		}
		return '';
	}

	onMount(async () => {
		console.log('Current user ID:', currentUserId);
		console.log('Session data:', data?.session);
		console.log('User role:', data?.session?.user?.role);
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
				offer = data.offer || null;

				// Preserve optimistic messages (temp IDs) while updating real messages
				const tempMessages = messages.filter((msg) => msg.id.startsWith('temp-'));
				const serverMessages = data.messages || [];

				// Merge server messages with temp messages, avoiding duplicates
				const mergedMessages = [...serverMessages];
				for (const tempMsg of tempMessages) {
					// Check if this temp message already exists on server (by content and sender)
					const exists = serverMessages.some(
						(serverMsg) =>
							serverMsg.content === tempMsg.content &&
							serverMsg.senderId === tempMsg.senderId &&
							Math.abs(
								new Date(serverMsg.createdAt).getTime() - new Date(tempMsg.createdAt).getTime()
							) < 60000 // Within 1 minute
					);
					if (!exists) {
						mergedMessages.push(tempMsg);
					}
				}

				messages = mergedMessages.sort(
					(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);

				console.log('Messages set:', messages);
				console.log('Conversation set:', conversation);
				console.log('Conversation status:', conversation?.status);
				console.log('Conversation active check:', conversation && conversation.status === 'active');
				console.log('Should show input:', !!conversation && conversation.status === 'active');
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

	async function sendMessage(event: Event) {
		event.preventDefault();
		if (!newMessage.trim() || sending) return;

		// Check for sensitive information
		if (containsSensitiveInfo(newMessage)) {
			warningMessage = getSensitiveInfoWarning(newMessage);
			newMessage = ''; // Clear the input message
			// Clear warning after 5 seconds
			setTimeout(() => {
				warningMessage = '';
			}, 5000);
			return;
		}

		sending = true;
		const messageContent = newMessage;
		newMessage = '';
		warningMessage = ''; // Clear any existing warning

		// Optimistic rendering - add message immediately
		const optimisticMessage: Message = {
			id: `temp-${Date.now()}`,
			content: messageContent,
			senderId: currentUserId,
			isEdited: false,
			editedAt: null,
			isDeleted: false,
			createdAt: new Date().toISOString(),
			sender: {
				id: currentUserId,
				name: data?.session?.user?.name || 'You',
				email: data?.session?.user?.email || '',
				role: data?.session?.user?.role || 'traveler',
				image: data?.session?.user?.image || null
			}
		};

		messages = [...messages, optimisticMessage];
		await tick();
		scrollToBottom();

		try {
			const response = await fetch(`/api/conversations/${conversationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: messageContent })
			});

			if (response.ok) {
				const data = await response.json();
				// Replace optimistic message with real one
				messages = messages.map((msg) => (msg.id === optimisticMessage.id ? data.message : msg));
			} else {
				// Remove optimistic message on error
				messages = messages.filter((msg) => msg.id !== optimisticMessage.id);
				error = '메시지 전송에 실패했습니다.';
				newMessage = messageContent; // Restore message on error
			}
		} catch (err) {
			// Remove optimistic message on error
			messages = messages.filter((msg) => msg.id !== optimisticMessage.id);
			error = '메시지 전송에 실패했습니다.';
			newMessage = messageContent;
		} finally {
			sending = false;
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function formatMessageTime(dateString: string) {
		return formatTime(dateString, {
			locale: $userLocale,
			timezone: $userTimezone
		});
	}

	function formatMessageDate(dateString: string) {
		if (isToday(dateString)) {
			return $userLocale.startsWith('ko') ? '오늘' : 'Today';
		} else if (isYesterday(dateString)) {
			return $userLocale.startsWith('ko') ? '어제' : 'Yesterday';
		}
		return formatDate(dateString, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'long'
		});
	}

	function isNewDay(currentMsg: Message, prevMsg: Message | null) {
		if (!prevMsg) return true;
		const currentDate = new Date(currentMsg.createdAt).toDateString();
		const prevDate = new Date(prevMsg.createdAt).toDateString();
		return currentDate !== prevDate;
	}

	function handleBackButton() {
		if (offer) {
			// Check user role to determine redirect
			const userRole = data?.session?.user?.role;
			if (userRole === 'traveler') {
				// Redirect travelers to their trip details page
				goto(`/my-trips/${offer.tripId}`);
			} else if (userRole === 'guide') {
				// Redirect guides to their offer details page
				goto(`/my-offers/${offer.id}`);
			} else {
				history.back();
			}
		} else {
			history.back();
		}
	}
</script>

<div class="fixed inset-0 flex flex-col bg-gray-50 pt-16 md:pt-20">
	<!-- Header -->
	<div class="safe-area-top border-b bg-white px-4 py-3">
		<div class="flex items-center gap-4">
			<button onclick={handleBackButton} class="rounded-lg p-2 hover:bg-gray-100">
				<ArrowLeft class="h-5 w-5" />
			</button>
			<div class="flex-1">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-lg font-semibold">대화</h1>
						{#if offer}
							<div class="text-sm text-gray-600">
								{offer.destination.city}, {offer.destination.country}
							</div>
						{/if}
					</div>
					{#if offer}
						<div class="flex items-center gap-3 text-sm">
							<span class="font-medium text-gray-900">{offer.price.toLocaleString('ko-KR')}원</span>
							<span
								class={`rounded-full px-2 py-1 text-xs font-medium ${
									offer.status === 'accepted'
										? 'bg-green-100 text-green-700'
										: offer.status === 'rejected'
											? 'bg-red-100 text-red-700'
											: offer.status === 'pending'
												? 'bg-yellow-100 text-yellow-700'
												: 'bg-gray-100 text-gray-700'
								}`}
							>
								{offer.status === 'accepted'
									? '수락됨'
									: offer.status === 'rejected'
										? '거절됨'
										: offer.status === 'pending'
											? '검토중'
											: offer.status}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-1 flex-col">
			<!-- Messages skeleton -->
			<div class="flex-1 overflow-y-auto px-4 py-4">
				<!-- Date separator skeleton -->
				<div class="my-4 text-center">
					<div class="inline-block h-6 w-32 animate-pulse rounded-full bg-gray-200"></div>
				</div>

				<!-- Message skeletons -->
				{#each Array(5) as _, i}
					<div class={`mb-4 flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
						<div class="max-w-[70%] space-y-2">
							<!-- Sender name and time skeleton -->
							<div class="flex items-center gap-2">
								<div class="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
								<div class="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
							</div>
							<!-- Message content skeleton -->
							<div class={`rounded-lg px-4 py-2 ${i % 2 === 0 ? 'bg-gray-100' : 'bg-blue-100'}`}>
								<SkeletonLoader rows={Math.floor(Math.random() * 2) + 1} height="h-4" />
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Input skeleton -->
			<div class="mb-2 border-t bg-white p-4">
				<div class="flex gap-2">
					<div class="h-10 flex-1 animate-pulse rounded-lg bg-gray-200"></div>
					<div class="h-10 w-10 animate-pulse rounded-lg bg-gray-200"></div>
				</div>
			</div>
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
		<!-- Main content area with flex to ensure input stays at bottom -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Messages -->
			<div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-4 py-4">
				{#each messages as message, i}
					{#if isNewDay(message, i > 0 ? messages[i - 1] : null)}
						<div class="my-4 text-center">
							<span class="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
								{formatMessageDate(message.createdAt)}
							</span>
						</div>
					{/if}

					<div
						class={`mb-4 flex ${message.senderId === currentUserId ? 'justify-start' : 'justify-end'}`}
					>
						<div class={`max-w-[70%]`}>
							<div class="mb-1 flex items-center gap-2">
								<span class="text-xs font-medium text-gray-600">
									{message.sender.name}
								</span>
								<span class="text-xs text-gray-500">
									{formatMessageTime(message.createdAt)}
								</span>
								{#if message.isEdited}
									<span class="text-xs text-gray-400">(수정됨)</span>
								{/if}
							</div>

							<div
								class={`rounded-lg px-4 py-2 ${
									message.senderId === currentUserId
										? 'bg-blue-500 text-white'
										: 'bg-gray-100 text-gray-900'
								}`}
							>
								<p class="text-sm whitespace-pre-wrap">{message.content}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Input -->
			{#if conversation.status === 'active'}
				<div class="safe-area-bottom mb-2 border-t bg-white p-4">
					{#if warningMessage}
						<div class="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
							<p class="text-sm text-red-700">{warningMessage}</p>
						</div>
					{/if}
					<form onsubmit={sendMessage} class="flex gap-2">
						<input
							type="text"
							bind:value={newMessage}
							placeholder="메시지를 입력하세요..."
							disabled={sending}
							oninput={() => {
								if (warningMessage) warningMessage = '';
							}}
							class="flex-1 rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
				<div
					class="safe-area-bottom mb-2 border-t bg-gray-100 p-4 text-center text-sm text-gray-500"
				>
					이 대화는 종료되었습니다. (상태: {conversation.status})
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Handle safe areas for devices with notches/home indicators */
	.safe-area-top {
		padding-top: env(safe-area-inset-top);
	}
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
