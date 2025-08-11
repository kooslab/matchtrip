<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronDown, ChevronUp, Search, Paperclip, X, Package } from 'lucide-svelte';
	import RichTextEditor from './RichTextEditor.svelte';
	import pdfImage from '$lib/images/pdf.png';

	interface Props {
		destinations: Record<string, {
			name: string;
			code: string;
			countries: Record<string, {
				name: string;
				code: string;
				destinations: Array<{
					id: number;
					city: string;
					imageUrl: string | null;
				}>;
			}>;
		}>;
		initialData?: {
			id?: string;
			title?: string;
			description?: string;
			price?: number;
			destinationId?: number;
			duration?: number;
			languages?: string[];
			fileIds?: string[];
			destinationCity?: string;
			countryName?: string;
			continentName?: string;
		};
		mode: 'create' | 'edit';
		onSubmit: (data: any) => Promise<void>;
		isSubmitting?: boolean;
	}

	const { destinations, initialData = {}, mode, onSubmit, isSubmitting = false }: Props = $props();

	// Form state
	let title = $state(initialData.title || '');
	let description = $state(initialData.description || '');
	let price = $state(initialData.price ? initialData.price.toString() : '');
	let selectedDestinationId = $state(initialData.destinationId || null);
	let duration = $state(initialData.duration ? initialData.duration.toString() : '');
	let selectedLanguages = $state<Set<string>>(new Set(initialData.languages || []));
	let fileIds = $state<string[]>(initialData.fileIds || []);
	
	// Log initial data for debugging
	if (mode === 'edit' && initialData.destinationId) {
		console.log('Edit mode - Initial destination data:', {
			destinationId: initialData.destinationId,
			destinationCity: initialData.destinationCity,
			countryName: initialData.countryName,
			continentName: initialData.continentName
		});
	}

	// UI state for destinations
	let searchQuery = $state('');
	let expandedContinents = $state<Set<string>>(new Set());
	let expandedCountries = $state<Set<string>>(new Set());
	let showDestinationSelection = $state(!selectedDestinationId);

	// File upload state
	interface UploadedFile {
		id: string;
		name: string;
		size: number;
		progress: number;
		url?: string;
	}
	let uploadedFiles = $state<UploadedFile[]>([]);
	let uploading = $state(false);
	let fileInputEl: HTMLInputElement;

	// Available languages
	const availableLanguages = [
		{ code: 'ko', name: '한국어' },
		{ code: 'en', name: 'English' },
		{ code: 'ja', name: '日本語' },
		{ code: 'zh', name: '中文' },
		{ code: 'es', name: 'Español' },
		{ code: 'fr', name: 'Français' },
		{ code: 'de', name: 'Deutsch' },
		{ code: 'pt', name: 'Português' },
		{ code: 'ru', name: 'Русский' },
		{ code: 'ar', name: 'العربية' }
	];

	// Format price with commas
	function formatPrice(value: string) {
		const digits = value.replace(/\D/g, '');
		return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	// Handle price input
	function handlePriceInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value.replace(/,/g, '');
		if (/^\d*$/.test(value)) {
			price = value;
			target.value = formatPrice(value);
		}
	}

	// Destination selection logic
	function toggleContinent(continentName: string) {
		if (expandedContinents.has(continentName)) {
			expandedContinents.delete(continentName);
			Object.keys(destinations[continentName]?.countries || {}).forEach(country => {
				expandedCountries.delete(`${continentName}-${country}`);
			});
		} else {
			expandedContinents.add(continentName);
		}
		expandedContinents = new Set(expandedContinents);
		expandedCountries = new Set(expandedCountries);
	}

	function toggleCountry(continentName: string, countryName: string) {
		const key = `${continentName}-${countryName}`;
		if (expandedCountries.has(key)) {
			expandedCountries.delete(key);
		} else {
			expandedCountries.add(key);
		}
		expandedCountries = new Set(expandedCountries);
	}

	// Filter destinations based on search
	let filteredDestinations = $derived(() => {
		if (!searchQuery.trim()) return destinations;
		
		const query = searchQuery.toLowerCase();
		const filtered: typeof destinations = {};
		
		Object.entries(destinations).forEach(([continentName, continent]) => {
			const filteredCountries: typeof continent.countries = {};
			
			Object.entries(continent.countries).forEach(([countryName, country]) => {
				const filteredDests = country.destinations.filter(dest => 
					dest.city.toLowerCase().includes(query) ||
					countryName.toLowerCase().includes(query) ||
					continentName.toLowerCase().includes(query)
				);
				
				if (filteredDests.length > 0) {
					filteredCountries[countryName] = {
						...country,
						destinations: filteredDests
					};
				}
			});
			
			if (Object.keys(filteredCountries).length > 0) {
				filtered[continentName] = {
					...continent,
					countries: filteredCountries
				};
			}
		});
		
		return filtered;
	});

	// Auto-expand when searching
	$effect(() => {
		if (searchQuery.trim()) {
			const continentsToExpand = new Set<string>();
			const countriesToExpand = new Set<string>();
			
			Object.entries(filteredDestinations()).forEach(([continentName, continent]) => {
				continentsToExpand.add(continentName);
				Object.keys(continent.countries).forEach(countryName => {
					countriesToExpand.add(`${continentName}-${countryName}`);
				});
			});
			
			expandedContinents = continentsToExpand;
			expandedCountries = countriesToExpand;
		} else if (!selectedDestinationId) {
			expandedContinents = new Set();
			expandedCountries = new Set();
		}
	});

	// Get selected destination details
	let selectedDestination = $derived(() => {
		if (!selectedDestinationId) return null;
		
		// If we're in edit mode and have initial destination data, use it
		if (mode === 'edit' && initialData.destinationId === selectedDestinationId && initialData.destinationCity) {
			console.log('Using initial data from edit mode');
			return {
				id: selectedDestinationId,
				city: initialData.destinationCity,
				country: initialData.countryName || '',
				continent: initialData.continentName || '',
				imageUrl: null
			};
		}
		
		// Otherwise, find it from the destinations list
		for (const continent of Object.values(destinations)) {
			for (const country of Object.values(continent.countries)) {
				const dest = country.destinations.find(d => d.id === selectedDestinationId);
				if (dest) {
					console.log('Found in destinations list:', dest);
					return { 
						id: dest.id,
						city: dest.city,
						country: country.name, 
						continent: continent.name,
						imageUrl: dest.imageUrl
					};
				}
			}
		}
		
		// If not found but we have initial data, use it as fallback
		if (selectedDestinationId && initialData.destinationCity) {
			console.log('Using fallback initial data');
			return {
				id: selectedDestinationId,
				city: initialData.destinationCity,
				country: initialData.countryName || '',
				continent: initialData.continentName || '',
				imageUrl: null
			};
		}
		
		console.log('No destination found');
		return null;
	});

	function selectDestination(destinationId: number) {
		selectedDestinationId = destinationId;
		showDestinationSelection = false;
		searchQuery = '';
	}

	// Language selection
	function toggleLanguage(langCode: string) {
		if (selectedLanguages.has(langCode)) {
			selectedLanguages.delete(langCode);
		} else {
			selectedLanguages.add(langCode);
		}
		selectedLanguages = new Set(selectedLanguages);
	}

	// File upload functions
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' bytes';
		else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
		else return Math.round(bytes / 1048576) + ' MB';
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		
		if (!files || files.length === 0) return;
		
		for (const file of Array.from(files)) {
			if (file.size > 5 * 1024 * 1024) {
				window.alert(`${file.name}은 5MB를 초과합니다.`);
				continue;
			}

			const fileId = crypto.randomUUID();
			const newFile: UploadedFile = {
				id: fileId,
				name: file.name,
				size: file.size,
				progress: 0
			};

			uploadedFiles = [...uploadedFiles, newFile];
			
			try {
				uploading = true;
				
				// Create FormData for file upload
				const formData = new FormData();
				formData.append('file', file);
				formData.append('folder', 'product_attachment');

				const response = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error('Upload failed');
				}

				const result = await response.json();
				
				// Update file with success
				uploadedFiles = uploadedFiles.map(f => 
					f.id === fileId ? { ...f, progress: 100, url: result.url } : f
				);
				
				fileIds = [...fileIds, result.fileId];

			} catch (error) {
				console.error('Upload error:', error);
				uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
				window.alert(`${file.name} 업로드에 실패했습니다.`);
			} finally {
				uploading = false;
			}
		}
		
		// Reset input
		input.value = '';
	}

	function removeFile(fileId: string, uploadFileId?: string) {
		uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
		if (uploadFileId) {
			fileIds = fileIds.filter(id => id !== uploadFileId);
		}
	}

	// Form validation and submission
	function validateForm(): string | null {
		if (!title.trim()) return '제목을 입력해주세요';
		if (!selectedDestinationId) return '목적지를 선택해주세요';
		if (!price || parseInt(price) <= 0) return '가격을 입력해주세요';
		if (!description.trim()) return '상품 설명을 입력해주세요';
		return null;
	}

	async function handleSubmit() {
		const validationError = validateForm();
		if (validationError) {
			window.alert(validationError);
			return;
		}

		const formData = {
			title: title.trim(),
			description: description.trim(),
			price: parseInt(price),
			destinationId: selectedDestinationId,
			duration: duration ? parseInt(duration) : null,
			languages: Array.from(selectedLanguages),
			fileIds
		};

		await onSubmit(formData);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<div class="p-4 space-y-6">
			<!-- Destination Selection -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">목적지</h3>
				
				{#if selectedDestinationId && !showDestinationSelection}
					<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div class="flex items-center justify-between">
							<div>
								{#if mode === 'edit' && initialData.destinationCity}
									<p class="text-lg font-semibold text-blue-900">{initialData.destinationCity}</p>
									<p class="text-sm text-gray-600">
										{initialData.countryName || ''}{initialData.countryName && initialData.continentName ? ', ' : ''}{initialData.continentName || ''}
									</p>
								{:else if selectedDestination}
									<p class="text-lg font-semibold text-blue-900">{selectedDestination.city}</p>
									<p class="text-sm text-gray-600">
										{selectedDestination.country}{selectedDestination.continent ? ', ' + selectedDestination.continent : ''}
									</p>
								{:else}
									<p class="text-lg font-semibold text-blue-900">목적지 선택됨</p>
									<p class="text-sm text-gray-600">ID: {selectedDestinationId}</p>
								{/if}
							</div>
							<button
								onclick={() => showDestinationSelection = true}
								class="text-blue-600 text-sm hover:underline"
							>
								변경
							</button>
						</div>
					</div>
				{:else}
					<div class="border rounded-lg">
						<div class="p-3">
							<div class="relative">
								<input
									type="text"
									bind:value={searchQuery}
									placeholder="어디로 가고 싶으신가요?"
									class="w-full rounded-full bg-gray-100 py-2 pl-4 pr-12 text-sm placeholder-gray-400 focus:bg-gray-100 focus:outline-none"
								/>
								<div class="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500">
									<Search class="h-4 w-4 text-white" />
								</div>
							</div>
						</div>
						
						<div class="max-h-60 overflow-y-auto">
							{#each Object.entries(filteredDestinations()) as [continentName, continent]}
								<div>
									<button
										onclick={() => toggleContinent(continentName)}
										class="flex w-full items-center justify-between px-4 py-3 text-left bg-gray-50 border-b border-gray-200"
									>
										<span class="text-sm font-medium text-gray-900">{continentName}</span>
										{#if expandedContinents.has(continentName)}
											<ChevronUp class="h-4 w-4 text-gray-400" />
										{:else}
											<ChevronDown class="h-4 w-4 text-gray-400" />
										{/if}
									</button>
									
									{#if expandedContinents.has(continentName)}
										{#each Object.entries(continent.countries) as [countryName, country]}
											<div>
												<button
													onclick={() => toggleCountry(continentName, countryName)}
													class="flex w-full items-center justify-between px-4 py-2 text-left border-b border-gray-100 hover:bg-gray-50"
												>
													<span class="text-sm text-gray-700 pl-4">{countryName}</span>
													{#if expandedCountries.has(`${continentName}-${countryName}`)}
														<ChevronUp class="h-3 w-3 text-gray-400" />
													{:else}
														<ChevronDown class="h-3 w-3 text-gray-400" />
													{/if}
												</button>
												
												{#if expandedCountries.has(`${continentName}-${countryName}`)}
													<div class="bg-gray-50">
														{#each country.destinations as destination}
															<button
																onclick={() => selectDestination(destination.id)}
																class="flex w-full items-center justify-between px-4 py-2 text-left border-b border-gray-100 {selectedDestinationId === destination.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}"
															>
																<span class="{selectedDestinationId === destination.id ? 'text-blue-600 font-medium' : 'text-gray-700'} pl-8">
																	{destination.city}
																</span>
																{#if selectedDestinationId === destination.id}
																	<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
																	</svg>
																{/if}
															</button>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Basic Information -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">기본 정보</h3>
				
				<!-- Title -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
					<input
						type="text"
						bind:value={title}
						placeholder="상품명을 입력해주세요"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
					/>
				</div>
				
				<!-- Price -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">1인당 가격</label>
					<div class="relative">
						<input
							type="text"
							inputmode="numeric"
							placeholder="가격을 입력해주세요"
							value={formatPrice(price)}
							oninput={handlePriceInput}
							class="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
						/>
						<span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
					</div>
				</div>
				
				<!-- Duration -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">소요시간 (시간)</label>
					<input
						type="number"
						bind:value={duration}
						placeholder="예: 3"
						min="1"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Description -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">상품 설명</h3>
				<RichTextEditor
					value={description}
					onchange={(content) => description = content}
					placeholder="상품에 대해 자세히 설명해주세요..."
					minHeight="200px"
					showImageButton={true}
					showHelperText={true}
				/>
			</div>

			<!-- Languages -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">가능 언어</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each availableLanguages as language}
						<button
							onclick={() => toggleLanguage(language.code)}
							class="p-2 text-sm border rounded-lg transition-colors {selectedLanguages.has(language.code) 
								? 'bg-blue-50 border-blue-500 text-blue-700' 
								: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
						>
							{language.name}
						</button>
					{/each}
				</div>
			</div>

			<!-- File Attachments -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">첨부파일</h3>
				
				<!-- Upload Button -->
				<button
					onclick={() => fileInputEl?.click()}
					disabled={uploading}
					class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
				>
					<div class="flex flex-col items-center gap-2">
						<Paperclip class="h-8 w-8 text-gray-400" />
						<span class="text-sm text-gray-600">
							{uploading ? '업로드 중...' : '파일을 선택하거나 드래그하여 업로드'}
						</span>
						<span class="text-xs text-gray-500">최대 5MB, PDF, JPG, JPEG, PNG, DOCX, PPTX, XLSX</span>
					</div>
				</button>
				
				<input
					bind:this={fileInputEl}
					type="file"
					multiple
					accept=".pdf,.jpg,.jpeg,.png,.docx,.pptx,.xlsx"
					onchange={handleFileSelect}
					class="hidden"
				/>
				
				<!-- Uploaded Files List -->
				{#if uploadedFiles.length > 0}
					<div class="space-y-2">
						{#each uploadedFiles as file}
							<div class="flex items-center gap-3 p-3 border rounded-lg">
								<div class="flex-shrink-0">
									{#if file.name.toLowerCase().endsWith('.pdf')}
										<img src={pdfImage} alt="PDF" class="w-8 h-8" />
									{:else}
										<Package class="w-8 h-8 text-gray-400" />
									{/if}
								</div>
								
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
									<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
									{#if file.progress < 100}
										<div class="w-full bg-gray-200 rounded-full h-1 mt-1">
											<div class="bg-blue-600 h-1 rounded-full transition-all" style="width: {file.progress}%"></div>
										</div>
									{/if}
								</div>
								
								<button
									onclick={() => removeFile(file.id, file.url)}
									class="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- Add padding at bottom to prevent content from being hidden by fixed button -->
			<div class="h-24"></div>
		</div>

		<!-- Submit Button - Fixed at bottom within mobile viewport -->
		<div class="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
			<div class="mx-auto max-w-[430px] p-4">
				<button
					onclick={handleSubmit}
					disabled={isSubmitting}
					class="w-full rounded-lg bg-blue-500 py-4 font-semibold text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					{isSubmitting ? '저장 중...' : mode === 'create' ? '상품 등록' : '수정 완료'}
				</button>
			</div>
		</div>
	</div>
</div>