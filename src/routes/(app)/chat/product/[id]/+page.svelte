<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { tick } from 'svelte';
	import { Send, ChevronLeft, MoreHorizontal, Package, Plus } from 'lucide-svelte';
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
	let messagesContainer: HTMLDivElement;
	let pollingInterval: ReturnType<typeof setInterval>;
	
	// Format price
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('ko-KR').format(price);
	};
	
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
				messages = messages.map(m => 
					m.id === tempMessage.id ? message : m
				);
			} else {
				// Remove optimistic message on error
				messages = messages.filter(m => m.id !== tempMessage.id);
				// Restore the message to input
				newMessage = messageContent;
			}
		} catch (error) {
			console.error('Failed to send message:', error);
			// Remove optimistic message on error
			messages = messages.filter(m => m.id !== tempMessage.id);
			// Restore the message to input
			newMessage = messageContent;
		} finally {
			sending = false;
		}
	}
	
	// Handle offer submission
	async function handleOfferSubmit(offerData: { price: number; duration: number }) {
		sending = true;
		showOfferModal = false;
		
		// Generate default message
		const offerMessage = `${offerData.duration}일 일정으로 ${offerData.price.toLocaleString('ko-KR')}원에 가이드 서비스를 제안드립니다.`;
		
		// Optimistic update - add offer message immediately
		const tempMessage = {
			id: `temp-${Date.now()}`,
			senderId: currentUserId,
			content: offerMessage,
			messageType: 'offer',
			metadata: {
				price: offerData.price,
				duration: offerData.duration
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
						duration: offerData.duration
					}
				})
			});
			
			if (response.ok) {
				const message = await response.json();
				// Replace optimistic message with real one
				messages = messages.map(m => 
					m.id === tempMessage.id ? message : m
				);
			} else {
				// Remove optimistic message on error
				messages = messages.filter(m => m.id !== tempMessage.id);
				showOfferModal = true; // Reopen modal on error
			}
		} catch (error) {
			console.error('Failed to send offer:', error);
			// Remove optimistic message on error
			messages = messages.filter(m => m.id !== tempMessage.id);
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
				messages = [...messages, message];
				await scrollToBottom();
			}
		} catch (error) {
			console.error('Failed to upload image:', error);
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
				messages = [...messages, message];
				await scrollToBottom();
			}
		} catch (error) {
			console.error('Failed to upload file:', error);
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
		
		messages.forEach(msg => {
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

<div class="fixed inset-0 flex flex-col bg-white">
	<!-- Header -->
	<div class="safe-area-top border-b border-gray-100 bg-white/95 backdrop-blur-sm">
		<div class="flex items-center justify-between px-4 py-2.5">
			<button onclick={() => goto('/chat')} class="h-5 w-5 p-0">
				<ChevronLeft class="h-5 w-5" style="color: #1095f4;" />
			</button>
			
			<div class="flex items-center gap-1">
				{#if otherUser.image}
					<img src={otherUser.image} alt={otherUser.name} class="h-7 w-7 rounded-full border border-gray-100 object-cover" />
				{:else}
					<div class="flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-[#003e8114]">
						<span class="text-primary text-xs font-medium">
							{otherUser.name.charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}
				<span class="text-primary text-base font-bold">{otherUser.name}</span>
			</div>
			
			<button class="h-5 w-5 p-0">
				<MoreHorizontal class="text-primary h-5 w-5" />
			</button>
		</div>
	</div>
	
	<!-- Product Info Card -->
	<div class="border-b border-gray-100 bg-white/95 backdrop-blur-sm">
		<div class="px-4 py-3">
			<div class="flex items-center gap-3">
				<div class="h-14 w-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
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
					<p class="text-secondary text-xs">{product.destination?.city || '독일'}</p>
				</div>
				<button 
					onclick={() => goto(`/products?productId=${product.id}`)}
					class="rounded border px-2 py-0.5 bg-green-500 border-green-500"
				>
					<span class="text-[11px] leading-4 font-medium text-white">문의중</span>
				</button>
			</div>
		</div>
	</div>
	
	<!-- Messages Container -->
	<div 
		bind:this={messagesContainer}
		class="flex-1 overflow-y-auto bg-gray-50 px-4 py-4"
	>
		{#each messageGroups as group}
			<!-- Date Separator -->
			<div class="my-4 flex items-center">
				<div class="flex-1 border-t border-gray-200"></div>
				<span class="px-3 text-xs text-gray-500">{group.date}</span>
				<div class="flex-1 border-t border-gray-200"></div>
			</div>
			
			<!-- Messages -->
			{#each group.messages as message}
				<div class="mb-4 flex {message.senderId === currentUserId ? 'justify-end' : 'justify-start'} {message.isOptimistic ? 'opacity-70' : ''}">
					<div class="max-w-[70%]">
						{#if message.messageType === 'text'}
							<div class="{message.senderId === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-2xl px-4 py-2">
								<p class="text-sm">{message.content}</p>
							</div>
						{:else if message.messageType === 'offer'}
							<OfferMessage 
								{message} 
								{currentUserId}
								{userRole}
								{product}
								guide={otherUser}
							/>
						{:else if message.messageType === 'image'}
							<ImageMessage 
								{message}
								{currentUserId}
							/>
						{:else if message.messageType === 'file'}
							<FileMessage 
								{message}
								{currentUserId}
							/>
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
	<div class="safe-area-bottom rounded-t-[20px] border-t border-gray-100 bg-[#fefefe]/95 shadow-[0px_-5px_20px_0px_rgba(0,0,0,0.02)] backdrop-blur-sm">
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
					<div class="h-10 w-10 rounded-full bg-gray-100 p-2 flex items-center justify-center">
						<img src={MoneyIcon} alt="제안하기" class="h-6 w-6" />
					</div>
					<span class="text-[10px] text-gray-600">제안하기</span>
				</button>
				
				<label class="flex flex-col items-center gap-1 p-2 cursor-pointer">
					<input
						type="file"
						accept="image/*"
						class="hidden"
						onchange={(e) => {
							handleImageUpload(e);
							showOptions = false;
						}}
						disabled={sending}
					/>
					<div class="h-10 w-10 rounded-full bg-gray-100 p-2 flex items-center justify-center">
						<img src={AlbumIcon} alt="앨범" class="h-6 w-6" />
					</div>
					<span class="text-[10px] text-gray-600">앨범</span>
				</label>
				
				<label class="flex flex-col items-center gap-1 p-2 cursor-pointer">
					<input
						type="file"
						accept="application/pdf"
						class="hidden"
						onchange={(e) => {
							handleFileUpload(e);
							showOptions = false;
						}}
						disabled={sending}
					/>
					<div class="h-10 w-10 rounded-full bg-gray-100 p-2 flex items-center justify-center">
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
						onclick={() => showOptions = !showOptions}
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
	<OfferModal 
		onClose={() => showOfferModal = false}
		onSubmit={handleOfferSubmit}
		{sending}
	/>
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