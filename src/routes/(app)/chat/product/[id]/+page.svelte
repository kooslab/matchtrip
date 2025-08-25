<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { Send, MoreHorizontal, Package, Plus } from 'lucide-svelte';
	import ArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	import { formatDate, formatTime } from '$lib/utils/dateFormatter';
	import { validateFile } from '$lib/utils/fileValidator';
	import OfferModal from './OfferModal.svelte';
	import OfferMessage from './OfferMessage.svelte';
	import ImageMessage from './ImageMessage.svelte';
	import FileMessage from './FileMessage.svelte';
	import MoneyIcon from '$lib/images/money.png';
	import AlbumIcon from '$lib/images/album.png';
	import FileIcon from '$lib/images/file.png';

	const { data } = $props();

	// Get data from server
	const conversation = $derived(data.conversation);
	const product = $derived(data.product);
	const otherUser = $derived(data.otherUser);
	const userRole = $derived(data.userRole);
	const currentUserId = $derived(data.currentUserId);

	// State
	let messages = $state(data.messages || []);
	let newMessage = $state('');
	let sending = $state(false);
	let showOfferModal = $state(false);
	let showOptions = $state(false);
	let showCancelModal = $state(false);
	let selectedCancelRequest = $state<any>(null);
	let messagesContainer: HTMLDivElement;
	let pollingInterval: ReturnType<typeof setInterval>;

	// Format price
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ko-KR').format(price);
	};

	// Parse markdown links in text
	function parseMarkdownLink(text: string) {
		// Regex to match markdown links [text](url)
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		const parts = [];
		let lastIndex = 0;
		let match;

		while ((match = linkRegex.exec(text)) !== null) {
			// Add text before the link
			if (match.index > lastIndex) {
				parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
			}
			// Add the link
			parts.push({ type: 'link', text: match[1], url: match[2] });
			lastIndex = match.index + match[0].length;
		}

		// Add remaining text after the last link
		if (lastIndex < text.length) {
			parts.push({ type: 'text', content: text.substring(lastIndex) });
		}

		// If no links found, return original text as single part
		if (parts.length === 0) {
			parts.push({ type: 'text', content: text });
		}

		return parts;
	}

	// Scroll to bottom of messages
	async function scrollToBottom(smooth = true) {
		await tick();
		if (messagesContainer) {
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: smooth ? 'smooth' : 'instant'
			});
		}
	}

	// Handle cancellation request actions
	function handleCancelRequestClick(message: any) {
		if (message.messageType === 'cancellation_request') {
			// Only show modal for travelers
			if (userRole === 'traveler') {
				selectedCancelRequest = message;
				showCancelModal = true;
			}
		}
	}

	async function handleCancelResponse(response: 'accepted' | 'declined') {
		if (!selectedCancelRequest || !selectedCancelRequest.metadata) return;

		try {
			const res = await fetch(`/api/product-conversations/${conversation.id}/cancel-response`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId: selectedCancelRequest.id,
					response,
					paymentId: selectedCancelRequest.metadata.paymentId,
					productOfferId: selectedCancelRequest.metadata.productOfferId
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

	// Send text message
	async function sendMessage() {
		if (!newMessage.trim() || sending) return;

		const messageContent = newMessage.trim();
		newMessage = '';
		sending = true;

		// Optimistic update - add message immediately
		const tempMessage = {
			id: `temp-${Date.now()}`,
			senderId: currentUserId,
			content: messageContent,
			messageType: 'text',
			createdAt: new Date().toISOString(),
			sender: {
				id: currentUserId,
				name: data.session?.user?.name || 'Me',
				email: data.session?.user?.email || '',
				role: userRole,
				image: data.session?.user?.image || null
			},
			isOptimistic: true
		};

		messages = [...messages, tempMessage];
		await scrollToBottom();

		try {
			const response = await fetch(`/api/product-messages/${conversation.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: messageContent,
					messageType: 'text'
				})
			});

			if (response.ok) {
				const message = await response.json();
				// Replace optimistic message with real one
				messages = messages.map((m) => (m.id === tempMessage.id ? message : m));
			} else {
				// Remove optimistic message on error
				messages = messages.filter((m) => m.id !== tempMessage.id);
				// Restore the message to input
				newMessage = messageContent;
			}
		} catch (error) {
			console.error('Failed to send message:', error);
			// Remove optimistic message on error
			messages = messages.filter((m) => m.id !== tempMessage.id);
			// Restore the message to input
			newMessage = messageContent;
		} finally {
			sending = false;
		}
	}

	// Handle offer submission
	async function handleOfferSubmit(offerData: {
		price: number;
		duration: number;
		startDate: Date;
		endDate: Date;
	}) {
		sending = true;
		showOfferModal = false;

		// Format dates for display
		const formatDate = (date: Date) => {
			return new Intl.DateTimeFormat('ko-KR', {
				month: 'numeric',
				day: 'numeric'
			}).format(date);
		};

		// Generate default message with dates
		const offerMessage = `${formatDate(offerData.startDate)} - ${formatDate(offerData.endDate)} (${offerData.duration}일) 일정으로 ${offerData.price.toLocaleString('ko-KR')}원에 가이드 서비스를 제안드립니다.`;

		// Optimistic update - add offer message immediately
		const tempMessage = {
			id: `temp-${Date.now()}`,
			senderId: currentUserId,
			content: offerMessage,
			messageType: 'offer',
			metadata: {
				price: offerData.price,
				duration: offerData.duration,
				startDate: offerData.startDate.toISOString(),
				endDate: offerData.endDate.toISOString()
			},
			createdAt: new Date().toISOString(),
			sender: {
				id: currentUserId,
				name: data.session?.user?.name || 'Me',
				email: data.session?.user?.email || '',
				role: userRole,
				image: data.session?.user?.image || null
			},
			isOptimistic: true
		};

		messages = [...messages, tempMessage];
		await scrollToBottom();

		try {
			const response = await fetch(`/api/product-messages/${conversation.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					content: offerMessage,
					messageType: 'offer',
					metadata: {
						price: offerData.price,
						duration: offerData.duration,
						startDate: offerData.startDate.toISOString(),
						endDate: offerData.endDate.toISOString()
					}
				})
			});

			if (response.ok) {
				const message = await response.json();
				// Replace optimistic message with real one
				messages = messages.map((m) => (m.id === tempMessage.id ? message : m));
			} else {
				// Remove optimistic message on error
				messages = messages.filter((m) => m.id !== tempMessage.id);
				showOfferModal = true; // Reopen modal on error
			}
		} catch (error) {
			console.error('Failed to send offer:', error);
			// Remove optimistic message on error
			messages = messages.filter((m) => m.id !== tempMessage.id);
			showOfferModal = true; // Reopen modal on error
		} finally {
			sending = false;
		}
	}

	// Handle image upload
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file using fileValidator
		const validation = validateFile(file);
		if (!validation.isValid) {
			alert(validation.error);
			input.value = '';
			return;
		}

		// Additional check for image type
		if (!file.type.startsWith('image/')) {
			alert('이미지 파일만 업로드 가능합니다.');
			input.value = '';
			return;
		}

		// Create a local URL for the image to show immediately
		const localImageUrl = URL.createObjectURL(file);

		// Add optimistic message with loading state
		const tempMessage = {
			id: `temp-image-${Date.now()}`,
			senderId: currentUserId,
			content: null,
			messageType: 'image',
			metadata: {
				url: localImageUrl,
				filename: file.name,
				fileSize: file.size,
				fileType: file.type,
				isUploading: true
			},
			createdAt: new Date().toISOString(),
			sender: {
				id: currentUserId,
				name: data.session?.user?.name || 'Me',
				email: data.session?.user?.email || '',
				role: userRole,
				image: data.session?.user?.image || null
			},
			isOptimistic: true
		};

		messages = [...messages, tempMessage];
		await scrollToBottom();
		sending = true;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('conversationId', conversation.id);
			formData.append('messageType', 'image');

			const response = await fetch('/api/product-messages/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const message = await response.json();
				// Replace optimistic message with real one
				messages = messages.map((m) => (m.id === tempMessage.id ? message : m));
				// Clean up the local URL
				URL.revokeObjectURL(localImageUrl);
			} else {
				// Remove optimistic message on error
				messages = messages.filter((m) => m.id !== tempMessage.id);
				URL.revokeObjectURL(localImageUrl);
				alert('이미지 업로드에 실패했습니다.');
			}
		} catch (error) {
			console.error('Failed to upload image:', error);
			// Remove optimistic message on error
			messages = messages.filter((m) => m.id !== tempMessage.id);
			URL.revokeObjectURL(localImageUrl);
			alert('이미지 업로드 중 오류가 발생했습니다.');
		} finally {
			sending = false;
			// Reset input
			input.value = '';
		}
	}

	// Handle file upload
	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file using fileValidator
		const validation = validateFile(file);
		if (!validation.isValid) {
			alert(validation.error);
			input.value = '';
			return;
		}

		// Additional check for PDF type
		if (file.type !== 'application/pdf') {
			alert('PDF 파일만 업로드 가능합니다.');
			input.value = '';
			return;
		}

		// Check 5MB limit
		if (file.size > 5 * 1024 * 1024) {
			alert('파일 크기는 5MB를 초과할 수 없습니다.');
			input.value = '';
			return;
		}

		// Create a local URL for the file to show immediately
		const localFileUrl = URL.createObjectURL(file);

		// Add optimistic message with loading state
		const tempMessage = {
			id: `temp-file-${Date.now()}`,
			senderId: currentUserId,
			content: null,
			messageType: 'file',
			metadata: {
				url: localFileUrl,
				filename: file.name,
				fileSize: file.size,
				fileType: file.type,
				isUploading: true
			},
			createdAt: new Date().toISOString(),
			sender: {
				id: currentUserId,
				name: data.session?.user?.name || 'Me',
				email: data.session?.user?.email || '',
				role: userRole,
				image: data.session?.user?.image || null
			},
			isOptimistic: true
		};

		messages = [...messages, tempMessage];
		await scrollToBottom();
		sending = true;

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('conversationId', conversation.id);
			formData.append('messageType', 'file');

			const response = await fetch('/api/product-messages/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const message = await response.json();
				// Replace optimistic message with real one
				messages = messages.map((m) => (m.id === tempMessage.id ? message : m));
				// Clean up the local URL
				URL.revokeObjectURL(localFileUrl);
			} else {
				// Remove optimistic message on error
				messages = messages.filter((m) => m.id !== tempMessage.id);
				URL.revokeObjectURL(localFileUrl);
				alert('파일 업로드에 실패했습니다.');
			}
		} catch (error) {
			console.error('Failed to upload file:', error);
			// Remove optimistic message on error
			messages = messages.filter((m) => m.id !== tempMessage.id);
			URL.revokeObjectURL(localFileUrl);
			alert('파일 업로드 중 오류가 발생했습니다.');
		} finally {
			sending = false;
			// Reset input
			input.value = '';
		}
	}

	// Poll for new messages
	async function pollMessages() {
		try {
			const response = await fetch(`/api/product-messages/${conversation.id}`);
			if (response.ok) {
				const newMessages = await response.json();
				if (newMessages.length > messages.length) {
					messages = newMessages;
					await scrollToBottom();
				}
			}
		} catch (error) {
			console.error('Failed to poll messages:', error);
		}
	}

	// Group messages by date
	function groupMessagesByDate(messages: any[]) {
		const groups: { date: string; messages: any[] }[] = [];
		let currentDate = '';

		messages.forEach((msg) => {
			const msgDate = formatDate(msg.createdAt);
			if (msgDate !== currentDate) {
				currentDate = msgDate;
				groups.push({ date: msgDate, messages: [msg] });
			} else {
				groups[groups.length - 1].messages.push(msg);
			}
		});

		return groups;
	}

	const messageGroups = $derived(groupMessagesByDate(messages));

	onMount(() => {
		scrollToBottom(false);
		// Start polling for new messages every 3 seconds
		pollingInterval = setInterval(pollMessages, 3000);
	});

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});
</script>

