import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `데이투어 기준으로 일정표를 만들려고해.

새로운 입력문구와 더불어
아래와 같은 조건으로 여행일정표를 만들어줘.

- 현지 여행지명은 한국어,영어 표기법이 아니라, 현지에서 사용되는 언어표기법을 써주고 한국어로 지명을 알려줘. (예를들면 독일 베를린 Bundestag, 국회의사당)
- 여행지명의 간단한 유래를 20-30자내외로 설명해줘 (예를 들면, 브란덴브루크문은 18세기 평화의문으로 만들어진 곳입니다. 현재는 통일의문으로 불립니다.)
- 데이투어 내에서 이동시 도보 xx분, 대중교통 xx분으로 이동에 대한 자세한 내용을 알려줘.
- 마이리얼트립이나, 겟유어가이드 일정표를 참고해도 좋아.
- 맛집을 원할 경우, 구글에서 평점이 4.3이상 인곳을 추천해줘. 대략 점심시간이나 저녁일정이 있으면 센스있게 제안해줄래?

앞으로 모든 질문에는 위 조건에 맞게 제안해줘.`;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const openai = new OpenAI({
			apiKey: process.env.LLM_API_KEY
		});

		const { message, conversationHistory = [] } = await request.json();

		if (!message) {
			return json({ error: 'Message is required' }, { status: 400 });
		}

		const messages = [
			{ role: 'system', content: SYSTEM_PROMPT },
			...conversationHistory,
			{ role: 'user', content: message }
		];

		const completion = await openai.chat.completions.create({
			model: 'gpt-4-turbo-preview',
			messages: messages as any,
			temperature: 0.7,
			max_tokens: 2000
		});

		const response = completion.choices[0]?.message?.content || '';

		return json({
			response,
			usage: completion.usage
		});
	} catch (error) {
		console.error('AI Assistant Error:', error);
		return json({ error: 'Failed to generate itinerary' }, { status: 500 });
	}
};
