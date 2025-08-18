<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { Send, MoreHorizontal } from 'lucide-svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { formatDate, formatTime, isToday, isYesterday } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';

	// Import custom icons
	import ArrowBackIcon from '$lib/icons/icon-arrow-back-android-mono.svg?raw';
	import ArrowRightSmallIcon from '$lib/icons/icon-arrow-right-small-mono.svg?raw';
	import PlayIcon from '$lib/icons/icon-play-mono.svg?raw';

	let { data = $page.data } = $props();

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
	let showCancelModal = $state(false);
	let selectedCancelRequest = $state<Message | null>(null);
	let currentUserId = $derived(data?.session?.user?.id || $page.data.session?.user?.id);
	let canSendMessage = $state(true);
	let messagesContainer: HTMLDivElement;
	let pollingInterval: ReturnType<typeof setInterval>;

	const conversationId = $page.params.id;

	// Pattern to detect email addresses
	const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

	// Pattern to detect Korean phone numbers (010-xxxx-xxxx, 010xxxxxxxx, etc.)
	const phonePattern = /010[-\s]?\d{3,4}[-\s]?\d{4}/g;

	// Pattern to detect markdown-style links [text](url)
	const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

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

	// Function to parse message content and convert markdown links to HTML
	function parseMessageContent(content: string): { html: string; hasLinks: boolean } {
		let hasLinks = false;
		const html = content.replace(linkPattern, (match, text, url) => {
			hasLinks = true;
			// Ensure the URL is safe and add target="_blank" for external links
			const safeUrl = url.startsWith('/') ? url : url.startsWith('http') ? url : `https://${url}`;
			return `<a href="${safeUrl}" class="underline font-semibold" ${!url.startsWith('/') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
		});
		return { html, hasLinks };
	}

	onMount(async () => {
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
			const response = await fetch(`/api/conversations/${conversationId}`);

			if (response.ok) {
				const data = await response.json();
				conversation = data.conversation;
				offer = data.offer || null;
				canSendMessage = data.canSendMessage ?? true;

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

				// Mark messages as read when conversation is viewed
				await markMessagesAsRead();

				await tick();
				scrollToBottom();
			} else if (response.status === 404) {
				error = '대화를 찾을 수 없습니다.';
			} else if (response.status === 401) {
				error = '로그인이 필요합니다.';
				goto('/');
			} else {
				const errorData = await response.json();
				error = errorData.error || '대화를 불러오는데 실패했습니다.';
			}
		} catch (err) {
			error = '대화를 불러오는데 실패했습니다.';
		} finally {
			loading = false;
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
			// Keep focus on input
			setTimeout(() => {
				const input = document.getElementById('message-input') as HTMLInputElement;
				if (input) {
					input.focus();
				}
			}, 0);
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
			// Return focus to the input field
			setTimeout(() => {
				const input = document.getElementById('message-input') as HTMLInputElement;
				if (input) {
					input.focus();
				}
			}, 0);
		}
	}

	async function markMessagesAsRead() {
		try {
			await fetch(`/api/conversations/${conversationId}/mark-read`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			// Silently fail - not critical for user experience
			console.warn('Failed to mark messages as read:', err);
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

	// Get the other person's info in the conversation
	let otherPerson = $derived(
		(() => {
			if (!conversation || !currentUserId) return null;

			// Determine who the other person is based on the conversation
			const otherUserId =
				conversation.travelerId === currentUserId ? conversation.guideId : conversation.travelerId;

			// Find any message from the other person to get their details
			if (messages.length > 0) {
				const otherPersonMessage = messages.find((msg) => msg.senderId === otherUserId);
				if (otherPersonMessage) {
					return otherPersonMessage.sender;
				}

				// If no message from other person, but we have messages, get info from any message
				// This handles the case where only current user has sent messages
				const anyMessage = messages.find((msg) => msg.sender);
				if (anyMessage && anyMessage.senderId !== currentUserId) {
					return anyMessage.sender;
				}
			}

			return null;
		})()
	);

	let otherPersonName = $derived(otherPerson?.name || 'User');

	// Get status badge color and text
	let statusInfo = $derived(
		(() => {
			if (!offer) return null;
			switch (offer.status) {
				case 'accepted':
					return { text: '수락됨', bgColor: '#19b989', textColor: '#ffffff' };
				case 'rejected':
					return { text: '거절됨', bgColor: '#f72b2b', textColor: '#ffffff' };
				case 'pending':
					return { text: '검토중', bgColor: '#19b989', textColor: '#ffffff' };
				default:
					return { text: offer.status, bgColor: '#e8e8e8', textColor: '#052236' };
			}
		})()
	);

	// Handle cancellation request actions
	function handleCancelRequestClick(message: Message) {
		if (message.messageType === 'cancellation_request') {
			// Only show modal for travelers
			if (data?.user?.role === 'traveler') {
				selectedCancelRequest = message;
				showCancelModal = true;
			}
		}
	}

	async function handleCancelResponse(response: 'accepted' | 'declined') {
		if (!selectedCancelRequest || !selectedCancelRequest.metadata) return;

		try {
			const res = await fetch(`/api/conversations/${conversationId}/cancel-response`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId: selectedCancelRequest.id,
					response,
					paymentId: selectedCancelRequest.metadata.paymentId,
					offerId: selectedCancelRequest.metadata.offerId
				})
			});

			if (!res.ok) throw new Error('Failed to send response');

			// Refresh messages
			await fetchConversation();
			showCancelModal = false;
			selectedCancelRequest = null;
		} catch (err) {
			console.error('Error sending cancel response:', err);
			alert('응답 전송 중 오류가 발생했습니다.');
		}
	}
</script>

<div class="min-h-screen bg-white">
	<div class="relative mx-auto flex min-h-screen max-w-md flex-col">
		{#if !loading}
			<!-- Header -->
			<div class="safe-area-top bg-white">
				<div class="flex items-center justify-between px-4 py-4">
					<!-- Back Button -->
					<button
						onclick={() => goto('/chat')}
						class="flex items-center justify-center p-0"
						aria-label="Go back to chat list"
					>
						<div class="h-6 w-6" style="color: #1095f4;">
							{@html ArrowBackIcon.replace('fill="#8B95A1"', 'fill="currentColor"')}
						</div>
					</button>

					<!-- User Name and Avatar -->
					<div class="flex flex-1 items-center justify-center">
						{#if otherPerson}
							<div class="flex items-center gap-2">
								{#if otherPerson.image}
									<img
										src={otherPerson.image}
										alt={otherPersonName}
										class="h-8 w-8 rounded-full object-cover"
									/>
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
										<span class="text-sm font-medium text-gray-600">
											{otherPersonName?.charAt(0).toUpperCase()}
										</span>
									</div>
								{/if}
								<span class="text-lg font-semibold text-gray-900">{otherPersonName || 'User'}</span>
							</div>
						{/if}
					</div>

					<!-- More Options Button -->
					<button class="flex items-center justify-center p-0">
						<MoreHorizontal class="h-6 w-6 text-gray-400" />
					</button>
				</div>
			</div>

			<!-- Offer Details Bar -->
			{#if offer}
				<div class="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
					<div class="px-4 py-3">
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-1">
								<span class="text-secondary text-[10px] leading-3 font-medium">나의 제안 금액</span>
								<div class="flex items-center gap-1">
									<span class="text-primary text-base font-bold"
										>{offer.price.toLocaleString('ko-KR')}원</span
									>
									<div class="text-primary h-3 w-3 rotate-90">
										{@html ArrowRightSmallIcon}
									</div>
								</div>
							</div>
							{#if statusInfo}
								<div
									class="rounded border px-2 py-0.5"
									style="background-color: {statusInfo.bgColor}; border-color: {statusInfo.bgColor};"
								>
									<span
										class="text-[11px] leading-4 font-medium"
										style="color: {statusInfo.textColor}"
									>
										{statusInfo.text}
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Loading header skeleton -->
			<div class="safe-area-top border-b border-gray-100 bg-white/95 backdrop-blur-sm">
				<div class="flex items-center justify-between px-4 py-2.5">
					<div class="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
					<div class="flex items-center gap-1">
						<div class="h-7 w-7 animate-pulse rounded-full bg-gray-200"></div>
						<div class="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
					</div>
					<div class="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex flex-1 flex-col">
				<!-- Messages skeleton -->
				<div class="flex-1 overflow-y-auto px-4 py-4">
					{#each Array(5) as _, i}
						<div class={`mb-3 flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
							<div class="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200"></div>
							<div
								class={`rounded-xl px-3 py-3 ${i % 2 === 0 ? 'rounded-tl-md bg-[#003e8105]' : 'bg-color-primary rounded-tr-md'}`}
							>
								<SkeletonLoader
									rows={Math.floor(Math.random() * 2) + 1}
									height="h-4"
									width="w-[200px]"
								/>
							</div>
							<div class="mt-1 h-3 w-12 animate-pulse rounded bg-gray-200"></div>
						</div>
					{/each}
				</div>

				<!-- Input skeleton -->
				<div class="border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm">
					<div class="flex gap-3">
						<div class="h-9 flex-1 animate-pulse rounded-[20px] bg-gray-200"></div>
						<div class="h-9 w-9 animate-pulse rounded-[20px] bg-gray-200"></div>
					</div>
				</div>
			</div>
		{:else if error}
			<div class="flex flex-1 items-center justify-center">
				<div class="text-center">
					<p class="text-red-600">{error}</p>
					<button
						onclick={() => goto('/chat')}
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
				<div bind:this={messagesContainer} class="flex-1 overflow-y-auto px-4 py-2">
					{#each messages as message, i}
						{@const parsedContent = parseMessageContent(message.content)}
						<div
							class="mb-3 flex flex-col gap-1 {message.senderId !== currentUserId
								? 'items-start'
								: 'items-end'}"
						>
							{#if message.senderId !== currentUserId}
								<span class="px-2 text-xs font-semibold" style="color: #052236;">
									{message.sender.name}
								</span>
							{/if}

							{#if message.messageType === 'cancellation_request'}
								<div
									class="max-w-[300px] overflow-hidden rounded-lg border-2 border-blue-500 bg-white"
								>
									<div class="border-b border-dashed border-blue-300 px-4 py-3">
										<p class="text-center font-semibold text-gray-900">취소 요청</p>
									</div>
									<div class="border-b border-dashed border-blue-300 px-4 py-3">
										<p class="text-center text-gray-700">
											{message.metadata?.reason || '가이드가 여행 취소를 요청하였습니다.'}
										</p>
									</div>
									<div class="px-4 py-3">
										<!-- Debug info -->
										<p class="mb-2 text-xs text-gray-400">
											Role: {data?.user?.role || 'none'}, Status: {message.metadata?.status ||
												'undefined'}
										</p>

										{#if message.metadata?.status === 'accepted'}
											<p class="text-center font-medium text-green-600">✓ 취소가 승인되었습니다</p>
										{:else if message.metadata?.status === 'declined'}
											<p class="text-center font-medium text-red-600">✗ 취소가 거절되었습니다</p>
										{:else}
											<!-- Always show button for travelers regardless of metadata status -->
											{#if data?.user?.role === 'traveler'}
												<button
													type="button"
													onclick={() => handleCancelRequestClick(message)}
													class="w-full rounded bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700"
												>
													확인하기
												</button>
											{:else}
												<p class="text-center text-sm text-gray-500">
													여행자의 응답을 기다리고 있습니다
												</p>
											{/if}
										{/if}
									</div>
								</div>
							{:else if message.messageType === 'cancellation_response'}
								<div class="max-w-[280px] rounded-lg bg-gray-100 px-4 py-3">
									<p class="mb-1 text-sm font-semibold">
										취소 {message.metadata?.response === 'accepted' ? '승인' : '거절'}
									</p>
									<p class="text-sm text-gray-600">
										{message.metadata?.response === 'accepted'
											? '가이드가 여행 취소를 요청하였습니다.'
											: '취소 요청이 거절되었습니다.'}
									</p>
								</div>
							{:else}
								<div
									class="max-w-[212px] px-3 py-3 {message.senderId !== currentUserId
										? 'rounded-tl-md rounded-tr-xl rounded-br-xl rounded-bl-xl'
										: 'rounded-tl-xl rounded-tr-md rounded-br-xl rounded-bl-xl'}"
									style="background-color: {message.senderId !== currentUserId
										? '#003e8105'
										: '#1095f4'};"
								>
									{#if parsedContent.hasLinks}
										<p
											class="message-content text-[13px] leading-5"
											style="color: {message.senderId === currentUserId ? '#ffffff' : '#052236'};"
										>
											{@html parsedContent.html}
										</p>
									{:else}
										<p
											class="text-[13px] leading-5"
											style="color: {message.senderId === currentUserId ? '#ffffff' : '#052236'};"
										>
											{message.content}
										</p>
									{/if}
								</div>
							{/if}

							<div class="flex items-center gap-1 px-2">
								<span class="text-secondary text-[11px] font-medium">
									{formatMessageTime(message.createdAt)}
								</span>
								{#if message.isEdited}
									<span class="text-secondary text-[11px]">(수정됨)</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Input -->
				{#if conversation.status === 'active'}
					<div
						class="safe-area-bottom rounded-t-[20px] border-t border-gray-100 bg-[#fefefe]/95 shadow-[0px_-5px_20px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm"
					>
						<div class="px-4 py-2">
							{#if warningMessage}
								<div class="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
									<p class="text-sm text-red-700">{warningMessage}</p>
								</div>
							{/if}
							{#if !canSendMessage}
								<div class="py-3 text-center">
									<p class="text-sm text-gray-600">
										고객이 먼저 메시지를 보내거나 결제가 완료된 후에 채팅이 가능합니다.
									</p>
								</div>
							{:else}
								<form onsubmit={sendMessage} class="flex items-end gap-3">
									<div class="flex-1 py-2">
										<input
											id="message-input"
											type="text"
											bind:value={newMessage}
											placeholder="메시지를 입력하세요"
											disabled={sending}
											oninput={() => {
												if (warningMessage) warningMessage = '';
											}}
											class="text-primary placeholder:text-primary/60 w-full bg-transparent text-base leading-6 outline-none"
										/>
									</div>
									<button
										type="submit"
										disabled={!newMessage.trim() || sending}
										class="flex h-9 w-9 items-center justify-center rounded-[20px] p-1 transition-opacity disabled:opacity-50"
										style="background-color: #1095f4; background-image: linear-gradient(157.454deg, rgba(54, 41, 241, 0) 0%, rgba(220, 220, 220, 0.4) 100%)"
									>
										<div class="h-7 w-7" style="color: white;">
											{@html PlayIcon.replace('fill="#8B95A1"', 'fill="currentColor"')}
										</div>
									</button>
								</form>
							{/if}
						</div>
					</div>
				{:else}
					<div
						class="safe-area-bottom rounded-t-[20px] border-t border-gray-100 bg-[#fefefe]/95 p-4 text-center text-sm text-gray-500 backdrop-blur-sm"
					>
						이 대화는 종료되었습니다. (상태: {conversation.status})
					</div>
				{/if}
			</div>
		{/if}

		<!-- Cancellation Confirmation Modal -->
		{#if showCancelModal && selectedCancelRequest}
			<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black px-4">
				<div class="w-full max-w-sm rounded-2xl bg-white p-6">
					<h2 class="mb-6 text-center text-xl font-bold">취소 확인</h2>

					<div class="mb-6 rounded-lg bg-gray-50 p-4">
						<p class="text-center text-sm text-gray-600">
							{selectedCancelRequest.metadata?.reason || '취소 사유가 제공되지 않았습니다.'}
						</p>
					</div>

					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => handleCancelResponse('declined')}
							class="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							담기
						</button>
						<button
							type="button"
							onclick={() => handleCancelResponse('accepted')}
							class="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							수락하기
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Handle safe areas for devices with notches/home indicators */
	.safe-area-top {
		padding-top: env(safe-area-inset-top);
	}
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}

	/* Ensure SVG icons fill their container */
	:global(div svg) {
		width: 100%;
		height: 100%;
	}

	/* Styles for message links */
	:global(.message-content a) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.message-content a:hover) {
		opacity: 0.8;
	}
</style>
