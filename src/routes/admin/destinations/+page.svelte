<script lang="ts">
	import type { PageData } from './$types';
	import { Plus, Upload, X, RefreshCw } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showDetailModal = $state(false);
	let selectedDestination = $state<any>(null);
	let uploadingImage = $state(false);
	let imagePreview = $state('');
	let selectedFile = $state<File | null>(null);
	let saving = $state(false);
	let uploadingFromDetail = $state(false);

	// Cache management
	let lastFetchTime = $state(Date.now());
	const CACHE_DURATION = 30000; // 30 seconds cache
	let isStale = $derived(() => Date.now() - lastFetchTime > CACHE_DURATION);

	// Pagination
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let totalPages = $derived(Math.ceil(data.destinations.length / itemsPerPage));
	let paginatedDestinations = $derived(() => {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return data.destinations.slice(start, end);
	});

	// Form data
	let formData = $state({
		city: '',
		country: '',
		imageUrl: ''
	});

	function openAddModal() {
		formData = { city: '', country: '', imageUrl: '' };
		imagePreview = '';
		selectedFile = null;
		showAddModal = true;
	}

	function openEditModal(destination: any) {
		selectedDestination = destination;
		formData = {
			city: destination.city,
			country: destination.country,
			imageUrl: destination.imageUrl || ''
		};
		imagePreview = destination.imageUrl || '';
		selectedFile = null;
		showEditModal = true;
	}

	function openDeleteModal(destination: any) {
		selectedDestination = destination;
		showDeleteModal = true;
	}

	function openDetailModal(destination: any) {
		selectedDestination = destination;
		showDetailModal = true;
	}

	async function resizeImage(file: File, maxSizeMB: number = 5): Promise<File> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (e) => {
				const img = new Image();
				img.src = e.target?.result as string;
				img.onload = () => {
					const canvas = document.createElement('canvas');
					let width = img.width;
					let height = img.height;

					// Calculate new dimensions while maintaining aspect ratio
					const maxWidth = 1920; // Max width for destinations
					const maxHeight = 1080; // Max height for destinations
					
					if (width > height) {
						if (width > maxWidth) {
							height = (height * maxWidth) / width;
							width = maxWidth;
						}
					} else {
						if (height > maxHeight) {
							width = (width * maxHeight) / height;
							height = maxHeight;
						}
					}

					canvas.width = width;
					canvas.height = height;

					const ctx = canvas.getContext('2d');
					if (!ctx) {
						reject(new Error('Failed to get canvas context'));
						return;
					}

					ctx.drawImage(img, 0, 0, width, height);

					// Start with high quality
					let quality = 0.9;
					
					const checkAndCompress = () => {
						canvas.toBlob(
							(blob) => {
								if (!blob) {
									reject(new Error('Failed to compress image'));
									return;
								}

								const sizeMB = blob.size / (1024 * 1024);
								console.log(`Image size: ${sizeMB.toFixed(2)}MB at quality ${quality}`);

								if (sizeMB > maxSizeMB && quality > 0.1) {
									// Reduce quality and try again
									quality -= 0.1;
									checkAndCompress();
								} else {
									// Create new file from blob
									const newFile = new File([blob], file.name, {
										type: 'image/jpeg',
										lastModified: Date.now()
									});
									resolve(newFile);
								}
							},
							'image/jpeg',
							quality
						);
					};

					checkAndCompress();
				};
				img.onerror = () => {
					reject(new Error('Failed to load image'));
				};
			};
			reader.onerror = () => {
				reject(new Error('Failed to read file'));
			};
		});
	}

	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			// Show loading state
			uploadingImage = true;
			
			// Resize image if needed
			const resizedFile = await resizeImage(file, 5); // 5MB max
			selectedFile = resizedFile;
			
			// Preview
			const reader = new FileReader();
			reader.onload = (e) => {
				imagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(resizedFile);
			
			uploadingImage = false;
		} catch (error) {
			console.error('Error processing image:', error);
			alert('Failed to process image. Please try a different image.');
			uploadingImage = false;
		}
	}

	async function uploadImage() {
		if (!selectedFile) return;

		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('type', 'destination');

		try {
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Upload failed');
			}

			const result = await response.json();
			console.log('Upload result:', result);
			return result.url;
		} catch (error) {
			console.error('Upload error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
			alert(`Upload error: ${errorMessage}`);
			return null;
		}
	}

	async function handleSubmit(mode: 'add' | 'edit') {
		saving = true;

		try {
			// Upload image if selected
			if (selectedFile) {
				const imageUrl = await uploadImage();
				if (imageUrl) {
					formData.imageUrl = imageUrl;
				} else {
					throw new Error('Failed to upload image');
				}
			}

			const endpoint = mode === 'add' 
				? '/api/destinations' 
				: `/api/destinations/${selectedDestination.id}`;
			
			const method = mode === 'add' ? 'POST' : 'PUT';

			const response = await fetch(endpoint, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save destination');
			}

			// Get the new/updated destination
			const savedDestination = await response.json();
			
			// Close modal immediately
			showAddModal = false;
			showEditModal = false;
			
			// Reset form
			formData = { city: '', country: '', imageUrl: '' };
			imagePreview = '';
			selectedFile = null;
			
			// Update the list optimistically
			if (mode === 'add') {
				data.destinations = [...data.destinations, savedDestination];
			} else {
				data.destinations = data.destinations.map(d => 
					d.id === savedDestination.id ? savedDestination : d
				);
			}
			
			// Update cache timestamp
			lastFetchTime = Date.now();
			
			// Reload data in background only if cache is stale
			if (isStale) {
				invalidateAll();
			}
		} catch (error) {
			console.error('Save error:', error);
			if (error instanceof Error && error.message.includes('already exists')) {
				alert(`${formData.city} 도시는 이미 등록되어 있습니다. 다른 도시명을 입력해주세요.`);
			} else {
				alert(error instanceof Error ? error.message : '여행지 저장에 실패했습니다.');
			}
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		try {
			const response = await fetch(`/api/destinations/${selectedDestination.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete destination');
			}

			// Update list optimistically
			data.destinations = data.destinations.filter(d => d.id !== selectedDestination.id);
			
			// Update cache timestamp
			lastFetchTime = Date.now();
			
			showDeleteModal = false;
			
			// Reload data in background only if cache is stale
			if (isStale) {
				invalidateAll();
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('Failed to delete destination');
		}
	}

	async function handleDetailImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !selectedDestination) return;

		uploadingFromDetail = true;
		
		try {
			// Upload the image
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'destination');

			const uploadResponse = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!uploadResponse.ok) {
				throw new Error('Failed to upload image');
			}

			const { url } = await uploadResponse.json();

			// Update the destination with the new image
			const updateResponse = await fetch(`/api/destinations/${selectedDestination.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					city: selectedDestination.city,
					country: selectedDestination.country,
					imageUrl: url
				})
			});

			if (!updateResponse.ok) {
				throw new Error('Failed to update destination');
			}

			// Refresh data and update selected destination
			await invalidateAll();
			const updatedDestination = data.destinations.find(d => d.id === selectedDestination.id);
			if (updatedDestination) {
				selectedDestination = updatedDestination;
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert(error instanceof Error ? error.message : 'Failed to upload image');
		} finally {
			uploadingFromDetail = false;
		}
	}
