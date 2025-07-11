<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';

	// Get data from store
	let storeData = $state({ name: '', phone: '', nickname: '', frequentArea: '', birthDate: '', profileImageUrl: '' });
	
	onMount(() => {
		const unsubscribe = onboardingStore.subscribe(data => {
			storeData = data;
			// If no data in store, redirect back
			if (!data.name || !data.phone || !data.nickname) {
				goto('/onboarding/guide');
			}
		});
		
		return unsubscribe;
	});

	// Available destinations by region
	const destinationRegions = [
		{
			name: '유럽',
			nameEn: 'Europe',
			cities: [
				{ name: '파리', nameEn: 'Paris' },
				{ name: '런던', nameEn: 'London' },
				{ name: '베를린', nameEn: 'Berlin' },
				{ name: '로마', nameEn: 'Rome' },
				{ name: '바르셀로나', nameEn: 'Barcelona' },
				{ name: '암스테르담', nameEn: 'Amsterdam' },
				{ name: '프라하', nameEn: 'Prague' },
				{ name: '비엔나', nameEn: 'Vienna' },
				{ name: '취리히', nameEn: 'Zurich' },
				{ name: '뮌헨', nameEn: 'Munich' }
			]
		},
		{
			name: '한국',
			nameEn: 'Korea',
			cities: [
				{ name: '서울', nameEn: 'Seoul' },
				{ name: '부산', nameEn: 'Busan' },
				{ name: '제주도', nameEn: 'Jeju' },
				{ name: '경주', nameEn: 'Gyeongju' },
				{ name: '강릉', nameEn: 'Gangneung' },
				{ name: '전주', nameEn: 'Jeonju' },
				{ name: '인천', nameEn: 'Incheon' },
				{ name: '대구', nameEn: 'Daegu' },
				{ name: '광주', nameEn: 'Gwangju' },
				{ name: '대전', nameEn: 'Daejeon' }
			]
		}
	];

	let expandedRegions = $state<string[]>(['유럽']); // Start with Europe expanded
	let selectedDestinations = $state<string[]>([]);
	let isLoading = $state(false);

	// Toggle region expansion
	function toggleRegion(regionName: string) {
		if (expandedRegions.includes(regionName)) {
			expandedRegions = expandedRegions.filter(r => r !== regionName);
		} else {
			expandedRegions = [...expandedRegions, regionName];
		}
	}

	// Toggle destination selection
	function toggleDestination(destination: string) {
		if (selectedDestinations.includes(destination)) {
			selectedDestinations = selectedDestinations.filter((d) => d !== destination);
		} else {
			selectedDestinations = [...selectedDestinations, destination];
		}
	}

	// Validation
	function canProceed(): boolean {
		return selectedDestinations.length > 0;
	}

	// Handle next
	async function handleNext() {
		if (!canProceed()) return;

		isLoading = true;

		try {
			// Store destinations in store
			onboardingStore.setData({
				destinations: selectedDestinations
			});

			// Navigate to documents page
			await goto('/onboarding/guide/documents');
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle back
	function handleBack() {
		goto('/onboarding/guide/profile');
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (canProceed() && !isLoading) {
				handleNext();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<style>
	.container {
		min-height: 100vh;
		background-color: #ffffff;
		position: relative;
		overflow: hidden;
	}

	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(10px);
		height: 56px;
		border-bottom: 2px solid rgba(0, 62, 129, 0.08);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		padding: 0 16px;
		position: relative;
	}

	.back-button {
		width: 24px;
		height: 24px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background-color: rgba(0, 62, 129, 0.08);
	}

	.progress-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 66%;
		height: 2px;
		background-color: #1095f4;
		transition: width 0.3s ease;
	}

	.content {
		padding: 24px 16px 120px;
	}

	.title-section {
		margin-bottom: 40px;
	}

	.title {
		font-family: 'Pretendard', sans-serif;
		font-weight: 700;
		font-size: 22px;
		line-height: 32px;
		color: #052236;
		margin-bottom: 8px;
	}

	.subtitle {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #8ea0ac;
	}

	.destinations-section {
		margin-bottom: 40px;
	}

	.region-item {
		margin-bottom: 8px;
		border-radius: 9px;
		overflow: hidden;
		border: 1px solid rgba(0, 62, 129, 0.08);
	}

	.region-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background-color: #ffffff;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.region-header:hover {
		background-color: rgba(0, 62, 129, 0.02);
	}

	.region-name {
		font-family: 'Pretendard', sans-serif;
		font-weight: 600;
		font-size: 15px;
		line-height: 24px;
		color: #052236;
	}

	.region-name-en {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #8ea0ac;
		margin-left: 8px;
	}

	.expand-icon {
		width: 20px;
		height: 20px;
		color: #8ea0ac;
		transition: transform 0.2s ease;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	.cities-list {
		background-color: rgba(0, 62, 129, 0.02);
		border-top: 1px solid rgba(0, 62, 129, 0.08);
	}

	.city-item {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid rgba(0, 62, 129, 0.04);
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.city-item:last-child {
		border-bottom: none;
	}

	.city-item:hover {
		background-color: rgba(16, 149, 244, 0.04);
	}

	.city-checkbox {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(0, 62, 129, 0.16);
		border-radius: 50%;
		margin-right: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.city-checkbox.selected {
		border-color: #1095f4;
		background-color: #1095f4;
	}

	.city-checkbox svg {
		width: 12px;
		height: 12px;
		color: #ffffff;
	}

	.city-name {
		font-family: 'Pretendard', sans-serif;
		font-weight: 500;
		font-size: 15px;
		line-height: 24px;
		color: #052236;
	}

	.city-name-en {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #8ea0ac;
		margin-left: 8px;
	}

	.search-container {
		position: relative;
		margin-bottom: 24px;
	}

	.search-input {
		width: 100%;
		height: 48px;
		background-color: rgba(0, 62, 129, 0.02);
		border: 1px solid rgba(0, 62, 129, 0.08);
		border-radius: 9px;
		padding: 14px 48px 14px 20px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 15px;
		line-height: 24px;
		color: #052236;
		outline: none;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		border-color: #1095f4;
		background-color: rgba(16, 149, 244, 0.04);
	}

	.search-input::placeholder {
		color: #8ea0ac;
	}

	.search-icon {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		width: 20px;
		height: 20px;
		color: #1095f4;
	}

	.bottom-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(254, 254, 254, 0.96);
		backdrop-filter: blur(10px);
		border-top: 1px solid #f1f1f1;
		box-shadow: 0px -5px 20px rgba(0, 0, 0, 0.02);
	}

	.bottom-content {
		padding: 8px 16px;
		padding-bottom: calc(8px + env(safe-area-inset-bottom));
	}

	.next-button {
		width: 100%;
		height: 48px;
		background-color: #8ea0ac;
		border: none;
		border-radius: 9px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 20px;
		color: #ffffff;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.next-button:enabled {
		background-color: #1095f4;
	}

	.next-button:disabled {
		cursor: not-allowed;
	}
</style>

<div class="container">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<button class="back-button" onclick={handleBack}>
				<img src={iconArrowBack} alt="뒤로가기" />
			</button>
			<div class="progress-bar">
				<div class="progress-fill"></div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="content">
		<!-- Title -->
		<div class="title-section">
			<h1 class="title">가이드 지역</h1>
			<p class="subtitle">가이드 가능한 지역을 선택해주세요</p>
		</div>

		<!-- Search -->
		<div class="search-container">
			<input
				type="text"
				class="search-input"
				placeholder="가능한 지역을 검색해 보세요"
			/>
			<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
			</svg>
		</div>

		<!-- Destinations Selection -->
		<div class="destinations-section">
			{#each destinationRegions as region}
				<div class="region-item">
					<div class="region-header" onclick={() => toggleRegion(region.name)}>
						<div>
							<span class="region-name">{region.name}</span>
							<span class="region-name-en">{region.nameEn}</span>
						</div>
						<svg class="expand-icon {expandedRegions.includes(region.name) ? 'expanded' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
						</svg>
					</div>
					
					{#if expandedRegions.includes(region.name)}
						<div class="cities-list">
							{#each region.cities as city}
								<div class="city-item" onclick={() => toggleDestination(city.name)}>
									<div class="city-checkbox {selectedDestinations.includes(city.name) ? 'selected' : ''}">
										{#if selectedDestinations.includes(city.name)}
											<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7" />
											</svg>
										{/if}
									</div>
									<div>
										<span class="city-name">{city.name}</span>
										<span class="city-name-en">{city.nameEn}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="bottom-section">
		<div class="bottom-content">
			<button 
				class="next-button" 
				disabled={!canProceed() || isLoading}
				onclick={handleNext}
			>
				{isLoading ? '처리중...' : '다 음'}
			</button>
		</div>
	</div>
</div>