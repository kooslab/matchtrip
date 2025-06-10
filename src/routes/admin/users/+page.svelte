<script lang="ts">
	import type { PageData } from './$types';
	import { Search, User, Shield, Phone, Mail, Calendar, Check, X, FileText, Image, Download } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'travelers' | 'guides' | 'admins'>('travelers');
	let searchQuery = $state('');
	let showDetailModal = $state(false);
	let selectedUser = $state<any>(null);

	// Filter users based on search query
	const filteredTravelers = $derived(
		(data?.travelers || []).filter(user => 
			user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.profile?.phone?.includes(searchQuery)
		)
	);

	const filteredGuides = $derived(
		(data?.guides || []).filter(user => 
			user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.profile?.phone?.includes(searchQuery)
		)
	);

	const filteredAdmins = $derived(
		(data?.admins || []).filter(user => 
			user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function openDetailModal(user: any) {
		selectedUser = user;
		showDetailModal = true;
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatPhone(phone: string | null) {
		if (!phone) return '-';
		// Format Korean phone number
		if (phone.length === 11) {
			return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
		}
		return phone;
	}

	function getFileTypeInfo(uploadType: string, fileType: string) {
		const typeLabels: Record<string, string> = {
			'profile': '프로필 사진',
			'id': '신분증',
			'guide': '가이드 자격증',
			'driver': '운전면허증',
			'insurance': '자동차 보험증'
		};

		const isImage = fileType.startsWith('image/');
		return {
			label: typeLabels[uploadType] || uploadType,
			icon: isImage ? Image : FileText,
			isImage
		};
	}

	let changingRole = $state(false);
	let changingVerification = $state(false);
	let downloadingFileId = $state<string | null>(null);

	async function makeAdmin(userId: string) {
		if (!confirm('이 사용자를 관리자로 지정하시겠습니까?')) return;
		
		changingRole = true;
		try {
			const response = await fetch('/api/users/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, role: 'admin' })
			});

			if (!response.ok) throw new Error('Failed to update role');
			
			// Move user from guides to admins
			const guideIndex = data.guides.findIndex(g => g.id === userId);
			if (guideIndex !== -1) {
				const user = data.guides[guideIndex];
				user.role = 'admin';
				data.guides.splice(guideIndex, 1);
				data.admins.push(user);
				
				// Force reactivity
				data = { ...data };
				
				// Close modal if this user was selected
				if (selectedUser && selectedUser.id === userId) {
					showDetailModal = false;
				}
			}
		} catch (error) {
			alert('역할 변경에 실패했습니다.');
		} finally {
			changingRole = false;
		}
	}

	async function removeAdmin(userId: string) {
		if (!confirm('이 관리자의 권한을 제거하시겠습니까? 가이드로 변경됩니다.')) return;
		
		changingRole = true;
		try {
			const response = await fetch('/api/users/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, role: 'guide' })
			});

			if (!response.ok) throw new Error('Failed to update role');
			
			// Move user from admins to guides
			const adminIndex = data.admins.findIndex(a => a.id === userId);
			if (adminIndex !== -1) {
				const user = data.admins[adminIndex];
				user.role = 'guide';
				data.admins.splice(adminIndex, 1);
				data.guides.push(user);
				
				// Switch to guides tab
				activeTab = 'guides';
				
				// Force reactivity
				data = { ...data };
			}
		} catch (error) {
			alert('역할 변경에 실패했습니다.');
		} finally {
			changingRole = false;
		}
	}

	async function toggleVerification(userId: string, currentStatus: boolean) {
		const action = currentStatus ? '인증을 취소' : '인증';
		if (!confirm(`이 가이드를 ${action}하시겠습니까?`)) return;
		
		changingVerification = true;
		try {
			const response = await fetch('/api/users/verify', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, isVerified: !currentStatus })
			});

			if (!response.ok) throw new Error('Failed to update verification');
			
			// Update the local data instead of reloading
			const newStatus = !currentStatus;
			
			// Update in guides array
			const guideIndex = data.guides.findIndex(g => g.id === userId);
			if (guideIndex !== -1 && data.guides[guideIndex].profile) {
				data.guides[guideIndex].profile.isVerified = newStatus;
				data.guides[guideIndex].profile.verifiedAt = newStatus ? new Date() : null;
			}
			
			// Update selectedUser if modal is open
			if (selectedUser && selectedUser.id === userId && selectedUser.profile) {
				selectedUser.profile.isVerified = newStatus;
				selectedUser.profile.verifiedAt = newStatus ? new Date() : null;
			}
			
			// Force reactivity
			data = { ...data };
			if (selectedUser) {
				selectedUser = { ...selectedUser };
			}
		} catch (error) {
			alert('인증 상태 변경에 실패했습니다.');
		} finally {
			changingVerification = false;
		}
	}

	async function downloadFile(e: MouseEvent, fileId: string, originalName: string) {
		e.preventDefault();
		downloadingFileId = fileId;
		
		try {
			// Simply open the download URL in a new window
			// The server will redirect to a presigned URL
			window.open(`/api/admin/download?fileId=${fileId}`, '_blank');
			
			// Wait a bit before removing the loading state
			setTimeout(() => {
				downloadingFileId = null;
			}, 1000);
		} catch (error) {
			console.error('Download error:', error);
			alert('파일 다운로드에 실패했습니다.');
			downloadingFileId = null;
		}
	}