</script>

<div class="h-full flex flex-col overflow-hidden">
	<div class="px-8 pt-8 pb-4 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">여행지 관리</h1>
			<p class="mt-2 text-gray-600">여행지를 관리합니다</p>
		</div>
		<div class="flex items-center gap-4">
			<select
				bind:value={itemsPerPage}
				onchange={() => currentPage = 1}
				class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
			>
				<option value={10}>10개씩 보기</option>
				<option value={20}>20개씩 보기</option>
				<option value={50}>50개씩 보기</option>
			</select>
			<button
				onclick={() => {
					lastFetchTime = 0; // Force stale
					invalidateAll();
					lastFetchTime = Date.now();
				}}
				class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
				title="데이터 새로고침"
			>
				<RefreshCw class="h-4 w-4" />
			</button>
			<button
				onclick={openAddModal}
				class="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
			>
				<Plus class="h-5 w-5" />
				여행지 추가
			</button>
		</div>
	</div>

	<!-- Destinations Table -->
	<div class="flex-1 flex flex-col overflow-hidden mx-8 mb-8 rounded-lg bg-white shadow">
		<div class="flex-1 overflow-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50 sticky top-0 z-10">
					<tr>
						<th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
							도시
						</th>
						<th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
							국가
						</th>
						<th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
							이미지
						</th>
						<th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
							생성일
						</th>
						<th class="relative px-6 py-2 bg-gray-50">
							<span class="sr-only">작업</span>
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
				{#each paginatedDestinations() as destination}
					<tr 
						class="hover:bg-gray-50 cursor-pointer transition-colors"
						onclick={() => openDetailModal(destination)}
					>
						<td class="px-6 py-2 whitespace-nowrap">
							<div class="text-sm font-medium text-gray-900">{destination.city}</div>
						</td>
						<td class="px-6 py-2 whitespace-nowrap">
							<div class="text-sm text-gray-500">{destination.country}</div>
						</td>
						<td class="px-6 py-2 whitespace-nowrap">
							{#if destination.imageUrl}
								<div class="h-10 w-10 rounded overflow-hidden bg-gray-100">
									<img 
										src={destination.imageUrl} 
										alt={destination.city}
										class="h-full w-full object-cover"
									/>
								</div>
							{:else}
								<div class="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
							{/if}
						</td>
						<td class="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
							{new Date(destination.created_at).toLocaleDateString('ko-KR')}
						</td>
						<td class="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
							<button
								onclick={(e) => {
									e.stopPropagation();
									openEditModal(destination);
								}}
								class="text-indigo-600 hover:text-indigo-900 mr-4"
							>
								수정
							</button>
							<button
								onclick={(e) => {
									e.stopPropagation();
									openDeleteModal(destination);
								}}
								class="text-red-600 hover:text-red-900"
							>
								삭제
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="5" class="px-6 py-12 text-center">
							<p class="text-gray-500">등록된 여행지가 없습니다. 첫 번째 여행지를 추가해보세요!</p>
						</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</div>
		
		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2 sm:px-6">
				<div class="flex flex-1 justify-between sm:hidden">
					<button
						onclick={() => currentPage = Math.max(1, currentPage - 1)}
						disabled={currentPage === 1}
						class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						이전
					</button>
					<button
						onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
						disabled={currentPage === totalPages}
						class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						다음
					</button>
				</div>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div>
						<p class="text-sm text-gray-700">
							총 <span class="font-medium">{data.destinations.length}</span>개 중{' '}
							<span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
							<span class="font-medium">{Math.min(currentPage * itemsPerPage, data.destinations.length)}</span> 표시
						</p>
					</div>
					<div>
						<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
							<button
								onclick={() => currentPage = Math.max(1, currentPage - 1)}
								disabled={currentPage === 1}
								class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span class="sr-only">이전</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
								</svg>
							</button>
							
							{#each Array(totalPages) as _, i}
								{#if i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)}
									<button
										onclick={() => currentPage = i + 1}
										class={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
											currentPage === i + 1
												? 'z-10 bg-pink-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600'
												: 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
										}`}
									>
										{i + 1}
									</button>
								{:else if i + 1 === currentPage - 2 || i + 1 === currentPage + 2}
									<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>
								{/if}
							{/each}
							
							<button
								onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
								disabled={currentPage === totalPages}
								class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span class="sr-only">다음</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
								</svg>
							</button>
						</nav>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (showAddModal = false)}
	>
		<div 
			class="w-full max-w-md rounded-lg bg-white p-6"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">여행지 추가</h2>
				<button
					onclick={() => (showAddModal = false)}
					class="rounded-lg p-2 hover:bg-gray-100"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit('add'); }}>
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">도시</label>
						<input
							type="text"
							bind:value={formData.city}
							required
							class="w-full rounded-lg border px-3 py-2 focus:border-pink-500 focus:outline-none"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">국가</label>
						<input
							type="text"
							bind:value={formData.country}
							required
							class="w-full rounded-lg border px-3 py-2 focus:border-pink-500 focus:outline-none"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">이미지</label>
						{#if imagePreview}
							<div class="mb-2 rounded-lg bg-gray-100 p-2">
								<img src={imagePreview} alt="Preview" class="h-32 w-full rounded-lg object-contain" />
							</div>
						{:else}
							<button
								type="button"
								onclick={() => {
									const input = document.querySelector('#file-upload-' + (showAddModal ? 'add' : 'edit')) as HTMLInputElement;
									input?.click();
								}}
								class="mb-2 w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
							>
								<div class="text-center pointer-events-none">
									<Upload class="h-8 w-8 text-gray-400 mx-auto mb-1" />
									<p class="text-xs text-gray-500">이미지를 업로드하려면 클릭하세요</p>
								</div>
							</button>
							<input
								id={showAddModal ? 'file-upload-add' : 'file-upload-edit'}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handleImageUpload}
								class="sr-only"
							/>
						{/if}
						{#if imagePreview}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handleImageUpload}
								class="w-full rounded-lg border px-3 py-2"
							/>
						{/if}
					</div>
				</div>

				<div class="mt-6 flex gap-3">
					<button
						type="button"
						onclick={() => (showAddModal = false)}
						disabled={saving || uploadingImage}
						class="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={saving || uploadingImage}
						class="flex-1 rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if uploadingImage}
							이미지 처리 중...
						{:else if saving}
							저장 중...
						{:else}
							여행지 추가
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (showEditModal = false)}
	>
		<div 
			class="w-full max-w-md rounded-lg bg-white p-6"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">여행지 수정</h2>
				<button
					onclick={() => (showEditModal = false)}
					class="rounded-lg p-2 hover:bg-gray-100"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit('edit'); }}>
				<div class="space-y-4">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">도시</label>
						<input
							type="text"
							bind:value={formData.city}
							required
							class="w-full rounded-lg border px-3 py-2 focus:border-pink-500 focus:outline-none"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">국가</label>
						<input
							type="text"
							bind:value={formData.country}
							required
							class="w-full rounded-lg border px-3 py-2 focus:border-pink-500 focus:outline-none"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">이미지</label>
						{#if imagePreview}
							<div class="mb-2 rounded-lg bg-gray-100 p-2">
								<img src={imagePreview} alt="Preview" class="h-32 w-full rounded-lg object-contain" />
							</div>
						{:else}
							<button
								type="button"
								onclick={() => {
									const input = document.querySelector('#file-upload-' + (showAddModal ? 'add' : 'edit')) as HTMLInputElement;
									input?.click();
								}}
								class="mb-2 w-full h-32 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
							>
								<div class="text-center pointer-events-none">
									<Upload class="h-8 w-8 text-gray-400 mx-auto mb-1" />
									<p class="text-xs text-gray-500">이미지를 업로드하려면 클릭하세요</p>
								</div>
							</button>
							<input
								id={showAddModal ? 'file-upload-add' : 'file-upload-edit'}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handleImageUpload}
								class="sr-only"
							/>
						{/if}
						{#if imagePreview}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={handleImageUpload}
								class="w-full rounded-lg border px-3 py-2"
							/>
						{/if}
					</div>
				</div>

				<div class="mt-6 flex gap-3">
					<button
						type="button"
						onclick={() => (showEditModal = false)}
						disabled={saving || uploadingImage}
						class="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={saving || uploadingImage}
						class="flex-1 rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if uploadingImage}
							이미지 업로드 중...
						{:else if saving}
							업데이트 중...
						{:else}
							여행지 업데이트
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (showDeleteModal = false)}
	>
		<div 
			class="w-full max-w-md rounded-lg bg-white p-6"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="mb-4 text-xl font-semibold">여행지 삭제</h2>
			<p class="mb-6 text-gray-600">
				<strong>{selectedDestination?.city}</strong>를(를) 정말 삭제하시겠습니까? 이 작업은
				취소할 수 없습니다.
			</p>

			<div class="flex gap-3">
				<button
					onclick={() => (showDeleteModal = false)}
					class="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50"
				>
					취소
				</button>
				<button
					onclick={handleDelete}
					class="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					삭제
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Detail Modal -->
{#if showDetailModal && selectedDestination}
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
				<h2 class="text-xl font-semibold text-gray-900">여행지 상세 정보</h2>
				<button
					onclick={() => (showDetailModal = false)}
					class="rounded-lg p-2 hover:bg-gray-200"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Image Section -->
				{#if selectedDestination.imageUrl}
					<div class="mb-6 rounded-lg overflow-hidden bg-gray-100">
						<img
							src={selectedDestination.imageUrl}
							alt={selectedDestination.city}
							class="w-full h-64 object-contain"
						/>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => document.getElementById('detail-image-upload')?.click()}
						disabled={uploadingFromDetail}
						class="mb-6 w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<div class="text-center">
							{#if uploadingFromDetail}
								<div class="h-12 w-12 mx-auto mb-2 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
								<p class="text-gray-500">업로드 중...</p>
							{:else}
								<Upload class="h-12 w-12 text-gray-400 mx-auto mb-2 group-hover:text-gray-500" />
								<p class="text-gray-500 group-hover:text-gray-600">이미지를 업로드하려면 클릭하세요</p>
							{/if}
						</div>
					</button>
					<input
						id="detail-image-upload"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onchange={handleDetailImageUpload}
						class="sr-only"
					/>
				{/if}

				<!-- Info Section -->
				<div class="space-y-4">
					<div>
						<h3 class="text-2xl font-bold text-gray-900">{selectedDestination.city}</h3>
						<p class="text-lg text-gray-600">{selectedDestination.country}</p>
					</div>

					<div class="border-t pt-4 space-y-2">
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">생성일:</span>
							<span class="text-sm text-gray-900">
								{new Date(selectedDestination.created_at).toLocaleString('ko-KR')}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">수정일:</span>
							<span class="text-sm text-gray-900">
								{new Date(selectedDestination.updated_at).toLocaleString('ko-KR')}
							</span>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-6 flex gap-3">
					<button
						onclick={() => {
							showDetailModal = false;
							openEditModal(selectedDestination);
						}}
						class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
					>
						여행지 수정
					</button>
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