<div class="fixed inset-0 mx-auto flex max-w-md flex-col bg-white md:pt-8">
	<!-- Header -->
	<div class="safe-area-top bg-white">
		<div class="flex items-center justify-between px-4 py-4">
			<!-- Back Button -->
			<button
				onclick={() => goto('/chat')}
				class="flex items-center justify-center p-0"
				aria-label="Go back to chat list"
			>
				<img
					src={ArrowBack}
					alt="Back"
					class="h-6 w-6"
					style="filter: brightness(0) saturate(100%) invert(27%) sepia(90%) saturate(1574%) hue-rotate(196deg) brightness(94%) contrast(96%);"
				/>
			</button>

			<!-- Guide Name and Avatar -->
			<div class="flex flex-1 items-center justify-center">
				{#if otherUser}
					<div class="flex items-center gap-2">
						{#if otherUser.image}
							<img
								src={otherUser.image}
								alt={otherUser.name}
								class="h-8 w-8 rounded-full object-cover"
							/>
						{:else}
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
								<span class="text-sm font-medium text-gray-600">
									{otherUser.name?.charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
						<span class="text-lg font-semibold text-gray-900">{otherUser.name || 'Guide'}</span>
					</div>
				{/if}
			</div>

			<!-- More Options Button -->
			<button class="flex items-center justify-center p-0">
				<MoreHorizontal class="h-6 w-6 text-gray-400" />
			</button>
		</div>
	</div>

	<!-- Product Info Card -->
	<div class="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
		<div class="px-4 py-3">
			<div class="flex items-center gap-3">
				<div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
					{#if product.imageUrl}
						<img src={product.imageUrl} alt={product.title} class="h-full w-full object-cover" />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<Package class="h-5 w-5 text-gray-400" />
						</div>
					{/if}
				</div>
				<div class="flex-1">
					<h2 class="text-primary text-sm font-semibold">{product.title}</h2>
					<p class="text-secondary text-xs">
						{product.destination?.city || '독일'}
						{#if product.displayId}
							· {product.displayId}
						{/if}
					</p>
				</div>
				<button
					onclick={() => goto(`/products?productId=${product.id}`)}
					class="rounded border border-green-500 bg-green-500 px-2 py-0.5"
				>
					<span class="text-[11px] leading-4 font-medium text-white">문의중</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Messages Container -->
	<div bind:this={messagesContainer} class="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
		{#each messageGroups as group}
			<!-- Date Separator -->
			<div class="my-4 flex items-center">
				<div class="flex-1 border-t border-gray-200"></div>
				<span class="px-3 text-xs text-gray-500">{group.date}</span>
				<div class="flex-1 border-t border-gray-200"></div>
			</div>

			<!-- Messages -->
			{#each group.messages as message}
				<div
					class="mb-4 flex {message.senderId === currentUserId
						? 'justify-end'
						: 'justify-start'} {message.isOptimistic ? 'opacity-70' : ''}"
				>
					<div class="max-w-[70%]">
						{#if message.senderId !== currentUserId && message.sender?.name && message.messageType !== 'system'}
							<p class="mb-1 px-1 text-xs text-gray-600">{message.sender.name}</p>
						{/if}
						{#if message.messageType === 'text'}
							<div
								class="{message.senderId === currentUserId
									? 'bg-blue-500 text-white'
									: 'bg-gray-100'} rounded-2xl px-4 py-2"
							>
								<p class="text-sm">
									{#each parseMarkdownLink(message.content) as part}
										{#if part.type === 'text'}
											{part.content}
										{:else if part.type === 'link'}
											<a 
												href={part.url} 
												class="{message.senderId === currentUserId ? 'text-white underline font-semibold' : 'text-blue-500 underline hover:text-blue-600'}"
												target={part.url.startsWith('/') ? '_self' : '_blank'}
												rel={part.url.startsWith('/') ? '' : 'noopener noreferrer'}
											>
												{part.text}
											</a>
										{/if}
									{/each}
								</p>
							</div>
						{:else if message.messageType === 'cancellation_request'}
							<div
								class="max-w-[300px] overflow-hidden rounded-lg border-2 border-blue-500 bg-white"
							>
								<div class="border-b border-dashed border-blue-300 px-4 py-3">
									<p class="text-center font-semibold text-gray-900">취소 요청</p>
								</div>
								<div class="border-b border-dashed border-blue-300 px-4 py-3">
									<p class="text-center text-gray-700">
										{message.metadata?.reason || '고객이 결제 취소를 요청하였습니다.'}
									</p>
								</div>
								<div class="px-4 py-3">
									{#if message.metadata?.status === 'accepted'}
										<p class="text-center font-medium text-green-600">✓ 취소가 승인되었습니다</p>
									{:else if message.metadata?.status === 'declined'}
										<p class="text-center font-medium text-red-600">✗ 취소가 거절되었습니다</p>
									{:else if userRole === 'traveler'}
										<button
											type="button"
											onclick={() => handleCancelRequestClick(message)}
											class="w-full rounded bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700"
										>
											확인하기
										</button>
									{:else}
										<p class="text-center text-sm text-gray-500">고객의 응답을 기다리고 있습니다</p>
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
										? '결제 취소가 승인되었습니다.'
										: '취소 요청이 거절되었습니다.'}
								</p>
							</div>
						{:else if message.messageType === 'offer'}
							<OfferMessage
								{message}
								{currentUserId}
								{userRole}
								{product}
								guide={otherUser}
								productOfferId={message.productOfferId}
								conversationId={conversation?.id}
							/>
						{:else if message.messageType === 'image'}
							<ImageMessage {message} {currentUserId} />
						{:else if message.messageType === 'file'}
							<FileMessage {message} {currentUserId} />
						{:else if message.messageType === 'system'}
							<!-- System Message -->
							<div class="flex justify-center">
								<div class="rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-600">
									{#each parseMarkdownLink(message.content) as part}
										{#if part.type === 'text'}
											{part.content}
										{:else if part.type === 'link'}
											<a href={part.url} class="text-blue-500 underline hover:text-blue-600">
												{part.text}
											</a>
										{/if}
									{/each}
								</div>
							</div>
						{/if}
						<p class="mt-1 text-xs text-gray-500">
							{formatTime(message.createdAt)}
							{#if message.isOptimistic}
								<span class="ml-1">전송중...</span>
							{/if}
						</p>
					</div>
				</div>
			{/each}
		{/each}
	</div>

	<!-- Input Area -->
	<div
		class="safe-area-bottom rounded-t-[20px] border-t border-gray-100 bg-[#fefefe]/95 shadow-[0px_-5px_20px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm"
	>
		{#if userRole === 'guide' && showOptions}
			<!-- Guide Toolbar (shows when + is clicked) -->
			<div class="flex items-center justify-around border-b border-gray-100 py-3">
				<button
					onclick={() => {
						showOfferModal = true;
						showOptions = false;
					}}
					class="flex flex-col items-center gap-1 p-2"
					disabled={sending}
				>
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2">
						<img src={MoneyIcon} alt="제안하기" class="h-6 w-6" />
					</div>
					<span class="text-[10px] text-gray-600">제안하기</span>
				</button>

				<label class="flex cursor-pointer flex-col items-center gap-1 p-2">
					<input
						type="file"
						accept=".jpg,.jpeg,.png"
						class="hidden"
						onchange={(e) => {
							handleImageUpload(e);
							showOptions = false;
						}}
						disabled={sending}
					/>
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2">
						<img src={AlbumIcon} alt="앨범" class="h-6 w-6" />
					</div>
					<span class="text-[10px] text-gray-600">앨범</span>
				</label>

				<label class="flex cursor-pointer flex-col items-center gap-1 p-2">
					<input
						type="file"
						accept=".pdf,.docx,.pptx,.xlsx"
						class="hidden"
						onchange={(e) => {
							handleFileUpload(e);
							showOptions = false;
						}}
						disabled={sending}
					/>
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 p-2">
						<img src={FileIcon} alt="파일" class="h-6 w-6" />
					</div>
					<span class="text-[10px] text-gray-600">파일</span>
				</label>
			</div>
		{/if}

		<!-- Message Input -->
		<div class="px-4 py-2">
			<form onsubmit={sendMessage} class="flex items-center gap-3">
				{#if userRole === 'guide'}
					<button
						type="button"
						onclick={() => (showOptions = !showOptions)}
						class="flex items-center justify-center transition-all {showOptions ? 'rotate-45' : ''}"
					>
						<Plus class="h-6 w-6" style="color: #1095f4;" />
					</button>
				{/if}
				<div class="flex-1">
					<input
						type="text"
						bind:value={newMessage}
						placeholder="메시지를 입력하세요"
						disabled={sending}
						class="text-primary placeholder:text-primary/60 w-full bg-transparent text-base leading-6 outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={!newMessage.trim() || sending}
					class="flex h-9 w-9 items-center justify-center rounded-full p-1 transition-opacity disabled:opacity-50"
					style="background-color: #1095f4;"
				>
					<Send class="h-5 w-5 text-white" />
				</button>
			</form>
		</div>
	</div>
</div>

<!-- Offer Modal -->
{#if showOfferModal}
	<OfferModal onClose={() => (showOfferModal = false)} onSubmit={handleOfferSubmit} {sending} />
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
					거절
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

<style>
	/* Handle safe areas for devices with notches/home indicators */
	.safe-area-top {
		padding-top: env(safe-area-inset-top);
	}
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
