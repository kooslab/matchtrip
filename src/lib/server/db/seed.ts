import { db } from './index';
import { continents, countries, destinations } from './schema';

async function seed() {
	console.log('Seeding continents...');

	// Insert continents
	const [asia, europe, northAmerica, southAmerica, africa, oceania] = await db
		.insert(continents)
		.values([
			{ name: 'Asia', code: 'AS' },
			{ name: 'Europe', code: 'EU' },
			{ name: 'North America', code: 'NA' },
			{ name: 'South America', code: 'SA' },
			{ name: 'Africa', code: 'AF' },
			{ name: 'Oceania', code: 'OC' }
		])
		.returning();

	console.log('Seeding countries...');

	// Insert countries
	const countryData = await db
		.insert(countries)
		.values([
			// Asia
			{ name: '대한민국', code: 'KOR', continentId: asia.id },
			{ name: '일본', code: 'JPN', continentId: asia.id },
			{ name: '중국', code: 'CHN', continentId: asia.id },
			{ name: '태국', code: 'THA', continentId: asia.id },
			{ name: '베트남', code: 'VNM', continentId: asia.id },
			{ name: '싱가포르', code: 'SGP', continentId: asia.id },
			{ name: '인도네시아', code: 'IDN', continentId: asia.id },
			{ name: '필리핀', code: 'PHL', continentId: asia.id },
			{ name: '말레이시아', code: 'MYS', continentId: asia.id },
			{ name: '인도', code: 'IND', continentId: asia.id },

			// Europe
			{ name: '독일', code: 'DEU', continentId: europe.id },
			{ name: '프랑스', code: 'FRA', continentId: europe.id },
			{ name: '이탈리아', code: 'ITA', continentId: europe.id },
			{ name: '스페인', code: 'ESP', continentId: europe.id },
			{ name: '영국', code: 'GBR', continentId: europe.id },
			{ name: '네덜란드', code: 'NLD', continentId: europe.id },
			{ name: '체코', code: 'CZE', continentId: europe.id },
			{ name: '오스트리아', code: 'AUT', continentId: europe.id },
			{ name: '헝가리', code: 'HUN', continentId: europe.id },
			{ name: '포르투갈', code: 'PRT', continentId: europe.id },

			// North America
			{ name: '미국', code: 'USA', continentId: northAmerica.id },
			{ name: '캐나다', code: 'CAN', continentId: northAmerica.id },
			{ name: '멕시코', code: 'MEX', continentId: northAmerica.id },

			// South America
			{ name: '브라질', code: 'BRA', continentId: southAmerica.id },
			{ name: '아르헨티나', code: 'ARG', continentId: southAmerica.id },
			{ name: '칠레', code: 'CHL', continentId: southAmerica.id },

			// Oceania
			{ name: '호주', code: 'AUS', continentId: oceania.id },
			{ name: '뉴질랜드', code: 'NZL', continentId: oceania.id }
		])
		.returning();

	// Create a map of country names to IDs for easy lookup
	const countryMap: Record<string, number> = {};
	countryData.forEach((country) => {
		countryMap[country.name] = country.id;
	});

	console.log('Seeding destinations...');

	// Insert destinations
	await db.insert(destinations).values([
		// Korea
		{ city: '서울', countryId: countryMap['대한민국'] },
		{ city: '부산', countryId: countryMap['대한민국'] },
		{ city: '제주', countryId: countryMap['대한민국'] },
		{ city: '강릉', countryId: countryMap['대한민국'] },
		{ city: '경주', countryId: countryMap['대한민국'] },

		// Japan
		{ city: '도쿄', countryId: countryMap['일본'] },
		{ city: '오사카', countryId: countryMap['일본'] },
		{ city: '교토', countryId: countryMap['일본'] },
		{ city: '삿포로', countryId: countryMap['일본'] },
		{ city: '후쿠오카', countryId: countryMap['일본'] },
		{ city: '오키나와', countryId: countryMap['일본'] },

		// Germany
		{ city: '베를린', countryId: countryMap['독일'] },
		{ city: '뮌헨', countryId: countryMap['독일'] },
		{ city: '함부르크', countryId: countryMap['독일'] },
		{ city: '프랑크푸르트', countryId: countryMap['독일'] },

		// France
		{ city: '파리', countryId: countryMap['프랑스'] },
		{ city: '니스', countryId: countryMap['프랑스'] },
		{ city: '마르세유', countryId: countryMap['프랑스'] },
		{ city: '리옹', countryId: countryMap['프랑스'] },

		// Italy
		{ city: '로마', countryId: countryMap['이탈리아'] },
		{ city: '밀라노', countryId: countryMap['이탈리아'] },
		{ city: '베네치아', countryId: countryMap['이탈리아'] },
		{ city: '피렌체', countryId: countryMap['이탈리아'] },
		{ city: '나폴리', countryId: countryMap['이탈리아'] },

		// Spain
		{ city: '바르셀로나', countryId: countryMap['스페인'] },
		{ city: '마드리드', countryId: countryMap['스페인'] },
		{ city: '세비야', countryId: countryMap['스페인'] },
		{ city: '발렌시아', countryId: countryMap['스페인'] },

		// UK
		{ city: '런던', countryId: countryMap['영국'] },
		{ city: '맨체스터', countryId: countryMap['영국'] },
		{ city: '에든버러', countryId: countryMap['영국'] },

		// Netherlands
		{ city: '암스테르담', countryId: countryMap['네덜란드'] },
		{ city: '로테르담', countryId: countryMap['네덜란드'] },

		// Czech Republic
		{ city: '프라하', countryId: countryMap['체코'] },
		{ city: '브르노', countryId: countryMap['체코'] },

		// USA
		{ city: '뉴욕', countryId: countryMap['미국'] },
		{ city: '로스앤젤레스', countryId: countryMap['미국'] },
		{ city: '샌프란시스코', countryId: countryMap['미국'] },
		{ city: '라스베가스', countryId: countryMap['미국'] },
		{ city: '하와이', countryId: countryMap['미국'] },
		{ city: '시카고', countryId: countryMap['미국'] },
		{ city: '보스턴', countryId: countryMap['미국'] },

		// Canada
		{ city: '밴쿠버', countryId: countryMap['캐나다'] },
		{ city: '토론토', countryId: countryMap['캐나다'] },
		{ city: '몬트리올', countryId: countryMap['캐나다'] },

		// Australia
		{ city: '시드니', countryId: countryMap['호주'] },
		{ city: '멜버른', countryId: countryMap['호주'] },
		{ city: '브리즈번', countryId: countryMap['호주'] },
		{ city: '골드코스트', countryId: countryMap['호주'] },

		// Thailand
		{ city: '방콕', countryId: countryMap['태국'] },
		{ city: '푸켓', countryId: countryMap['태국'] },
		{ city: '치앙마이', countryId: countryMap['태국'] },

		// Vietnam
		{ city: '하노이', countryId: countryMap['베트남'] },
		{ city: '호치민', countryId: countryMap['베트남'] },
		{ city: '다낭', countryId: countryMap['베트남'] },

		// Singapore
		{ city: '싱가포르', countryId: countryMap['싱가포르'] }
	]);

	console.log('Seeding completed successfully!');
}

seed()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
