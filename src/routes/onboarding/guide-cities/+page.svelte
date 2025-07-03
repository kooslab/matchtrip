<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ChevronLeft, Search, CheckCircle2, Circle } from 'lucide-svelte';

	// Cities data structure
	type City = {
		id: string;
		name: string;
		nameEn: string;
		country: string;
		countryEn: string;
	};

	type Country = {
		id: string;
		name: string;
		nameEn: string;
		cities: City[];
		isExpanded: boolean;
	};

	let countries = $state<Country[]>([
		{
			id: 'korea',
			name: '국내',
			nameEn: 'Korea',
			isExpanded: false,
			cities: [
				{ id: 'seoul', name: '서울', nameEn: 'Seoul', country: '국내', countryEn: 'Korea' },
				{ id: 'busan', name: '부산', nameEn: 'Busan', country: '국내', countryEn: 'Korea' },
				{ id: 'jeju', name: '제주', nameEn: 'Jeju', country: '국내', countryEn: 'Korea' },
				{ id: 'gangneung', name: '강릉', nameEn: 'Gangneung', country: '국내', countryEn: 'Korea' },
				{ id: 'gyeongju', name: '경주', nameEn: 'Gyeongju', country: '국내', countryEn: 'Korea' }
			]
		},
		{
			id: 'europe',
			name: '유럽',
			nameEn: 'Europe',
			isExpanded: false,
			cities: [
				{ id: 'paris', name: '파리', nameEn: 'Paris', country: '유럽', countryEn: 'Europe' },
				{ id: 'london', name: '런던', nameEn: 'London', country: '유럽', countryEn: 'Europe' },
				{ id: 'rome', name: '로마', nameEn: 'Rome', country: '유럽', countryEn: 'Europe' },
				{ id: 'barcelona', name: '바르셀로나', nameEn: 'Barcelona', country: '유럽', countryEn: 'Europe' },
				{ id: 'prague', name: '프라하', nameEn: 'Prague', country: '유럽', countryEn: 'Europe' },
				{ id: 'amsterdam', name: '암스테르담', nameEn: 'Amsterdam', country: '유럽', countryEn: 'Europe' },
				{ id: 'berlin', name: '베를린', nameEn: 'Berlin', country: '유럽', countryEn: 'Europe' },
				{ id: 'vienna', name: '비엔나', nameEn: 'Vienna', country: '유럽', countryEn: 'Europe' }
			]
		},
		{
			id: 'japan',
			name: '일본',
			nameEn: 'Japan',
			isExpanded: true,
			cities: [
				{ id: 'tokyo', name: '도쿄', nameEn: 'Tokyo', country: '일본', countryEn: 'Japan' },
				{ id: 'sapporo', name: '삿포로', nameEn: 'Sapporo', country: '일본', countryEn: 'Japan' },
				{ id: 'osaka', name: '오사카', nameEn: 'Osaka', country: '일본', countryEn: 'Japan' },
				{ id: 'fukuoka', name: '후쿠오카', nameEn: 'Fukuoka', country: '일본', countryEn: 'Japan' },
				{ id: 'okinawa', name: '오키나와', nameEn: 'Okinawa', country: '일본', countryEn: 'Japan' },
				{ id: 'nagoya', name: '나고야', nameEn: 'Nagoya', country: '일본', countryEn: 'Japan' },
				{ id: 'yokohama', name: '요코하마', nameEn: 'Yokohama', country: '일본', countryEn: 'Japan' }
			]
		},
		{
			id: 'america',
			name: '미주',
			nameEn: 'America',
			isExpanded: false,
			cities: [
				{ id: 'newyork', name: '뉴욕', nameEn: 'New York', country: '미주', countryEn: 'America' },
				{ id: 'losangeles', name: '로스앤젤레스', nameEn: 'Los Angeles', country: '미주', countryEn: 'America' },
				{ id: 'sanfrancisco', name: '샌프란시스코', nameEn: 'San Francisco', country: '미주', countryEn: 'America' },
				{ id: 'lasvegas', name: '라스베가스', nameEn: 'Las Vegas', country: '미주', countryEn: 'America' },
				{ id: 'vancouver', name: '밴쿠버', nameEn: 'Vancouver', country: '미주', countryEn: 'America' },
				{ id: 'toronto', name: '토론토', nameEn: 'Toronto', country: '미주', countryEn: 'America' },
				{ id: 'hawaii', name: '하와이', nameEn: 'Hawaii', country: '미주', countryEn: 'America' },
				{ id: 'cancun', name: '칸쿤', nameEn: 'Cancun', country: '미주', countryEn: 'America' }
			]
		},
		{
			id: 'australia',
			name: '호주',
			nameEn: 'Australia',
			isExpanded: false,
			cities: [
				{ id: 'sydney', name: '시드니', nameEn: 'Sydney', country: '호주', countryEn: 'Australia' },
				{ id: 'melbourne', name: '멜버른', nameEn: 'Melbourne', country: '호주', countryEn: 'Australia' },
				{ id: 'brisbane', name: '브리즈번', nameEn: 'Brisbane', country: '호주', countryEn: 'Australia' },
				{ id: 'goldcoast', name: '골드코스트', nameEn: 'Gold Coast', country: '호주', countryEn: 'Australia' },
				{ id: 'cairns', name: '케언즈', nameEn: 'Cairns', country: '호주', countryEn: 'Australia' },
				{ id: 'perth', name: '퍼스', nameEn: 'Perth', country: '호주', countryEn: 'Australia' }
			]
		},
		{
			id: 'thailand',
			name: '태국',
			nameEn: 'Thailand',
			isExpanded: false,
			cities: [
				{ id: 'bangkok', name: '방콕', nameEn: 'Bangkok', country: '태국', countryEn: 'Thailand' },
				{ id: 'phuket', name: '푸켓', nameEn: 'Phuket', country: '태국', countryEn: 'Thailand' },
				{ id: 'chiangmai', name: '치앙마이', nameEn: 'Chiang Mai', country: '태국', countryEn: 'Thailand' },
				{ id: 'pattaya', name: '파타야', nameEn: 'Pattaya', country: '태국', countryEn: 'Thailand' }
			]
		},
		{
			id: 'singapore',
			name: '싱가포르',
			nameEn: 'Singapore',
			isExpanded: false,
			cities: [
				{ id: 'singapore', name: '싱가포르', nameEn: 'Singapore', country: '싱가포르', countryEn: 'Singapore' }
			]
		},
		{
			id: 'indonesia',
			name: '인도네시아',
			nameEn: 'Indonesia',
			isExpanded: false,
			cities: [
				{ id: 'bali', name: '발리', nameEn: 'Bali', country: '인도네시아', countryEn: 'Indonesia' },
				{ id: 'jakarta', name: '자카르타', nameEn: 'Jakarta', country: '인도네시아', countryEn: 'Indonesia' }
			]
		},
		{
			id: 'taiwan',
			name: '대만',
			nameEn: 'Taiwan',
			isExpanded: false,
			cities: [
				{ id: 'taipei', name: '타이베이', nameEn: 'Taipei', country: '대만', countryEn: 'Taiwan' },
				{ id: 'kaohsiung', name: '가오슝', nameEn: 'Kaohsiung', country: '대만', countryEn: 'Taiwan' }
			]
		}
	]);

	let selectedCities = $state<Set<string>>(new Set(['sapporo', 'okinawa']));
	let searchQuery = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Load existing selected cities from the guide profile
	$effect(() => {
		if ($page.data.guideProfile?.activityAreas) {
			const existingCityIds = $page.data.guideProfile.activityAreas.map((city: City) => city.id);
			selectedCities = new Set(existingCityIds);
		}
	});

	// Filter cities based on search query
	const filteredCountries = $derived.by(() => {
		if (!searchQuery) return countries;

		return countries.map(country => ({
			...country,
			cities: country.cities.filter(city =>
				city.name.includes(searchQuery) ||
				city.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
				country.name.includes(searchQuery) ||
				country.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
			)
		})).filter(country => country.cities.length > 0);
	});

	function toggleCountry(countryId: string) {
		const country = countries.find(c => c.id === countryId);
		if (country) {
			country.isExpanded = !country.isExpanded;
		}
	}

	function toggleCity(cityId: string) {
		if (selectedCities.has(cityId)) {
			selectedCities.delete(cityId);
		} else {
			selectedCities.add(cityId);
		}
		selectedCities = new Set(selectedCities);
	}

	async function handleSubmit() {
		if (selectedCities.size === 0) {
			error = '최소 하나 이상의 지역을 선택해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Get the selected city objects
			const selectedCityData = countries
				.flatMap(country => country.cities)
				.filter(city => selectedCities.has(city.id));

			// Save guide areas to profile
			const response = await fetch('/api/profile/guide', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					activityAreas: selectedCityData.map(city => ({
						id: city.id,
						name: city.name,
						nameEn: city.nameEn,
						country: city.country,
						countryEn: city.countryEn
					}))
				})
			});

			if (!response.ok) {
				throw new Error('가이드 지역 저장에 실패했습니다.');
			}

			// Navigate to the guide cities summary page
			await goto('/onboarding/guide-cities-summary');
		} catch (err) {
			error = err instanceof Error ? err.message : '저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-white overflow-hidden rounded-[40px] shadow-[0px_8px_24px_0px_rgba(255,255,255,0.12)]">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-white/92 backdrop-blur-sm">
		<div class="h-14 px-4 py-2.5">
			<div class="flex items-center gap-3">
				<button
					onclick={() => history.back()}
					class="shrink-0"
				>
					<ChevronLeft class="h-6 w-6 text-[#052236]" />
				</button>
				<div class="flex-1">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="가능한 지역을 검색해 보세요"
							class="w-full rounded-[30px] border border-[rgba(0,62,129,0.01)] bg-white py-2 pl-5 pr-12 text-[13px] text-[#052236] placeholder-[#8ea0ac] focus:border-[#1095f4] focus:outline-none focus:ring-2 focus:ring-[#1095f4]/20"
						/>
						<div class="absolute right-2 top-1/2 -translate-y-1/2">
							<div class="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1095f4] shadow-[0px_12px_12px_0px_rgba(98,120,246,0.12)] relative overflow-hidden">
								<div class="absolute inset-0 bg-gradient-to-br from-[rgba(54,41,241,0)] to-[rgba(220,220,220,0.4)]"></div>
								<Search class="h-4 w-4 text-white relative z-10" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="px-4 py-3">
		{#each filteredCountries as country}
			<div class={country.id === 'korea' ? 'border-b border-[rgba(0,62,129,0.01)]' : 'border-b border-[#f7f9fa]'}>
				<!-- Country header -->
				<button
					onclick={() => toggleCountry(country.id)}
					class="flex w-full items-center justify-between py-4 text-left"
				>
					<div class="flex items-center gap-3">
						<span class="text-[16px] font-bold text-[#052236]">{country.name}</span>
						<span class="text-[14px] text-[#8ea0ac]">{country.nameEn}</span>
					</div>
					<div class="h-4 w-4 flex items-center justify-center">
						<div class={country.isExpanded ? 'rotate-90' : '-rotate-90'}>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M6.53033 3.46967C6.23744 3.17678 5.76256 3.17678 5.46967 3.46967C5.17678 3.76256 5.17678 4.23744 5.46967 4.53033L9.18934 8.25L5.46967 11.9697C5.17678 12.2626 5.17678 12.7374 5.46967 13.0303C5.76256 13.3232 6.23744 13.3232 6.53033 13.0303L10.7803 8.78033C11.0732 8.48744 11.0732 8.01256 10.7803 7.71967L6.53033 3.46967Z" fill="#8ea0ac"/>
							</svg>
						</div>
					</div>
				</button>

				<!-- Cities list -->
				{#if country.isExpanded}
					<div class="pb-3">
						{#each country.cities as city}
							<button
								onclick={() => toggleCity(city.id)}
								class="flex w-full items-center gap-3 border-b border-[#f7f9fa] py-2 text-left last:border-0"
							>
								{#if selectedCities.has(city.id)}
									<CheckCircle2 class="h-5 w-5 text-[#1095f4]" />
								{:else}
									<Circle class="h-5 w-5 text-[#8ea0ac]" />
								{/if}
								<div class="flex items-center gap-1 text-[13px]">
									<span class={selectedCities.has(city.id) ? 'font-medium text-[#1095f4]' : 'font-medium text-[#052236]'}>
										{city.name}
									</span>
									<span class={selectedCities.has(city.id) ? 'text-[#1095f4]' : 'text-[#052236]'}>,</span>
									<span class={selectedCities.has(city.id) ? 'text-[#1095f4]' : 'text-[#8ea0ac]'}>
										{city.nameEn}
									</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if error}
		<div class="px-4">
			<div class="rounded-lg border border-red-200 bg-red-50 p-3">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		</div>
	{/if}

	<!-- Bottom section with home indicator and button -->
	<div class="fixed bottom-0 left-0 right-0">
		<!-- Button container -->
		<div class="bg-[rgba(254,254,254,0.96)] backdrop-blur-sm rounded-t-[16px] px-4 py-2 border-t border-[#f1f1f1] shadow-[0px_-5px_20px_0px_rgba(0,0,0,0.02)]">
			<button
				onclick={handleSubmit}
				disabled={isLoading || selectedCities.size === 0}
				class="w-full rounded-[9px] py-3.5 font-semibold text-[14px] tracking-[0.14px] text-white transition-colors {selectedCities.size > 0
					? 'bg-[#1095f4] hover:bg-[#0d7ed4]'
					: 'cursor-not-allowed bg-gray-300'}"
			>
				{isLoading ? '저장 중...' : '추가하기'}
			</button>
		</div>
		
		<!-- Home indicator -->
		<div class="bg-[rgba(254,254,254,0.96)] h-[34px] relative">
			<div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
		</div>
	</div>
</div>