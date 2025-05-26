import { db } from './index';
import { destinations } from './schema';

async function seed() {
	await db.insert(destinations).values([
		{ city: '베를린', country: '독일' },
		{ city: '뮌헨', country: '독일' },
		{ city: '함부르크', country: '독일' },
		{ city: '파리', country: '프랑스' },
		{ city: '니스', country: '프랑스' },
		{ city: '마르세유', country: '프랑스' },
		{ city: '프라하', country: '체코' },
		{ city: '브르노', country: '체코' },
		{ city: '로마', country: '이탈리아' },
		{ city: '밀라노', country: '이탈리아' },
		{ city: '베네치아', country: '이탈리아' },
		{ city: '피렌체', country: '이탈리아' },
		{ city: '바르셀로나', country: '스페인' },
		{ city: '마드리드', country: '스페인' },
		{ city: '세비야', country: '스페인' },
		{ city: '암스테르담', country: '네덜란드' },
		{ city: '로테르담', country: '네덜란드' },
		{ city: '런던', country: '영국' },
		{ city: '맨체스터', country: '영국' },
		{ city: '에든버러', country: '영국' }
	]);
	console.log('Seeded destinations!');
}

seed()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
