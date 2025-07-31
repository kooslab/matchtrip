<script lang="ts">
	import { tick } from 'svelte';
	import IconSend from '$lib/icons/IconSend.svelte';
	import IconAi from '$lib/icons/IconAi.svelte';

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}

	let { placeholder = '여행 일정에 대해 물어보세요...', className = '' } = $props<{
		placeholder?: string;
		className?: string;
	}>();

	let messages = $state<Message[]>([]);
	let inputValue = $state('');
	let isLoading = $state(false);
	let messagesContainer: HTMLDivElement;

	async function sendMessage() {
		if (!inputValue.trim() || isLoading) return;

		const userMessage = inputValue.trim();
		inputValue = '';

		// Add user message
		messages = [
			...messages,
			{
				role: 'user',
				content: userMessage,
				timestamp: new Date()
			}
		];

		isLoading = true;
		await scrollToBottom();

		try {
			const response = await fetch('/api/ai-assistant/itinerary', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: userMessage,
					conversationHistory: messages.slice(-10).map((m) => ({
						role: m.role,
						content: m.content
					}))
				})
			});

			const data = await response.json();

			if (response.ok) {
				messages = [
					...messages,
					{
						role: 'assistant',
						content: data.response,
						timestamp: new Date()
					}
				];
			} else {
				messages = [
					...messages,
					{
						role: 'assistant',
						content: '죄송합니다. 일정 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
						timestamp: new Date()
					}
				];
			}
		} catch (error) {
			messages = [
				...messages,
				{
					role: 'assistant',
					content: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
					timestamp: new Date()
				}
			];
		} finally {
			isLoading = false;
			await scrollToBottom();
		}
	}

	async function scrollToBottom() {
		await tick();
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="flex h-full flex-col {className}">
	<div class="border-gray-e1 border-b bg-white p-4">
		<div class="flex items-center gap-2">
			<IconAi class="text-color-primary h-6 w-6" />
			<h3 class="text-primary font-semibold">AI 여행 도우미</h3>
		</div>
		<p class="text-body-small text-secondary mt-1">
			원하는 여행 일정을 물어보세요. AI가 맞춤형 일정을 제안해드립니다.
		</p>
	</div>

	<div bind:this={messagesContainer} class="bg-gray-f7 flex-1 space-y-4 overflow-y-auto p-4">
		{#if messages.length === 0}
			<div class="text-secondary py-8 text-center">
				<p class="text-body-medium mb-4">여행 일정에 대해 궁금한 점을 물어보세요!</p>
				<div class="text-body-small space-y-2">
					<p>예시: "베를린 하루 일정 추천해줘"</p>
					<p>예시: "파리에서 맛집 포함한 일정 짜줘"</p>
				</div>
			</div>
		{/if}

		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div class="max-w-[80%] {message.role === 'user' ? 'order-2' : 'order-1'}">
					<div
						class="{message.role === 'user'
							? 'bg-color-primary text-white'
							: 'border-gray-e1 border bg-white'} 
						rounded-lg p-3 shadow-sm"
					>
						<p class="text-body-medium whitespace-pre-wrap">
							{message.content}
						</p>
					</div>
					<p
						class="text-body-xsmall text-secondary mt-1 {message.role === 'user'
							? 'text-right'
							: 'text-left'}"
					>
						{message.timestamp.toLocaleTimeString('ko-KR', {
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				</div>
			</div>
		{/each}

		{#if isLoading}
			<div class="flex justify-start">
				<div class="border-gray-e1 rounded-lg border bg-white p-3 shadow-sm">
					<div class="flex gap-1">
						<span class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></span>
						<span class="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="border-gray-e1 border-t bg-white p-4">
		<div class="flex gap-2">
			<input
				bind:value={inputValue}
				onkeydown={handleKeydown}
				{placeholder}
				disabled={isLoading}
				class="border-gray-e1 focus:ring-color-primary text-body-medium flex-1 rounded-lg border
					px-4 py-2 focus:ring-2
					focus:outline-none disabled:cursor-not-allowed
					disabled:bg-gray-100"
			/>
			<button
				onclick={sendMessage}
				disabled={!inputValue.trim() || isLoading}
				class="bg-color-primary flex items-center justify-center rounded-lg
					px-4 py-2
					text-white transition-colors
					hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				<IconSend class="h-5 w-5" />
			</button>
		</div>
	</div>
</div>

<style>
	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-10px);
		}
	}

	.delay-100 {
		animation-delay: 0.1s;
	}

	.delay-200 {
		animation-delay: 0.2s;
	}
</style>