</script>

<div class="p-8 h-full flex flex-col">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">사용자 관리</h1>
		<p class="mt-2 text-gray-600">플랫폼에 등록된 사용자를 관리합니다</p>
	</div>

	<!-- Stats -->
	<div class="mb-6 grid gap-4 md:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">전체 사용자</p>
					<p class="text-2xl font-bold text-gray-900">{data.totalUsers || 0}명</p>
				</div>
				<User class="h-10 w-10 text-blue-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">여행자</p>
					<p class="text-2xl font-bold text-gray-900">{(data?.travelers || []).length}명</p>
				</div>
				<User class="h-10 w-10 text-green-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">가이드</p>
					<p class="text-2xl font-bold text-gray-900">{(data?.guides || []).length}명</p>
				</div>
				<Shield class="h-10 w-10 text-purple-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">관리자</p>
					<p class="text-2xl font-bold text-gray-900">{(data?.admins || []).length}명</p>
				</div>
				<Shield class="h-10 w-10 text-red-500" />
			</div>
		</div>
	</div>

	<!-- Search and Tabs -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow">
		<div class="mb-4">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="이름, 이메일 또는 전화번호로 검색..."
					class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-pink-500 focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex gap-2">
			<button
				onclick={() => (activeTab = 'travelers')}
				class="flex-1 rounded-lg px-4 py-2 text-center font-medium transition-colors {activeTab === 'travelers'
					? 'bg-pink-500 text-white'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				여행자
			</button>
			<button
				onclick={() => (activeTab = 'guides')}
				class="flex-1 rounded-lg px-4 py-2 text-center font-medium transition-colors {activeTab === 'guides'
					? 'bg-pink-500 text-white'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				가이드
			</button>
			<button
				onclick={() => (activeTab = 'admins')}
				class="flex-1 rounded-lg px-4 py-2 text-center font-medium transition-colors {activeTab === 'admins'
					? 'bg-pink-500 text-white'
					: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
			>
				관리자
			</button>
		</div>
	</div>

	<!-- Users Table -->
	<div class="flex-1 flex flex-col overflow-hidden rounded-lg bg-white shadow">
		<div class="flex-1 overflow-auto">
			{#if activeTab === 'travelers'}
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50 sticky top-0 z-10">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이름
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이메일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								전화번호
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								가입일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								상태
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredTravelers as traveler}
							<tr 
								class="hover:bg-gray-50 cursor-pointer transition-colors"
								onclick={() => openDetailModal(traveler)}
							>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
												<User class="h-5 w-5 text-gray-600" />
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{traveler.name || '이름 없음'}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{traveler.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{formatPhone(traveler.profile?.phone)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(traveler.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
										활성
									</span>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="px-6 py-12 text-center">
									<p class="text-gray-500">등록된 여행자가 없습니다.</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if activeTab === 'guides'}
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50 sticky top-0 z-10">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이름
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이메일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								전화번호
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								가입일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								인증 상태
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								작업
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredGuides as guide}
							<tr 
								class="hover:bg-gray-50 cursor-pointer transition-colors"
								onclick={() => openDetailModal(guide)}
							>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											<div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
												<Shield class="h-5 w-5 text-purple-600" />
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{guide.name || '이름 없음'}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{guide.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{formatPhone(guide.profile?.phone)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(guide.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if guide.profile?.isVerified}
										<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
											<Check class="h-3 w-3" />
											인증됨
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
											<X class="h-3 w-3" />
											미인증
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div class="flex gap-2">
										<button
											onclick={() => toggleVerification(guide.id, guide.profile?.isVerified || false)}
											disabled={changingVerification}
											class="{guide.profile?.isVerified ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50"
										>
											{guide.profile?.isVerified ? '인증 취소' : '인증하기'}
										</button>
										<button
											onclick={() => makeAdmin(guide.id)}
											disabled={changingRole}
											class="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
										>
											관리자로 지정
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-6 py-12 text-center">
									<p class="text-gray-500">등록된 가이드가 없습니다.</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else if activeTab === 'admins'}
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50 sticky top-0 z-10">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이름
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								이메일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								가입일
							</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
								작업
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredAdmins as admin}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											<div class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
												<Shield class="h-5 w-5 text-red-600" />
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">
												{admin.name || '이름 없음'}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">{admin.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(admin.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button
										onclick={() => removeAdmin(admin.id)}
										disabled={changingRole}
										class="text-red-600 hover:text-red-900 disabled:opacity-50"
									>
										관리자 권한 제거
									</button>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-6 py-12 text-center">
									<p class="text-gray-500">등록된 관리자가 없습니다.</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>

<!-- User Detail Modal -->
{#if showDetailModal && selectedUser}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (showDetailModal = false)}
	>
		<div 
			class="w-full max-w-2xl rounded-lg bg-white overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="bg-gray-50 px-6 py-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">사용자 상세 정보</h2>
				<button
					onclick={() => (showDetailModal = false)}
					class="rounded-lg p-2 hover:bg-gray-200"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- User Info -->
				<div class="mb-6 flex items-center gap-4">
					<div class="h-20 w-20 rounded-full flex items-center justify-center {selectedUser.role === 'admin' ? 'bg-red-100' : selectedUser.role === 'guide' ? 'bg-purple-100' : 'bg-gray-300'}">
						{#if selectedUser.role === 'admin'}
							<Shield class="h-10 w-10 text-red-600" />
						{:else if selectedUser.role === 'guide'}
							<Shield class="h-10 w-10 text-purple-600" />
						{:else}
							<User class="h-10 w-10 text-gray-600" />
						{/if}
					</div>
					<div>
						<h3 class="text-2xl font-bold text-gray-900">
							{selectedUser.name || '이름 없음'}
						</h3>
						<p class="text-gray-600">
							{selectedUser.role === 'admin' ? '관리자' : selectedUser.role === 'guide' ? '가이드' : '여행자'}
						</p>
					</div>
				</div>

				<!-- Details Grid -->
				<div class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="rounded-lg border p-4">
							<div class="flex items-center gap-2 mb-1">
								<Mail class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-500">이메일</span>
							</div>
							<p class="text-gray-900">{selectedUser.email}</p>
						</div>

						<div class="rounded-lg border p-4">
							<div class="flex items-center gap-2 mb-1">
								<Phone class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-500">전화번호</span>
							</div>
							<p class="text-gray-900">
								{formatPhone(selectedUser.profile?.phone) || '-'}
							</p>
						</div>

						<div class="rounded-lg border p-4">
							<div class="flex items-center gap-2 mb-1">
								<Calendar class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-500">가입일</span>
							</div>
							<p class="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
						</div>

						<div class="rounded-lg border p-4">
							<div class="flex items-center gap-2 mb-1">
								<Shield class="h-4 w-4 text-gray-400" />
								<span class="text-sm text-gray-500">상태</span>
							</div>
							<p class="text-gray-900">
								{#if selectedUser.role === 'guide'}
									{selectedUser.profile?.isVerified ? '인증됨' : '미인증'}
								{:else}
									활성
								{/if}
							</p>
						</div>
					</div>

					{#if selectedUser.role === 'guide' && selectedUser.profile}
						<div class="border-t pt-4">
							<h4 class="font-medium text-gray-900 mb-3">가이드 프로필 정보</h4>
							<div class="space-y-3">
								{#if selectedUser.profile.introduction}
									<div>
										<p class="text-sm text-gray-500 mb-1">자기소개</p>
										<p class="text-gray-900">{selectedUser.profile.introduction}</p>
									</div>
								{/if}
								{#if selectedUser.profile.languages}
									<div>
										<p class="text-sm text-gray-500 mb-1">가능한 언어</p>
										<p class="text-gray-900">{Array.isArray(selectedUser.profile.languages) ? selectedUser.profile.languages.join(', ') : selectedUser.profile.languages}</p>
									</div>
								{/if}
								{#if selectedUser.profile.guideAreas}
									<div>
										<p class="text-sm text-gray-500 mb-1">가이드 지역</p>
										<p class="text-gray-900">{selectedUser.profile.guideAreas}</p>
									</div>
								{/if}
								{#if selectedUser.profile.experience}
									<div>
										<p class="text-sm text-gray-500 mb-1">경력</p>
										<p class="text-gray-900">{selectedUser.profile.experience}</p>
									</div>
								{/if}
							</div>
							
							<!-- Uploaded Files -->
							{#if selectedUser.uploads && selectedUser.uploads.length > 0}
								<div class="border-t pt-4 mt-4">
									<h4 class="font-medium text-gray-900 mb-3">업로드된 파일</h4>
									<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
										{#each selectedUser.uploads as upload}
											{@const fileInfo = getFileTypeInfo(upload.uploadType, upload.fileType)}
											<button
												onclick={(e) => downloadFile(e, upload.id, upload.originalName)}
												disabled={downloadingFileId === upload.id}
												class="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{#if downloadingFileId === upload.id}
													<div class="h-10 w-10 flex items-center justify-center">
														<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
													</div>
												{:else}
													<svelte:component this={fileInfo.icon} class="h-10 w-10 text-gray-400 group-hover:text-gray-600 mb-2" />
												{/if}
												<span class="text-xs text-gray-600 text-center">{fileInfo.label}</span>
												<span class="text-xs text-gray-400 mt-1">{upload.originalName}</span>
												{#if downloadingFileId !== upload.id}
													<Download class="h-4 w-4 text-gray-400 group-hover:text-gray-600 mt-2" />
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="mt-6 flex gap-3">
					{#if selectedUser.role === 'guide'}
						<button
							onclick={() => {
								showDetailModal = false;
								toggleVerification(selectedUser.id, selectedUser.profile?.isVerified || false);
							}}
							disabled={changingVerification}
							class="flex-1 rounded-lg px-4 py-2 text-white disabled:opacity-50 {selectedUser.profile?.isVerified ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}"
						>
							{selectedUser.profile?.isVerified ? '인증 취소' : '인증하기'}
						</button>
						<button
							onclick={() => {
								showDetailModal = false;
								makeAdmin(selectedUser.id);
							}}
							disabled={changingRole}
							class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
						>
							관리자로 지정
						</button>
					{:else if selectedUser.role === 'admin'}
						<button
							onclick={() => {
								showDetailModal = false;
								removeAdmin(selectedUser.id);
							}}
							disabled={changingRole}
							class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
						>
							관리자 권한 제거
						</button>
					{/if}
					<button
						onclick={() => (showDetailModal = false)}
						class="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50"
					>
						닫기
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}