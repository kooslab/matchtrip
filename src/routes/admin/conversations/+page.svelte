<script lang="ts">
	import type { PageData } from './$types';
	import { 
		MessageSquare, 
		Calendar, 
		Users, 
		MapPin, 
		DollarSign,
		Clock,
		CheckCircle,
		Eye,
		Trash2,
		Filter,
		Download,
		MessageCircle,
		Mail,
		Activity,
		FileText,
		Search
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let activityFilter = $state('all');
	let sortBy = $state('recent');

	function formatDate(date: string | Date | null) {
		if (!date) return '없음';
		const d = new Date(date);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);

		if (hours < 1) {
			const minutes = Math.floor(diff / (1000 * 60));
			return `${minutes}분 전`;
		} else if (hours < 24) {
			return `${hours}시간 전`;
		} else if (days < 7) {
			return `${days}일 전`;
		} else {
			return d.toLocaleDateString('ko-KR', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		}
	}

	function formatCurrency(amount: number | string) {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW'
		}).format(num);
	}

	function getOfferStatusBadge(status: string) {
		const badges = {
			pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기중' },
			accepted: { bg: 'bg-green-100', text: 'text-green-800', label: '수락됨' },
			rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '거절됨' },
			cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: '취소됨' }
		};
		return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
	}

	function truncateMessage(message: string | null, maxLength: number = 50) {
		if (!message) return '메시지 없음';
		if (message.length <= maxLength) return message;
		return message.substring(0, maxLength) + '...';
	}

	let filteredConversations = $derived(data.conversations
		.filter(conversation => {
			// Activity filter
			if (activityFilter === 'active' && conversation.totalMessages === 0) return false;
			if (activityFilter === 'inactive' && conversation.totalMessages > 0) return false;
			if (activityFilter === 'unread' && conversation.unreadCount === 0) return false;
			
			// Status filter (offer status)
			if (statusFilter !== 'all' && conversation.offerStatus !== statusFilter) return false;
			
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					conversation.tripDestination?.toLowerCase().includes(query) ||
					conversation.travelerName?.toLowerCase().includes(query) ||
					conversation.travelerEmail?.toLowerCase().includes(query) ||
					conversation.guideName?.toLowerCase().includes(query) ||
					conversation.guideEmail?.toLowerCase().includes(query) ||
					conversation.lastMessage?.toLowerCase().includes(query)
				);
			}
			return true;
		})
		.sort((a, b) => {
			if (sortBy === 'recent') {
				const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
				const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
				return dateB - dateA;
			} else if (sortBy === 'oldest') {
				const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
				const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
				return dateA - dateB;
			} else if (sortBy === 'messages') {
				return (b.totalMessages || 0) - (a.totalMessages || 0);
			} else if (sortBy === 'unread') {
				return (b.unreadCount || 0) - (a.unreadCount || 0);
			}
			return 0;
		}));

	async function handleDelete(conversationId: string) {
		if (!confirm('정말로 이 대화를 삭제하시겠습니까? 모든 메시지가 삭제됩니다.')) return;
		
		try {
			const response = await fetch(`/api/admin/conversations/${conversationId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				window.location.reload();
			} else {
				alert('삭제 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error deleting conversation:', error);
			alert('삭제 중 오류가 발생했습니다.');
		}
	}

	async function exportData() {
		try {
			const response = await fetch('/api/admin/conversations/export');
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error exporting data:', error);
			alert('데이터 내보내기 중 오류가 발생했습니다.');
		}
	}
</script>

<div class="p-8 overflow-auto h-full">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">대화 관리</h1>
		<p class="mt-2 text-gray-600">여행자와 가이드 간의 모든 대화를 모니터링합니다</p>
	</div>

	<!-- Statistics Cards -->
	<div class="grid gap-4 md:grid-cols-7 mb-8">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">전체 대화</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.total}</p>
				</div>
				<MessageSquare class="h-10 w-10 text-blue-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">활성 대화</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.active}</p>
				</div>
				<MessageCircle class="h-10 w-10 text-green-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">비활성</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.inactive}</p>
				</div>
				<Clock class="h-10 w-10 text-gray-400" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">읽지 않음</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.withUnread}</p>
					<p class="text-xs text-gray-500 mt-1">총 {data.stats.totalUnread}개</p>
				</div>
				<Mail class="h-10 w-10 text-yellow-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">최근 활동</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.recentlyActive}</p>
					<p class="text-xs text-gray-500 mt-1">24시간 내</p>
				</div>
				<Activity class="h-10 w-10 text-purple-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow col-span-2">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">전체 메시지</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.totalMessages.toLocaleString()}개</p>
				</div>
				<FileText class="h-10 w-10 text-indigo-500" />
			</div>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 bg-white rounded-lg shadow p-4">
		<div class="flex flex-wrap gap-4 items-center">
			<div class="flex-1 min-w-[200px]">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
					<input
						type="text"
						placeholder="여행지, 참가자 또는 메시지 내용 검색..."
						bind:value={searchQuery}
						class="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none"
					/>
				</div>
			</div>
			
			<div class="flex items-center gap-2">
				<Filter class="h-5 w-5 text-gray-500" />
				<select
					bind:value={activityFilter}
					class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
				>
					<option value="all">모든 대화</option>
					<option value="active">활성 대화</option>
					<option value="inactive">비활성 대화</option>
					<option value="unread">읽지 않은 대화</option>
				</select>
			</div>

			<select
				bind:value={statusFilter}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="all">모든 제안 상태</option>
				<option value="pending">대기중</option>
				<option value="accepted">수락됨</option>
				<option value="rejected">거절됨</option>
				<option value="cancelled">취소됨</option>
			</select>

			<select
				bind:value={sortBy}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="recent">최근 활동순</option>
				<option value="oldest">오래된 활동순</option>
				<option value="messages">메시지 많은순</option>
				<option value="unread">읽지 않은순</option>
			</select>

			<button
				onclick={exportData}
				class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
			>
				<Download class="h-4 w-4" />
				내보내기
			</button>
		</div>
	</div>

	<!-- Conversations List -->
	<div class="bg-white rounded-lg shadow overflow-hidden">
		<div class="divide-y divide-gray-200">
			{#each filteredConversations as conversation}
				{@const badge = conversation.offerStatus ? getOfferStatusBadge(conversation.offerStatus) : null}
				<div class="p-6 hover:bg-gray-50 transition-colors">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-start gap-6">
								<!-- Participants -->
								<div class="flex-1">
									<h3 class="text-sm font-semibold text-gray-900 mb-2">참가자</h3>
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<Users class="h-4 w-4 text-gray-400" />
											<div>
												<span class="text-sm font-medium text-gray-900">여행자:</span>
												<span class="text-sm text-gray-600 ml-1">
													{conversation.travelerName || '이름 없음'}
												</span>
												<span class="text-xs text-gray-500 ml-1">
													({conversation.travelerEmail})
												</span>
											</div>
										</div>
										<div class="flex items-center gap-2">
											<Users class="h-4 w-4 text-gray-400" />
											<div>
												<span class="text-sm font-medium text-gray-900">가이드:</span>
												<span class="text-sm text-gray-600 ml-1">
													{conversation.guideName || '이름 없음'}
												</span>
												<span class="text-xs text-gray-500 ml-1">
													({conversation.guideEmail})
												</span>
											</div>
										</div>
									</div>
								</div>

								<!-- Trip Info -->
								<div class="flex-1">
									<h3 class="text-sm font-semibold text-gray-900 mb-2">여행 정보</h3>
									<div class="space-y-1">
										<div class="flex items-center gap-2">
											<MapPin class="h-4 w-4 text-gray-400" />
											<span class="text-sm text-gray-600">
												{conversation.tripDestination || '미지정'}
											</span>
										</div>
										{#if conversation.tripStartDate}
											<div class="flex items-center gap-2">
												<Calendar class="h-4 w-4 text-gray-400" />
												<span class="text-sm text-gray-600">
													{new Date(conversation.tripStartDate).toLocaleDateString('ko-KR')}
												</span>
											</div>
										{/if}
										{#if conversation.offerPrice}
											<div class="flex items-center gap-2">
												<DollarSign class="h-4 w-4 text-gray-400" />
												<span class="text-sm text-gray-600">
													{formatCurrency(conversation.offerPrice)}
												</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Message Info -->
								<div class="flex-1">
									<h3 class="text-sm font-semibold text-gray-900 mb-2">대화 상태</h3>
									<div class="space-y-2">
										<div class="flex items-center gap-2">
											<MessageCircle class="h-4 w-4 text-gray-400" />
											<span class="text-sm text-gray-600">
												총 {conversation.totalMessages || 0}개 메시지
											</span>
										</div>
										{#if conversation.unreadCount > 0}
											<div class="flex items-center gap-2">
												<Mail class="h-4 w-4 text-yellow-500" />
												<span class="text-sm font-medium text-yellow-600">
													{conversation.unreadCount}개 읽지 않음
												</span>
											</div>
										{/if}
										<div class="text-sm text-gray-500">
											마지막 활동: {formatDate(conversation.lastMessageAt)}
										</div>
									</div>
								</div>
							</div>

							<!-- Last Message Preview -->
							{#if conversation.lastMessage}
								<div class="mt-4 p-3 bg-gray-50 rounded-lg">
									<p class="text-sm text-gray-600 italic">
										"{truncateMessage(conversation.lastMessage)}"
									</p>
								</div>
							{/if}
						</div>

						<!-- Actions and Status -->
						<div class="ml-6 flex flex-col items-end gap-3">
							{#if badge}
								<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {badge.bg} {badge.text}">
									{badge.label}
								</span>
							{/if}
							
							<div class="flex items-center gap-2">
								<a
									href="/admin/conversations/{conversation.id}"
									class="flex items-center gap-1 text-blue-600 hover:text-blue-900"
									title="대화 보기"
								>
									<Eye class="h-4 w-4" />
									<span class="text-sm">보기</span>
								</a>
								<button
									onclick={() => handleDelete(conversation.id)}
									class="flex items-center gap-1 text-red-600 hover:text-red-900"
									title="삭제"
								>
									<Trash2 class="h-4 w-4" />
									<span class="text-sm">삭제</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="px-6 py-12 text-center">
					<MessageSquare class="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500">
						{searchQuery || activityFilter !== 'all' || statusFilter !== 'all' 
							? '검색 결과가 없습니다.' 
							: '등록된 대화가 없습니다.'}
					</p>
				</div>
			{/each}
		</div>
	</div>
</div>