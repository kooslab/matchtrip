import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all destinations from database
		const allDestinations = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				country: destinations.country,
				imageUrl: destinations.imageUrl
			})
			.from(destinations)
			.orderBy(destinations.city);

		// Group destinations by region
		const groupedDestinations: Record<string, typeof allDestinations> = {
			'국내': [],
			'유럽': [],
			'아시아': [],
			'미주': [],
			'오세아니아': [],
			'기타': []
		};

		allDestinations.forEach((dest) => {
			if (dest.country === '대한민국' || dest.country === '한국') {
				groupedDestinations['국내'].push(dest);
			} else if (['프랑스', '영국', '스페인', '이탈리아', '독일', '네덜란드', '체코', '오스트리아', '헝가리', '포르투갈'].includes(dest.country)) {
				groupedDestinations['유럽'].push(dest);
			} else if (['일본', '중국', '태국', '베트남', '싱가포르', '인도네시아', '필리핀', '말레이시아', '인도'].includes(dest.country)) {
				groupedDestinations['아시아'].push(dest);
			} else if (['미국', '캐나다', '멕시코', '브라질'].includes(dest.country)) {
				groupedDestinations['미주'].push(dest);
			} else if (['호주', '뉴질랜드'].includes(dest.country)) {
				groupedDestinations['오세아니아'].push(dest);
			} else {
				groupedDestinations['기타'].push(dest);
			}
		});

		// Remove empty groups
		Object.keys(groupedDestinations).forEach(key => {
			if (groupedDestinations[key].length === 0) {
				delete groupedDestinations[key];
			}
		});

		console.log('groupedDestinations', groupedDestinations);

		return {
			destinations: groupedDestinations
		};
	} catch (error) {
		console.error('Error loading destinations:', error);
		return {
			destinations: {}
		};
	}
};